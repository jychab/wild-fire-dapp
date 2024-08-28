import { useCreateActionConfig as createActionConfig } from '@/utils/actions/actions-config';
import {
  LONG_STALE_TIME,
  MEDIUM_STALE_TIME,
  SHORT_STALE_TIME,
} from '@/utils/consts';
import { isInterstitial, SOLANA_ACTION_PREFIX } from '@/utils/helper/blinks';
import { proxify } from '@/utils/helper/endpoints';
import {
  ActionsJsonConfig,
  ActionsRegistry,
  ActionsRegistryConfig,
  LookupType,
  ObserverOptions,
  RegisteredEntity,
} from '@/utils/types/blinks';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useQuery } from '@tanstack/react-query';
import { Action } from '../actions/action';

export function useGetBlinkAction({
  actionUrl,
  publicKey,
  options,
  enabled,
}: {
  actionUrl: string | null;
  publicKey: PublicKey | null;
  options?: Partial<ObserverOptions>;
  enabled: boolean;
}) {
  const { signTransaction } = useWallet();
  const { connection } = useConnection();
  return useQuery({
    queryKey: ['get-blink-action', { actionUrl, options }],
    queryFn: () => {
      const config = createActionConfig({
        connection,
        publicKey,
        walletSignTransaction: signTransaction,
      });
      if (!actionUrl || !config || !options) return null;
      return Action.fetch(actionUrl, config, options.supportStrategy);
    },
    enabled: enabled,
    staleTime: SHORT_STALE_TIME,
  });
}

export function useGetBlinkActionJsonUrl({
  actionUrl,
  enabled,
}: {
  actionUrl: URL | undefined;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ['get-blink-action-json-url', { actionUrl }],
    queryFn: async () => {
      const origin = actionUrl?.origin;
      const actionsJsonUrl = origin + '/actions.json';
      try {
        const res = await fetch(proxify(actionsJsonUrl));
        const actionsJson = (await res.json()) as ActionsJsonConfig;
        const actionUrlMapper = new ActionsURLMapper(actionsJson);
        return actionUrlMapper.mapUrl(actionUrl!);
      } catch (_) {
        console.error(
          `Failed to lookup action for Origin: ${origin}/actions.json`
        );
        return null;
      }
    },
    enabled: enabled,
    staleTime: LONG_STALE_TIME,
  });
}

export function getActionRegistryLookUp({
  url,
  type,
  actionsRegistry,
}: {
  url: string | URL;
  type: LookupType;
  actionsRegistry: ActionsRegistry;
}) {
  if (type === 'action') {
    return lookupAction(url, actionsRegistry);
  }

  if (type === 'website') {
    return lookupWebsite(url, actionsRegistry);
  }

  if (type === 'interstitial') {
    return lookupInterstitial(url, actionsRegistry);
  }
}

function lookupAction(
  url: string | URL,
  actionRegistry: ActionsRegistry
): RegisteredEntity | null {
  try {
    const urlObj = new URL(url);
    const host = urlObj.host;
    return actionRegistry.actionsByHost[host] ?? null;
  } catch (e) {
    console.error(`Failed to lookup action for URL: ${url}`, e);
    return null;
  }
}

function lookupWebsite(
  url: string | URL,
  actionRegistry: ActionsRegistry
): RegisteredEntity | null {
  try {
    const urlObj = new URL(url);
    const host = urlObj.host;
    return actionRegistry.websitesByHost[host] ?? null;
  } catch (e) {
    console.error(`Failed to lookup website for URL: ${url}`, e);
    return null;
  }
}

function lookupInterstitial(
  url: string | URL,
  actionRegistry: ActionsRegistry
): RegisteredEntity | null {
  try {
    const urlObj = new URL(url);
    const host = urlObj.host;
    return actionRegistry.interstitialsByHost[host] ?? null;
  } catch (e) {
    console.error(`Failed to lookup interstitial for URL: ${url}`, e);
    return null;
  }
}

export function useGetActionRegistry({ registryUrl }: { registryUrl: string }) {
  return useQuery({
    queryKey: ['get-action-registry', { registryUrl }],
    queryFn: async () => {
      const actionRegistry = {
        actionsByHost: {},
        websitesByHost: {},
        interstitialsByHost: {},
      };
      try {
        const response = await fetch(proxify(registryUrl));
        let config;
        if (!response.ok) {
          console.error(
            'Failed to fetch actions registry config',
            await response.json()
          );
          config = { actions: [], interstitials: [], websites: [] };
        }
        config = (await response.json()) as ActionsRegistryConfig;

        config.actions.push({ host: 'api.blinksfeed.com', state: 'trusted' });
        config.websites.push({ host: 'blinksfeed.com', state: 'trusted' });

        actionRegistry.actionsByHost = Object.fromEntries(
          config.actions.map((action) => [action.host, action])
        );
        actionRegistry.websitesByHost = Object.fromEntries(
          config.websites.map((website) => [website.host, website])
        );

        actionRegistry.interstitialsByHost = Object.fromEntries(
          config.interstitials.map((interstitial) => [
            interstitial.host,
            interstitial,
          ])
        );
        return actionRegistry;
      } catch (e) {
        console.error('Failed to fetch actions registry config', e);
        return actionRegistry;
      }
    },
    staleTime: MEDIUM_STALE_TIME,
  });
}

class ActionsURLMapper {
  private config: ActionsJsonConfig;

  constructor(config: ActionsJsonConfig) {
    this.config = config;
  }

  public mapUrl(url: string | URL): string | null {
    // Ensure the input is a URL object
    const urlObj = typeof url === 'string' ? new URL(url) : url;
    const queryParams = urlObj.search; // Extract the query parameters from the URL

    for (const action of this.config.rules) {
      // Handle direct mapping without wildcards
      if (this.isExactMatch(action.pathPattern, urlObj)) {
        return `${action.apiPath}${queryParams}`;
      }
      // Match the pattern with the URL
      const match = this.matchPattern(action.pathPattern, urlObj);

      if (match) {
        // Construct the mapped URL if there's a match
        return this.constructMappedUrl(
          action.apiPath,
          match,
          queryParams,
          urlObj.origin
        );
      }
    }

    // If no match is found, return null
    return null;
  }

  // Helper method to check for exact match
  private isExactMatch(pattern: string, urlObj: URL): boolean {
    return pattern === `${urlObj.origin}${urlObj.pathname}`;
  }

  // Helper method to match the URL with the pattern
  private matchPattern(pattern: string, urlObj: URL): RegExpMatchArray | null {
    const fullPattern = new RegExp(
      `^${pattern.replace(/\*\*/g, '(.*)').replace(/\/(\*)/g, '/([^/]+)')}$`
    );

    const urlToMatch = pattern.startsWith('http')
      ? urlObj.toString()
      : urlObj.pathname;

    console.log(fullPattern);
    console.log(urlToMatch);
    return urlToMatch.match(fullPattern);
  }

  // Helper method to construct the mapped URL
  private constructMappedUrl(
    apiPath: string,
    match: RegExpMatchArray,
    queryParams: string,
    origin: string
  ): string {
    let mappedPath = apiPath;
    match.slice(1).forEach((group) => {
      mappedPath = mappedPath.replace(/\*+/, group);
    });

    if (apiPath.startsWith('http')) {
      const mappedUrl = new URL(mappedPath);
      return `${mappedUrl.origin}${mappedUrl.pathname}${queryParams}`;
    }

    return `${origin}${mappedPath}${queryParams}`;
  }
}

export async function unfurlUrlToActionApiUrl(
  actionUrl: URL | string
): Promise<string | null> {
  const url = new URL(actionUrl);
  const strUrl = actionUrl.toString();
  // case 1: if the URL is a solana action URL
  if (SOLANA_ACTION_PREFIX.test(strUrl)) {
    return strUrl.replace(SOLANA_ACTION_PREFIX, '');
  }

  // case 2: if the URL is an interstitial URL
  const interstitialData = isInterstitial(url);
  if (interstitialData.isInterstitial) {
    return interstitialData.decodedActionUrl;
  }

  // case 3: if the URL is a website URL which has action.json

  const actionsJsonUrl = url.origin + '/actions.json';
  const actionsJson = await fetch(proxify(actionsJsonUrl)).then(
    (res) => res.json() as Promise<ActionsJsonConfig>
  );

  const actionsUrlMapper = new ActionsURLMapper(actionsJson);

  return actionsUrlMapper.mapUrl(url);
}

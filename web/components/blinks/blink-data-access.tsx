import {
  LONG_STALE_TIME,
  MEDIUM_STALE_TIME,
  SHORT_STALE_TIME,
} from '@/utils/consts';
import { proxify } from '@/utils/helper/proxy';
import {
  ActionsJsonConfig,
  ActionsRegistry,
  ActionsRegistryConfig,
  LookupType,
  RegisteredEntity,
} from '@/utils/types/blinks';
import { useQuery } from '@tanstack/react-query';
import { Action, ActionsURLMapper } from '../../utils/helper/blinks';

export function useGetBlinkAction({
  actionUrl,
  enabled,
}: {
  actionUrl: string | null;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ['get-blink-action', { actionUrl }],
    queryFn: () => {
      if (!actionUrl) return null;
      return Action.fetch(actionUrl);
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

export function useGetActionRegistryLookUp({
  url,
  type,
  actionsRegistry,
  enabled = true,
}: {
  url: string | URL | null | undefined;
  type: LookupType;
  actionsRegistry: ActionsRegistry | undefined;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ['get-blink-lookup-url', { url, type, actionsRegistry }],
    queryFn: () => {
      if (!url || !actionsRegistry) return null;
      if (type === 'action') {
        return lookupAction(url, actionsRegistry);
      }

      if (type === 'website') {
        return lookupWebsite(url, actionsRegistry);
      }

      if (type === 'interstitial') {
        return lookupInterstitial(url, actionsRegistry);
      }
    },
    enabled: enabled,
    staleTime: LONG_STALE_TIME,
  });
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

        config.actions.push({ host: 'api.hashfeed.social', state: 'trusted' });
        config.websites.push({ host: 'hashfeed.social', state: 'trusted' });

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

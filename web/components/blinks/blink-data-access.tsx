import { useQuery } from '@tanstack/react-query';
import { Action } from './actions';
import {
  ActionsJsonConfig,
  ActionsRegistry,
  ActionsRegistryConfig,
  ActionsURLMapper,
  LookupType,
  RegisteredEntity,
} from './utils';

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
      if (!actionUrl) return;
      return Action.fetch(actionUrl);
    },
    enabled: enabled,
  });
}

export function useGetBlinkActionJsonUrl({
  origin,
  enabled,
}: {
  origin: string;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ['get-blink-action-json-url', { origin }],
    queryFn: async () => {
      const actionsJsonUrl = origin + '/actions.json';
      try {
        const res = await fetch(actionsJsonUrl);
        const actionsJson = (await res.json()) as ActionsJsonConfig;
        return new ActionsURLMapper(actionsJson);
      } catch (_) {
        console.error(
          `Failed to lookup action for Origin: ${origin}/actions.json`
        );
        return null;
      }
    },
    enabled: enabled,
  });
}

export function useGetActionRegistryLookUp({
  url,
  type,
  actionsRegistry,
  enabled = true,
}: {
  url: string | URL | null;
  type: LookupType;
  actionsRegistry: ActionsRegistry | undefined;
  enabled: boolean;
}) {
  return useQuery({
    queryKey: ['get-blink-lookup-url', { url, type }],
    queryFn: () => {
      if (!url || !actionsRegistry) return;
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
        const response = await fetch(registryUrl);
        let config;
        if (!response.ok) {
          console.error(
            'Failed to fetch actions registry config',
            await response.json()
          );
          config = { actions: [], interstitials: [], websites: [] };
        }
        config = (await response.json()) as ActionsRegistryConfig;

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
    staleTime: 1000 * 60 * 10,
  });
}

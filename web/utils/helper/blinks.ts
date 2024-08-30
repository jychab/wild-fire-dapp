import {
  ActionsJsonConfig,
  ActionStateWithOrigin,
  ExtendedActionState,
  IsInterstitialResult,
  NormalizedObserverOptions,
  NormalizedSecurityLevel,
  ObserverOptions,
  ObserverSecurityLevel,
  SecurityLevel,
} from '@/utils/types/blinks';
import { ActionPostResponse } from '@solana/actions-spec';
import { defaultActionSupportStrategy } from '../actions/actions-supportability';
import { proxify } from './endpoints';

export const SOLANA_ACTION_PREFIX = /^(solana-action:|solana:)/;

export function isInterstitial(url: string | URL): IsInterstitialResult {
  try {
    const urlObj = new URL(url);

    const actionUrl = urlObj.searchParams.get('action');
    if (!actionUrl) {
      return { isInterstitial: false };
    }
    const urlDecodedActionUrl = decodeURIComponent(actionUrl);

    if (!SOLANA_ACTION_PREFIX.test(urlDecodedActionUrl)) {
      return { isInterstitial: false };
    }

    const decodedActionUrl = urlDecodedActionUrl.replace(
      SOLANA_ACTION_PREFIX,
      ''
    );

    // Validate the decoded action URL
    const decodedActionUrlObj = new URL(decodedActionUrl);

    return {
      isInterstitial: true,
      decodedActionUrl: decodedActionUrlObj.toString(),
    };
  } catch (e) {
    console.error(`Failed to check if URL is interstitial: ${url}`, e);
    return { isInterstitial: false };
  }
}

export const checkSecurity = (
  state: ExtendedActionState,
  securityLevel: SecurityLevel
): boolean => {
  switch (securityLevel) {
    case 'only-trusted':
      return state === 'trusted';
    case 'non-malicious':
      return state !== 'malicious';
    case 'all':
      return true;
  }
};

export const DEFAULT_OPTIONS: ObserverOptions = {
  securityLevel: 'only-trusted',
  supportStrategy: defaultActionSupportStrategy,
};

export const normalizeOptions = (
  options: Partial<ObserverOptions>
): NormalizedObserverOptions => {
  return {
    ...DEFAULT_OPTIONS,
    ...options,
    securityLevel: (() => {
      if (!options.securityLevel) {
        return {
          websites: DEFAULT_OPTIONS.securityLevel as ObserverSecurityLevel,
          interstitials: DEFAULT_OPTIONS.securityLevel as ObserverSecurityLevel,
          actions: DEFAULT_OPTIONS.securityLevel as ObserverSecurityLevel,
        };
      }

      if (typeof options.securityLevel === 'string') {
        return {
          websites: options.securityLevel,
          interstitials: options.securityLevel,
          actions: options.securityLevel,
        };
      }

      return options.securityLevel;
    })(),
  };
};

export const mergeActionStates = (
  ...states: ExtendedActionState[]
): ExtendedActionState => {
  if (states.includes('malicious')) {
    return 'malicious';
  }
  if (states.includes('unknown')) {
    return 'unknown';
  }
  return 'trusted';
};

export const checkSecurityFromActionState = (
  state: ActionStateWithOrigin,
  normalizedSecurityLevel: NormalizedSecurityLevel
): boolean => {
  return checkSecurity(state.action, normalizedSecurityLevel.actions) &&
    state.origin
    ? checkSecurity(state.origin, normalizedSecurityLevel[state.originType])
    : true;
};

export const isUrlSameOrigin = (origin: string, url: string): boolean => {
  if (!url.startsWith('http')) {
    return true;
  }
  const urlObj = new URL(url);

  return urlObj.origin === origin;
};

export const isSignTransactionError = (
  data: { signature: string } | { error: string }
): data is { error: string } => !!(data as any).error;

export const isPostRequestError = (
  data: ActionPostResponse | { error: string }
): data is { error: string } => !!(data as any).error;
export class ActionsURLMapper {
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

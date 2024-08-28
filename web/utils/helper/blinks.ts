import {
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

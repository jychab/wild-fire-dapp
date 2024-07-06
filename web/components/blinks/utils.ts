import { ActionComponent } from './actions';
import { ActionStateWithOrigin } from './blinks-ui';

// GET
export interface SolanaPaySpecGetResponse {
  label: string;
  icon: string;
}

// POST
export interface SolanaPaySpecPostRequestBody {
  account: string; // transaction signer public key
}

export const ACTIONS_REGISTRY_URL_ALL =
  'https://actions-registry.dialectapi.to/all';

// Linked action inspired by HAL https://datatracker.ietf.org/doc/html/draft-kelly-json-hal-11
export interface LinkedAction {
  href: string; // solana pay/actions get/post url
  label: string; // button text
  // optional parameters for the action, e.g. input fields, inspired by OpenAPI
  // enforcing single parameter for now for simplicity and determenistic client UIs
  // can be extended to multiple inputs w/o breaking change by switching to Parameter[]
  // note: there are no use-cases for multiple parameters atm, e.g. farcaster frames also have just single input
  parameters?: Parameter[];
}

export interface Parameter {
  name: string; // parameter name in url
  label?: string; // input placeholder
  required?: boolean; // input required
}

export interface SolanaPaySpecPostResponse {
  transaction: string; // base64-encoded serialized transaction
  message?: string; // the nature of the transaction response e.g. the name of an item being purchased
  redirect?: string; // redirect URL after the transaction is successful
}

export interface ActionsSpecGetResponse extends SolanaPaySpecGetResponse {
  icon: string; // image
  label: string; // button text
  title: string;
  description: string;
  disabled?: boolean; // allows to model invalid state of the action e.g. nft sold out
  links?: {
    // linked actions inspired by HAL https://datatracker.ietf.org/doc/html/draft-kelly-json-hal-11
    actions: LinkedAction[];
  };
  // optional error indication for non-fatal errors, if present client should display it to the user
  // doesn't prevent client from interpreting the action or displaying it to the user
  // e.g. can be used together with 'disabled' to display the reason: business constraints, authorization
  error?: ActionError;
}

// No changes
export interface ActionsSpecPostRequestBody
  extends SolanaPaySpecPostRequestBody {}

// Almost no changes, omitting old `redirect`
export interface ActionsSpecPostResponse
  extends Omit<SolanaPaySpecPostResponse, 'redirect'> {}

export interface ActionError {
  message: string;
}

export interface RegisteredEntity {
  host: string;
  state: 'trusted' | 'malicious';
}

export interface ActionsRegistry {
  actionsByHost: Record<string, RegisteredEntity>;
  websitesByHost: Record<string, RegisteredEntity>;
  interstitialsByHost: Record<string, RegisteredEntity>;
}

export type LookupType = 'action' | 'website' | 'interstitial';

export interface ActionsRegistryConfig {
  actions: RegisteredEntity[];
  websites: RegisteredEntity[];
  interstitials: RegisteredEntity[];
}

const solanaActionPrefix = /^(solana-action:|solana:)/;

export type Source = 'websites' | 'interstitials' | 'actions';

export type IsInterstitialResult =
  | {
      isInterstitial: true;
      decodedActionUrl: string;
    }
  | {
      isInterstitial: false;
    };

export function isInterstitial(url: string | URL): IsInterstitialResult {
  try {
    const urlObj = new URL(url);

    const actionUrl = urlObj.searchParams.get('action');
    if (!actionUrl) {
      return { isInterstitial: false };
    }
    const urlDecodedActionUrl = decodeURIComponent(actionUrl);

    if (!solanaActionPrefix.test(urlDecodedActionUrl)) {
      return { isInterstitial: false };
    }

    const decodedActionUrl = urlDecodedActionUrl.replace(
      solanaActionPrefix,
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

export type SecurityLevel = 'only-trusted' | 'non-malicious' | 'all';

export type ExtendedActionState = RegisteredEntity['state'] | 'unknown';

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

type Action = {
  pathPattern: string;
  apiPath: string;
};

export type ActionsJsonConfig = {
  rules: Action[];
};

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

type ObserverSecurityLevel = SecurityLevel;

export interface ObserverOptions {
  // trusted > unknown > malicious
  securityLevel:
    | ObserverSecurityLevel
    | Record<'websites' | 'interstitials' | 'actions', ObserverSecurityLevel>;
}

interface NormalizedObserverOptions {
  securityLevel: Record<
    'websites' | 'interstitials' | 'actions',
    ObserverSecurityLevel
  >;
}

const DEFAULT_OPTIONS: ObserverOptions = {
  securityLevel: 'only-trusted',
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

export type NormalizedSecurityLevel = Record<Source, SecurityLevel>;

export const checkSecurityFromActionState = (
  state: ActionStateWithOrigin,
  normalizedSecurityLevel: NormalizedSecurityLevel
): boolean => {
  return checkSecurity(state.action, normalizedSecurityLevel.actions) &&
    state.origin
    ? checkSecurity(state.origin, normalizedSecurityLevel[state.originType])
    : true;
};
export enum ExecutionType {
  INITIATE = 'INITIATE',
  FINISH = 'FINISH',
  FAIL = 'FAIL',
  RESET = 'RESET',
  SOFT_RESET = 'SOFT_RESET',
  UNBLOCK = 'UNBLOCK',
  BLOCK = 'BLOCK',
}
export interface ExecutionState {
  status: ExecutionStatus;
  executingAction?: ActionComponent | null;
  errorMessage?: string | null;
  successMessage?: string | null;
}
export type ExecutionStatus =
  | 'blocked'
  | 'idle'
  | 'executing'
  | 'success'
  | 'error';

type ActionValue =
  | {
      type: ExecutionType.INITIATE;
      executingAction: ActionComponent;
      errorMessage?: string;
    }
  | {
      type: ExecutionType.FINISH;
      successMessage?: string | null;
    }
  | {
      type: ExecutionType.FAIL;
      errorMessage: string;
    }
  | {
      type: ExecutionType.RESET;
    }
  | {
      type: ExecutionType.UNBLOCK;
    }
  | {
      type: ExecutionType.BLOCK;
    }
  | {
      type: ExecutionType.SOFT_RESET;
      errorMessage?: string;
    };
export const SOFT_LIMIT_BUTTONS = 10;
export const SOFT_LIMIT_INPUTS = 3;
export const SOFT_LIMIT_FORM_INPUTS = 10;

export const executionReducer = (
  state: ExecutionState,
  action: ActionValue
): ExecutionState => {
  switch (action.type) {
    case ExecutionType.INITIATE:
      return { status: 'executing', executingAction: action.executingAction };
    case ExecutionType.FINISH:
      return {
        ...state,
        status: 'success',
        successMessage: action.successMessage,
        errorMessage: null,
      };
    case ExecutionType.FAIL:
      return {
        ...state,
        status: 'error',
        errorMessage: action.errorMessage,
        successMessage: null,
      };
    case ExecutionType.RESET:
      return {
        status: 'idle',
      };
    case ExecutionType.SOFT_RESET:
      return {
        ...state,
        status: 'idle',
        errorMessage: action.errorMessage,
        successMessage: null,
      };
    case ExecutionType.BLOCK:
      return {
        status: 'blocked',
      };
    case ExecutionType.UNBLOCK:
      return {
        status: 'idle',
      };
  }
};

export const isSignTransactionError = (
  data: { signature: string } | { error: string }
): data is { error: string } => !!(data as any).error;

export const isPostRequestError = (
  data: ActionsSpecPostResponse | { error: string }
): data is { error: string } => !!(data as any).error;

import { ExecutionType } from '../enums/blinks';
import { ActionComponent } from '../helper/blinks';

export interface SolanaPaySpecGetResponse {
  label: string;
  icon: string;
}

export interface SolanaPaySpecPostRequestBody {
  account: string; // transaction signer public key
}

export const ACTIONS_REGISTRY_URL_ALL =
  'https://actions-registry.dialectapi.to/all';
// Linked action inspired by HAL https://datatracker.ietf.org/doc/html/draft-kelly-json-hal-11
export const SOFT_LIMIT_BUTTONS = 10;
export const SOFT_LIMIT_INPUTS = 3;
export const SOFT_LIMIT_FORM_INPUTS = 10;

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
export type Source = 'websites' | 'interstitials' | 'actions';

export type IsInterstitialResult =
  | {
      isInterstitial: true;
      decodedActionUrl: string;
    }
  | {
      isInterstitial: false;
    };
export type ObserverSecurityLevel = SecurityLevel;

export interface ObserverOptions {
  // trusted > unknown > malicious
  securityLevel:
    | ObserverSecurityLevel
    | Record<'websites' | 'interstitials' | 'actions', ObserverSecurityLevel>;
}
export interface NormalizedObserverOptions {
  securityLevel: Record<
    'websites' | 'interstitials' | 'actions',
    ObserverSecurityLevel
  >;
}
export type NormalizedSecurityLevel = Record<Source, SecurityLevel>;
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
export type ActionValue =
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

export type SecurityLevel = 'only-trusted' | 'non-malicious' | 'all';

export type ExtendedActionState = RegisteredEntity['state'] | 'unknown';
type Action = {
  pathPattern: string;
  apiPath: string;
};

export type ActionsJsonConfig = {
  rules: Action[];
};
export type ActionStateWithOrigin =
  | {
      action: ExtendedActionState;
      origin?: never;
    }
  | {
      action: ExtendedActionState;
      origin: ExtendedActionState;
      originType: Source;
    };

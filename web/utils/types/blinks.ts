import { AbstractActionComponent } from '@/components/actions/abstract-action-component';
import { Action } from '@/components/actions/action';
import { ActionSupportStrategy } from '../actions/actions-supportability';
import { DisclaimerType, ExecutionType } from '../enums/blinks';
import { PostContent } from './post';

export const ACTIONS_REGISTRY_URL_ALL =
  'https://actions-registry.dialectapi.to/all';
// Linked action inspired by HAL https://datatracker.ietf.org/doc/html/draft-kelly-json-hal-11
export const SOFT_LIMIT_BUTTONS = 10;
export const SOFT_LIMIT_INPUTS = 3;
export const SOFT_LIMIT_FORM_INPUTS = 10;

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

export type SecurityLevel = 'only-trusted' | 'non-malicious' | 'all';

export type ObserverSecurityLevel = SecurityLevel;

export interface ObserverOptions {
  // trusted > unknown > malicious
  securityLevel:
    | ObserverSecurityLevel
    | Record<'websites' | 'interstitials' | 'actions', ObserverSecurityLevel>;
  supportStrategy: ActionSupportStrategy;
}
export interface NormalizedObserverOptions {
  securityLevel: Record<
    'websites' | 'interstitials' | 'actions',
    ObserverSecurityLevel
  >;
  supportStrategy: ActionSupportStrategy;
}
export type NormalizedSecurityLevel = Record<Source, SecurityLevel>;

export interface ExecutionState {
  status: ExecutionStatus;
  checkingSupportability?: boolean;
  executingAction?: AbstractActionComponent | null;
  errorMessage?: string | null;
  successMessage?: string | null;
}
export type ExecutionStatus =
  | 'blocked'
  | 'checking-supportability'
  | 'idle'
  | 'executing'
  | 'success'
  | 'error';

export type ActionValue =
  | {
      type: ExecutionType.CHECK_SUPPORTABILITY;
    }
  | {
      type: ExecutionType.INITIATE;
      executingAction: AbstractActionComponent;
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

export type ExtendedActionState = RegisteredEntity['state'] | 'unknown';

export interface ActionCallbacksConfig {
  onActionMount: (
    action: Action,
    originalUrl: string,
    type: 'trusted' | 'malicious' | 'unknown'
  ) => void;
}

export type ActionsJsonConfig = {
  rules: {
    pathPattern: string;
    apiPath: string;
  }[];
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

export type ActionSupportability =
  | {
      isSupported: true;
    }
  | {
      isSupported: false;
      message: string;
    };
export type ActionChainMetadata =
  | {
      isChained: true;
      isInline: boolean;
    }
  | {
      isChained: false;
    };

export interface LiveData {
  enabled: boolean;
  delayMs?: number;
}

export interface ExperimentalFeatures {
  liveData?: LiveData;
}
export interface DialectExperimentalFeatures {
  dialectExperimental?: {
    liveData?: {
      enabled: boolean;
      delayMs?: number; // default 1000 (1s)
    };
  };
}

export type ExtendedActionGetResponse = PostContent &
  DialectExperimentalFeatures;

export type Disclaimer =
  | {
      type: DisclaimerType.BLOCKED;
      ignorable: boolean;
      hidden: boolean;
      onSkip: () => void;
    }
  | {
      type: DisclaimerType.UNKNOWN;
      ignorable: boolean;
    };

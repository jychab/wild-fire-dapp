import { ExecutionType } from '@/utils/enums/blinks';
import {
  ActionError,
  ActionStateWithOrigin,
  ActionValue,
  ActionsJsonConfig,
  ActionsSpecPostRequestBody,
  ActionsSpecPostResponse,
  ExecutionState,
  ExtendedActionState,
  IsInterstitialResult,
  NormalizedObserverOptions,
  NormalizedSecurityLevel,
  ObserverOptions,
  ObserverSecurityLevel,
  Parameter,
  SecurityLevel,
} from '@/utils/types/blinks';
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from '@solana/web3.js';
import { Dispatch } from 'react';
import { PostContent } from '../types/post';
import { proxify } from './proxy';

const solanaActionPrefix = /^(solana-action:|solana:)/;

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

export const checkSecurityFromActionState = (
  state: ActionStateWithOrigin,
  normalizedSecurityLevel: NormalizedSecurityLevel
): boolean => {
  return checkSecurity(state.action, normalizedSecurityLevel.actions) &&
    state.origin
    ? checkSecurity(state.origin, normalizedSecurityLevel[state.originType])
    : true;
};
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

export const execute = async (
  connection: Connection,
  overallActionState: ActionStateWithOrigin,
  payer: PublicKey | null,
  signTransaction:
    | (<T extends VersionedTransaction | Transaction>(
        transaction: T
      ) => Promise<T>)
    | undefined,
  component: ActionComponent,
  normalizedSecurityLevel: NormalizedSecurityLevel,
  dispatchExecution: Dispatch<ActionValue>,
  params?: Record<string, string>
) => {
  if (component.parameters && params) {
    Object.entries(params).forEach(([name, value]) =>
      component.setValue(value, name)
    );
  }

  const newIsPassingSecurityCheck =
    overallActionState &&
    checkSecurityFromActionState(overallActionState, normalizedSecurityLevel);

  // if action state has changed or origin's state has changed, and it doesn't pass the security check or became malicious, block the action
  if (!newIsPassingSecurityCheck) {
    dispatchExecution({
      type: ExecutionType.BLOCK,
    });
    return;
  }

  dispatchExecution({
    type: ExecutionType.INITIATE,
    executingAction: component,
  });

  try {
    if (!payer || !signTransaction) {
      dispatchExecution({
        type: ExecutionType.RESET,
      });
      return;
    }

    const tx = await component.post(payer.toBase58()).catch((e: Error) => {
      return { error: e.message };
    });

    if (isPostRequestError(tx)) {
      dispatchExecution({
        type: ExecutionType.SOFT_RESET,
        errorMessage: tx.error,
      });
      return;
    }

    const transaction = VersionedTransaction.deserialize(
      Buffer.from(tx.transaction, 'base64')
    );
    const signedTx = await signTransaction(transaction);

    const txId = await connection.sendTransaction(signedTx, {
      skipPreflight: true,
      maxRetries: 0,
    });

    if (!txId || isSignTransactionError({ signature: txId })) {
      dispatchExecution({
        type: ExecutionType.RESET,
      });
    } else {
      const blockHash = await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        {
          signature: txId,
          blockhash: blockHash.blockhash,
          lastValidBlockHeight: blockHash.lastValidBlockHeight,
        },
        'confirmed'
      );
      dispatchExecution({
        type: ExecutionType.FINISH,
        successMessage: tx.message,
      });
    }
  } catch (e) {
    dispatchExecution({
      type: ExecutionType.FAIL,
      errorMessage: (e as Error).message ?? 'Unknown error',
    });
  }
};
export class Action {
  private readonly _actions: ActionComponent[];

  private constructor(
    private readonly _url: string,
    private readonly _data: PostContent
  ) {
    // if no links present, fallback to original solana pay spec
    if (!_data.links?.actions) {
      this._actions = [new ActionComponent(this, _data.label, _url)];
      return;
    }

    const urlObj = new URL(_url);
    this._actions = _data.links.actions.map((action) => {
      const href = action.href.startsWith('http')
        ? action.href
        : urlObj.origin + action.href;

      return new ActionComponent(this, action.label, href, action.parameters);
    });
  }

  public get data() {
    return this._data;
  }

  public get url() {
    return this._url;
  }

  public get icon() {
    return this._data.icon;
  }

  public get title() {
    return this._data.title;
  }

  public get description() {
    return this._data.description;
  }

  public get disabled() {
    return this._data.disabled ?? false;
  }

  public get actions() {
    return this._actions;
  }

  public get error() {
    return this._data.error?.message ?? null;
  }

  public resetActions() {
    this._actions.forEach((action) => action.reset());
  }

  static async fetch(apiUrl: string) {
    try {
      const response = await fetch(proxify(apiUrl), {
        headers: {
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
        console.error(
          `Failed to fetch action ${apiUrl}, action url: ${apiUrl}`
        );
        return null;
      }
      const data = (await response.json()) as PostContent;
      return new Action(apiUrl, data);
    } catch (e) {
      console.error(`Failed to fetch action ${apiUrl}, action url: ${apiUrl}`);
      return null;
    }
  }
}

export class ActionComponent {
  private parameterValue: Record<string, string> = {};

  constructor(
    private _parent: Action,
    private _label: string,
    private _href: string,
    private _parameters?: Parameter[]
  ) {}

  public get href() {
    // input with a button
    if (this.parameters.length === 1) {
      return this._href.replace(
        `{${this.parameter.name}}`,
        encodeURIComponent(
          this.parameterValue[this.parameter.name]?.trim() ?? ''
        )
      );
    }

    // form
    if (this.parameters.length > 1) {
      return this.parameters.reduce((href, param) => {
        return href.replace(
          `{${param.name}}`,
          encodeURIComponent(this.parameterValue[param.name]?.trim() ?? '')
        );
      }, this._href);
    }

    // button
    return this._href;
  }

  public get parent() {
    return this._parent;
  }

  public get label() {
    return this._label;
  }

  // initial version uses only one parameter, so using the first one
  public get parameter() {
    const [param] = this.parameters;

    return param;
  }

  public get parameters() {
    return this._parameters ?? [];
  }

  public reset() {
    this.parameterValue = {};
  }

  public setValue(value: string, name?: string) {
    if (!this.parameter) {
      return;
    }

    this.parameterValue[name ?? this.parameter.name] = value;
  }

  public async post(account: string) {
    const response = await fetch(proxify(this.href), {
      method: 'POST',
      body: JSON.stringify({ account } as ActionsSpecPostRequestBody),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = (await response.json()) as ActionError;
      console.error(
        `Failed to execute action ${this.href}, href ${this.href}, reason: ${error.message}`
      );

      throw {
        message: error.message,
      } as ActionError;
    }

    return (await response.json()) as ActionsSpecPostResponse;
  }
}

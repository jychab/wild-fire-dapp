import { ActionContext } from '@/utils/actions/actions-config';
import { ActionSupportability } from '@/utils/actions/actions-supportability';
import { DisclaimerType, ExecutionType } from '@/utils/enums/blinks';
import {
  checkSecurityFromActionState,
  isInterstitial,
  isPostRequestError,
  isSignTransactionError,
  mergeActionStates,
} from '@/utils/helper/blinks';
import { generatePostSubscribeApiEndPoint } from '@/utils/helper/endpoints';
import {
  ActionCallbacksConfig,
  ActionsRegistry,
  ActionStateWithOrigin,
  ActionValue,
  Disclaimer,
  ExecutionState,
  ExecutionStatus,
  ExtendedActionState,
  NormalizedSecurityLevel,
  SOFT_LIMIT_BUTTONS,
  SOFT_LIMIT_FORM_INPUTS,
  SOFT_LIMIT_INPUTS,
  Source,
} from '@/utils/types/blinks';
import { PostBlinksDetail } from '@/utils/types/post';
import { ActionPostResponse } from '@solana/actions-spec';
import { useWallet } from '@solana/wallet-adapter-react';
import { FC, useEffect, useMemo, useReducer, useState } from 'react';
import { AbstractActionComponent } from '../actions/abstract-action-component';
import { Action } from '../actions/action';
import { ButtonActionComponent } from '../actions/button-action-component';
import { FormActionComponent } from '../actions/form-action-component';
import { isParameterSelectable, isPatternAllowed } from '../actions/guards';
import { MultiValueActionComponent } from '../actions/multivalue-action-coponent';
import { SingleValueActionComponent } from '../actions/single-action-value-component';
import { useGetTokenAccountFromAddress } from '../profile/profile-data-access';
import { getActionRegistryLookUp } from './blink-data-access';
import { ActionLayout } from './blinks-layout';

interface ActionContainerProps {
  actionsRegistry: ActionsRegistry | undefined;
  action: Action | undefined | null;
  websiteUrl?: string | null | undefined;
  websiteText?: string | null | undefined;
  normalizedSecurityLevel: NormalizedSecurityLevel;
  callbacks?: Partial<ActionCallbacksConfig>;
  blinksDetail?: PostBlinksDetail;
  editable: boolean;
  multiGrid: boolean;
  expandAll: boolean;
  hideComment: boolean;
  hideUserPanel: boolean;
  showMintDetails: boolean;
  hideCaption: boolean;
  hideCarousel: boolean;
  hideBorder: boolean;
}

export const ActionContainer: FC<ActionContainerProps> = ({
  actionsRegistry,
  action: initialAction,
  websiteText,
  websiteUrl,
  normalizedSecurityLevel,
  callbacks,
  blinksDetail,
  editable,
  multiGrid,
  expandAll,
  hideComment,
  showMintDetails,
  hideUserPanel,
  hideBorder,
  hideCarousel,
  hideCaption,
}) => {
  const [action, setAction] = useState<Action | undefined | null>(
    initialAction
  );

  const [actionState, setActionState] = useState(
    getOverallActionState(action, websiteUrl, actionsRegistry)
  );

  const [executionState, dispatchExecution] = useReducer(executionReducer, {
    status: 'checking-supportability',
  });
  const { publicKey } = useWallet();
  const { data: tokenAccounts } = useGetTokenAccountFromAddress({
    address: publicKey,
  });

  const [supportability, setSupportability] = useState<ActionSupportability>({
    isSupported: true,
  });

  const overallState = useMemo(
    () =>
      actionState &&
      mergeActionStates(
        ...([actionState.action, actionState.origin].filter(
          Boolean
        ) as ExtendedActionState[])
      ),
    [actionState]
  );

  // adding ui check as well, to make sure, that on runtime registry lookups, we are not allowing the action to be executed
  const isPassingSecurityCheck =
    actionState &&
    checkSecurityFromActionState(actionState, normalizedSecurityLevel);

  useEffect(() => {
    if (!!action && (action === initialAction || action.isChained)) {
      return;
    }

    setAction(initialAction);
    setActionState(
      getOverallActionState(initialAction, websiteUrl, actionsRegistry)
    );
    dispatchExecution({ type: ExecutionType.CHECK_SUPPORTABILITY });
    // we want to run this one when initialAction or websiteUrl changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAction, websiteUrl, actionsRegistry]);

  useEffect(() => {
    if (actionState && action) {
      callbacks?.onActionMount?.(
        action,
        websiteUrl ?? action.url,
        actionState.action
      );
    }
    // we ignore changes to `actionState.action` or callbacks explicitly, since we want this to run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [action, websiteUrl]);

  useEffect(() => {
    if (!action) return;
    const liveDataConfig = action.liveData_experimental;
    if (
      !liveDataConfig ||
      !liveDataConfig.enabled ||
      executionState.status !== 'idle' ||
      action.isChained
    ) {
      return;
    }

    let timeout: any; // NodeJS.Timeout
    const fetcher = async () => {
      try {
        const newAction = await action.refresh();

        // if after refresh user clicked started execution, we should not update the action
        if (executionState.status === 'idle') {
          setAction(newAction);
        }
      } catch (e) {
        console.error(
          `[@dialectlabs/blinks] Failed to fetch live data for action ${action.url}`
        );
        // if fetch failed, we retry after the same delay
        timeout = setTimeout(fetcher, liveDataConfig.delayMs);
      }
    };

    // since either way we're rebuilding the whole action, we'll update and restart this effect
    timeout = setTimeout(fetcher, liveDataConfig.delayMs);

    return () => {
      clearTimeout(timeout);
    };
  }, [action, executionState.status]);

  useEffect(() => {
    const checkSupportability = async (action: Action) => {
      if (
        action.isChained ||
        executionState.status !== 'checking-supportability'
      ) {
        return;
      }
      try {
        const supportability = await action.isSupported();
        setSupportability(supportability);
      } finally {
        dispatchExecution({
          type:
            overallState !== 'malicious' && isPassingSecurityCheck
              ? ExecutionType.RESET
              : ExecutionType.BLOCK,
        });
      }
    };
    if (action) {
      checkSupportability(action);
    }
  }, [action, executionState.status, overallState, isPassingSecurityCheck]);

  useEffect(() => {
    if (overallState === 'malicious' || isPassingSecurityCheck == false) {
      dispatchExecution({
        type: ExecutionType.BLOCK,
      });
    }
  }, [overallState, isPassingSecurityCheck]);

  const filteredActions = useMemo(
    () =>
      action?.actions.filter((x) => {
        if (
          blinksDetail &&
          tokenAccounts?.token_accounts &&
          x.href ==
            generatePostSubscribeApiEndPoint(
              blinksDetail.mint,
              blinksDetail.id
            ) &&
          tokenAccounts.token_accounts.findIndex(
            (x) => x.mint == blinksDetail.mint
          ) != -1
        ) {
          return false;
        }
        return true;
      }),
    [action]
  );

  const [buttons, inputs, form] = useMemo(() => {
    const filtered =
      filteredActions?.filter((it) =>
        executionState.executingAction
          ? executionState.executingAction === it
          : true
      ) ?? [];

    const buttons = filtered
      .filter((it) => it instanceof ButtonActionComponent)
      .slice(0, SOFT_LIMIT_BUTTONS);

    const inputs = filtered
      .filter(
        (it) =>
          it instanceof SingleValueActionComponent ||
          it instanceof MultiValueActionComponent
      )
      .slice(0, SOFT_LIMIT_INPUTS);

    const [formComponent] =
      filtered.filter((it) => it instanceof FormActionComponent) ?? [];

    return [buttons, inputs, formComponent];
  }, [filteredActions, executionState.executingAction]);

  const execute = async (
    component: AbstractActionComponent,
    params?: Record<string, string | string[]>
  ) => {
    if (params) {
      if (component instanceof FormActionComponent) {
        Object.entries(params).forEach(([name, value]) =>
          component.setValue(value, name)
        );
      }

      if (component instanceof MultiValueActionComponent) {
        component.setValue(params[component.parameter.name]);
      }

      if (component instanceof SingleValueActionComponent) {
        const incomingValues = params[component.parameter.name];
        const value =
          typeof incomingValues === 'string'
            ? incomingValues
            : incomingValues[0];
        component.setValue(value);
      }
    }

    dispatchExecution({
      type: ExecutionType.INITIATE,
      executingAction: component,
    });

    const context: ActionContext = {
      action: component.parent!,
      actionType: actionState.action,
      originalUrl: websiteUrl ?? component.parent!.url,
      triggeredLinkedAction: component,
    };

    try {
      const account = await action?.adapter.connect(context);
      if (!account) {
        dispatchExecution({ type: ExecutionType.RESET });
        return;
      }

      const tx = await component
        .post(account)
        .catch((e: Error) => ({ error: e.message }));

      if (!(tx as ActionPostResponse).transaction || isPostRequestError(tx)) {
        dispatchExecution({
          type: ExecutionType.SOFT_RESET,
          errorMessage: isPostRequestError(tx)
            ? tx.error
            : 'Transaction data missing',
        });
        return;
      }

      const signResult = await action?.adapter.signTransaction(
        tx.transaction,
        context
      );

      if (!signResult || isSignTransactionError(signResult)) {
        dispatchExecution({ type: ExecutionType.RESET });
      } else {
        await action?.adapter.confirmTransaction(signResult.signature, context);

        if (!tx.links?.next) {
          dispatchExecution({
            type: ExecutionType.FINISH,
            successMessage: tx.message,
          });
          return;
        }

        //chain
        const nextAction = await action?.chain(tx.links.next, {
          signature: signResult.signature,
          account: account,
        });

        if (!nextAction) {
          dispatchExecution({
            type: ExecutionType.FINISH,
            successMessage: tx.message,
          });
          return;
        }

        setAction(nextAction);
        dispatchExecution({ type: ExecutionType.RESET });
      }
    } catch (e) {
      dispatchExecution({
        type: ExecutionType.SOFT_RESET,
        errorMessage: (e as Error).message ?? 'Unknown error, please try again',
      });
    }
  };

  const asButtonProps = (component: AbstractActionComponent) => {
    const it = component as ButtonActionComponent;
    return {
      text: buttonLabelMap[executionState.status] ?? it.label,
      loading:
        executionState.status === 'executing' &&
        it === executionState.executingAction,
      disabled:
        action?.disabled ||
        action?.type === 'completed' ||
        executionState.status !== 'idle',
      variant:
        buttonVariantMap[
          action?.type === 'completed' ? 'success' : executionState.status
        ],
      onClick: (params?: Record<string, string | string[]>) =>
        execute(it.parentComponent ?? it, params),
    };
  };

  const asInputProps = (
    component: AbstractActionComponent,
    { placement }: { placement: 'form' | 'standalone' } = {
      placement: 'standalone',
    }
  ) => {
    const it = component as
      | SingleValueActionComponent
      | MultiValueActionComponent;
    return {
      type: it.parameter.type ?? 'text',
      placeholder: it.parameter.label,
      disabled:
        action?.disabled ||
        action?.type === 'completed' ||
        executionState.status !== 'idle',
      name: it.parameter.name,
      required: it.parameter.required,
      min: it.parameter.min,
      max: it.parameter.max,
      pattern:
        it instanceof SingleValueActionComponent &&
        isPatternAllowed(it.parameter)
          ? it.parameter.pattern
          : undefined,
      options: isParameterSelectable(it.parameter)
        ? it.parameter.options
        : undefined,
      description: it.parameter.patternDescription,
      button:
        placement === 'standalone'
          ? asButtonProps(it.toButtonActionComponent())
          : undefined,
    };
  };

  const asFormProps = (component: AbstractActionComponent) => {
    const it = component as FormActionComponent;
    return {
      button: asButtonProps(it.toButtonActionComponent()),
      inputs: it.parameters.slice(0, SOFT_LIMIT_FORM_INPUTS).map((parameter) =>
        asInputProps(it.toInputActionComponent(parameter.name), {
          placement: 'form',
        })
      ),
    };
  };

  const disclaimer: Disclaimer | undefined = useMemo(() => {
    if (overallState === 'malicious') {
      return {
        type: DisclaimerType.BLOCKED,
        ignorable: !!isPassingSecurityCheck,
        hidden:
          executionState.status !== 'blocked' &&
          executionState.status !== 'checking-supportability',
        onSkip: () => dispatchExecution({ type: ExecutionType.UNBLOCK }),
      };
    }

    if (overallState === 'unknown') {
      return {
        type: DisclaimerType.UNKNOWN,
        ignorable: !!isPassingSecurityCheck,
      };
    }

    return undefined;
  }, [executionState.status, isPassingSecurityCheck, overallState]);

  return (
    <ActionLayout
      type={overallState}
      title={action?.title}
      description={action?.description}
      websiteUrl={websiteUrl}
      websiteText={websiteText}
      image={action?.icon}
      error={
        executionState.status !== 'success'
          ? executionState.errorMessage ?? action?.error
          : null
      }
      success={executionState.successMessage}
      buttons={buttons.map(asButtonProps)}
      inputs={inputs.map((input) => asInputProps(input))}
      form={form ? asFormProps(form) : undefined}
      disclaimer={disclaimer}
      post={action?.post}
      blinksDetail={blinksDetail}
      showMintDetails={showMintDetails}
      hideBorder={hideBorder}
      hideCarousel={hideCarousel}
      hideCaption={hideCaption}
      hideUserPanel={hideUserPanel}
      hideComment={hideComment}
      expandAll={expandAll}
      multiGrid={multiGrid}
      editable={editable}
      supportability={supportability}
    />
  );
};

const getOverallActionState = (
  action: Action | null | undefined,
  websiteUrl: string | null | undefined,
  actionsRegistry: ActionsRegistry | undefined
): ActionStateWithOrigin => {
  if (!action || !actionsRegistry) return { action: 'unknown' };
  const actionState = getActionRegistryLookUp({
    url: action?.url,
    type: 'action',
    actionsRegistry,
  });
  const originalUrlData = websiteUrl ? isInterstitial(websiteUrl) : null;

  if (!originalUrlData) {
    return {
      action: actionState?.state || 'unknown',
    };
  }

  if (originalUrlData.isInterstitial) {
    return {
      action: actionState?.state || 'unknown',
      origin:
        getActionRegistryLookUp({
          url: websiteUrl!,
          type: 'interstitial',
          actionsRegistry,
        })?.state || 'unknown',
      originType: 'interstitials' as Source,
    };
  }

  return {
    action: actionState?.state || 'unknown',
    origin:
      getActionRegistryLookUp({
        url: websiteUrl!,
        type: 'website',
        actionsRegistry,
      })?.state || 'unknown',
    originType: 'websites' as Source,
  };
};

export const executionReducer = (
  state: ExecutionState,
  action: ActionValue
): ExecutionState => {
  switch (action.type) {
    case ExecutionType.CHECK_SUPPORTABILITY:
      return {
        status: 'checking-supportability',
        checkingSupportability: true,
      };
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
        executingAction: null,
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

export const buttonVariantMap: Record<
  ExecutionStatus,
  'default' | 'error' | 'success'
> = {
  'checking-supportability': 'default',
  blocked: 'default',
  idle: 'default',
  executing: 'default',
  success: 'success',
  error: 'error',
};

export const buttonLabelMap: Record<ExecutionStatus, string | null> = {
  'checking-supportability': 'Loading',
  blocked: null,
  idle: null,
  executing: 'Executing',
  success: 'Completed',
  error: 'Failed',
};

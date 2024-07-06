import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  IconCheck,
  IconExclamationCircle,
  IconLink,
  IconProgress,
  IconShield,
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import type { PropsWithChildren } from 'react';
import { FC, ReactNode, useMemo, useState, type ChangeEvent } from 'react';
import { Action, ActionComponent } from './actions';
import {
  useGetActionRegistry,
  useGetActionRegistryLookUp,
  useGetBlinkAction,
  useGetBlinkActionJsonUrl,
} from './blink-data-access';
import { execute } from './functions';
import {
  ACTIONS_REGISTRY_URL_ALL,
  ActionsRegistry,
  ExecutionState,
  ExecutionStatus,
  ExecutionType,
  ExtendedActionState,
  NormalizedSecurityLevel,
  Parameter,
  Source,
  checkSecurity,
  checkSecurityFromActionState,
  executionReducer,
  isInterstitial,
  mergeActionStates,
  normalizeOptions,
} from './utils';

interface BlinksProps {
  actionUrl: URL;
}
export const Blinks: FC<BlinksProps> = ({ actionUrl }) => {
  let actionApiUrl: string | null = null;
  const { data: actionsRegistry } = useGetActionRegistry({
    registryUrl: ACTIONS_REGISTRY_URL_ALL,
  });
  const mergedOptions = normalizeOptions({ securityLevel: 'all' });
  const interstitialData = isInterstitial(actionUrl);
  const { data: interstitialState } = useGetActionRegistryLookUp({
    url: actionUrl,
    type: 'interstitial',
    actionsRegistry,
    enabled: !!actionsRegistry && interstitialData.isInterstitial,
  });
  if (
    interstitialData.isInterstitial &&
    interstitialState &&
    checkSecurity(
      interstitialState.state,
      mergedOptions.securityLevel.interstitials
    )
  ) {
    actionApiUrl = interstitialData.decodedActionUrl;
  }

  const { data: websiteState } = useGetActionRegistryLookUp({
    url: actionUrl,
    type: 'website',
    actionsRegistry,
    enabled: !!actionsRegistry && !interstitialData.isInterstitial,
  });

  const { data: actionsUrlMapper } = useGetBlinkActionJsonUrl({
    origin: actionUrl.origin,
    enabled:
      !!actionsRegistry &&
      !interstitialData.isInterstitial &&
      !!websiteState &&
      checkSecurity(websiteState.state, mergedOptions.securityLevel.websites),
  });

  if (actionsUrlMapper) {
    actionApiUrl = actionsUrlMapper.mapUrl(actionUrl);
  }

  const { data: actionState } = useGetActionRegistryLookUp({
    url: actionApiUrl,
    type: 'action',
    actionsRegistry,
    enabled: !!actionsRegistry && !!actionApiUrl,
  });

  const { data: action } = useGetBlinkAction({
    actionUrl: actionApiUrl,
    enabled:
      !!actionApiUrl &&
      !!actionState &&
      checkSecurity(actionState.state, mergedOptions.securityLevel.actions),
  });

  return (
    action &&
    actionsRegistry && (
      <ActionContainer
        actionsRegistry={actionsRegistry}
        action={action}
        websiteText={actionUrl.hostname}
        websiteUrl={actionUrl.toString()}
        normalizedSecurityLevel={{ ...mergedOptions.securityLevel }}
      />
    )
  );
};

interface ActionContainerProps {
  actionsRegistry: ActionsRegistry;
  action: Action;
  websiteUrl?: string | null;
  websiteText?: string | null;
  normalizedSecurityLevel: NormalizedSecurityLevel;
}

export interface ActionContext {
  originalUrl: string;
  action: Action;
  actionType: 'trusted' | 'malicious' | 'unknown';
  triggeredLinkedAction: ActionComponent;
}

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

export const ActionContainer: FC<ActionContainerProps> = ({
  websiteText,
  websiteUrl,
  action,
  actionsRegistry,
  normalizedSecurityLevel,
}) => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  let overallActionState: ActionStateWithOrigin | null = null;

  const { data: actionState } = useGetActionRegistryLookUp({
    url: action.url,
    type: 'action',
    actionsRegistry,
    enabled: true,
  });
  const originalUrlData = websiteUrl ? isInterstitial(websiteUrl) : null;

  if (!originalUrlData && actionState) {
    overallActionState = {
      action: actionState.state,
    };
  }
  const { data: origin } = useGetActionRegistryLookUp({
    url: websiteUrl!,
    type: 'interstitial',
    actionsRegistry,
    enabled:
      !!websiteUrl && !!originalUrlData && originalUrlData.isInterstitial,
  });

  if (
    originalUrlData &&
    originalUrlData.isInterstitial &&
    origin &&
    actionState
  ) {
    overallActionState = {
      action: actionState.state,
      origin: origin.state,
      originType: 'interstitials' as Source,
    };
  }

  const { data: website } = useGetActionRegistryLookUp({
    url: websiteUrl!,
    type: 'website',
    actionsRegistry,
    enabled:
      !!websiteUrl && !!originalUrlData && !originalUrlData.isInterstitial,
  });

  if (
    originalUrlData &&
    !originalUrlData.isInterstitial &&
    website &&
    actionState
  ) {
    overallActionState = {
      action: actionState.state,
      origin: website.state,
      originType: 'websites' as Source,
    };
  }

  const overallState = useMemo(
    () =>
      overallActionState &&
      mergeActionStates(
        ...([overallActionState.action, overallActionState.origin].filter(
          Boolean
        ) as ExtendedActionState[])
      ),
    [overallActionState]
  );

  // adding ui check as well, to make sure, that on runtime registry lookups, we are not allowing the action to be executed
  const isPassingSecurityCheck =
    overallActionState &&
    checkSecurityFromActionState(overallActionState, normalizedSecurityLevel);

  let executionState: ExecutionState = {
    status:
      overallState !== 'malicious' && isPassingSecurityCheck
        ? 'idle'
        : 'blocked',
  };

  const buttons = useMemo(
    () =>
      action?.actions
        .filter((it) => !it.parameter)
        .filter((it) =>
          executionState.executingAction
            ? executionState.executingAction === it
            : true
        ) ?? [],

    [action, executionState.executingAction]
  );
  const inputs = useMemo(
    () =>
      action?.actions
        .filter((it) => it.parameters.length === 1)
        .filter((it) =>
          executionState.executingAction
            ? executionState.executingAction === it
            : true
        ) ?? [],
    [action, executionState.executingAction]
  );
  const form = useMemo(() => {
    const [formComponent] =
      action?.actions
        .filter((it) => it.parameters.length > 1)
        .filter((it) =>
          executionState.executingAction
            ? executionState.executingAction === it
            : true
        ) ?? [];
    return formComponent;
  }, [action, executionState.executingAction]);

  const asButtonProps = (it: ActionComponent): ButtonProps => ({
    text: buttonLabelMap[executionState.status] ?? it.label,
    loading:
      executionState.status === 'executing' &&
      it === executionState.executingAction,
    disabled: action.disabled || executionState.status !== 'idle',
    variant: buttonVariantMap[executionState.status],
    onClick: (params?: Record<string, string>) =>
      overallActionState &&
      execute(
        connection,
        executionState,
        overallActionState,
        publicKey,
        signTransaction,
        it,
        params
      ),
  });

  const asInputProps = (it: ActionComponent, parameter?: Parameter) => {
    const placeholder = !parameter ? it.parameter!.label : parameter.label;
    const name = !parameter ? it.parameter!.name : parameter.name;
    const required = !parameter ? it.parameter!.required : parameter.required;

    return {
      // since we already filter this, we can safely assume that parameter is not null
      placeholder,
      disabled: action.disabled || executionState.status !== 'idle',
      name,
      required,
      button: !parameter ? asButtonProps(it) : undefined,
    };
  };

  const asFormProps = (it: ActionComponent) => {
    return {
      button: asButtonProps(it),
      inputs: it.parameters.map((parameter) => asInputProps(it, parameter)),
    };
  };

  const disclaimer = useMemo(() => {
    if (overallState === 'malicious' && executionState.status === 'blocked') {
      return (
        <Snackbar variant="error">
          <p>
            This Action or it&apos;s origin has been flagged as an unsafe
            action, & has been blocked. If you believe this action has been
            blocked in error, please{' '}
            <a
              href="https://discord.gg/saydialect"
              className="cursor-pointer underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              submit an issue
            </a>
            .
            {!isPassingSecurityCheck &&
              ' Your action provider blocks execution of this action.'}
          </p>
          {isPassingSecurityCheck && (
            <button
              className="mt-3 font-semibold transition-colors hover:text-error motion-reduce:transition-none"
              onClick={() =>
                executionReducer(executionState, {
                  type: ExecutionType.UNBLOCK,
                })
              }
            >
              Ignore warning & proceed
            </button>
          )}
        </Snackbar>
      );
    }

    if (overallState === 'unknown') {
      return (
        <Snackbar variant="warning">
          <p>
            This Action has not yet been registered. Only use it if you trust
            the source. This Action will not unfurl on X until it is registered.
            {!isPassingSecurityCheck &&
              ' Your action provider blocks execution of this action.'}
          </p>
          <a
            className="mt-3 inline-block font-semibold transition-colors hover:text-warning motion-reduce:transition-none"
            href="https://discord.gg/saydialect"
            target="_blank"
            rel="noopener noreferrer"
          >
            Report
          </a>
        </Snackbar>
      );
    }

    return null;
  }, [executionState.status, isPassingSecurityCheck, overallState]);

  return (
    overallState && (
      <ActionLayout
        type={overallState}
        title={action.title}
        description={action.description}
        websiteUrl={websiteUrl}
        websiteText={websiteText}
        image={action.icon}
        error={
          executionState.status !== 'success'
            ? executionState.errorMessage ?? action.error
            : null
        }
        success={executionState.successMessage}
        buttons={buttons.map(asButtonProps)}
        inputs={inputs.map((input) => asInputProps(input))}
        form={form ? asFormProps(form) : undefined}
        disclaimer={disclaimer}
      />
    )
  );
};

type SnackbarVariant = 'warning' | 'error';

interface Props {
  variant?: SnackbarVariant;
  children: ReactNode | ReactNode[];
}

const variantClasses: Record<SnackbarVariant, string> = {
  error: 'bg-blink-error/10 text-blink-error border-blink-error',
  warning: 'bg-blink-warning/10 text-blink-warning border-blink-warning',
};

export const Snackbar = ({ variant = 'warning', children }: Props) => {
  return (
    <div
      className={`${
        variant == 'warning' ? variantClasses.warning : variantClasses.error
      } rounded-lg border p-3 text-subtext`}
    >
      {children}
    </div>
  );
};

type ActionType = ExtendedActionState;

interface LayoutProps {
  image?: string;
  error?: string | null;
  success?: string | null;
  websiteUrl?: string | null;
  websiteText?: string | null;
  disclaimer?: ReactNode;
  type: ActionType;
  title: string;
  description: string;
  buttons?: ButtonProps[];
  inputs?: InputProps[];
  form?: FormProps;
}
export interface ButtonProps {
  text: string | null;
  loading?: boolean;
  variant?: 'default' | 'success' | 'error';
  disabled?: boolean;
  onClick: (params?: Record<string, string>) => void;
}

export interface InputProps {
  placeholder?: string;
  name: string;
  disabled: boolean;
  required?: boolean;
  button?: ButtonProps;
}

export interface FormProps {
  inputs: Array<Omit<InputProps, 'button'>>;
  button: ButtonProps;
}

export const ActionLayout = ({
  title,
  description,
  image,
  websiteUrl,
  websiteText,
  type,
  disclaimer,
  buttons,
  inputs,
  form,
  error,
  success,
}: LayoutProps) => {
  return (
    <div className="w-full cursor-default overflow-hidden rounded-2xl border bg-base-200 shadow-action">
      {image && websiteUrl && (
        <Link
          href={websiteUrl?.toString()}
          className={`block px-5 pt-5 relative w-full ${
            form ? 'aspect-[2/1] rounded-xl' : 'aspect-square'
          }`}
        >
          <Image
            className={`object-cover object-left `}
            src={image}
            fill={true}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt="action-image"
          />
        </Link>
      )}
      <div className="flex flex-col gap-2 p-4">
        <div className="mb-2 flex items-center gap-2">
          {websiteUrl && (
            <Link
              href={websiteUrl}
              target="_blank"
              className="link flex gap-2 items-center truncate"
              rel="noopener noreferrer"
            >
              <IconLink size={18} />
              {websiteText ?? websiteUrl}
            </Link>
          )}
          {websiteText && !websiteUrl && (
            <span className="inline-flex items-center truncate">
              {websiteText}
            </span>
          )}
          <Link
            href="https://docs.dialect.to/documentation/actions/security"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center"
          >
            {type === 'malicious' && (
              <div className="badge badge-error">
                <IconExclamationCircle size={18} />
                Blocked
              </div>
            )}
            {type === 'trusted' && (
              <div className="badge badge-success">
                <IconShield size={18} />
              </div>
            )}
            {type === 'unknown' && (
              <div className="badge badge-warning">
                <IconShield size={18} />
              </div>
            )}
          </Link>
        </div>
        <span className="font-semibold">{title}</span>
        <span className="whitespace-pre-wrap text-subtext ">{description}</span>
        {disclaimer && <div className="mb-4">{disclaimer}</div>}
        <ActionContent form={form} inputs={inputs} buttons={buttons} />
        {success && (
          <span className="mt-4 flex justify-center text-subtext text-blink-success">
            {success}
          </span>
        )}
        {error && !success && (
          <span className="mt-4 flex justify-center text-subtext text-blink-error">
            {error}
          </span>
        )}
      </div>
    </div>
  );
};

const ActionContent = ({
  form,
  inputs,
  buttons,
}: Pick<LayoutProps, 'form' | 'buttons' | 'inputs'>) => {
  if (form) {
    return <ActionForm form={form} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {buttons && buttons.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {buttons?.map((it, index) => (
            <div key={index} className="flex-auto">
              <ActionButton {...it} />
            </div>
          ))}
        </div>
      )}
      {inputs?.map((input) => (
        <ActionInput key={input.name} {...input} />
      ))}
    </div>
  );
};

const ActionForm = ({ form }: Required<Pick<LayoutProps, 'form'>>) => {
  const [values, setValues] = useState(
    Object.fromEntries(form.inputs.map((i) => [i.name, '']))
  );

  const onChange = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const disabled = form.inputs.some((i) => i.required && values[i.name] === '');

  return (
    <div className="flex flex-col gap-3">
      {form.inputs.map((input) => (
        <ActionInput
          key={input.name}
          {...input}
          onChange={(v) => onChange(input.name, v)}
        />
      ))}
      <ActionButton
        {...form.button}
        onClick={() => form.button.onClick(values)}
        disabled={form.button.disabled || disabled}
      />
    </div>
  );
};

const ActionInput = ({
  placeholder,
  name,
  button,
  disabled,
  onChange: extOnChange,
  required,
}: InputProps & { onChange?: (value: string) => void }) => {
  const [value, onChange] = useState('');

  const extendedChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.currentTarget.value);
    extOnChange?.(e.currentTarget.value);
  };

  const placeholderWithRequired =
    (placeholder || 'Type here...') + (required ? '*' : '');

  return (
    <div className="flex items-center gap-2 rounded-full border border-[#3D4144] transition-colors focus-within:border-blink-accent motion-reduce:transition-none">
      <input
        placeholder={placeholderWithRequired}
        value={value}
        disabled={disabled}
        onChange={extendedChange}
        className="my-3 ml-4 flex-1 truncate bg-transparent outline-none placeholder:text-blink-neutral-50 disabled:text-blink-neutral-50"
      />
      {button && (
        <div className="my-2 mr-2">
          <ActionButton
            {...button}
            onClick={() => button.onClick({ [name]: value })}
            disabled={button.disabled || value === ''}
          />
        </div>
      )}
    </div>
  );
};

const ActionButton = ({
  text,
  loading,
  disabled,
  variant,
  onClick,
}: ButtonProps) => {
  const ButtonContent = () => {
    if (loading)
      return (
        <span className="flex flex-row items-center justify-center gap-2">
          {text} <IconProgress />
        </span>
      );
    if (variant === 'success')
      return (
        <span className="flex flex-row items-center justify-center gap-2 text-blink-success">
          {text}
          <IconCheck />
        </span>
      );
    return text;
  };

  return (
    <Button onClick={() => onClick()} disabled={disabled} variant={variant}>
      <ButtonContent />
    </Button>
  );
};

const buttonLabelMap: Record<ExecutionStatus, string | null> = {
  blocked: null,
  idle: null,
  executing: 'Executing',
  success: 'Completed',
  error: 'Failed',
};

const buttonVariantMap: Record<
  ExecutionStatus,
  'default' | 'error' | 'success'
> = {
  blocked: 'default',
  idle: 'default',
  executing: 'default',
  success: 'success',
  error: 'error',
};

export const Button = ({
  onClick,
  disabled,
  variant,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'success' | 'error' | 'default';
} & PropsWithChildren) => {
  const buttonStyle = disabled ? 'btn-disabled ' : 'btn-primary';
  return (
    <button
      className={`${buttonStyle} btn flex w-full items-center justify-center rounded-full p-4 text-text font-semibold transition-colors motion-reduce:transition-none`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

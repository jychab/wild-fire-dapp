import { ExecutionType } from '@/utils/enums/blinks';
import { convertUTCTimeToDayMonth } from '@/utils/helper/format';
import {
  ACTIONS_REGISTRY_URL_ALL,
  ActionStateWithOrigin,
  ActionsRegistry,
  ExecutionState,
  ExecutionStatus,
  ExtendedActionState,
  NormalizedSecurityLevel,
  Parameter,
  Source,
} from '@/utils/types/blinks';
import { PostContent } from '@/utils/types/post';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import {
  IconAlertTriangleFilled,
  IconCheck,
  IconExclamationCircle,
  IconProgress,
  IconShieldCheckFilled,
} from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PropsWithChildren } from 'react';
import {
  FC,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import {
  Action,
  ActionComponent,
  checkSecurity,
  checkSecurityFromActionState,
  execute,
  executionReducer,
  isInterstitial,
  mergeActionStates,
  normalizeOptions,
} from '../../utils/helper/blinks';
import { CommentsSection } from '../comments/comments-ui';
import {
  CarouselContent,
  PostCaption,
  PostCard,
  UserPanel,
  UserProfile,
} from '../content/content-ui';
import {
  useGetActionRegistry,
  useGetActionRegistryLookUp,
  useGetBlinkAction,
  useGetBlinkActionJsonUrl,
} from './blink-data-access';

interface BlinksProps {
  actionUrl?: URL;
  post?: PostContent;
  showMintDetails?: boolean;
  editable?: boolean;
  multiGrid?: boolean;
  hideComment?: boolean;
  expandAll?: boolean;
  hideUserPanel?: boolean;
  hideCaption?: boolean;
  hideCarousel?: boolean;
  hideBorder?: boolean;
}
export const Blinks: FC<BlinksProps> = ({
  actionUrl,
  post,
  showMintDetails = true,
  hideUserPanel = false,
  editable = false,
  multiGrid = false,
  hideComment = false,
  expandAll = false,
  hideCaption = false,
  hideCarousel = false,
  hideBorder = false,
}) => {
  const { data: actionsRegistry } = useGetActionRegistry({
    registryUrl: ACTIONS_REGISTRY_URL_ALL,
  });
  const mergedOptions = normalizeOptions({ securityLevel: 'only-trusted' });
  const interstitialData = actionUrl
    ? isInterstitial(actionUrl)
    : { isInterstitial: false, decodedActionUrl: '' };
  const { data: interstitialState } = useGetActionRegistryLookUp({
    url: actionUrl!,
    type: 'interstitial',
    actionsRegistry,
    enabled:
      !!actionsRegistry && interstitialData.isInterstitial && !!actionUrl,
  });

  const actionApiUrl =
    actionUrl &&
    interstitialData.isInterstitial &&
    interstitialState &&
    checkSecurity(
      interstitialState.state,
      mergedOptions.securityLevel.interstitials
    )
      ? interstitialData.decodedActionUrl
      : null;

  const { data: websiteState } = useGetActionRegistryLookUp({
    url: actionUrl!,
    type: 'website',
    actionsRegistry,
    enabled:
      !!actionsRegistry && !interstitialData.isInterstitial && !!actionUrl,
  });

  const { data: actionsUrlMapper } = useGetBlinkActionJsonUrl({
    origin: actionUrl?.origin,
    enabled:
      !!actionUrl &&
      !!actionsRegistry &&
      !interstitialData.isInterstitial &&
      !!websiteState &&
      checkSecurity(websiteState.state, mergedOptions.securityLevel.websites),
  });

  const finalActionApiUrl = actionsUrlMapper
    ? actionsUrlMapper.mapUrl(actionUrl!)
    : actionApiUrl;

  const { data: actionState } = useGetActionRegistryLookUp({
    url: finalActionApiUrl,
    type: 'action',
    actionsRegistry,
    enabled: !!actionsRegistry && !!finalActionApiUrl,
  });

  const { data: action } = useGetBlinkAction({
    actionUrl: finalActionApiUrl,
    enabled:
      !!finalActionApiUrl &&
      !!actionState &&
      checkSecurity(actionState.state, mergedOptions.securityLevel.actions),
  });

  if (!actionUrl && post) {
    return (
      <PostCard
        post={post}
        showMintDetails={showMintDetails}
        multiGrid={multiGrid}
        editable={editable}
        hideComment={hideComment}
        expandAll={expandAll}
        hideCarousel={hideCarousel}
        hideCaption={hideCaption}
        hideUserPanel={hideUserPanel}
      />
    );
  } else {
    return (
      <ActionContainer
        hideBorder={hideBorder}
        hideCarousel={hideCarousel}
        hideCaption={hideCaption}
        hideUserPanel={hideUserPanel}
        hideComment={hideComment}
        expandAll={expandAll}
        editable={editable}
        actionsRegistry={actionsRegistry}
        action={action}
        websiteText={actionUrl?.hostname}
        websiteUrl={actionUrl?.toString()}
        normalizedSecurityLevel={{ ...mergedOptions.securityLevel }}
        multiGrid={multiGrid}
        showMintDetails={showMintDetails}
        post={post}
      />
    );
  }
};

interface ActionContainerProps {
  actionsRegistry: ActionsRegistry | undefined;
  action: Action | undefined | null;
  websiteUrl?: string | null | undefined;
  websiteText?: string | null | undefined;
  normalizedSecurityLevel: NormalizedSecurityLevel;
  editable: boolean;
  multiGrid: boolean;
  expandAll: boolean;
  hideComment: boolean;
  hideUserPanel: boolean;
  showMintDetails: boolean;
  post?: PostContent;
  hideCaption: boolean;
  hideCarousel: boolean;
  hideBorder: boolean;
}

export const ActionContainer: FC<ActionContainerProps> = ({
  hideBorder,
  hideCarousel,
  hideCaption,
  websiteText,
  websiteUrl,
  action,
  actionsRegistry,
  normalizedSecurityLevel,
  editable,
  multiGrid,
  expandAll,
  hideComment,
  showMintDetails,
  hideUserPanel,
  post,
}) => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  let overallActionState: ActionStateWithOrigin | null = null;

  const { data: actionState } = useGetActionRegistryLookUp({
    url: action?.url,
    type: 'action',
    actionsRegistry,
    enabled: !!action,
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
    disabled: !action || action?.disabled || executionState.status !== 'idle',
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
      disabled: !action || action.disabled || executionState.status !== 'idle',
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
    <ActionLayout
      hideBorder={hideBorder}
      hideCarousel={hideCarousel}
      hideCaption={hideCaption}
      hideUserPanel={hideUserPanel}
      post={post}
      hideComment={hideComment}
      expandAll={expandAll}
      multiGrid={multiGrid}
      editable={editable}
      type={overallState || 'unknown'}
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
      showMintDetails={showMintDetails}
    />
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

interface LayoutProps {
  hideBorder: boolean;
  post?: PostContent;
  hideCarousel: boolean;
  hideCaption: boolean;
  hideUserPanel: boolean;
  hideComment: boolean;
  expandAll: boolean;
  multiGrid: boolean;
  editable: boolean;
  showMintDetails: boolean;
  image?: string;
  error?: string | null;
  success?: string | null;
  websiteUrl?: string | null;
  websiteText?: string | null;
  disclaimer?: ReactNode;
  type: ExtendedActionState;
  title: string | undefined;
  description: string | undefined;
  buttons?: ButtonProps[];
  inputs?: InputProps[];
  form?: FormProps;
}
interface ButtonProps {
  text: string | null;
  loading?: boolean;
  variant?: 'default' | 'success' | 'error';
  disabled?: boolean;
  onClick: (params?: Record<string, string>) => void;
}

interface InputProps {
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
  hideBorder,
  hideCarousel,
  hideCaption,
  hideUserPanel,
  hideComment,
  expandAll,
  multiGrid,
  editable,
  showMintDetails,
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
  post,
}: LayoutProps) => {
  const [renderBlink, setRenderBlink] = useState(
    post ? post.carousel[0].fileType == 'blinks' : true
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Debounce function to optimize scroll event handling
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  };

  const handleScrollEvent = () => {
    if (!post) return;
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const itemWidth = carouselRef.current.clientWidth;
      const newIndex = Math.round(scrollLeft / itemWidth);

      if (newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        setRenderBlink(post.carousel[newIndex].fileType === 'blinks');
      }
    }
  };

  // Debounced version of the scroll event handler
  const handleScrollEventDebounced = debounce(handleScrollEvent, 50);

  useEffect(() => {
    const carouselElement = carouselRef.current;
    if (carouselElement) {
      carouselElement.addEventListener('scroll', handleScrollEventDebounced);

      // Cleanup function
      return () => {
        carouselElement.removeEventListener(
          'scroll',
          handleScrollEventDebounced
        );
      };
    }
  }, [currentIndex]);
  const handleScroll = (index: number) => {
    if (!post) return;
    setRenderBlink(post.carousel[index].fileType == 'blinks');
    const element = document.getElementById(`${post.id}/${index}`);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  };
  return (
    <div
      className={`flex  flex-col ${
        !hideBorder ? 'sm:border' : ''
      } bg-base-100 rounded w-full`}
    >
      {showMintDetails && post && <UserProfile post={post} />}
      <div className="flex flex-col w-full h-full cursor-default overflow-hidden shadow-action">
        {!hideCarousel && (
          <CarouselContent
            post={post}
            multiGrid={multiGrid}
            blinkImageUrl={image}
            form={form}
            handleScroll={handleScroll}
            carouselRef={carouselRef}
            currentIndex={currentIndex}
          />
        )}
        <div
          className={`${
            !hideUserPanel || !hideCaption || !hideComment
              ? 'px-4 pb-4 pt-2'
              : ''
          } flex flex-col flex-1 w-full justify-between`}
        >
          <div className="flex flex-col">
            {!hideUserPanel && (
              <UserPanel
                post={post}
                multiGrid={multiGrid}
                editable={editable}
              />
            )}
            {!hideCaption &&
              (renderBlink || !post ? (
                <BlinksCaption
                  websiteUrl={websiteUrl}
                  websiteText={websiteText}
                  type={type}
                  title={title}
                  description={description}
                  disclaimer={disclaimer}
                  form={form}
                  inputs={inputs}
                  buttons={buttons}
                  success={success}
                  error={error}
                  multiGrid={multiGrid}
                  expandAll={expandAll}
                  post={post}
                />
              ) : (
                <PostCaption
                  post={post}
                  multiGrid={multiGrid}
                  editable={editable}
                  expandAll={expandAll}
                />
              ))}
          </div>
          <div className="flex flex-col ">
            {!hideComment && post && (
              <CommentsSection post={post} multiGrid={multiGrid} />
            )}
            {!hideUserPanel && (
              <span className="text-xs stat-desc pt-2">
                {convertUTCTimeToDayMonth(post?.updatedAt || 0)}
              </span>
            )}
          </div>
        </div>
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
      {inputs?.map((input, index) => (
        <ActionInput key={index} {...input} />
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
    <div className="flex items-center gap-2 rounded-box border border-primary-content transition-colors focus-within:border-primary motion-reduce:transition-none">
      <input
        placeholder={placeholderWithRequired}
        value={value}
        disabled={disabled}
        onChange={extendedChange}
        className="text-base ml-4 flex-1 truncate bg-transparent outline-none placeholder:text-disabled disabled:text-disabled"
      />
      {button && (
        <div className="my-1 mr-1">
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
        <span className="flex flex-row items-center justify-center gap-2 text-success">
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
      className={`${buttonStyle} btn btn-sm flex w-full items-center justify-center rounded-full font-semibold transition-colors motion-reduce:transition-none`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
export const BlinksCaption: FC<{
  websiteUrl: string | null | undefined;
  websiteText: string | null | undefined;
  type: string;
  title: string | undefined;
  description: string | undefined;
  disclaimer: ReactNode;
  form: FormProps | undefined;
  inputs: InputProps[] | undefined;
  buttons: ButtonProps[] | undefined;
  success: string | null | undefined;
  error: string | null | undefined;
  multiGrid: boolean;
  expandAll: boolean;
  post: PostContent | undefined;
}> = ({
  expandAll,
  websiteUrl,
  websiteText,
  type,
  error,
  success,
  title,
  description,
  form,
  inputs,
  buttons,
  multiGrid,
  post,
  disclaimer,
}) => {
  const [showMore, setShowMore] = useState(expandAll);

  const router = useRouter();
  return (
    <div>
      {showMore ? (
        <div className="flex flex-col pb-2">
          <div className="flex items-center gap-1">
            {websiteUrl && (
              <Link
                href={websiteUrl}
                className="link link-hover max-w-xs text-sm stat-desc truncate"
                rel="noopener noreferrer"
                target="_blank"
              >
                {websiteText ?? websiteUrl}
              </Link>
            )}
            <Link
              href="https://docs.dialect.to/documentation/actions/security"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              {type === 'malicious' && <IconAlertTriangleFilled size={14} />}
              {type === 'trusted' && <IconShieldCheckFilled size={14} />}
              {type === 'unknown' && <IconExclamationCircle size={14} />}
            </Link>
          </div>
          <span className="font-semibold text-sm pb-2">{title}</span>
          <p className="text-xs whitespace-pre-wrap pb-2 ">{description}</p>
          {disclaimer && <div className="mb-4 pb-2">{disclaimer}</div>}
          <ActionContent form={form} inputs={inputs} buttons={buttons} />
          {success && (
            <span className="mt-4 flex justify-center text-xs text-success">
              {success}
            </span>
          )}
          {error && !success && (
            <span className="mt-4 flex justify-center text-subtext text-error">
              {error}
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-1">
          {description && (
            <p
              className={`text-xs w-full ${
                multiGrid ? 'line-clamp-1' : 'line-clamp-3'
              }`}
            >
              {description}
            </p>
          )}
          <button
            onClick={() => {
              if (!multiGrid) {
                setShowMore(true);
              } else if (post) {
                router.push(`/post?mintId=${post?.mint}&id=${post?.id}`);
              }
            }}
            className="text-xs stat-desc link link-hover w-fit"
          >
            {!showMore && description != undefined && 'Show More'}
          </button>
        </div>
      )}
    </div>
  );
};
export const BlinksStaticContent: FC<{
  form: FormProps | undefined;
  image: string | undefined;
}> = ({ form, image }) => {
  return (
    <div
      className={`flex relative justify-center items-center h-auto w-full ${
        form ? 'aspect-[2/1] rounded-xl' : 'aspect-square'
      }`}
    >
      {image ? (
        <Image
          className={`object-cover`}
          src={image}
          fill={true}
          priority={true}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt="action-image"
        />
      ) : (
        <div className="loading loading-spinner text-neutral loading-lg" />
      )}
    </div>
  );
};

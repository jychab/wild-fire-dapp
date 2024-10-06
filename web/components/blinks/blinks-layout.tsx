import { DisclaimerType } from '@/utils/enums/blinks';
import { convertUTCTimeToDayMonth } from '@/utils/helper/format';
import {
  ActionSupportability,
  Disclaimer,
  ExtendedActionState,
} from '@/utils/types/blinks';
import { PostBlinksDetail, PostContent } from '@/utils/types/post';
import { IconExclamationCircle } from '@tabler/icons-react';
import Link from 'next/link';
import { useState } from 'react';
import { BaseInputProps } from '../../utils/types/input';
import { CommentsSection } from '../comments/comments-ui';
import {
  CarouselContent,
  ContentCaption,
  UserPanel,
  UserProfile,
} from '../content/content-ui';
import { ActionButton, BaseButtonProps } from './ui/action-button';
import { ActionCheckboxGroup } from './ui/action-checkbox-group';
import { ActionDateInput } from './ui/action-date-input';
import { ActionEmailInput } from './ui/action-email-input';
import { ActionNumberInput } from './ui/action-number-input';
import { ActionRadioGroup } from './ui/action-radio-group';
import { ActionSelect } from './ui/action-select';
import { ActionTextArea } from './ui/action-text-area';
import { ActionTextInput } from './ui/action-text-input';
import { ActionUrlInput } from './ui/action-url-input';
import { Snackbar } from './ui/snackbar';

export const NotSupportedBlock = ({
  message,
  className,
}: {
  message: string;
  className?: string;
}) => {
  return (
    <div className={className}>
      <div
        className={'rounded-xl border border-none bg-warning p-3 text-warning'}
      >
        <div className="flex flex-row gap-2">
          <div>
            <IconExclamationCircle className="text-warning" />
          </div>
          <div className="flex flex-col justify-center gap-[3px]">
            <a className="font-semibold">This action is not supported</a>
            <p>{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DisclaimerBlock = ({
  type,
  hidden,
  ignorable,
  onSkip,
  className,
}: {
  type: DisclaimerType;
  ignorable: boolean;
  onSkip?: () => void;
  hidden: boolean;
  className?: string;
}) => {
  if (type === DisclaimerType.BLOCKED && !hidden) {
    return (
      <div className={className}>
        <Snackbar variant="error">
          <p>
            This Action or it&apos;s origin has been flagged as an unsafe
            action, & has been blocked. If you believe this action has been
            blocked in error, please{' '}
            <Link
              href="https://discord.gg/saydialect"
              className="cursor-pointer underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              submit an issue
            </Link>
            .
            {!ignorable &&
              ' Your action provider blocks execution of this action.'}
          </p>
          {ignorable && onSkip && (
            <button
              className="mt-3 font-semibold transition-colors hover:text-text-error-hover motion-reduce:transition-none"
              onClick={onSkip}
            >
              Ignore warning & proceed
            </button>
          )}
        </Snackbar>
      </div>
    );
  }

  if (type === DisclaimerType.UNKNOWN) {
    return (
      <div className={className}>
        <Snackbar variant="warning">
          <p>
            This Action has not yet been registered. Only use it if you trust
            the source. This Action will not unfurl on X until it is registered.
            {!ignorable &&
              ' Your action provider blocks execution of this action.'}
          </p>
          <Link
            className="mt-3 inline-block font-semibold transition-colors text-warning-content motion-reduce:transition-none"
            href="https://discord.gg/saydialect"
            target="_blank"
            rel="noopener noreferrer"
          >
            Report
          </Link>
        </Snackbar>
      </div>
    );
  }

  return null;
};

type ButtonProps = BaseButtonProps;
type InputProps = BaseInputProps;

export interface FormProps {
  inputs: Array<Omit<InputProps, 'button'>>;
  button: ButtonProps;
}

type LayoutProps = {
  blinksDetail?: PostBlinksDetail;
  hideBorder: boolean;
  post: Partial<PostContent> | undefined;
  hideCarousel: boolean;
  hideCaption: boolean;
  hideUserPanel: boolean;
  hideComment: boolean;
  expandAll: boolean;
  multiGrid: boolean;
  editable: boolean;
  showMintDetails: boolean;
  blinksImageUrl?: string;
  error?: string | null;
  success?: string | null;
  websiteUrl?: string | null;
  websiteText?: string | null;
  disclaimer?: Disclaimer;
  type: ExtendedActionState;
  title: string | undefined;
  description: string | undefined;
  buttons?: ButtonProps[];
  inputs?: InputProps[];
  form?: FormProps;
  supportability: ActionSupportability;
};

export const ActionLayout = ({
  blinksDetail,
  title,
  description,
  blinksImageUrl,
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
  hideBorder,
  hideCarousel,
  hideCaption,
  hideUserPanel,
  hideComment,
  expandAll,
  multiGrid,
  editable,
  showMintDetails,
  supportability,
}: LayoutProps) => {
  return (
    <div
      className={`flex border-base-300 flex-col ${
        !hideBorder ? `border` : ``
      } bg-base-100 rounded w-full`}
    >
      {showMintDetails && blinksDetail && (
        <UserProfile blinksDetail={blinksDetail} />
      )}
      <div className="flex flex-col w-full h-full cursor-default overflow-hidden shadow-action">
        {!hideCarousel && (
          <CarouselContent
            post={post}
            multiGrid={multiGrid}
            blinkImageUrl={blinksImageUrl}
            blinksDetail={blinksDetail}
            form={form}
          />
        )}
        <div
          className={`${
            !hideUserPanel || !hideCaption || !hideComment ? `p-2` : ''
          } flex flex-col flex-1 w-full justify-between`}
        >
          <div className="flex flex-col">
            {!hideUserPanel && (
              <UserPanel
                editable={editable}
                blinksDetail={blinksDetail}
                websiteUrl={websiteUrl}
                websiteText={websiteText}
                type={type}
              />
            )}
            {!hideCaption && (
              <ContentCaption
                blinksDetail={blinksDetail}
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
                supportability={supportability}
              />
            )}
          </div>
          <div className="flex flex-col ">
            {!hideComment && blinksDetail && (
              <CommentsSection
                blinksDetail={blinksDetail}
                multiGrid={multiGrid}
              />
            )}
            {!hideUserPanel && blinksDetail && (
              <span className="text-xs stat-desc pt-2">
                {convertUTCTimeToDayMonth(blinksDetail.createdAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const ActionContent = ({
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
            <div
              key={index}
              className="flex flex-grow basis-[calc(33.333%-2*4px)]"
            >
              <ActionButton {...it} />
            </div>
          ))}
        </div>
      )}
      {inputs?.map((input, index) => (
        <ActionInputFactory key={index} {...input} />
      ))}
    </div>
  );
};

const buildDefaultFormValues = (
  inputs: InputProps[]
): Record<string, string | string[]> => {
  let parsedInputs = inputs
    .filter(
      (i) => i.type === 'checkbox' || i.type === 'radio' || i.type === 'select'
    )
    .map((i) => {
      if (i.type === 'checkbox') {
        return [
          i.name,
          i.options?.filter((o) => o.selected).map((o) => o.value) || [],
        ] as const;
      } else {
        return [
          i.name,
          i.options?.find((o) => o.selected)?.value || [],
        ] as const;
      }
    });

  return Object.fromEntries(parsedInputs);
};

const ActionForm = ({ form }: Required<Pick<LayoutProps, 'form'>>) => {
  const [values, setValues] = useState<Record<string, string | string[]>>(
    buildDefaultFormValues(form.inputs)
  );
  const [validity, setValidity] = useState<Record<string, boolean>>(
    Object.fromEntries(form.inputs.map((i) => [i.name, false]))
  );

  const onChange = (name: string, value: string | string[]) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const onValidityChange = (name: string, state: boolean) => {
    setValidity((prev) => ({ ...prev, [name]: state }));
  };

  const disabled = Object.values(validity).some((v) => !v);

  return (
    <div className="flex flex-col gap-3">
      {form.inputs.map((input) => (
        <ActionInputFactory
          key={input.name}
          {...input}
          onChange={(v) => onChange(input.name, v)}
          onValidityChange={(v) => onValidityChange(input.name, v)}
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

const ActionInputFactory = (
  input: InputProps & {
    onChange?: (value: string | string[]) => void;
    onValidityChange?: (state: boolean) => void;
  }
) => {
  switch (input.type) {
    case 'checkbox':
      return <ActionCheckboxGroup {...input} />;
    case 'radio':
      return <ActionRadioGroup {...input} />;
    case 'date':
    case 'datetime-local':
      return <ActionDateInput {...input} type={input.type} />;
    case 'select':
      return <ActionSelect {...input} />;
    case 'email':
      return <ActionEmailInput {...input} />;
    case 'number':
      return <ActionNumberInput {...input} />;
    case 'url':
      return <ActionUrlInput {...input} />;
    case 'textarea':
      return <ActionTextArea {...input} />;
    default:
      return <ActionTextInput {...input} />;
  }
};

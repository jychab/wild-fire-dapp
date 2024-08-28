import { IconCalendar } from '@tabler/icons-react';
import {
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import { BaseInputProps } from '../../../utils/types/input';
import { ActionButton } from './action-button';
import { BaseInputContainer } from './base-container';

export const ActionDateInput = ({
  type = 'date',
  placeholder,
  name,
  button,
  disabled,
  onChange,
  onValidityChange,
  pattern,
  min,
  max,
  description,
  required,
}: Omit<BaseInputProps, 'type'> & {
  type?: 'date' | 'datetime-local';
  onChange?: (value: string) => void;
  onValidityChange?: (state: boolean) => void;
}) => {
  const id = useId();
  const isStandalone = !!button;
  const [value, setValue] = useState('');
  const [isValid, setValid] = useState(!isStandalone && !required);
  const [touched, setTouched] = useState(false);
  const minDate = min as string | undefined;
  const maxDate = max as string | undefined;

  useEffect(() => {
    onValidityChange?.(isValid);
    // calling this once, just to give the idea for the parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extendedChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const value = e.currentTarget.value;
      const validity = e.currentTarget.checkValidity();

      setValue(value);
      setValid(validity);

      onChange?.(value);
      onValidityChange?.(validity);
    },
    [onChange, onValidityChange]
  );

  const placeholderWithRequired =
    (placeholder || 'Enter a date') + (required ? '*' : '');

  const validationProps = useMemo(
    () => ({
      min: minDate,
      max: maxDate,
      pattern,
      title: description,
    }),
    [minDate, maxDate, pattern, description]
  );

  return (
    <BaseInputContainer
      standalone={isStandalone}
      description={
        description ??
        buildDefaultDateDescription({ min: minDate, max: maxDate })
      }
      leftAdornment={
        <label htmlFor={id}>
          <IconCalendar className="text-primary" />
        </label>
      }
      rightAdornment={
        button ? (
          <ActionButton
            {...button}
            onClick={() => button.onClick({ [name]: value })}
            disabled={button.disabled || value === '' || !isValid}
          />
        ) : null
      }
    >
      <input
        id={id}
        type={pattern || !touched ? 'text' : type}
        placeholder={placeholderWithRequired}
        value={value}
        onChange={extendedChange}
        onFocus={() => setTouched(true)}
        {...validationProps}
        required={button ? true : required}
        disabled={disabled}
      />
    </BaseInputContainer>
  );
};

export interface Props {
  children: ReactElement<
    | InputHTMLAttributes<HTMLInputElement>
    | TextareaHTMLAttributes<HTMLTextAreaElement>
    | SelectHTMLAttributes<HTMLSelectElement>
  >;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
  footer?: ReactNode;
  description?: string | null;
  standalone?: boolean;
}

export const buildDefaultDateDescription = ({
  min,
  max,
  includeTime,
}: {
  min?: string;
  max?: string;
  includeTime?: boolean;
}) => {
  const minDate = min ? new Date(min) : null;
  const maxDate = max ? new Date(max) : null;
  const formatter = new Intl.DateTimeFormat('en', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: includeTime ? 'numeric' : undefined,
    minute: includeTime ? 'numeric' : undefined,
  });

  if (minDate && maxDate)
    return `Pick a date between ${formatter.format(
      minDate
    )} and ${formatter.format(maxDate)}`;
  if (minDate) return `Pick a date after ${formatter.format(minDate)}`;
  if (maxDate) return `Pick a date before ${formatter.format(maxDate)}`;
  return null;
};

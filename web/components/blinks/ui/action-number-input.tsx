import { IconNumber123 } from '@tabler/icons-react';
import { type ChangeEvent, useEffect, useId, useMemo, useState } from 'react';
import { BaseInputProps } from '../../../utils/types/input';
import { ActionButton } from './action-button';
import { BaseInputContainer } from './base-container';

export const ActionNumberInput = ({
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
  onChange?: (value: string) => void;
  onValidityChange?: (state: boolean) => void;
}) => {
  const id = useId();
  const isStandalone = !!button;
  const [value, setValue] = useState('');
  const [isValid, setValid] = useState(!isStandalone && !required);

  useEffect(() => {
    onValidityChange?.(isValid);
    // calling this once, just to give the idea for the parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extendedChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.currentTarget.value;
    const validity = e.currentTarget.checkValidity();

    setValue(value);
    setValid(validity);

    onChange?.(value);
    onValidityChange?.(validity);
  };

  const placeholderWithRequired =
    (placeholder || 'Type here...') + (required ? '*' : '');

  const validationProps = useMemo(
    () => ({
      min: !pattern ? (min as number | undefined) : undefined,
      max: !pattern ? (max as number | undefined) : undefined,
      pattern,
      title: description,
    }),
    [min, max, pattern, description]
  );

  return (
    <BaseInputContainer
      standalone={isStandalone}
      description={
        description ??
        buildDefaultNumberDescription({
          min: min as number | undefined,
          max: max as number | undefined,
        })
      }
      leftAdornment={
        <label htmlFor={id}>
          <IconNumber123 className="text-primary" />
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
        type={pattern ? 'text' : 'number'}
        placeholder={placeholderWithRequired}
        value={value}
        step="any"
        onChange={extendedChange}
        {...validationProps}
        required={button ? true : required}
        disabled={disabled}
      />
    </BaseInputContainer>
  );
};
export const buildDefaultNumberDescription = ({
  min,
  max,
}: {
  min?: number;
  max?: number;
}) => {
  if (min && max) return `Enter a number between ${min} and ${max}`;
  if (min) return `Enter a number greater than ${min}`;
  if (max) return `Enter a number less than ${max}`;
  return null;
};

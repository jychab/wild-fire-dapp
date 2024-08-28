import { BaseInputProps } from '@/utils/types/input';
import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { ActionButton } from './action-button';
import { BaseInputContainer } from './base-container';

export const ActionTextInput = ({
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
  const isStandalone = !!button;
  const [value, setValue] = useState('');
  const [isValid, setValid] = useState(!isStandalone && !required);
  const minLength = min as number;
  const maxLength = max as number;

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
      minLength,
      maxLength,
      pattern,
      title: description,
    }),
    [minLength, maxLength, pattern, description]
  );

  return (
    <BaseInputContainer
      standalone={isStandalone}
      description={
        description ??
        buildDefaultTextDescription({ min: minLength, max: maxLength })
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
        type="text"
        placeholder={placeholderWithRequired}
        value={value}
        onChange={extendedChange}
        {...validationProps}
        required={button ? true : required}
        disabled={disabled}
      />
    </BaseInputContainer>
  );
};
export const buildDefaultTextDescription = ({
  min,
  max,
}: {
  min?: number;
  max?: number;
}) => {
  if (min && max) return `Type between ${min} and ${max} characters`;
  if (min) return `Type minimum ${min} characters`;
  if (max) return `Type maximum ${max} characters`;
  return null;
};

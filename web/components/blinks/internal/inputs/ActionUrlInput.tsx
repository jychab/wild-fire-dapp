import { type ChangeEvent, useEffect, useId, useMemo, useState } from 'react';
import { LinkIcon } from '../icons';
import { ActionButton } from './ActionButton';
import { BaseInputContainer } from './BaseInputContainer';
import type { BaseInputProps } from './types';
import { buildDefaultTextDescription } from './utils';

export const ActionUrlInput = ({
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
  const id = useId();
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
    (placeholder || 'https://') + (required ? '*' : '');

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
      leftAdornment={
        <label htmlFor={id}>
          <LinkIcon className="text-icon-primary" />
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
        type={pattern ? 'text' : 'url'}
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

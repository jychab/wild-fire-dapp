import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { BaseInputProps } from '../../../utils/types/input';
import { ActionButton } from './action-button';

export const ActionRadioGroup = ({
  placeholder: label, // in base inputs it's placeholder, for selectables - label
  name,
  button,
  disabled,
  onChange,
  onValidityChange,
  description,
  options = [],
  required,
}: Omit<BaseInputProps, 'type'> & {
  onChange?: (value: string) => void;
  onValidityChange?: (state: boolean) => void;
}) => {
  const isStandalone = !!button;
  const hasInitiallySelectedOption = useMemo(
    () => options.find((option) => option.selected),
    [options]
  );

  const [value, setValue] = useState<string>(
    options.find((option) => option.selected)?.value ?? ''
  );
  const [isValid, setValid] = useState(
    isStandalone
      ? !!hasInitiallySelectedOption
      : !(required && !hasInitiallySelectedOption)
  );
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    onValidityChange?.(isValid);
    // calling this once, just to give the idea for the parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extendedChange = useCallback(
    (value: string) => {
      setValue(value);
      setValid(true);
      setTouched(true);

      onChange?.(value);
      onValidityChange?.(true);
    },
    [onChange, onValidityChange]
  );

  return (
    <div
      className={`py-1.5' ${
        isStandalone ? 'bg-bg-secondary rounded-input px-1.5 pt-2' : ''
      }`}
    >
      <div className={`${isStandalone ? 'px-2' : ''}`}>
        {label && (
          <div className="mb-1">
            <label className="block text-text font-semibold text-text-input">
              {label}
              {required ? '*' : ''}
            </label>
          </div>
        )}
        <div
          className={`pt-2 ${
            !isStandalone
              ? 'flex flex-col gap-3'
              : 'grid grid-cols-2 gap-x-4 gap-y-5'
          }`}
        >
          {options.map((option) => (
            <div
              className="inline-flex"
              key={`${option.value}_${option.label}`}
            >
              <Radio
                label={option.label}
                value={option.value === value}
                inputValue={option.value}
                onChange={() => extendedChange(option.value)}
                name={name}
                disabled={disabled}
              />
            </div>
          ))}
        </div>
      </div>
      {isStandalone && (
        <div className="mt-4">
          <ActionButton
            {...button}
            onClick={() => button.onClick({ [name]: value })}
            disabled={button.disabled || !value || !isValid}
          />
        </div>
      )}
      {description && (
        <span
          className={`text-caption font-medium ${
            touched && !isValid ? 'text-text-error' : 'text-text-secondary'
          }
            ${isStandalone ? 'mb-2 mt-2.5' : 'mt-3'}`}
        >
          {description}
        </span>
      )}
    </div>
  );
};

interface Props {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  name?: string;
  disabled?: boolean;
  inputValue: string;
}

export const Radio = ({
  label,
  value,
  onChange,
  name,
  disabled,
  inputValue,
}: Props) => {
  const id = useId();
  const labelId = `${id}_label`;

  return (
    <label className="label gap-2" id={labelId}>
      <input
        id={id}
        disabled={disabled}
        aria-labelledby={labelId}
        type="radio"
        name={name}
        checked={value}
        className="radio"
        onChange={() => !disabled && onChange(!value)}
        defaultValue={inputValue}
      />
      <span className="label-text"> {label}</span>
    </label>
  );
};

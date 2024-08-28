import { IconCheckbox } from '@tabler/icons-react';
import { useEffect, useId, useMemo, useState } from 'react';
import { BaseInputProps } from '../../../utils/types/input';
import { ActionButton } from './action-button';

const validate = (
  values: string[],
  { required, min, max }: { required?: boolean; min?: number; max?: number }
) => {
  if (required && !values.length) {
    return false;
  }

  if (min && values.length < min) {
    return false;
  }

  if (max && values.length > max) {
    return false;
  }

  return true;
};

const normalizeValue = (value: Record<string, boolean>) => {
  return Object.entries(value)
    .filter(([, v]) => v)
    .map(([k]) => k);
};

export const ActionCheckboxGroup = ({
  placeholder: label, // in base inputs it's placeholder, for selectables - label
  name,
  button,
  disabled,
  onChange,
  onValidityChange,
  min,
  max,
  description,
  options = [],
  required,
}: Omit<BaseInputProps, 'type'> & {
  onChange?: (value: string[]) => void;
  onValidityChange?: (state: boolean) => void;
}) => {
  const minChoices = min as number;
  const maxChoices = max as number;
  const isStandalone = !!button;
  const finalDescription =
    description ||
    buildDefaultCheckboxGroupDescription({
      min: minChoices,
      max: maxChoices,
    });

  const hasInitiallySelectedOption = useMemo(
    () => options.find((option) => option.selected),
    [options]
  );

  const [state, setState] = useState<{
    value: Record<string, boolean>;
    valid: boolean;
  }>({
    value: Object.fromEntries(
      options.map((option) => [option.value, option.selected ?? false])
    ),
    valid: isStandalone
      ? !!hasInitiallySelectedOption
      : !(required && !hasInitiallySelectedOption),
  });

  const [touched, setTouched] = useState(false);

  useEffect(() => {
    onValidityChange?.(state.valid);
    // calling this once, just to give the idea for the parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extendedChange = (name: string, value: boolean) => {
    setState((prev) => {
      const newValue = { ...prev.value, [name]: value };

      const normalizedValue = normalizeValue(newValue);
      onChange?.(normalizedValue);

      const validity = validate(normalizedValue, {
        required: isStandalone,
        min: minChoices,
        max: maxChoices,
      });

      onValidityChange?.(validity);

      return {
        value: newValue,
        valid: validity,
      };
    });
    setTouched(true);
  };

  const normalizedValue = useMemo(
    () => normalizeValue(state.value),
    [state.value]
  );

  return (
    <div
      className={`py-1.5 ${
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
              <Checkbox
                label={option.label}
                value={state.value[option.value]}
                inputValue={option.value}
                onChange={(value) => extendedChange(option.value, value)}
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
            onClick={() => button.onClick({ [name]: normalizedValue })}
            disabled={
              button.disabled || !normalizedValue.length || !state.valid
            }
          />
        </div>
      )}
      {finalDescription && (
        <div
          className={`text-caption ${
            touched && !state.valid ? 'text-text-error' : 'text-text-secondary'
          } ${isStandalone ? 'mb-2 mt-2.5 px-2' : 'mt-3'}
          `}
        >
          {finalDescription}
        </div>
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

export const Checkbox = ({
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
    <button
      className={`flex h-full gap-2.5 ${
        !disabled ? 'cursor-pointer' : 'cursor-not-allowed'
      }`}
      onClick={() => !disabled && onChange(!value)}
    >
      <div className="flex h-full items-center">
        <input
          type="checkbox"
          name={name}
          className="hidden"
          defaultValue={inputValue}
        />
        <span
          role="checkbox"
          id={id}
          aria-labelledby={labelId}
          className={`mt-0.5 flex aspect-square h-[16px] items-center justify-center rounded-lg border transition-colors motion-reduce:transition-none 
            ${!value && !disabled ? 'border-input-stroke bg-input-bg' : ''}
              ${
                value && !disabled
                  ? 'border-input-stroke-selected bg-input-bg-selected'
                  : ''
              }
              ${
                !value && disabled
                  ? 'border-input-stroke-disabled bg-input-bg'
                  : ''
              }
              ${
                value && disabled
                  ? 'border-input-stroke-disabled bg-input-bg-disabled'
                  : ''
              }
            }
          `}
        >
          <IconCheckbox
            className={`h-full w-full text-input-bg ${
              value ? 'block' : 'hidden'
            }`}
          />
        </span>
      </div>
      <label className="text-text text-text-input" id={labelId}>
        {label}
      </label>
    </button>
  );
};
export const buildDefaultCheckboxGroupDescription = ({
  min,
  max,
}: {
  min?: number;
  max?: number;
}) => {
  if (min && max) return `Select between ${min} and ${max} options`;
  if (min) return `Select minimum ${min} options`;
  if (max) return `Select maximum ${max} options`;
  return null;
};

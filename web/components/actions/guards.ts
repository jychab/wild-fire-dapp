import {
  SelectableParameterType,
  TypedActionParameter,
} from '@solana/actions-spec';

export const isPatternAllowed = (parameter: TypedActionParameter) => {
  return (
    parameter.type !== 'select' &&
    parameter.type !== 'radio' &&
    parameter.type !== 'checkbox'
  );
};

export const isParameterSelectable = (
  parameter: TypedActionParameter
): parameter is TypedActionParameter<SelectableParameterType> => {
  return (
    parameter.type === 'select' ||
    parameter.type === 'radio' ||
    parameter.type === 'checkbox'
  );
};

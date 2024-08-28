import {
  ActionParameterType,
  SelectableParameterType,
  TypedActionParameter,
} from '@solana/actions-spec';
import { BaseButtonProps } from '../../components/blinks/ui/action-button';

export type InputType = ActionParameterType;
export interface BaseInputProps {
  type: InputType;
  placeholder?: string;
  name: string;
  disabled: boolean;
  required?: boolean;
  min?: number | string;
  max?: number | string;
  pattern?: string;
  description?: string;
  button?: BaseButtonProps;
  options?: TypedActionParameter<SelectableParameterType>['options'];
}

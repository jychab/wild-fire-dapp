import { IconCheck } from '@tabler/icons-react';
import { PropsWithChildren } from 'react';

export interface BaseButtonProps {
  text: string | null;
  loading?: boolean;
  variant?: 'default' | 'success' | 'error';
  disabled?: boolean;
  onClick: (params?: Record<string, string | string[]>) => void;
}
export const ActionButton = ({
  text,
  loading,
  disabled,
  variant,
  onClick,
}: BaseButtonProps) => {
  const ButtonContent = () => {
    if (loading)
      return (
        <span className="flex flex-row items-center justify-center gap-2 text-nowrap">
          {text} <div className="loading loading-spinner" />
        </span>
      );
    if (variant === 'success')
      return (
        <span className="flex flex-row items-center justify-center gap-2 text-nowrap">
          {text}
          <IconCheck />
        </span>
      );
    return text;
  };

  return (
    <Button onClick={() => onClick()} disabled={disabled} variant={variant}>
      <span className="min-w-0 truncate">
        <ButtonContent />
      </span>
    </Button>
  );
};

export const Button = ({
  onClick,
  disabled,
  variant = 'default',
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'success' | 'error' | 'default';
} & PropsWithChildren) => {
  return (
    <button
      className={`flex w-full items-center justify-center text-nowrap rounded-button font-semibold transition-colors motion-reduce:transition-none btn btn-sm ${
        variant === 'default' ? 'btn-primary' : ''
      } ${variant === 'error' ? 'btn-error' : ''} ${
        variant === 'success' ? 'btn-success' : ''
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

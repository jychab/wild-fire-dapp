import { Button } from '../Button';
import { CheckIcon, SpinnerDots } from '../icons';
import { BaseButtonProps } from './types';

export const ActionButton = ({
  text,
  loading,
  disabled,
  variant,
  onClick,
  ctaType,
}: BaseButtonProps) => {
  const ButtonContent = () => {
    if (loading)
      return (
        <span className="flex flex-row items-center justify-center gap-2 text-nowrap">
          {text} <SpinnerDots />
        </span>
      );
    if (variant === 'success')
      return (
        <span className="flex flex-row items-center justify-center gap-2 text-nowrap">
          {text}
          <CheckIcon />
        </span>
      );
    return text;
  };

  return (
    <Button
      onClick={() => onClick()}
      disabled={disabled}
      variant={variant}
      ctaType={ctaType}
    >
      <span className="min-w-0 truncate">
        <ButtonContent />
      </span>
    </Button>
  );
};

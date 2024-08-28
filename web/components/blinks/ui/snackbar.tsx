import { ReactNode } from 'react';

type SnackbarVariant = 'warning' | 'error';

interface Props {
  variant?: SnackbarVariant;
  children: ReactNode | ReactNode[];
}

const variantClasses: Record<SnackbarVariant, string> = {
  error: 'bg-error text-error-content border-error',
  warning: 'text-warning-content bg-warning border-warning',
};

export const Snackbar = ({ variant = 'warning', children }: Props) => {
  return (
    <div
      className={`${
        variant == 'warning' ? variantClasses.warning : variantClasses.error
      } rounded-lg border p-2`}
    >
      {children}
    </div>
  );
};

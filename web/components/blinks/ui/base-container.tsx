import { cloneElement } from 'react';
import { Props } from './action-date-input';

export const BaseInputContainer = ({
  children,
  leftAdornment,
  rightAdornment,
  footer,
  description,
  standalone = true,
}: Props) => {
  return (
    <div>
      <div
        className={`relative flex items-center gap-1.5 border transition-colors input-bordered ${
          standalone ? 'rounded-lg' : 'rounded'
        }  p-2 `}
      >
        {leftAdornment && <div>{leftAdornment}</div>}
        {cloneElement(children, {
          className:
            'flex-1 bg-transparent text-base focus-within:outline-none placeholder-gray-400 disabled:text-gray-400',
        })}
        {rightAdornment && <div className="min-w-0">{rightAdornment}</div>}
      </div>
      {footer && <div className="mt-2">{footer}</div>}
      {description && (
        <span className="mt-2 text-sm font-medium text-gray-500 peer-focus-within:text-red-500">
          {description}
        </span>
      )}
    </div>
  );
};

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
        className={`peer relative flex min-h-10 items-center gap-1.5 input input-bordered py-1.5 pl-4 pr-1.5 transition-colors motion-reduce:transition-none 
        `}
      >
        {leftAdornment && <div>{leftAdornment}</div>}
        {cloneElement(children, {
          className: 'flex-1 truncate',
        })}
        {rightAdornment && <div className="min-w-0">{rightAdornment}</div>}
      </div>
      {footer && <div className="mt-2">{footer}</div>}
      {description && <span className="mt-2 font-medium">{description}</span>}
    </div>
  );
};

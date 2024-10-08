'use client';
import { FC } from 'react';

// Reusable InputLabel Component
export const InputLabel: FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}> = ({ label, value, onChange, type = 'text', placeholder, hint }) => (
  <label className="input input-bordered text-base flex items-center gap-2">
    {label}
    <input
      type={type}
      className="grow text-end"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
    {hint && <span>{hint}</span>}
  </label>
);

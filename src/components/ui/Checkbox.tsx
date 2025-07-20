/**
 * Checkbox Component
 * Provides a styled checkbox input with label support
 */

import type { ComponentChildren } from 'preact';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string | ComponentChildren;
  disabled?: boolean;
  indeterminate?: boolean;
  className?: string;
  id?: string;
}

export function Checkbox({
  checked,
  onChange,
  label,
  disabled = false,
  indeterminate = false,
  className = '',
  id,
}: CheckboxProps) {
  const handleChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    onChange(target.checked);
  };

  const checkboxId =
    id || `checkbox-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div class={`flex items-center ${className}`}>
      <div class="relative">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          ref={el => {
            if (el) {
              el.indeterminate = indeterminate;
            }
          }}
          class={`
            w-4 h-4 text-medical-primary bg-white border-gray-300 rounded
            focus:ring-medical-primary focus:ring-2 focus:ring-offset-0
            disabled:opacity-50 disabled:cursor-not-allowed
            ${indeterminate ? 'indeterminate:bg-medical-primary indeterminate:border-medical-primary' : ''}
          `}
        />
        {indeterminate && (
          <svg
            class="absolute top-0 left-0 w-4 h-4 text-white pointer-events-none"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <rect x="4" y="9" width="12" height="2" />
          </svg>
        )}
      </div>
      {label && (
        <label
          htmlFor={checkboxId}
          class={`
            ml-2 text-sm text-medical-text-primary cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {label}
        </label>
      )}
    </div>
  );
}

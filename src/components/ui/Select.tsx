/**
 * Select Component
 * Provides a styled select dropdown input
 */

import type { ComponentChildren } from 'preact';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ComponentChildren;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
  required?: boolean;
}

export function Select({
  value,
  onChange,
  children,
  disabled = false,
  placeholder,
  className = '',
  id,
  required = false,
}: SelectProps) {
  const handleChange = (event: Event) => {
    const target = event.target as HTMLSelectElement;
    onChange(target.value);
  };

  return (
    <select
      id={id}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      required={required}
      class={`
        block w-full px-3 py-2 text-sm
        bg-white border border-gray-300 rounded-md
        text-medical-text-primary
        focus:outline-none focus:ring-2 focus:ring-medical-primary focus:border-medical-primary
        disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
        ${className}
      `}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
  );
}

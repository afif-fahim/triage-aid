/**
 * FileInput Component
 * Provides a styled file input with drag and drop support
 */

import { useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Button } from './Button';

interface FileInputProps {
  onChange: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  children: ComponentChildren;
  className?: string;
  multiple?: boolean;
}

export function FileInput({
  onChange,
  accept,
  disabled = false,
  children,
  className = '',
  multiple = false,
}: FileInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (event: Event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0] || null;
    onChange(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0] || null;
      onChange(file);
    }
  };

  return (
    <div class={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        multiple={multiple}
        class="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        class={`
          relative border-2 border-dashed rounded-lg p-4 text-center
          transition-colors duration-200
          ${
            isDragOver
              ? 'border-medical-primary bg-medical-primary bg-opacity-5'
              : 'border-gray-300 hover:border-gray-400'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={handleClick}
      >
        <div class="space-y-2">
          <svg
            class={`w-8 h-8 mx-auto ${isDragOver ? 'text-medical-primary' : 'text-gray-400'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <div class="text-sm">
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={e => {
                e.stopPropagation();
                handleClick();
              }}
            >
              {children}
            </Button>
          </div>

          <p class="text-xs text-gray-500">or drag and drop a file here</p>

          {accept && (
            <p class="text-xs text-gray-400">Accepted formats: {accept}</p>
          )}
        </div>
      </div>
    </div>
  );
}

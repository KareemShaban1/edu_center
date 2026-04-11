import React from 'react';

interface FormFieldProps {
  label: string;
  id: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}

export function FormField({ label, id, required, children, error }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function FormInput({ id, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { id: string }) {
  return (
    <input
      id={id}
      {...props}
      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
    />
  );
}

export function FormSelect({ id, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { id: string }) {
  const title = props.title ?? id;
  const ariaLabel = props['aria-label'] ?? title;
  return (
    <select
      id={id}
      {...props}
      title={title}
      aria-label={ariaLabel}
      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
    >
      {children}
    </select>
  );
}

export function FormTextarea({ id, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string }) {
  return (
    <textarea
      id={id}
      rows={3}
      {...props}
      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
    />
  );
}

import type { ReactNode } from 'react';

interface StudentFilterFieldProps {
  id: string;
  label: string;
  children: ReactNode;
}

export default function StudentFilterField({ id, label, children }: StudentFilterFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

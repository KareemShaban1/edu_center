import { FormField, FormSelect } from '@/components/FormFields';
import type { SessionOption } from '@/services/endpoints/session-types';

interface SessionLinkFieldProps {
  id: string;
  value: number;
  options: SessionOption[];
  onChange: (sessionId: number) => void;
  label?: string;
}

export default function SessionLinkField({
  id,
  value,
  options,
  onChange,
  label = 'Related session (optional)',
}: SessionLinkFieldProps) {
  return (
    <FormField label={label} id={id}>
      <FormSelect
        id={id}
        value={value || ''}
        onChange={e => onChange(Number(e.target.value))}
      >
        <option value="">—</option>
        {options.map(option => (
          <option key={option.id} value={option.id}>
            {option.topic} ({option.start_at})
          </option>
        ))}
      </FormSelect>
    </FormField>
  );
}

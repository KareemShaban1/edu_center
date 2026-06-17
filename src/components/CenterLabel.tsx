interface CenterLabelProps {
  name?: string | null;
  className?: string;
}

export default function CenterLabel({ name, className = '' }: CenterLabelProps) {
  if (!name) return null;
  return (
    <span className={`inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground ${className}`}>
      {name}
    </span>
  );
}

export function portalRowKey(centerId?: string | number | null, id?: string | number | null): string {
  return `${centerId ?? '0'}-${id ?? '0'}`;
}

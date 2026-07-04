import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  /** Canonical status key used for color mapping (e.g. active, inactive, paid). */
  status: string;
  /** Optional translated label; defaults to a formatted status key. */
  label?: string;
  variant?: 'success' | 'warning' | 'destructive' | 'info' | 'default';
}

const autoVariant = (status: string): StatusBadgeProps['variant'] => {
  const s = status.toLowerCase();
  if (['active', 'present', 'paid', 'completed', 'approved'].includes(s)) return 'success';
  if (['pending', 'late', 'partial', 'draft', 'past_due'].includes(s)) return 'warning';
  if (['inactive', 'absent', 'overdue', 'rejected', 'failed', 'cancelled'].includes(s)) return 'destructive';
  if (['new', 'in_progress', 'processing', 'trial'].includes(s)) return 'info';
  return 'default';
};

const variantClasses: Record<string, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
  default: 'bg-muted text-muted-foreground',
};

export default function StatusBadge({ status, label, variant }: StatusBadgeProps) {
  const v = variant || autoVariant(status);
  const text = label ?? status.replace(/_/g, ' ');
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', variantClasses[v || 'default'])}>
      {text}
    </span>
  );
}

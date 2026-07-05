import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const methodStyles: Record<string, string> = {
  GET: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  POST: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  PUT: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  PATCH: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20',
  DELETE: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
};

export default function ApiMethodBadge({
  method,
  className,
}: {
  method: string;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-mono text-[10px] uppercase tracking-wide',
        methodStyles[method] || 'bg-muted text-muted-foreground',
        className,
      )}
    >
      {method}
    </Badge>
  );
}

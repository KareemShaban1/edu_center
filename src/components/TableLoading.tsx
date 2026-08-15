import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';

interface TableLoadingProps {
  className?: string;
  compact?: boolean;
}

export default function TableLoading({ className, compact }: TableLoadingProps) {
  const { t } = useLocale();

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-muted-foreground',
        compact ? 'py-8' : 'py-14',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
      <span className="text-sm">{t('common.loading')}</span>
    </div>
  );
}

export function TableLoadingRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4">
        <TableLoading />
      </td>
    </tr>
  );
}

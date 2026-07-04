import { useState, type ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useLocale } from '@/contexts/LocaleContext';

interface StudentPageFilterBarProps {
  renderFilters: (idPrefix: string) => ReactNode;
  appliedCount: number;
  onClear: () => void;
  resultCount?: number;
}

export function dateOnly(value: string | null | undefined): string {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

export default function StudentPageFilterBar({
  renderFilters,
  appliedCount,
  onClear,
  resultCount,
}: StudentPageFilterBarProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mb-4 hidden gap-3 md:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {renderFilters('student-filter')}
        {appliedCount > 0 ? (
          <div className="flex items-end">
            <Button type="button" variant="outline" className="w-full" onClick={onClear}>
              {t('filter.clear')}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="mb-4 flex items-center gap-2 md:hidden">
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" />
          {t('filter.title')}
          {appliedCount > 0 ? (
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] tabular-nums">
              {appliedCount}
            </Badge>
          ) : null}
        </Button>
        {resultCount != null ? (
          <span className="text-xs text-muted-foreground">
            {resultCount} {t('crud.results')}
          </span>
        ) : null}
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl pb-8">
          <SheetHeader className="text-start">
            <SheetTitle>{t('filter.title')}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid gap-4">{renderFilters('student-filter-sheet')}</div>
          <SheetFooter className="mt-6 flex-row gap-2 sm:justify-between">
            <Button type="button" variant="outline" className="flex-1" onClick={onClear}>
              {t('filter.clear')}
            </Button>
            <Button type="button" className="flex-1" onClick={() => setOpen(false)}>
              {t('filter.apply')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

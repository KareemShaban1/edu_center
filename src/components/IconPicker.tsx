import { useEffect, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { LUCIDE_ICON_NAMES, resolveLucideIcon } from '@/lib/lucide-icons';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: string;
  onSelect: (iconName: string) => void;
  title?: string;
  description?: string;
  isAr?: boolean;
}

const PAGE_SIZE = 200;

export default function IconPicker({
  open,
  onOpenChange,
  value,
  onSelect,
  title,
  description,
  isAr = false,
}: IconPickerProps) {
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState(value);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setQuery('');
    setVisibleCount(PAGE_SIZE);
  }, [open, value]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LUCIDE_ICON_NAMES;
    return LUCIDE_ICON_NAMES.filter(name => name.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const CurrentIcon = resolveLucideIcon(draft || value);

  const applySelection = (iconName: string) => {
    onSelect(iconName);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!flex h-[min(90vh,52rem)] w-[min(96vw,56rem)] !max-w-none flex-col gap-4 overflow-hidden p-4 sm:p-6">
        <DialogHeader className="shrink-0 space-y-1.5 text-start">
          <DialogTitle>{title || (isAr ? 'اختر أيقونة' : 'Choose an icon')}</DialogTitle>
          <DialogDescription>
            {description || (isAr
              ? `اختر من ${LUCIDE_ICON_NAMES.length} أيقونة Lucide. اضغط على أيقونة لتحديدها.`
              : `Browse all ${LUCIDE_ICON_NAMES.length} Lucide icons. Click an icon to select it.`)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          <div className="relative min-w-[12rem] flex-1">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={isAr ? 'ابحث عن أيقونة…' : 'Search icons…'}
              className="ps-9"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
            <CurrentIcon className="h-5 w-5 text-primary" />
            <span className="font-medium">{draft || value || '—'}</span>
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">
            {visible.length} / {filtered.length}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-border bg-muted/10 p-2">
          {filtered.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              {isAr ? 'لا توجد أيقونات مطابقة' : 'No icons match your search'}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                {visible.map(name => {
                  const Icon = resolveLucideIcon(name);
                  const selected = draft === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      title={name}
                      onClick={() => setDraft(name)}
                      onDoubleClick={() => applySelection(name)}
                      className={cn(
                        'relative flex flex-col items-center gap-1 rounded-lg border p-2 text-[10px] transition',
                        selected
                          ? 'border-primary bg-primary/10 text-primary shadow-sm'
                          : 'border-transparent bg-background text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground',
                      )}
                    >
                      {selected ? (
                        <span className="absolute end-1 top-1 rounded-full bg-primary p-0.5 text-primary-foreground">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                      ) : null}
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      <span className="w-full truncate text-center leading-tight">{name}</span>
                    </button>
                  );
                })}
              </div>

              {hasMore ? (
                <div className="sticky bottom-0 mt-3 flex justify-center bg-gradient-to-t from-background via-background/95 to-transparent pb-1 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setVisibleCount(count => Math.min(count + PAGE_SIZE, filtered.length))}
                  >
                    {isAr
                      ? `عرض المزيد (${filtered.length - visibleCount})`
                      : `Show more (${filtered.length - visibleCount})`}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="ms-2"
                    onClick={() => setVisibleCount(filtered.length)}
                  >
                    {isAr ? 'عرض الكل' : 'Show all'}
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            type="button"
            disabled={!draft}
            onClick={() => applySelection(draft || value)}
          >
            {isAr ? 'استخدام الأيقونة' : 'Use icon'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

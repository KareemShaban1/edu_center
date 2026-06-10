import { useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { ChevronsLeft, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocale } from '@/contexts/LocaleContext';
import { SECTION_CATALOG } from '@/lib/landing/constants';
import type { SectionType } from '@/types/landing';
import { cn } from '@/lib/utils';

interface SectionPaletteProps {
  onAddSection: (type: SectionType) => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function SectionPalette({ onAddSection, collapsed, onToggleCollapsed }: SectionPaletteProps) {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');

  const categories = ['all', ...new Set(SECTION_CATALOG.map(s => s.category))];

  const filtered = SECTION_CATALOG.filter(s => {
    const label = t(s.labelKey).toLowerCase();
    const matchSearch = !search || label.includes(search.toLowerCase());
    const matchCat = category === 'all' || s.category === category;
    return matchSearch && matchCat;
  });

  if (collapsed) {
    return (
      <div className="w-10 border-e bg-muted/30 flex flex-col items-center shrink-0 h-full min-h-0 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleCollapsed}
          title={t('landing.showSections')}
        >
          <LayoutGrid className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 border-e bg-muted/30 flex flex-col shrink-0 h-full min-h-0">
      <div className="p-3 border-b space-y-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm">{t('landing.sections')}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onToggleCollapsed}
            title={t('landing.hideSections')}
          >
            <ChevronsLeft className="w-4 h-4 rtl:rotate-180" />
          </Button>
        </div>
        <div className="relative">
          <LucideIcons.Search className="absolute start-2 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={t('landing.searchSections')}
            className="ps-8 h-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {categories.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                'text-xs px-2 py-0.5 rounded-full border transition-colors',
                category === c ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted',
              )}
            >
              {c === 'all' ? t('landing.all') : c}
            </button>
          ))}
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1">
          {filtered.map(s => {
            const Icon = (LucideIcons as Record<string, React.ElementType>)[s.icon] ?? LucideIcons.Layout;
            return (
              <button
                key={s.type}
                type="button"
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('section-type', s.type);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => onAddSection(s.type)}
                className="w-full flex items-center gap-2 p-2 rounded-md text-sm hover:bg-accent text-start transition-colors"
              >
                <Icon className="w-4 h-4 shrink-0 text-muted-foreground" />
                <span>{t(s.labelKey)}</span>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

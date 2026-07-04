import { GripVertical, Eye, EyeOff, Copy, Trash2, ChevronUp, ChevronDown, ChevronsLeft, ListTree, ScanEye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocale } from '@/contexts/LocaleContext';
import { SECTION_CATALOG } from '@/lib/landing/constants';
import { getSectionLayouts, resolveSectionLayout } from '@/lib/landing/section-layouts';
import type { LandingSection } from '@/types/landing';
import { cn } from '@/lib/utils';

interface SectionListProps {
  sections: LandingSection[];
  selectedId: string | null;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onSelect: (id: string) => void;
  onMove: (from: number, to: number) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onToggleVisible: (id: string) => void;
  onPreview: (section: LandingSection) => void;
}

export function SectionList({
  sections, selectedId, collapsed, onToggleCollapsed,
  onSelect, onMove, onDuplicate, onRemove, onToggleVisible, onPreview,
}: SectionListProps) {
  const { t } = useLocale();
  const sorted = [...sections].sort((a, b) => a.order - b.order);

  if (collapsed) {
    return (
      <div className="w-10 border-e bg-muted/20 flex flex-col items-center shrink-0 h-full min-h-0 py-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onToggleCollapsed}
          title={t('landing.showStructure')}
        >
          <ListTree className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-72 border-e bg-muted/20 flex flex-col shrink-0 h-full min-h-0">
      <div className="p-3 border-b shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-sm">{t('landing.pageStructure')}</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={onToggleCollapsed}
            title={t('landing.hideStructure')}
          >
            <ChevronsLeft className="w-4 h-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-2 space-y-1" dir="rtl">
          {sorted.map((section, index) => {
            const meta = SECTION_CATALOG.find(s => s.type === section.type);
            const customTitle = section.type === 'custom'
              ? (section.content.title as { en?: string; ar?: string } | undefined)
              : undefined;
            const label = section.type === 'custom' && customTitle
              ? (customTitle.en || customTitle.ar || t('landing.section.custom'))
              : meta ? t(meta.labelKey) : section.type;
            const heroLayoutLabel = section.type === 'hero'
              ? getSectionLayouts('hero').find(o => o.value === resolveSectionLayout(section))?.labelKey
              : undefined;
            return (
              <div
                key={section.id}
                draggable
                onDragStart={e => {
                  e.dataTransfer.setData('section-index', String(index));
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault();
                  const from = Number(e.dataTransfer.getData('section-index'));
                  if (!Number.isNaN(from) && from !== index) onMove(from, index);
                  const type = e.dataTransfer.getData('section-type');
                  if (type) {
                    // handled by parent drop zone
                  }
                }}
                className={cn(
                  'group flex items-center gap-1 p-2 rounded-md text-sm cursor-pointer transition-colors',
                  selectedId === section.id ? 'bg-primary/10 ring-1 ring-primary' : 'hover:bg-accent',
                  !section.visible && 'opacity-50',
                )}
                onClick={() => onSelect(section.id)}
              >
                <GripVertical className="w-3 h-3 shrink-0 text-muted-foreground cursor-grab" />
                <div className="min-w-0 flex-1">
                  <span className="block truncate">{label}</span>
                  {heroLayoutLabel && (
                    <span className="block truncate text-[10px] text-muted-foreground">{t(heroLayoutLabel)}</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  title={t('landing.sectionPreview')}
                  onClick={e => { e.stopPropagation(); onPreview(section); }}
                >
                  <ScanEye className="w-3 h-3" />
                </Button>
                <div className="hidden group-hover:flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); onMove(index, index - 1); }} disabled={index === 0}>
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); onMove(index, index + 1); }} disabled={index === sorted.length - 1}>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); onToggleVisible(section.id); }}>
                    {section.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); onDuplicate(section.id); }}>
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={e => { e.stopPropagation(); onRemove(section.id); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

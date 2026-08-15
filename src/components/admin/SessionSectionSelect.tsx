import { useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';

export interface SessionSectionOption {
  id: number;
  name: string;
  class_id: number;
  grade_id: number;
}

export default function SessionSectionSelect({
  id,
  sections,
  grades,
  classes,
  value,
  onChange,
}: {
  id: string;
  sections: SessionSectionOption[];
  grades: Array<{ id: number; name: string }>;
  classes: Array<{ id: number; name: string; grade_id: number }>;
  value: number;
  onChange: (sectionId: number) => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  const groups = useMemo(() => {
    const className = (classId: number) => classes.find(c => c.id === classId)?.name || '';
    const gradeName = (gradeId: number) => grades.find(g => g.id === gradeId)?.name || '';

    const byKey = new Map<string, { heading: string; items: SessionSectionOption[] }>();
    for (const section of sections) {
      const heading = [gradeName(section.grade_id), className(section.class_id)].filter(Boolean).join(' — ') || t('col.section');
      const key = `${section.grade_id}-${section.class_id}`;
      if (!byKey.has(key)) {
        byKey.set(key, { heading, items: [] });
      }
      byKey.get(key)!.items.push(section);
    }

    return Array.from(byKey.values()).sort((a, b) => a.heading.localeCompare(b.heading));
  }, [sections, grades, classes, t]);

  const selected = sections.find(s => s.id === value);
  const selectedLabel = selected
    ? [
        grades.find(g => g.id === selected.grade_id)?.name,
        classes.find(c => c.id === selected.class_id)?.name,
        selected.name,
      ].filter(Boolean).join(' — ')
    : '';

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-auto min-h-10 w-full justify-between px-3 py-2.5 font-normal"
        >
          <span className={cn('truncate text-start', !selectedLabel && 'text-muted-foreground')}>
            {selectedLabel || t('form.selectSection')}
          </span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[80] w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={t('page.sectionsAdmin.searchPlaceholder')} />
          <CommandList>
            <CommandEmpty>{t('page.sectionsAdmin.emptySearch')}</CommandEmpty>
            {groups.map(group => (
              <CommandGroup key={group.heading} heading={group.heading}>
                {group.items.map(section => (
                  <CommandItem
                    key={section.id}
                    value={`${group.heading} ${section.name} ${section.id}`}
                    onSelect={() => {
                      onChange(section.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('me-2 h-4 w-4', value === section.id ? 'opacity-100' : 'opacity-0')} />
                    {section.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

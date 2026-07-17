import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/contexts/LocaleContext';
import type { ParentChildTabOption } from '@/hooks/use-parent-child-tabs';

interface ParentChildTabsBarProps {
  tabs: ParentChildTabOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export default function ParentChildTabsBar({
  tabs,
  value,
  onValueChange,
  className,
}: ParentChildTabsBarProps) {
  const { t } = useLocale();

  if (tabs.length <= 1) return null;

  return (
    <div className={className ?? 'mb-4'}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t('stat.children')}
      </p>
      <Tabs value={value} onValueChange={onValueChange} className="w-full">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1">
          {tabs.map(child => (
            <TabsTrigger
              key={child.id}
              value={child.id}
              className="max-w-[12rem] shrink-0 truncate rounded-lg px-3 py-2 text-xs data-[state=active]:shadow-sm sm:text-sm"
            >
              {child.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

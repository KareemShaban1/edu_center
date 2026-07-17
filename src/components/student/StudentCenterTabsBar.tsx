import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/contexts/LocaleContext';
import type { StudentCenterTabOption } from '@/hooks/use-student-center-tabs';

interface StudentCenterTabsBarProps {
  centers: StudentCenterTabOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export default function StudentCenterTabsBar({
  centers,
  value,
  onValueChange,
  className,
}: StudentCenterTabsBarProps) {
  const { t } = useLocale();

  if (centers.length <= 1) return null;

  return (
    <div className={className ?? 'mb-4'}>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t('student.myCenters')}
      </p>
      <Tabs value={value} onValueChange={onValueChange} className="w-full">
        <TabsList className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-xl bg-muted/50 p-1">
          {centers.map(center => (
            <TabsTrigger
              key={center.id}
              value={center.id}
              className="max-w-[12rem] shrink-0 truncate rounded-lg px-3 py-2 text-xs data-[state=active]:shadow-sm sm:text-sm"
            >
              {center.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

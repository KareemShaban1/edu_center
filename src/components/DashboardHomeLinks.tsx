import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';

interface DashboardHomeLinkItem {
  labelKey: string;
  path: string;
}

interface DashboardHomeLinksProps {
  mainLinks: DashboardHomeLinkItem[];
  extraLinks?: DashboardHomeLinkItem[];
}

export default function DashboardHomeLinks({ mainLinks, extraLinks = [] }: DashboardHomeLinksProps) {
  const { t } = useLocale();

  return (
    <div className="mb-6 space-y-3 hidden md:block">
      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-2 pb-1">
          {mainLinks.map(link => (
            <Button key={link.path} asChild size="sm" className="rounded-full">
              <Link to={link.path}>{t(link.labelKey)}</Link>
            </Button>
          ))}
        </div>
      </div>

      {extraLinks.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3 shadow-card">
          <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{t('misc.moreLinks')}</div>
          <div className="flex flex-wrap gap-2">
            {extraLinks.map(link => (
              <Button key={link.path} asChild size="sm" variant="outline" className="rounded-full">
                <Link to={link.path}>{t(link.labelKey)}</Link>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


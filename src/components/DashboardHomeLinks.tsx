import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { LayoutGrid } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

export interface DashboardHomeLinkItem {
  labelKey: string;
  path: string;
  icon?: LucideIcon;
}

export interface DashboardHomeLinkGroup {
  labelKey: string;
  links: DashboardHomeLinkItem[];
}

interface DashboardHomeLinksProps {
  mainLinks: DashboardHomeLinkItem[];
  extraLinkGroups?: DashboardHomeLinkGroup[];
  extraLinks?: DashboardHomeLinkItem[];
  className?: string;
}

export default function DashboardHomeLinks({
  mainLinks,
  extraLinkGroups = [],
  extraLinks = [],
  className,
}: DashboardHomeLinksProps) {
  const { t } = useLocale();

  const hasModalLinks = extraLinkGroups.length > 0 || extraLinks.length > 0;
  const flatExtras = extraLinkGroups.length > 0
    ? extraLinkGroups.flatMap(g => g.links)
    : extraLinks;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 sm:items-center">
        {mainLinks.map(link => {
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                buttonVariants({ size: 'sm' }),
                'h-auto min-h-9 w-full gap-1.5 whitespace-normal rounded-full px-3 py-2.5 text-sm shadow-sm sm:w-auto',
              )}
            >
              {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
              <span className="min-w-0 leading-tight">{t(link.labelKey)}</span>
            </Link>
          );
        })}

        {hasModalLinks && (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-auto min-h-9 w-full gap-1.5 whitespace-normal rounded-full border-dashed px-3 py-2.5 text-sm sm:w-auto"
              >
                <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
                <span>{t('dashboard.openAllSections')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>{t('dashboard.sectionsModalTitle')}</DialogTitle>
                <DialogDescription>{t('dashboard.sectionsModalDesc')}</DialogDescription>
              </DialogHeader>

              {extraLinkGroups.length > 0 ? (
                <div className="space-y-5">
                  {extraLinkGroups.map(group => (
                    <div key={group.labelKey}>
                      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {t(group.labelKey)}
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {group.links.map(link => {
                          const Icon = link.icon;
                          return (
                            <Link
                              key={link.path}
                              to={link.path}
                              className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm font-medium shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:shadow-md"
                            >
                              {Icon && (
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                                  <Icon className="h-4 w-4" />
                                </span>
                              )}
                              <span className="truncate">{t(link.labelKey)}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {flatExtras.map(link => (
                    <Button key={link.path} asChild variant="outline" className="h-auto justify-start rounded-xl py-3">
                      <Link to={link.path}>{t(link.labelKey)}</Link>
                    </Button>
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}

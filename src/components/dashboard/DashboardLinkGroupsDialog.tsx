import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export interface DashboardLinkGroupItem {
  labelKey: string;
  path: string;
  icon?: LucideIcon;
}

export interface DashboardLinkGroup {
  labelKey: string;
  links: DashboardLinkGroupItem[];
}

interface DashboardLinkGroupsDialogProps {
  linkGroups: DashboardLinkGroup[];
  triggerClassName?: string;
  triggerVariant?: 'default' | 'outline' | 'ghost';
  showLabel?: boolean;
}

export default function DashboardLinkGroupsDialog({
  linkGroups,
  triggerClassName,
  triggerVariant = 'outline',
  showLabel = true,
}: DashboardLinkGroupsDialogProps) {
  const { t } = useLocale();

  if (linkGroups.length === 0) {
    return null;
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant={triggerVariant}
          className={cn('h-9 gap-1.5 shrink-0', triggerClassName)}
        >
          <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden />
          {showLabel ? <span className="hidden sm:inline">{t('dashboard.openAllSections')}</span> : null}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('dashboard.sectionsModalTitle')}</DialogTitle>
          <DialogDescription>{t('dashboard.sectionsModalDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {linkGroups.map(group => (
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
                      {Icon ? (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                          <Icon className="h-4 w-4" />
                        </span>
                      ) : null}
                      <span className="truncate">{t(link.labelKey)}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

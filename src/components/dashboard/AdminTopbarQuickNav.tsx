import { Link } from 'react-router-dom';
import DashboardLinkGroupsDialog from '@/components/dashboard/DashboardLinkGroupsDialog';
import { adminLinkGroups, adminMainLinks } from '@/config/admin-dashboard-links';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

export default function AdminTopbarQuickNav() {
  const { t } = useLocale();

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden lg:gap-2">
      {/* <div className="hidden min-w-0 items-center gap-1 md:flex">
        {adminMainLinks.map(link => {
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted',
              )}
            >
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="hidden lg:inline">{t(link.labelKey)}</span>
            </Link>
          );
        })}
      </div> */}

      <DashboardLinkGroupsDialog
        linkGroups={adminLinkGroups}
        triggerVariant="outline"
        triggerClassName="border-dashed"
      />
    </div>
  );
}

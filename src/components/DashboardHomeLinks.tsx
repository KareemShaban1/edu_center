import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import DashboardLinkGroupsDialog, {
  type DashboardLinkGroup,
  type DashboardLinkGroupItem,
} from '@/components/dashboard/DashboardLinkGroupsDialog';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

export type DashboardHomeLinkItem = DashboardLinkGroupItem;
export type DashboardHomeLinkGroup = DashboardLinkGroup;

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
  const modalGroups: DashboardHomeLinkGroup[] = extraLinkGroups.length > 0
    ? extraLinkGroups
    : extraLinks.length > 0
      ? [{ labelKey: 'dashboard.openAllSections', links: extraLinks }]
      : [];

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
          <DashboardLinkGroupsDialog
            linkGroups={modalGroups}
            triggerClassName="h-auto min-h-9 w-full gap-1.5 whitespace-normal rounded-full border-dashed px-3 py-2.5 text-sm sm:w-auto"
          />
        )}
      </div>
    </div>
  );
}

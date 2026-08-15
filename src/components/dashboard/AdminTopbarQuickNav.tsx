import DashboardLinkGroupsDialog from '@/components/dashboard/DashboardLinkGroupsDialog';
import { adminLinkGroups } from '@/config/admin-dashboard-links';
import { useAuth } from '@/contexts/AuthContext';
import { filterByAdminAccess } from '@/lib/admin-permissions';

export default function AdminTopbarQuickNav() {
  const { user } = useAuth();

  const linkGroups = adminLinkGroups
    .map(group => ({ ...group, links: filterByAdminAccess(group.links, user) }))
    .filter(group => group.links.length > 0);

  if (linkGroups.length === 0) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden lg:gap-2">
      <DashboardLinkGroupsDialog
        linkGroups={linkGroups}
        triggerVariant="outline"
        triggerClassName="border-dashed"
      />
    </div>
  );
}

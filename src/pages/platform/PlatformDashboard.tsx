import DashboardLayout from '@/components/DashboardLayout';
import DashboardHomeLinks from '@/components/DashboardHomeLinks';
import StatCard from '@/components/StatCard';
import DataTable from '@/components/DataTable';
import { Globe, Users, Activity, Shield, CreditCard } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/services/endpoints/dashboard';
import type { DashboardItem, DashboardStat } from '@/types/models';

const iconMap = {
  globe: Globe,
  users: Users,
  activity: Activity,
  shield: Shield,
  'credit-card': CreditCard,
};

export default function PlatformDashboard() {
  const { t } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'super_admin'],
    queryFn: () => dashboardApi.getByRole('super_admin'),
  });

  const stats: DashboardStat[] = data?.stats || [];
  const recentTenants: DashboardItem[] = data?.sections.find(s => s.key === 'recent_tenants')?.items || [];
  const activityItems: DashboardItem[] = data?.sections.find(s => s.key === 'activity')?.items || [];

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('dashboard.superAdmin')}</h1>
        <p className="page-description">{t('dashboard.superAdmin.desc')}</p>
      </div>

      <DashboardHomeLinks
        mainLinks={[
          { labelKey: 'nav.tenants', path: '/platform/tenants' },
          { labelKey: 'nav.subscriptions', path: '/platform/subscriptions' },
          { labelKey: 'nav.users', path: '/platform/users' },
        ]}
        extraLinks={[
          { labelKey: 'nav.roles', path: '/platform/roles' },
          { labelKey: 'nav.activityLogs', path: '/platform/logs' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {isLoading ? (
          <>
            <StatCard title={t('stat.totalTenants')} value="..." icon={Globe} />
            <StatCard title={t('stat.activeUsers')} value="..." icon={Users} />
            <StatCard title={t('nav.subscriptions')} value="..." icon={CreditCard} />
            <StatCard title={t('stat.apiCalls')} value="..." icon={Activity} />
          </>
        ) : (
          stats.map(s => {
            const Icon = iconMap[s.icon as keyof typeof iconMap] || Shield;
            return (
              <StatCard
                key={s.id}
                title={s.title}
                value={s.value}
                icon={Icon}
                trend={s.trend}
                variant={s.variant}
              />
            );
          })
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-display font-semibold">{data?.sections.find(s => s.key === 'recent_tenants')?.title || t('section.recentTenants')}</h3>
          <DataTable
            searchable
            columns={[
              { key: 'name', label: t('col.name') },
              { key: 'domain', label: t('col.domain') },
              { key: 'status', label: t('col.status'), render: (item) => (
                <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                  {String(item.status)}
                </span>
              )},
            ]}
            data={recentTenants.map(item => ({
              name: item.title,
              domain: item.subtitle || '-',
              status: item.status || 'active',
            }))}
          />
        </div>

        <div>
          <h3 className="mb-3 font-display font-semibold">{data?.sections.find(s => s.key === 'activity')?.title || t('section.recentActivity')}</h3>
          <div className="space-y-2">
            {activityItems.map(item => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-card">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
                    <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-sm">{item.title}</span>
                </div>
                <span className="text-xs text-muted-foreground">{item.meta}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import DashboardLayout from '@/components/DashboardLayout';
import ParentDashboardHero from '@/components/dashboard/ParentDashboardHero';
import DashboardStatCard from '@/components/dashboard/DashboardStatCard';
import StatusBadge from '@/components/StatusBadge';
import { Users, CalendarCheck, DollarSign, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useParentBootstrap } from '@/hooks/use-parent-bootstrap';
import { parentLinkGroups, parentMainLinks } from '@/config/parent-dashboard-links';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';

function feeStatusLabel(status: string, t: (key: string) => string) {
  const keys: Record<string, string> = {
    paid: 'payments.status.paid',
    pending: 'payments.status.pending',
    unpaid: 'payments.status.unpaid',
  };
  return keys[status] ? t(keys[status]) : status;
}

export default function ParentDashboard() {
  const { user } = useAuth();
  const { t } = useLocale();
  const { data, isLoading } = useParentBootstrap();

  const children = data?.children || [];
  const attendanceRows = data?.attendance || [];
  const feeRows = data?.fees || [];
  const reportsCount = data?.reports?.length || 0;

  const avgAttendance = useMemo(() => {
    if (attendanceRows.length === 0) return 0;
    return (attendanceRows.filter(a => a.status === 'present' || a.status === 'late').length / attendanceRows.length) * 100;
  }, [attendanceRows]);

  const pendingFees = useMemo(() => {
    return feeRows
      .filter(f => f.status === 'pending' || f.status === 'unpaid')
      .reduce((sum, f) => sum + f.amount, 0);
  }, [feeRows]);

  const recentPayments = useMemo(() => feeRows.slice(0, 6), [feeRows]);

  const skeletonStats = [
    { id: 'children', title: t('stat.children'), icon: Users, variant: 'students' as const },
    { id: 'attendance', title: t('stat.avgAttendance'), icon: CalendarCheck, variant: 'attendance' as const },
    { id: 'pending_fees', title: t('stat.pendingFees'), icon: DollarSign, variant: 'finance' as const },
    { id: 'reports', title: t('nav.reports'), icon: FileText, variant: 'exams' as const },
  ];

  const stats = isLoading
    ? null
    : [
        { id: 'children', title: t('stat.children'), value: String(children.length), icon: Users, variant: 'students' as const },
        { id: 'attendance', title: t('stat.avgAttendance'), value: `${avgAttendance.toFixed(1)}%`, icon: CalendarCheck, variant: 'attendance' as const },
        { id: 'pending_fees', title: t('stat.pendingFees'), value: `${pendingFees.toLocaleString()}`, icon: DollarSign, variant: 'finance' as const },
        { id: 'reports', title: t('nav.reports'), value: String(reportsCount), icon: FileText, variant: 'exams' as const },
      ];

  return (
    <DashboardLayout>
      <div className="min-w-0 max-w-full overflow-x-hidden">
        <ParentDashboardHero
          userName={user?.name}
          mainLinks={parentMainLinks}
          linkGroups={parentLinkGroups}
        />

        <div className="mb-6 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          {isLoading
            ? skeletonStats.map((s, i) => (
                <DashboardStatCard
                  key={s.id}
                  title={s.title}
                  value="—"
                  icon={s.icon}
                  statKey={s.id}
                  variant={s.variant}
                  index={i}
                  loading
                />
              ))
            : stats?.map((s, i) => (
                <DashboardStatCard
                  key={s.id}
                  title={s.title}
                  value={s.value}
                  icon={s.icon}
                  statKey={s.id}
                  variant={s.variant}
                  index={i}
                />
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
          >
            <h3 className="mb-3 font-display font-semibold">{t('section.childrenOverview')}</h3>
            {children.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                {t('crud.noData')}
              </p>
            ) : (
              <div className="space-y-3">
                {children.map((child, i) => (
                  <motion.div
                    key={portalRowKey(child.center_id, child.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-md"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                        {child.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-medium">{child.name}</h4>
                          <CenterLabel name={child.center_name} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {child.grade} - {child.class} - {child.section}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{t('nav.attendance')}</p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div> */}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.45 }}
          >
            <h3 className="mb-3 font-display font-semibold">{t('section.recentPayments')}</h3>
            {recentPayments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                {t('crud.noData')}
              </p>
            ) : (
              <div className="space-y-2">
                {recentPayments.map((f, i) => (
                  <motion.div
                    key={portalRowKey(f.center_id, f.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 + i * 0.05 }}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-card sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{f.item} - {f.student_name}</span>
                        <CenterLabel name={f.center_name} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        ${f.amount.toLocaleString()} - {f.due_date}
                      </p>
                    </div>
                    <StatusBadge
                      status={f.status === 'paid' ? 'paid' : 'pending'}
                      label={feeStatusLabel(f.status, t)}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}

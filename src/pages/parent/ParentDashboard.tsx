import DashboardLayout from '@/components/DashboardLayout';
import DashboardHomeLinks from '@/components/DashboardHomeLinks';
import StatCard from '@/components/StatCard';
import { Users, CalendarCheck, DollarSign, FileText } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useParentBootstrap } from '@/hooks/use-parent-bootstrap';

export default function ParentDashboard() {
  const { t } = useLocale();
  const { data, isLoading } = useParentBootstrap();
  const children = data?.children || [];
  const attendanceRows = data?.attendance || [];
  const feeRows = data?.fees || [];
  const avgAttendance = attendanceRows.length > 0
    ? (attendanceRows.filter(a => a.status === 'present' || a.status === 'late').length / attendanceRows.length) * 100
    : 0;
  const pendingFees = feeRows
    .filter(f => f.status === 'pending' || f.status === 'unpaid')
    .reduce((sum, f) => sum + f.amount, 0);
  const recentPayments = feeRows.slice(0, 6);
  const reportsCount = data?.reports?.length || 0;

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('dashboard.parent')}</h1>
        <p className="page-description">{t('dashboard.parent.desc')}</p>
      </div>

      <DashboardHomeLinks
        mainLinks={[
          { labelKey: 'nav.children', path: '/parent/children' },
          { labelKey: 'nav.attendance', path: '/parent/attendance' },
          { labelKey: 'nav.fees_short', path: '/parent/fees' },
        ]}
        extraLinks={[
          { labelKey: 'nav.quizzes', path: '/parent/quizzes' },
          { labelKey: 'nav.exams', path: '/parent/exams' },
          { labelKey: 'nav.reports', path: '/parent/reports' },
        ]}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {isLoading ? (
          <>
            <StatCard title={t('stat.children')} value="..." icon={Users} />
            <StatCard title={t('stat.avgAttendance')} value="..." icon={CalendarCheck} />
            <StatCard title={t('stat.pendingFees')} value="..." icon={DollarSign} />
            <StatCard title={t('nav.reports')} value="..." icon={FileText} />
          </>
        ) : (
          <>
            <StatCard title={t('stat.children')} value={String(children.length)} icon={Users} />
            <StatCard title={t('stat.avgAttendance')} value={`${avgAttendance.toFixed(1)}%`} icon={CalendarCheck} variant="attendance" />
            <StatCard title={t('stat.pendingFees')} value={`$${pendingFees.toLocaleString()}`} icon={DollarSign} variant="finance" />
            <StatCard title={t('nav.reports')} value={String(reportsCount)} icon={FileText} />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-3 font-display font-semibold">{t('section.childrenOverview')}</h3>
          <div className="space-y-3">
            {children.map(child => (
              <div key={child.id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {child.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-medium">{child.name}</h4>
                    <p className="text-xs text-muted-foreground">{child.grade} - {child.class} - {child.section}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{t('nav.attendance')}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="mb-3 font-display font-semibold">{t('section.recentPayments')}</h3>
          <div className="space-y-2">
            {recentPayments.map(f => (
              <div key={f.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-card">
                <div>
                  <span className="text-sm font-medium">{f.item} - {f.student_name}</span>
                  <p className="text-xs text-muted-foreground">${f.amount.toLocaleString()} - {f.due_date}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  f.status === 'paid' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}>
                  {f.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

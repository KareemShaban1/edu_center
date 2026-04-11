import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { GraduationCap, DollarSign, CalendarCheck, TrendingUp } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useQuery } from '@tanstack/react-query';
import { adminReportsApi } from '@/services/endpoints/admin-reports';

export default function AdminReports() {
  const { t } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports'],
    queryFn: () => adminReportsApi.get(),
  });
  const reportStats = data?.stats;
  const studentsCount = Number(reportStats?.students || 0);
  const attendanceRate = Number(reportStats?.attendance_rate || 0);
  const collectedAmount = Number(reportStats?.collected_amount || 0);
  const reportsCount = Number((data?.available_reports || []).length);

  const reportCards = [
    { title: t('stat.totalStudents'), value: studentsCount.toLocaleString(), icon: GraduationCap },
    { title: t('stat.avgAttendance'), value: `${attendanceRate.toFixed(1)}%`, icon: CalendarCheck, variant: 'attendance' as const },
    { title: t('stat.revenue'), value: `$${collectedAmount.toLocaleString()}`, icon: DollarSign, variant: 'finance' as const },
    { title: t('nav.reports'), value: reportsCount.toLocaleString(), icon: TrendingUp, variant: 'exams' as const },
  ];

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('nav.reports')}</h1>
        <p className="page-description">{t('page.reports.desc')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {reportCards.map(s => <StatCard key={s.title} {...s} />)}
      </div>

      {isLoading && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground mb-6">
          Loading reports...
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">{t('nav.attendance')}</h3>
          <div className="space-y-3">
            {(data?.attendance_by_grade || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('crud.noData')}</p>
            ) : (data?.attendance_by_grade || []).map(g => (
              <div key={g.grade_id}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{g.grade_name}</span>
                  <span className="font-medium">{g.rate}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-success transition-all" style={{ width: `${g.rate}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="font-display font-semibold mb-4">{t('stat.revenue')}</h3>
          <div className="space-y-3">
            {(data?.revenue_breakdown || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('crud.noData')}</p>
            ) : (() => {
              const total = (data?.revenue_breakdown || []).reduce((s, r) => s + Number(r.collected || 0), 0);
              return (data?.revenue_breakdown || []).map(f => {
                const pct = total > 0 ? (Number(f.collected || 0) / total) * 100 : 0;
                return (
              <div key={f.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{f.type.replace(/[_-]+/g, ' ')}</span>
                  <span className="font-medium">${Number(f.collected || 0).toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
                );
              });
            })()}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-card mt-6">
        <h3 className="font-display font-semibold mb-4">{t('nav.reports')}</h3>
        {(data?.available_reports || []).length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('crud.noData')}</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.available_reports || []).map(report => (
              <div key={report.key} className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                <div className="text-sm font-medium">{report.title}</div>
                <div className="text-xs text-muted-foreground">{report.count.toLocaleString()} records</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

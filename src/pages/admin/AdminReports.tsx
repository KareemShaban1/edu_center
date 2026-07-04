import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import StatCard from '@/components/StatCard';
import { GraduationCap, DollarSign, CalendarCheck, ClipboardList } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useQuery } from '@tanstack/react-query';
import { ADMIN_REPORT_TYPES, adminReportsApi } from '@/services/endpoints/admin-reports';

const REPORT_LINKS = [
  { type: 'attendance' as const, titleKey: 'nav.reportsAttendance', descKey: 'page.reports.attendance.desc', icon: CalendarCheck, variant: 'attendance' as const },
  { type: 'exams' as const, titleKey: 'nav.reportsExams', descKey: 'page.reports.exams.desc', icon: ClipboardList, variant: 'exams' as const },
  { type: 'quizzes' as const, titleKey: 'nav.reportsQuizzes', descKey: 'page.reports.quizzes.desc', icon: ClipboardList, variant: 'exams' as const },
  { type: 'payments' as const, titleKey: 'nav.reportsPayments', descKey: 'page.reports.payments.desc', icon: DollarSign, variant: 'finance' as const },
];

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
  const examRecords = Number(reportStats?.exam_records || 0);

  const reportCards = [
    { title: t('stat.totalStudents'), value: studentsCount.toLocaleString(), icon: GraduationCap },
    { title: t('stat.avgAttendance'), value: `${attendanceRate.toFixed(1)}%`, icon: CalendarCheck, variant: 'attendance' as const },
    { title: t('stat.revenue'), value: `$${collectedAmount.toLocaleString()}`, icon: DollarSign, variant: 'finance' as const },
    { title: t('nav.reportsExams'), value: examRecords.toLocaleString(), icon: ClipboardList, variant: 'exams' as const },
  ];

  const countForType = (type: string) => {
    const found = (data?.available_reports || []).find(r => r.key === type);
    return found?.count ?? 0;
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('nav.reports')}</h1>
        <p className="page-description">{t('page.reports.desc')}</p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {reportCards.map(s => <StatCard key={s.title} {...s} />)}
      </div>

      {isLoading && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          {t('reports.loading')}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REPORT_LINKS.map(link => {
          const Icon = link.icon;
          return (
            <Link
              key={link.type}
              to={`/admin/reports/${link.type}`}
              className="rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40 hover:bg-muted/20"
            >
              <div className="mb-3 flex items-center gap-2">
                <Icon className="h-5 w-5 text-primary" />
                <h3 className="font-display font-semibold">{t(link.titleKey)}</h3>
              </div>
              <p className="mb-2 text-sm text-muted-foreground">{t(link.descKey)}</p>
              <p className="text-xs text-muted-foreground">
                {countForType(link.type === 'payments' ? 'payments' : link.type).toLocaleString()} {t('reports.totalRecords').toLowerCase()}
              </p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-semibold">{t('nav.reportsAttendance')}</h3>
            <Link to="/admin/reports/attendance" className="text-sm text-primary hover:underline">{t('crud.view')}</Link>
          </div>
          <div className="space-y-3">
            {(data?.attendance_by_grade || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('crud.noData')}</p>
            ) : (data?.attendance_by_grade || []).map(g => (
              <div key={g.grade_id}>
                <div className="mb-1 flex justify-between text-sm">
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
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display font-semibold">{t('nav.reportsPayments')}</h3>
            <Link to="/admin/reports/payments" className="text-sm text-primary hover:underline">{t('crud.view')}</Link>
          </div>
          <div className="space-y-3">
            {(data?.revenue_breakdown || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('crud.noData')}</p>
            ) : (() => {
              const total = (data?.revenue_breakdown || []).reduce((s, r) => s + Number(r.collected || 0), 0);
              return (data?.revenue_breakdown || []).map(f => {
                const pct = total > 0 ? (Number(f.collected || 0) / total) * 100 : 0;
                return (
                  <div key={f.type}>
                    <div className="mb-1 flex justify-between text-sm">
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
    </DashboardLayout>
  );
}

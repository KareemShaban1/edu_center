import { Link, Navigate, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import StatCard from '@/components/StatCard';
import { dateOnly } from '@/components/student/StudentPageFilterBar';
import { CalendarCheck, ClipboardList, DollarSign, TrendingUp } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useAdminScopeFilterState } from '@/hooks/use-admin-scope-filters';
import { useQuery } from '@tanstack/react-query';
import {
  ADMIN_REPORT_TYPES,
  adminReportsApi,
  type AdminReportType,
} from '@/services/endpoints/admin-reports';

const REPORT_META: Record<AdminReportType, {
  titleKey: string;
  descKey: string;
  icon: typeof CalendarCheck;
  variant?: 'attendance' | 'finance' | 'exams';
}> = {
  attendance: {
    titleKey: 'nav.reportsAttendance',
    descKey: 'page.reports.attendance.desc',
    icon: CalendarCheck,
    variant: 'attendance',
  },
  exams: {
    titleKey: 'nav.reportsExams',
    descKey: 'page.reports.exams.desc',
    icon: ClipboardList,
    variant: 'exams',
  },
  quizzes: {
    titleKey: 'nav.reportsQuizzes',
    descKey: 'page.reports.quizzes.desc',
    icon: ClipboardList,
    variant: 'exams',
  },
  payments: {
    titleKey: 'nav.reportsPayments',
    descKey: 'page.reports.payments.desc',
    icon: DollarSign,
    variant: 'finance',
  },
};

function formatStatValue(key: string, value: number, t: (k: string) => string) {
  if (key === 'attendance_rate') return `${value.toFixed(1)}%`;
  if (key === 'collected_amount' || key === 'fees_total') return `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  if (key === 'average_degree') return value.toFixed(1);
  return value.toLocaleString();
}

function statLabelKey(key: string): string {
  const map: Record<string, string> = {
    total_records: 'reports.totalRecords',
    attendance_rate: 'stat.attendanceRate',
    present_count: 'reports.presentCount',
    absent_count: 'reports.absentCount',
    average_degree: 'stat.avgGrade',
    collected_amount: 'stat.revenue',
    payments_count: 'reports.paymentsCount',
    unpaid_count: 'stat.unpaidStudents',
    fees_total: 'reports.feesTotal',
  };
  return map[key] || key;
}

export default function AdminReportDetail() {
  const { type } = useParams<{ type: string }>();
  const { t } = useLocale();
  const reportType = type && ADMIN_REPORT_TYPES.includes(type as AdminReportType)
    ? (type as AdminReportType)
    : null;

  const { data: bootstrap } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;

  const {
    gradeFilter,
    classFilter,
    sectionFilter,
    dateFilter,
    setDateFilter,
    setSectionFilter,
    classesByGrade,
    sectionsByClass,
    appliedCount,
    clearFilters,
    handleGradeChange,
    handleClassChange,
  } = useAdminScopeFilterState(grades, classes, sections);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', reportType],
    queryFn: () => adminReportsApi.getByType(reportType!),
    enabled: !!reportType && reportType !== 'payments' && reportType !== 'attendance',
  });

  const gradeName = gradeFilter ? grades.find(g => g.id === Number(gradeFilter))?.name : '';
  const className = classFilter ? classes.find(c => c.id === Number(classFilter))?.name : '';
  const sectionName = sectionFilter ? sections.find(s => s.id === Number(sectionFilter))?.name : '';

  const filteredByGrade = useMemo(() => {
    const rows = data?.by_grade || [];
    if (!gradeFilter) return rows;
    const id = Number(gradeFilter);
    return rows.filter(row =>
      row.grade_id === id || row.grade_name === gradeName,
    );
  }, [data?.by_grade, gradeFilter, gradeName]);

  const filteredRecent = useMemo(() => {
    return (data?.recent || []).filter(row => {
      if (gradeName && row.grade_name !== gradeName) return false;
      if (className && row.class_name !== className) return false;
      if (sectionName && row.section_name !== sectionName) return false;
      if (dateFilter && dateOnly(row.date) !== dateFilter) return false;
      return true;
    });
  }, [data?.recent, gradeName, className, sectionName, dateFilter]);

  if (!reportType) {
    return <Navigate to="/admin/reports" replace />;
  }

  if (reportType === 'payments') {
    return <Navigate to="/admin/reports/payments" replace />;
  }

  if (reportType === 'attendance') {
    return <Navigate to="/admin/reports/attendance" replace />;
  }

  const meta = REPORT_META[reportType];
  const byGradeLabel = t('reports.byGrade');
  const byGradeMetric = (row: { rate: number }) => String(row.rate);

  const barWidth = (row: { rate: number; total: number }) => {
    const max = Math.max(...filteredByGrade.map(r => r.total), 1);
    return `${(row.total / max) * 100}%`;
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="page-title">{t(meta.titleKey)}</h1>
            <p className="page-description">{t(meta.descKey)}</p>
          </div>
          <Link
            to="/admin/reports"
            className="text-sm text-primary hover:underline"
          >
            {t('reports.backToOverview')}
          </Link>
        </div>
      </div>

      <AdminScopeFilterBar
        grades={grades}
        classesByGrade={classesByGrade}
        sectionsByClass={sectionsByClass}
        gradeFilter={gradeFilter}
        classFilter={classFilter}
        sectionFilter={sectionFilter}
        dateFilter={dateFilter}
        showDate
        onGradeChange={handleGradeChange}
        onClassChange={handleClassChange}
        onSectionChange={setSectionFilter}
        onDateChange={setDateFilter}
        appliedCount={appliedCount}
        onClear={clearFilters}
        resultCount={filteredRecent.length}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(data?.stats || []).map(stat => (
          <StatCard
            key={stat.key}
            title={t(statLabelKey(stat.key))}
            value={formatStatValue(stat.key, stat.value, t)}
            icon={meta.icon}
            variant={meta.variant}
          />
        ))}
        {isLoading && (
          <div className="col-span-full rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            {t('reports.loading')}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="mb-4 font-display font-semibold">{byGradeLabel}</h3>
          <div className="space-y-3">
            {filteredByGrade.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('crud.noData')}</p>
            ) : filteredByGrade.map(row => (
              <div key={`${row.grade_name}-${row.total}`}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{row.grade_name}</span>
                  <span className="font-medium">{byGradeMetric(row)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: barWidth(row) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="mb-4 font-display font-semibold">{t('reports.recentRecords')}</h3>
          <div className="max-h-80 overflow-auto">
            {filteredRecent.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('crud.noData')}</p>
            ) : (
              <table className="app-table-text w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-2 py-2 text-start font-medium">{t('col.student')}</th>
                    <th className="px-2 py-2 text-start font-medium">{t('col.grade')}</th>
                    <th className="px-2 py-2 text-start font-medium">{t('col.date')}</th>
                    <th className="px-2 py-2 text-start font-medium">{t('col.degree')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecent.map(row => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="px-2 py-2">{row.student_name}</td>
                      <td className="px-2 py-2">{row.grade_name} {row.class_name} {row.section_name}</td>
                      <td className="px-2 py-2">{dateOnly(row.date)}</td>
                      <td className="px-2 py-2">{row.degree}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-card">
        <h3 className="mb-4 font-display font-semibold">{t('reports.otherReports')}</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ADMIN_REPORT_TYPES.filter(rt => rt !== reportType).map(rt => {
            const other = REPORT_META[rt];
            const Icon = other.icon;
            return (
              <Link
                key={rt}
                to={`/admin/reports/${rt}`}
                className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm font-medium hover:bg-muted/40"
              >
                <Icon className="h-4 w-4 text-primary" />
                {t(other.titleKey)}
              </Link>
            );
          })}
          <Link
            to="/admin/reports"
            className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm font-medium hover:bg-muted/40"
          >
            <TrendingUp className="h-4 w-4 text-primary" />
            {t('nav.reports')}
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

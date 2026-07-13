import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import StatCard from '@/components/StatCard';
import { dateOnly } from '@/components/student/StudentPageFilterBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useAdminScopeFilterState } from '@/hooks/use-admin-scope-filters';
import { useQuery } from '@tanstack/react-query';
import { ADMIN_REPORT_TYPES, adminReportsApi } from '@/services/endpoints/admin-reports';

const CHART_COLORS = ['#b91c1c', '#1e293b', '#f59e0b', '#10b981', '#6366f1', '#ec4899'];

function formatStatValue(key: string, value: number): string {
  if (key === 'collected_amount' || key === 'fees_total' || key === 'unpaid_amount') {
    return `${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return value.toLocaleString();
}

function statLabelKey(key: string): string {
  const map: Record<string, string> = {
    collected_amount: 'stat.revenue',
    payments_count: 'reports.paymentsCount',
    unpaid_count: 'stat.unpaidStudents',
    unpaid_amount: 'reports.unpaidAmount',
    fees_total: 'reports.feesTotal',
  };
  return map[key] || key;
}

export default function AdminReportPayments() {
  const { t } = useLocale();
  const { data: bootstrap } = useAdminBootstrap();
  const grades = useMemo(
    () => (bootstrap?.grades || []) as Array<{ id: number; name: string }>,
    [bootstrap?.grades],
  );
  const classes = useMemo(
    () => (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>,
    [bootstrap?.classes],
  );
  const sections = useMemo(
    () => (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>,
    [bootstrap?.sections],
  );

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

  const apiFilters = useMemo(() => ({
    grade_id: gradeFilter ? Number(gradeFilter) : undefined,
    class_id: classFilter ? Number(classFilter) : undefined,
    section_id: sectionFilter ? Number(sectionFilter) : undefined,
    date: dateFilter || undefined,
  }), [gradeFilter, classFilter, sectionFilter, dateFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', 'payments', apiFilters],
    queryFn: () => adminReportsApi.getPayments(apiFilters),
  });

  const feeTypeChartData = useMemo(
    () => (data?.by_fee_type || []).map(row => ({
      name: t(`payments.type.${row.type}`) !== `payments.type.${row.type}` ? t(`payments.type.${row.type}`) : row.label,
      collected: row.collected,
      unpaid: row.unpaid,
    })),
    [data?.by_fee_type, t],
  );

  const monthChartData = useMemo(
    () => (data?.by_month || []).map(row => ({
      name: row.month,
      collected: row.collected,
      unpaid: row.unpaid,
    })),
    [data?.by_month],
  );

  const paidVsUnpaidData = useMemo(() => {
    const pv = data?.paid_vs_unpaid;
    if (!pv) return [];
    return [
      { name: t('reports.payments.paid'), value: pv.paid_amount, count: pv.paid_count },
      { name: t('reports.payments.unpaid'), value: pv.unpaid_amount, count: pv.unpaid_count },
    ];
  }, [data?.paid_vs_unpaid, t]);

  const unpaidStudents = data?.unpaid_students || [];
  const recent = data?.recent || [];

  return (
    <DashboardLayout>
      <div className="page-header">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="page-title">{t('nav.reportsPayments')}</h1>
            <p className="page-description">{t('page.reports.payments.desc')}</p>
          </div>
          <Link to="/admin/reports" className="text-sm text-primary hover:underline">
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
        resultCount={unpaidStudents.length + recent.length}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {(data?.stats || []).map(stat => (
          <StatCard
            key={stat.key}
            title={t(statLabelKey(stat.key))}
            value={formatStatValue(stat.key, stat.value)}
            icon={DollarSign}
            variant="finance"
          />
        ))}
        {isLoading && (
          <div className="col-span-full rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            {t('reports.loading')}
          </div>
        )}
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('reports.byFeeType')}</CardTitle>
          </CardHeader>
          <CardContent>
            {feeTypeChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('crud.noData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={feeTypeChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => `${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="collected" name={t('reports.payments.collected')} fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="unpaid" name={t('reports.payments.unpaid')} fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t('reports.payments.paidVsUnpaid')}</CardTitle>
          </CardHeader>
          <CardContent>
            {paidVsUnpaidData.every(d => d.value === 0) ? (
              <p className="text-sm text-muted-foreground">{t('crud.noData')}</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={paidVsUnpaidData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }) => `${name}: ${Number(value).toLocaleString()}`}
                  >
                    {paidVsUnpaidData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, _name, props) => {
                    const count = (props?.payload as { count?: number })?.count;
                    return [`${value.toLocaleString()}${count != null ? ` (${count})` : ''}`, props?.name];
                  }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t('reports.payments.collectionByMonth')}</CardTitle>
        </CardHeader>
        <CardContent>
          {monthChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('crud.noData')}</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: number) => `${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="collected" name={t('reports.payments.collected')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="unpaid" name={t('reports.payments.unpaid')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="mb-1 font-display font-semibold">
            {data?.unpaid_mode === 'date' && data.reference_month
              ? t('reports.payments.unpaidForMonth').replace('{month}', data.reference_month)
              : t('reports.payments.unpaidStudents')}
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            {data?.unpaid_mode === 'date'
              ? t('reports.payments.unpaidDateHint')
              : t('reports.payments.deservedMonthsHint')}
          </p>
          <div className="max-h-96 overflow-auto">
            {unpaidStudents.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('crud.noData')}</p>
            ) : (
              <table className="app-table-text w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-2 py-2 text-start font-medium">{t('col.student')}</th>
                    <th className="px-2 py-2 text-start font-medium">{t('col.grade')}</th>
                    <th className="px-2 py-2 text-start font-medium">{t('reports.payments.deservedMonths')}</th>
                    <th className="px-2 py-2 text-start font-medium">{t('col.amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {unpaidStudents.map(row => (
                    <tr key={String(row.id)} className="border-b border-border/60">
                      <td className="px-2 py-2">{row.student_name}</td>
                      <td className="px-2 py-2">
                        {row.grade_name} · {row.class_name} · {row.section_name}
                      </td>
                      <td className="px-2 py-2">
                        {row.deserved_months.length > 0
                          ? row.deserved_months.join(', ')
                          : '—'}
                      </td>
                      <td className="px-2 py-2 font-medium">
                        {row.unpaid_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card">
          <h3 className="mb-4 font-display font-semibold">{t('reports.recentRecords')}</h3>
          <div className="max-h-96 overflow-auto">
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('crud.noData')}</p>
            ) : (
              <table className="app-table-text w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="px-2 py-2 text-start font-medium">{t('col.student')}</th>
                    <th className="px-2 py-2 text-start font-medium">{t('col.grade')}</th>
                    <th className="px-2 py-2 text-start font-medium">{t('col.date')}</th>
                    <th className="px-2 py-2 text-start font-medium">{t('col.amount')}</th>
                    <th className="px-2 py-2 text-start font-medium">{t('col.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map(row => (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="px-2 py-2">{row.student_name}</td>
                      <td className="px-2 py-2">
                        {row.grade_name} {row.class_name} {row.section_name}
                      </td>
                      <td className="px-2 py-2">{dateOnly(row.date)}</td>
                      <td className="px-2 py-2">{row.degree}</td>
                      <td className="px-2 py-2 capitalize">
                        {row.status === 'paid' ? t('reports.payments.paid') : t('reports.payments.unpaid')}
                      </td>
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
          {ADMIN_REPORT_TYPES.filter(rt => rt !== 'payments').map(rt => (
            <Link
              key={rt}
              to={rt === 'attendance' ? '/admin/reports/attendance' : `/admin/reports/${rt}`}
              className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm font-medium hover:bg-muted/40"
            >
              {t(rt === 'attendance' ? 'nav.reportsAttendance' : rt === 'exams' ? 'nav.reportsExams' : rt === 'quizzes' ? 'nav.reportsQuizzes' : 'nav.reportsPayments')}
            </Link>
          ))}
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

import { useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ParentPortalFilterBar from '@/components/parent/ParentPortalFilterBar';
import ParentChildTabsBar from '@/components/parent/ParentChildTabsBar';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import { useLocale } from '@/contexts/LocaleContext';
import { useParentBootstrap } from '@/hooks/use-parent-bootstrap';
import { useParentChildTabs } from '@/hooks/use-parent-child-tabs';
import {
  matchesParentPortalFilters,
  PARENT_ATTENDANCE_STATUS_OPTIONS,
  PARENT_FEE_STATUS_OPTIONS,
  useParentPortalFilters,
} from '@/hooks/use-parent-portal-filters';
import type { ParentBootstrapPayload } from '@/services/endpoints/parent';

type ChildRow = ParentBootstrapPayload['children'][number];

function sameChildScope<T extends { student_id?: number; center_id?: string | number }>(
  row: T,
  child: ChildRow,
): boolean {
  if (row.student_id !== child.id) return false;
  if (child.center_id == null || row.center_id == null) return true;
  return String(row.center_id) === String(child.center_id);
}

export default function ParentReports() {
  const { t } = useLocale();
  const { data } = useParentBootstrap();
  const children = data?.children || [];
  const attendanceRows = data?.attendance || [];
  const feeRows = data?.fees || [];
  const quizRows = data?.quizzes || [];
  const examRows = data?.exams || [];

  const {
    childTabs,
    selectedChildId,
    setSelectedChildId,
    showChildTabs,
    scopedRows: scopedChildren,
  } = useParentChildTabs(children, children, { rowsAreChildren: true });

  const {
    centerFilter,
    setCenterFilter,
    dateFilter,
    setDateFilter,
    statusFilter,
    setStatusFilter,
    centers,
    showCenterFilter,
    filteredRows: filteredChildren,
    appliedCount,
    clearFilters,
  } = useParentPortalFilters({
    rows: scopedChildren,
  });

  const recordFilters = useMemo(
    () => ({ centerFilter, dateFilter, statusFilter }),
    [centerFilter, dateFilter, statusFilter],
  );

  const feeStatusActive = statusFilter === 'paid' || statusFilter === 'unpaid';
  const attendanceStatusActive = ['present', 'absent', 'late'].includes(statusFilter);

  const reports = useMemo(() => {
    return filteredChildren.map(child => {
      const childAttendance = attendanceRows.filter(
        row => sameChildScope(row, child)
          && matchesParentPortalFilters(row, {
            ...recordFilters,
            statusFilter: attendanceStatusActive ? statusFilter : '',
            getDate: r => r.date,
            getStatus: r => r.status,
          }),
      );
      const childFees = feeRows.filter(
        row => sameChildScope(row, child)
          && matchesParentPortalFilters(row, {
            ...recordFilters,
            statusFilter: feeStatusActive ? statusFilter : '',
            getDate: r => r.due_date,
            getStatus: r => r.status,
          }),
      );
      const childQuizzes = quizRows.filter(
        row => sameChildScope(row, child)
          && matchesParentPortalFilters(row, {
            ...recordFilters,
            statusFilter: attendanceStatusActive ? statusFilter : '',
            getDate: r => r.date,
            getStatus: r => (r.attendance_status || 'present'),
          }),
      );
      const childExams = examRows.filter(
        row => sameChildScope(row, child)
          && matchesParentPortalFilters(row, {
            ...recordFilters,
            statusFilter: attendanceStatusActive ? statusFilter : '',
            getDate: r => r.date,
            getStatus: r => (r.attendance_status || 'present'),
          }),
      );

      const presentCount = childAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
      const attendanceRate = childAttendance.length > 0
        ? Math.round((presentCount / childAttendance.length) * 1000) / 10
        : 0;
      const scoredQuizzes = childQuizzes.filter(q => q.degree != null);
      const scoredExams = childExams.filter(e => e.degree != null);
      const quizAvg = scoredQuizzes.length > 0
        ? Math.round((scoredQuizzes.reduce((s, q) => s + (q.degree || 0), 0) / scoredQuizzes.length) * 10) / 10
        : null;
      const examAvg = scoredExams.length > 0
        ? Math.round((scoredExams.reduce((s, e) => s + (e.degree || 0), 0) / scoredExams.length) * 10) / 10
        : null;
      const paidAmount = childFees.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0);
      const pendingAmount = childFees.filter(f => f.status === 'unpaid' || f.status === 'pending').reduce((s, f) => s + f.amount, 0);

      return {
        student_id: child.id,
        student_name: child.name,
        grade: `${child.grade} - ${child.class} - ${child.section}`,
        center_id: child.center_id,
        center_name: child.center_name,
        attendance_rate: attendanceRate,
        quiz_average: quizAvg > 0 ? quizAvg : null,
        exam_average: examAvg > 0 ? examAvg : null,
        paid_amount: paidAmount,
        pending_amount: pendingAmount,
      };
    });
  }, [attendanceRows, attendanceStatusActive, examRows, feeRows, feeStatusActive, filteredChildren, quizRows, recordFilters, statusFilter]);

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('nav.reports')}</h1>
        <p className="page-description">{t('page.reports.desc')}</p>
      </div>

      <ParentChildTabsBar
        tabs={childTabs}
        value={selectedChildId}
        onValueChange={setSelectedChildId}
      />

      <ParentPortalFilterBar
        centers={centers}
        showCenterFilter={showCenterFilter}
        centerFilter={centerFilter}
        dateFilter={dateFilter}
        statusFilter={statusFilter}
        onCenterChange={setCenterFilter}
        onDateChange={setDateFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[...PARENT_FEE_STATUS_OPTIONS, ...PARENT_ATTENDANCE_STATUS_OPTIONS]}
        appliedCount={appliedCount}
        onClear={clearFilters}
        resultCount={reports.length}
      />

      <div className="space-y-6">
        {reports.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            {t('crud.noData')}
          </p>
        ) : (
          reports.map(c => (
            <div key={portalRowKey(c.center_id, c.student_id)} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <div className="border-b border-border bg-muted/30 px-5 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display font-semibold">
                    {showChildTabs ? c.grade : `${c.student_name} — ${c.grade}`}
                  </h3>
                  {showCenterFilter && !centerFilter ? <CenterLabel name={c.center_name} /> : null}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="px-4 py-3 font-medium text-muted-foreground ltr:text-left rtl:text-right">{t('col.title')}</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('nav.attendance')}</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('nav.quizzes')}</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('nav.exams')}</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('stat.monthlyFees')}</th>
                      <th className="px-4 py-3 text-center font-medium text-muted-foreground">{t('stat.pendingFees')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="px-4 py-3 font-medium">{t('nav.reports')}</td>
                      <td className="px-4 py-3 text-center">{c.attendance_rate}%</td>
                      <td className="px-4 py-3 text-center">{c.quiz_average ?? '—'}</td>
                      <td className="px-4 py-3 text-center">{c.exam_average ?? '—'}</td>
                      <td className="px-4 py-3 text-center font-semibold">{c.paid_amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center font-semibold">{c.pending_amount.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

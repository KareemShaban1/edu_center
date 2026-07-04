import { useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ParentPortalFilterBar from '@/components/parent/ParentPortalFilterBar';
import { CalendarCheck, Trophy } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useParentBootstrap } from '@/hooks/use-parent-bootstrap';
import {
  matchesParentPortalFilters,
  PARENT_ATTENDANCE_STATUS_OPTIONS,
  useParentPortalFilters,
} from '@/hooks/use-parent-portal-filters';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import type { ParentBootstrapPayload } from '@/services/endpoints/parent';

type ChildRow = ParentBootstrapPayload['children'][number];
type AttRow = ParentBootstrapPayload['attendance'][number];
type ExamRow = ParentBootstrapPayload['exams'][number];
type QuizRow = ParentBootstrapPayload['quizzes'][number];

function sameChildScope<T extends { student_id?: number; center_id?: string | number }>(
  row: T,
  child: ChildRow,
): boolean {
  return row.student_id === child.id && String(row.center_id) === String(child.center_id);
}

export default function ParentChildren() {
  const { t } = useLocale();
  const { data } = useParentBootstrap();
  const children = data?.children || [];
  const attendanceRows = data?.attendance || [];
  const examRows = data?.exams || [];
  const quizRows = data?.quizzes || [];

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
    rows: children,
    getDate: () => null,
    getStatus: () => undefined,
  });

  const recordFilters = useMemo(
    () => ({
      centerFilter,
      dateFilter,
      statusFilter,
    }),
    [centerFilter, dateFilter, statusFilter],
  );

  const filterAttendance = (row: AttRow, child: ChildRow) =>
    sameChildScope(row, child)
    && matchesParentPortalFilters(row, {
      ...recordFilters,
      getDate: r => r.date,
      getStatus: r => r.status,
    });

  const filterAssessment = <T extends ExamRow | QuizRow>(row: T, child: ChildRow) =>
    sameChildScope(row, child)
    && matchesParentPortalFilters(row, {
      ...recordFilters,
      getDate: r => r.date,
      getStatus: r => (r.attendance_status || 'present'),
    });

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('nav.children')}</h1>
        <p className="page-description">{t('page.children.desc')}</p>
      </div>

      <ParentPortalFilterBar
        centers={centers}
        showCenterFilter={showCenterFilter}
        centerFilter={centerFilter}
        dateFilter={dateFilter}
        statusFilter={statusFilter}
        onCenterChange={setCenterFilter}
        onDateChange={setDateFilter}
        onStatusChange={setStatusFilter}
        statusOptions={PARENT_ATTENDANCE_STATUS_OPTIONS}
        appliedCount={appliedCount}
        onClear={clearFilters}
        resultCount={filteredChildren.length}
      />

      <div className="space-y-6">
        {filteredChildren.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            {t('crud.noData')}
          </p>
        ) : (
          filteredChildren.map(c => {
            const childAttendance = attendanceRows.filter(row => filterAttendance(row, c));
            const presentCount = childAttendance.filter(a => a.status === 'present' || a.status === 'late').length;
            const attendanceRate = childAttendance.length > 0
              ? Math.round((presentCount / childAttendance.length) * 100)
              : 0;
            const childExams = examRows.filter(row => filterAssessment(row, c) && typeof row.degree === 'number');
            const childQuizzes = quizRows.filter(row => filterAssessment(row, c) && typeof row.degree === 'number');
            const examAvg = childExams.length > 0
              ? (childExams.reduce((s, r) => s + (r.degree || 0), 0) / childExams.length).toFixed(1)
              : '—';
            const quizAvg = childQuizzes.length > 0
              ? (childQuizzes.reduce((s, r) => s + (r.degree || 0), 0) / childQuizzes.length).toFixed(1)
              : '—';
            const recentResults = [
              ...childExams.map(e => ({ type: 'Exam', score: e.degree })),
              ...childQuizzes.map(q => ({ type: 'Quiz', score: q.degree })),
            ]
              .filter(r => typeof r.score === 'number')
              .slice(0, 6);

            return (
              <div key={portalRowKey(c.center_id, c.id)} className="rounded-xl border border-border bg-card p-6 shadow-card">
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary font-display text-lg font-bold text-primary-foreground">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-lg font-semibold">{c.name}</h3>
                      {showCenterFilter && !centerFilter ? <CenterLabel name={c.center_name} /> : null}
                    </div>
                    <p className="text-sm text-muted-foreground">{c.grade} - {c.class} - {c.section}</p>
                  </div>
                </div>
                <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-success/10 bg-success/5 p-3 text-center">
                    <CalendarCheck className="mx-auto mb-1 h-4 w-4 text-success" />
                    <p className="text-xs text-muted-foreground">{t('nav.attendance')}</p>
                    <p className="font-semibold text-success">{attendanceRate}%</p>
                  </div>
                  <div className="rounded-lg border border-exams/10 bg-exams/5 p-3 text-center">
                    <Trophy className="mx-auto mb-1 h-4 w-4 text-exams" />
                    <p className="text-xs text-muted-foreground">{t('nav.exams')}</p>
                    <p className="font-semibold text-exams">{examAvg}</p>
                  </div>
                  <div className="rounded-lg border border-primary/10 bg-primary/5 p-3 text-center">
                    <Trophy className="mx-auto mb-1 h-4 w-4 text-primary" />
                    <p className="text-xs text-muted-foreground">{t('nav.quizzes')}</p>
                    <p className="font-semibold text-primary">{quizAvg}</p>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium">{t('section.recentGrades')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {recentResults.length > 0 ? (
                      recentResults.map((r, i) => (
                        <span key={`${c.id}-${i}`} className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium">
                          {r.type}: {r.score}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-lg bg-muted px-3 py-1.5 text-xs font-medium">{t('misc.noDataAvailable')}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}

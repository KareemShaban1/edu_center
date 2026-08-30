import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, GraduationCap, Target, Trophy } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import StudentPageFilterBar, { dateOnly } from '@/components/student/StudentPageFilterBar';
import StudentFilterField from '@/components/student/StudentFilterField';
import { FormInput, FormSelect } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocale } from '@/contexts/LocaleContext';
import { useAppFontClasses } from '@/hooks/use-app-font';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import { attendanceStatusLabel } from '@/lib/translate-attendance-error';
import { cn } from '@/lib/utils';
import type { CenterScopedRow } from '@/types/models';

export interface GradeRow extends CenterScopedRow {
  id: number;
  source: 'exam' | 'quiz';
  subject: string;
  date: string;
  score: number | null;
  total: number;
  attendance_status?: 'present' | 'absent' | 'late';
  notes?: string;
}

type GradeSource = 'exam' | 'quiz';

type GradeSummary = {
  total: number;
  scored: number;
  averagePct: number | null;
  bestPct: number | null;
};

type MonthGroup = {
  month: string;
  label: string;
  rows: GradeRow[];
  summary: GradeSummary;
};

function monthKey(date: string): string {
  return dateOnly(date).slice(0, 7);
}

function formatMonthLabel(month: string, locale: string): string {
  const d = new Date(`${month}-01T12:00:00`);
  if (Number.isNaN(d.getTime())) return month;
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
}

function formatShortDate(date: string, locale: string): string {
  const d = new Date(`${date.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
}

function scorePct(row: GradeRow): number | null {
  if (row.score == null || row.total <= 0) return null;
  return Math.round((row.score / row.total) * 100);
}

function scoreLabel(row: GradeRow): string {
  if (row.score == null) return '—';
  return `${row.score}/${row.total}`;
}

function summarizeRows(rows: GradeRow[]): GradeSummary {
  const scoredRows = rows.filter(r => r.score != null && r.total > 0);
  const pcts = scoredRows.map(r => scorePct(r)!);
  const averagePct = pcts.length > 0
    ? Math.round(pcts.reduce((sum, value) => sum + value, 0) / pcts.length)
    : null;
  const bestPct = pcts.length > 0 ? Math.max(...pcts) : null;

  return {
    total: rows.length,
    scored: scoredRows.length,
    averagePct,
    bestPct,
  };
}

function buildMonthGroups(rows: GradeRow[], locale: string): MonthGroup[] {
  const byMonth = new Map<string, GradeRow[]>();
  for (const row of rows) {
    const key = monthKey(row.date);
    const list = byMonth.get(key) || [];
    list.push(row);
    byMonth.set(key, list);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, monthRows]) => ({
      month,
      label: formatMonthLabel(month, locale),
      rows: [...monthRows].sort((a, b) => {
        const dateCmp = dateOnly(b.date).localeCompare(dateOnly(a.date));
        if (dateCmp !== 0) return dateCmp;
        return String(a.id).localeCompare(String(b.id));
      }),
      summary: summarizeRows(monthRows),
    }));
}

function resolveRowCenterId(row: GradeRow, soleCenterId: string | null): string {
  if (row.center_id != null) return String(row.center_id);
  if (soleCenterId) return soleCenterId;
  return '_none';
}

function GradeShowDialog({ item, onClose, titleKey }: { item: GradeRow; onClose: () => void; titleKey: string }) {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar' : 'en';
  const status = item.attendance_status || 'present';

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t('crud.view')} {t(titleKey)}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p><strong>{t('col.subject')}:</strong> {item.subject || '—'}</p>
          <p><strong>{t('col.date')}:</strong> {formatShortDate(item.date, dateLocale)}</p>
          <p><strong>{t('col.score')}:</strong> {scoreLabel(item)}</p>
          {scorePct(item) != null ? (
            <p><strong>{t('student.grades.percentage')}:</strong> {scorePct(item)}%</p>
          ) : null}
          <p className="flex flex-wrap items-center gap-2">
            <strong>{t('col.status')}:</strong>
            <StatusBadge status={status} label={attendanceStatusLabel(t, status)} />
          </p>
          {item.center_name ? (
            <p><strong>{t('col.center')}:</strong> <CenterLabel name={item.center_name} /></p>
          ) : null}
          <p><strong>{t('col.notes')}:</strong> {item.notes || '—'}</p>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>{t('misc.close')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GradeCard({
  item,
  dateLocale,
  onOpen,
}: {
  item: GradeRow;
  dateLocale: string;
  onOpen: () => void;
}) {
  const { t } = useLocale();
  const fonts = useAppFontClasses();
  const status = item.attendance_status || 'present';
  const pct = scorePct(item);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full w-full flex-col rounded-xl border border-border bg-card p-3 text-start shadow-card transition hover:border-primary/30 hover:bg-muted/20 sm:p-4"
    >
      <p className={cn('line-clamp-2 text-sm font-semibold text-foreground', fonts.display)}>
        {item.center_name || t('col.center')}
      </p>

      <div className="mt-2 flex items-start justify-between gap-3 text-xs sm:text-sm">
        <span className="min-w-0 flex-1 truncate font-medium text-foreground">{item.subject || '—'}</span>
        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-primary">
          {scoreLabel(item)}
        </span>
      </div>

      <div className="mt-4 space-y-2 border-t border-border/60 pt-3 text-xs sm:text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t('col.date')}</span>
          <span className="font-medium text-foreground">{formatShortDate(item.date, dateLocale)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t('student.grades.percentage')}</span>
          <span className="font-medium tabular-nums text-foreground">{pct != null ? `${pct}%` : '—'}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t('col.status')}</span>
          <StatusBadge status={status} label={attendanceStatusLabel(t, status)} />
        </div>
      </div>
    </button>
  );
}

export default function StudentGradeRecordsPage({ source }: { source: GradeSource }) {
  const { t, locale } = useLocale();
  const fonts = useAppFontClasses();
  const { data, isLoading } = useStudentBootstrap();
  const [centerFilter, setCenterFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showItem, setShowItem] = useState<GradeRow | null>(null);

  const titleKey = source === 'exam' ? 'nav.exams' : 'nav.quizzes';
  const descKey = source === 'exam' ? 'student.grades.descExams' : 'student.grades.descQuizzes';
  const emptyKey = source === 'exam' ? 'student.grades.emptyExams' : 'student.grades.emptyQuizzes';
  const Icon = source === 'exam' ? GraduationCap : ClipboardList;
  const dateLocale = locale === 'ar' ? 'ar' : 'en';

  const allRows = useMemo(
    () => ((data?.grades || []) as GradeRow[]).filter(row => row.source === source),
    [data?.grades, source],
  );

  const soleCenterId = useMemo(() => {
    if (data?.centers?.length === 1) return String(data.centers[0].center_id);
    const ids = new Set<string>();
    for (const row of allRows) {
      if (row.center_id != null) ids.add(String(row.center_id));
    }
    if (ids.size === 1) return Array.from(ids)[0];
    return null;
  }, [allRows, data?.centers]);

  const centerOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of data?.centers || []) {
      map.set(String(c.center_id), c.center_name);
    }
    for (const row of allRows) {
      if (row.center_id == null) continue;
      const id = String(row.center_id);
      if (!map.has(id)) map.set(id, row.center_name || id);
    }
    if (map.size === 0 && soleCenterId) {
      map.set(soleCenterId, data?.centers?.[0]?.center_name || soleCenterId);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allRows, data?.centers, soleCenterId]);

  const showCenterFilter = centerOptions.length > 1;

  const subjectOptions = useMemo(() => {
    const names = new Set<string>();
    for (const row of allRows) {
      const centerId = resolveRowCenterId(row, soleCenterId);
      if (centerFilter && centerId !== centerFilter) continue;
      const subject = (row.subject || '').trim();
      if (subject) names.add(subject);
    }
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [allRows, centerFilter, soleCenterId]);

  useEffect(() => {
    if (centerFilter && !centerOptions.some(c => c.id === centerFilter)) {
      setCenterFilter('');
    }
  }, [centerFilter, centerOptions]);

  useEffect(() => {
    if (subjectFilter && !subjectOptions.includes(subjectFilter)) {
      setSubjectFilter('');
    }
  }, [subjectFilter, subjectOptions]);

  const filteredRows = useMemo(() => {
    return allRows.filter(row => {
      const centerId = resolveRowCenterId(row, soleCenterId);
      if (centerFilter && centerId !== centerFilter) return false;
      if (subjectFilter && row.subject !== subjectFilter) return false;
      if (monthFilter && monthKey(row.date) !== monthFilter) return false;
      if (statusFilter && (row.attendance_status || 'present') !== statusFilter) return false;
      return true;
    });
  }, [allRows, centerFilter, subjectFilter, monthFilter, statusFilter, soleCenterId]);

  const monthGroups = useMemo(
    () => buildMonthGroups(filteredRows, dateLocale),
    [filteredRows, dateLocale],
  );

  const summary = useMemo(() => summarizeRows(filteredRows), [filteredRows]);
  const appliedFilters = [centerFilter, subjectFilter, monthFilter, statusFilter].filter(Boolean).length;

  const clearFilters = () => {
    setCenterFilter('');
    setSubjectFilter('');
    setMonthFilter('');
    setStatusFilter('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="page-header">
          <div>
            <h1 className={cn('flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl', fonts.display)}>
              <Icon className="h-6 w-6 text-primary" aria-hidden />
              {t(titleKey)}
            </h1>
            <p className="page-description mt-1 text-sm text-muted-foreground sm:text-base">
              {t(descKey)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              {t('student.grades.totalRecords')}
            </p>
            <p className={cn('mt-1 text-2xl font-semibold tabular-nums', fonts.display)}>
              {isLoading ? '…' : summary.total}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              <Target className="h-3.5 w-3.5 text-primary" aria-hidden />
              {t('student.grades.averageScore')}
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">
              {summary.averagePct != null ? `${summary.averagePct}%` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              <Trophy className="h-3.5 w-3.5 text-success" aria-hidden />
              {t('student.grades.bestScore')}
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-success">
              {summary.bestPct != null ? `${summary.bestPct}%` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              {t('student.grades.scoredRecords')}
            </p>
            <p className={cn('mt-1 text-2xl font-semibold tabular-nums', fonts.display)}>
              {summary.scored}
            </p>
          </div>
        </div>

        <StudentPageFilterBar
          appliedCount={appliedFilters}
          onClear={clearFilters}
          resultCount={filteredRows.length}
          renderFilters={idPrefix => (
            <>
              {showCenterFilter ? (
                <StudentFilterField id={`${idPrefix}-center`} label={t('col.center')}>
                  <FormSelect
                    id={`${idPrefix}-center`}
                    title={t('col.center')}
                    value={centerFilter}
                    onChange={e => {
                      setCenterFilter(e.target.value);
                      setSubjectFilter('');
                    }}
                  >
                    <option value="">{t('filter.all')}</option>
                    {centerOptions.map(center => (
                      <option key={center.id} value={center.id}>
                        {center.name}
                      </option>
                    ))}
                  </FormSelect>
                </StudentFilterField>
              ) : null}
              <StudentFilterField id={`${idPrefix}-subject`} label={t('col.subject')}>
                <FormSelect
                  id={`${idPrefix}-subject`}
                  title={t('col.subject')}
                  value={subjectFilter}
                  onChange={e => setSubjectFilter(e.target.value)}
                >
                  <option value="">{t('filter.all')}</option>
                  {subjectOptions.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </FormSelect>
              </StudentFilterField>
              <StudentFilterField id={`${idPrefix}-month`} label={t('col.month')}>
                <FormInput
                  id={`${idPrefix}-month`}
                  type="month"
                  value={monthFilter}
                  onChange={e => setMonthFilter(e.target.value)}
                />
              </StudentFilterField>
              <StudentFilterField id={`${idPrefix}-status`} label={t('col.status')}>
                <FormSelect
                  id={`${idPrefix}-status`}
                  title={t('col.status')}
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="">{t('filter.all')}</option>
                  <option value="present">{t('attendance.present')}</option>
                  <option value="absent">{t('attendance.absent')}</option>
                  <option value="late">{t('attendance.late')}</option>
                </FormSelect>
              </StudentFilterField>
            </>
          )}
        />

        {isLoading ? (
          <div className="space-y-4">
            {[0, 1].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-6 w-48 animate-pulse rounded bg-muted/40" />
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map(j => (
                    <div key={j} className="h-40 animate-pulse rounded-xl border border-border bg-muted/30" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : monthGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-4 py-12 text-center text-muted-foreground">
            {t(emptyKey)}
          </div>
        ) : (
          <div className="space-y-6">
            {monthGroups.map(group => (
              <section key={group.month} className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border/60 pb-2">
                  <div>
                    <h2 className={cn('text-base font-semibold sm:text-lg', fonts.display)}>{group.label}</h2>
                    {group.summary.averagePct != null ? (
                      <p className="text-xs text-muted-foreground">
                        {t('student.grades.monthAverage').replace('{value}', String(group.summary.averagePct))}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {group.summary.total} {t('crud.results')}
                  </span>
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.rows.map(item => (
                    <GradeCard
                      key={portalRowKey(item.center_id, `${source}-${item.id}`)}
                      item={item}
                      dateLocale={dateLocale}
                      onOpen={() => setShowItem(item)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {showItem ? (
        <GradeShowDialog
          item={showItem}
          titleKey={titleKey}
          onClose={() => setShowItem(null)}
        />
      ) : null}
    </DashboardLayout>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, CheckCircle2, Clock3, ScanLine, XCircle } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import type { StudentCenterSummary } from '@/services/endpoints/student-self';
import type { CenterScopedRow } from '@/types/models';

interface AttRow extends CenterScopedRow {
  id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
  teacher?: string;
  teacher_id?: number | null;
  session_id?: number | null;
  session_topic?: string;
  subject_name?: string;
  session_time?: string | null;
  check_in_time?: string | null;
}

const UNKNOWN_TEACHER = '__unknown__';

type StatusCounts = {
  present: number;
  late: number;
  absent: number;
  total: number;
  rate: number | null;
};

type MonthGroup = {
  month: string;
  label: string;
  rows: AttRow[];
  counts: StatusCounts;
};

function countStatuses(rows: AttRow[]): StatusCounts {
  const present = rows.filter(r => r.status === 'present').length;
  const late = rows.filter(r => r.status === 'late').length;
  const absent = rows.filter(r => r.status === 'absent').length;
  const total = present + late + absent;
  const rate = total > 0 ? Math.round(((present + late) / total) * 100) : null;
  return { present, late, absent, total, rate };
}

function teacherKey(row: AttRow): string {
  const name = (row.teacher || '').trim();
  if (name) return name;
  if (row.teacher_id != null) return `id:${row.teacher_id}`;
  return UNKNOWN_TEACHER;
}

function teacherLabel(key: string, t: (k: string) => string): string {
  if (key === UNKNOWN_TEACHER || key.startsWith('id:')) return t('student.attendance.unknownTeacher');
  return key;
}

function resolveRowCenterId(row: AttRow, soleCenterId: string | null): string {
  if (row.center_id != null) return String(row.center_id);
  if (soleCenterId) return soleCenterId;
  return '_none';
}

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

function formatClock(value: string | null | undefined, locale: string): string {
  if (!value) return '—';
  const normalized = value.includes('T') ? value : `${value.slice(0, 10)}T${value.slice(11) || '00:00:00'}`;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

function buildMonthGroups(rows: AttRow[], locale: string): MonthGroup[] {
  const byMonth = new Map<string, AttRow[]>();
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
        const sessionA = a.session_time || '';
        const sessionB = b.session_time || '';
        if (sessionA && sessionB) return sessionA.localeCompare(sessionB);
        return String(a.id).localeCompare(String(b.id));
      }),
      counts: countStatuses(monthRows),
    }));
}

function AttendanceShowDialog({ item, onClose }: { item: AttRow; onClose: () => void }) {
  const { t, locale } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar' : 'en';

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t('crud.view')} {t('nav.attendance')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p>
            <strong>{t('col.date')}:</strong> {formatShortDate(item.date, dateLocale)}
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <strong>{t('col.status')}:</strong>
            <StatusBadge status={item.status} label={t(`attendance.${item.status}`) || item.status} />
          </p>
          <p>
            <strong>{t('col.subject')}:</strong> {item.subject_name?.trim() || '—'}
          </p>
          <p>
            <strong>{t('col.teacher')}:</strong> {item.teacher?.trim() || t('student.attendance.unknownTeacher')}
          </p>
          <p>
            <strong>{t('student.attendance.sessionTime')}:</strong> {formatClock(item.session_time, dateLocale)}
          </p>
          <p>
            <strong>{t('student.attendance.checkInTime')}:</strong> {formatClock(item.check_in_time, dateLocale)}
          </p>
          {item.session_topic ? (
            <p>
              <strong>{t('col.title')}:</strong> {item.session_topic}
            </p>
          ) : null}
          {item.center_name ? (
            <p>
              <strong>{t('col.center')}:</strong> <CenterLabel name={item.center_name} />
            </p>
          ) : null}
          <p>
            <strong>{t('col.notes')}:</strong> {item.notes || '—'}
          </p>
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {t('misc.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AttendanceCard({
  item,
  dateLocale,
  onOpen,
}: {
  item: AttRow;
  dateLocale: string;
  onOpen: () => void;
}) {
  const { t } = useLocale();
  const fonts = useAppFontClasses();
  const teacher = item.teacher?.trim() || t('student.attendance.unknownTeacher');
  const subject = item.subject_name?.trim() || '—';

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
        <span className="min-w-0 flex-1 truncate font-medium text-foreground">{subject}</span>
        <span className="min-w-0 flex-1 truncate text-end text-muted-foreground">{teacher}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border/60 pt-3">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              {t('student.attendance.sessionTime')}
            </p>
            <p className="mt-0.5 text-sm font-medium tabular-nums">{formatClock(item.session_time, dateLocale)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              {t('student.attendance.checkInTime')}
            </p>
            <p className="mt-0.5 text-sm font-medium tabular-nums">{formatClock(item.check_in_time, dateLocale)}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              {t('col.date')}
            </p>
            <p className="mt-0.5 text-sm font-medium">{formatShortDate(item.date, dateLocale)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              {t('col.status')}
            </p>
            <div className="mt-1">
              <StatusBadge status={item.status} label={t(`attendance.${item.status}`) || item.status} />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function StudentAttendance() {
  const { t, locale } = useLocale();
  const fonts = useAppFontClasses();
  const { data, isLoading } = useStudentBootstrap();
  const [centerFilter, setCenterFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showItem, setShowItem] = useState<AttRow | null>(null);

  const allRows = useMemo(() => (data?.attendance || []) as AttRow[], [data?.attendance]);
  const dateLocale = locale === 'ar' ? 'ar' : 'en';

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

  const teacherOptions = useMemo(() => {
    const keys = new Set<string>();
    for (const row of allRows) {
      const centerId = resolveRowCenterId(row, soleCenterId);
      if (centerFilter && centerId !== centerFilter) continue;
      keys.add(teacherKey(row));
    }
    return Array.from(keys).sort((a, b) => {
      if (a === UNKNOWN_TEACHER) return 1;
      if (b === UNKNOWN_TEACHER) return -1;
      return a.localeCompare(b);
    });
  }, [allRows, centerFilter, soleCenterId]);

  useEffect(() => {
    if (centerFilter && !centerOptions.some(c => c.id === centerFilter)) {
      setCenterFilter('');
    }
  }, [centerFilter, centerOptions]);

  useEffect(() => {
    if (teacherFilter && !teacherOptions.includes(teacherFilter)) {
      setTeacherFilter('');
    }
  }, [teacherFilter, teacherOptions]);

  const filteredRows = useMemo(() => {
    return allRows.filter(row => {
      const centerId = resolveRowCenterId(row, soleCenterId);
      if (centerFilter && centerId !== centerFilter) return false;
      if (teacherFilter && teacherKey(row) !== teacherFilter) return false;
      if (monthFilter && monthKey(row.date) !== monthFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      return true;
    });
  }, [allRows, centerFilter, teacherFilter, monthFilter, statusFilter, soleCenterId]);

  const monthGroups = useMemo(
    () => buildMonthGroups(filteredRows, dateLocale),
    [filteredRows, dateLocale],
  );

  const summary = useMemo(() => countStatuses(filteredRows), [filteredRows]);
  const appliedFilters = [centerFilter, teacherFilter, monthFilter, statusFilter].filter(Boolean).length;

  const clearFilters = () => {
    setCenterFilter('');
    setTeacherFilter('');
    setMonthFilter('');
    setStatusFilter('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="page-header">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className={cn('flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl', fonts.display)}>
                <CalendarCheck className="h-6 w-6 text-primary" aria-hidden />
                {t('nav.attendance')}
              </h1>
              <p className="page-description mt-1 text-sm text-muted-foreground sm:text-base">
                {t('student.attendance.desc')}
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link to="/student/attendance/check-in">
                <ScanLine className="h-4 w-4" />
                {t('nav.attendanceCheckIn')}
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              {t('stat.attendanceRate')}
            </p>
            <p className={cn('mt-1 text-2xl font-semibold tabular-nums', fonts.display)}>
              {isLoading ? '…' : summary.rate != null ? `${summary.rate}%` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
              {t('attendance.present')}
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-success">{summary.present}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              <Clock3 className="h-3.5 w-3.5 text-warning" aria-hidden />
              {t('attendance.late')}
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-warning">{summary.late}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              <XCircle className="h-3.5 w-3.5 text-destructive" aria-hidden />
              {t('attendance.absent')}
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-destructive">{summary.absent}</p>
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
                      setTeacherFilter('');
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
              <StudentFilterField id={`${idPrefix}-teacher`} label={t('col.teacher')}>
                <FormSelect
                  id={`${idPrefix}-teacher`}
                  title={t('col.teacher')}
                  value={teacherFilter}
                  onChange={e => setTeacherFilter(e.target.value)}
                >
                  <option value="">{t('filter.all')}</option>
                  {teacherOptions.map(key => (
                    <option key={key} value={key}>
                      {teacherLabel(key, t)}
                    </option>
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
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map(j => (
                    <div key={j} className="h-40 animate-pulse rounded-xl border border-border bg-muted/30" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : monthGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-4 py-12 text-center text-muted-foreground">
            {t('student.attendance.empty')}
          </div>
        ) : (
          <div className="space-y-6">
            {monthGroups.map(group => (
              <section key={group.month} className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border/60 pb-2">
                  <h2 className={cn('text-base font-semibold sm:text-lg', fonts.display)}>{group.label}</h2>
                  <span className="text-xs text-muted-foreground">
                    {group.counts.total} {t('crud.results')}
                  </span>
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.rows.map(item => (
                    <AttendanceCard
                      key={portalRowKey(item.center_id, item.id)}
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

      {showItem ? <AttendanceShowDialog item={showItem} onClose={() => setShowItem(null)} /> : null}
    </DashboardLayout>
  );
}

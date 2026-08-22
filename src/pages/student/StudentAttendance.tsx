import { useEffect, useMemo, useState } from 'react';
import { Building2, CalendarCheck, CheckCircle2, Clock3, UserRound, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import StudentPageFilterBar, { dateOnly } from '@/components/student/StudentPageFilterBar';
import StudentFilterField from '@/components/student/StudentFilterField';
import { FormInput, FormSelect } from '@/components/FormFields';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
}

const UNKNOWN_TEACHER = '__unknown__';

type StatusCounts = {
  present: number;
  late: number;
  absent: number;
  total: number;
  rate: number | null;
};

type TeacherGroup = {
  key: string;
  name: string;
  rows: AttRow[];
  counts: StatusCounts;
};

type CenterGroup = {
  id: string;
  name: string;
  teachers: TeacherGroup[];
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

function buildHierarchy(rows: AttRow[], centers: StudentCenterSummary[] | undefined): CenterGroup[] {
  const centerMeta = new Map<string, string>();
  for (const c of centers || []) {
    centerMeta.set(String(c.center_id), c.center_name);
  }
  for (const row of rows) {
    if (row.center_id == null) continue;
    const id = String(row.center_id);
    if (!centerMeta.has(id)) centerMeta.set(id, row.center_name || id);
  }

  const soleCenterId =
    (centers?.length === 1 && String(centers[0].center_id))
    || (centerMeta.size === 1 ? Array.from(centerMeta.keys())[0] : null);

  const byCenter = new Map<string, AttRow[]>();
  for (const row of rows) {
    let id = row.center_id != null ? String(row.center_id) : '';
    if (!id && soleCenterId) id = soleCenterId;
    if (!id) id = '_none';
    if (!centerMeta.has(id)) {
      centerMeta.set(id, row.center_name || (id === '_none' ? '' : id));
    }
    const list = byCenter.get(id) || [];
    list.push(row);
    byCenter.set(id, list);
  }

  const orderedIds: string[] = [];
  if (centers && centers.length > 0) {
    for (const c of centers) {
      const id = String(c.center_id);
      if (byCenter.has(id) && !orderedIds.includes(id)) orderedIds.push(id);
    }
  }
  for (const id of byCenter.keys()) {
    if (!orderedIds.includes(id)) orderedIds.push(id);
  }

  return orderedIds
    .map(id => {
      const centerRows = byCenter.get(id) || [];
      const byTeacher = new Map<string, AttRow[]>();
      for (const row of centerRows) {
        const key = teacherKey(row);
        const list = byTeacher.get(key) || [];
        list.push(row);
        byTeacher.set(key, list);
      }

      const teachers: TeacherGroup[] = Array.from(byTeacher.entries())
        .map(([key, teacherRows]) => {
          const sorted = [...teacherRows].sort((a, b) => b.date.localeCompare(a.date));
          return {
            key,
            name: key.startsWith('id:') || key === UNKNOWN_TEACHER ? '' : key,
            rows: sorted,
            counts: countStatuses(sorted),
          };
        })
        .sort((a, b) => {
          if (a.key === UNKNOWN_TEACHER) return 1;
          if (b.key === UNKNOWN_TEACHER) return -1;
          return (a.name || a.key).localeCompare(b.name || b.key);
        });

      return {
        id,
        name: centerMeta.get(id) || id,
        teachers,
        counts: countStatuses(centerRows),
      };
    })
    .filter(c => c.teachers.length > 0);
}

function statusAccent(status: AttRow['status']): string {
  if (status === 'present') return 'border-success bg-success/10 text-success';
  if (status === 'late') return 'border-warning bg-warning/10 text-warning';
  return 'border-destructive bg-destructive/10 text-destructive';
}

function statusRail(status: AttRow['status']): string {
  if (status === 'present') return 'bg-success';
  if (status === 'late') return 'bg-warning';
  return 'bg-destructive';
}

function formatDayLabel(date: string, locale: string): { weekday: string; day: string; month: string } {
  const d = new Date(`${date.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) {
    return { weekday: '', day: date.slice(8, 10) || '—', month: date.slice(0, 7) };
  }
  return {
    weekday: d.toLocaleDateString(locale, { weekday: 'short' }),
    day: d.toLocaleDateString(locale, { day: 'numeric' }),
    month: d.toLocaleDateString(locale, { month: 'short' }),
  };
}

function MiniCounts({ counts }: { counts: StatusCounts }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] tabular-nums text-muted-foreground sm:text-xs">
      <span className="text-success">{counts.present}</span>
      <span aria-hidden>·</span>
      <span className="text-warning">{counts.late}</span>
      <span aria-hidden>·</span>
      <span className="text-destructive">{counts.absent}</span>
      {counts.rate != null ? (
        <>
          <span aria-hidden>·</span>
          <span className="font-medium text-foreground">{counts.rate}%</span>
        </>
      ) : null}
    </div>
  );
}

function resolveRowCenterId(row: AttRow, soleCenterId: string | null): string {
  if (row.center_id != null) return String(row.center_id);
  if (soleCenterId) return soleCenterId;
  return '_none';
}

function AttendanceShowDialog({ item, onClose }: { item: AttRow; onClose: () => void }) {
  const { t } = useLocale();
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
            <strong>{t('col.date')}:</strong> {item.date}
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <strong>{t('col.status')}:</strong>
            <StatusBadge status={item.status} label={t(`attendance.${item.status}`) || item.status} />
          </p>
          <p>
            <strong>{t('col.teacher')}:</strong> {item.teacher?.trim() || t('student.attendance.unknownTeacher')}
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

function AttendanceRow({
  item,
  dateLocale,
  displayClass,
  onOpen,
}: {
  item: AttRow;
  dateLocale: string;
  displayClass: string;
  onOpen: () => void;
}) {
  const { t } = useLocale();
  const day = formatDayLabel(item.date, dateLocale);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background text-start transition hover:border-primary/30 hover:bg-muted/20"
    >
      <span className={cn('h-1 w-full shrink-0', statusRail(item.status))} aria-hidden />
      <span
        className={cn(
          'flex flex-col items-center justify-center gap-0.5 border-b border-border/60 px-2 py-2.5',
          statusAccent(item.status),
        )}
      >
        <span className="text-[10px] font-medium uppercase opacity-80">{day.weekday}</span>
        <span className={cn('text-xl font-bold leading-none tabular-nums', displayClass)}>{day.day}</span>
        <span className="text-[10px] opacity-80">{day.month}</span>
      </span>
      <span className="flex min-h-0 flex-1 flex-col gap-1.5 p-2.5 sm:p-3">
        <StatusBadge status={item.status} label={t(`attendance.${item.status}`) || item.status} />
        {item.session_topic ? (
          <span className="line-clamp-2 text-xs text-muted-foreground">{item.session_topic}</span>
        ) : item.notes ? (
          <span className="line-clamp-2 text-xs text-muted-foreground">{item.notes}</span>
        ) : (
          <span className="text-xs text-muted-foreground">{item.date}</span>
        )}
      </span>
    </button>
  );
}

export default function StudentAttendance() {
  const { t, locale } = useLocale();
  const fonts = useAppFontClasses();
  const { data, isLoading } = useStudentBootstrap();
  const [centerFilter, setCenterFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showItem, setShowItem] = useState<AttRow | null>(null);

  const allRows = useMemo(() => (data?.attendance || []) as AttRow[], [data?.attendance]);

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
      if (dateFilter && dateOnly(row.date) !== dateFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      return true;
    });
  }, [allRows, centerFilter, teacherFilter, dateFilter, statusFilter, soleCenterId]);

  const hierarchy = useMemo(
    () => buildHierarchy(filteredRows, data?.centers),
    [filteredRows, data?.centers],
  );

  const summary = useMemo(() => countStatuses(filteredRows), [filteredRows]);

  const defaultCenterOpen = useMemo(() => hierarchy.map(c => c.id), [hierarchy]);

  const defaultTeacherOpen = useMemo(() => {
    const keys: string[] = [];
    for (const center of hierarchy) {
      for (const teacher of center.teachers) {
        keys.push(`${center.id}::${teacher.key}`);
      }
    }
    if (keys.length <= 6) return keys;
    return hierarchy.map(c => `${c.id}::${c.teachers[0]?.key}`).filter(Boolean);
  }, [hierarchy]);

  const appliedFilters = [centerFilter, teacherFilter, dateFilter, statusFilter].filter(Boolean).length;

  const clearFilters = () => {
    setCenterFilter('');
    setTeacherFilter('');
    setDateFilter('');
    setStatusFilter('');
  };

  const filterSignature = `${centerFilter}|${teacherFilter}|${dateFilter}|${statusFilter}`;
  const dateLocale = locale === 'ar' ? 'ar' : 'en';

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="page-header">
          <h1 className={cn('flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl', fonts.display)}>
            <CalendarCheck className="h-6 w-6 text-primary" aria-hidden />
            {t('nav.attendance')}
          </h1>
          <p className="page-description mt-1 text-sm text-muted-foreground sm:text-base">
            {t('student.attendance.desc')}
          </p>
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
              <StudentFilterField id={`${idPrefix}-date`} label={t('col.date')}>
                <FormInput
                  id={`${idPrefix}-date`}
                  type="date"
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value)}
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
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted/30" />
            ))}
          </div>
        ) : hierarchy.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-4 py-12 text-center text-muted-foreground">
            {t('student.attendance.empty')}
          </div>
        ) : (
          <Accordion
            key={filterSignature}
            type="multiple"
            defaultValue={defaultCenterOpen}
            className="grid grid-cols-2 items-start gap-3 lg:grid-cols-3 xl:grid-cols-4"
          >
            {hierarchy.map(center => (
              <AccordionItem
                key={center.id}
                value={center.id}
                className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-card data-[state=open]:col-span-full"
              >
                <AccordionTrigger className="px-2.5 py-2.5 hover:no-underline hover:bg-muted/20 sm:px-3 sm:py-3 [&[data-state=open]]:border-b [&[data-state=open]]:border-border/60">
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-2 text-start sm:flex-row sm:items-center sm:gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:h-10 sm:w-10">
                      <Building2 className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('line-clamp-2 text-sm font-semibold sm:text-base', fonts.display)}>
                        {center.name || t('col.center')}
                      </p>
                      <div className="mt-0.5 space-y-0.5">
                        <span className="block text-[10px] text-muted-foreground sm:text-xs">
                          {center.teachers.length} {t('student.attendance.teachers')}
                          {' · '}
                          {center.counts.total} {t('crud.results')}
                        </span>
                        <MiniCounts counts={center.counts} />
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-2 pb-3 pt-2 sm:px-3">
                  {center.teachers.length === 0 ? (
                    <p className="px-2 py-4 text-center text-sm text-muted-foreground">
                      {t('student.attendance.empty')}
                    </p>
                  ) : (
                    <Accordion
                      type="multiple"
                      defaultValue={defaultTeacherOpen.filter(k => k.startsWith(`${center.id}::`))}
                      className="grid grid-cols-2 items-start gap-2 lg:grid-cols-3"
                    >
                      {center.teachers.map(teacher => {
                        const value = `${center.id}::${teacher.key}`;
                        return (
                          <AccordionItem
                            key={value}
                            value={value}
                            className="min-w-0 overflow-hidden rounded-lg border border-border/80 bg-muted/10 data-[state=open]:col-span-full"
                          >
                            <AccordionTrigger className="px-2.5 py-2 hover:no-underline hover:bg-muted/30 sm:px-3 sm:py-2.5 [&[data-state=open]]:border-b [&[data-state=open]]:border-border/50">
                              <div className="flex min-w-0 flex-1 items-start gap-2 text-start">
                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-background text-muted-foreground">
                                  <UserRound className="h-3.5 w-3.5" aria-hidden />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="line-clamp-2 text-xs font-medium sm:text-sm">
                                    {teacherLabel(teacher.key, t)}
                                  </p>
                                  <div className="mt-0.5 space-y-0.5">
                                    <span className="block text-[10px] text-muted-foreground">
                                      {teacher.counts.total} {t('crud.results')}
                                    </span>
                                    <MiniCounts counts={teacher.counts} />
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-2 pb-2 pt-2">
                              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
                                {teacher.rows.map(item => (
                                  <AttendanceRow
                                    key={portalRowKey(item.center_id, item.id)}
                                    item={item}
                                    dateLocale={dateLocale}
                                    displayClass={fonts.display}
                                    onOpen={() => setShowItem(item)}
                                  />
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {showItem ? <AttendanceShowDialog item={showItem} onClose={() => setShowItem(null)} /> : null}
    </DashboardLayout>
  );
}

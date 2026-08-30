import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Eye, MapPin, Monitor, Video } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import StudentPageFilterBar, { dateOnly, uniqueSorted } from '@/components/student/StudentPageFilterBar';
import StudentFilterField from '@/components/student/StudentFilterField';
import { FormInput, FormSelect } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { useAppFontClasses } from '@/hooks/use-app-font';
import { useIsMobile } from '@/hooks/use-mobile';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SessionType } from '@/services/endpoints/session-types';
import type { CenterScopedRow } from '@/types/models';

interface SessionRow extends CenterScopedRow {
  id: number;
  topic: string;
  teacher: string;
  teacher_id?: number | null;
  start_at: string;
  duration: number;
  session_type?: SessionType;
  provider: string;
  room_slug?: string;
  join_url?: string;
  moderator_url?: string;
  password?: string;
  record_enabled?: boolean;
  livekit_url?: string;
  external_ref?: string;
  location?: string;
  notes?: string;
}

const UNKNOWN_TEACHER = '__unknown__';

type SessionSummary = {
  total: number;
  online: number;
  offline: number;
  upcoming: number;
};

type MonthGroup = {
  month: string;
  label: string;
  rows: SessionRow[];
  summary: SessionSummary;
};

function isOfflineSession(item: SessionRow): boolean {
  return item.session_type === 'offline' || item.provider === 'offline';
}

function teacherKey(row: SessionRow): string {
  const name = (row.teacher || '').trim();
  if (name) return name;
  if (row.teacher_id != null) return `id:${row.teacher_id}`;
  return UNKNOWN_TEACHER;
}

function teacherLabel(key: string, t: (k: string) => string): string {
  if (key === UNKNOWN_TEACHER || key.startsWith('id:')) return t('student.attendance.unknownTeacher');
  return key;
}

function resolveRowCenterId(row: SessionRow, soleCenterId: string | null): string {
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

function formatShortDate(value: string, locale: string): string {
  const normalized = dateOnly(value);
  if (!normalized) return '—';
  const d = new Date(`${normalized}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatClock(value: string | null | undefined, locale: string): string {
  if (!value) return '—';
  const normalized = value.includes('T') ? value : `${value.slice(0, 10)}T${value.slice(11) || '00:00:00'}`;
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(locale === 'ar' ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' });
}

function sessionTypeLabel(item: SessionRow, t: (k: string) => string): string {
  if (isOfflineSession(item)) return t('sessions.type.offline');
  if (item.session_type === 'online' || item.provider === 'livekit' || item.provider === 'jitsi') {
    return t('sessions.type.online');
  }
  return item.provider || '—';
}

function summarizeRows(rows: SessionRow[]): SessionSummary {
  const today = dateOnly(new Date().toISOString());
  return {
    total: rows.length,
    online: rows.filter(r => !isOfflineSession(r)).length,
    offline: rows.filter(r => isOfflineSession(r)).length,
    upcoming: rows.filter(r => dateOnly(r.start_at) >= today).length,
  };
}

function buildMonthGroups(rows: SessionRow[], locale: string): MonthGroup[] {
  const byMonth = new Map<string, SessionRow[]>();
  for (const row of rows) {
    const key = monthKey(row.start_at);
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
        const dateCmp = dateOnly(b.start_at).localeCompare(dateOnly(a.start_at));
        if (dateCmp !== 0) return dateCmp;
        return String(a.id).localeCompare(String(b.id));
      }),
      summary: summarizeRows(monthRows),
    }));
}

function SessionDetailFields({ item, locale }: { item: SessionRow; locale: string }) {
  const { t } = useLocale();
  const dateLocale = locale === 'ar' ? 'ar' : 'en';

  const rows: Array<{ label: string; value: ReactNode }> = [
    { label: t('col.title'), value: item.topic },
    { label: t('col.teacher'), value: item.teacher?.trim() || t('student.attendance.unknownTeacher') },
    { label: t('col.startDate'), value: formatShortDate(item.start_at, dateLocale) },
    { label: t('student.attendance.sessionTime'), value: formatClock(item.start_at, dateLocale) },
    { label: t('col.durationMinutes'), value: `${item.duration} ${t('col.minutes')}` },
    { label: t('col.provider'), value: sessionTypeLabel(item, t) },
    ...(isOfflineSession(item)
      ? [
          { label: t('col.location'), value: item.location || '—' },
          { label: t('col.notes'), value: item.notes || '—' },
        ]
      : [{
          label: t('sessions.join'),
          value: (item.join_url && item.join_url !== '#') ? (
            <a href={item.join_url} target="_blank" rel="noreferrer" className="text-primary underline break-all">
              {item.join_url}
            </a>
          ) : '—',
        }]),
    ...(item.center_name
      ? [{ label: t('col.center'), value: <CenterLabel name={item.center_name} /> }]
      : []),
  ];

  return (
    <div className="space-y-3">
      {rows.map(row => (
        <div key={row.label} className="grid grid-cols-[minmax(0,38%)_1fr] gap-x-3 gap-y-1 text-sm sm:grid-cols-[140px_1fr]">
          <span className="font-medium text-muted-foreground">{row.label}</span>
          <div className="min-w-0 break-words text-foreground">{row.value}</div>
        </div>
      ))}
      {item.provider === 'livekit' ? (
        <Button asChild variant="secondary" size="sm" className="mt-2">
          <Link to={`/student/sessions/${item.id}/livekit`}>{t('sessions.openLiveKit')}</Link>
        </Button>
      ) : null}
    </div>
  );
}

function SessionShowDialog({ item, onClose }: { item: SessionRow; onClose: () => void }) {
  const { t, locale } = useLocale();
  const isMobile = useIsMobile();
  const title = `${t('crud.view')} ${t('nav.mySessions')}`;

  if (isMobile) {
    return (
      <Sheet open onOpenChange={v => !v && onClose()}>
        <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-2xl pb-8">
          <SheetHeader className="text-start">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <SessionDetailFields item={item} locale={locale} />
          </div>
          <SheetFooter className="mt-6">
            <Button variant="outline" className="w-full" onClick={onClose}>
              {t('misc.close')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <SessionDetailFields item={item} locale={locale} />
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>{t('misc.close')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SessionJoinButton({ item }: { item: SessionRow }) {
  const { t } = useLocale();

  if (isOfflineSession(item)) {
    return (
      <span className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{item.location || t('sessions.type.offline')}</span>
      </span>
    );
  }

  if (item.provider === 'livekit') {
    return (
      <Button asChild size="sm" className="flex-1 gap-1.5">
        <Link to={`/student/sessions/${item.id}/livekit`}>
          <Video className="h-4 w-4" />
          {t('sessions.openLiveKit')}
        </Link>
      </Button>
    );
  }

  if (item.join_url && item.join_url !== '#') {
    return (
      <Button asChild size="sm" className="flex-1 gap-1.5">
        <a href={item.join_url} target="_blank" rel="noreferrer">
          <Video className="h-4 w-4" />
          {t('sessions.join')}
        </a>
      </Button>
    );
  }

  return null;
}

function SessionCard({
  item,
  dateLocale,
  onView,
}: {
  item: SessionRow;
  dateLocale: string;
  onView: () => void;
}) {
  const { t } = useLocale();
  const fonts = useAppFontClasses();
  const teacher = item.teacher?.trim() || t('student.attendance.unknownTeacher');
  const hasJoin = isOfflineSession(item) || item.provider === 'livekit' || (item.join_url && item.join_url !== '#');

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card p-3 shadow-card sm:p-4">
      <p className={cn('line-clamp-2 text-sm font-semibold text-foreground', fonts.display)}>
        {item.center_name || t('col.center')}
      </p>

      <div className="mt-2 space-y-1">
        <p className="line-clamp-2 text-sm font-medium text-foreground">{item.topic}</p>
      </div>

      <div className="mt-2 text-xs sm:text-sm">
        <span className="line-clamp-1 font-medium text-foreground">{teacher}</span>
      </div>

      <div className="mt-4 flex-1 space-y-2 border-t border-border/60 pt-3 text-xs sm:text-sm">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t('col.date')}</span>
          <span className="font-medium text-foreground">{formatShortDate(item.start_at, dateLocale)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t('student.attendance.sessionTime')}</span>
          <span className="font-medium tabular-nums text-foreground">{formatClock(item.start_at, dateLocale)}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t('col.durationMinutes')}</span>
          <span className="font-medium tabular-nums text-foreground">{item.duration} {t('col.minutes')}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t('col.provider')}</span>
          <span className="font-medium text-foreground">{sessionTypeLabel(item, t)}</span>
        </div>
      </div>

      <div className={cn('mt-3 flex gap-2', !hasJoin ? 'flex-col' : 'flex-col sm:flex-row')}>
        <Button type="button" size="sm" variant="outline" className="flex-1 gap-1.5" onClick={onView}>
          <Eye className="h-4 w-4" />
          {t('crud.view')}
        </Button>
        {hasJoin ? <SessionJoinButton item={item} /> : null}
      </div>
    </div>
  );
}

export default function StudentSessions() {
  const { t, locale } = useLocale();
  const fonts = useAppFontClasses();
  const { data, isLoading } = useStudentBootstrap();
  const allRows = useMemo(() => (data?.sessions || []) as SessionRow[], [data?.sessions]);

  const [centerFilter, setCenterFilter] = useState('');
  const [teacherFilter, setTeacherFilter] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [showItem, setShowItem] = useState<SessionRow | null>(null);

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

  const providers = useMemo(() => uniqueSorted(allRows.map(r => r.provider)), [allRows]);

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

  useEffect(() => {
    if (providerFilter && !providers.includes(providerFilter)) {
      setProviderFilter('');
    }
  }, [providerFilter, providers]);

  const filteredRows = useMemo(() => {
    return allRows.filter(row => {
      const centerId = resolveRowCenterId(row, soleCenterId);
      if (centerFilter && centerId !== centerFilter) return false;
      if (teacherFilter && teacherKey(row) !== teacherFilter) return false;
      if (providerFilter && row.provider !== providerFilter) return false;
      if (monthFilter && monthKey(row.start_at) !== monthFilter) return false;
      return true;
    });
  }, [allRows, centerFilter, teacherFilter, providerFilter, monthFilter, soleCenterId]);

  const monthGroups = useMemo(
    () => buildMonthGroups(filteredRows, dateLocale),
    [filteredRows, dateLocale],
  );

  const summary = useMemo(() => summarizeRows(filteredRows), [filteredRows]);
  const appliedFilters = [centerFilter, teacherFilter, providerFilter, monthFilter].filter(Boolean).length;

  const clearFilters = () => {
    setCenterFilter('');
    setTeacherFilter('');
    setProviderFilter('');
    setMonthFilter('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="page-header">
          <div>
            <h1 className={cn('flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl', fonts.display)}>
              <CalendarDays className="h-6 w-6 text-primary" aria-hidden />
              {t('nav.mySessions')}
            </h1>
            <p className="page-description mt-1 text-sm text-muted-foreground sm:text-base">
              {t('page.studentSessions.desc')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              {t('student.sessions.total')}
            </p>
            <p className={cn('mt-1 text-2xl font-semibold tabular-nums', fonts.display)}>
              {isLoading ? '…' : summary.total}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              <Monitor className="h-3.5 w-3.5 text-primary" aria-hidden />
              {t('sessions.type.online')}
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">{summary.online}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              <MapPin className="h-3.5 w-3.5 text-warning" aria-hidden />
              {t('sessions.type.offline')}
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-warning">{summary.offline}</p>
          </div>
          <div className="rounded-xl border border-border bg-card px-3 py-3 shadow-card sm:px-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground sm:text-xs">
              <CalendarDays className="h-3.5 w-3.5 text-success" aria-hidden />
              {t('student.sessions.upcoming')}
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-success">{summary.upcoming}</p>
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
                    <option key={key} value={key}>{teacherLabel(key, t)}</option>
                  ))}
                </FormSelect>
              </StudentFilterField>
              <StudentFilterField id={`${idPrefix}-provider`} label={t('col.provider')}>
                <FormSelect
                  id={`${idPrefix}-provider`}
                  title={t('col.provider')}
                  value={providerFilter}
                  onChange={e => setProviderFilter(e.target.value)}
                >
                  <option value="">{t('filter.all')}</option>
                  {providers.map(name => (
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
                    <div key={j} className="h-48 animate-pulse rounded-xl border border-border bg-muted/30" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : monthGroups.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-4 py-12 text-center text-muted-foreground">
            {t('student.sessions.empty')}
          </div>
        ) : (
          <div className="space-y-6">
            {monthGroups.map(group => (
              <section key={group.month} className="space-y-3">
                <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border/60 pb-2">
                  <div>
                    <h2 className={cn('text-base font-semibold sm:text-lg', fonts.display)}>{group.label}</h2>
                    <p className="text-xs text-muted-foreground">
                      {group.summary.online} {t('sessions.type.online').toLowerCase()} · {group.summary.offline} {t('sessions.type.offline').toLowerCase()}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {group.summary.total} {t('crud.results')}
                  </span>
                </div>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.rows.map(item => (
                    <SessionCard
                      key={portalRowKey(item.center_id, item.id)}
                      item={item}
                      dateLocale={dateLocale}
                      onView={() => setShowItem(item)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {showItem ? <SessionShowDialog item={showItem} onClose={() => setShowItem(null)} /> : null}
    </DashboardLayout>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarCheck,
  CalendarDays,
  CalendarX2,
  Clock3,
  Eye,
  LayoutGrid,
  Percent,
  Search,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/DashboardLayout';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import TableLoading from '@/components/TableLoading';
import { dateOnly } from '@/components/student/StudentPageFilterBar';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useAdminScopeFilterState } from '@/hooks/use-admin-scope-filters';
import { useQuery } from '@tanstack/react-query';
import { adminAttendanceApi, type AttendanceHistoryDay } from '@/services/endpoints/admin-attendance';
import { cn } from '@/lib/utils';

function dayRate(day: AttendanceHistoryDay): number {
  if (!day.total) return 0;
  return ((day.present + day.late) / day.total) * 100;
}

function formatWeekday(date: string, locale: string): string {
  const value = dateOnly(date);
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  try {
    return new Intl.DateTimeFormat(locale.startsWith('ar') ? 'ar' : 'en', { weekday: 'long' }).format(parsed);
  } catch {
    return '';
  }
}

function formatPrettyDate(date: string, locale: string): string {
  const value = dateOnly(date);
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  try {
    return new Intl.DateTimeFormat(locale.startsWith('ar') ? 'ar' : 'en', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(parsed);
  } catch {
    return value;
  }
}

function monthKey(date: string): string {
  return dateOnly(date).slice(0, 7);
}

function monthLabel(key: string, locale: string): string {
  const parsed = new Date(`${key}-01T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return key;
  try {
    return new Intl.DateTimeFormat(locale.startsWith('ar') ? 'ar' : 'en', {
      month: 'long',
      year: 'numeric',
    }).format(parsed);
  } catch {
    return key;
  }
}

function AttendanceBar({ present, late, absent, total }: {
  present: number;
  late: number;
  absent: number;
  total: number;
}) {
  if (total <= 0) {
    return <div className="h-2 w-full rounded-full bg-muted" />;
  }
  const p = (present / total) * 100;
  const l = (late / total) * 100;
  const a = (absent / total) * 100;
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
      <span className="bg-emerald-500 transition-all" style={{ width: `${p}%` }} />
      <span className="bg-amber-500 transition-all" style={{ width: `${l}%` }} />
      <span className="bg-destructive transition-all" style={{ width: `${a}%` }} />
    </div>
  );
}

export default function AdminReportAttendanceSection() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, locale } = useLocale();
  const { data: bootstrap, isLoading: bootLoading } = useAdminBootstrap();
  const [search, setSearch] = useState('');

  const sections = useMemo(
    () =>
      (bootstrap?.sections || []) as Array<{
        id: number;
        name: string;
        grade_id: number;
        class_id: number;
      }>,
    [bootstrap?.sections],
  );
  const grades = useMemo(
    () => (bootstrap?.grades || []) as Array<{ id: number; name: string }>,
    [bootstrap?.grades],
  );
  const classes = useMemo(
    () => (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>,
    [bootstrap?.classes],
  );

  const numericSectionId = Number(sectionId);
  const section = sections.find(s => s.id === numericSectionId);
  const grade = grades.find(g => g.id === section?.grade_id);
  const cls = classes.find(c => c.id === section?.class_id);

  const initialDate = searchParams.get('date') || '';
  const {
    gradeFilter,
    classFilter,
    sectionFilter,
    dateFilter,
    setDateFilter,
    setGradeFilter,
    setClassFilter,
    setSectionFilter,
    classesByGrade,
    sectionsByClass,
    appliedCount,
    clearFilters,
    handleGradeChange,
    handleClassChange,
  } = useAdminScopeFilterState(grades, classes, sections);

  useEffect(() => {
    if (!numericSectionId || !section) return;
    setGradeFilter(String(section.grade_id));
    setClassFilter(String(section.class_id));
    setSectionFilter(String(section.id));
    if (initialDate) setDateFilter(initialDate);
  }, [
    numericSectionId,
    section?.grade_id,
    section?.class_id,
    section?.id,
    initialDate,
    setGradeFilter,
    setClassFilter,
    setSectionFilter,
    setDateFilter,
  ]);

  const handleDateChange = (value: string) => {
    setDateFilter(value);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('date', value);
    else next.delete('date');
    setSearchParams(next, { replace: true });
  };

  const handleClearFilters = () => {
    clearFilters();
    if (section) {
      setGradeFilter(String(section.grade_id));
      setClassFilter(String(section.class_id));
      setSectionFilter(String(section.id));
    }
    setSearch('');
    setSearchParams({}, { replace: true });
  };

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['report-attendance-section', numericSectionId],
    queryFn: () => adminAttendanceApi.getSectionHistory(numericSectionId),
    enabled: Boolean(sectionId) && Boolean(section),
  });

  const attendanceDays = useMemo(() => {
    let days = [...(historyData?.days || [])];
    if (dateFilter) {
      days = days.filter(day => dateOnly(day.date) === dateFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      days = days.filter(day => {
        const pretty = formatPrettyDate(day.date, locale).toLowerCase();
        const weekday = formatWeekday(day.date, locale).toLowerCase();
        return dateOnly(day.date).includes(q) || pretty.includes(q) || weekday.includes(q);
      });
    }
    return days.sort((a, b) => dateOnly(b.date).localeCompare(dateOnly(a.date)));
  }, [historyData?.days, dateFilter, search, locale]);

  const summary = useMemo(() => {
    const days = historyData?.days || [];
    const totalPresent = days.reduce((sum, d) => sum + d.present, 0);
    const totalAbsent = days.reduce((sum, d) => sum + d.absent, 0);
    const totalLate = days.reduce((sum, d) => sum + d.late, 0);
    const totalRecords = days.reduce((sum, d) => sum + d.total, 0);
    const rate = totalRecords > 0 ? ((totalPresent + totalLate) / totalRecords) * 100 : 0;
    return { daysCount: days.length, totalPresent, totalAbsent, totalLate, totalRecords, rate };
  }, [historyData?.days]);

  const groupedByMonth = useMemo(() => {
    const map = new Map<string, AttendanceHistoryDay[]>();
    for (const day of attendanceDays) {
      const key = monthKey(day.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(day);
    }
    return Array.from(map.entries());
  }, [attendanceDays]);

  if (!bootLoading && !section) {
    return (
      <DashboardLayout>
        <Card className="border-dashed border-border bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <LayoutGrid className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{t('crud.noData')}</p>
            <Button asChild variant="secondary" size="sm">
              <Link to="/admin/reports/attendance">{t('reports.backToAttendanceReport')}</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-header mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button asChild variant="outline" size="icon" className="mt-0.5 shrink-0">
            <Link to="/admin/reports/attendance" aria-label={t('reports.backToAttendanceReport')}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="page-title">{t('reports.sectionAttendance')}</h1>
            <p className="page-description">
              {[grade?.name, cls?.name, section?.name].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        {section ? (
          <Button asChild variant="secondary" className="gap-1.5 shrink-0">
            <Link to={`/admin/attendance/section/${section.id}/history`}>
              <CalendarDays className="h-4 w-4" />
              {t('attendance.history')}
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="mb-4 overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Users className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('col.section')}</p>
            <p className="font-display text-lg font-semibold leading-tight">{section?.name || '—'}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {grade?.name || '—'} · {cls?.name || '—'}
            </p>
          </div>
          <Badge variant="secondary" className="tabular-nums">
            {summary.daysCount} {t('reports.daysRecorded')}
          </Badge>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Percent className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{summary.rate.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">{t('stat.attendanceRate')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{summary.totalPresent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t('reports.presentCount')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <CalendarX2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{summary.totalAbsent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t('reports.absentCount')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Clock3 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{summary.totalLate.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{t('reports.lateCount')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <AdminScopeFilterBar
        grades={grades}
        classesByGrade={classesByGrade}
        sectionsByClass={sectionsByClass}
        gradeFilter={gradeFilter || (section ? String(section.grade_id) : '')}
        classFilter={classFilter || (section ? String(section.class_id) : '')}
        sectionFilter={sectionFilter || (section ? String(section.id) : '')}
        dateFilter={dateFilter}
        showDate
        onGradeChange={handleGradeChange}
        onClassChange={handleClassChange}
        onSectionChange={value => {
          setSectionFilter(value);
          if (value && Number(value) !== numericSectionId) {
            const params = dateFilter ? `?date=${encodeURIComponent(dateFilter)}` : '';
            navigate(`/admin/reports/attendance/section/${value}${params}`);
          }
        }}
        onDateChange={handleDateChange}
        appliedCount={appliedCount + (search.trim() ? 1 : 0)}
        onClear={handleClearFilters}
        resultCount={attendanceDays.length}
      />

      <div className="mb-4 relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
        <Input
          className="ps-9"
          placeholder={t('reports.sectionSearchPlaceholder')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label={t('reports.sectionSearchPlaceholder')}
        />
      </div>

      <div className="space-y-6">
        {isLoading || bootLoading ? (
          <Card className="border-border/80 shadow-card">
            <CardContent>
              <TableLoading />
            </CardContent>
          </Card>
        ) : attendanceDays.length === 0 ? (
          <Card className="border-dashed border-border bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <CalendarDays className="h-10 w-10 text-muted-foreground/40" />
              <p className="max-w-sm text-sm text-muted-foreground">
                {search.trim() || dateFilter
                  ? t('reports.sectionEmptySearch')
                  : t('reports.sectionNoDays')}
              </p>
            </CardContent>
          </Card>
        ) : (
          groupedByMonth.map(([key, days]) => (
            <section key={key} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <h2 className="font-display text-base font-semibold">{monthLabel(key, locale)}</h2>
                <Badge variant="outline" className="tabular-nums">{days.length}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {days.map(day => {
                  const rate = dayRate(day);
                  const rateTone =
                    rate >= 85 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-destructive';
                  return (
                    <article
                      key={day.date}
                      className="flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-card transition-shadow hover:shadow-md"
                    >
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                            {formatWeekday(day.date, locale)}
                          </p>
                          <p className="font-display text-base font-semibold leading-tight">
                            {formatPrettyDate(day.date, locale)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">{dateOnly(day.date)}</p>
                        </div>
                        <div className={cn('rounded-lg bg-muted/60 px-2.5 py-1.5 text-end', rateTone)}>
                          <p className="font-display text-lg font-semibold tabular-nums leading-none">{rate.toFixed(0)}%</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">{t('stat.attendanceRate')}</p>
                        </div>
                      </div>

                      <AttendanceBar
                        present={day.present}
                        late={day.late}
                        absent={day.absent}
                        total={day.total}
                      />

                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-emerald-500/10 px-2 py-2">
                          <p className="font-display text-sm font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                            {day.present}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{t('attendance.present')}</p>
                        </div>
                        <div className="rounded-lg bg-amber-500/10 px-2 py-2">
                          <p className="font-display text-sm font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                            {day.late}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{t('attendance.late')}</p>
                        </div>
                        <div className="rounded-lg bg-destructive/10 px-2 py-2">
                          <p className="font-display text-sm font-semibold tabular-nums text-destructive">
                            {day.absent}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{t('attendance.absent')}</p>
                        </div>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border/60 pt-3">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {day.total} {t('reports.totalRecords').toLowerCase()}
                        </span>
                        <Button asChild size="sm" variant="outline" className="h-8 gap-1.5">
                          <Link to={`/admin/attendance/section/${sectionId}/date/${dateOnly(day.date)}`}>
                            <Eye className="h-3.5 w-3.5" />
                            {t('attendance.view')}
                          </Link>
                        </Button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}

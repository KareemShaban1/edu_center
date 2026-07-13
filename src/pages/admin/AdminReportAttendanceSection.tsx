import { useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import { dateOnly } from '@/components/student/StudentPageFilterBar';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useAdminScopeFilterState } from '@/hooks/use-admin-scope-filters';
import { useQuery } from '@tanstack/react-query';
import { adminAttendanceApi } from '@/services/endpoints/admin-attendance';
import { CalendarCheck } from 'lucide-react';

export default function AdminReportAttendanceSection() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLocale();
  const { data: bootstrap } = useAdminBootstrap();

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

  // Initialize filters for this section and optional date from URL
  useEffect(() => {
    if (!numericSectionId || !section) return;
    setGradeFilter(String(section.grade_id));
    setClassFilter(String(section.class_id));
    setSectionFilter(String(section.id));
    if (initialDate) setDateFilter(initialDate);
  }, [numericSectionId, section?.grade_id, section?.class_id, section?.id, initialDate, setGradeFilter, setClassFilter, setSectionFilter, setDateFilter]);

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
    setSearchParams({}, { replace: true });
  };

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['report-attendance-section', numericSectionId],
    queryFn: () => adminAttendanceApi.getSectionHistory(numericSectionId),
    enabled: Boolean(sectionId) && Boolean(section),
  });

  const attendanceDays = useMemo(() => {
    const days = historyData?.days || [];
    if (!dateFilter) return days;
    return days.filter(day => dateOnly(day.date) === dateFilter);
  }, [historyData?.days, dateFilter]);

  const summary = useMemo(() => {
    const days = historyData?.days || [];
    const totalPresent = days.reduce((sum, d) => sum + d.present, 0);
    const totalAbsent = days.reduce((sum, d) => sum + d.absent, 0);
    const totalLate = days.reduce((sum, d) => sum + d.late, 0);
    const totalRecords = days.reduce((sum, d) => sum + d.total, 0);
    const rate = totalRecords > 0 ? ((totalPresent + totalLate) / totalRecords) * 100 : 0;
    return { daysCount: days.length, totalPresent, totalAbsent, totalLate, rate };
  }, [historyData?.days]);

  if (!section) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">{t('crud.noData')}</p>
        <Button asChild variant="link" className="mt-2 px-0">
          <Link to="/admin/reports/attendance">{t('reports.backToAttendanceReport')}</Link>
        </Button>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link to="/admin/reports/attendance">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="page-title">{t('reports.sectionAttendance')}</h1>
          <p className="text-sm text-muted-foreground">
            {grade?.name} — {cls?.name} — {section.name}
          </p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('reports.daysRecorded')}
          value={summary.daysCount.toLocaleString()}
          icon={CalendarDays}
          variant="attendance"
        />
        <StatCard
          title={t('stat.attendanceRate')}
          value={`${summary.rate.toFixed(1)}%`}
          icon={CalendarCheck}
          variant="attendance"
        />
        <StatCard
          title={t('reports.presentCount')}
          value={summary.totalPresent.toLocaleString()}
          icon={CalendarCheck}
          variant="attendance"
        />
        <StatCard
          title={t('reports.absentCount')}
          value={summary.totalAbsent.toLocaleString()}
          icon={CalendarCheck}
          variant="attendance"
        />
      </div>

      <AdminScopeFilterBar
        grades={grades}
        classesByGrade={classesByGrade}
        sectionsByClass={sectionsByClass}
        gradeFilter={gradeFilter || String(section.grade_id)}
        classFilter={classFilter || String(section.class_id)}
        sectionFilter={sectionFilter || String(section.id)}
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
        appliedCount={appliedCount}
        onClear={handleClearFilters}
        resultCount={attendanceDays.length}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="divide-y divide-border">
          {isLoading && (
            <p className="p-6 text-center text-muted-foreground">{t('reports.loading')}</p>
          )}
          {!isLoading && attendanceDays.length === 0 && (
            <p className="p-6 text-center text-muted-foreground">{t('crud.noData')}</p>
          )}
          {attendanceDays.map(day => (
            <div
              key={day.date}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/20"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">{dateOnly(day.date)}</span>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <StatusBadge status="present" label={day.present + ' ' + t('status.present')} />
                    <StatusBadge status="absent" label={day.absent + ' ' + t('status.absent')} />
                    <StatusBadge status="late" label={day.late + ' ' + t('status.late')} />
                    <span className="text-xs text-muted-foreground">
                      ({day.total} {t('reports.totalRecords').toLowerCase()})
                    </span>
                  </div>
                </div>
              </div>
              <Button asChild size="sm" variant="outline" className="gap-1.5">
                <Link to={`/admin/attendance/section/${sectionId}/date/${dateOnly(day.date)}`}>
                  <Eye className="h-3.5 w-3.5" />
                  {t('attendance.view')}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

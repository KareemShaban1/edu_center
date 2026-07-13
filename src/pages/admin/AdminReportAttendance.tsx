import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, BarChart3, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import StatCard from '@/components/StatCard';
import { CalendarCheck } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import {
  appendAdminDateQuery,
  filterAdminSectionsForTree,
  useAdminScopeFilterState,
} from '@/hooks/use-admin-scope-filters';
import { useQuery } from '@tanstack/react-query';
import { adminReportsApi } from '@/services/endpoints/admin-reports';
import type { Section } from '@/types/models';

function formatStatValue(key: string, value: number): string {
  if (key === 'attendance_rate') return `${value.toFixed(1)}%`;
  return value.toLocaleString();
}

function statLabelKey(key: string): string {
  const map: Record<string, string> = {
    total_records: 'reports.totalRecords',
    attendance_rate: 'stat.attendanceRate',
    present_count: 'reports.presentCount',
    absent_count: 'reports.absentCount',
  };
  return map[key] || key;
}

export default function AdminReportAttendance() {
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
  const sectionsData = useMemo(
    () => (bootstrap?.sections || []) as Section[],
    [bootstrap?.sections],
  );
  const teachers = useMemo(
    () => (bootstrap?.teachers || []) as Array<{ id: number; name: string }>,
    [bootstrap?.teachers],
  );
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

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
  } = useAdminScopeFilterState(grades, classes, sectionsData);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', 'attendance'],
    queryFn: () => adminReportsApi.getByType('attendance'),
  });

  const visibleSections = useMemo(
    () => filterAdminSectionsForTree(sectionsData, classes, { gradeFilter, classFilter, sectionFilter }),
    [sectionsData, classes, gradeFilter, classFilter, sectionFilter],
  );

  const visibleGrades = useMemo(() => {
    if (!gradeFilter) return grades;
    return grades.filter(g => g.id === Number(gradeFilter));
  }, [grades, gradeFilter]);

  const visibleGradeIds = useMemo(
    () => visibleGrades.map(g => g.id).sort((a, b) => a - b).join(','),
    [visibleGrades],
  );

  useEffect(() => {
    const ids = visibleGradeIds ? visibleGradeIds.split(',').map(Number) : [];
    setExpandedGrades(prev => {
      if (prev.size === ids.length && ids.every(id => prev.has(id))) return prev;
      return new Set(ids);
    });
  }, [visibleGradeIds]);

  useEffect(() => {
    if (!gradeFilter || !classFilter) return;
    const key = `${gradeFilter}-${classFilter}`;
    setExpandedClasses(prev => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }, [gradeFilter, classFilter]);

  const grouped = useMemo(() => {
    const map = new Map<number, Map<number, Section[]>>();
    for (const s of visibleSections) {
      if (!map.has(s.grade_id)) map.set(s.grade_id, new Map());
      const classMap = map.get(s.grade_id)!;
      if (!classMap.has(s.class_id)) classMap.set(s.class_id, []);
      classMap.get(s.class_id)!.push(s);
    }
    return map;
  }, [visibleSections]);

  const toggleGrade = (id: number) => {
    setExpandedGrades(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleClass = (key: string) => {
    setExpandedClasses(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const visibleClassesForGrade = (gradeId: number) => {
    const list = classes.filter(c => c.grade_id === gradeId);
    if (!classFilter) return list;
    return list.filter(c => c.id === Number(classFilter));
  };

  const filtersReady = Boolean(gradeFilter && classFilter);

  return (
    <DashboardLayout>
      <div className="page-header">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="page-title">{t('nav.reportsAttendance')}</h1>
            <p className="page-description">{t('page.reports.attendance.desc')}</p>
          </div>
          <Link to="/admin/reports" className="text-sm text-primary hover:underline">
            {t('reports.backToOverview')}
          </Link>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(data?.stats || []).map(stat => (
          <StatCard
            key={stat.key}
            title={t(statLabelKey(stat.key))}
            value={formatStatValue(stat.key, stat.value)}
            icon={CalendarCheck}
            variant="attendance"
          />
        ))}
        {isLoading && (
          <div className="col-span-full rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            {t('reports.loading')}
          </div>
        )}
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
        resultCount={visibleSections.length}
      />

      {!gradeFilter || !classFilter ? (
        <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-6 text-center text-sm text-muted-foreground">
          {t('reports.selectGradeClassHint')}
        </div>
      ) : null}

      <div className="mt-4 space-y-3">
        {!filtersReady ? null : visibleGrades.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            {t('crud.noData')}
          </p>
        ) : (
          visibleGrades.map(grade => {
            const classMap = grouped.get(grade.id);
            const gradeExpanded = expandedGrades.has(grade.id);
            const sectionCount = classMap
              ? Array.from(classMap.values()).reduce((a, b) => a + b.length, 0)
              : 0;

            if (!classMap || sectionCount === 0) return null;

            return (
              <div key={grade.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
                <button
                  type="button"
                  onClick={() => toggleGrade(grade.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  {gradeExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="font-display font-semibold">{grade.name}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {sectionCount} {t('nav.sections')}
                  </span>
                </button>

                {gradeExpanded && (
                  <div className="border-t border-border">
                    {visibleClassesForGrade(grade.id).map(cls => {
                      const sections = classMap.get(cls.id) || [];
                      const classKey = `${grade.id}-${cls.id}`;
                      const classExpanded = expandedClasses.has(classKey);

                      if (sections.length === 0) return null;

                      return (
                        <div key={cls.id} className="border-b border-border/50 last:border-0">
                          <button
                            type="button"
                            onClick={() => toggleClass(classKey)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/20 ltr:pl-10 rtl:pr-10"
                          >
                            {classExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium">{cls.name}</span>
                            <span className="text-xs text-muted-foreground">({sections.length})</span>
                          </button>

                          {classExpanded && (
                            <div className="space-y-1 px-4 pb-2 ltr:pl-16 rtl:pr-16">
                              {sections.map(section => {
                                const teacher = teachers.find(te => te.id === section.teacher_id);
                                return (
                                  <div
                                    key={section.id}
                                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Users className="h-4 w-4 text-muted-foreground" />
                                      <div>
                                        <span className="text-sm font-medium">{section.name}</span>
                                        {teacher ? (
                                          <span className="text-xs text-muted-foreground ltr:ml-2 rtl:mr-2">
                                            — {teacher.name}
                                          </span>
                                        ) : null}
                                      </div>
                                    </div>
                                    <Button asChild size="sm" className="gap-1.5">
                                      <Link
                                        to={appendAdminDateQuery(
                                          `/admin/reports/attendance/section/${section.id}`,
                                          dateFilter,
                                        )}
                                      >
                                        <BarChart3 className="h-3.5 w-3.5" />
                                        {t('reports.viewSectionReport')}
                                      </Link>
                                    </Button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}

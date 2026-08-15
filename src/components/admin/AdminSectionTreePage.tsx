import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarCheck,
  ChevronDown,
  ChevronRight,
  FoldVertical,
  GraduationCap,
  History,
  LayoutGrid,
  Search,
  UnfoldVertical,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import DashboardLayout from '@/components/DashboardLayout';
import TableLoading from '@/components/TableLoading';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import {
  appendAdminDateQuery,
  filterAdminSectionsForTree,
  useAdminScopeFilterState,
} from '@/hooks/use-admin-scope-filters';
import type { Section } from '@/types/models';

interface AdminSectionTreePageProps {
  basePath: 'attendance' | 'exams' | 'quizzes' | 'payments';
  titleKey: string;
  descKey: string;
  todayKey?: string;
  historyKey?: string;
}

export default function AdminSectionTreePage({
  basePath,
  titleKey,
  descKey,
  todayKey = 'attendance.today',
  historyKey = 'attendance.history',
}: AdminSectionTreePageProps) {
  const { t } = useLocale();
  const { data: bootstrap, isLoading } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sectionsData = (bootstrap?.sections || []) as Section[];
  const teachers = (bootstrap?.teachers || []) as Array<{ id: number; name: string }>;
  const allStudents = (bootstrap?.students || []) as Array<{ section_id: number }>;
  const [search, setSearch] = useState('');
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

  const scopedSections = useMemo(
    () => filterAdminSectionsForTree(sectionsData, classes, { gradeFilter, classFilter, sectionFilter }),
    [sectionsData, classes, gradeFilter, classFilter, sectionFilter],
  );

  const visibleSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...scopedSections].sort((a, b) => b.id - a.id);
    if (!q) return sorted;
    return sorted.filter(section => {
      const gradeName = grades.find(g => g.id === section.grade_id)?.name ?? '';
      const className = classes.find(c => c.id === section.class_id)?.name ?? '';
      const teacherName = teachers.find(teacher => teacher.id === section.teacher_id)?.name ?? '';
      return [section.name, gradeName, className, teacherName].some(value => value.toLowerCase().includes(q));
    });
  }, [scopedSections, search, grades, classes, teachers]);

  const grouped = useMemo(() => {
    const map = new Map<number, Map<number, Section[]>>();
    for (const section of visibleSections) {
      if (!map.has(section.grade_id)) map.set(section.grade_id, new Map());
      const classMap = map.get(section.grade_id)!;
      if (!classMap.has(section.class_id)) classMap.set(section.class_id, []);
      classMap.get(section.class_id)!.push(section);
    }
    return map;
  }, [visibleSections]);

  const visibleGrades = useMemo(() => {
    const list = gradeFilter
      ? grades.filter(g => g.id === Number(gradeFilter))
      : [...grades];
    const withMatches = search.trim()
      ? list.filter(g => {
          const classMap = grouped.get(g.id);
          return classMap ? Array.from(classMap.values()).some(arr => arr.length > 0) : false;
        })
      : list;
    return withMatches.sort((a, b) => {
      const aMax = Math.max(0, ...(grouped.get(a.id) ? Array.from(grouped.get(a.id)!.values()).flat().map(s => s.id) : [0]));
      const bMax = Math.max(0, ...(grouped.get(b.id) ? Array.from(grouped.get(b.id)!.values()).flat().map(s => s.id) : [0]));
      if (bMax !== aMax) return bMax - aMax;
      return b.id - a.id;
    });
  }, [grades, gradeFilter, grouped, search]);

  const studentCountBySectionId = useMemo(() => {
    const counts = new Map<number, number>();
    for (const student of allStudents) {
      counts.set(student.section_id, (counts.get(student.section_id) ?? 0) + 1);
    }
    return counts;
  }, [allStudents]);

  const statTotal = visibleSections.length;
  const statGrades = useMemo(() => new Set(visibleSections.map(s => s.grade_id)).size, [visibleSections]);
  const statClasses = useMemo(
    () => new Set(visibleSections.map(s => `${s.grade_id}-${s.class_id}`)).size,
    [visibleSections],
  );

  const expandAll = useCallback(() => {
    setExpandedGrades(new Set(grades.map(g => g.id)));
    const keys = new Set<string>();
    classes.forEach(cls => keys.add(`${cls.grade_id}-${cls.id}`));
    setExpandedClasses(keys);
  }, [grades, classes]);

  const collapseAll = useCallback(() => {
    setExpandedGrades(new Set());
    setExpandedClasses(new Set());
  }, []);

  useEffect(() => {
    setExpandedGrades(new Set(grades.map(g => g.id)));
    const keys = new Set<string>();
    sectionsData.forEach(section => keys.add(`${section.grade_id}-${section.class_id}`));
    setExpandedClasses(keys);
  }, [grades, sectionsData]);

  useEffect(() => {
    const q = search.trim();
    if (!q) return;
    const gIds = new Set<number>();
    const cKeys = new Set<string>();
    visibleSections.forEach(section => {
      gIds.add(section.grade_id);
      cKeys.add(`${section.grade_id}-${section.class_id}`);
    });
    setExpandedGrades(prev => new Set([...prev, ...gIds]));
    setExpandedClasses(prev => new Set([...prev, ...cKeys]));
  }, [search, visibleSections]);

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

  const visibleClassesForGrade = (gradeId: number, classMap?: Map<number, Section[]>) => {
    const list = classes.filter(c => c.grade_id === gradeId);
    const filtered = classFilter ? list.filter(c => c.id === Number(classFilter)) : list;
    return filtered.slice().sort((a, b) => {
      const aMax = Math.max(0, ...(classMap?.get(a.id) || []).map(s => s.id));
      const bMax = Math.max(0, ...(classMap?.get(b.id) || []).map(s => s.id));
      if (bMax !== aMax) return bMax - aMax;
      return b.id - a.id;
    });
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t(titleKey)}</h1>
        <p className="page-description">{t(descKey)}</p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{statTotal}</p>
              <p className="text-xs text-muted-foreground">{t('page.sectionsAdmin.statTotal')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{statGrades}</p>
              <p className="text-xs text-muted-foreground">{t('page.sectionsAdmin.statGrades')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{statClasses}</p>
              <p className="text-xs text-muted-foreground">{t('page.sectionsAdmin.statClasses')}</p>
            </div>
          </CardContent>
        </Card>
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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
          <Input
            className="ps-9"
            placeholder={t('page.sectionsAdmin.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label={t('page.sectionsAdmin.searchPlaceholder')}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={expandAll}>
            <UnfoldVertical className="h-3.5 w-3.5" />
            {t('page.sectionsAdmin.expandAll')}
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={collapseAll}>
            <FoldVertical className="h-3.5 w-3.5" />
            {t('page.sectionsAdmin.collapseAll')}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {isLoading ? (
          <Card className="border-border/80 shadow-card">
            <CardContent>
              <TableLoading />
            </CardContent>
          </Card>
        ) : visibleGrades.length === 0 ? (
          <Card className="border-dashed border-border bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <LayoutGrid className="h-10 w-10 text-muted-foreground/40" />
              <p className="max-w-sm text-sm text-muted-foreground">
                {search.trim() ? t('page.sectionsAdmin.emptySearch') : t('crud.noData')}
              </p>
            </CardContent>
          </Card>
        ) : (
          visibleGrades.map(grade => {
            const classMap = grouped.get(grade.id);
            const gradeExpanded = expandedGrades.has(grade.id);
            const sectionCount = classMap
              ? Array.from(classMap.values()).reduce((a, b) => a + b.length, 0)
              : 0;

            return (
              <section
                key={grade.id}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card"
              >
                <button
                  type="button"
                  onClick={() => toggleGrade(grade.id)}
                  className="flex w-full items-center gap-3 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-4 py-4 text-start transition-colors hover:from-primary/20"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('col.grade')}</p>
                    <h2 className="font-display text-lg font-semibold leading-tight">{grade.name}</h2>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-medium tabular-nums">
                    {sectionCount}
                  </Badge>
                  {gradeExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {gradeExpanded && (
                  <div className="space-y-4 p-4">
                    {visibleClassesForGrade(grade.id, classMap).map(cls => {
                      const sections = classMap?.get(cls.id) || [];
                      const classKey = `${grade.id}-${cls.id}`;
                      const classExpanded = expandedClasses.has(classKey);
                      const visible = !search.trim() || sections.length > 0;
                      if (!visible) return null;

                      return (
                        <div key={cls.id} className="rounded-xl border border-border/70 bg-muted/20">
                          <button
                            type="button"
                            onClick={() => toggleClass(classKey)}
                            className="flex w-full items-center gap-3 px-3 py-3 text-start transition-colors hover:bg-muted/40"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
                              <BookOpen className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('col.class')}</p>
                              <p className="text-sm font-semibold leading-tight">{cls.name}</p>
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground">({sections.length})</span>
                            {classExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                          </button>

                          {classExpanded && sections.length > 0 && (
                            <div className="grid gap-3 p-3 pt-0 sm:grid-cols-2 xl:grid-cols-3">
                              {sections.map(section => {
                                const teacher = teachers.find(te => te.id === section.teacher_id);
                                const studentCount = studentCountBySectionId.get(section.id) ?? 0;
                                return (
                                  <article
                                    key={section.id}
                                    className="flex flex-col rounded-xl border border-border bg-background p-3 shadow-sm transition-shadow hover:shadow-md"
                                  >
                                    <div className="mb-3 flex items-start gap-3">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                        <Users className="h-4 w-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-display text-sm font-semibold leading-tight">{section.name}</p>
                                        <p className="mt-1 truncate text-xs text-muted-foreground">
                                          {teacher ? teacher.name : t('page.sectionsAdmin.noTeacher')}
                                        </p>
                                        {studentCount > 0 ? (
                                          <Badge variant="secondary" className="mt-2 h-5 px-1.5 text-[10px] tabular-nums">
                                            {studentCount}
                                          </Badge>
                                        ) : null}
                                      </div>
                                    </div>
                                    <div className="mt-auto flex flex-wrap gap-2 border-t border-border/60 pt-3">
                                      {/* <Button asChild size="sm" className="flex-1 gap-1.5">
                                        <Link to={appendAdminDateQuery(`/admin/${basePath}/section/${section.id}/today`, dateFilter)}>
                                          <CalendarCheck className="h-3.5 w-3.5" />
                                          {t(todayKey)}
                                        </Link>
                                      </Button> */}
                                      <Button asChild size="sm" variant="outline" className="flex-1 gap-1.5">
                                        <Link to={appendAdminDateQuery(`/admin/${basePath}/section/${section.id}/history`, dateFilter)}>
                                          <History className="h-3.5 w-3.5" />
                                          {t(historyKey)}
                                        </Link>
                                      </Button>
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          )}

                          {classExpanded && sections.length === 0 && (
                            <p className="px-4 pb-3 text-xs text-muted-foreground">{t('crud.noData')}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>
    </DashboardLayout>
  );
}

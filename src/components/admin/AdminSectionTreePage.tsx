import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Users, CalendarCheck, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
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
  const { data: bootstrap } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sectionsData = (bootstrap?.sections || []) as Section[];
  const teachers = (bootstrap?.teachers || []) as Array<{ id: number; name: string }>;
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

  const visibleSections = useMemo(
    () => filterAdminSectionsForTree(sectionsData, classes, { gradeFilter, classFilter, sectionFilter }),
    [sectionsData, classes, gradeFilter, classFilter, sectionFilter],
  );

  const visibleGrades = useMemo(() => {
    if (!gradeFilter) return grades;
    return grades.filter(g => g.id === Number(gradeFilter));
  }, [grades, gradeFilter]);

  useEffect(() => {
    setExpandedGrades(new Set(visibleGrades.map(g => g.id)));
  }, [visibleGrades]);

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
    setExpandedGrades(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleClass = (key: string) => {
    setExpandedClasses(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  const visibleClassesForGrade = (gradeId: number) => {
    const list = classes.filter(c => c.grade_id === gradeId);
    if (!classFilter) return list;
    return list.filter(c => c.id === Number(classFilter));
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t(titleKey)}</h1>
        <p className="page-description">{t(descKey)}</p>
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

      <div className="space-y-3">
        {visibleGrades.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            {t('crud.noData')}
          </p>
        ) : (
          visibleGrades.map(grade => {
            const classMap = grouped.get(grade.id);
            const gradeExpanded = expandedGrades.has(grade.id);
            const sectionCount = classMap ? Array.from(classMap.values()).reduce((a, b) => a + b.length, 0) : 0;

            return (
              <div key={grade.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
                <button
                  onClick={() => toggleGrade(grade.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  {gradeExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                  <span className="font-display font-semibold">{grade.name}</span>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{sectionCount} {t('nav.sections')}</span>
                </button>

                {gradeExpanded && classMap && (
                  <div className="border-t border-border">
                    {visibleClassesForGrade(grade.id).map(cls => {
                      const sections = classMap.get(cls.id) || [];
                      const classKey = `${grade.id}-${cls.id}`;
                      const classExpanded = expandedClasses.has(classKey);

                      return (
                        <div key={cls.id} className="border-b border-border/50 last:border-0">
                          <button
                            onClick={() => toggleClass(classKey)}
                            className="flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/20 ltr:pl-10 rtl:pr-10"
                          >
                            {classExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                            <span className="text-sm font-medium">{cls.name}</span>
                            <span className="text-xs text-muted-foreground">({sections.length})</span>
                          </button>

                          {classExpanded && sections.length > 0 && (
                            <div className="space-y-1 px-4 pb-2 ltr:pl-16 rtl:pr-16">
                              {sections.map(section => {
                                const teacher = teachers.find(te => te.id === section.teacher_id);
                                return (
                                  <div
                                    key={section.id}
                                    className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5"
                                  >
                                    <div className="flex items-center gap-3">
                                      <Users className="h-4 w-4 text-muted-foreground" />
                                      <div>
                                        <span className="text-sm font-medium">{section.name}</span>
                                        {teacher && (
                                          <span className="text-xs text-muted-foreground ltr:ml-2 rtl:mr-2">— {teacher.name}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Button asChild size="sm" className="gap-1.5">
                                        <Link to={appendAdminDateQuery(`/admin/${basePath}/section/${section.id}/today`, dateFilter)}>
                                          <CalendarCheck className="h-3.5 w-3.5" />
                                          {t(todayKey)}
                                        </Link>
                                      </Button>
                                      <Button asChild size="sm" variant="outline" className="gap-1.5">
                                        <Link to={appendAdminDateQuery(`/admin/${basePath}/section/${section.id}/history`, dateFilter)}>
                                          <History className="h-3.5 w-3.5" />
                                          {t(historyKey)}
                                        </Link>
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {classExpanded && sections.length === 0 && (
                            <p className="px-4 pb-2 text-xs text-muted-foreground ltr:pl-16 rtl:pr-16">{t('crud.noData')}</p>
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

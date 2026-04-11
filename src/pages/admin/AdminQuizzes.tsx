import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Users, CalendarCheck, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import type { Section } from '@/types/models';

export default function AdminQuizzes() {
  const { t } = useLocale();
  const { data: bootstrap } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sectionsData = (bootstrap?.sections || []) as Section[];
  const teachers = (bootstrap?.teachers || []) as Array<{ id: number; name: string }>;
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpandedGrades(new Set(grades.map(g => g.id)));
  }, [grades]);

  const grouped = useMemo(() => {
    const map = new Map<number, Map<number, Section[]>>();
    for (const s of sectionsData) {
      if (!map.has(s.grade_id)) map.set(s.grade_id, new Map());
      const classMap = map.get(s.grade_id)!;
      if (!classMap.has(s.class_id)) classMap.set(s.class_id, []);
      classMap.get(s.class_id)!.push(s);
    }
    return map;
  }, [sectionsData]);

  const toggleGrade = (id: number) => {
    setExpandedGrades(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const toggleClass = (key: string) => {
    setExpandedClasses(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('nav.quizzes')}</h1>
        <p className="page-description">{t('page.quizzes.desc')}</p>
      </div>

      <div className="space-y-3">
        {grades.map(grade => {
          const classMap = grouped.get(grade.id);
          const gradeExpanded = expandedGrades.has(grade.id);
          const sectionCount = classMap ? Array.from(classMap.values()).reduce((a, b) => a + b.length, 0) : 0;

          return (
            <div key={grade.id} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              <button
                onClick={() => toggleGrade(grade.id)}
                className="flex w-full items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                {gradeExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <span className="font-display font-semibold">{grade.name}</span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{sectionCount} {t('nav.sections')}</span>
              </button>

              {gradeExpanded && classMap && (
                <div className="border-t border-border">
                  {classes.filter(c => c.grade_id === grade.id).map(cls => {
                    const sections = classMap.get(cls.id) || [];
                    const classKey = `${grade.id}-${cls.id}`;
                    const classExpanded = expandedClasses.has(classKey);

                    return (
                      <div key={cls.id} className="border-b border-border/50 last:border-0">
                        <button
                          onClick={() => toggleClass(classKey)}
                          className="flex w-full items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors ltr:pl-10 rtl:pr-10"
                        >
                          {classExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                          <span className="text-sm font-medium">{cls.name}</span>
                          <span className="text-xs text-muted-foreground">({sections.length})</span>
                        </button>

                        {classExpanded && sections.length > 0 && (
                          <div className="ltr:pl-16 rtl:pr-16 pb-2 space-y-1 px-4">
                            {sections.map(section => {
                              const teacher = teachers.find(te => te.id === section.teacher_id);
                              return (
                                <div key={section.id} className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
                                  <div className="flex items-center gap-3">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <span className="text-sm font-medium">{section.name}</span>
                                      {teacher && <span className="text-xs text-muted-foreground ltr:ml-2 rtl:mr-2">— {teacher.name}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button asChild size="sm" className="gap-1.5">
                                      <Link to={`/admin/quizzes/section/${section.id}/today`}>
                                        <CalendarCheck className="h-3.5 w-3.5" />
                                        {t('attendance.today')}
                                      </Link>
                                    </Button>
                                    <Button asChild size="sm" variant="outline" className="gap-1.5">
                                      <Link to={`/admin/quizzes/section/${section.id}/history`}>
                                        <History className="h-3.5 w-3.5" />
                                        {t('attendance.history')}
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {classExpanded && sections.length === 0 && (
                          <p className="ltr:pl-16 rtl:pr-16 pb-2 px-4 text-xs text-muted-foreground">{t('crud.noData')}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}

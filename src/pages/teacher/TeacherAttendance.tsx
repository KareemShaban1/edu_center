import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Users } from 'lucide-react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import { FormInput, FormSelect } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';
import { useTeacherBootstrap } from '@/hooks/use-teacher-bootstrap';
import type { TeacherBootstrapPayload } from '@/services/endpoints/teacher';

type TeacherSectionRow = TeacherBootstrapPayload['classes'][number];
type TeacherAttendanceRow = TeacherBootstrapPayload['attendance'][number];

function dateOnly(value: string | null | undefined): string {
  if (!value) return '';
  return String(value).slice(0, 10);
}

interface TeacherAttendanceHierarchyProps {
  sections: TeacherSectionRow[];
  attendanceBySection: Map<number, number>;
  selectedSectionId: string;
  onSelectSection: (sectionId: string) => void;
  t: (key: string) => string;
}

function TeacherAttendanceHierarchy({
  sections,
  attendanceBySection,
  selectedSectionId,
  onSelectSection,
  t,
}: TeacherAttendanceHierarchyProps) {
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  const grades = useMemo(() => {
    const seen = new Map<number, string>();
    for (const section of sections) {
      if (!seen.has(section.grade_id)) seen.set(section.grade_id, section.grade);
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sections]);

  const classesByGradeId = useMemo(() => {
    const map = new Map<number, Array<{ id: number; name: string }>>();
    for (const section of sections) {
      if (!map.has(section.grade_id)) map.set(section.grade_id, []);
      const list = map.get(section.grade_id)!;
      if (!list.some(c => c.id === section.class_id)) {
        list.push({ id: section.class_id, name: section.class });
      }
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [sections]);

  const grouped = useMemo(() => {
    const map = new Map<number, Map<number, TeacherSectionRow[]>>();
    for (const section of sections) {
      if (!map.has(section.grade_id)) map.set(section.grade_id, new Map());
      const classMap = map.get(section.grade_id)!;
      if (!classMap.has(section.class_id)) classMap.set(section.class_id, []);
      classMap.get(section.class_id)!.push(section);
    }
    for (const classMap of map.values()) {
      for (const list of classMap.values()) {
        list.sort((a, b) => a.section.localeCompare(b.section));
      }
    }
    return map;
  }, [sections]);

  useEffect(() => {
    if (grades.length > 0 && expandedGrades.size === 0) {
      setExpandedGrades(new Set(grades.map(g => g.id)));
    }
  }, [grades, expandedGrades.size]);

  useEffect(() => {
    if (!selectedSectionId) return;
    const section = sections.find(s => String(s.id) === selectedSectionId);
    if (!section) return;
    setExpandedGrades(prev => new Set(prev).add(section.grade_id));
    setExpandedClasses(prev => new Set(prev).add(`${section.grade_id}-${section.class_id}`));
  }, [selectedSectionId, sections]);

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

  if (grades.length === 0) {
    return (
      <p className="mb-4 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
        {t('crud.noData')}
      </p>
    );
  }

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{t('nav.group.structure')}</h2>
        {selectedSectionId ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => onSelectSection('')}>
            {t('filter.all')} {t('nav.sections')}
          </Button>
        ) : null}
      </div>

      {grades.map(grade => {
        const classMap = grouped.get(grade.id);
        const gradeExpanded = expandedGrades.has(grade.id);
        const sectionCount = classMap
          ? Array.from(classMap.values()).reduce((total, list) => total + list.length, 0)
          : 0;
        const classes = classesByGradeId.get(grade.id) || [];

        return (
          <div key={grade.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            <button
              type="button"
              onClick={() => toggleGrade(grade.id)}
              className="flex w-full items-center gap-3 px-3 py-3 text-start transition-colors hover:bg-muted/30 sm:px-4"
            >
              {gradeExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 font-display font-semibold">{grade.name}</span>
              <Badge variant="secondary" className="shrink-0 tabular-nums">
                {sectionCount}
              </Badge>
            </button>

            {gradeExpanded && classMap ? (
              <div className="border-t border-border">
                {classes.map(cls => {
                  const sectionList = classMap.get(cls.id) || [];
                  const classKey = `${grade.id}-${cls.id}`;
                  const classExpanded = expandedClasses.has(classKey);

                  return (
                    <div key={cls.id} className="border-b border-border/50 last:border-0">
                      <button
                        type="button"
                        onClick={() => toggleClass(classKey)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-start transition-colors hover:bg-muted/20 ltr:pl-8 rtl:pr-8 sm:ltr:pl-10 sm:rtl:pr-10"
                      >
                        {classExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        )}
                        <span className="min-w-0 flex-1 text-sm font-medium">{cls.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">({sectionList.length})</span>
                      </button>

                      {classExpanded && sectionList.length > 0 ? (
                        <div className="space-y-1.5 px-3 pb-2 ltr:pl-12 rtl:pr-12 sm:ltr:pl-16 sm:rtl:pr-16">
                          {sectionList.map(section => {
                            const isSelected = selectedSectionId === String(section.id);
                            const recordCount = attendanceBySection.get(section.id) || 0;

                            return (
                              <button
                                key={section.id}
                                type="button"
                                onClick={() => onSelectSection(String(section.id))}
                                className={cn(
                                  'flex w-full flex-col gap-2 rounded-lg border px-3 py-2.5 text-start transition-colors sm:flex-row sm:items-center sm:justify-between',
                                  isSelected
                                    ? 'border-primary/40 bg-primary/5'
                                    : 'border-border/50 bg-muted/20 hover:bg-muted/40',
                                )}
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  <div className="min-w-0">
                                    <span className="block text-sm font-medium">{section.section}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {section.students} {t('nav.students').toLowerCase()}
                                    </span>
                                  </div>
                                </div>
                                <Badge variant={isSelected ? 'default' : 'outline'} className="w-fit shrink-0 tabular-nums">
                                  {recordCount} {t('crud.results')}
                                </Badge>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {classExpanded && sectionList.length === 0 ? (
                        <p className="px-3 pb-2 text-xs text-muted-foreground ltr:pl-12 rtl:pr-12 sm:ltr:pl-16 sm:rtl:pr-16">
                          {t('crud.noData')}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function TeacherAttendance() {
  const { t } = useLocale();
  const { data } = useTeacherBootstrap();
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');

  const sections = useMemo(
    () => (data?.classes || []) as TeacherSectionRow[],
    [data?.classes],
  );

  const attendanceBySection = useMemo(() => {
    const counts = new Map<number, number>();
    for (const row of data?.attendance || []) {
      counts.set(row.section_id, (counts.get(row.section_id) || 0) + 1);
    }
    return counts;
  }, [data?.attendance]);

  const filteredRows = useMemo(() => {
    const rows = (data?.attendance || []) as TeacherAttendanceRow[];
    return rows.filter(row => {
      if (dateFilter && dateOnly(row.date) !== dateFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      if (sectionFilter && row.section_id !== Number(sectionFilter)) return false;
      return true;
    });
  }, [data?.attendance, dateFilter, statusFilter, sectionFilter]);

  const selectedSection = sections.find(s => String(s.id) === sectionFilter);

  const columns: CrudColumn<TeacherAttendanceRow>[] = useMemo(() => {
    const base: CrudColumn<TeacherAttendanceRow>[] = [
      { key: 'id', label: t('col.id'), hideOnMobile: true },
      {
        key: 'student',
        label: t('col.student'),
        primary: true,
        render: a => a.student?.name || `Student ${a.student_id}`,
      },
    ];

    if (!sectionFilter) {
      base.push(
        { key: 'grade', label: t('col.grade'), sortable: true, render: a => a.grade || '—' },
        { key: 'class', label: t('col.class'), sortable: true, render: a => a.class || '—' },
        { key: 'section', label: t('col.section'), sortable: true, render: a => a.section || '—' },
      );
    }

    base.push(
      { key: 'date', label: t('col.date'), sortable: true },
      {
        key: 'status',
        label: t('col.status'),
        render: a => <StatusBadge status={a.status} label={t(`attendance.${a.status}`) || a.status} />,
      },
    );

    return base;
  }, [sectionFilter, t]);

  const appliedFilters = [sectionFilter, dateFilter, statusFilter].filter(Boolean).length;

  const clearFilters = () => {
    setDateFilter('');
    setStatusFilter('');
    setSectionFilter('');
  };

  return (
    <CrudPage<TeacherAttendanceRow>
      title={t('nav.attendance')}
      description={t('page.attendance.desc')}
      columns={columns}
      data={filteredRows}
      searchKeys={['date', 'grade', 'class', 'section']}
      readOnly
      topContent={(
        <>
          <TeacherAttendanceHierarchy
            sections={sections}
            attendanceBySection={attendanceBySection}
            selectedSectionId={sectionFilter}
            onSelectSection={setSectionFilter}
            t={t}
          />

          {selectedSection ? (
            <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t('col.section')}: </span>
              <span className="font-medium">
                {selectedSection.grade} · {selectedSection.class} · {selectedSection.section}
              </span>
            </div>
          ) : null}

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="w-full sm:max-w-[200px]">
              <label htmlFor="teacher-attendance-date" className="mb-1.5 block text-sm font-medium">
                {t('col.date')}
              </label>
              <FormInput
                id="teacher-attendance-date"
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:max-w-[200px]">
              <label htmlFor="teacher-attendance-status" className="mb-1.5 block text-sm font-medium">
                {t('col.status')}
              </label>
              <FormSelect
                id="teacher-attendance-status"
                title={t('col.status')}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">{t('filter.all')}</option>
                <option value="present">{t('attendance.present')}</option>
                <option value="absent">{t('attendance.absent')}</option>
                <option value="late">{t('attendance.late')}</option>
              </FormSelect>
            </div>
            {appliedFilters > 0 ? (
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={clearFilters}>
                {t('filter.clear')}
              </Button>
            ) : null}
          </div>
        </>
      )}
    />
  );
}

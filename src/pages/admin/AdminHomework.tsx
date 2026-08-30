import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarIcon,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Edit,
  Eye,
  FoldVertical,
  GraduationCap,
  LayoutGrid,
  Plus,
  Search,
  UnfoldVertical,
} from 'lucide-react';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import DashboardLayout from '@/components/DashboardLayout';
import TableLoading from '@/components/TableLoading';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Homework } from '@/types/models';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminLearningApi } from '@/services/endpoints/admin-learning';
import { toast } from '@/hooks/use-toast';
import { matchAdminScopeRow, useAdminScopeFilters } from '@/hooks/use-admin-scope-filters';

type HomeworkRow = Homework & { submissions_count?: number };

function isHomeworkOverdue(dueDate?: string | null): boolean {
  if (!dueDate) return false;
  const due = String(dueDate).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) return false;
  const today = format(new Date(), 'yyyy-MM-dd');
  return due < today;
}

export default function AdminHomework() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap, isLoading } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;
  const [data, setData] = useState<HomeworkRow[]>([]);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<HomeworkRow | null | 'new'>(null);
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  const saveMutation = useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: Pick<Homework, 'title' | 'content' | 'grade_id' | 'classroom_id' | 'section_id' | 'start_date' | 'due_date' | 'final_degree'>;
      id?: number;
    }) => (id ? adminLearningApi.updateHomework(id, payload) : adminLearningApi.createHomework(payload)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  useEffect(() => {
    const homework = [...((bootstrap?.homework || []) as HomeworkRow[])].sort((a, b) => b.id - a.id);
    setData(homework);
  }, [bootstrap]);

  const {
    gradeFilter,
    classFilter,
    sectionFilter,
    dateFilter,
    setDateFilter,
    setSectionFilter,
    grades: gradeOptions,
    classesByGrade,
    sectionsByClass,
    filteredRows: scopeFilteredRows,
    appliedCount,
    clearFilters,
    handleGradeChange,
    handleClassChange,
  } = useAdminScopeFilters(
    grades,
    classes,
    sections,
    data,
    undefined,
    (row, filters) => {
      if (!matchAdminScopeRow(row, filters, classes, sections)) return false;
      if (filters.dateFilter) {
        const due = String(row.due_date || '').slice(0, 10);
        const start = String(row.start_date || '').slice(0, 10);
        if (due !== filters.dateFilter && start !== filters.dateFilter) return false;
      }
      return true;
    },
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = scopeFilteredRows;
    if (q) {
      rows = rows.filter(item => {
        const gradeName = grades.find(g => g.id === item.grade_id)?.name ?? '';
        const className = classes.find(c => c.id === item.classroom_id)?.name ?? '';
        const sectionName = sections.find(s => s.id === item.section_id)?.name ?? '';
        return [item.title, item.content, gradeName, className, sectionName, item.start_date, item.due_date]
          .some(value => String(value || '').toLowerCase().includes(q));
      });
    }
    return [...rows].sort((a, b) => b.id - a.id);
  }, [scopeFilteredRows, search, grades, classes, sections]);

  const grouped = useMemo(() => {
    const map = new Map<number, Map<number, HomeworkRow[]>>();
    for (const item of filteredRows) {
      const gradeId = item.grade_id ?? 0;
      const classId = item.classroom_id ?? 0;
      if (!map.has(gradeId)) map.set(gradeId, new Map());
      const classMap = map.get(gradeId)!;
      if (!classMap.has(classId)) classMap.set(classId, []);
      classMap.get(classId)!.push(item);
    }
    return map;
  }, [filteredRows]);

  const visibleGrades = useMemo(() => {
    const list = gradeFilter ? grades.filter(g => g.id === Number(gradeFilter)) : [...grades];
    return list
      .filter(g => grouped.get(g.id) && Array.from(grouped.get(g.id)!.values()).some(arr => arr.length > 0))
      .sort((a, b) => {
        const aMax = Math.max(0, ...(grouped.get(a.id) ? Array.from(grouped.get(a.id)!.values()).flat().map(i => i.id) : [0]));
        const bMax = Math.max(0, ...(grouped.get(b.id) ? Array.from(grouped.get(b.id)!.values()).flat().map(i => i.id) : [0]));
        if (bMax !== aMax) return bMax - aMax;
        return b.id - a.id;
      });
  }, [grades, gradeFilter, grouped]);

  const statTotal = filteredRows.length;
  const statGrades = useMemo(() => new Set(filteredRows.map(i => i.grade_id)).size, [filteredRows]);
  const statClasses = useMemo(
    () => new Set(filteredRows.map(i => `${i.grade_id}-${i.classroom_id}`)).size,
    [filteredRows],
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
    data.forEach(item => keys.add(`${item.grade_id}-${item.classroom_id}`));
    setExpandedClasses(keys);
  }, [grades, data]);

  useEffect(() => {
    if (!search.trim()) return;
    const gIds = new Set<number>();
    const cKeys = new Set<string>();
    filteredRows.forEach(item => {
      if (item.grade_id) gIds.add(item.grade_id);
      cKeys.add(`${item.grade_id}-${item.classroom_id}`);
    });
    setExpandedGrades(prev => new Set([...prev, ...gIds]));
    setExpandedClasses(prev => new Set([...prev, ...cKeys]));
  }, [search, filteredRows]);

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

  const visibleClassesForGrade = (gradeId: number, classMap?: Map<number, HomeworkRow[]>) => {
    const list = classes.filter(c => c.grade_id === gradeId);
    const filtered = classFilter ? list.filter(c => c.id === Number(classFilter)) : list;
    return filtered.slice().sort((a, b) => {
      const aMax = Math.max(0, ...(classMap?.get(a.id) || []).map(i => i.id));
      const bMax = Math.max(0, ...(classMap?.get(b.id) || []).map(i => i.id));
      if (bMax !== aMax) return bMax - aMax;
      return b.id - a.id;
    });
  };

  return (
    <DashboardLayout>
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="page-title">{t('nav.homework')}</h1>
          <p className="page-description">{t('page.homeworkAdmin.desc')}</p>
        </div>
        <Button onClick={() => setEditItem('new')} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> {t('crud.addNew')}
        </Button>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{statTotal}</p>
              <p className="text-xs text-muted-foreground">{t('page.homeworkAdmin.statTotal')}</p>
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
        grades={gradeOptions}
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
        resultCount={filteredRows.length}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
          <Input
            className="ps-9"
            placeholder={t('page.homeworkAdmin.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label={t('page.homeworkAdmin.searchPlaceholder')}
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
                {search.trim() || appliedCount > 0
                  ? t('page.homeworkAdmin.emptySearch')
                  : t('page.homeworkAdmin.noItemsYet')}
              </p>
              {!search.trim() && appliedCount === 0 && (
                <Button variant="secondary" size="sm" className="mt-2 gap-1.5" onClick={() => setEditItem('new')}>
                  <Plus className="h-4 w-4" />
                  {t('crud.addNew')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          visibleGrades.map(grade => {
            const classMap = grouped.get(grade.id);
            const gradeExpanded = expandedGrades.has(grade.id);
            const itemCount = classMap
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
                    {itemCount}
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
                      const classItems = classMap?.get(cls.id) || [];
                      const classKey = `${grade.id}-${cls.id}`;
                      const classExpanded = expandedClasses.has(classKey);
                      if (search.trim() && classItems.length === 0) return null;

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
                            <span className="text-xs tabular-nums text-muted-foreground">({classItems.length})</span>
                            {classExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                          </button>

                          {classExpanded && classItems.length > 0 && (
                            <div className="grid gap-3 p-3 pt-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {classItems.map(item => {
                                const section = sections.find(s => s.id === item.section_id);
                                const overdue = isHomeworkOverdue(item.due_date);
                                return (
                                  <article
                                    key={item.id}
                                    className={cn(
                                      'relative flex flex-col overflow-hidden rounded-xl border border-border bg-background p-3 shadow-sm transition-shadow hover:shadow-md',
                                      overdue && 'border-destructive/30',
                                    )}
                                  >
                                    {overdue && (
                                      <span
                                        className="absolute inset-x-0 top-0 h-1 bg-destructive"
                                        aria-hidden
                                      />
                                    )}
                                    <div className="mb-3 flex items-start gap-3">
                                      <div className={cn(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                                        overdue ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
                                      )}>
                                        <ClipboardList className="h-4 w-4" />
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-display text-sm font-semibold leading-tight line-clamp-2">{item.title}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                          {section?.name ?? '—'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="mb-3 space-y-1 text-xs text-muted-foreground">
                                      <p>
                                        <span className="font-medium text-foreground/80">{t('col.startDate')}: </span>
                                        {item.start_date || '—'}
                                      </p>
                                      <p className={overdue ? 'text-destructive' : undefined}>
                                        <span className={cn('font-medium', overdue ? 'text-destructive' : 'text-foreground/80')}>
                                          {t('col.dueDate')}:{' '}
                                        </span>
                                        {item.due_date || '—'}
                                        {overdue ? (
                                          <span className="ms-1.5 font-medium">({t('page.homeworkAdmin.overdue')})</span>
                                        ) : null}
                                      </p>
                                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                        {item.final_degree ? (
                                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] tabular-nums">
                                            {item.final_degree}
                                          </Badge>
                                        ) : null}
                                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px] tabular-nums">
                                          {item.submissions_count ?? 0} {t('homework.submissions')}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="mt-auto flex items-center justify-between gap-1 border-t border-border/60 pt-2">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 px-2">
                                            <Link to={`/admin/homework/${item.id}/review`} aria-label={t('homework.review')}>
                                              <Eye className="h-3.5 w-3.5" />
                                              <span className="hidden sm:inline">{t('homework.review')}</span>
                                            </Link>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t('homework.reviewSubmissions')}</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => setEditItem(item)}
                                            aria-label={t('crud.edit')}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>{t('crud.edit')}</TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          )}

                          {classExpanded && classItems.length === 0 && (
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

      {editItem !== null && (
        <HomeworkForm
          item={editItem === 'new' ? null : editItem}
          grades={grades}
          classes={classes}
          sections={sections}
          onClose={() => setEditItem(null)}
          onSave={async hw => {
            try {
              await saveMutation.mutateAsync({
                payload: {
                  title: hw.title,
                  content: hw.content,
                  grade_id: hw.grade_id,
                  classroom_id: hw.classroom_id,
                  section_id: hw.section_id,
                  start_date: hw.start_date,
                  due_date: hw.due_date,
                  final_degree: hw.final_degree ?? '',
                },
                id: editItem === 'new' ? undefined : editItem.id,
              });
              toast({ title: t('crud.save') });
              setEditItem(null);
            } catch (error) {
              const message = error instanceof Error ? error.message : t('crud.saveFailed');
              toast({ title: t('crud.saveFailed'), description: message, variant: 'destructive' });
            }
          }}
          saving={saveMutation.isPending}
        />
      )}
    </DashboardLayout>
  );
}

function HomeworkForm({
  item,
  grades,
  classes,
  sections,
  onClose,
  onSave,
  saving,
}: {
  item: Homework | null;
  grades: Array<{ id: number; name: string }>;
  classes: Array<{ id: number; name: string; grade_id: number }>;
  sections: Array<{ id: number; name: string; class_id: number }>;
  onClose: () => void;
  onSave: (h: Homework) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [title, setTitle] = useState(item?.title ?? '');
  const [content, setContent] = useState(item?.content ?? '');
  const [gradeId, setGradeId] = useState<number | undefined>(item?.grade_id);
  const [classroomId, setClassroomId] = useState<number | undefined>(item?.classroom_id);
  const [sectionId, setSectionId] = useState<number | undefined>(item?.section_id);
  const [startDate, setStartDate] = useState<Date | undefined>(item?.start_date ? new Date(item.start_date) : undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(item?.due_date ? new Date(item.due_date) : undefined);
  const [finalDegree, setFinalDegree] = useState(item?.final_degree ?? '');

  const filteredClasses = useMemo(
    () => (gradeId ? classes.filter(c => c.grade_id === gradeId) : []),
    [gradeId, classes],
  );

  const filteredSections = useMemo(
    () => (classroomId ? sections.filter(s => s.class_id === classroomId) : []),
    [classroomId, sections],
  );

  const handleGradeChange = (id: number) => {
    setGradeId(id);
    setClassroomId(undefined);
    setSectionId(undefined);
  };

  const handleClassChange = (id: number) => {
    setClassroomId(id);
    setSectionId(undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !gradeId || !classroomId || !sectionId || !startDate || !dueDate || !finalDegree.trim()) return;
    void onSave({
      id: item?.id ?? 0,
      title,
      content,
      grade_id: gradeId,
      classroom_id: classroomId,
      section_id: sectionId,
      start_date: format(startDate, 'yyyy-MM-dd'),
      due_date: format(dueDate, 'yyyy-MM-dd'),
      final_degree: finalDegree.trim(),
    });
  };

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {item ? `${t('crud.edit')} ${t('nav.homework')}` : `${t('crud.addNew')} ${t('nav.homework')}`}
          </DialogTitle>
          <DialogDescription>{t('page.homeworkAdmin.desc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t('col.title')} <span className="text-destructive">*</span></label>
            <input
              title={t('col.title')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t('col.content')}</label>
            <textarea
              title={t('col.content')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              value={content}
              onChange={e => setContent(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t('col.finalDegree')} <span className="text-destructive">*</span></label>
            <input
              title={t('col.finalDegree')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={finalDegree}
              onChange={e => setFinalDegree(e.target.value)}
              placeholder="e.g. 20"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t('col.grade')} <span className="text-destructive">*</span></label>
            <select
              title={t('col.grade')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={gradeId ?? ''}
              onChange={e => handleGradeChange(Number(e.target.value))}
              required
            >
              <option value="" disabled>— {t('col.grade')} —</option>
              {grades.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t('col.class')} <span className="text-destructive">*</span></label>
            <select
              title={t('col.class')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              value={classroomId ?? ''}
              onChange={e => handleClassChange(Number(e.target.value))}
              disabled={!gradeId}
              required
            >
              <option value="" disabled>— {t('col.class')} —</option>
              {filteredClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">{t('col.section')} <span className="text-destructive">*</span></label>
            <select
              title={t('col.section')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              value={sectionId ?? ''}
              onChange={e => setSectionId(Number(e.target.value))}
              disabled={!classroomId}
              required
            >
              <option value="" disabled>— {t('col.section')} —</option>
              {filteredSections.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('col.startDate')} <span className="text-destructive">*</span></label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !startDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>{t('page.homeworkAdmin.pickDate')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('col.dueDate')} <span className="text-destructive">*</span></label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !dueDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, 'PPP') : <span>{t('page.homeworkAdmin.pickDate')}</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className={cn('p-3 pointer-events-auto')}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>{t('crud.cancel')}</Button>
            <Button type="submit" disabled={saving}>{saving ? t('crud.saving') : t('crud.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

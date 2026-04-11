import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Users,
  GraduationCap,
  BookOpen,
  LayoutGrid,
  Search,
  UnfoldVertical,
  FoldVertical,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import DashboardLayout from '@/components/DashboardLayout';
import FormDialog from '@/components/FormDialog';
import DeleteDialog from '@/components/DeleteDialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { Section, Student } from '@/types/models';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAcademicsApi } from '@/services/endpoints/admin-academics';


export default function AdminSections() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const teachers = (bootstrap?.teachers || []) as Array<{ id: number; name: string }>;
  const allStudents = (bootstrap?.students || []) as Student[];
  const [data, setData] = useState<Section[]>([]);
  const [search, setSearch] = useState('');
  const [editItem, setEditItem] = useState<Section | null | 'new'>(null);
  const [deleteItem, setDeleteItem] = useState<Section | null>(null);
  const [studentsSection, setStudentsSection] = useState<Section | null>(null);
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: Pick<Section, 'name' | 'grade_id' | 'class_id' | 'teacher_id'>; id?: number }) => (
      id ? adminAcademicsApi.updateSection(id, payload) : adminAcademicsApi.createSection(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const filteredSections = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data;
    return data.filter(s => s.name.toLowerCase().includes(q));
  }, [data, search]);

  const grouped = useMemo(() => {
    const map = new Map<number, Map<number, Section[]>>();
    for (const s of filteredSections) {
      if (!map.has(s.grade_id)) map.set(s.grade_id, new Map());
      const classMap = map.get(s.grade_id)!;
      if (!classMap.has(s.class_id)) classMap.set(s.class_id, []);
      classMap.get(s.class_id)!.push(s);
    }
    return map;
  }, [filteredSections]);

  const gradesToShow = useMemo(() => {
    const q = search.trim();
    if (!q) return grades;
    return grades.filter(g => {
      const classMap = grouped.get(g.id);
      if (!classMap) return false;
      return Array.from(classMap.values()).some(arr => arr.length > 0);
    });
  }, [grades, grouped, search]);

  const statTotal = filteredSections.length;
  const statGrades = useMemo(() => new Set(filteredSections.map(s => s.grade_id)).size, [filteredSections]);
  const statClasses = useMemo(
    () => new Set(filteredSections.map(s => `${s.grade_id}-${s.class_id}`)).size,
    [filteredSections],
  );

  const studentCountBySectionId = useMemo(() => {
    const m = new Map<number, number>();
    for (const s of allStudents) {
      m.set(s.section_id, (m.get(s.section_id) ?? 0) + 1);
    }
    return m;
  }, [allStudents]);

  const studentsInDialogSection = useMemo(() => {
    if (!studentsSection) return [];
    return allStudents
      .filter(s => s.section_id === studentsSection.id)
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  }, [allStudents, studentsSection]);

  const expandAll = useCallback(() => {
    setExpandedGrades(new Set(grades.map(g => g.id)));
    const keys = new Set<string>();
    classes.forEach(c => keys.add(`${c.grade_id}-${c.id}`));
    setExpandedClasses(keys);
  }, [grades, classes]);

  const collapseAll = useCallback(() => {
    setExpandedGrades(new Set());
    setExpandedClasses(new Set());
  }, []);

  useEffect(() => {
    const sections = (bootstrap?.sections || []) as Section[];
    setData(sections);
    setExpandedGrades(new Set(grades.map(g => g.id)));
    const classKeys = new Set<string>();
    sections.forEach(s => classKeys.add(`${s.grade_id}-${s.class_id}`));
    setExpandedClasses(classKeys);
  }, [bootstrap, grades]);

  useEffect(() => {
    const q = search.trim();
    if (!q) return;
    const gIds = new Set<number>();
    const cKeys = new Set<string>();
    filteredSections.forEach(s => {
      gIds.add(s.grade_id);
      cKeys.add(`${s.grade_id}-${s.class_id}`);
    });
    setExpandedGrades(prev => new Set([...prev, ...gIds]));
    setExpandedClasses(prev => new Set([...prev, ...cKeys]));
  }, [search, filteredSections]);

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

  const handleDelete = () => {
    if (deleteItem) {
      setData(prev => prev.filter(i => i.id !== deleteItem.id));
      toast({ title: t('crud.deleted'), description: t('crud.deletedDesc') });
    }
    setDeleteItem(null);
  };

  const handleSave = async (section: Section) => {
    try {
      await saveMutation.mutateAsync({
        payload: {
          name: section.name,
          grade_id: section.grade_id,
          class_id: section.class_id,
          teacher_id: section.teacher_id,
        },
        id: editItem && editItem !== 'new' ? editItem.id : undefined,
      });
      setEditItem(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save section';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    }
  };

  const formKey = editItem === 'new' ? 'new' : editItem === null ? 'closed' : String(editItem.id);

  return (
    <DashboardLayout>
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="page-title">{t('nav.sections')}</h1>
          <p className="page-description">{t('page.sectionsAdmin.desc')}</p>
        </div>
        <Button onClick={() => setEditItem('new')} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> {t('crud.addNew')}
        </Button>
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
              <p className="text-[11px] text-muted-foreground/80">{t('page.sectionsAdmin.statClassesHint')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

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

      <div className="space-y-3">
        {gradesToShow.length === 0 ? (
          <Card className="border-dashed border-border bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <LayoutGrid className="h-10 w-10 text-muted-foreground/40" />
              <p className="max-w-sm text-sm text-muted-foreground">
                {search.trim()
                  ? t('page.sectionsAdmin.emptySearch')
                  : grades.length === 0
                    ? t('page.sectionsAdmin.emptyGrades')
                    : t('page.sectionsAdmin.noSectionsYet')}
              </p>
              {!search.trim() && grades.length > 0 && (
                <Button variant="secondary" size="sm" className="mt-2 gap-1.5" onClick={() => setEditItem('new')}>
                  <Plus className="h-4 w-4" />
                  {t('crud.addNew')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          gradesToShow.map(grade => {
            const classMap = grouped.get(grade.id);
            const gradeExpanded = expandedGrades.has(grade.id);
            const sectionCount = classMap
              ? Array.from(classMap.values()).reduce((a, b) => a + b.length, 0)
              : 0;

            return (
              <div
                key={grade.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-card transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => toggleGrade(grade.id)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-muted/40"
                >
                  {gradeExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="min-w-0 flex-1 font-display font-semibold">{grade.name}</span>
                  <Badge variant="secondary" className="shrink-0 font-medium tabular-nums">
                    {sectionCount}
                  </Badge>
                </button>

                {gradeExpanded && classMap && (
                  <div className="border-t border-border">
                    {classes
                      .filter(c => c.grade_id === grade.id)
                      .map(cls => {
                        const sections = classMap.get(cls.id) || [];
                        const classKey = `${grade.id}-${cls.id}`;
                        const classExpanded = expandedClasses.has(classKey);
                        const visible = !search.trim() || sections.length > 0;
                        if (!visible) return null;

                        return (
                          <div key={cls.id} className="border-b border-border/60 last:border-0">
                            <button
                              type="button"
                              onClick={() => toggleClass(classKey)}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-start transition-colors hover:bg-muted/25 ltr:ps-10 rtl:pe-10"
                            >
                              {classExpanded ? (
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              )}
                              <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                              <span className="min-w-0 flex-1 text-sm font-medium">{cls.name}</span>
                              <span className="text-xs tabular-nums text-muted-foreground">({sections.length})</span>
                            </button>

                            {classExpanded && sections.length > 0 && (
                              <ul className="list-none space-y-2 px-4 pb-3 ltr:ps-14 rtl:pe-14" role="list">
                                {sections.map(section => {
                                  const teacher = teachers.find(teacherRow => teacherRow.id === section.teacher_id);
                                  const sectionStudentCount = studentCountBySectionId.get(section.id) ?? 0;
                                  return (
                                    <li
                                      key={section.id}
                                      className={cn(
                                        'flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/15 p-3 sm:flex-row sm:items-center sm:justify-between',
                                      )}
                                    >
                                      <div className="flex min-w-0 items-start gap-3 sm:items-center">
                                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-background shadow-sm sm:mt-0">
                                          <Users className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                          <p className="text-sm font-medium leading-tight">{section.name}</p>
                                          {teacher ? (
                                            <Badge variant="outline" className="font-normal text-xs">
                                              {teacher.name}
                                            </Badge>
                                          ) : (
                                            <span className="text-xs text-muted-foreground">
                                              {t('page.sectionsAdmin.noTeacher')}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1 sm:ps-2">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
                                              onClick={() => setStudentsSection(section)}
                                              aria-label={t('page.sectionsAdmin.showStudents')}
                                            >
                                              <UserRound className="h-3.5 w-3.5 shrink-0" />
                                              <span className="hidden max-w-[9rem] truncate sm:inline sm:max-w-none">
                                                {t('page.sectionsAdmin.showStudents')}
                                              </span>
                                              {sectionStudentCount > 0 ? (
                                                <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px] tabular-nums">
                                                  {sectionStudentCount}
                                                </Badge>
                                              ) : null}
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            {t('page.sectionsAdmin.showStudents')}
                                            {sectionStudentCount > 0
                                              ? ` (${sectionStudentCount})`
                                              : ''}
                                          </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                              onClick={() => setEditItem(section)}
                                              aria-label={t('crud.edit')}
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>{t('crud.edit')}</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                              onClick={() => setDeleteItem(section)}
                                              aria-label={t('crud.delete')}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>{t('crud.delete')}</TooltipContent>
                                        </Tooltip>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}

                            {classExpanded && sections.length === 0 && (
                              <p className="px-4 pb-3 text-xs text-muted-foreground ltr:ps-14 rtl:pe-14">
                                {t('crud.noData')}
                              </p>
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

      {editItem !== null && (
        <SectionForm
          key={formKey}
          item={editItem === 'new' ? null : editItem}
          grades={grades}
          classes={classes}
          teachers={teachers}
          onClose={() => setEditItem(null)}
          onSave={handleSave}
          saving={saveMutation.isPending}
        />
      )}

      <DeleteDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title={`${t('crud.delete')} ${t('nav.sections')}`}
      />

      <Dialog open={!!studentsSection} onOpenChange={open => !open && setStudentsSection(null)}>
        <DialogContent className="flex max-h-[min(85vh,36rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="shrink-0 space-y-1 border-b border-border px-6 py-4 text-start">
            <DialogTitle>{t('page.sectionsAdmin.studentsDialogTitle')}</DialogTitle>
            <DialogDescription asChild>
              <div>
                {studentsSection ? (
                  <>
                    <span className="font-medium text-foreground">{studentsSection.name}</span>
                    <span className="text-muted-foreground"> — {t('page.sectionsAdmin.studentsDialogHint')}</span>
                  </>
                ) : null}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {studentsInDialogSection.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t('page.sectionsAdmin.noStudentsInSection')}
              </p>
            ) : (
              <ul className="space-y-2" role="list">
                {studentsInDialogSection.map(st => (
                  <li
                    key={st.id}
                    className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-muted/15 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="text-sm font-medium leading-tight">{st.name}</span>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      {st.email ? (
                        <span className="break-all text-xs text-muted-foreground">{st.email}</span>
                      ) : null}
                      <Badge variant={st.status === 'active' ? 'secondary' : 'outline'} className="w-fit text-[10px] capitalize">
                        {st.status}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

function SectionForm({
  item,
  grades,
  classes,
  teachers,
  onClose,
  onSave,
  saving,
}: {
  item: Section | null;
  grades: Array<{ id: number; name: string }>;
  classes: Array<{ id: number; name: string; grade_id: number }>;
  teachers: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSave: (s: Section) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(item?.name ?? '');
  const [gradeId, setGradeId] = useState(item?.grade_id ?? grades[0]?.id ?? 0);
  const [classId, setClassId] = useState(item?.class_id ?? 0);
  const [teacherId, setTeacherId] = useState(item?.teacher_id ?? 0);

  const filteredClasses = classes.filter(c => c.grade_id === gradeId);

  const handleGradeChange = (id: number) => {
    setGradeId(id);
    const first = classes.find(c => c.grade_id === id);
    setClassId(first?.id ?? 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !gradeId || !classId) return;
    await onSave({
      id: item?.id ?? 0,
      name: name.trim(),
      grade_id: gradeId,
      class_id: classId,
      teacher_id: teacherId || undefined,
    });
  };

  return (
    <FormDialog
      open
      onClose={onClose}
      title={item ? `${t('crud.edit')} ${t('nav.sections')}` : `${t('crud.addNew')} ${t('nav.sections')}`}
      onSubmit={handleSubmit}
      loading={saving}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="section-grade">{t('col.grade')}</Label>
          <Select
            value={String(gradeId)}
            onValueChange={v => handleGradeChange(Number(v))}
            disabled={grades.length === 0}
          >
            <SelectTrigger id="section-grade" aria-label={t('col.grade')}>
              <SelectValue placeholder={t('col.grade')} />
            </SelectTrigger>
            <SelectContent>
              {grades.map(g => (
                <SelectItem key={g.id} value={String(g.id)}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="section-class">{t('col.class')}</Label>
          <Select
            value={classId > 0 ? String(classId) : '__none__'}
            onValueChange={v => setClassId(v === '__none__' ? 0 : Number(v))}
          >
            <SelectTrigger id="section-class" aria-label={t('col.class')}>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {filteredClasses.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="section-name">{t('col.name')}</Label>
          <Input
            id="section-name"
            title={t('col.name')}
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="section-teacher">{t('col.teacher')}</Label>
          <Select
            value={teacherId ? String(teacherId) : '0'}
            onValueChange={v => setTeacherId(v === '0' ? 0 : Number(v))}
          >
            <SelectTrigger id="section-teacher" aria-label={t('col.teacher')}>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">—</SelectItem>
              {teachers.map(teacherRow => (
                <SelectItem key={teacherRow.id} value={String(teacherRow.id)}>
                  {teacherRow.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </FormDialog>
  );
}

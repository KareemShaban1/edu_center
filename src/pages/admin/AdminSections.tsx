import { useState, useMemo, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import FormDialog from '@/components/FormDialog';
import DeleteDialog from '@/components/DeleteDialog';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { Section } from '@/types/models';
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
  const [data, setData] = useState<Section[]>([]);
  const [editItem, setEditItem] = useState<Section | null | 'new'>(null);
  const [deleteItem, setDeleteItem] = useState<Section | null>(null);
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

  useEffect(() => {
    setData((bootstrap?.sections || []) as Section[]);
    setExpandedGrades(new Set(grades.map(g => g.id)));
  }, [bootstrap, grades]);

  const grouped = useMemo(() => {
    const map = new Map<number, Map<number, Section[]>>();
    for (const s of data) {
      if (!map.has(s.grade_id)) map.set(s.grade_id, new Map());
      const classMap = map.get(s.grade_id)!;
      if (!classMap.has(s.class_id)) classMap.set(s.class_id, []);
      classMap.get(s.class_id)!.push(s);
    }
    return map;
  }, [data]);

  const toggleGrade = (id: number) => {
    setExpandedGrades(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleClass = (key: string) => {
    setExpandedClasses(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
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

  return (
    <DashboardLayout>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">{t('nav.sections')}</h1>
          <p className="page-description">{t('page.sectionsAdmin.desc')}</p>
        </div>
        <Button onClick={() => setEditItem('new')} className="gap-2">
          <Plus className="h-4 w-4" /> {t('crud.addNew')}
        </Button>
      </div>

      <div className="space-y-3">
        {grades.map(grade => {
          const classMap = grouped.get(grade.id);
          const gradeExpanded = expandedGrades.has(grade.id);
          const sectionCount = classMap ? Array.from(classMap.values()).reduce((a, b) => a + b.length, 0) : 0;

          return (
            <div key={grade.id} className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
              {/* Grade Header */}
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
                        {/* Class Header */}
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
                              const teacher = teachers.find(t => t.id === section.teacher_id);
                              return (
                                <div
                                  key={section.id}
                                  className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2"
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
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => setEditItem(section)}
                                      className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                      title={t('crud.edit')}
                                      aria-label={t('crud.edit')}
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteItem(section)}
                                      className="rounded-lg p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                      title={t('crud.delete')}
                                      aria-label={t('crud.delete')}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
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

      {/* Form Dialog */}
      {editItem !== null && (
        <SectionForm
          item={editItem === 'new' ? null : editItem}
          grades={grades}
          classes={classes}
          teachers={teachers}
          onClose={() => setEditItem(null)}
          onSave={handleSave}
          saving={saveMutation.isPending}
        />
      )}

      {/* Delete Dialog */}
      <DeleteDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title={`${t('crud.delete')} ${t('nav.sections')}`}
      />
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

  // Auto-select first class when grade changes
  const handleGradeChange = (id: number) => {
    setGradeId(id);
    const first = classes.find(c => c.grade_id === id);
    setClassId(first?.id ?? 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !gradeId || !classId) return;
    await onSave({ id: item?.id ?? 0, name: name.trim(), grade_id: gradeId, class_id: classId, teacher_id: teacherId || undefined });
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
        <div>
          <label className="text-sm font-medium">{t('col.grade')}</label>
          <select
            title={t('col.grade')}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={gradeId}
            onChange={e => handleGradeChange(Number(e.target.value))}
          >
            {grades.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">{t('col.class')}</label>
          <select
            title={t('col.class')}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={classId}
            onChange={e => setClassId(Number(e.target.value))}
          >
            <option value={0}>—</option>
            {filteredClasses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">{t('col.name')}</label>
          <input
            title={t('col.name')}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t('col.teacher')}</label>
          <select
            title={t('col.teacher')}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={teacherId}
            onChange={e => setTeacherId(Number(e.target.value))}
          >
            <option value={0}>—</option>
            {teachers.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>
    </FormDialog>
  );
}

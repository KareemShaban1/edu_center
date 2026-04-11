import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

export default function AdminHomework() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;
  const [data, setData] = useState<Homework[]>([]);
  const [viewItem, setViewItem] = useState<Homework | null>(null);
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: Pick<Homework, 'title' | 'content' | 'grade_id' | 'classroom_id' | 'section_id' | 'start_date' | 'due_date'>; id?: number }) => (
      id ? adminLearningApi.updateHomework(id, payload) : adminLearningApi.createHomework(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  useEffect(() => {
    setData((bootstrap?.homework || []) as Homework[]);
  }, [bootstrap]);

  const columns: CrudColumn<Homework>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'title', label: t('col.title'), sortable: true },
    {
      key: 'grade_id', label: t('col.grade'), sortable: true,
      render: (h) => grades.find(g => g.id === h.grade_id)?.name ?? '—',
    },
    {
      key: 'classroom_id', label: t('col.class'), sortable: true,
      render: (h) => classes.find(c => c.id === h.classroom_id)?.name ?? '—',
    },
    {
      key: 'section_id', label: t('col.section'), sortable: true,
      render: (h) => sections.find(s => s.id === h.section_id)?.name ?? '—',
    },
    { key: 'start_date', label: t('col.startDate'), sortable: true },
    { key: 'due_date', label: t('col.dueDate'), sortable: true },
    { key: 'show', label: t('crud.show'), render: (h) => <button title={t('crud.show')} onClick={() => setViewItem(h)} className="text-primary hover:underline">{t('attendance.view')}</button> },
  ];

  return (
    <>
      <CrudPage
        title={t('nav.homework')}
        description={t('page.homeworkAdmin.desc')}
        columns={columns}
        data={data}
        searchKeys={['title']}
        onDelete={(item) => setData(prev => prev.filter(i => i.id !== item.id))}
        renderForm={(item, onClose) => (
          <HomeworkForm
            item={item}
            grades={grades}
            classes={classes}
            sections={sections}
            onClose={onClose}
            onSave={async (hw) => {
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
                  },
                  id: item?.id,
                });
                onClose();
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to save homework';
                toast({ title: 'Save failed', description: message, variant: 'destructive' });
              }
            }}
            saving={saveMutation.isPending}
          />
        )}
      />
      {viewItem && (
        <Dialog open onOpenChange={v => !v && setViewItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{viewItem.title}</DialogTitle>
              <DialogDescription>{viewItem.content || '—'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-1 text-sm">
              <p><strong>{t('col.grade')}:</strong> {grades.find(g => g.id === viewItem.grade_id)?.name ?? '—'}</p>
              <p><strong>{t('col.class')}:</strong> {classes.find(c => c.id === viewItem.classroom_id)?.name ?? '—'}</p>
              <p><strong>{t('col.section')}:</strong> {sections.find(s => s.id === viewItem.section_id)?.name ?? '—'}</p>
              <p><strong>{t('col.startDate')}:</strong> {viewItem.start_date}</p>
              <p><strong>{t('col.dueDate')}:</strong> {viewItem.due_date}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
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

  // Cascading filters
  const filteredClasses = useMemo(() => 
    gradeId ? classes.filter(c => c.grade_id === gradeId) : [],
    [gradeId, classes]
  );

  const filteredSections = useMemo(() => 
    classroomId ? sections.filter(s => s.class_id === classroomId) : [],
    [classroomId, sections]
  );

  // Reset dependent selects when parent changes
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
    if (!title || !gradeId || !classroomId || !sectionId || !startDate || !dueDate) return;
    onSave({
      id: item?.id ?? 0,
      title,
      content,
      grade_id: gradeId,
      classroom_id: classroomId,
      section_id: sectionId,
      start_date: format(startDate, 'yyyy-MM-dd'),
      due_date: format(dueDate, 'yyyy-MM-dd'),
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
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t('col.title')} <span className="text-destructive">*</span></label>
            <input
              title={t('col.title')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={title} onChange={e => setTitle(e.target.value)} required
            />
          </div>

          {/* Content */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t('col.content')}</label>
            <textarea
              title={t('col.content')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3} value={content} onChange={e => setContent(e.target.value)}
            />
          </div>

          {/* Grade Select */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t('col.grade')} <span className="text-destructive">*</span></label>
            <select
              title={t('col.grade')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              value={gradeId ?? ''} onChange={e => handleGradeChange(Number(e.target.value))} required
            >
              <option value="" disabled>— {t('col.grade')} —</option>
              {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          {/* Class Select (based on grade) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t('col.class')} <span className="text-destructive">*</span></label>
            <select
              title={t('col.class')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              value={classroomId ?? ''} onChange={e => handleClassChange(Number(e.target.value))}
              disabled={!gradeId} required
            >
              <option value="" disabled>— {t('col.class')} —</option>
              {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Section Select (based on class) */}
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t('col.section')} <span className="text-destructive">*</span></label>
            <select
              title={t('col.section')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              value={sectionId ?? ''} onChange={e => setSectionId(Number(e.target.value))}
              disabled={!classroomId} required
            >
              <option value="" disabled>— {t('col.section')} —</option>
              {filteredSections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('col.startDate')} <span className="text-destructive">*</span></label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Due Date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t('col.dueDate')} <span className="text-destructive">*</span></label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
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

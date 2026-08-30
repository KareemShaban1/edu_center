import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, FileQuestion, ChevronDown, ChevronUp, PenLine } from 'lucide-react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useAdminScopeFilters } from '@/hooks/use-admin-scope-filters';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminQuestionsApi,
  type ExamBankSavePayload,
  type GenerateExamPayload,
} from '@/services/endpoints/admin-questions';
import { toast } from '@/hooks/use-toast';
import type { ExamBank, Lesson, Question } from '@/types/models';

type LessonOption = Lesson & { class_id?: number; class_name?: string };

function sortQuestions(questions: Question[]): Question[] {
  return [...questions].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.id - b.id);
}

function ExamQuestionsView({
  exam,
  onChange,
  onClose,
}: {
  exam: ExamBank;
  onChange: (exam: ExamBank) => void;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState(() => sortQuestions(exam.questions || []));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setQuestions(sortQuestions(exam.questions || []));
  }, [exam]);

  const moveQuestion = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;

    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    setQuestions(next);

    setSaving(true);
    try {
      const updated = await adminQuestionsApi.reorderExamQuestions(exam.id, next.map(q => q.id));
      setQuestions(sortQuestions(updated.questions || next));
      onChange(updated);
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
      toast({ title: t('examBank.orderSaved') });
    } catch (error) {
      setQuestions(sortQuestions(exam.questions || []));
      toast({
        title: t('examBank.orderFailed'),
        description: error instanceof Error ? error.message : '',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{exam.name}</DialogTitle></DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">{t('generatedExams.totalQuestions')}: {exam.total_questions}</p>
          {questions.length === 0 ? (
            <p className="text-muted-foreground">{t('examBank.noQuestions')}</p>
          ) : questions.map((question, index) => (
            <div key={question.id} className="flex gap-3 rounded-lg border p-4">
              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={saving || index === 0}
                  title={t('examBank.moveUp')}
                  onClick={() => moveQuestion(index, -1)}
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={saving || index === questions.length - 1}
                  title={t('examBank.moveDown')}
                  onClick={() => moveQuestion(index, 1)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{index + 1}.</span>
                  <Badge variant="secondary">{t(`questions.type.${question.type}`)}</Badge>
                </div>
                <p className="mt-1 font-medium">{question.question_text}</p>
                <ul className="mt-2 space-y-1">
                  {(question.answers || []).map(answer => (
                    <li key={`${question.id}-${answer.id ?? answer.answer_text}`} className={answer.is_correct ? 'font-medium text-primary' : ''}>
                      {answer.answer_text}{answer.is_correct ? ` (${t('questions.correct')})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExamForm({
  item,
  grades,
  classes,
  questions,
  onClose,
  onSave,
  saving,
}: {
  item: ExamBank | null;
  grades: Array<{ id: number; name: string }>;
  classes: Array<{ id: number; name: string; grade_id: number }>;
  questions: Question[];
  onClose: () => void;
  onSave: (payload: ExamBankSavePayload, id?: number) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(item?.name ?? '');
  const [gradeId, setGradeId] = useState(item?.grade_id ?? grades[0]?.id ?? 0);
  const [classId, setClassId] = useState(item?.class_id ?? 0);
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>(
    item?.question_ids ?? item?.questions?.map(q => q.id) ?? [],
  );

  const classesForGrade = useMemo(
    () => classes.filter(cls => cls.grade_id === gradeId),
    [classes, gradeId],
  );

  const availableQuestions = useMemo(
    () => (classId ? questions.filter(q => q.class_id === classId) : []),
    [questions, classId],
  );

  useEffect(() => {
    setSelectedQuestionIds(prev => prev.filter(id => availableQuestions.some(q => q.id === id)));
  }, [availableQuestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !gradeId || !classId) return;
    await onSave({
      name: name.trim(),
      grade_id: gradeId,
      class_id: classId,
      notes: notes.trim() || undefined,
      question_ids: selectedQuestionIds,
    }, item?.id);
    toast({ title: t('crud.save') });
    onClose();
  };

  return (
    <FormDialog open title={item ? t('crud.edit') : t('crud.addNew')} onClose={onClose} onSubmit={handleSubmit} loading={saving}>
      <FormField label={t('col.name')} id="exam-name" required>
        <FormInput id="exam-name" value={name} onChange={e => setName(e.target.value)} required />
      </FormField>
      <FormField label={t('col.grade')} id="exam-grade" required>
        <FormSelect id="exam-grade" title={t('col.grade')} value={gradeId} onChange={e => { setGradeId(Number(e.target.value)); setClassId(0); setSelectedQuestionIds([]); }}>
          {grades.map(grade => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
        </FormSelect>
      </FormField>
      <FormField label={t('col.class')} id="exam-class" required>
        <FormSelect id="exam-class" title={t('col.class')} value={classId || ''} onChange={e => { setClassId(Number(e.target.value)); setSelectedQuestionIds([]); }} required>
          <option value="">{t('filter.selectClass')}</option>
          {classesForGrade.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
        </FormSelect>
      </FormField>
      <FormField label={t('examBank.selectQuestions')} id="exam-questions">
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-input p-3">
          {!classId ? (
            <p className="text-sm text-muted-foreground">{t('generatedExams.noLessons')}</p>
          ) : availableQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('generatedExams.noQuestionsForLessons')}</p>
          ) : availableQuestions.map(question => (
            <label key={question.id} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={selectedQuestionIds.includes(question.id)}
                onChange={() => setSelectedQuestionIds(prev => (
                  prev.includes(question.id) ? prev.filter(id => id !== question.id) : [...prev, question.id]
                ))}
              />
              <span className="min-w-0 flex-1">
                <Badge variant="secondary" className="mb-1">{t(`questions.type.${question.type}`)}</Badge>
                <span className="block">{question.question_text}</span>
              </span>
            </label>
          ))}
        </div>
      </FormField>
      <FormField label={t('col.notes')} id="exam-notes">
        <FormTextarea id="exam-notes" value={notes} onChange={e => setNotes(e.target.value)} />
      </FormField>
    </FormDialog>
  );
}

function GenerateExamForm({ lessons, questions, onClose, onSave, saving }: {
  lessons: LessonOption[];
  questions: Question[];
  onClose: () => void;
  onSave: (payload: GenerateExamPayload) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [questionCount, setQuestionCount] = useState('');
  const [selectionMode, setSelectionMode] = useState<'random' | 'manual'>('random');
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<number[]>([]);
  const [classId, setClassId] = useState<number | ''>('');
  const [selectedLessonIds, setSelectedLessonIds] = useState<number[]>([]);
  const lessonsForClass = useMemo(() => (classId ? lessons.filter(l => l.class_id === classId) : []), [classId, lessons]);
  const availableQuestions = useMemo(
    () => questions.filter(question => question.lesson_id && selectedLessonIds.includes(question.lesson_id)),
    [questions, selectedLessonIds],
  );

  useEffect(() => {
    setSelectedQuestionIds(prev => prev.filter(id => availableQuestions.some(question => question.id === id)));
  }, [availableQuestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedLessonIds.length === 0) {
      toast({ title: t('generatedExams.validation.required'), variant: 'destructive' });
      return;
    }
    if (selectionMode === 'manual' && selectedQuestionIds.length === 0) {
      toast({ title: t('generatedExams.validation.selectQuestions'), variant: 'destructive' });
      return;
    }
    await onSave({
      name: name.trim(),
      lesson_ids: selectedLessonIds,
      selection_mode: selectionMode,
      question_count: selectionMode === 'random' && questionCount ? Number(questionCount) : undefined,
      question_ids: selectionMode === 'manual' ? selectedQuestionIds : undefined,
      notes: notes.trim() || undefined,
    });
    toast({ title: t('generatedExams.generated') });
    onClose();
  };

  return (
    <FormDialog open title={t('generatedExams.generate')} onClose={onClose} onSubmit={handleSubmit} submitLabel={t('generatedExams.generate')} loading={saving}>
      <FormField label={t('col.name')} id="gen-name" required>
        <FormInput id="gen-name" value={name} onChange={e => setName(e.target.value)} required />
      </FormField>
      <FormField label={t('col.class')} id="gen-class" required>
        <FormSelect id="gen-class" title={t('col.class')} value={classId} onChange={e => { setClassId(e.target.value ? Number(e.target.value) : ''); setSelectedLessonIds([]); setSelectedQuestionIds([]); }} required>
          <option value="">{t('filter.selectClass')}</option>
          {[...new Map(lessons.filter(l => l.class_id).map(l => [l.class_id, l.class_name || String(l.class_id)])).entries()].map(([id, className]) => (
            <option key={id} value={id}>{className}</option>
          ))}
        </FormSelect>
      </FormField>
      <FormField label={t('generatedExams.selectLessons')} id="gen-lessons" required>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-input p-3">
          {lessonsForClass.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('generatedExams.noLessons')}</p>
          ) : lessonsForClass.map(lesson => (
            <label key={lesson.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={selectedLessonIds.includes(lesson.id)} onChange={() => setSelectedLessonIds(prev => prev.includes(lesson.id) ? prev.filter(id => id !== lesson.id) : [...prev, lesson.id])} />
              <span>{lesson.name}</span>
            </label>
          ))}
        </div>
      </FormField>
      <FormField label={t('generatedExams.selectionMode')} id="gen-mode">
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="selection-mode" checked={selectionMode === 'random'} onChange={() => setSelectionMode('random')} />
            <span>{t('generatedExams.modeRandom')}</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="selection-mode" checked={selectionMode === 'manual'} onChange={() => setSelectionMode('manual')} />
            <span>{t('generatedExams.modeManual')}</span>
          </label>
        </div>
      </FormField>
      {selectionMode === 'random' ? (
        <FormField label={t('generatedExams.questionCount')} id="gen-count">
          <FormInput id="gen-count" type="number" min={1} max={availableQuestions.length || undefined} value={questionCount} onChange={e => setQuestionCount(e.target.value)} placeholder={t('generatedExams.questionCountHint')} />
          {availableQuestions.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">{t('generatedExams.availableQuestions').replace('{count}', String(availableQuestions.length))}</p>
          )}
        </FormField>
      ) : (
        <FormField label={t('generatedExams.selectQuestions')} id="gen-questions" required>
          <div className="max-h-56 space-y-2 overflow-y-auto rounded-lg border border-input p-3">
            {selectedLessonIds.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('generatedExams.noQuestions')}</p>
            ) : availableQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('generatedExams.noQuestionsForLessons')}</p>
            ) : availableQuestions.map(question => (
              <label key={question.id} className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedQuestionIds.includes(question.id)}
                  onChange={() => setSelectedQuestionIds(prev => prev.includes(question.id) ? prev.filter(id => id !== question.id) : [...prev, question.id])}
                />
                <span>{question.question_text}</span>
              </label>
            ))}
          </div>
        </FormField>
      )}
      <FormField label={t('col.notes')} id="gen-notes">
        <FormTextarea id="gen-notes" value={notes} onChange={e => setNotes(e.target.value)} />
      </FormField>
    </FormDialog>
  );
}

export default function AdminExamBank() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap, isLoading } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;
  const units = (bootstrap?.units || []) as Array<{ id: number; name: string; class_id?: number }>;
  const lessons = (bootstrap?.lessons || []) as Lesson[];
  const questionRows = (bootstrap?.questions || []) as Question[];
  const [data, setData] = useState<ExamBank[]>([]);
  const [showGenerate, setShowGenerate] = useState(false);
  const [viewExam, setViewExam] = useState<ExamBank | null>(null);

  const lessonRows = useMemo<LessonOption[]>(() => lessons.map(lesson => ({
    ...lesson,
    class_id: units.find(unit => unit.id === lesson.unit_id)?.class_id,
    class_name: classes.find(cls => cls.id === units.find(unit => unit.id === lesson.unit_id)?.class_id)?.name,
  })), [lessons, units, classes]);

  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: ExamBankSavePayload; id?: number }) => (
      id ? adminQuestionsApi.updateExam(id, payload) : adminQuestionsApi.createExam(payload)
    ),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminQuestionsApi.deleteExam(id),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] }); },
  });
  const generateMutation = useMutation({
    mutationFn: (payload: GenerateExamPayload) => adminQuestionsApi.generateExam(payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] }); },
  });
  const viewMutation = useMutation({ mutationFn: (id: number) => adminQuestionsApi.getExam(id) });

  useEffect(() => {
    setData((bootstrap?.exams || bootstrap?.generated_exams || []) as ExamBank[]);
  }, [bootstrap]);

  const { gradeFilter, classFilter, sectionFilter, setSectionFilter, grades: gradeOptions, classesByGrade, sectionsByClass, filteredRows, appliedCount, clearFilters, handleGradeChange, handleClassChange } = useAdminScopeFilters(grades, classes, sections, data);

  const columns: CrudColumn<ExamBank>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'name', label: t('col.name'), sortable: true, primary: true },
    { key: 'grade_id', label: t('col.grade'), render: row => grades.find(g => g.id === row.grade_id)?.name ?? '—' },
    { key: 'class_id', label: t('col.class'), render: row => classes.find(c => c.id === row.class_id)?.name ?? '—' },
    { key: 'total_questions', label: t('generatedExams.totalQuestions'), sortable: true },
    { key: 'created_at', label: t('col.date'), render: row => row.created_at ? new Date(row.created_at).toLocaleDateString() : '—' },
    {
      key: 'questions_link',
      label: t('nav.questions'),
      render: row => (
        <Link to={`/admin/questions?exam=${row.id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
          <FileQuestion className="h-4 w-4" />
          {row.total_questions}
        </Link>
      ),
    },
    {
      key: 'builder',
      label: t('examBuilder.title'),
      render: row => (
        <Button type="button" variant="ghost" size="icon" title={t('examBuilder.open')} asChild>
          <Link to={`/admin/exam-bank/${row.id}/builder`}>
            <PenLine className="h-4 w-4" />
          </Link>
        </Button>
      ),
    },
    {
      key: 'view',
      label: t('crud.show'),
      render: row => (
        <Button type="button" variant="ghost" size="icon" title={t('crud.show')} onClick={async () => {
          try { setViewExam(await viewMutation.mutateAsync(row.id)); } catch (error) {
            toast({ title: 'Load failed', description: error instanceof Error ? error.message : '', variant: 'destructive' });
          }
        }}>
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <CrudPage
        title={t('nav.examBank')}
        description={t('page.examBankAdmin.desc')}
        columns={columns}
        data={filteredRows}
        loading={isLoading}
        searchKeys={['name']}
        actions={<Button variant="outline" onClick={() => setShowGenerate(true)}>{t('generatedExams.generate')}</Button>}
        topContent={(
          <AdminScopeFilterBar grades={gradeOptions} classesByGrade={classesByGrade} sectionsByClass={sectionsByClass} gradeFilter={gradeFilter} classFilter={classFilter} sectionFilter={sectionFilter} onGradeChange={handleGradeChange} onClassChange={handleClassChange} onSectionChange={setSectionFilter} appliedCount={appliedCount} onClear={clearFilters} resultCount={filteredRows.length} />
        )}
        onDelete={async (item) => { await deleteMutation.mutateAsync(item.id); setData(prev => prev.filter(row => row.id !== item.id)); }}
        renderForm={(item, onClose) => (
          <ExamForm item={item} grades={grades} classes={classes} questions={questionRows} saving={saveMutation.isPending} onClose={onClose} onSave={async (payload, id) => {
            try { await saveMutation.mutateAsync({ payload, id }); } catch (error) {
              toast({ title: 'Save failed', description: error instanceof Error ? error.message : '', variant: 'destructive' }); throw error;
            }
          }} />
        )}
      />
      {showGenerate && (
        <GenerateExamForm lessons={lessonRows} questions={questionRows} saving={generateMutation.isPending} onClose={() => setShowGenerate(false)} onSave={async (payload) => {
          try { await generateMutation.mutateAsync(payload); } catch (error) {
            toast({ title: 'Generation failed', description: error instanceof Error ? error.message : '', variant: 'destructive' }); throw error;
          }
        }} />
      )}
      {viewExam && (
        <ExamQuestionsView
          exam={viewExam}
          onChange={setViewExam}
          onClose={() => setViewExam(null)}
        />
      )}
    </>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useAdminScopeFilters } from '@/hooks/use-admin-scope-filters';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQuestionsApi, type GenerateExamPayload } from '@/services/endpoints/admin-questions';
import { toast } from '@/hooks/use-toast';
import type { GeneratedExam, Lesson } from '@/types/models';

type LessonOption = Lesson & { class_id?: number; class_name?: string };

type GeneratedExamRow = GeneratedExam;

function GenerateExamForm({
  lessons,
  onClose,
  onSave,
  saving,
}: {
  lessons: LessonOption[];
  onClose: () => void;
  onSave: (payload: GenerateExamPayload) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [questionCount, setQuestionCount] = useState('');
  const [classId, setClassId] = useState<number | ''>('');
  const [selectedLessonIds, setSelectedLessonIds] = useState<number[]>([]);

  const lessonsForClass = useMemo(() => {
    if (!classId) return [];
    return lessons.filter(lesson => lesson.class_id === classId);
  }, [classId, lessons]);

  const toggleLesson = (lessonId: number) => {
    setSelectedLessonIds(prev => (
      prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedLessonIds.length === 0) {
      toast({ title: t('generatedExams.validation.required'), variant: 'destructive' });
      return;
    }

    await onSave({
      name: name.trim(),
      lesson_ids: selectedLessonIds,
      question_count: questionCount ? Number(questionCount) : undefined,
      notes: notes.trim() || undefined,
    });
    toast({ title: t('generatedExams.generated') });
    onClose();
  };

  return (
    <FormDialog
      open
      title={t('generatedExams.generate')}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={t('generatedExams.generate')}
      loading={saving}
    >
      <FormField label={t('col.name')} id="exam-name" required>
        <FormInput id="exam-name" value={name} onChange={e => setName(e.target.value)} required />
      </FormField>

      <FormField label={t('col.class')} id="exam-class" required>
        <FormSelect
          id="exam-class"
          title={t('col.class')}
          value={classId}
          onChange={e => {
            setClassId(e.target.value ? Number(e.target.value) : '');
            setSelectedLessonIds([]);
          }}
          required
        >
          <option value="">{t('filter.selectClass')}</option>
          {[...new Map(
            lessons
              .filter(lesson => lesson.class_id)
              .map(lesson => [lesson.class_id, lesson.class_name || String(lesson.class_id)]),
          ).entries()].map(([id, className]) => (
            <option key={id} value={id}>{className}</option>
          ))}
        </FormSelect>
      </FormField>

      <FormField label={t('generatedExams.selectLessons')} id="exam-lessons" required>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-input p-3">
          {lessonsForClass.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('generatedExams.noLessons')}</p>
          ) : lessonsForClass.map(lesson => (
            <label key={lesson.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedLessonIds.includes(lesson.id)}
                onChange={() => toggleLesson(lesson.id)}
              />
              <span>{lesson.name}</span>
            </label>
          ))}
        </div>
      </FormField>

      <FormField label={t('generatedExams.questionCount')} id="exam-count">
        <FormInput
          id="exam-count"
          type="number"
          min={1}
          value={questionCount}
          onChange={e => setQuestionCount(e.target.value)}
          placeholder={t('generatedExams.questionCountHint')}
        />
      </FormField>

      <FormField label={t('col.notes')} id="exam-notes">
        <FormTextarea id="exam-notes" value={notes} onChange={e => setNotes(e.target.value)} />
      </FormField>
    </FormDialog>
  );
}

function ExamViewDialog({
  exam,
  lessons,
  onClose,
}: {
  exam: GeneratedExam;
  lessons: LessonOption[];
  onClose: () => void;
}) {
  const { t } = useLocale();

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{exam.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <p className="text-muted-foreground">
            {t('generatedExams.totalQuestions')}: {exam.total_questions}
          </p>
          <p className="text-muted-foreground">
            {t('col.lessons')}: {(exam.lesson_ids || [])
              .map(id => lessons.find(lesson => lesson.id === id)?.name)
              .filter(Boolean)
              .join(', ') || '—'}
          </p>
          {exam.notes && <p>{exam.notes}</p>}
          <div className="space-y-4">
            {(exam.questions || []).map((question, index) => (
              <div key={question.id} className="rounded-lg border p-4">
                <p className="font-medium">
                  {index + 1}. {question.question_text}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t(`questions.type.${question.type}`)}
                </p>
                <ul className="mt-3 space-y-1">
                  {(question.answers || []).map(answer => (
                    <li
                      key={`${question.id}-${answer.id ?? answer.answer_text}`}
                      className={answer.is_correct ? 'font-medium text-primary' : ''}
                    >
                      {answer.answer_text}
                      {answer.is_correct ? ` (${t('questions.correct')})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminGeneratedExams() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap, isLoading } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;
  const units = (bootstrap?.units || []) as Array<{ id: number; name: string; class_id?: number }>;
  const lessons = (bootstrap?.lessons || []) as Lesson[];
  const [data, setData] = useState<GeneratedExamRow[]>([]);
  const [showGenerate, setShowGenerate] = useState(false);
  const [viewExam, setViewExam] = useState<GeneratedExam | null>(null);

  const lessonRows = useMemo<LessonOption[]>(() => lessons.map(lesson => ({
    ...lesson,
    class_id: units.find(unit => unit.id === lesson.unit_id)?.class_id,
    class_name: classes.find(cls => cls.id === units.find(unit => unit.id === lesson.unit_id)?.class_id)?.name,
  })), [lessons, units, classes]);

  const generateMutation = useMutation({
    mutationFn: (payload: GenerateExamPayload) => adminQuestionsApi.generateExam(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminQuestionsApi.deleteGeneratedExam(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const viewMutation = useMutation({
    mutationFn: (id: number) => adminQuestionsApi.getGeneratedExam(id),
  });

  useEffect(() => {
    setData((bootstrap?.generated_exams || []) as GeneratedExamRow[]);
  }, [bootstrap]);

  const {
    gradeFilter,
    classFilter,
    sectionFilter,
    setSectionFilter,
    grades: gradeOptions,
    classesByGrade,
    sectionsByClass,
    filteredRows,
    appliedCount,
    clearFilters,
    handleGradeChange,
    handleClassChange,
  } = useAdminScopeFilters(grades, classes, sections, data);

  const columns: CrudColumn<GeneratedExamRow>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'name', label: t('col.name'), sortable: true, primary: true },
    {
      key: 'grade_id',
      label: t('col.grade'),
      render: row => grades.find(grade => grade.id === row.grade_id)?.name ?? '—',
    },
    {
      key: 'class_id',
      label: t('col.class'),
      render: row => classes.find(cls => cls.id === row.class_id)?.name ?? '—',
    },
    {
      key: 'total_questions',
      label: t('generatedExams.totalQuestions'),
      sortable: true,
    },
    {
      key: 'lesson_ids',
      label: t('col.lessons'),
      render: row => (row.lesson_names || []).join(', ') || '—',
    },
    {
      key: 'created_at',
      label: t('col.date'),
      render: row => row.created_at ? new Date(row.created_at).toLocaleDateString() : '—',
    },
    {
      key: 'view',
      label: t('crud.show'),
      render: row => (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title={t('crud.show')}
          onClick={async () => {
            try {
              const exam = await viewMutation.mutateAsync(row.id);
              setViewExam(exam);
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to load exam';
              toast({ title: 'Load failed', description: message, variant: 'destructive' });
            }
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <CrudPage
        title={t('nav.generatedExams')}
        description={t('page.generatedExamsAdmin.desc')}
        columns={columns}
        data={filteredRows}
        loading={isLoading}
        searchKeys={['name']}
        canCreate={false}
        canEdit={false}
        actions={(
          <Button onClick={() => setShowGenerate(true)}>
            {t('generatedExams.generate')}
          </Button>
        )}
        topContent={(
          <AdminScopeFilterBar
            grades={gradeOptions}
            classesByGrade={classesByGrade}
            sectionsByClass={sectionsByClass}
            gradeFilter={gradeFilter}
            classFilter={classFilter}
            sectionFilter={sectionFilter}
            onGradeChange={handleGradeChange}
            onClassChange={handleClassChange}
            onSectionChange={setSectionFilter}
            appliedCount={appliedCount}
            onClear={clearFilters}
            resultCount={filteredRows.length}
          />
        )}
        onDelete={async (item) => {
          await deleteMutation.mutateAsync(item.id);
          setData(prev => prev.filter(row => row.id !== item.id));
        }}
      />

      {showGenerate && (
        <GenerateExamForm
          lessons={lessonRows}
          saving={generateMutation.isPending}
          onClose={() => setShowGenerate(false)}
          onSave={async (payload) => {
            try {
              await generateMutation.mutateAsync(payload);
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to generate exam';
              toast({ title: 'Generation failed', description: message, variant: 'destructive' });
              throw error;
            }
          }}
        />
      )}

      {viewExam && (
        <ExamViewDialog
          exam={viewExam}
          lessons={lessonRows}
          onClose={() => setViewExam(null)}
        />
      )}
    </>
  );
}

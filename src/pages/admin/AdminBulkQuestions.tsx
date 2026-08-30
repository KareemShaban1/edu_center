import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useAdminScopeFilters } from '@/hooks/use-admin-scope-filters';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQuestionsApi, type BulkQuestionsPayload } from '@/services/endpoints/admin-questions';
import { toast } from '@/hooks/use-toast';
import type { Lesson, Question } from '@/types/models';

const QUESTION_TYPES = ['mcq', 'true_false', 'short_answer'] as const;

type DraftQuestion = {
  question_text: string;
  type: Question['type'];
  answers: Array<{ answer_text: string; is_correct: boolean }>;
};

function createDraftQuestion(type: Question['type'] = 'mcq'): DraftQuestion {
  if (type === 'true_false') {
    return {
      question_text: '',
      type,
      answers: [
        { answer_text: 'True', is_correct: true },
        { answer_text: 'False', is_correct: false },
      ],
    };
  }
  if (type === 'short_answer') {
    return {
      question_text: '',
      type,
      answers: [{ answer_text: '', is_correct: true }],
    };
  }
  return {
    question_text: '',
    type,
    answers: [
      { answer_text: '', is_correct: true },
      { answer_text: '', is_correct: false },
    ],
  };
}

export default function AdminBulkQuestions() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap, isLoading } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;
  const units = (bootstrap?.units || []) as Array<{ id: number; name: string; class_id?: number }>;
  const lessons = (bootstrap?.lessons || []) as Lesson[];

  const lessonRows = useMemo(() => lessons.map(lesson => ({
    ...lesson,
    class_id: units.find(unit => unit.id === lesson.unit_id)?.class_id,
  })), [lessons, units]);

  const {
    gradeFilter,
    classFilter,
    sectionFilter,
    setSectionFilter,
    grades: gradeOptions,
    classesByGrade,
    sectionsByClass,
    appliedCount,
    clearFilters,
    handleGradeChange,
    handleClassChange,
  } = useAdminScopeFilters(grades, classes, sections, lessonRows);

  const lessonsForClass = useMemo(() => {
    if (!classFilter) return lessons;
    const unitIds = units.filter(unit => unit.class_id === classFilter).map(unit => unit.id);
    return lessons.filter(lesson => unitIds.includes(lesson.unit_id));
  }, [classFilter, lessons, units]);

  const [lessonId, setLessonId] = useState<number | ''>('');
  const [drafts, setDrafts] = useState<DraftQuestion[]>([createDraftQuestion()]);

  const saveMutation = useMutation({
    mutationFn: (payload: BulkQuestionsPayload) => adminQuestionsApi.bulkCreateQuestions(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const updateDraft = (index: number, updater: (draft: DraftQuestion) => DraftQuestion) => {
    setDrafts(prev => prev.map((draft, i) => (i === index ? updater(draft) : draft)));
  };

  const handleTypeChange = (index: number, nextType: Question['type']) => {
    updateDraft(index, () => createDraftQuestion(nextType));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lessonId) {
      toast({ title: t('filter.selectLesson'), variant: 'destructive' });
      return;
    }

    const questions = drafts
      .map(draft => ({
        question_text: draft.question_text.trim(),
        type: draft.type,
        answers: draft.answers
          .map(answer => ({ ...answer, answer_text: answer.answer_text.trim() }))
          .filter(answer => answer.answer_text !== ''),
      }))
      .filter(draft => draft.question_text !== '');

    if (questions.length === 0) {
      toast({ title: t('questions.bulk.empty'), variant: 'destructive' });
      return;
    }

    const invalid = questions.find(question => question.answers.length === 0 || !question.answers.some(a => a.is_correct));
    if (invalid) {
      toast({ title: t('questions.validation.correctRequired'), variant: 'destructive' });
      return;
    }

    try {
      const result = await saveMutation.mutateAsync({
        lesson_id: Number(lessonId),
        questions,
      });
      toast({
        title: t('questions.bulk.success'),
        description: t('questions.bulk.successCount').replace('{count}', String(result.count)),
      });
      setDrafts([createDraftQuestion()]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save questions';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/questions">
                  <ArrowLeft className="h-4 w-4 me-1" />
                  {t('nav.questions')}
                </Link>
              </Button>
            </div>
            <h1 className="font-display text-2xl font-bold">{t('nav.bulkQuestions')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('page.bulkQuestionsAdmin.desc')}</p>
          </div>
        </div>

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
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border bg-card p-4 sm:p-6 space-y-4">
            <FormField label={t('col.lesson')} id="bulk-lesson" required>
              <FormSelect
                id="bulk-lesson"
                title={t('col.lesson')}
                value={lessonId}
                onChange={e => setLessonId(e.target.value ? Number(e.target.value) : '')}
                required
                disabled={isLoading}
              >
                <option value="">{t('filter.selectLesson')}</option>
                {(lessonsForClass.length > 0 ? lessonsForClass : lessons).map(lesson => (
                  <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
                ))}
              </FormSelect>
            </FormField>
          </div>

          <div className="space-y-4">
            {drafts.map((draft, index) => (
              <div key={index} className="rounded-xl border bg-card p-4 sm:p-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h2 className="font-medium">{t('questions.bulk.questionNumber').replace('{n}', String(index + 1))}</h2>
                  {drafts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDrafts(prev => prev.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4 me-1" />
                      {t('crud.delete')}
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <FormField label={t('questions.questionText')} id={`bulk-q-${index}`} required>
                    <FormTextarea
                      id={`bulk-q-${index}`}
                      value={draft.question_text}
                      onChange={e => updateDraft(index, current => ({ ...current, question_text: e.target.value }))}
                      required
                    />
                  </FormField>

                  <FormField label={t('questions.type')} id={`bulk-type-${index}`} required>
                    <FormSelect
                      id={`bulk-type-${index}`}
                      title={t('questions.type')}
                      value={draft.type}
                      onChange={e => handleTypeChange(index, e.target.value as Question['type'])}
                    >
                      {QUESTION_TYPES.map(questionType => (
                        <option key={questionType} value={questionType}>
                          {t(`questions.type.${questionType}`)}
                        </option>
                      ))}
                    </FormSelect>
                  </FormField>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{t('questions.answers')}</p>
                      {draft.type === 'mcq' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updateDraft(index, current => ({
                            ...current,
                            answers: [...current.answers, { answer_text: '', is_correct: false }],
                          }))}
                        >
                          <Plus className="h-4 w-4 me-1" />
                          {t('questions.addAnswer')}
                        </Button>
                      )}
                    </div>

                    {draft.answers.map((answer, answerIndex) => (
                      <div key={answerIndex} className="flex items-start gap-2">
                        {draft.type !== 'short_answer' && (
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            checked={answer.is_correct}
                            onChange={() => updateDraft(index, current => ({
                              ...current,
                              answers: current.answers.map((row, i) => ({ ...row, is_correct: i === answerIndex })),
                            }))}
                            className="mt-3"
                            title={t('questions.markCorrect')}
                          />
                        )}
                        <FormInput
                          id={`bulk-a-${index}-${answerIndex}`}
                          value={answer.answer_text}
                          onChange={e => updateDraft(index, current => ({
                            ...current,
                            answers: current.answers.map((row, i) => (
                              i === answerIndex ? { ...row, answer_text: e.target.value } : row
                            )),
                          }))}
                          placeholder={t('questions.answerPlaceholder')}
                          required
                          disabled={draft.type === 'true_false'}
                          className="flex-1"
                        />
                        {draft.type === 'mcq' && draft.answers.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => updateDraft(index, current => ({
                              ...current,
                              answers: current.answers.filter((_, i) => i !== answerIndex),
                            }))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDrafts(prev => [...prev, createDraftQuestion()])}
            >
              <Plus className="h-4 w-4 me-1" />
              {t('questions.bulk.addQuestion')}
            </Button>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? t('crud.saving') : t('questions.bulk.saveAll')}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

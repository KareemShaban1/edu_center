import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Trash2, ListPlus } from 'lucide-react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useAdminScopeFilters } from '@/hooks/use-admin-scope-filters';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminQuestionsApi, type QuestionSavePayload } from '@/services/endpoints/admin-questions';
import { toast } from '@/hooks/use-toast';
import type { ExamBank, Lesson, Question } from '@/types/models';

type QuestionRow = Question & { class_id?: number };

const QUESTION_TYPES = ['mcq', 'true_false', 'short_answer'] as const;

function defaultAnswers(type: Question['type']): Array<{ answer_text: string; is_correct: boolean }> {
  if (type === 'true_false') {
    return [
      { answer_text: 'True', is_correct: true },
      { answer_text: 'False', is_correct: false },
    ];
  }
  if (type === 'short_answer') {
    return [{ answer_text: '', is_correct: true }];
  }
  return [
    { answer_text: '', is_correct: true },
    { answer_text: '', is_correct: false },
  ];
}

function QuestionForm({
  item,
  lessons,
  onClose,
  onSave,
  saving,
}: {
  item: Question | null;
  lessons: Lesson[];
  onClose: () => void;
  onSave: (payload: QuestionSavePayload, id?: number) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [questionText, setQuestionText] = useState(item?.question_text ?? '');
  const [type, setType] = useState<Question['type']>(item?.type ?? 'mcq');
  const [lessonId, setLessonId] = useState<number | undefined>(item?.lesson_id);
  const [answers, setAnswers] = useState<Array<{ id?: number; answer_text: string; is_correct: boolean }>>(
    item?.answers?.map(a => ({
      id: a.id,
      answer_text: a.answer_text,
      is_correct: a.is_correct,
    })) ?? defaultAnswers(item?.type ?? 'mcq'),
  );

  const handleTypeChange = (nextType: Question['type']) => {
    setType(nextType);
    if (!item) {
      setAnswers(defaultAnswers(nextType));
    }
  };

  const setCorrectAnswer = (index: number) => {
    setAnswers(prev => prev.map((answer, i) => ({ ...answer, is_correct: i === index })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !lessonId) return;

    const validAnswers = answers
      .map(a => ({ ...a, answer_text: a.answer_text.trim() }))
      .filter(a => a.answer_text !== '');

    if (validAnswers.length === 0) {
      toast({ title: t('questions.validation.answersRequired'), variant: 'destructive' });
      return;
    }

    if (!validAnswers.some(a => a.is_correct)) {
      toast({ title: t('questions.validation.correctRequired'), variant: 'destructive' });
      return;
    }

    await onSave({
      question_text: questionText.trim(),
      type,
      lesson_id: lessonId,
      answers: validAnswers,
    }, item?.id);
    toast({ title: t('crud.save') });
    onClose();
  };

  return (
    <FormDialog
      open
      title={item ? t('crud.edit') : t('crud.addNew')}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={t('crud.save')}
      loading={saving}
    >
      <FormField label={t('col.lesson')} id="question-lesson" required>
        <FormSelect id="question-lesson" title={t('col.lesson')} value={lessonId ?? ''} onChange={e => setLessonId(Number(e.target.value))} required>
          <option value="">{t('filter.selectLesson')}</option>
          {lessons.map(lesson => (
            <option key={lesson.id} value={lesson.id}>{lesson.name}</option>
          ))}
        </FormSelect>
      </FormField>

      <FormField label={t('questions.questionText')} id="question-text" required>
        <FormTextarea
          id="question-text"
          value={questionText}
          onChange={e => setQuestionText(e.target.value)}
          required
        />
      </FormField>

      <FormField label={t('questions.type')} id="question-type" required>
        <FormSelect
          id="question-type"
          title={t('questions.type')}
          value={type}
          onChange={e => handleTypeChange(e.target.value as Question['type'])}
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
          {type === 'mcq' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAnswers(prev => [...prev, { answer_text: '', is_correct: false }])}
            >
              <Plus className="h-4 w-4 me-1" />
              {t('questions.addAnswer')}
            </Button>
          )}
        </div>

        {answers.map((answer, index) => (
          <div key={index} className="flex items-start gap-2">
            {type !== 'short_answer' && (
              <input
                type="radio"
                name="correct-answer"
                checked={answer.is_correct}
                onChange={() => setCorrectAnswer(index)}
                className="mt-3"
                title={t('questions.markCorrect')}
              />
            )}
            <FormInput
              id={`answer-${index}`}
              value={answer.answer_text}
              onChange={e => setAnswers(prev => prev.map((row, i) => (
                i === index ? { ...row, answer_text: e.target.value } : row
              )))}
              placeholder={t('questions.answerPlaceholder')}
              required
              disabled={type === 'true_false'}
              className="flex-1"
            />
            {type === 'mcq' && answers.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setAnswers(prev => prev.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </FormDialog>
  );
}

export default function AdminQuestions() {
  const { t } = useLocale();
  const [searchParams] = useSearchParams();
  const examFilterParam = searchParams.get('exam');
  const queryClient = useQueryClient();
  const { data: bootstrap, isLoading } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;
  const units = (bootstrap?.units || []) as Array<{ id: number; name: string; class_id?: number }>;
  const lessons = (bootstrap?.lessons || []) as Lesson[];
  const exams = (bootstrap?.exams || bootstrap?.generated_exams || []) as ExamBank[];
  const [data, setData] = useState<QuestionRow[]>([]);
  const [examFilter, setExamFilter] = useState(examFilterParam ?? '');

  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: QuestionSavePayload; id?: number }) => (
      id ? adminQuestionsApi.updateQuestion(id, payload) : adminQuestionsApi.createQuestion(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminQuestionsApi.deleteQuestion(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  useEffect(() => {
    if (examFilterParam) setExamFilter(examFilterParam);
  }, [examFilterParam]);

  useEffect(() => {
    const rows = ((bootstrap?.questions || []) as Question[]).map(question => ({
      ...question,
      class_id: units.find(unit => unit.id === lessons.find(lesson => lesson.id === question.lesson_id)?.unit_id)?.class_id,
    }));
    setData(rows);
  }, [bootstrap, lessons, units]);

  const scopeFiltered = useAdminScopeFilters(grades, classes, sections, data);
  const filteredRows = useMemo(() => {
    const rows = !examFilter
      ? scopeFiltered.filteredRows
      : scopeFiltered.filteredRows.filter(row => (row.exam_ids || []).includes(Number(examFilter)));
    return rows;
  }, [scopeFiltered.filteredRows, examFilter]);

  const {
    gradeFilter, classFilter, sectionFilter, setSectionFilter,
    grades: gradeOptions, classesByGrade, sectionsByClass,
    appliedCount, clearFilters, handleGradeChange, handleClassChange,
  } = scopeFiltered;

  const lessonsForClass = useMemo(() => {
    if (!classFilter) return lessons;
    const unitIds = units.filter(unit => unit.class_id === classFilter).map(unit => unit.id);
    return lessons.filter(lesson => unitIds.includes(lesson.unit_id));
  }, [classFilter, lessons, units]);

  const columns: CrudColumn<QuestionRow>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    {
      key: 'question_text',
      label: t('questions.questionText'),
      sortable: true,
      primary: true,
      render: row => <span className="line-clamp-2">{row.question_text}</span>,
    },
    {
      key: 'type',
      label: t('questions.type'),
      render: row => t(`questions.type.${row.type}`),
    },
    {
      key: 'exam_ids',
      label: t('nav.examBank'),
      render: row => (row.exam_ids || [])
        .map(id => exams.find(exam => exam.id === id)?.name)
        .filter(Boolean)
        .join(', ') || '—',
    },
    {
      key: 'lesson_id',
      label: t('col.lesson'),
      render: row => lessons.find(lesson => lesson.id === row.lesson_id)?.name ?? '—',
    },
    {
      key: 'answers',
      label: t('questions.answers'),
      render: row => String(row.answers?.length ?? 0),
    },
  ];

  return (
    <CrudPage
      title={t('nav.questions')}
      description={t('page.questionsAdmin.desc')}
      columns={columns}
      data={filteredRows}
      loading={isLoading}
      searchKeys={['question_text']}
      actions={(
        <Button asChild variant="outline">
          <Link to="/admin/questions/bulk">
            <ListPlus className="h-4 w-4 me-1" />
            {t('nav.bulkQuestions')}
          </Link>
        </Button>
      )}
      topContent={(
        <>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="min-w-[200px]">
              <label className="mb-1.5 block text-sm font-medium">{t('nav.examBank')}</label>
              <FormSelect id="questions-exam-filter" title={t('nav.examBank')} value={examFilter} onChange={e => setExamFilter(e.target.value)}>
                <option value="">{t('filter.all')}</option>
                {exams.map(exam => <option key={exam.id} value={exam.id}>{exam.name}</option>)}
              </FormSelect>
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
          resultCount={filteredRows.length}
        />
        </>
      )}
      onDelete={async (item) => {
        await deleteMutation.mutateAsync(item.id);
        setData(prev => prev.filter(row => row.id !== item.id));
      }}
      renderForm={(item, onClose) => (
        <QuestionForm
          item={item}
          lessons={lessonsForClass.length > 0 ? lessonsForClass : lessons}
          onClose={onClose}
          saving={saveMutation.isPending}
          onSave={async (payload, id) => {
            try {
              await saveMutation.mutateAsync({ payload, id });
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to save question';
              toast({ title: 'Save failed', description: message, variant: 'destructive' });
              throw error;
            }
          }}
        />
      )}
    />
  );
}

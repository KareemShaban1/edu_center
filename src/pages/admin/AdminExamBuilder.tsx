import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Save } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import RichTextEditor from '@/components/exam-builder/RichTextEditor';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import { adminQuestionsApi } from '@/services/endpoints/admin-questions';
import type { ExamBank, ExamLayout } from '@/types/models';
import ExamAnswerLine from '@/components/exam-builder/ExamAnswerLine';
import { EXAM_ARABIC_FONT_OPTIONS, EXAM_DEFAULT_FONT, EXAM_LATIN_FONT_OPTIONS } from '@/lib/exam-builder/fonts';
import { ANSWER_MARKER_STYLES, clampAnswersPerRow, clampShortAnswerLines, formatAnswerMarker } from '@/lib/exam-builder/answer-markers';

const DEFAULT_LAYOUT: ExamLayout = {
  header: { enabled: false, html: '', align: 'center' },
  footer: { enabled: false, html: '', align: 'center' },
  body: {
    instructions_html: '',
    show_answers: false,
    number_questions: true,
    font_family: EXAM_DEFAULT_FONT,
    font_size: 12,
    answer_marker_style: 'letter_paren',
    answers_per_row: 1,
    content_direction: 'rtl',
    question_spacing: 16,
    question_divider: false,
    short_answer_lines: 1,
  },
  page: { margin_mm: 15, orientation: 'P' },
};

function mergeLayout(layout?: ExamLayout | null): ExamLayout {
  return {
    header: { ...DEFAULT_LAYOUT.header, ...(layout?.header || {}) },
    footer: { ...DEFAULT_LAYOUT.footer, ...(layout?.footer || {}) },
    body: { ...DEFAULT_LAYOUT.body, ...(layout?.body || {}) },
    page: { ...DEFAULT_LAYOUT.page, ...(layout?.page || {}) },
  };
}

export default function AdminExamBuilder() {
  const { t } = useLocale();
  const { id } = useParams();
  const navigate = useNavigate();
  const examId = Number(id);

  const [exam, setExam] = useState<ExamBank | null>(null);
  const [layout, setLayout] = useState<ExamLayout>(DEFAULT_LAYOUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'docx' | null>(null);

  useEffect(() => {
    if (!examId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await adminQuestionsApi.getExam(examId);
        if (cancelled) return;
        setExam(data);
        setLayout(mergeLayout(data.layout));
      } catch (error) {
        toast({
          title: t('examBuilder.loadFailed'),
          description: error instanceof Error ? error.message : '',
          variant: 'destructive',
        });
        navigate('/admin/exam-bank');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [examId, navigate, t]);

  const previewQuestions = useMemo(() => exam?.questions || [], [exam]);
  const contentDir = layout.body.content_direction === 'ltr' ? 'ltr' : 'rtl';

  const saveLayout = async () => {
    if (!examId) return;
    setSaving(true);
    try {
      const updated = await adminQuestionsApi.updateExamLayout(examId, layout);
      setExam(updated);
      setLayout(mergeLayout(updated.layout));
      toast({ title: t('examBuilder.saved') });
    } catch (error) {
      toast({
        title: t('examBuilder.saveFailed'),
        description: error instanceof Error ? error.message : '',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const download = async (format: 'pdf' | 'docx') => {
    if (!examId || !exam) return;
    setExporting(format);
    try {
      await saveLayout();
      await adminQuestionsApi.exportExam(examId, format, `${exam.name || 'exam'}.${format === 'pdf' ? 'pdf' : 'docx'}`);
      toast({ title: t('examBuilder.downloadReady') });
    } catch (error) {
      toast({
        title: t('examBuilder.downloadFailed'),
        description: error instanceof Error ? error.message : '',
        variant: 'destructive',
      });
    } finally {
      setExporting(null);
    }
  };

  if (loading || !exam) {
    return (
      <DashboardLayout>
        <p className="text-sm text-muted-foreground">…</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Button variant="ghost" size="sm" asChild className="mb-2">
              <Link to="/admin/exam-bank">
                <ArrowLeft className="h-4 w-4 me-1" />
                {t('nav.examBank')}
              </Link>
            </Button>
            <h1 className="font-display text-2xl font-bold">{t('examBuilder.title')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{exam.name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={saveLayout} disabled={saving}>
              <Save className="h-4 w-4 me-1" />
              {saving ? t('crud.saving') : t('crud.save')}
            </Button>
            <Button variant="outline" onClick={() => download('docx')} disabled={!!exporting}>
              <FileText className="h-4 w-4 me-1" />
              {exporting === 'docx' ? t('examBuilder.exporting') : t('examBuilder.downloadWord')}
            </Button>
            <Button onClick={() => download('pdf')} disabled={!!exporting}>
              <Download className="h-4 w-4 me-1" />
              {exporting === 'pdf' ? t('examBuilder.exporting') : t('examBuilder.downloadPdf')}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div className="space-y-4 rounded-xl border bg-card p-4 sm:p-5">
            <Tabs defaultValue="header">
              <TabsList className="flex h-auto flex-wrap">
                <TabsTrigger value="header">{t('examBuilder.tab.header')}</TabsTrigger>
                <TabsTrigger value="body">{t('examBuilder.tab.body')}</TabsTrigger>
                <TabsTrigger value="footer">{t('examBuilder.tab.footer')}</TabsTrigger>
                <TabsTrigger value="page">{t('examBuilder.tab.page')}</TabsTrigger>
              </TabsList>

              <TabsContent value="header" className="space-y-4 pt-4">
                <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <Label htmlFor="header-enabled">{t('examBuilder.header.enable')}</Label>
                    <p className="text-xs text-muted-foreground">{t('examBuilder.header.hint')}</p>
                  </div>
                  <Switch
                    id="header-enabled"
                    checked={layout.header.enabled}
                    onCheckedChange={enabled => setLayout(prev => ({
                      ...prev,
                      header: { ...prev.header, enabled },
                    }))}
                  />
                </div>
                {layout.header.enabled && (
                  <RichTextEditor
                    value={layout.header.html}
                    align={layout.header.align}
                    showAlignControl
                    onAlignChange={align => setLayout(prev => ({
                      ...prev,
                      header: { ...prev.header, align },
                    }))}
                    onChange={html => setLayout(prev => ({
                      ...prev,
                      header: { ...prev.header, html },
                    }))}
                    placeholder={t('examBuilder.header.placeholder')}
                  />
                )}
              </TabsContent>

              <TabsContent value="body" className="space-y-4 pt-4">
                <FormField label={t('examBuilder.instructions')} id="exam-instructions">
                  <RichTextEditor
                    value={layout.body.instructions_html}
                    onChange={html => setLayout(prev => ({
                      ...prev,
                      body: { ...prev.body, instructions_html: html },
                    }))}
                    placeholder={t('examBuilder.instructionsPlaceholder')}
                    minHeightClass="min-h-[140px]"
                  />
                </FormField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <Label htmlFor="number-questions">{t('examBuilder.numberQuestions')}</Label>
                    <Switch
                      id="number-questions"
                      checked={layout.body.number_questions}
                      onCheckedChange={number_questions => setLayout(prev => ({
                        ...prev,
                        body: { ...prev.body, number_questions },
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <Label htmlFor="show-answers">{t('examBuilder.showAnswers')}</Label>
                    <Switch
                      id="show-answers"
                      checked={layout.body.show_answers}
                      onCheckedChange={show_answers => setLayout(prev => ({
                        ...prev,
                        body: { ...prev.body, show_answers },
                      }))}
                    />
                  </div>
                </div>
                <FormField label={t('examBuilder.contentDirection')} id="content-direction">
                  <FormSelect
                    id="content-direction"
                    title={t('examBuilder.contentDirection')}
                    value={layout.body.content_direction}
                    onChange={e => setLayout(prev => ({
                      ...prev,
                      body: {
                        ...prev.body,
                        content_direction: e.target.value === 'ltr' ? 'ltr' : 'rtl',
                      },
                    }))}
                  >
                    <option value="rtl">{t('examBuilder.contentDirection.rtl')}</option>
                    <option value="ltr">{t('examBuilder.contentDirection.ltr')}</option>
                  </FormSelect>
                  <p className="mt-1 text-xs text-muted-foreground">{t('examBuilder.contentDirection.hint')}</p>
                </FormField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label={t('examBuilder.questionSpacing')} id="question-spacing">
                    <FormInput
                      id="question-spacing"
                      type="number"
                      min={4}
                      max={48}
                      value={layout.body.question_spacing}
                      onChange={e => setLayout(prev => ({
                        ...prev,
                        body: {
                          ...prev.body,
                          question_spacing: Math.max(4, Math.min(48, Number(e.target.value) || 16)),
                        },
                      }))}
                    />
                  </FormField>
                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                    <Label htmlFor="question-divider">{t('examBuilder.questionDivider')}</Label>
                    <Switch
                      id="question-divider"
                      checked={layout.body.question_divider}
                      onCheckedChange={question_divider => setLayout(prev => ({
                        ...prev,
                        body: { ...prev.body, question_divider },
                      }))}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label={t('examBuilder.answerMarkerStyle')} id="answer-marker-style">
                    <FormSelect
                      id="answer-marker-style"
                      title={t('examBuilder.answerMarkerStyle')}
                      value={layout.body.answer_marker_style}
                      onChange={e => setLayout(prev => ({
                        ...prev,
                        body: {
                          ...prev.body,
                          answer_marker_style: e.target.value as typeof layout.body.answer_marker_style,
                        },
                      }))}
                    >
                      {ANSWER_MARKER_STYLES.map(style => (
                        <option key={style} value={style}>
                          {t(`examBuilder.marker.${style}`)}
                        </option>
                      ))}
                    </FormSelect>
                  </FormField>
                  <FormField label={t('examBuilder.answersPerRow')} id="answers-per-row">
                    <FormSelect
                      id="answers-per-row"
                      title={t('examBuilder.answersPerRow')}
                      value={String(layout.body.answers_per_row)}
                      onChange={e => setLayout(prev => ({
                        ...prev,
                        body: {
                          ...prev.body,
                          answers_per_row: clampAnswersPerRow(Number(e.target.value)),
                        },
                      }))}
                    >
                      {[1, 2, 3, 4].map(n => (
                        <option key={n} value={n}>
                          {t('examBuilder.answersPerRowCount').replace('{count}', String(n))}
                        </option>
                      ))}
                    </FormSelect>
                  </FormField>
                </div>
                <FormField label={t('examBuilder.shortAnswerLines')} id="short-answer-lines">
                  <FormInput
                    id="short-answer-lines"
                    type="number"
                    min={1}
                    max={8}
                    value={layout.body.short_answer_lines}
                    onChange={e => setLayout(prev => ({
                      ...prev,
                      body: {
                        ...prev.body,
                        short_answer_lines: clampShortAnswerLines(Number(e.target.value)),
                      },
                    }))}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{t('examBuilder.shortAnswerLines.hint')}</p>
                </FormField>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label={t('examBuilder.fontFamily')} id="font-family">
                    <FormSelect
                      id="font-family"
                      title={t('examBuilder.fontFamily')}
                      value={layout.body.font_family}
                      onChange={e => setLayout(prev => ({
                        ...prev,
                        body: { ...prev.body, font_family: e.target.value },
                      }))}
                    >
                      <optgroup label={t('examBuilder.fonts.arabic')}>
                        {EXAM_ARABIC_FONT_OPTIONS.map(font => (
                          <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                            {font.label}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label={t('examBuilder.fonts.latin')}>
                        {EXAM_LATIN_FONT_OPTIONS.map(font => (
                          <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                            {font.label}
                          </option>
                        ))}
                      </optgroup>
                    </FormSelect>
                  </FormField>
                  <FormField label={t('examBuilder.fontSize')} id="font-size">
                    <FormInput
                      id="font-size"
                      type="number"
                      min={8}
                      max={24}
                      value={layout.body.font_size}
                      onChange={e => setLayout(prev => ({
                        ...prev,
                        body: { ...prev.body, font_size: Number(e.target.value) || 12 },
                      }))}
                    />
                  </FormField>
                </div>
              </TabsContent>

              <TabsContent value="footer" className="space-y-4 pt-4">
                <div className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <Label htmlFor="footer-enabled">{t('examBuilder.footer.enable')}</Label>
                    <p className="text-xs text-muted-foreground">{t('examBuilder.footer.hint')}</p>
                  </div>
                  <Switch
                    id="footer-enabled"
                    checked={layout.footer.enabled}
                    onCheckedChange={enabled => setLayout(prev => ({
                      ...prev,
                      footer: { ...prev.footer, enabled },
                    }))}
                  />
                </div>
                {layout.footer.enabled && (
                  <RichTextEditor
                    value={layout.footer.html}
                    align={layout.footer.align}
                    showAlignControl
                    onAlignChange={align => setLayout(prev => ({
                      ...prev,
                      footer: { ...prev.footer, align },
                    }))}
                    onChange={html => setLayout(prev => ({
                      ...prev,
                      footer: { ...prev.footer, html },
                    }))}
                    placeholder={t('examBuilder.footer.placeholder')}
                  />
                )}
              </TabsContent>

              <TabsContent value="page" className="space-y-4 pt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormField label={t('examBuilder.margin')} id="page-margin">
                    <FormInput
                      id="page-margin"
                      type="number"
                      min={5}
                      max={40}
                      value={layout.page.margin_mm}
                      onChange={e => setLayout(prev => ({
                        ...prev,
                        page: { ...prev.page, margin_mm: Number(e.target.value) || 15 },
                      }))}
                    />
                  </FormField>
                  <FormField label={t('examBuilder.orientation')} id="page-orientation">
                    <FormSelect
                      id="page-orientation"
                      title={t('examBuilder.orientation')}
                      value={layout.page.orientation}
                      onChange={e => setLayout(prev => ({
                        ...prev,
                        page: { ...prev.page, orientation: e.target.value as 'P' | 'L' },
                      }))}
                    >
                      <option value="P">{t('examBuilder.orientation.portrait')}</option>
                      <option value="L">{t('examBuilder.orientation.landscape')}</option>
                    </FormSelect>
                  </FormField>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="rounded-xl border bg-muted/20 p-4 sm:p-6">
            <p className="mb-4 text-sm font-medium text-muted-foreground">{t('examBuilder.preview')}</p>
            <div
              dir={contentDir}
              className="mx-auto min-h-[480px] max-w-[720px] rounded-md border bg-white p-8 text-sm text-black shadow-sm"
              style={{
                fontFamily: layout.body.font_family,
                fontSize: `${layout.body.font_size}px`,
                textAlign: contentDir === 'rtl' ? 'right' : 'left',
              }}
            >
              {layout.header.enabled && layout.header.html && (
                <div
                  className="mb-4 border-b pb-3"
                  style={{ textAlign: layout.header.align }}
                  dangerouslySetInnerHTML={{ __html: layout.header.html }}
                />
              )}
              <h2 className="mb-4 text-center text-xl font-bold">{exam.name}</h2>
              {layout.body.instructions_html && (
                <div
                  className="mb-4"
                  dir={contentDir}
                  dangerouslySetInnerHTML={{ __html: layout.body.instructions_html }}
                />
              )}
              <div>
                {previewQuestions.length === 0 ? (
                  <p className="text-muted-foreground">{t('examBank.noQuestions')}</p>
                ) : previewQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    style={{
                      marginBottom: index < previewQuestions.length - 1
                        ? `${layout.body.question_spacing}pt`
                        : 0,
                      paddingBottom: layout.body.question_divider && index < previewQuestions.length - 1
                        ? 8
                        : 0,
                      borderBottom: layout.body.question_divider && index < previewQuestions.length - 1
                        ? '1px solid #ccc'
                        : undefined,
                    }}
                  >
                    <div className="mb-1 flex w-full flex-wrap items-center gap-2 font-medium" dir={contentDir}>
                      <span dir={contentDir}>
                        {layout.body.number_questions ? `${index + 1}. ` : ''}
                        {question.question_text}
                      </span>
                      <Badge variant="secondary">{t(`questions.type.${question.type}`)}</Badge>
                    </div>
                    <ul
                      className="grid gap-2"
                      style={{
                        marginInlineStart: question.type === 'short_answer' && !layout.body.show_answers
                          ? 0
                          : '1rem',
                        gridTemplateColumns: question.type === 'short_answer'
                          ? '1fr'
                          : `repeat(${clampAnswersPerRow(layout.body.answers_per_row)}, minmax(0, 1fr))`,
                      }}
                    >
                      {(question.type === 'short_answer' && !layout.body.show_answers
                        ? Array.from({ length: clampShortAnswerLines(layout.body.short_answer_lines) }, (_, lineIndex) => ({
                            id: `blank-${lineIndex}`,
                            answer_text: '',
                            is_correct: false,
                          }))
                        : question.type === 'short_answer' && !(question.answers || []).length
                          ? [{ id: 'blank', answer_text: '', is_correct: false }]
                          : (question.answers || [])
                      ).map((answer, answerIndex) => (
                        <li key={`${question.id}-${answer.id ?? answerIndex}`}>
                          <ExamAnswerLine
                            marker={formatAnswerMarker(
                              layout.body.answer_marker_style,
                              answerIndex,
                              question.type,
                            )}
                            text={answer.answer_text}
                            pageDir={contentDir}
                            showCorrect={layout.body.show_answers}
                            isCorrect={answer.is_correct}
                            blank={question.type === 'short_answer' && !layout.body.show_answers}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              {layout.footer.enabled && layout.footer.html && (
                <div
                  className="mt-6 border-t pt-3"
                  style={{ textAlign: layout.footer.align }}
                  dangerouslySetInnerHTML={{ __html: layout.footer.html }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

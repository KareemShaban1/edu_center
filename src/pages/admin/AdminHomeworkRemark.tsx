import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, PencilLine, Plus, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import HomeworkRemarkEditor from '@/components/homework/HomeworkRemarkEditor';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import {
  adminHomeworkApi,
  type AdminHomeworkReviewPayload,
} from '@/services/endpoints/admin-homework';
import { toast } from '@/hooks/use-toast';
import { resolveAssetUrl } from '@/lib/asset-url';

type CorrectionMode = 'view' | 'edit' | 'new';

function homeworkStatusLabel(status: string, t: (key: string) => string): string {
  return t(`homework.status.${status}`) || status.replace(/_/g, ' ');
}

function isImageFile(nameOrUrl: string): boolean {
  return /\.(png|jpe?g|gif|webp|bmp)$/i.test(nameOrUrl);
}

function CorrectionPreview({
  url,
  fileName,
}: {
  url: string;
  fileName: string;
}) {
  const resolved = resolveAssetUrl(url);
  if (isImageFile(fileName || url)) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
        <img
          src={resolved}
          alt={fileName || 'correction'}
          className="mx-auto max-h-[75vh] w-auto max-w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
      <iframe
        title={fileName || 'correction'}
        src={resolved}
        className="h-[75vh] w-full bg-background"
      />
    </div>
  );
}

export default function AdminHomeworkRemark() {
  const { homeworkId, submissionId } = useParams();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const hwId = Number(homeworkId);
  const subId = Number(submissionId);

  const [status, setStatus] = useState<AdminHomeworkReviewPayload['status']>('submitted');
  const [degree, setDegree] = useState('');
  const [rate, setRate] = useState('');
  const [response, setResponse] = useState('');
  const [mode, setMode] = useState<CorrectionMode>('view');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-homework-submission', subId],
    queryFn: () => adminHomeworkApi.getSubmission(subId),
    enabled: Number.isFinite(subId) && subId > 0,
  });

  useEffect(() => {
    const submission = data?.submission;
    if (!submission) return;
    setStatus(submission.status === 'not_submitted' ? 'submitted' : submission.status);
    setDegree(submission.degree || '');
    setRate(submission.rate || '');
    setResponse(submission.response || '');
  }, [data?.submission]);

  const submissionIdKey = data?.submission?.submission_id ?? null;
  const hasExistingCorrection = Boolean(data?.submission?.correction_url);

  useEffect(() => {
    if (submissionIdKey == null) return;
    setMode(hasExistingCorrection ? 'view' : 'new');
  }, [submissionIdKey, hasExistingCorrection]);

  const saveMutation = useMutation({
    mutationFn: (file: File) => adminHomeworkApi.uploadCorrection(subId, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-homework-submission', subId] });
      await queryClient.invalidateQueries({ queryKey: ['admin-homework-submissions', hwId] });
      setMode('view');
      toast({ title: t('homework.correctionSaved'), description: t('homework.correctionSavedDesc') });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('homework.correctionFailed');
      toast({ title: t('homework.correctionFailed'), description: message, variant: 'destructive' });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (payload: AdminHomeworkReviewPayload) => adminHomeworkApi.reviewSubmission(subId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-homework-submission', subId] });
      await queryClient.invalidateQueries({ queryKey: ['admin-homework-submissions', hwId] });
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
      toast({ title: t('homework.reviewSaved'), description: t('homework.reviewSavedDesc') });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('homework.reviewFailed');
      toast({ title: t('homework.reviewFailed'), description: message, variant: 'destructive' });
    },
  });

  const submission = data?.submission;
  const homework = data?.homework;
  const finalDegree = homework?.final_degree?.trim() || '';
  const hasCorrection = Boolean(submission?.correction_url);
  const showLastCorrection = hasCorrection && mode === 'view';
  const showEditor = mode === 'edit' || mode === 'new' || (!hasCorrection && Boolean(submission?.file_url));

  const editorSource = useMemo(() => {
    if (!submission) return null;
    if (mode === 'edit' && submission.correction_url) {
      return {
        url: resolveAssetUrl(submission.correction_url),
        fileName: submission.correction_name || 'correction.pdf',
      };
    }
    if (!submission.file_url) return null;
    return {
      url: resolveAssetUrl(submission.file_url),
      fileName: submission.file_name || 'homework.pdf',
    };
  }, [mode, submission]);

  const editorKey = useMemo(
    () => `${subId}-${mode}-${editorSource?.url || ''}`,
    [subId, mode, editorSource?.url],
  );

  const sectionTitle = (() => {
    if (mode === 'edit') return t('homework.remark.editCorrectionTitle');
    if (mode === 'new' && hasCorrection) return t('homework.remark.newCorrectionTitle');
    if (showLastCorrection) return t('homework.remark.lastCorrection');
    return t('homework.remark.newCorrectionTitle');
  })();

  const remarkLabels = {
    pen: t('homework.remark.pen'),
    highlighter: t('homework.remark.highlighter'),
    eraser: t('homework.remark.eraser'),
    text: t('homework.remark.text'),
    undo: t('homework.remark.undo'),
    clearPage: t('homework.remark.clearPage'),
    previousPage: t('homework.remark.previousPage'),
    nextPage: t('homework.remark.nextPage'),
    page: t('homework.remark.page'),
    submitCorrection: mode === 'edit'
      ? t('homework.remark.saveEditedCorrection')
      : t('homework.remark.submitCorrection'),
    loadingDocument: t('homework.remark.loadingDocument'),
    loadFailed: t('homework.remark.loadFailed'),
    addTextPrompt: t('homework.remark.addTextPrompt'),
    noFile: t('homework.remark.noFile'),
  };

  const handleReviewSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await reviewMutation.mutateAsync({
      status,
      degree: degree.trim() || undefined,
      rate: rate.trim() || undefined,
      response: response.trim() || undefined,
    });
  };

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon" className="mt-0.5 shrink-0">
            <Link to={`/admin/homework/${homeworkId}/review`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title">{t('homework.remark.title')}</h1>
            {homework && submission && (
              <p className="text-sm text-muted-foreground">
                {homework.title} · {submission.student_name}
              </p>
            )}
            {homework && (
              <p className="mt-1 text-sm font-medium text-foreground">
                {t('col.finalDegree')}: <span className="tabular-nums">{finalDegree || '—'}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <p className="text-muted-foreground">{t('misc.loading')}</p>
      )}

      {!isLoading && submission && (
        <form
          onSubmit={handleReviewSave}
          className="mb-6 grid gap-4 rounded-xl border border-border bg-card p-4 shadow-card sm:grid-cols-2 lg:grid-cols-5"
        >
          <FormField label={t('col.status')} id="remark-status">
            <FormSelect
              id="remark-status"
              title={t('col.status')}
              value={status}
              onChange={e => setStatus(e.target.value as AdminHomeworkReviewPayload['status'])}
            >
              <option value="submitted">{homeworkStatusLabel('submitted', t)}</option>
              <option value="late">{homeworkStatusLabel('late', t)}</option>
              <option value="approved">{homeworkStatusLabel('approved', t)}</option>
              <option value="rejected">{homeworkStatusLabel('rejected', t)}</option>
            </FormSelect>
          </FormField>

          <FormField label={t('col.finalDegree')} id="remark-final-degree">
            <FormInput
              id="remark-final-degree"
              value={finalDegree || '—'}
              readOnly
              disabled
            />
          </FormField>

          <FormField label={t('homework.mark')} id="remark-degree">
            <FormInput
              id="remark-degree"
              value={degree}
              onChange={e => setDegree(e.target.value)}
              placeholder={finalDegree ? `e.g. 18 / ${finalDegree}` : 'e.g. 18'}
            />
          </FormField>

          <FormField label={t('homework.rate')} id="remark-rate">
            <FormInput
              id="remark-rate"
              value={rate}
              onChange={e => setRate(e.target.value)}
              placeholder="e.g. A, 90%"
            />
          </FormField>

          <div className="sm:col-span-2 lg:col-span-5">
            <FormField label={t('homework.teacherResponse')} id="remark-response">
              <FormTextarea
                id="remark-response"
                value={response}
                rows={3}
                placeholder={t('homework.responsePlaceholder')}
                onChange={e => setResponse(e.target.value)}
              />
            </FormField>
          </div>

          <div className="flex items-end sm:col-span-2 lg:col-span-5">
            <Button type="submit" disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? t('crud.saving') : t('homework.saveReview')}
            </Button>
          </div>
        </form>
      )}

      {!isLoading && submission && (submission.file_url || submission.correction_url) && (
        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold">{sectionTitle}</h2>
            <div className="flex flex-wrap gap-2">
              {showLastCorrection && (
                <>
                  <Button asChild type="button" variant="outline" size="sm">
                    <a href={resolveAssetUrl(submission.correction_url!)} target="_blank" rel="noreferrer">
                      {t('homework.correctionFile')}
                      <ExternalLink className="h-3.5 w-3.5 ltr:ml-1.5 rtl:mr-1.5" />
                    </a>
                  </Button>
                  <Button type="button" size="sm" onClick={() => setMode('edit')}>
                    <PencilLine className="h-4 w-4 ltr:mr-1.5 rtl:ml-1.5" />
                    {t('homework.remark.editCorrection')}
                  </Button>
                  {submission.file_url && (
                    <Button type="button" variant="secondary" size="sm" onClick={() => setMode('new')}>
                      <Plus className="h-4 w-4 ltr:mr-1.5 rtl:ml-1.5" />
                      {t('homework.remark.newCorrection')}
                    </Button>
                  )}
                </>
              )}
              {(mode === 'edit' || mode === 'new') && hasCorrection && (
                <Button type="button" variant="outline" size="sm" onClick={() => setMode('view')}>
                  <X className="h-4 w-4 ltr:mr-1.5 rtl:ml-1.5" />
                  {t('homework.remark.cancelNewCorrection')}
                </Button>
              )}
            </div>
          </div>

          {showLastCorrection && (
            <CorrectionPreview
              url={submission.correction_url!}
              fileName={submission.correction_name || submission.correction_url || ''}
            />
          )}

          {showEditor && editorSource && (
            <HomeworkRemarkEditor
              key={editorKey}
              fileUrl={editorSource.url}
              fileName={editorSource.fileName}
              submitting={saveMutation.isPending}
              labels={remarkLabels}
              onSubmit={async file => {
                await saveMutation.mutateAsync(file);
              }}
            />
          )}
        </section>
      )}

      {!isLoading && submission && !submission.file_url && !submission.correction_url && (
        <p className="text-muted-foreground">{t('homework.remark.noFile')}</p>
      )}
    </DashboardLayout>
  );
}

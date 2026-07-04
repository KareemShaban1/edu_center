import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import HomeworkRemarkEditor from '@/components/homework/HomeworkRemarkEditor';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import { adminHomeworkApi } from '@/services/endpoints/admin-homework';
import { toast } from '@/hooks/use-toast';
import { resolveAssetUrl } from '@/lib/asset-url';

export default function AdminHomeworkRemark() {
  const { homeworkId, submissionId } = useParams();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const hwId = Number(homeworkId);
  const subId = Number(submissionId);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-homework-submission', subId],
    queryFn: () => adminHomeworkApi.getSubmission(subId),
    enabled: Number.isFinite(subId) && subId > 0,
  });

  const saveMutation = useMutation({
    mutationFn: (file: File) => adminHomeworkApi.uploadCorrection(subId, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-homework-submission', subId] });
      await queryClient.invalidateQueries({ queryKey: ['admin-homework-submissions', hwId] });
      toast({ title: t('homework.correctionSaved'), description: t('homework.correctionSavedDesc') });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('homework.correctionFailed');
      toast({ title: t('homework.correctionFailed'), description: message, variant: 'destructive' });
    },
  });

  const submission = data?.submission;
  const homework = data?.homework;

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
    submitCorrection: t('homework.remark.submitCorrection'),
    loadingDocument: t('homework.remark.loadingDocument'),
    loadFailed: t('homework.remark.loadFailed'),
    addTextPrompt: t('homework.remark.addTextPrompt'),
    noFile: t('homework.remark.noFile'),
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
            {submission?.correction_url && (
              <p className="mt-1 text-sm">
                <a href={resolveAssetUrl(submission.correction_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">
                  {t('homework.correctionFile')}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </p>
            )}
          </div>
        </div>
      </div>

      {isLoading && (
        <p className="text-muted-foreground">{t('misc.loading')}</p>
      )}

      {!isLoading && submission?.file_url && (
        <HomeworkRemarkEditor
          fileUrl={submission.file_url}
          fileName={submission.file_name || 'homework.pdf'}
          submitting={saveMutation.isPending}
          labels={remarkLabels}
          onSubmit={async file => {
            await saveMutation.mutateAsync(file);
          }}
        />
      )}

      {!isLoading && submission && !submission.file_url && (
        <p className="text-muted-foreground">{t('homework.remark.noFile')}</p>
      )}
    </DashboardLayout>
  );
}

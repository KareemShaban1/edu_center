import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, ExternalLink, PencilLine } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import ResponsiveDataTable, { stickyBodyCell, stickyHeadCell, tableBodyCell, tableHeadCell } from '@/components/ResponsiveDataTable';
import { useLocale } from '@/contexts/LocaleContext';
import {
  adminHomeworkApi,
  type AdminHomeworkReviewPayload,
  type AdminHomeworkSubmissionRow,
} from '@/services/endpoints/admin-homework';
import { toast } from '@/hooks/use-toast';
import { resolveAssetUrl } from '@/lib/asset-url';

function homeworkStatusLabel(status: string, t: (key: string) => string): string {
  return t(`homework.status.${status}`) || status.replace(/_/g, ' ');
}

function ReviewForm({
  row,
  onClose,
  onSave,
  saving,
}: {
  row: AdminHomeworkSubmissionRow;
  onClose: () => void;
  onSave: (payload: AdminHomeworkReviewPayload) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [status, setStatus] = useState<AdminHomeworkReviewPayload['status']>(
    row.status === 'not_submitted' ? 'submitted' : row.status,
  );
  const [degree, setDegree] = useState(row.degree || '');
  const [rate, setRate] = useState(row.rate || '');
  const [response, setResponse] = useState(row.response || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      status,
      degree: degree.trim() || undefined,
      rate: rate.trim() || undefined,
      response: response.trim() || undefined,
    });
    onClose();
  };

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`${t('homework.review')} — ${row.student_name}`}
      onSubmit={handleSubmit}
      loading={saving}
      submitLabel={t('homework.saveReview')}
    >
      <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3 text-sm">
        <p><strong>{t('col.status')}:</strong> <StatusBadge status={row.status} label={homeworkStatusLabel(row.status, t)} /></p>
        {row.upload_date && <p><strong>{t('homework.submittedAt')}:</strong> {row.upload_date}</p>}
        {row.student_notes && <p><strong>{t('homework.studentNotes')}:</strong> {row.student_notes}</p>}
        {row.file_url && (
          <p>
            <strong>{t('homework.currentFile')}:</strong>{' '}
            <a href={resolveAssetUrl(row.file_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">
              {row.file_name || t('homework.openFile')}
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </p>
        )}
      </div>

      <FormField label={t('col.status')} id="review-status">
        <FormSelect id="review-status" title={t('col.status')} value={status} onChange={e => setStatus(e.target.value as AdminHomeworkReviewPayload['status'])}>
          <option value="submitted">{t('homework.status.submitted')}</option>
          <option value="late">{t('homework.status.late')}</option>
          <option value="approved">{t('homework.status.approved')}</option>
          <option value="rejected">{t('homework.status.rejected')}</option>
        </FormSelect>
      </FormField>

      <FormField label={t('homework.mark')} id="review-degree">
        <FormInput id="review-degree" value={degree} onChange={e => setDegree(e.target.value)} placeholder="e.g. 18/20" />
      </FormField>

      <FormField label={t('homework.rate')} id="review-rate">
        <FormInput id="review-rate" value={rate} onChange={e => setRate(e.target.value)} placeholder="e.g. A, 90%" />
      </FormField>

      <FormField label={t('homework.teacherResponse')} id="review-response">
        <FormTextarea
          id="review-response"
          value={response}
          rows={4}
          placeholder={t('homework.responsePlaceholder')}
          onChange={e => setResponse(e.target.value)}
        />
      </FormField>
    </FormDialog>
  );
}

export default function AdminHomeworkReview() {
  const { homeworkId } = useParams();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const id = Number(homeworkId);
  const [reviewRow, setReviewRow] = useState<AdminHomeworkSubmissionRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-homework-submissions', id],
    queryFn: () => adminHomeworkApi.getSubmissions(id),
    enabled: Number.isFinite(id) && id > 0,
  });

  const saveMutation = useMutation({
    mutationFn: ({ submissionId, payload }: { submissionId: number; payload: AdminHomeworkReviewPayload }) =>
      adminHomeworkApi.reviewSubmission(submissionId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-homework-submissions', id] });
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
      toast({ title: t('homework.reviewSaved'), description: t('homework.reviewSavedDesc') });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('homework.reviewFailed');
      toast({ title: t('homework.reviewFailed'), description: message, variant: 'destructive' });
    },
  });

  const homework = data?.homework;
  const submissions = data?.submissions || [];
  const submittedCount = submissions.filter(s => s.submission_id).length;

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon" className="mt-0.5 shrink-0">
            <Link to="/admin/homework">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="page-title">{homework?.title || t('homework.review')}</h1>
            {homework && (
              <p className="text-sm text-muted-foreground">
                {homework.grade_name} · {homework.class_name} · {homework.section_name}
                {' · '}{t('col.dueDate')}: {homework.due_date}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {submittedCount} / {submissions.length} {t('homework.submissions')}
            </p>
          </div>
        </div>
      </div>

      {isLoading && (
        <p className="text-muted-foreground">{t('misc.loading')}</p>
      )}

      {!isLoading && submissions.length === 0 && (
        <p className="text-muted-foreground">{t('crud.noData')}</p>
      )}

      {submissions.length > 0 && (
        <>
          <div className="hidden md:block">
            <ResponsiveDataTable minWidth={960}>
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground ltr:text-left rtl:text-right">
                  <th className={`${stickyHeadCell} ltr:left-0 rtl:right-0`}>{t('col.student')}</th>
                  <th className={tableHeadCell}>{t('col.status')}</th>
                  <th className={tableHeadCell}>{t('homework.submittedAt')}</th>
                  <th className={tableHeadCell}>{t('homework.currentFile')}</th>
                  <th className={tableHeadCell}>{t('homework.studentNotes')}</th>
                  <th className={tableHeadCell}>{t('homework.mark')}</th>
                  <th className={tableHeadCell}>{t('homework.rate')}</th>
                  <th className={tableHeadCell}>{t('homework.teacherResponse')}</th>
                  <th className={tableHeadCell}>{t('crud.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(row => (
                  <tr key={row.student_id} className="border-b border-border/50">
                    <td className={`${stickyBodyCell} ltr:left-0 rtl:right-0 font-medium`}>{row.student_name}</td>
                    <td className={tableBodyCell}>
                      <StatusBadge status={row.status} label={homeworkStatusLabel(row.status, t)} />
                    </td>
                    <td className={tableBodyCell}>{row.upload_date || '—'}</td>
                    <td className={tableBodyCell}>
                      {row.file_url ? (
                        <a href={resolveAssetUrl(row.file_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">
                          <Download className="h-4 w-4" />
                          <span className="max-w-[140px] truncate">{row.file_name || t('homework.openFile')}</span>
                        </a>
                      ) : '—'}
                    </td>
                    <td className={tableBodyCell}>{row.student_notes || '—'}</td>
                    <td className={tableBodyCell}>{row.degree || '—'}</td>
                    <td className={tableBodyCell}>{row.rate || '—'}</td>
                    <td className={tableBodyCell}>{row.response || '—'}</td>
                    <td className={tableBodyCell}>
                      {row.submission_id ? (
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" variant="outline" onClick={() => setReviewRow(row)}>
                            {t('homework.review')}
                          </Button>
                          {row.file_url && (
                            <Button type="button" size="sm" variant="secondary" asChild>
                              <Link to={`/admin/homework/${homeworkId}/submissions/${row.submission_id}/remarks`}>
                                <PencilLine className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                                {t('homework.remark.title')}
                              </Link>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">{t('homework.notSubmitted')}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </ResponsiveDataTable>
          </div>

          <div className="space-y-3 md:hidden">
            {submissions.map(row => (
              <div key={row.student_id} className="rounded-xl border border-border bg-card p-4 shadow-card">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <p className="font-medium">{row.student_name}</p>
                  <StatusBadge status={row.status} label={homeworkStatusLabel(row.status, t)} />
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{t('homework.submittedAt')}: {row.upload_date || '—'}</p>
                  {row.file_url && (
                    <p>
                      <a href={resolveAssetUrl(row.file_url)} target="_blank" rel="noreferrer" className="text-primary underline">
                        {row.file_name || t('homework.openFile')}
                      </a>
                    </p>
                  )}
                  {row.student_notes && <p>{t('homework.studentNotes')}: {row.student_notes}</p>}
                  {row.degree && <p>{t('homework.mark')}: {row.degree}</p>}
                  {row.rate && <p>{t('homework.rate')}: {row.rate}</p>}
                  {row.response && <p>{t('homework.teacherResponse')}: {row.response}</p>}
                </div>
                {row.submission_id ? (
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <Button type="button" size="sm" variant="outline" className="flex-1" onClick={() => setReviewRow(row)}>
                      {t('homework.review')}
                    </Button>
                    {row.file_url && (
                      <Button type="button" size="sm" variant="secondary" className="flex-1" asChild>
                        <Link to={`/admin/homework/${homeworkId}/submissions/${row.submission_id}/remarks`}>
                          <PencilLine className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                          {t('homework.remark.title')}
                        </Link>
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">{t('homework.notSubmitted')}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {reviewRow?.submission_id && (
        <ReviewForm
          row={reviewRow}
          onClose={() => setReviewRow(null)}
          saving={saveMutation.isPending}
          onSave={async payload => {
            await saveMutation.mutateAsync({ submissionId: reviewRow.submission_id!, payload });
          }}
        />
      )}
    </DashboardLayout>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { resolveAssetUrl } from '@/lib/asset-url';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import StudentPageFilterBar, { dateOnly, uniqueSorted } from '@/components/student/StudentPageFilterBar';
import StudentFilterField from '@/components/student/StudentFilterField';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import FormDialog from '@/components/FormDialog';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import { studentSelfApi, type StudentHomeworkPayload, type StudentSelfBootstrapPayload } from '@/services/endpoints/student-self';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type HWRow = StudentSelfBootstrapPayload['homework'][number];

function homeworkStatusLabel(status: string, t: (key: string) => string): string {
  return t(`homework.status.${status}`) || status.replace(/_/g, ' ');
}

function formatSubmittedDate(value: string | undefined, locale: string): string {
  if (!value) return '—';
  const dateOnly = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return value;
  return new Date(`${dateOnly}T12:00:00`).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function hasSubmission(row: HWRow): boolean {
  return Boolean(
    row.submission_id
    || row.file_url
    || (row.status && row.status !== 'not_submitted'),
  );
}

function isHomeworkSubmissionLocked(status: string): boolean {
  return status === 'submitted' || status === 'late' || status === 'approved';
}

function HomeworkShowDialog({ item, onClose }: { item: HWRow; onClose: () => void }) {
  const { t, locale } = useLocale();
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{t('crud.view')} {t('nav.homework')}</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <p><strong>{t('col.title')}:</strong> {item.title}</p>
          <p><strong>{t('col.dueDate')}:</strong> {item.due_date}</p>
          <p><strong>{t('col.status')}:</strong> <StatusBadge status={item.status} label={homeworkStatusLabel(item.status, t)} /></p>
          <p><strong>{t('col.grade')}:</strong> {item.grade || '—'}</p>
          <p><strong>{t('homework.submittedAt')}:</strong> {formatSubmittedDate(item.upload_date, locale)}</p>
          <p><strong>{t('homework.studentNotes')}:</strong> {item.student_notes || '—'}</p>
          <p><strong>{t('homework.teacherResponse')}:</strong> {item.response || '—'}</p>
          <p><strong>{t('homework.correctionFile')}:</strong>{' '}
            {item.correction_url ? (
              <a href={resolveAssetUrl(item.correction_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">
                {item.correction_name || t('homework.openFile')}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : '—'}
          </p>
          <p><strong>{t('homework.currentFile')}:</strong>{' '}
            {item.file_url ? (
              <a href={resolveAssetUrl(item.file_url)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">
                {item.file_name || t('homework.openFile')}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : hasSubmission(item) && item.student_notes ? t('homework.notesOnly') : t('homework.notSubmitted')}
          </p>
        </div>
        <div className="flex justify-end"><Button variant="outline" onClick={onClose}>{t('misc.close')}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function HomeworkSubmissionForm({
  item,
  onClose,
  onSave,
  saving,
  tenantSlug,
}: {
  item: HWRow;
  onClose: () => void;
  onSave: (payload: StudentHomeworkPayload, submissionId?: number | null) => Promise<void>;
  saving: boolean;
  tenantSlug?: string | null;
}) {
  const { t } = useLocale();
  const [studentNotes, setStudentNotes] = useState(item.student_notes || '');
  const [file, setFile] = useState<File | null>(null);
  const isLocked = isHomeworkSubmissionLocked(item.status);

  useEffect(() => {
    if (!isLocked) return;
    toast({
      title: t('homework.submittedLocked'),
      description: t('homework.submittedLockedDesc'),
    });
    onClose();
  }, [isLocked, onClose, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    if (!item.submission_id && !file && !studentNotes.trim()) {
      toast({
        title: t('homework.submitFailed'),
        description: t('homework.submitRequired'),
        variant: 'destructive',
      });
      return;
    }
    await onSave({
      homework_id: item.homework_id,
      student_notes: studentNotes.trim() || undefined,
      file: file || undefined,
      center_id: item.center_id,
      center_slug: item.center_slug ?? tenantSlug ?? undefined,
    }, item.submission_id);
    onClose();
  };

  if (isLocked) return null;

  return (
    <FormDialog
      open
      onClose={onClose}
      title={item.submission_id ? t('homework.resubmit') : t('homework.submit')}
      description={item.title}
      onSubmit={handleSubmit}
      loading={saving}
      submitLabel={item.submission_id ? t('homework.resubmit') : t('homework.submit')}
    >
      <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
        <p><strong>{t('col.dueDate')}:</strong> {item.due_date}</p>
        <p className="mt-1">
          <strong>{t('col.status')}:</strong>{' '}
          <StatusBadge status={item.status} label={homeworkStatusLabel(item.status, t)} />
        </p>
      </div>

      {item.file_url && (
        <div className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-sm">
          <span className="font-medium">{t('homework.currentFile')}: </span>
          <a href={item.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline">
            {item.file_name || t('homework.openFile')}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      <FormField label={t('homework.upload')} id="homework-file">
        <FormInput
          id="homework-file"
          type="file"
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.zip"
          onChange={e => setFile(e.target.files?.[0] ?? null)}
        />
        <p className="mt-1 text-xs text-muted-foreground">{t('homework.uploadHint')}</p>
      </FormField>

      <FormField label={t('homework.studentNotes')} id="homework-notes">
        <FormTextarea
          id="homework-notes"
          value={studentNotes}
          placeholder={t('homework.notesPlaceholder')}
          onChange={e => setStudentNotes(e.target.value)}
        />
      </FormField>
    </FormDialog>
  );
}

export default function StudentHomework() {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data } = useStudentBootstrap();
  const rows = (data?.homework || []) as HWRow[];
  const [showItem, setShowItem] = useState<HWRow | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');

  const grades = useMemo(() => uniqueSorted(rows.map(r => r.grade)), [rows]);
  const statuses = useMemo(() => uniqueSorted(rows.map(r => r.status)), [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (statusFilter && row.status !== statusFilter) return false;
      if (gradeFilter && row.grade !== gradeFilter) return false;
      if (dueDateFilter && dateOnly(row.due_date) !== dueDateFilter) return false;
      return true;
    });
  }, [rows, statusFilter, gradeFilter, dueDateFilter]);

  const appliedFilters = [statusFilter, gradeFilter, dueDateFilter].filter(Boolean).length;

  const clearFilters = () => {
    setStatusFilter('');
    setGradeFilter('');
    setDueDateFilter('');
  };

  const saveMutation = useMutation({
    mutationFn: ({ payload, submissionId }: { payload: StudentHomeworkPayload; submissionId?: number | null }) => (
      submissionId
        ? studentSelfApi.updateHomeworkSubmission(submissionId, payload)
        : studentSelfApi.createHomeworkSubmission(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] });
      toast({ title: t('homework.saved'), description: t('homework.savedDesc') });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('homework.submitFailed');
      toast({ title: t('homework.submitFailed'), description: message, variant: 'destructive' });
    },
  });

  const columns: CrudColumn<HWRow>[] = [
    { key: 'title', label: t('col.title'), sortable: true, primary: true },
    { key: 'due_date', label: t('col.dueDate'), sortable: true },
    {
      key: 'status',
      label: t('col.status'),
      hideOnMobile: Boolean(statusFilter),
      render: h => <StatusBadge status={h.status} label={homeworkStatusLabel(h.status, t)} />,
    },
    {
      key: 'submitted_file',
      label: t('homework.currentFile'),
      render: h => {
        if (h.file_url) {
          return (
            <a
              href={h.file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-[220px] items-center gap-1.5 truncate text-primary underline hover:text-primary/80"
              title={h.file_name || t('homework.openFile')}
            >
              <Download className="h-4 w-4 shrink-0" />
              <span className="truncate">{h.file_name || t('homework.openFile')}</span>
            </a>
          );
        }
        if (hasSubmission(h) && h.student_notes) {
          return <span className="text-muted-foreground">{t('homework.notesOnly')}</span>;
        }
        return <span className="text-muted-foreground">{t('homework.notSubmitted')}</span>;
      },
    },
    {
      key: 'upload_date',
      label: t('homework.submittedAt'),
      sortable: true,
      render: h => formatSubmittedDate(h.upload_date, locale),
    },
    { key: 'grade', label: t('col.grade'), render: h => h.grade || '—', hideOnMobile: Boolean(gradeFilter) },
    {
      key: 'student_notes',
      label: t('homework.studentNotes'),
      render: h => h.student_notes || '—',
    },
    {
      key: '_show',
      label: t('crud.view'),
      render: h => (
        <button type="button" onClick={() => setShowItem(h)} className="rounded-lg border px-2 py-1 text-xs">
          {t('crud.view')}
        </button>
      ),
    },
  ];

  return (
    <>
      <CrudPage<HWRow>
        title={t('nav.homework')}
        description={t('page.homework.student.desc')}
        columns={columns}
        data={filteredRows}
        searchKeys={['title', 'status', 'student_notes', 'file_name']}
        canCreate={false}
        canDelete={false}
        canEdit
        canEditItem={row => !isHomeworkSubmissionLocked(row.status)}
        topContent={(
          <StudentPageFilterBar
            appliedCount={appliedFilters}
            onClear={clearFilters}
            resultCount={filteredRows.length}
            renderFilters={idPrefix => (
              <>
                <StudentFilterField id={`${idPrefix}-status`} label={t('col.status')}>
                  <FormSelect
                    id={`${idPrefix}-status`}
                    title={t('col.status')}
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="">{t('filter.all')}</option>
                    {statuses.map(status => (
                      <option key={status} value={status}>{homeworkStatusLabel(status, t)}</option>
                    ))}
                  </FormSelect>
                </StudentFilterField>
                <StudentFilterField id={`${idPrefix}-grade`} label={t('col.grade')}>
                  <FormSelect
                    id={`${idPrefix}-grade`}
                    title={t('col.grade')}
                    value={gradeFilter}
                    onChange={e => setGradeFilter(e.target.value)}
                  >
                    <option value="">{t('filter.all')}</option>
                    {grades.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </FormSelect>
                </StudentFilterField>
                <StudentFilterField id={`${idPrefix}-due`} label={t('col.dueDate')}>
                  <FormInput
                    id={`${idPrefix}-due`}
                    type="date"
                    value={dueDateFilter}
                    onChange={e => setDueDateFilter(e.target.value)}
                  />
                </StudentFilterField>
              </>
            )}
          />
        )}
        renderForm={(item, onClose) => (
          item ? (
            <HomeworkSubmissionForm
              item={item}
              onClose={onClose}
              saving={saveMutation.isPending}
              tenantSlug={user?.tenant_slug}
              onSave={async (payload, submissionId) => {
                await saveMutation.mutateAsync({ payload, submissionId });
              }}
            />
          ) : null
        )}
      />
      {showItem && <HomeworkShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}

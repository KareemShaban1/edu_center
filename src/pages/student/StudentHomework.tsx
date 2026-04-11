import { useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import { studentSelfApi, type StudentHomeworkPayload } from '@/services/endpoints/student-self';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface HWRow {
  id: number | string;
  submission_id?: number | null;
  homework_id: number;
  title: string;
  subject: string;
  due_date: string;
  status: string;
  grade: string;
  student_notes?: string;
  response?: string;
}

function HomeworkShowDialog({ item, onClose }: { item: HWRow; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{t('crud.view')} {t('nav.homework')}</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <p><strong>{t('col.title')}:</strong> {item.title}</p>
          <p><strong>{t('col.dueDate')}:</strong> {item.due_date}</p>
          <p><strong>{t('col.status')}:</strong> <StatusBadge status={item.status} /></p>
          <p><strong>{t('col.grade')}:</strong> {item.grade || '—'}</p>
          <p><strong>{t('col.notes')}:</strong> {item.student_notes || '—'}</p>
          <p><strong>Teacher response:</strong> {item.response || '—'}</p>
        </div>
        <div className="flex justify-end"><Button variant="outline" onClick={onClose}>{t('misc.close')}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function HomeworkForm({
  item,
  options,
  onClose,
  onSave,
  saving,
}: {
  item: HWRow | null;
  options: Array<{ id: number; title: string }>;
  onClose: () => void;
  onSave: (payload: StudentHomeworkPayload, submissionId?: number | null) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    homework_id: item?.homework_id || options[0]?.id || 0,
    status: (item?.status || 'submitted') as StudentHomeworkPayload['status'],
    student_notes: item?.student_notes || '',
    response: item?.response || '',
    degree: item?.grade && item.grade !== '—' ? item.grade : '',
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.homework_id) {
      toast({ title: 'Validation error', description: 'Homework is required.', variant: 'destructive' });
      return;
    }
    onSave({
      homework_id: form.homework_id,
      status: form.status,
      student_notes: form.student_notes || undefined,
      response: form.response || undefined,
      degree: form.degree || undefined,
    }, item?.submission_id ?? null).then(onClose).catch((error: unknown) => {
      toast({ title: 'Save failed', description: error instanceof Error ? error.message : 'Failed to save', variant: 'destructive' });
    });
  };
  return (
    <FormDialog open onClose={onClose} title={item ? `${t('crud.edit')} ${t('nav.homework')}` : `${t('crud.addNew')} ${t('nav.homework')}`} onSubmit={submit} loading={saving}>
      <FormField label={t('col.title')} id="hw-id" required>
        <FormSelect id="hw-id" value={String(form.homework_id)} onChange={e => setForm(f => ({ ...f, homework_id: Number(e.target.value) }))}>
          {options.map(opt => <option key={opt.id} value={opt.id}>{opt.title}</option>)}
        </FormSelect>
      </FormField>
      <FormField label={t('col.status')} id="hw-status" required>
        <FormSelect id="hw-status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as StudentHomeworkPayload['status'] }))}>
          <option value="not_submitted">Not submitted</option>
          <option value="submitted">Submitted</option>
          <option value="late">Late</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </FormSelect>
      </FormField>
      <FormField label={t('col.grade')} id="hw-degree"><FormInput id="hw-degree" value={form.degree} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))} /></FormField>
      <FormField label={t('col.notes')} id="hw-notes"><FormTextarea id="hw-notes" value={form.student_notes} onChange={e => setForm(f => ({ ...f, student_notes: e.target.value }))} /></FormField>
      <FormField label="Response" id="hw-response"><FormTextarea id="hw-response" value={form.response} onChange={e => setForm(f => ({ ...f, response: e.target.value }))} /></FormField>
    </FormDialog>
  );
}

export default function StudentHomework() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data } = useStudentBootstrap();
  const rows = (data?.homework || []) as HWRow[];
  const homeworkOptions = data?.homework_options || [];
  const [showItem, setShowItem] = useState<HWRow | null>(null);
  const saveMutation = useMutation({
    mutationFn: ({ payload, submissionId }: { payload: StudentHomeworkPayload; submissionId?: number | null }) => (
      submissionId ? studentSelfApi.updateHomeworkSubmission(submissionId, payload) : studentSelfApi.createHomeworkSubmission(payload)
    ),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (submissionId: number) => studentSelfApi.deleteHomeworkSubmission(submissionId),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] }); },
  });
  const columns: CrudColumn<HWRow>[] = [
    { key: 'title', label: t('col.title'), sortable: true },
    { key: 'subject', label: t('col.subject') },
    { key: 'due_date', label: t('col.dueDate'), sortable: true },
    { key: 'status', label: t('col.status'), render: h => <StatusBadge status={h.status} /> },
    { key: 'grade', label: t('col.grade') },
    { key: '_show', label: t('crud.view'), render: h => <button onClick={() => setShowItem(h)} className="rounded-lg border px-2 py-1 text-xs">{t('crud.view')}</button> },
  ];
  return (
    <>
      <CrudPage<HWRow>
        title={t('nav.homework')}
        description={t('page.homework.desc')}
        columns={columns}
        data={rows}
        searchKeys={['title', 'subject', 'status']}
        renderForm={(item, onClose) => (
          <HomeworkForm item={item} options={homeworkOptions} onClose={onClose} onSave={async (payload, submissionId) => saveMutation.mutateAsync({ payload, submissionId })} saving={saveMutation.isPending} />
        )}
        onDelete={item => {
          if (item.submission_id) {
            void deleteMutation.mutateAsync(item.submission_id);
          } else {
            toast({ title: 'Nothing to delete', description: 'This homework has no submission record yet.' });
          }
        }}
      />
      {showItem && <HomeworkShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}

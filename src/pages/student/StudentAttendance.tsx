import { useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import { studentSelfApi, type StudentAttendancePayload } from '@/services/endpoints/student-self';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AttRow {
  id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  notes?: string;
}

function AttendanceShowDialog({ item, onClose }: { item: AttRow; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('crud.view')} {t('nav.attendance')}</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <p><strong>{t('col.date')}:</strong> {item.date}</p>
          <p><strong>{t('col.status')}:</strong> <StatusBadge status={item.status} /></p>
          <p><strong>{t('col.notes')}:</strong> {item.notes || '—'}</p>
        </div>
        <div className="flex justify-end"><Button variant="outline" onClick={onClose}>{t('misc.close')}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

function AttendanceForm({ item, onClose, onSave, saving }: { item: AttRow | null; onClose: () => void; onSave: (payload: StudentAttendancePayload, id?: number) => Promise<void>; saving: boolean; }) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    date: item?.date || new Date().toISOString().slice(0, 10),
    status: item?.status || 'present',
    notes: item?.notes || '',
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ date: form.date, status: form.status, notes: form.notes || undefined }, item?.id)
      .then(onClose)
      .catch((error: unknown) => {
        toast({ title: 'Save failed', description: error instanceof Error ? error.message : 'Failed to save', variant: 'destructive' });
      });
  };
  return (
    <FormDialog open onClose={onClose} title={item ? `${t('crud.edit')} ${t('nav.attendance')}` : `${t('crud.addNew')} ${t('nav.attendance')}`} onSubmit={submit} loading={saving}>
      <FormField label={t('col.date')} id="att-date" required><FormInput id="att-date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></FormField>
      <FormField label={t('col.status')} id="att-status" required>
        <FormSelect id="att-status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as AttRow['status'] }))}>
          <option value="present">{t('attendance.present')}</option>
          <option value="absent">{t('attendance.absent')}</option>
          <option value="late">{t('attendance.late')}</option>
        </FormSelect>
      </FormField>
      <FormField label={t('col.notes')} id="att-notes"><FormTextarea id="att-notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></FormField>
    </FormDialog>
  );
}

export default function StudentAttendance() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data } = useStudentBootstrap();
  const rows = (data?.attendance || []) as AttRow[];
  const [showItem, setShowItem] = useState<AttRow | null>(null);
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: StudentAttendancePayload; id?: number }) => id ? studentSelfApi.updateAttendance(id, payload) : studentSelfApi.createAttendance(payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentSelfApi.deleteAttendance(id),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] }); },
  });
  const columns: CrudColumn<AttRow>[] = [
    { key: 'date', label: t('col.date'), sortable: true },
    { key: 'status', label: t('col.status'), render: a => <StatusBadge status={a.status} /> },
    { key: 'notes', label: t('col.notes'), render: a => a.notes || '—' },
    { key: '_show', label: t('crud.view'), render: a => <button onClick={() => setShowItem(a)} className="rounded-lg border px-2 py-1 text-xs">{t('crud.view')}</button> },
  ];
  return (
    <>
      <CrudPage<AttRow>
        title={t('nav.attendance')}
        description={t('page.attendance.desc')}
        columns={columns}
        data={rows}
        searchKeys={['date', 'status', 'notes']}
        renderForm={(item, onClose) => (
          <AttendanceForm item={item} onClose={onClose} onSave={async (payload, id) => saveMutation.mutateAsync({ payload, id })} saving={saveMutation.isPending} />
        )}
        onDelete={item => { void deleteMutation.mutateAsync(item.id); }}
      />
      {showItem && <AttendanceShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}

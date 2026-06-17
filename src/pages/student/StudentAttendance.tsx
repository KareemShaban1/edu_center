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
        onDelete={item => { void deleteMutation.mutateAsync(item.id); }}
      />
      {showItem && <AttendanceShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}

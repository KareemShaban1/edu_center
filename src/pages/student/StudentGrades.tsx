import { useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import StatusBadge from '@/components/StatusBadge';
import { useLocale } from '@/contexts/LocaleContext';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import { studentSelfApi, type StudentGradePayload } from '@/services/endpoints/student-self';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface GradeRow {
  id: number;
  source: 'exam' | 'quiz';
  subject: string;
  date: string;
  score: number | null;
  total: number;
  attendance_status?: 'present' | 'absent' | 'late';
  notes?: string;
}

function GradeShowDialog({ item, onClose }: { item: GradeRow; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('crud.view')} {t('nav.grades')}</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <p><strong>{t('col.subject')}:</strong> {item.subject}</p>
          <p><strong>{t('col.date')}:</strong> {item.date}</p>
          <p><strong>{t('col.score')}:</strong> {item.score ?? '—'}/{item.total}</p>
          <p><strong>{t('col.status')}:</strong> <StatusBadge status={item.attendance_status || 'present'} /></p>
          <p><strong>{t('col.notes')}:</strong> {item.notes || '—'}</p>
        </div>
        <div className="flex justify-end"><Button variant="outline" onClick={onClose}>{t('misc.close')}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentGrades() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data } = useStudentBootstrap();
  const rows = (data?.grades || []) as GradeRow[];
  const [showItem, setShowItem] = useState<GradeRow | null>(null);
  const saveMutation = useMutation({
    mutationFn: async ({ payload, id, source }: { payload: StudentGradePayload; id?: number; source?: 'exam' | 'quiz' }) => {
      if (id && source) {
        await studentSelfApi.updateGrade(source, id, { date: payload.date, degree: payload.degree, attendance_status: payload.attendance_status, notes: payload.notes });
      } else {
        await studentSelfApi.createGrade(payload);
      }
    },
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: ({ source, id }: { source: 'exam' | 'quiz'; id: number }) => studentSelfApi.deleteGrade(source, id),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] }); },
  });
  const columns: CrudColumn<GradeRow>[] = [
    { key: 'subject', label: t('col.subject'), sortable: true },
    { key: 'source', label: t('nav.exams'), render: g => (g.source === 'exam' ? t('nav.exams') : t('nav.quizzes')) },
    { key: 'date', label: t('col.date'), sortable: true },
    { key: 'score', label: t('col.score'), render: g => `${g.score ?? '—'}/${g.total}` },
    { key: 'attendance_status', label: t('col.status'), render: g => <StatusBadge status={g.attendance_status || 'present'} /> },
    { key: 'notes', label: t('col.notes'), render: g => g.notes || '—' },
    { key: '_show', label: t('crud.view'), render: g => <button onClick={() => setShowItem(g)} className="rounded-lg border px-2 py-1 text-xs">{t('crud.view')}</button> },
  ];
  return (
    <>
      <CrudPage<GradeRow>
        title={t('nav.grades')}
        description={t('page.grades.desc')}
        columns={columns}
        data={rows}
        searchKeys={['subject', 'source', 'date']}
        onDelete={item => { void deleteMutation.mutateAsync({ source: item.source, id: item.id }); }}
      />
      {showItem && <GradeShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}

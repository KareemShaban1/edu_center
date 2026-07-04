import { useMemo, useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import StudentPageFilterBar, { dateOnly } from '@/components/student/StudentPageFilterBar';
import StudentFilterField from '@/components/student/StudentFilterField';
import { FormInput, FormSelect } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import { studentSelfApi, type StudentAttendancePayload } from '@/services/endpoints/student-self';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{t('crud.view')} {t('nav.attendance')}</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <p><strong>{t('col.date')}:</strong> {item.date}</p>
          <p><strong>{t('col.status')}:</strong> <StatusBadge status={item.status} label={t(`attendance.${item.status}`) || item.status} /></p>
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
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (dateFilter && dateOnly(row.date) !== dateFilter) return false;
      if (statusFilter && row.status !== statusFilter) return false;
      return true;
    });
  }, [rows, dateFilter, statusFilter]);

  const appliedFilters = [dateFilter, statusFilter].filter(Boolean).length;

  const clearFilters = () => {
    setDateFilter('');
    setStatusFilter('');
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentSelfApi.deleteAttendance(id),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] }); },
  });

  const columns: CrudColumn<AttRow>[] = [
    { key: 'date', label: t('col.date'), sortable: true, primary: true },
    {
      key: 'status',
      label: t('col.status'),
      hideOnMobile: Boolean(statusFilter),
      render: a => <StatusBadge status={a.status} label={t(`attendance.${a.status}`) || a.status} />,
    },
    { key: 'notes', label: t('col.notes'), render: a => a.notes || '—' },
    {
      key: '_show',
      label: t('crud.view'),
      render: a => (
        <button type="button" onClick={() => setShowItem(a)} className="rounded-lg border px-2.5 py-1.5 text-xs font-medium">
          {t('crud.view')}
        </button>
      ),
    },
  ];

  return (
    <>
      <CrudPage<AttRow>
        title={t('nav.attendance')}
        description={t('page.attendance.desc')}
        columns={columns}
        data={filteredRows}
        searchKeys={['date', 'status', 'notes']}
        onDelete={item => { void deleteMutation.mutateAsync(item.id); }}
        topContent={(
          <StudentPageFilterBar
            appliedCount={appliedFilters}
            onClear={clearFilters}
            resultCount={filteredRows.length}
            renderFilters={idPrefix => (
              <>
                <StudentFilterField id={`${idPrefix}-date`} label={t('col.date')}>
                  <FormInput
                    id={`${idPrefix}-date`}
                    type="date"
                    value={dateFilter}
                    onChange={e => setDateFilter(e.target.value)}
                  />
                </StudentFilterField>
                <StudentFilterField id={`${idPrefix}-status`} label={t('col.status')}>
                  <FormSelect
                    id={`${idPrefix}-status`}
                    title={t('col.status')}
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="">{t('filter.all')}</option>
                    <option value="present">{t('attendance.present')}</option>
                    <option value="absent">{t('attendance.absent')}</option>
                    <option value="late">{t('attendance.late')}</option>
                  </FormSelect>
                </StudentFilterField>
              </>
            )}
          />
        )}
      />
      {showItem && <AttendanceShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}

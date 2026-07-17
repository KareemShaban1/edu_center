import { useMemo, useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import StudentPageFilterBar, { dateOnly, uniqueSorted } from '@/components/student/StudentPageFilterBar';
import StudentFilterField from '@/components/student/StudentFilterField';
import StudentCenterTabsBar from '@/components/student/StudentCenterTabsBar';
import { FormInput, FormSelect } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import { useStudentCenterTabs } from '@/hooks/use-student-center-tabs';
import { studentSelfApi } from '@/services/endpoints/student-self';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CenterScopedRow } from '@/types/models';

interface GradeRow extends CenterScopedRow {
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
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
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
  const {
    centerOptions,
    selectedCenterId,
    setSelectedCenterId,
    showCenterTabs,
    scopedRows,
  } = useStudentCenterTabs(data?.centers, rows);

  const [showItem, setShowItem] = useState<GradeRow | null>(null);
  const [subjectFilter, setSubjectFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const subjects = useMemo(() => uniqueSorted(scopedRows.map(r => r.subject)), [scopedRows]);

  const filteredRows = useMemo(() => {
    return scopedRows.filter(row => {
      if (subjectFilter && row.subject !== subjectFilter) return false;
      if (sourceFilter && row.source !== sourceFilter) return false;
      if (dateFilter && dateOnly(row.date) !== dateFilter) return false;
      if (statusFilter && (row.attendance_status || 'present') !== statusFilter) return false;
      return true;
    });
  }, [scopedRows, subjectFilter, sourceFilter, dateFilter, statusFilter]);

  const appliedFilters = [subjectFilter, sourceFilter, dateFilter, statusFilter].filter(Boolean).length;

  const clearFilters = () => {
    setSubjectFilter('');
    setSourceFilter('');
    setDateFilter('');
    setStatusFilter('');
  };

  const deleteMutation = useMutation({
    mutationFn: ({ source, id }: { source: 'exam' | 'quiz'; id: number }) => studentSelfApi.deleteGrade(source, id),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] }); },
  });

  const columns: CrudColumn<GradeRow>[] = useMemo(() => [
    ...(showCenterTabs
      ? [{ key: 'center_name', label: t('col.center'), render: (g: GradeRow) => <CenterLabel name={g.center_name} />, hideOnMobile: true } as CrudColumn<GradeRow>]
      : []),
    { key: 'subject', label: t('col.subject'), sortable: true, primary: true, hideOnMobile: Boolean(subjectFilter) },
    {
      key: 'source',
      label: t('nav.exams'),
      hideOnMobile: Boolean(sourceFilter),
      render: g => (g.source === 'exam' ? t('nav.exams') : t('nav.quizzes')),
    },
    { key: 'date', label: t('col.date'), sortable: true },
    { key: 'score', label: t('col.score'), render: g => `${g.score ?? '—'}/${g.total}` },
    {
      key: 'attendance_status',
      label: t('col.status'),
      hideOnMobile: Boolean(statusFilter),
      render: g => <StatusBadge status={g.attendance_status || 'present'} />,
    },
    { key: 'notes', label: t('col.notes'), render: g => g.notes || '—', hideOnMobile: true },
    {
      key: '_show',
      label: t('crud.view'),
      render: g => (
        <button type="button" onClick={() => setShowItem(g)} className="rounded-lg border px-2.5 py-1.5 text-xs font-medium">
          {t('crud.view')}
        </button>
      ),
    },
  ], [showCenterTabs, sourceFilter, statusFilter, subjectFilter, t]);

  return (
    <>
      <CrudPage<GradeRow>
        title={t('nav.grades')}
        description={t('page.grades.desc')}
        columns={columns}
        data={filteredRows}
        searchKeys={['subject', 'source', 'date', 'center_name']}
        rowKey={g => portalRowKey(g.center_id, `${g.source}-${g.id}`)}
        onDelete={item => { void deleteMutation.mutateAsync({ source: item.source, id: item.id }); }}
        topContent={(
          <>
            <StudentCenterTabsBar
              centers={centerOptions}
              value={selectedCenterId}
              onValueChange={setSelectedCenterId}
            />
            <StudentPageFilterBar
              appliedCount={appliedFilters}
              onClear={clearFilters}
              resultCount={filteredRows.length}
              renderFilters={idPrefix => (
                <>
                  <StudentFilterField id={`${idPrefix}-subject`} label={t('col.subject')}>
                    <FormSelect
                      id={`${idPrefix}-subject`}
                      title={t('col.subject')}
                      value={subjectFilter}
                      onChange={e => setSubjectFilter(e.target.value)}
                    >
                      <option value="">{t('filter.all')}</option>
                      {subjects.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </FormSelect>
                  </StudentFilterField>
                  <StudentFilterField id={`${idPrefix}-source`} label={t('nav.exams')}>
                    <FormSelect
                      id={`${idPrefix}-source`}
                      title={t('nav.exams')}
                      value={sourceFilter}
                      onChange={e => setSourceFilter(e.target.value)}
                    >
                      <option value="">{t('filter.all')}</option>
                      <option value="exam">{t('nav.exams')}</option>
                      <option value="quiz">{t('nav.quizzes')}</option>
                    </FormSelect>
                  </StudentFilterField>
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
          </>
        )}
      />
      {showItem && <GradeShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}

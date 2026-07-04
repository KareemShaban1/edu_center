import { useMemo } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import ParentPortalFilterBar from '@/components/parent/ParentPortalFilterBar';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import { useLocale } from '@/contexts/LocaleContext';
import { useParentBootstrap } from '@/hooks/use-parent-bootstrap';
import {
  PARENT_ATTENDANCE_STATUS_OPTIONS,
  useParentPortalFilters,
} from '@/hooks/use-parent-portal-filters';
import type { CenterScopedRow } from '@/types/models';

interface ParentExamRow extends CenterScopedRow {
  id: number;
  student_name: string;
  grade?: string;
  date: string;
  degree?: number | null;
  attendance_status?: 'present' | 'absent' | 'late';
  notes?: string;
}

export default function ParentExams() {
  const { t } = useLocale();
  const { data } = useParentBootstrap();
  const exams = (data?.exams || []) as ParentExamRow[];

  const {
    centerFilter,
    setCenterFilter,
    dateFilter,
    setDateFilter,
    statusFilter,
    setStatusFilter,
    centers,
    showCenterFilter,
    filteredRows,
    appliedCount,
    clearFilters,
  } = useParentPortalFilters({
    rows: exams,
    getDate: row => row.date,
    getStatus: row => row.attendance_status || 'present',
  });

  const columns: CrudColumn<ParentExamRow>[] = useMemo(() => [
    ...(showCenterFilter && !centerFilter
      ? [{ key: 'center_name', label: t('col.center'), render: (e: ParentExamRow) => <CenterLabel name={e.center_name} /> } as CrudColumn<ParentExamRow>]
      : []),
    { key: 'student_name', label: t('col.child'), sortable: true, primary: true },
    { key: 'grade', label: t('col.grade') },
    { key: 'date', label: t('col.date'), sortable: true, hideOnMobile: Boolean(dateFilter) },
    { key: 'degree', label: t('col.score'), render: e => (e.degree ?? '—') },
    {
      key: 'attendance_status',
      label: t('col.status'),
      hideOnMobile: Boolean(statusFilter),
      render: e => <StatusBadge status={e.attendance_status || 'present'} label={t(`attendance.${e.attendance_status || 'present'}`)} />,
    },
    { key: 'notes', label: t('col.notes'), render: e => e.notes || '—' },
  ], [centerFilter, dateFilter, showCenterFilter, statusFilter, t]);

  return (
    <CrudPage<ParentExamRow>
      title={t('nav.exams')}
      description={t('page.exams.desc')}
      columns={columns}
      data={filteredRows}
      searchKeys={['student_name', 'date', 'center_name']}
      rowKey={e => portalRowKey(e.center_id, e.id)}
      readOnly
      topContent={(
        <ParentPortalFilterBar
          centers={centers}
          showCenterFilter={showCenterFilter}
          centerFilter={centerFilter}
          dateFilter={dateFilter}
          statusFilter={statusFilter}
          onCenterChange={setCenterFilter}
          onDateChange={setDateFilter}
          onStatusChange={setStatusFilter}
          statusOptions={PARENT_ATTENDANCE_STATUS_OPTIONS}
          appliedCount={appliedCount}
          onClear={clearFilters}
          resultCount={filteredRows.length}
        />
      )}
    />
  );
}

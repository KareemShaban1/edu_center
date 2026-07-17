import { useMemo } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import ParentPortalFilterBar from '@/components/parent/ParentPortalFilterBar';
import ParentChildTabsBar from '@/components/parent/ParentChildTabsBar';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import { useLocale } from '@/contexts/LocaleContext';
import { useParentBootstrap } from '@/hooks/use-parent-bootstrap';
import { useParentChildTabs } from '@/hooks/use-parent-child-tabs';
import {
  PARENT_ATTENDANCE_STATUS_OPTIONS,
  useParentPortalFilters,
} from '@/hooks/use-parent-portal-filters';
import type { CenterScopedRow } from '@/types/models';

interface ParentQuizRow extends CenterScopedRow {
  id: number;
  student_id: number;
  student_name: string;
  grade?: string;
  date: string;
  degree?: number | null;
  attendance_status?: 'present' | 'absent' | 'late';
  notes?: string;
}

export default function ParentQuizzes() {
  const { t } = useLocale();
  const { data } = useParentBootstrap();
  const quizzes = (data?.quizzes || []) as ParentQuizRow[];
  const {
    childTabs,
    selectedChildId,
    setSelectedChildId,
    showChildTabs,
    scopedRows,
  } = useParentChildTabs(data?.children, quizzes);

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
    rows: scopedRows,
    getDate: row => row.date,
    getStatus: row => row.attendance_status || 'present',
  });

  const columns: CrudColumn<ParentQuizRow>[] = useMemo(() => [
    ...(showCenterFilter && !centerFilter
      ? [{ key: 'center_name', label: t('col.center'), render: (q: ParentQuizRow) => <CenterLabel name={q.center_name} /> } as CrudColumn<ParentQuizRow>]
      : []),
    ...(!showChildTabs
      ? [{ key: 'student_name', label: t('col.child'), sortable: true, primary: true } as CrudColumn<ParentQuizRow>]
      : []),
    { key: 'grade', label: t('col.grade'), primary: showChildTabs },
    { key: 'date', label: t('col.date'), sortable: true, hideOnMobile: Boolean(dateFilter) },
    { key: 'degree', label: t('col.score'), render: q => (q.degree ?? '—') },
    {
      key: 'attendance_status',
      label: t('col.status'),
      hideOnMobile: Boolean(statusFilter),
      render: q => <StatusBadge status={q.attendance_status || 'present'} label={t(`attendance.${q.attendance_status || 'present'}`)} />,
    },
    { key: 'notes', label: t('col.notes'), render: q => q.notes || '—' },
  ], [centerFilter, dateFilter, showCenterFilter, showChildTabs, statusFilter, t]);

  return (
    <CrudPage<ParentQuizRow>
      title={t('nav.quizzes')}
      description={t('page.quizzes.desc')}
      columns={columns}
      data={filteredRows}
      searchKeys={['student_name', 'date', 'center_name']}
      rowKey={q => portalRowKey(q.center_id, q.id)}
      readOnly
      topContent={(
        <>
          <ParentChildTabsBar
            tabs={childTabs}
            value={selectedChildId}
            onValueChange={setSelectedChildId}
          />
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
        </>
      )}
    />
  );
}

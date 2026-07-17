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

interface AttRow extends CenterScopedRow {
  id: number;
  student_id: number;
  student_name: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export default function ParentAttendance() {
  const { t } = useLocale();
  const { data } = useParentBootstrap();
  const rows = (data?.attendance || []) as AttRow[];
  const {
    childTabs,
    selectedChildId,
    setSelectedChildId,
    showChildTabs,
    scopedRows,
  } = useParentChildTabs(data?.children, rows);

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
    getStatus: row => row.status,
  });

  const columns: CrudColumn<AttRow>[] = useMemo(() => [
    ...(showCenterFilter && !centerFilter
      ? [{ key: 'center_name', label: t('col.center'), render: (a: AttRow) => <CenterLabel name={a.center_name} /> } as CrudColumn<AttRow>]
      : []),
    ...(!showChildTabs
      ? [{ key: 'student_name', label: t('col.child'), sortable: true, primary: true } as CrudColumn<AttRow>]
      : []),
    { key: 'date', label: t('col.date'), sortable: true, primary: showChildTabs, hideOnMobile: Boolean(dateFilter) },
    {
      key: 'status',
      label: t('col.status'),
      hideOnMobile: Boolean(statusFilter),
      render: a => <StatusBadge status={a.status} label={t(`attendance.${a.status}`)} />,
    },
  ], [centerFilter, dateFilter, showCenterFilter, showChildTabs, statusFilter, t]);

  return (
    <CrudPage<AttRow>
      title={t('nav.attendance')}
      description={t('page.attendance.desc')}
      columns={columns}
      data={filteredRows}
      searchKeys={['student_name', 'date', 'center_name']}
      rowKey={a => portalRowKey(a.center_id, a.id)}
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

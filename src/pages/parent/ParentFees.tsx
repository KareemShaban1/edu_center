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
  PARENT_FEE_STATUS_OPTIONS,
  useParentPortalFilters,
} from '@/hooks/use-parent-portal-filters';
import type { CenterScopedRow } from '@/types/models';

interface FeeRow extends CenterScopedRow {
  id: number;
  student_id: number;
  student_name: string;
  item: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'pending';
  due_date: string;
}

export default function ParentFees() {
  const { t } = useLocale();
  const { data } = useParentBootstrap();
  const rows = (data?.fees || []) as FeeRow[];
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
    getDate: row => row.due_date,
    getStatus: row => row.status,
  });

  const columns: CrudColumn<FeeRow>[] = useMemo(() => [
    ...(showCenterFilter && !centerFilter
      ? [{ key: 'center_name', label: t('col.center'), render: (f: FeeRow) => <CenterLabel name={f.center_name} /> } as CrudColumn<FeeRow>]
      : []),
    ...(!showChildTabs
      ? [{ key: 'student_name', label: t('col.child'), sortable: true, primary: true } as CrudColumn<FeeRow>]
      : []),
    { key: 'item', label: t('col.title'), primary: showChildTabs },
    { key: 'amount', label: t('col.amount'), render: f => `$${f.amount.toLocaleString()}` },
    { key: 'due_date', label: t('col.dueDate'), sortable: true, hideOnMobile: Boolean(dateFilter) },
    {
      key: 'status',
      label: t('col.status'),
      hideOnMobile: Boolean(statusFilter),
      render: f => <StatusBadge status={f.status} label={t(`payments.status.${f.status}`)} />,
    },
  ], [centerFilter, dateFilter, showCenterFilter, showChildTabs, statusFilter, t]);

  return (
    <CrudPage<FeeRow>
      title={t('nav.fees_short')}
      description={t('page.fees.desc')}
      columns={columns}
      data={filteredRows}
      searchKeys={['student_name', 'item', 'center_name']}
      rowKey={f => portalRowKey(f.center_id, f.id)}
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
            statusOptions={PARENT_FEE_STATUS_OPTIONS}
            dateLabel={t('col.dueDate')}
            appliedCount={appliedCount}
            onClear={clearFilters}
            resultCount={filteredRows.length}
          />
        </>
      )}
    />
  );
}

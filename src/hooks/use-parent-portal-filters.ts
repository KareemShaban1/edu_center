import { useMemo, useState } from 'react';
import { dateOnly, uniqueSorted } from '@/components/student/StudentPageFilterBar';
import type { CenterScopedRow } from '@/types/models';

export interface ParentStatusOption {
  value: string;
  labelKey: string;
}

export const PARENT_ATTENDANCE_STATUS_OPTIONS: ParentStatusOption[] = [
  { value: 'present', labelKey: 'attendance.present' },
  { value: 'absent', labelKey: 'attendance.absent' },
  { value: 'late', labelKey: 'attendance.late' },
];

export const PARENT_FEE_STATUS_OPTIONS: ParentStatusOption[] = [
  { value: 'paid', labelKey: 'payments.status.paid' },
  { value: 'unpaid', labelKey: 'payments.status.unpaid' },
];

interface UseParentPortalFiltersOptions<T extends CenterScopedRow> {
  rows: T[];
  getDate?: (row: T) => string | null | undefined;
  getStatus?: (row: T) => string | undefined;
}

export function useParentPortalFilters<T extends CenterScopedRow>({
  rows,
  getDate,
  getStatus,
}: UseParentPortalFiltersOptions<T>) {
  const [centerFilter, setCenterFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const centers = useMemo(
    () => uniqueSorted(rows.map(row => row.center_name || '')),
    [rows],
  );

  const showCenterFilter = centers.length > 1;

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (centerFilter && row.center_name !== centerFilter) return false;
      if (dateFilter && getDate && dateOnly(getDate(row)) !== dateFilter) return false;
      if (statusFilter && getStatus && getStatus(row) !== statusFilter) return false;
      return true;
    });
  }, [rows, centerFilter, dateFilter, statusFilter, getDate, getStatus]);

  const appliedCount = [centerFilter, dateFilter, statusFilter].filter(Boolean).length;

  const clearFilters = () => {
    setCenterFilter('');
    setDateFilter('');
    setStatusFilter('');
  };

  return {
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
  };
}

export function matchesParentPortalFilters<T extends CenterScopedRow>(
  row: T,
  filters: {
    centerFilter: string;
    dateFilter: string;
    statusFilter: string;
    getDate?: (row: T) => string | null | undefined;
    getStatus?: (row: T) => string | undefined;
  },
): boolean {
  if (filters.centerFilter && row.center_name !== filters.centerFilter) return false;
  if (filters.dateFilter && filters.getDate && dateOnly(filters.getDate(row)) !== filters.dateFilter) return false;
  if (filters.statusFilter && filters.getStatus && filters.getStatus(row) !== filters.statusFilter) return false;
  return true;
}

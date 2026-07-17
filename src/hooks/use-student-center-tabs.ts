import { useEffect, useMemo, useState } from 'react';
import type { StudentCenterSummary } from '@/services/endpoints/student-self';
import type { CenterScopedRow } from '@/types/models';

export interface StudentCenterTabOption {
  id: string;
  name: string;
}

function sameCenterId(a: string | number | undefined | null, b: string | undefined): boolean {
  if (a == null || b == null || b === '') return false;
  return String(a) === b;
}

export function useStudentCenterTabs<T extends CenterScopedRow>(
  centers: StudentCenterSummary[] | undefined,
  rows: T[],
) {
  const centerOptions = useMemo((): StudentCenterTabOption[] => {
    if (centers && centers.length > 0) {
      return centers.map(center => ({
        id: String(center.center_id),
        name: center.center_name,
      }));
    }

    const byId = new Map<string, string>();
    for (const row of rows) {
      if (row.center_id == null) continue;
      const id = String(row.center_id);
      if (!byId.has(id)) {
        byId.set(id, row.center_name || id);
      }
    }
    return Array.from(byId.entries()).map(([id, name]) => ({ id, name }));
  }, [centers, rows]);

  const defaultId = centerOptions[0]?.id ?? '';
  const [selectedCenterId, setSelectedCenterId] = useState(defaultId);

  useEffect(() => {
    if (!centerOptions.some(c => c.id === selectedCenterId)) {
      setSelectedCenterId(defaultId);
    }
  }, [centerOptions, defaultId, selectedCenterId]);

  const activeCenterId = centerOptions.some(c => c.id === selectedCenterId)
    ? selectedCenterId
    : defaultId;

  const showCenterTabs = centerOptions.length > 1;

  const scopedRows = useMemo(() => {
    if (!showCenterTabs || !activeCenterId) return rows;
    return rows.filter(row => {
      if (row.center_id == null) return centerOptions.length <= 1;
      return sameCenterId(row.center_id, activeCenterId);
    });
  }, [activeCenterId, centerOptions.length, rows, showCenterTabs]);

  const activeCenter = useMemo(
    () => centerOptions.find(c => c.id === activeCenterId) || centerOptions[0] || null,
    [activeCenterId, centerOptions],
  );

  return {
    centerOptions,
    selectedCenterId: activeCenterId,
    setSelectedCenterId,
    showCenterTabs,
    scopedRows,
    activeCenter,
  };
}

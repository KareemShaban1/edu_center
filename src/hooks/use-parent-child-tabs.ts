import { useEffect, useMemo, useState } from 'react';
import type { ParentBootstrapPayload } from '@/services/endpoints/parent';

export interface ParentChildTabOption {
  id: string;
  name: string;
}

type ChildRow = ParentBootstrapPayload['children'][number];

export function useParentChildTabs<T extends { student_id?: number; student_name?: string; id?: number }>(
  children: ChildRow[] | undefined,
  rows: T[],
  options?: {
    /** When true, rows are children themselves (id = child id). */
    rowsAreChildren?: boolean;
  },
) {
  const childTabs = useMemo((): ParentChildTabOption[] => {
    if (children && children.length > 0) {
      const byId = new Map<string, string>();
      for (const child of children) {
        const id = String(child.id);
        if (!byId.has(id)) byId.set(id, child.name);
      }
      return Array.from(byId.entries()).map(([id, name]) => ({ id, name }));
    }

    const byId = new Map<string, string>();
    for (const row of rows) {
      if (options?.rowsAreChildren) {
        if (row.id == null) continue;
        const id = String(row.id);
        if (!byId.has(id)) byId.set(id, row.student_name || id);
        continue;
      }
      if (row.student_id == null) continue;
      const id = String(row.student_id);
      if (!byId.has(id)) byId.set(id, row.student_name || id);
    }
    return Array.from(byId.entries()).map(([id, name]) => ({ id, name }));
  }, [children, options?.rowsAreChildren, rows]);

  const defaultId = childTabs[0]?.id ?? '';
  const [selectedChildId, setSelectedChildId] = useState(defaultId);

  useEffect(() => {
    if (!childTabs.some(c => c.id === selectedChildId)) {
      setSelectedChildId(defaultId);
    }
  }, [childTabs, defaultId, selectedChildId]);

  const activeChildId = childTabs.some(c => c.id === selectedChildId)
    ? selectedChildId
    : defaultId;

  const showChildTabs = childTabs.length > 1;

  const scopedRows = useMemo(() => {
    if (!showChildTabs || !activeChildId) return rows;
    return rows.filter(row => {
      if (options?.rowsAreChildren) {
        return String(row.id) === activeChildId;
      }
      return String(row.student_id) === activeChildId;
    });
  }, [activeChildId, options?.rowsAreChildren, rows, showChildTabs]);

  return {
    childTabs,
    selectedChildId: activeChildId,
    setSelectedChildId,
    showChildTabs,
    scopedRows,
  };
}

import { useMemo, useState } from 'react';
import { dateOnly } from '@/components/student/StudentPageFilterBar';
import type { TeacherBootstrapPayload } from '@/services/endpoints/teacher';

export interface TeacherScopeFilterable {
  grade_id?: number;
  class_id?: number;
  section_id?: number;
}

interface ScopeOption {
  id: number;
  name: string;
}

function uniqueScopeOptions(items: ScopeOption[]): ScopeOption[] {
  const map = new Map<number, string>();
  items.forEach(item => {
    if (item.id && item.name) map.set(item.id, item.name);
  });
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function useTeacherScopeFilters<T extends TeacherScopeFilterable>(
  scopeClasses: TeacherBootstrapPayload['classes'],
  rows: T[],
  getDate?: (row: T) => string | null | undefined,
) {
  const [gradeFilter, setGradeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const grades = useMemo(
    () => uniqueScopeOptions(scopeClasses.map(c => ({ id: c.grade_id, name: c.grade }))),
    [scopeClasses],
  );

  const classesByGrade = useMemo(() => {
    if (!gradeFilter) return [];
    const gradeId = Number(gradeFilter);
    return uniqueScopeOptions(
      scopeClasses
        .filter(c => c.grade_id === gradeId)
        .map(c => ({ id: c.class_id, name: c.class })),
    );
  }, [scopeClasses, gradeFilter]);

  const sectionsByClass = useMemo(() => {
    if (!classFilter) return [];
    const classId = Number(classFilter);
    const gradeId = gradeFilter ? Number(gradeFilter) : null;
    return uniqueScopeOptions(
      scopeClasses
        .filter(c => c.class_id === classId && (gradeId == null || c.grade_id === gradeId))
        .map(c => ({ id: c.id, name: c.section })),
    );
  }, [scopeClasses, classFilter, gradeFilter]);

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (gradeFilter && row.grade_id !== Number(gradeFilter)) return false;
      if (classFilter && row.class_id !== Number(classFilter)) return false;
      if (sectionFilter && row.section_id !== Number(sectionFilter)) return false;
      if (dateFilter && getDate && dateOnly(getDate(row)) !== dateFilter) return false;
      return true;
    });
  }, [rows, gradeFilter, classFilter, sectionFilter, dateFilter, getDate]);

  const appliedCount = [gradeFilter, classFilter, sectionFilter, dateFilter].filter(Boolean).length;

  const clearFilters = () => {
    setGradeFilter('');
    setClassFilter('');
    setSectionFilter('');
    setDateFilter('');
  };

  const handleGradeChange = (value: string) => {
    setGradeFilter(value);
    setClassFilter('');
    setSectionFilter('');
  };

  const handleClassChange = (value: string) => {
    setClassFilter(value);
    setSectionFilter('');
  };

  return {
    gradeFilter,
    setGradeFilter,
    classFilter,
    setClassFilter,
    sectionFilter,
    setSectionFilter,
    dateFilter,
    setDateFilter,
    grades,
    classesByGrade,
    sectionsByClass,
    filteredRows,
    appliedCount,
    clearFilters,
    handleGradeChange,
    handleClassChange,
  };
}

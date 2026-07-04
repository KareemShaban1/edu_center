import { useMemo, useState } from 'react';
import { dateOnly } from '@/components/student/StudentPageFilterBar';

export type AdminGrade = { id: number; name: string };
export type AdminClass = { id: number; name: string; grade_id: number };
export type AdminSection = { id: number; name: string; class_id: number; grade_id?: number };

export interface AdminScopeFilterable {
  grade_id?: number;
  class_id?: number;
  classroom_id?: number;
  section_id?: number;
}

interface AdminScopeFilterState {
  gradeFilter: string;
  classFilter: string;
  sectionFilter: string;
  dateFilter: string;
}

export function useAdminScopeFilterState(
  grades: AdminGrade[],
  classes: AdminClass[],
  sections: AdminSection[],
) {
  const [gradeFilter, setGradeFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [sectionFilter, setSectionFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const classesByGrade = useMemo(() => {
    if (!gradeFilter) return [];
    const gradeId = Number(gradeFilter);
    return classes.filter(c => c.grade_id === gradeId);
  }, [classes, gradeFilter]);

  const sectionsByClass = useMemo(() => {
    if (!classFilter) return [];
    const classId = Number(classFilter);
    return sections.filter(s => s.class_id === classId);
  }, [sections, classFilter]);

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
    appliedCount,
    clearFilters,
    handleGradeChange,
    handleClassChange,
  };
}

export function matchAdminScopeRow(
  row: AdminScopeFilterable,
  filters: AdminScopeFilterState,
  classes: AdminClass[],
  sections: AdminSection[],
): boolean {
  const classId = row.class_id ?? row.classroom_id;
  const gradeId = row.grade_id ?? classes.find(c => c.id === classId)?.grade_id;

  if (filters.gradeFilter && gradeId !== Number(filters.gradeFilter)) return false;
  if (filters.classFilter && classId !== Number(filters.classFilter)) return false;
  if (filters.sectionFilter) {
    if (row.section_id) {
      if (row.section_id !== Number(filters.sectionFilter)) return false;
    } else {
      const section = sections.find(s => s.id === Number(filters.sectionFilter));
      if (!section || classId !== section.class_id) return false;
    }
  }
  return true;
}

export function filterAdminSectionsForTree(
  sections: AdminSection[],
  classes: AdminClass[],
  filters: Pick<AdminScopeFilterState, 'gradeFilter' | 'classFilter' | 'sectionFilter'>,
): AdminSection[] {
  return sections.filter(section => {
    if (filters.sectionFilter && section.id !== Number(filters.sectionFilter)) return false;
    if (filters.classFilter && section.class_id !== Number(filters.classFilter)) return false;
    if (filters.gradeFilter) {
      const gradeId = section.grade_id ?? classes.find(c => c.id === section.class_id)?.grade_id;
      if (gradeId !== Number(filters.gradeFilter)) return false;
    }
    return true;
  });
}

export function useAdminScopeFilters<T extends AdminScopeFilterable>(
  grades: AdminGrade[],
  classes: AdminClass[],
  sections: AdminSection[],
  rows: T[],
  getDate?: (row: T) => string | null | undefined,
  matchRow?: (row: T, filters: AdminScopeFilterState, classes: AdminClass[], sections: AdminSection[]) => boolean,
) {
  const filterState = useAdminScopeFilterState(grades, classes, sections);

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      const scopeMatch = matchRow
        ? matchRow(row, filterState, classes, sections)
        : matchAdminScopeRow(row, filterState, classes, sections);
      if (!scopeMatch) return false;
      if (filterState.dateFilter && getDate && dateOnly(getDate(row)) !== filterState.dateFilter) return false;
      return true;
    });
  }, [rows, filterState, classes, sections, getDate, matchRow]);

  return {
    ...filterState,
    filteredRows,
  };
}

export function appendAdminDateQuery(path: string, dateFilter: string): string {
  if (!dateFilter) return path;
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}date=${encodeURIComponent(dateFilter)}`;
}

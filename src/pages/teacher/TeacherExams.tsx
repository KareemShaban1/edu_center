import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import TeacherScopeFilterBar from '@/components/teacher/TeacherScopeFilterBar';
import { useLocale } from '@/contexts/LocaleContext';
import { useTeacherBootstrap } from '@/hooks/use-teacher-bootstrap';
import { useTeacherScopeFilters } from '@/hooks/use-teacher-scope-filters';
import type { TeacherBootstrapPayload } from '@/services/endpoints/teacher';

type ExamRow = TeacherBootstrapPayload['exams'][number];

export default function TeacherExams() {
  const { t } = useLocale();
  const { data } = useTeacherBootstrap();
  const exams = data?.exams || [];
  const scopeClasses = data?.classes || [];

  const {
    gradeFilter,
    classFilter,
    sectionFilter,
    dateFilter,
    setDateFilter,
    setSectionFilter,
    grades,
    classesByGrade,
    sectionsByClass,
    filteredRows,
    appliedCount,
    clearFilters,
    handleGradeChange,
    handleClassChange,
  } = useTeacherScopeFilters(scopeClasses, exams, row => row.date);

  const columns: CrudColumn<ExamRow>[] = [
    { key: 'id', label: t('col.id'), hideOnMobile: true },
    { key: 'name', label: t('col.name'), sortable: true, primary: true },
    { key: 'student_name', label: t('col.student'), render: e => e.student_name || '—' },
    { key: 'subject', label: t('col.subject') },
    { key: 'grade', label: t('col.grade'), hideOnMobile: Boolean(gradeFilter) },
    { key: 'class', label: t('col.class'), hideOnMobile: Boolean(classFilter) },
    { key: 'section', label: t('col.section'), hideOnMobile: Boolean(sectionFilter) },
    { key: 'date', label: t('col.date'), sortable: true, hideOnMobile: Boolean(dateFilter) },
    { key: 'degree', label: t('col.score'), render: e => (e.degree ?? '—') },
    { key: 'attendance_status', label: t('col.status'), render: e => <StatusBadge status={e.attendance_status || 'present'} label={t(`status.${e.attendance_status}`)} /> },
    { key: 'notes', label: t('col.notes'), render: e => e.notes || '—' },
    { key: 'status', label: t('col.status'), render: e => <StatusBadge status={e.status} label={t(`status.${e.status}`)} /> },
  ];

  return (
    <CrudPage<ExamRow>
      title={t('nav.exams')}
      description={t('page.exams.desc')}
      columns={columns}
      data={filteredRows}
      searchKeys={['name', 'subject', 'student_name', 'grade', 'class', 'section']}
      readOnly
      topContent={(
        <TeacherScopeFilterBar
          grades={grades}
          classesByGrade={classesByGrade}
          sectionsByClass={sectionsByClass}
          gradeFilter={gradeFilter}
          classFilter={classFilter}
          sectionFilter={sectionFilter}
          dateFilter={dateFilter}
          dateLabel={t('col.date')}
          onGradeChange={handleGradeChange}
          onClassChange={handleClassChange}
          onSectionChange={setSectionFilter}
          onDateChange={setDateFilter}
          appliedCount={appliedCount}
          onClear={clearFilters}
          resultCount={filteredRows.length}
        />
      )}
    />
  );
}

import CrudPage, { CrudColumn } from '@/components/CrudPage';
import TeacherScopeFilterBar from '@/components/teacher/TeacherScopeFilterBar';
import { useLocale } from '@/contexts/LocaleContext';
import { useTeacherBootstrap } from '@/hooks/use-teacher-bootstrap';
import { useTeacherScopeFilters } from '@/hooks/use-teacher-scope-filters';
import type { TeacherBootstrapPayload } from '@/services/endpoints/teacher';

type HWRow = TeacherBootstrapPayload['homework'][number];

export default function TeacherHomework() {
  const { t } = useLocale();
  const { data } = useTeacherBootstrap();
  const homework = data?.homework || [];
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
  } = useTeacherScopeFilters(scopeClasses, homework, row => row.due_date);

  const columns: CrudColumn<HWRow>[] = [
    { key: 'id', label: t('col.id'), hideOnMobile: true },
    { key: 'title', label: t('col.title'), sortable: true, primary: true },
    { key: 'subject', label: t('col.subject') },
    { key: 'grade', label: t('col.grade'), hideOnMobile: Boolean(gradeFilter) },
    { key: 'class', label: t('col.class'), hideOnMobile: Boolean(classFilter) },
    { key: 'section', label: t('col.section'), hideOnMobile: Boolean(sectionFilter) },
    { key: 'due_date', label: t('col.dueDate'), sortable: true, hideOnMobile: Boolean(dateFilter) },
    { key: 'submissions', label: t('col.total'), render: h => <span className="font-medium">{h.submissions}</span> },
  ];

  return (
    <CrudPage<HWRow>
      title={t('nav.homework')}
      description={t('page.homework.desc')}
      columns={columns}
      data={filteredRows}
      searchKeys={['title', 'subject', 'grade', 'class', 'section']}
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
          dateLabel={t('col.dueDate')}
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

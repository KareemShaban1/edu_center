import CrudPage, { CrudColumn } from '@/components/CrudPage';
import TeacherScopeFilterBar from '@/components/teacher/TeacherScopeFilterBar';
import { Download } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useTeacherBootstrap } from '@/hooks/use-teacher-bootstrap';
import { useTeacherScopeFilters } from '@/hooks/use-teacher-scope-filters';
import type { TeacherBootstrapPayload } from '@/services/endpoints/teacher';

type LibRow = TeacherBootstrapPayload['library'][number];

export default function TeacherLibrary() {
  const { t } = useLocale();
  const { data: bootstrap } = useTeacherBootstrap();
  const data = bootstrap?.library || [];
  const scopeClasses = bootstrap?.classes || [];

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
  } = useTeacherScopeFilters(scopeClasses, data, row => row.date);

  const columns: CrudColumn<LibRow>[] = [
    { key: 'id', label: t('col.id'), hideOnMobile: true },
    { key: 'title', label: t('col.title'), sortable: true, primary: true },
    { key: 'type', label: t('col.type') },
    { key: 'grade', label: t('col.grade'), hideOnMobile: Boolean(gradeFilter) },
    { key: 'class', label: t('col.class'), hideOnMobile: Boolean(classFilter) },
    { key: 'section', label: t('col.section'), hideOnMobile: Boolean(sectionFilter) },
    { key: 'date', label: t('col.date'), sortable: true, hideOnMobile: Boolean(dateFilter) },
    {
      key: 'download',
      label: '',
      render: (row) => (
        <a
          href={row.url || '#'}
          target="_blank"
          rel="noreferrer"
          className={`rounded-lg p-1.5 inline-flex ${row.url ? 'hover:bg-muted text-muted-foreground hover:text-foreground' : 'text-muted-foreground/40 pointer-events-none'}`}
          title="Download"
        >
          <Download className="h-4 w-4" />
        </a>
      ),
    },
  ];

  return (
    <CrudPage<LibRow>
      title={t('nav.library')}
      description={t('page.library.desc')}
      columns={columns}
      data={filteredRows}
      searchKeys={['title', 'type', 'grade', 'class', 'section']}
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

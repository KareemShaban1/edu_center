import StudentPageFilterBar from '@/components/student/StudentPageFilterBar';
import StudentFilterField from '@/components/student/StudentFilterField';
import { FormInput, FormSelect } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';

interface ScopeOption {
  id: number;
  name: string;
}

interface TeacherScopeFilterBarProps {
  grades: ScopeOption[];
  classesByGrade: ScopeOption[];
  sectionsByClass: ScopeOption[];
  gradeFilter: string;
  classFilter: string;
  sectionFilter: string;
  dateFilter: string;
  dateLabel: string;
  onGradeChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onSectionChange: (value: string) => void;
  onDateChange: (value: string) => void;
  appliedCount: number;
  onClear: () => void;
  resultCount?: number;
}

export default function TeacherScopeFilterBar({
  grades,
  classesByGrade,
  sectionsByClass,
  gradeFilter,
  classFilter,
  sectionFilter,
  dateFilter,
  dateLabel,
  onGradeChange,
  onClassChange,
  onSectionChange,
  onDateChange,
  appliedCount,
  onClear,
  resultCount,
}: TeacherScopeFilterBarProps) {
  const { t } = useLocale();

  return (
    <StudentPageFilterBar
      appliedCount={appliedCount}
      onClear={onClear}
      resultCount={resultCount}
      renderFilters={idPrefix => (
        <>
          <StudentFilterField id={`${idPrefix}-grade`} label={t('col.grade')}>
            <FormSelect
              id={`${idPrefix}-grade`}
              title={t('col.grade')}
              value={gradeFilter}
              onChange={e => onGradeChange(e.target.value)}
            >
              <option value="">{t('filter.all')}</option>
              {grades.map(grade => (
                <option key={grade.id} value={grade.id}>
                  {grade.name}
                </option>
              ))}
            </FormSelect>
          </StudentFilterField>
          <StudentFilterField id={`${idPrefix}-class`} label={t('col.class')}>
            <FormSelect
              id={`${idPrefix}-class`}
              title={t('col.class')}
              value={classFilter}
              disabled={!gradeFilter}
              onChange={e => onClassChange(e.target.value)}
            >
              <option value="">{t('filter.all')}</option>
              {classesByGrade.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </FormSelect>
          </StudentFilterField>
          <StudentFilterField id={`${idPrefix}-section`} label={t('col.section')}>
            <FormSelect
              id={`${idPrefix}-section`}
              title={t('col.section')}
              value={sectionFilter}
              disabled={!classFilter}
              onChange={e => onSectionChange(e.target.value)}
            >
              <option value="">{t('filter.all')}</option>
              {sectionsByClass.map(section => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </FormSelect>
          </StudentFilterField>
          <StudentFilterField id={`${idPrefix}-date`} label={dateLabel}>
            <FormInput
              id={`${idPrefix}-date`}
              type="date"
              value={dateFilter}
              onChange={e => onDateChange(e.target.value)}
            />
          </StudentFilterField>
        </>
      )}
    />
  );
}

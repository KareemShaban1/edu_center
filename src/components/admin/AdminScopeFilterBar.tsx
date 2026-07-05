import StudentPageFilterBar from '@/components/student/StudentPageFilterBar';
import StudentFilterField from '@/components/student/StudentFilterField';
import { FormInput, FormSelect } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import type { AdminGrade } from '@/hooks/use-admin-scope-filters';

interface ScopeOption {
  id: number;
  name: string;
}

interface AdminScopeFilterBarProps {
  grades: AdminGrade[];
  classesByGrade: ScopeOption[];
  sectionsByClass: ScopeOption[];
  gradeFilter: string;
  classFilter: string;
  sectionFilter: string;
  dateFilter?: string;
  showDate?: boolean;
  dateLabel?: string;
  monthFilter?: string;
  showMonth?: boolean;
  monthOptions?: string[];
  parents?: ScopeOption[];
  parentFilter?: string;
  onParentChange?: (value: string) => void;
  onGradeChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onSectionChange: (value: string) => void;
  onDateChange?: (value: string) => void;
  onMonthChange?: (value: string) => void;
  appliedCount: number;
  onClear: () => void;
  resultCount?: number;
}

export default function AdminScopeFilterBar({
  grades,
  classesByGrade,
  sectionsByClass,
  gradeFilter,
  classFilter,
  sectionFilter,
  dateFilter = '',
  showDate = false,
  dateLabel,
  monthFilter = '',
  showMonth = false,
  monthOptions = [],
  parents = [],
  parentFilter = '',
  onParentChange,
  onGradeChange,
  onClassChange,
  onSectionChange,
  onDateChange,
  onMonthChange,
  appliedCount,
  onClear,
  resultCount,
}: AdminScopeFilterBarProps) {
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
          {parents.length > 0 ? (
            <StudentFilterField id={`${idPrefix}-parent`} label={t('col.parent')}>
              <FormSelect
                id={`${idPrefix}-parent`}
                title={t('col.parent')}
                value={parentFilter}
                onChange={e => onParentChange?.(e.target.value)}
              >
                <option value="">{t('filter.all')}</option>
                {parents.map(parent => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ))}
              </FormSelect>
            </StudentFilterField>
          ) : null}
          {showMonth ? (
            <StudentFilterField id={`${idPrefix}-month`} label={t('col.month')}>
              <FormSelect
                id={`${idPrefix}-month`}
                title={t('col.month')}
                value={monthFilter}
                onChange={e => onMonthChange?.(e.target.value)}
              >
                <option value="">{t('filter.all')}</option>
                {monthOptions.map(month => (
                  <option key={month} value={month}>
                    {month.charAt(0).toUpperCase() + month.slice(1)}
                  </option>
                ))}
              </FormSelect>
            </StudentFilterField>
          ) : null}
          {showDate ? (
            <StudentFilterField id={`${idPrefix}-date`} label={dateLabel || t('col.date')}>
              <FormInput
                id={`${idPrefix}-date`}
                type="date"
                value={dateFilter}
                onChange={e => onDateChange?.(e.target.value)}
              />
            </StudentFilterField>
          ) : null}
        </>
      )}
    />
  );
}

import { FormSelect } from '@/components/FormFields';

const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
] as const;

export { MONTHS };

export function monthLabel(month: string, locale: 'en' | 'ar') {
  const index = MONTHS.indexOf(month as (typeof MONTHS)[number]);
  if (index < 0) return month;
  return new Date(2026, index, 1).toLocaleString(locale === 'ar' ? 'ar' : 'en', { month: 'long' });
}

export interface UnpaidStudentsFiltersProps {
  locale: 'en' | 'ar';
  t: (key: string) => string;
  unpaidMonth: string;
  gradeId: string;
  classId: string;
  sectionId: string;
  grades: Array<{ id: number; name: string }>;
  classesByGrade: Array<{ id: number; name: string }>;
  sectionsByClass: Array<{ id: number; name: string }>;
  onMonthChange: (value: string) => void;
  onGradeChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onSectionChange: (value: string) => void;
  idPrefix?: string;
}

export default function UnpaidStudentsFilters({
  locale,
  t,
  unpaidMonth,
  gradeId,
  classId,
  sectionId,
  grades,
  classesByGrade,
  sectionsByClass,
  onMonthChange,
  onGradeChange,
  onClassChange,
  onSectionChange,
  idPrefix = 'unpaid-filter',
}: UnpaidStudentsFiltersProps) {
  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-month`} className="mb-1.5 block text-sm font-medium">
          {t('col.month')}
        </label>
        <FormSelect
          id={`${idPrefix}-month`}
          value={unpaidMonth}
          onChange={e => onMonthChange(e.target.value)}
        >
          {MONTHS.map(m => (
            <option key={m} value={m}>
              {monthLabel(m, locale)}
            </option>
          ))}
        </FormSelect>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-grade`} className="mb-1.5 block text-sm font-medium">
          {t('col.grade')}
        </label>
        <FormSelect
          id={`${idPrefix}-grade`}
          value={gradeId}
          onChange={e => onGradeChange(e.target.value)}
        >
          <option value="">{t('filter.all')}</option>
          {grades.map(g => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </FormSelect>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-class`} className="mb-1.5 block text-sm font-medium">
          {t('col.class')}
        </label>
        <FormSelect
          id={`${idPrefix}-class`}
          value={classId}
          disabled={!gradeId}
          onChange={e => onClassChange(e.target.value)}
        >
          <option value="">{t('filter.all')}</option>
          {classesByGrade.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </FormSelect>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-section`} className="mb-1.5 block text-sm font-medium">
          {t('col.section')}
        </label>
        <FormSelect
          id={`${idPrefix}-section`}
          value={sectionId}
          disabled={!classId}
          onChange={e => onSectionChange(e.target.value)}
        >
          <option value="">{t('filter.all')}</option>
          {sectionsByClass.map(s => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </FormSelect>
      </div>
    </>
  );
}

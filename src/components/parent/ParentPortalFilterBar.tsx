import StudentPageFilterBar from '@/components/student/StudentPageFilterBar';
import StudentFilterField from '@/components/student/StudentFilterField';
import { FormInput, FormSelect } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import type { ParentStatusOption } from '@/hooks/use-parent-portal-filters';

interface ParentPortalFilterBarProps {
  centers: string[];
  showCenterFilter?: boolean;
  centerFilter: string;
  dateFilter: string;
  statusFilter: string;
  onCenterChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  statusOptions?: ParentStatusOption[];
  showStatusFilter?: boolean;
  appliedCount: number;
  onClear: () => void;
  resultCount?: number;
  dateLabel?: string;
}

export default function ParentPortalFilterBar({
  centers,
  showCenterFilter = true,
  centerFilter,
  dateFilter,
  statusFilter,
  onCenterChange,
  onDateChange,
  onStatusChange,
  statusOptions = [],
  showStatusFilter = true,
  appliedCount,
  onClear,
  resultCount,
  dateLabel,
}: ParentPortalFilterBarProps) {
  const { t } = useLocale();

  return (
    <StudentPageFilterBar
      appliedCount={appliedCount}
      onClear={onClear}
      resultCount={resultCount}
      renderFilters={idPrefix => (
        <>
          {showCenterFilter ? (
            <StudentFilterField id={`${idPrefix}-center`} label={t('col.center')}>
              <FormSelect
                id={`${idPrefix}-center`}
                title={t('col.center')}
                value={centerFilter}
                onChange={e => onCenterChange(e.target.value)}
              >
                <option value="">{t('filter.all')}</option>
                {centers.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </FormSelect>
            </StudentFilterField>
          ) : null}
          <StudentFilterField id={`${idPrefix}-date`} label={dateLabel || t('col.date')}>
            <FormInput
              id={`${idPrefix}-date`}
              type="date"
              value={dateFilter}
              onChange={e => onDateChange(e.target.value)}
            />
          </StudentFilterField>
          {showStatusFilter && statusOptions.length > 0 ? (
            <StudentFilterField id={`${idPrefix}-status`} label={t('col.status')}>
              <FormSelect
                id={`${idPrefix}-status`}
                title={t('col.status')}
                value={statusFilter}
                onChange={e => onStatusChange(e.target.value)}
              >
                <option value="">{t('filter.all')}</option>
                {statusOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {t(opt.labelKey)}
                  </option>
                ))}
              </FormSelect>
            </StudentFilterField>
          ) : null}
        </>
      )}
    />
  );
}

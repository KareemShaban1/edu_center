import StudentPageFilterBar from '@/components/student/StudentPageFilterBar';
import StudentFilterField from '@/components/student/StudentFilterField';
import { FormSelect } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';

interface AdminUserFilterBarProps {
  roleFilter: string;
  statusFilter: string;
  roleOptions: string[];
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  appliedCount: number;
  onClear: () => void;
  resultCount?: number;
}

export default function AdminUserFilterBar({
  roleFilter,
  statusFilter,
  roleOptions,
  onRoleChange,
  onStatusChange,
  appliedCount,
  onClear,
  resultCount,
}: AdminUserFilterBarProps) {
  const { t } = useLocale();
  const roles = roleOptions.length > 0 ? roleOptions : ['admin', 'teacher', 'student', 'parent'];

  return (
    <StudentPageFilterBar
      appliedCount={appliedCount}
      onClear={onClear}
      resultCount={resultCount}
      renderFilters={idPrefix => (
        <>
          <StudentFilterField id={`${idPrefix}-role`} label={t('col.role')}>
            <FormSelect
              id={`${idPrefix}-role`}
              title={t('col.role')}
              value={roleFilter}
              onChange={e => onRoleChange(e.target.value)}
            >
              <option value="">{t('filter.all')}</option>
              {roles.map(role => (
                <option key={role} value={role}>
                  {t(`role.${role}`)}
                </option>
              ))}
            </FormSelect>
          </StudentFilterField>
          <StudentFilterField id={`${idPrefix}-status`} label={t('col.status')}>
            <FormSelect
              id={`${idPrefix}-status`}
              title={t('col.status')}
              value={statusFilter}
              onChange={e => onStatusChange(e.target.value)}
            >
              <option value="">{t('filter.all')}</option>
              <option value="active">{t('status.active')}</option>
              <option value="inactive">{t('status.inactive')}</option>
            </FormSelect>
          </StudentFilterField>
        </>
      )}
    />
  );
}

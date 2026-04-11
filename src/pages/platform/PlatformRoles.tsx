import React from 'react';
import { useQuery } from '@tanstack/react-query';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import { useLocale } from '@/contexts/LocaleContext';
import { platformApi } from '@/services/endpoints/platform';

interface RoleRow { id: number; name: string; guard: string; permissions: number; users: number; }

export default function PlatformRoles() {
  const { t } = useLocale();
  const { data, isLoading } = useQuery({
    queryKey: ['platform-roles'],
    queryFn: () => platformApi.listRoles(),
  });
  const roles = (data?.roles || []) as RoleRow[];
  const columns: CrudColumn<RoleRow>[] = [
    { key: 'id', label: t('col.id') },
    { key: 'name', label: t('col.role'), render: r => <span className="capitalize font-medium">{r.name.replace('_', ' ')}</span> },
    { key: 'guard', label: 'Guard' },
    { key: 'permissions', label: t('col.permissions'), render: r => <span className="font-medium">{r.permissions}</span> },
    { key: 'users', label: t('col.usersCount'), render: r => r.users.toLocaleString() },
  ];
  return (
    <CrudPage<RoleRow>
      title={t('nav.roles')}
      description={t('page.roles.desc')}
      columns={columns}
      data={isLoading ? [] : roles}
      searchKeys={['name', 'guard']}
      readOnly={!(data?.can_manage ?? false)}
    />
  );
}

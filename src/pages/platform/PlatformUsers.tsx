import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import StatusBadge from '@/components/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { platformApi } from '@/services/endpoints/platform';
import type { User } from '@/types/models';

type UserRow = User & { status?: string };

function UserForm({
  item,
  onClose,
  onSave,
}: {
  item: UserRow | null;
  onClose: () => void;
  onSave: (payload: Partial<UserRow> & { id?: number; password?: string }) => Promise<void>;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    name: item?.name || '',
    email: item?.email || '',
    role: item?.role || 'platform_admin',
    password: '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      id: item?.id,
      name: form.name,
      email: form.email,
      role: form.role,
      password: form.password || undefined,
    });
    toast({ title: t('crud.save') });
    onClose();
  };
  return (
    <FormDialog open title={item ? t('crud.edit') : t('crud.addNew')} onClose={onClose} onSubmit={handleSubmit}>
      <FormField label={t('col.name')} id="user-name" required>
        <FormInput id="user-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={100} />
      </FormField>
      <FormField label={t('col.email')} id="user-email" required>
        <FormInput id="user-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required maxLength={255} />
      </FormField>
      <FormField label={t('col.role')} id="user-role">
        <FormSelect id="user-role" title={t('col.role')} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
          <option value="platform_admin">{t('role.platform_admin')}</option>
          <option value="super_admin">{t('role.super_admin')}</option>
        </FormSelect>
      </FormField>
      <FormField label={t('col.password')} id="user-password">
        <FormInput id="user-password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={item ? t('form.leaveBlank') : ''} />
      </FormField>
    </FormDialog>
  );
}

export default function PlatformUsers() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['platform-users'],
    queryFn: () => platformApi.listUsers(),
  });
  const saveMutation = useMutation({
    mutationFn: (payload: Partial<UserRow> & { id?: number; password?: string }) => platformApi.saveUser(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['platform-users'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => platformApi.deleteUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['platform-users'] });
    },
  });

  const columns: CrudColumn<UserRow>[] = [
    { key: 'id', label: t('col.id') },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'email', label: t('col.email') },
    { key: 'role', label: t('col.role'), render: u => <span className="capitalize">{t(`role.${u.role}`)}</span> },
    { key: 'tenant_name', label: t('nav.tenants'), render: u => u.tenant_name || 'Platform' },
    { key: 'status', label: t('col.status'), render: u => <StatusBadge status={u.status || 'active'} /> },
  ];
  return (
    <CrudPage<UserRow>
      title={t('nav.users')}
      description={t('page.users.desc')}
      columns={columns}
      data={isLoading ? [] : (data as UserRow[])}
      searchKeys={['name', 'email', 'role', 'tenant_name']}
      renderForm={(item, onClose) => (
        <UserForm item={item} onClose={onClose} onSave={async payload => saveMutation.mutateAsync(payload)} />
      )}
      onDelete={item => {
        void deleteMutation.mutateAsync(item.id);
      }}
    />
  );
}

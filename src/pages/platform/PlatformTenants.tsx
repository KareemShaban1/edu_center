import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import StatusBadge from '@/components/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { platformApi } from '@/services/endpoints/platform';
import type { Tenant } from '@/types/models';

function TenantForm({
  item,
  onClose,
  onSave,
}: {
  item: Tenant | null;
  onClose: () => void;
  onSave: (payload: Partial<Tenant> & { id?: number }) => Promise<void>;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    name: item?.name || '',
    domain: item?.domain || '',
    slug: item?.slug || '',
    status: item?.status || 'active',
    plan: item?.plan || 'Starter',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ ...form, id: item?.id });
    toast({ title: t('crud.save') });
    onClose();
  };
  return (
    <FormDialog open title={item ? t('crud.edit') : t('crud.addNew')} onClose={onClose} onSubmit={handleSubmit}>
      <FormField label={t('col.name')} id="tenant-name" required>
        <FormInput id="tenant-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={100} />
      </FormField>
      <FormField label={t('col.domain')} id="tenant-domain" required>
        <FormInput id="tenant-domain" value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} required maxLength={100} />
      </FormField>
      <FormField label={t('auth.tenantCode')} id="tenant-slug">
        <FormInput id="tenant-slug" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} maxLength={100} />
      </FormField>
      <FormField label={t('col.plan')} id="tenant-plan">
        <FormSelect id="tenant-plan" title={t('col.plan')} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
          <option value="Starter">Starter</option><option value="Pro">Pro</option><option value="Business">Business</option><option value="Enterprise">Enterprise</option>
        </FormSelect>
      </FormField>
      <FormField label={t('col.status')} id="tenant-status">
        <FormSelect id="tenant-status" title={t('col.status')} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
          <option value="active">Active</option><option value="inactive">Inactive</option>
        </FormSelect>
      </FormField>
    </FormDialog>
  );
}

export default function PlatformTenants() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['platform-tenants'],
    queryFn: () => platformApi.listTenants(),
  });

  const columns: CrudColumn<Tenant>[] = [
    { key: 'id', label: t('col.id') },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'domain', label: t('col.domain') },
    { key: 'plan', label: t('col.plan') },
    { key: 'users_count', label: t('nav.users'), sortable: true },
    { key: 'status', label: t('col.status'), render: r => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: t('col.date'), sortable: true },
  ];

  const handleSave = async (payload: Partial<Tenant> & { id?: number }) => {
    await platformApi.saveTenant(payload);
    await queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
  };

  const handleDelete = async (item: Tenant) => {
    await platformApi.deleteTenant(item.id);
    await queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
  };

  return (
    <CrudPage<Tenant>
      title={t('nav.tenants')}
      description={t('page.tenants.desc')}
      columns={columns}
      data={isLoading ? [] : data}
      searchKeys={['name', 'domain']}
      renderForm={(item, onClose) => <TenantForm item={item} onClose={onClose} onSave={handleSave} />}
      onDelete={handleDelete}
    />
  );
}

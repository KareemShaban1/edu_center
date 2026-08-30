import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import StatusBadge from '@/components/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { platformApi } from '@/services/endpoints/platform';
import type { PlatformGovernorate } from '@/types/models';

function GovernorateForm({
  item,
  onClose,
  onSave,
}: {
  item: PlatformGovernorate | null;
  onClose: () => void;
  onSave: (payload: Partial<PlatformGovernorate> & { id?: number }) => Promise<void>;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    name: item?.name || '',
    status: item?.status || 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ id: item?.id, name: form.name, status: form.status as PlatformGovernorate['status'] });
    toast({ title: t('crud.save') });
    onClose();
  };

  return (
    <FormDialog open title={item ? t('crud.edit') : t('crud.addNew')} onClose={onClose} onSubmit={handleSubmit}>
      <FormField label={t('col.name')} id="gov-name" required>
        <FormInput id="gov-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={255} />
      </FormField>
      <FormField label={t('col.status')} id="gov-status">
        <FormSelect id="gov-status" title={t('col.status')} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PlatformGovernorate['status'] }))}>
          <option value="active">{t('status.active')}</option>
          <option value="inactive">{t('status.inactive')}</option>
        </FormSelect>
      </FormField>
    </FormDialog>
  );
}

export default function PlatformGovernorates() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['platform-governorates'],
    queryFn: () => platformApi.listGovernorates(),
  });
  const saveMutation = useMutation({
    mutationFn: (payload: Partial<PlatformGovernorate> & { id?: number }) => platformApi.saveGovernorate(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['platform-governorates'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => platformApi.deleteGovernorate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['platform-governorates'] });
    },
  });

  const columns: CrudColumn<PlatformGovernorate>[] = [
    { key: 'id', label: t('col.id') },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'cities_count', label: t('nav.cities'), sortable: true },
    { key: 'status', label: t('col.status'), render: row => <StatusBadge status={row.status} /> },
    { key: 'created_at', label: t('col.date'), sortable: true },
  ];

  return (
    <CrudPage<PlatformGovernorate>
      title={t('nav.governorates')}
      description={t('page.governorates.desc')}
      columns={columns}
      data={data}
      loading={isLoading}
      searchKeys={['name']}
      renderForm={(item, onClose) => (
        <GovernorateForm item={item} onClose={onClose} onSave={async payload => saveMutation.mutateAsync(payload)} />
      )}
      onDelete={item => {
        void deleteMutation.mutateAsync(item.id);
      }}
    />
  );
}

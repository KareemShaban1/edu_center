import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import StatusBadge from '@/components/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { platformApi } from '@/services/endpoints/platform';
import type { PlatformCity } from '@/types/models';

function CityForm({
  item,
  onClose,
  onSave,
}: {
  item: PlatformCity | null;
  onClose: () => void;
  onSave: (payload: Partial<PlatformCity> & { id?: number }) => Promise<void>;
}) {
  const { t } = useLocale();
  const { data: governorates = [] } = useQuery({
    queryKey: ['platform-governorates'],
    queryFn: () => platformApi.listGovernorates(),
  });
  const [form, setForm] = useState({
    name: item?.name || '',
    governorate_id: item?.governorate_id ? String(item.governorate_id) : '',
    status: item?.status || 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      id: item?.id,
      name: form.name,
      governorate_id: Number(form.governorate_id),
      status: form.status as PlatformCity['status'],
    });
    toast({ title: t('crud.save') });
    onClose();
  };

  return (
    <FormDialog open title={item ? t('crud.edit') : t('crud.addNew')} onClose={onClose} onSubmit={handleSubmit}>
      <FormField label={t('col.governorate')} id="city-gov" required>
        <FormSelect
          id="city-gov"
          title={t('col.governorate')}
          value={form.governorate_id}
          onChange={e => setForm(f => ({ ...f, governorate_id: e.target.value }))}
          required
        >
          <option value="">{t('form.select')}</option>
          {governorates.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </FormSelect>
      </FormField>
      <FormField label={t('col.name')} id="city-name" required>
        <FormInput id="city-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={255} />
      </FormField>
      <FormField label={t('col.status')} id="city-status">
        <FormSelect id="city-status" title={t('col.status')} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PlatformCity['status'] }))}>
          <option value="active">{t('status.active')}</option>
          <option value="inactive">{t('status.inactive')}</option>
        </FormSelect>
      </FormField>
    </FormDialog>
  );
}

export default function PlatformCities() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['platform-cities'],
    queryFn: () => platformApi.listCities(),
  });
  const saveMutation = useMutation({
    mutationFn: (payload: Partial<PlatformCity> & { id?: number }) => platformApi.saveCity(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['platform-cities'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => platformApi.deleteCity(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['platform-cities'] });
    },
  });

  const columns: CrudColumn<PlatformCity>[] = [
    { key: 'id', label: t('col.id') },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'governorate_name', label: t('col.governorate'), sortable: true },
    { key: 'status', label: t('col.status'), render: row => <StatusBadge status={row.status} /> },
    { key: 'created_at', label: t('col.date'), sortable: true },
  ];

  return (
    <CrudPage<PlatformCity>
      title={t('nav.cities')}
      description={t('page.cities.desc')}
      columns={columns}
      data={data}
      loading={isLoading}
      searchKeys={['name', 'governorate_name']}
      renderForm={(item, onClose) => (
        <CityForm item={item} onClose={onClose} onSave={async payload => saveMutation.mutateAsync(payload)} />
      )}
      onDelete={item => {
        void deleteMutation.mutateAsync(item.id);
      }}
    />
  );
}

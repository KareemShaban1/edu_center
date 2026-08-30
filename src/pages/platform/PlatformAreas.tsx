import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import StatusBadge from '@/components/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { platformApi } from '@/services/endpoints/platform';
import type { PlatformArea } from '@/types/models';

function AreaForm({
  item,
  onClose,
  onSave,
}: {
  item: PlatformArea | null;
  onClose: () => void;
  onSave: (payload: Partial<PlatformArea> & { id?: number }) => Promise<void>;
}) {
  const { t } = useLocale();
  const { data: cities = [] } = useQuery({
    queryKey: ['platform-cities'],
    queryFn: () => platformApi.listCities(),
  });
  const [form, setForm] = useState({
    name: item?.name || '',
    city_id: item?.city_id ? String(item.city_id) : '',
    lat: item?.lat != null ? String(item.lat) : '',
    long: item?.long != null ? String(item.long) : '',
    status: item?.status || 'active',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      id: item?.id,
      name: form.name,
      city_id: Number(form.city_id),
      lat: form.lat.trim() ? Number(form.lat) : null,
      long: form.long.trim() ? Number(form.long) : null,
      status: form.status as PlatformArea['status'],
    });
    toast({ title: t('crud.save') });
    onClose();
  };

  return (
    <FormDialog open title={item ? t('crud.edit') : t('crud.addNew')} onClose={onClose} onSubmit={handleSubmit}>
      <FormField label={t('col.city')} id="area-city" required>
        <FormSelect
          id="area-city"
          title={t('col.city')}
          value={form.city_id}
          onChange={e => setForm(f => ({ ...f, city_id: e.target.value }))}
          required
        >
          <option value="">{t('form.select')}</option>
          {cities.map(c => (
            <option key={c.id} value={c.id}>
              {c.governorate_name ? `${c.name} (${c.governorate_name})` : c.name}
            </option>
          ))}
        </FormSelect>
      </FormField>
      <FormField label={t('col.name')} id="area-name" required>
        <FormInput id="area-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={255} />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('col.lat')} id="area-lat">
          <FormInput id="area-lat" type="number" step="any" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
        </FormField>
        <FormField label={t('col.long')} id="area-long">
          <FormInput id="area-long" type="number" step="any" value={form.long} onChange={e => setForm(f => ({ ...f, long: e.target.value }))} />
        </FormField>
      </div>
      <FormField label={t('col.status')} id="area-status">
        <FormSelect id="area-status" title={t('col.status')} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as PlatformArea['status'] }))}>
          <option value="active">{t('status.active')}</option>
          <option value="inactive">{t('status.inactive')}</option>
        </FormSelect>
      </FormField>
    </FormDialog>
  );
}

export default function PlatformAreas() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['platform-areas'],
    queryFn: () => platformApi.listAreas(),
  });
  const saveMutation = useMutation({
    mutationFn: (payload: Partial<PlatformArea> & { id?: number }) => platformApi.saveArea(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['platform-areas'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => platformApi.deleteArea(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['platform-areas'] });
    },
  });

  const columns: CrudColumn<PlatformArea>[] = [
    { key: 'id', label: t('col.id') },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'city_name', label: t('col.city'), sortable: true },
    { key: 'governorate_name', label: t('col.governorate'), sortable: true },
    { key: 'lat', label: t('col.lat'), render: row => row.lat ?? '—' },
    { key: 'long', label: t('col.long'), render: row => row.long ?? '—' },
    { key: 'status', label: t('col.status'), render: row => <StatusBadge status={row.status} /> },
    { key: 'created_at', label: t('col.date'), sortable: true },
  ];

  return (
    <CrudPage<PlatformArea>
      title={t('nav.areas')}
      description={t('page.areas.desc')}
      columns={columns}
      data={data}
      loading={isLoading}
      searchKeys={['name', 'city_name', 'governorate_name']}
      renderForm={(item, onClose) => (
        <AreaForm item={item} onClose={onClose} onSave={async payload => saveMutation.mutateAsync(payload)} />
      )}
      onDelete={item => {
        void deleteMutation.mutateAsync(item.id);
      }}
    />
  );
}

import React, { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import StatusBadge from '@/components/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { platformApi } from '@/services/endpoints/platform';
import type { Subscription } from '@/types/models';

function SubscriptionForm({
  item,
  onClose,
  onSave,
}: {
  item: Subscription | null;
  onClose: () => void;
  onSave: (payload: Partial<Subscription> & { id?: number }) => Promise<void>;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    tenant_id: item?.tenant_id ?? 0,
    tenant_name: item?.tenant_name ?? '',
    plan: item?.plan ?? 'Starter',
    amount: item?.amount ?? 0,
    billing_cycle: item?.billing_cycle ?? 'monthly',
    status: item?.status ?? 'trial',
    next_billing_date: item?.next_billing_date ?? new Date().toISOString().slice(0, 10),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ ...form, id: item?.id });
    toast({ title: t('crud.save') });
    onClose();
  };

  return (
    <FormDialog open title={item ? t('crud.edit') : t('crud.addNew')} onClose={onClose} onSubmit={handleSubmit}>
      <FormField label={t('col.name')} id="sub-tenant-name" required>
        <FormInput
          id="sub-tenant-name"
          value={form.tenant_name}
          onChange={e => setForm(f => ({ ...f, tenant_name: e.target.value }))}
          required
          maxLength={100}
        />
      </FormField>
      <FormField label={t('col.plan')} id="sub-plan">
        <FormSelect id="sub-plan" title={t('col.plan')} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
          <option value="Starter">Starter</option>
          <option value="Pro">Pro</option>
          <option value="Business">Business</option>
          <option value="Enterprise">Enterprise</option>
        </FormSelect>
      </FormField>
      <FormField label={t('col.amount')} id="sub-amount">
        <FormInput
          id="sub-amount"
          type="number"
          value={form.amount}
          onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
          min={0}
        />
      </FormField>
      <FormField label={t('col.type')} id="sub-cycle">
        <FormSelect id="sub-cycle" title={t('col.type')} value={form.billing_cycle} onChange={e => setForm(f => ({ ...f, billing_cycle: e.target.value as Subscription['billing_cycle'] }))}>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </FormSelect>
      </FormField>
      <FormField label={t('col.status')} id="sub-status">
        <FormSelect id="sub-status" title={t('col.status')} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Subscription['status'] }))}>
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="past_due">Past Due</option>
          <option value="cancelled">Cancelled</option>
        </FormSelect>
      </FormField>
    </FormDialog>
  );
}

export default function PlatformSubscriptions() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data = [], isLoading } = useQuery({
    queryKey: ['platform-subscriptions'],
    queryFn: () => platformApi.listSubscriptions(),
  });

  const columns: CrudColumn<Subscription>[] = useMemo(() => [
    { key: 'id', label: t('col.id') },
    { key: 'tenant_name', label: t('col.name'), sortable: true },
    { key: 'plan', label: t('col.plan') },
    { key: 'amount', label: t('col.amount'), render: s => `$${s.amount}` },
    { key: 'billing_cycle', label: t('col.type') },
    { key: 'status', label: t('col.status'), render: s => <StatusBadge status={s.status} /> },
    { key: 'next_billing_date', label: t('col.date'), sortable: true },
  ], [t]);

  const handleSave = async (payload: Partial<Subscription> & { id?: number }) => {
    await platformApi.saveSubscription(payload);
    await queryClient.invalidateQueries({ queryKey: ['platform-subscriptions'] });
  };

  const handleDelete = async (item: Subscription) => {
    await platformApi.deleteSubscription(item.id);
    await queryClient.invalidateQueries({ queryKey: ['platform-subscriptions'] });
  };

  return (
    <CrudPage<Subscription>
      title={t('nav.subscriptions')}
      description={t('dashboard.superAdmin.desc')}
      columns={columns}
      data={isLoading ? [] : data}
      searchKeys={['tenant_name', 'plan', 'status']}
      renderForm={(item, onClose) => <SubscriptionForm item={item} onClose={onClose} onSave={handleSave} />}
      onDelete={handleDelete}
    />
  );
}

import React, { useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import StatusBadge from '@/components/StatusBadge';
import type { Parent } from '@/types/models';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { Paperclip, X } from 'lucide-react';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminParentsApi, type ParentSavePayload } from '@/services/endpoints/admin-parents';

function ParentForm({
  item,
  onClose,
  onSave,
  saving,
}: {
  item: Parent | null;
  onClose: () => void;
  onSave: (payload: ParentSavePayload, id?: number) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    name: item?.name || '',
    email: item?.email || '',
    password: '',
    phone: item?.phone || '',
    job_title: item?.job_title || '',
    status: item?.status || 'active' as const,
    address: item?.address || '',
  });
  const [files, setFiles] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: 'Validation error', description: 'Please fill name and email.', variant: 'destructive' });
      return;
    }
    if (!item && !form.password.trim()) {
      toast({ title: 'Validation error', description: 'Password is required for new parent.', variant: 'destructive' });
      return;
    }

    try {
      await onSave(
        {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password || undefined,
          phone: form.phone || undefined,
          job_title: form.job_title || undefined,
          status: form.status,
          address: form.address || undefined,
        },
        item?.id,
      );
      toast({ title: item ? t('crud.edit') : t('crud.addNew'), description: form.name });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save parent';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <FormDialog
      open
      title={item ? `${t('crud.edit')} ${t('nav.parents')}` : `${t('crud.addNew')} ${t('nav.parents')}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={saving}
    >
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.name')} id="parent-name" required>
          <FormInput id="parent-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={100} />
        </FormField>
        <FormField label={t('col.email')} id="parent-email" required>
          <FormInput id="parent-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required maxLength={255} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.password')} id="parent-password" required={!item}>
          <FormInput id="parent-password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!item} maxLength={100} placeholder={item ? '••••••••' : ''} />
        </FormField>
        <FormField label={t('col.phone')} id="parent-phone">
          <FormInput id="parent-phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} maxLength={20} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.jobTitle')} id="parent-job">
          <FormInput id="parent-job" value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} maxLength={100} />
        </FormField>
        <FormField label={t('col.status')} id="parent-status">
          <FormSelect title={t('col.status')} id="parent-status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}>
            <option value="active">{t('status.active')}</option>
            <option value="inactive">{t('status.inactive')}</option>
          </FormSelect>
        </FormField>
      </div>

      <FormField label={t('col.address')} id="parent-address">
        <FormTextarea id="parent-address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} maxLength={300} />
      </FormField>

      {/* Attachments */}
      <FormField label={t('col.attachments')} id="parent-attachments">
        <div className="space-y-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
            <Paperclip className="h-4 w-4" />
            {t('form.addAttachments')}
            <input type="file" multiple className="hidden" onChange={e => {
              if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
            }} />
          </label>
          {files.length > 0 && (
            <ul className="space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-1.5 text-sm">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate">{f.name}</span>
                  <button
                    type="button"
                    title="Remove attachment"
                    aria-label="Remove attachment"
                    onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {item?.attachments && item.attachments.length > 0 && (
            <p className="text-xs text-muted-foreground">{item.attachments.length} {t('form.filesSelected')}</p>
          )}
        </div>
      </FormField>
    </FormDialog>
  );
}

export default function AdminParents() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();
  const parents = (bootstrap?.parents || []) as Parent[];
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: ParentSavePayload; id?: number }) => (
      id ? adminParentsApi.update(id, payload) : adminParentsApi.create(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const columns: CrudColumn<Parent>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'email', label: t('col.email') },
    { key: 'phone', label: t('col.phone') },
    { key: 'job_title', label: t('col.jobTitle') },
    { key: 'status', label: t('col.status'), render: (val) => <StatusBadge status={val.status} /> },
  ];

  return (
    <CrudPage<Parent>
      title={t('nav.parents')}
      description={t('page.parents.desc')}
      columns={columns}
      data={parents}
      searchKeys={['name', 'email', 'phone', 'job_title']}
      renderForm={(item, onClose) => (
        <ParentForm
          item={item}
          onClose={onClose}
          onSave={async (payload, id) => {
            await saveMutation.mutateAsync({ payload, id });
          }}
          saving={saveMutation.isPending}
        />
      )}
      onDelete={item => console.log('delete', item.id)}
    />
  );
}

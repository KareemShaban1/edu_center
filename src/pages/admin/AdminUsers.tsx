import React, { useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import StatusBadge from '@/components/StatusBadge';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAccessApi, type AdminUserItem, type AdminUserSavePayload } from '@/services/endpoints/admin-access';

function UserShowDialog({ item, onClose }: { item: AdminUserItem; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{t('crud.view')} {t('nav.adminUsers')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
              {item.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{item.name}</h3>
              <span className="capitalize text-sm text-muted-foreground">{t(`role.${item.role}`)}</span>
            </div>
          </div>
          <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <DetailRow label={t('col.email')} value={item.email} />
            <DetailRow label={t('col.phone')} value={item.phone} />
            <DetailRow label={t('col.role')} value={t(`role.${item.role}`)} />
            <DetailRow label={t('col.status')} value={<StatusBadge status={item.status} />} />
            <DetailRow label={t('col.enrolled')} value={item.created_at} />
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>{t('misc.close')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function UserForm({
  item,
  onClose,
  onSave,
  saving,
  roleOptions,
}: {
  item: AdminUserItem | null;
  onClose: () => void;
  onSave: (payload: AdminUserSavePayload, id?: number) => Promise<void>;
  saving: boolean;
  roleOptions: string[];
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    name: item?.name || '',
    phone: item?.phone || '',
    email: item?.email || '',
    password: '',
    role: item?.role || 'admin',
    status: item?.status || 'active',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: AdminUserSavePayload = {
      name: form.name.trim(),
      phone: form.phone || '',
      email: form.email.trim(),
      password: form.password || undefined,
      role: form.role,
      status: form.status as 'active' | 'inactive',
    };
    if (!payload.name || !payload.email || (!item && !payload.password)) {
      toast({ title: 'Validation error', description: 'Please complete required fields.', variant: 'destructive' });
      return;
    }
    onSave(payload, item?.id)
      .then(() => {
        toast({ title: t('crud.save') });
        onClose();
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to save user';
        toast({ title: 'Save failed', description: message, variant: 'destructive' });
      });
  };

  return (
    <FormDialog open title={item ? `${t('crud.edit')} ${t('nav.adminUsers')}` : `${t('crud.addNew')} ${t('nav.adminUsers')}`} onClose={onClose} onSubmit={handleSubmit} loading={saving}>
      <FormField label={t('col.name')} id="user-name" required>
        <FormInput id="user-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={100} />
      </FormField>
      <FormField label={t('col.phone')} id="user-phone">
        <FormInput id="user-phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} maxLength={20} />
      </FormField>
      <FormField label={t('col.email')} id="user-email" required>
        <FormInput id="user-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required maxLength={255} />
      </FormField>
      <FormField label={t('col.password')} id="user-password" required={!item}>
        <FormInput id="user-password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required={!item} minLength={6} maxLength={128} placeholder={item ? t('form.leaveBlank') : ''} />
      </FormField>
      <FormField label={t('col.role')} id="user-role" required>
        <FormSelect id="user-role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
          {roleOptions.length === 0 ? (
            <>
              <option value="admin">{t('role.admin')}</option>
              <option value="teacher">{t('role.teacher')}</option>
              <option value="student">{t('role.student')}</option>
              <option value="parent">{t('role.parent')}</option>
            </>
          ) : (
            roleOptions.map(role => <option key={role} value={role}>{role}</option>)
          )}
        </FormSelect>
      </FormField>
      <FormField label={t('col.status')} id="user-status" required>
        <FormSelect id="user-status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
          <option value="active">{t('status.active')}</option>
          <option value="inactive">{t('status.inactive')}</option>
        </FormSelect>
      </FormField>
    </FormDialog>
  );
}

export default function AdminUsers() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [showItem, setShowItem] = useState<AdminUserItem | null>(null);
  const { data: users = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminAccessApi.listUsers(),
  });
  const { data: rolesData } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => adminAccessApi.listRoles(),
  });
  const roleOptions = (rolesData?.roles || []).map(r => r.name);
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: AdminUserSavePayload; id?: number }) => (
      id ? adminAccessApi.updateUser(id, payload) : adminAccessApi.createUser(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminAccessApi.deleteUser(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const columns: CrudColumn<AdminUserItem>[] = [
    { key: 'id', label: t('col.id') },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'phone', label: t('col.phone') },
    { key: 'email', label: t('col.email') },
    { key: 'role', label: t('col.role'), render: u => <span className="capitalize font-medium">{t(`role.${u.role}`)}</span> },
    { key: 'status', label: t('col.status'), render: u => <StatusBadge status={u.status} /> },
    {
      key: '_show',
      label: t('crud.view'),
      render: u => (
        <button onClick={() => setShowItem(u)} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label={t('crud.view')}>
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <>
      <CrudPage<AdminUserItem>
        title={t('nav.adminUsers')}
        description={t('page.adminUsers.desc')}
        columns={columns}
        data={users}
        searchKeys={['name', 'email', 'phone', 'role']}
        renderForm={(item, onClose) => (
          <UserForm
            item={item}
            onClose={onClose}
            onSave={async (payload, id) => {
              await saveMutation.mutateAsync({ payload, id });
            }}
            saving={saveMutation.isPending}
            roleOptions={roleOptions}
          />
        )}
        onDelete={item => {
          void deleteMutation.mutateAsync(item.id);
        }}
      />
      {showItem && <UserShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}

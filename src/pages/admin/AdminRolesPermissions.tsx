import React, { useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput } from '@/components/FormFields';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Shield, Check } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAccessApi, type AdminRoleItem, type AdminRoleSavePayload } from '@/services/endpoints/admin-access';

function splitPermission(permission: string): { module: string; action: string } {
  const knownActions = ['view', 'create', 'edit', 'delete', 'update', 'manage', 'assign', 'export', 'import'];
  const normalized = permission.trim().toLowerCase();

  // common format: resource.action  => users.create
  if (normalized.includes('.')) {
    const [left, right] = normalized.split('.', 2);
    if (knownActions.includes(left)) return { module: right || 'general', action: left };
    if (knownActions.includes(right)) return { module: left || 'general', action: right };
    return { module: left || 'general', action: right || 'access' };
  }

  // common format: action_resource or resource_action
  const tokens = normalized.split(/[\s\-_:/]+/).filter(Boolean);
  if (tokens.length >= 2) {
    const first = tokens[0];
    const last = tokens[tokens.length - 1];
    if (knownActions.includes(first)) {
      return { module: tokens.slice(1).join('_') || 'general', action: first };
    }
    if (knownActions.includes(last)) {
      return { module: tokens.slice(0, -1).join('_') || 'general', action: last };
    }
    return { module: first, action: tokens.slice(1).join('_') || 'access' };
  }

  return { module: 'general', action: normalized || 'access' };
}

function RoleShowDialog({ item, onClose, allPermissions }: { item: AdminRoleItem; onClose: () => void; allPermissions: string[] }) {
  const { t } = useLocale();

  const grouped = allPermissions.reduce<Record<string, string[]>>((acc, p) => {
    const { module } = splitPermission(p);
    if (!acc[module]) acc[module] = [];
    acc[module].push(p);
    return acc;
  }, {});

  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            {item.name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{item.description}</p>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{t('col.permissions')}:</span>
            <span className="font-semibold">{item.permissions.length} / {allPermissions.length}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">{t('col.usersCount')}:</span>
            <span className="font-semibold">{item.users_count}</span>
          </div>

          <div className="space-y-3">
            {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([module, perms]) => (
              <div key={module} className="rounded-lg border border-border p-3">
                <h4 className="mb-2 text-sm font-semibold capitalize">{module.replace(/[_-]+/g, ' ')}</h4>
                <div className="flex flex-wrap gap-2">
                  {perms.map(p => {
                    const has = item.permissions.includes(p);
                    const { action } = splitPermission(p);
                    return (
                      <span
                        key={p}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${
                          has
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground line-through'
                        }`}
                      >
                        {has && <Check className="h-3 w-3" />}
                        {action}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>{t('misc.close')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RoleForm({
  item,
  onClose,
  onSave,
  saving,
  allPermissions,
}: {
  item: AdminRoleItem | null;
  onClose: () => void;
  onSave: (payload: AdminRoleSavePayload, id?: number) => Promise<void>;
  saving: boolean;
  allPermissions: string[];
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    permissions: item?.permissions || [] as string[],
  });

  const togglePermission = (p: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(p) ? f.permissions.filter(x => x !== p) : [...f.permissions, p],
    }));
  };

  const toggleModule = (module: string) => {
    const modulePerms = allPermissions.filter(p => p.startsWith(module + '.'));
    const allSelected = modulePerms.every(p => form.permissions.includes(p));
    setForm(f => ({
      ...f,
      permissions: allSelected
        ? f.permissions.filter(p => !p.startsWith(module + '.'))
        : [...new Set([...f.permissions, ...modulePerms])],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast({ title: 'Validation error', description: 'Role name is required.', variant: 'destructive' });
      return;
    }
    onSave(
      {
        name: form.name.trim(),
        description: form.description.trim(),
        permissions: form.permissions,
      },
      item?.id,
    )
      .then(() => {
        toast({ title: t('crud.save') });
        onClose();
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to save role';
        toast({ title: 'Save failed', description: message, variant: 'destructive' });
      });
  };

  const grouped = allPermissions.reduce<Record<string, string[]>>((acc, p) => {
    const { module } = splitPermission(p);
    if (!acc[module]) acc[module] = [];
    acc[module].push(p);
    return acc;
  }, {});

  return (
    <FormDialog open title={item ? `${t('crud.edit')} ${t('nav.rolesPermissions')}` : `${t('crud.addNew')} ${t('nav.rolesPermissions')}`} onClose={onClose} onSubmit={handleSubmit} loading={saving}>
      <FormField label={t('col.name')} id="role-name" required>
        <FormInput id="role-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={50} />
      </FormField>
      <FormField label={t('col.description')} id="role-desc">
        <FormInput id="role-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} maxLength={200} />
      </FormField>

      <div>
        <label className="mb-2 block text-sm font-medium">
          {t('col.permissions')} <span className="text-muted-foreground">({form.permissions.length}/{allPermissions.length})</span>
        </label>
        <div className="mb-2 flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setForm(f => ({ ...f, permissions: [...allPermissions] }))}
          >
            Select All
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setForm(f => ({ ...f, permissions: [] }))}
          >
            Clear All
          </Button>
        </div>
        <div className="space-y-3 max-h-64 overflow-y-auto rounded-lg border border-border p-3">
          {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([module, perms]) => {
            const allChecked = perms.every(p => form.permissions.includes(p));
            const someChecked = perms.some(p => form.permissions.includes(p));
            return (
              <div key={module}>
                <label className="flex items-center gap-2 cursor-pointer mb-1">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                    onChange={() => toggleModule(module)}
                    className="rounded border-input"
                  />
                  <span className="text-sm font-semibold capitalize">{module.replace(/[_-]+/g, ' ')}</span>
                </label>
                <div className="flex flex-wrap gap-1.5 ltr:ml-6 rtl:mr-6">
                  {perms.map(p => {
                    const { action } = splitPermission(p);
                    const checked = form.permissions.includes(p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePermission(p)}
                        className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                          checked ? 'bg-primary/10 text-primary ring-1 ring-primary/30' : 'bg-muted text-muted-foreground hover:bg-muted/70'
                        }`}
                        title={p}
                      >
                        {checked && <Check className="h-3 w-3" />}
                        {action}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </FormDialog>
  );
}

export default function AdminRolesPermissions() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [showItem, setShowItem] = useState<AdminRoleItem | null>(null);
  const { data } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: () => adminAccessApi.listRoles(),
  });
  const roles = data?.roles || [];
  const allPermissions = data?.permissions || [];
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: AdminRoleSavePayload; id?: number }) => (
      id ? adminAccessApi.updateRole(id, payload) : adminAccessApi.createRole(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminAccessApi.deleteRole(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const columns: CrudColumn<AdminRoleItem>[] = [
    { key: 'id', label: t('col.id') },
    {
      key: 'name',
      label: t('col.name'),
      sortable: true,
      render: r => (
        <span className="inline-flex items-center gap-1.5 font-medium capitalize">
          <Shield className="h-4 w-4 text-primary" />
          {r.name}
        </span>
      ),
    },
    { key: 'description', label: t('col.description') },
    {
      key: 'permissions',
      label: t('col.permissions'),
      render: r => <span className="font-medium">{r.permissions.length}</span>,
    },
    {
      key: 'users_count',
      label: t('col.usersCount'),
      render: r => <span className="font-medium">{r.users_count}</span>,
    },
    {
      key: '_show',
      label: t('crud.view'),
      render: r => (
        <button onClick={() => setShowItem(r)} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" aria-label={t('crud.view')}>
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <>
      <CrudPage<AdminRoleItem>
        title={t('nav.rolesPermissions')}
        description={t('page.rolesPermissions.desc')}
        columns={columns}
        data={roles}
        searchKeys={['name', 'description']}
        renderForm={(item, onClose) => (
          <RoleForm
            item={item}
            onClose={onClose}
            onSave={async (payload, id) => {
              await saveMutation.mutateAsync({ payload, id });
            }}
            saving={saveMutation.isPending}
            allPermissions={allPermissions}
          />
        )}
        onDelete={item => {
          void deleteMutation.mutateAsync(item.id);
        }}
      />
      {showItem && <RoleShowDialog item={showItem} onClose={() => setShowItem(null)} allPermissions={allPermissions} />}
    </>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Plus, Trash2 } from 'lucide-react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { platformApi } from '@/services/endpoints/platform';
import type { Tenant, TenantCreatePayload, TenantInitialUserRow } from '@/types/models';

const emptyTeacher = (): TenantInitialUserRow => ({
  name: '',
  email: '',
  password: 'password',
  subject: 'General',
});

function defaultEmailPreview(slug: string, role: string): string {
  const s = slug.trim() || 'center';
  return s === 'demo' ? `${role}@educenter.com` : `${role}-${s}@educenter.com`;
}

function TenantLocationFields({
  form,
  setForm,
}: {
  form: {
    governorate_id: string;
    city_id: string;
    area_id: string;
    lat: string;
    long: string;
  };
  setForm: React.Dispatch<React.SetStateAction<{
    name: string;
    domain: string;
    slug: string;
    status: Tenant['status'];
    plan: string;
    email: string;
    phone: string;
    address: string;
    governorate_id: string;
    city_id: string;
    area_id: string;
    lat: string;
    long: string;
    seed_default_accounts: boolean;
    admin_name: string;
    admin_email: string;
    admin_password: string;
    teachers: TenantInitialUserRow[];
  }>>;
}) {
  const { t } = useLocale();
  const { data: governorates = [] } = useQuery({
    queryKey: ['platform-governorates'],
    queryFn: () => platformApi.listGovernorates(),
  });
  const { data: cities = [] } = useQuery({
    queryKey: ['platform-cities', form.governorate_id],
    queryFn: () => platformApi.listCities(form.governorate_id ? { governorate_id: Number(form.governorate_id) } : undefined),
    enabled: !!form.governorate_id,
  });
  const { data: areas = [] } = useQuery({
    queryKey: ['platform-areas', form.city_id],
    queryFn: () => platformApi.listAreas(form.city_id ? { city_id: Number(form.city_id) } : undefined),
    enabled: !!form.city_id,
  });

  const handleAreaChange = (areaId: string) => {
    const selected = areas.find(a => String(a.id) === areaId);
    setForm(f => ({
      ...f,
      area_id: areaId,
      lat: selected?.lat != null ? String(selected.lat) : f.lat,
      long: selected?.long != null ? String(selected.long) : f.long,
    }));
  };

  return (
    <>
      <FormField label={t('col.governorate')} id="tenant-governorate">
        <FormSelect
          id="tenant-governorate"
          title={t('col.governorate')}
          value={form.governorate_id}
          onChange={e => setForm(f => ({ ...f, governorate_id: e.target.value, city_id: '', area_id: '' }))}
        >
          <option value="">{t('form.select')}</option>
          {governorates.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </FormSelect>
      </FormField>
      <FormField label={t('col.city')} id="tenant-city">
        <FormSelect
          id="tenant-city"
          title={t('col.city')}
          value={form.city_id}
          onChange={e => setForm(f => ({ ...f, city_id: e.target.value, area_id: '' }))}
          disabled={!form.governorate_id}
        >
          <option value="">{t('form.select')}</option>
          {cities.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </FormSelect>
      </FormField>
      <FormField label={t('col.area')} id="tenant-area">
        <FormSelect
          id="tenant-area"
          title={t('col.area')}
          value={form.area_id}
          onChange={e => handleAreaChange(e.target.value)}
          disabled={!form.city_id}
        >
          <option value="">{t('form.select')}</option>
          {areas.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </FormSelect>
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label={t('col.lat')} id="tenant-lat">
          <FormInput id="tenant-lat" type="number" step="any" value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
        </FormField>
        <FormField label={t('col.long')} id="tenant-long">
          <FormInput id="tenant-long" type="number" step="any" value={form.long} onChange={e => setForm(f => ({ ...f, long: e.target.value }))} />
        </FormField>
      </div>
    </>
  );
}

function TenantForm({
  item,
  onClose,
  onSave,
}: {
  item: Tenant | null;
  onClose: () => void;
  onSave: (payload: TenantCreatePayload) => Promise<void>;
}) {
  const { t, locale } = useLocale();
  const isAr = locale === 'ar';
  const isCreate = !item;

  const { data: fullTenant } = useQuery({
    queryKey: ['platform-tenant-form', item?.id],
    queryFn: () => platformApi.getTenant(item!.id),
    enabled: !!item?.id,
  });

  const [form, setForm] = useState({
    name: item?.name || '',
    domain: item?.domain || '',
    slug: item?.slug || '',
    status: item?.status || 'active',
    plan: item?.plan || 'Starter',
    email: '',
    phone: '',
    address: '',
    governorate_id: '',
    city_id: '',
    area_id: '',
    lat: '',
    long: '',
    seed_default_accounts: true,
    admin_name: '',
    admin_email: '',
    admin_password: 'password',
    teachers: [] as TenantInitialUserRow[],
  });

  useEffect(() => {
    if (!fullTenant) return;
    setForm(f => ({
      ...f,
      name: fullTenant.name || f.name,
      domain: fullTenant.domain || f.domain,
      slug: fullTenant.slug || f.slug,
      status: fullTenant.status || f.status,
      plan: fullTenant.plan || f.plan,
      email: fullTenant.email || '',
      phone: fullTenant.phone || '',
      address: fullTenant.address || '',
      governorate_id: fullTenant.governorate_id ? String(fullTenant.governorate_id) : '',
      city_id: fullTenant.city_id ? String(fullTenant.city_id) : '',
      area_id: fullTenant.area_id ? String(fullTenant.area_id) : '',
      lat: fullTenant.lat != null ? String(fullTenant.lat) : '',
      long: fullTenant.long != null ? String(fullTenant.long) : '',
    }));
  }, [fullTenant]);

  const slugPreview = useMemo(() => {
    const raw = form.slug.trim() || form.name.trim();
    return raw.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'center';
  }, [form.slug, form.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: TenantCreatePayload = {
      name: form.name,
      domain: form.domain,
      slug: form.slug || undefined,
      status: form.status as Tenant['status'],
      plan: form.plan,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      governorate_id: form.governorate_id ? Number(form.governorate_id) : null,
      city_id: form.city_id ? Number(form.city_id) : null,
      area_id: form.area_id ? Number(form.area_id) : null,
      lat: form.lat.trim() ? Number(form.lat) : null,
      long: form.long.trim() ? Number(form.long) : null,
    };

    if (isCreate) {
      payload.seed_default_accounts = form.seed_default_accounts;
      payload.initial_users = {};

      if (form.admin_email.trim()) {
        payload.initial_users.admin = {
          name: form.admin_name.trim() || 'Center Admin',
          email: form.admin_email.trim(),
          password: form.admin_password || 'password',
        };
      }

      if (form.teachers.length > 0) {
        payload.initial_users.teachers = form.teachers.filter(row => row.email.trim());
      }
    }

    if (item?.id) {
      payload.id = item.id;
    }

    await onSave(payload);
    onClose();
  };

  const addTeacher = () => setForm(f => ({ ...f, teachers: [...f.teachers, emptyTeacher()] }));
  const updateTeacher = (index: number, patch: Partial<TenantInitialUserRow>) => {
    setForm(f => ({
      ...f,
      teachers: f.teachers.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    }));
  };
  const removeTeacher = (index: number) => {
    setForm(f => ({ ...f, teachers: f.teachers.filter((_, i) => i !== index) }));
  };

  return (
    <FormDialog
      open
      title={item ? t('crud.edit') : t('crud.addNew')}
      description={isCreate ? t('platform.tenant.createHint') : undefined}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <FormField label={t('col.name')} id="tenant-name" required>
        <FormInput
          id="tenant-name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          maxLength={100}
        />
      </FormField>
      <FormField label={t('col.domain')} id="tenant-domain" required>
        <FormInput
          id="tenant-domain"
          value={form.domain}
          onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
          required
          maxLength={100}
        />
      </FormField>
      <FormField label={t('auth.tenantCode')} id="tenant-slug">
        <FormInput
          id="tenant-slug"
          value={form.slug}
          onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
          maxLength={100}
          placeholder={slugPreview}
        />
      </FormField>
      <FormField label={t('col.plan')} id="tenant-plan">
        <FormSelect id="tenant-plan" title={t('col.plan')} value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))}>
          <option value="Starter">Starter</option>
          <option value="Pro">Pro</option>
          <option value="Business">Business</option>
          <option value="Enterprise">Enterprise</option>
        </FormSelect>
      </FormField>
      <FormField label={t('col.status')} id="tenant-status">
        <FormSelect id="tenant-status" title={t('col.status')} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Tenant['status'] }))}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </FormSelect>
      </FormField>

      <div className="space-y-3 rounded-lg border border-border p-4">
        <p className="text-sm font-semibold">{t('col.address')}</p>
        <FormField label={t('col.email')} id="tenant-email">
          <FormInput id="tenant-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </FormField>
        <FormField label={t('col.phone')} id="tenant-phone">
          <FormInput id="tenant-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </FormField>
        <FormField label={t('col.address')} id="tenant-address">
          <FormInput id="tenant-address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
        </FormField>
        <TenantLocationFields form={form} setForm={setForm} />
      </div>

      {isCreate && (
        <>
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
            <label className="flex items-start gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.seed_default_accounts}
                onChange={e => setForm(f => ({ ...f, seed_default_accounts: e.target.checked }))}
              />
              <span>{t('platform.tenant.seedDefaults')}</span>
            </label>
            {form.seed_default_accounts && (
              <ul className="text-xs text-muted-foreground space-y-1 ps-6 list-disc">
                {(['admin', 'teacher'] as const).map(role => (
                  <li key={role}>
                    {t(`role.${role}`)}: {defaultEmailPreview(slugPreview, role)} / password
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
            <p className="text-sm font-semibold">{t('platform.tenant.customAdmin')}</p>
            <FormField label={t('col.name')} id="admin-name">
              <FormInput
                id="admin-name"
                value={form.admin_name}
                onChange={e => setForm(f => ({ ...f, admin_name: e.target.value }))}
                placeholder={isAr ? 'مدير المركز' : 'Center Admin'}
              />
            </FormField>
            <FormField label={t('auth.email')} id="admin-email">
              <FormInput
                id="admin-email"
                type="email"
                value={form.admin_email}
                onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))}
                placeholder={defaultEmailPreview(slugPreview, 'admin')}
              />
            </FormField>
            <FormField label={t('auth.password')} id="admin-password">
              <FormInput
                id="admin-password"
                type="password"
                value={form.admin_password}
                onChange={e => setForm(f => ({ ...f, admin_password: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{t('platform.tenant.additionalTeachers')}</p>
              <Button type="button" variant="outline" size="sm" onClick={addTeacher}>
                <Plus className="h-4 w-4 me-1" />
                {t('platform.tenant.addTeacher')}
              </Button>
            </div>
            {form.teachers.map((teacher, index) => (
              <div key={index} className="rounded-lg border border-border p-3 space-y-2 relative">
                <button
                  type="button"
                  className="absolute top-2 end-2 text-muted-foreground hover:text-destructive"
                  onClick={() => removeTeacher(index)}
                  aria-label={t('crud.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <FormField label={t('col.name')} id={`teacher-name-${index}`}>
                  <FormInput
                    id={`teacher-name-${index}`}
                    value={teacher.name}
                    onChange={e => updateTeacher(index, { name: e.target.value })}
                    required
                  />
                </FormField>
                <FormField label={t('auth.email')} id={`teacher-email-${index}`}>
                  <FormInput
                    id={`teacher-email-${index}`}
                    type="email"
                    value={teacher.email}
                    onChange={e => updateTeacher(index, { email: e.target.value })}
                    required
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-2">
                  <FormField label={t('auth.password')} id={`teacher-password-${index}`}>
                    <FormInput
                      id={`teacher-password-${index}`}
                      type="password"
                      value={teacher.password || ''}
                      onChange={e => updateTeacher(index, { password: e.target.value })}
                    />
                  </FormField>
                  <FormField label={t('col.subject')} id={`teacher-subject-${index}`}>
                    <FormInput
                      id={`teacher-subject-${index}`}
                      value={teacher.subject || ''}
                      onChange={e => updateTeacher(index, { subject: e.target.value })}
                    />
                  </FormField>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </FormDialog>
  );
}

export default function PlatformTenants() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [viewId, setViewId] = useState<number | string | null>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ['platform-tenants'],
    queryFn: () => platformApi.listTenants(),
  });

  const { data: viewItem, isLoading: viewLoading } = useQuery({
    queryKey: ['platform-tenant', viewId],
    queryFn: () => platformApi.getTenant(viewId!),
    enabled: viewId != null,
  });

  const columns: CrudColumn<Tenant>[] = [
    { key: 'id', label: t('col.id') },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'domain', label: t('col.domain') },
    { key: 'plan', label: t('col.plan') },
    { key: 'users_count', label: t('nav.users'), sortable: true },
    { key: 'teachers_count', label: t('nav.teachers'), sortable: true },
    { key: 'students_count', label: t('nav.students'), sortable: true },
    { key: 'parents_count', label: t('nav.parents'), sortable: true },
    { key: 'status', label: t('col.status'), render: r => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: t('col.date'), sortable: true },
  ];

  const handleSave = async (payload: TenantCreatePayload) => {
    const result = await platformApi.saveTenant(payload);
    await queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });

    if (result.default_accounts?.length) {
      const summary = result.default_accounts
        .map(a => `${a.role}: ${a.email}`)
        .join('\n');
      toast({
        title: t('platform.tenant.accountsCreated'),
        description: summary,
      });
    } else {
      toast({ title: t('crud.save') });
    }
  };

  const handleDelete = async (item: Tenant) => {
    await platformApi.deleteTenant(item.id);
    await queryClient.invalidateQueries({ queryKey: ['platform-tenants'] });
  };

  const detailRows: Array<{ label: string; value: React.ReactNode }> = viewItem
    ? [
        { label: t('col.id'), value: viewItem.id },
        { label: t('col.name'), value: viewItem.name },
        { label: t('auth.tenantCode'), value: viewItem.slug || '—' },
        { label: t('col.domain'), value: viewItem.domain || '—' },
        { label: t('col.email'), value: viewItem.email || '—' },
        { label: t('col.phone'), value: viewItem.phone || '—' },
        { label: t('col.governorate'), value: viewItem.governorate_name || '—' },
        { label: t('col.city'), value: viewItem.city_name || '—' },
        { label: t('col.area'), value: viewItem.area_name || '—' },
        { label: t('col.lat'), value: viewItem.lat != null ? String(viewItem.lat) : '—' },
        { label: t('col.long'), value: viewItem.long != null ? String(viewItem.long) : '—' },
        { label: t('col.address'), value: viewItem.address || '—' },
        { label: t('col.plan'), value: viewItem.plan || '—' },
        { label: t('col.status'), value: <StatusBadge status={viewItem.status} /> },
        {
          label: t('platform.tenant.subscriptionStatus'),
          value: viewItem.subscription?.status || viewItem.subscription_status || '—',
        },
        {
          label: t('platform.tenant.billingCycle'),
          value: viewItem.subscription?.billing_cycle || '—',
        },
        {
          label: t('platform.tenant.subscriptionAmount'),
          value: viewItem.subscription?.amount != null
            ? String(viewItem.subscription.amount)
            : '—',
        },
        {
          label: t('platform.tenant.nextBilling'),
          value: viewItem.subscription?.next_billing_date || '—',
        },
        { label: t('nav.users'), value: viewItem.users_count ?? 0 },
        { label: t('nav.teachers'), value: viewItem.teachers_count ?? 0 },
        { label: t('nav.students'), value: viewItem.students_count ?? 0 },
        { label: t('nav.parents'), value: viewItem.parents_count ?? 0 },
        { label: t('col.date'), value: viewItem.created_at || '—' },
        { label: t('platform.tenant.updatedAt'), value: viewItem.updated_at || '—' },
      ]
    : [];

  return (
    <>
      <CrudPage<Tenant>
        title={t('nav.tenants')}
        description={t('page.tenants.desc')}
        columns={columns}
        data={data}
        loading={isLoading}
        searchKeys={['name', 'domain']}
        renderForm={(item, onClose) => <TenantForm item={item} onClose={onClose} onSave={handleSave} />}
        onDelete={handleDelete}
        renderExtraActions={item => (
          <button
            type="button"
            onClick={() => setViewId(item.id)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t('crud.show')}
            title={t('crud.show')}
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
      />
      <Dialog open={viewId != null} onOpenChange={open => !open && setViewId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {viewItem?.name || t('platform.tenant.details')}
            </DialogTitle>
          </DialogHeader>
          {viewLoading || !viewItem ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : (
            <dl className="grid gap-3 text-sm">
              {detailRows.map(row => (
                <div key={row.label} className="grid grid-cols-[9rem_1fr] gap-2 border-b border-border/60 pb-2 last:border-0">
                  <dt className="font-medium text-muted-foreground">{row.label}</dt>
                  <dd className="min-w-0 break-words">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

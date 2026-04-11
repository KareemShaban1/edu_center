import React, { useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import StatusBadge from '@/components/StatusBadge';
import type { Teacher } from '@/types/models';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { Paperclip } from 'lucide-react';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminTeachersApi, type TeacherSavePayload } from '@/services/endpoints/admin-teachers';

function TeacherForm({
  item,
  onClose,
  onSave,
  saving,
  classes,
}: {
  item: Teacher | null;
  onClose: () => void;
  onSave: (payload: TeacherSavePayload, id?: number) => Promise<void>;
  saving: boolean;
  classes: Array<{ id: number; name: string; grade_id: number }>;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    name: item?.name || '',
    email: item?.email || '',
    password: '',
    specialization: item?.specialization || '',
    phone: item?.phone || '',
    gender: item?.gender || 'male',
    status: item?.status || 'active' as const,
    class_ids: item?.class_ids || [] as number[],
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleClassToggle = (classId: number) => {
    setForm(f => ({
      ...f,
      class_ids: f.class_ids.includes(classId)
        ? f.class_ids.filter(id => id !== classId)
        : [...f.class_ids, classId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast({ title: 'Validation error', description: 'Please fill name, email, and phone.', variant: 'destructive' });
      return;
    }
    if (!item && !form.password.trim()) {
      toast({ title: 'Validation error', description: 'Password is required for new teacher.', variant: 'destructive' });
      return;
    }

    try {
      await onSave(
        {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password || undefined,
          specialization: form.specialization || undefined,
          phone: form.phone.trim(),
          gender: form.gender,
          status: form.status,
          class_ids: form.class_ids,
        },
        item?.id,
      );
      toast({ title: item ? t('crud.edit') : t('crud.addNew'), description: form.name });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save teacher';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <FormDialog
      open
      title={item ? `${t('crud.edit')} ${t('nav.teachers')}` : `${t('crud.addNew')} ${t('nav.teachers')}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={saving}
    >
      <FormField label={t('col.name')} id="teacher-name" required>
        <FormInput id="teacher-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={100} />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.email')} id="teacher-email" required>
          <FormInput id="teacher-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required maxLength={255} />
        </FormField>
        <FormField label={t('col.password')} id="teacher-password">
          <FormInput id="teacher-password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={item ? '••••••••' : ''} maxLength={100} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.gender')} id="teacher-gender">
          <FormSelect title={t('col.gender')} id="teacher-gender" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </FormSelect>
        </FormField>
        <FormField label={t('col.subject')} id="teacher-spec">
          <FormInput id="teacher-spec" value={form.specialization} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} maxLength={100} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.phone')} id="teacher-phone">
          <FormInput id="teacher-phone" type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} maxLength={20} />
        </FormField>
        <FormField label={t('col.status')} id="teacher-status">
          <FormSelect
            title={t('col.status')}
            id="teacher-status"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
          >
            <option value="active">{t('status.active')}</option>
            <option value="inactive">{t('status.inactive')}</option>
          </FormSelect>
        </FormField>
      </div>

      <FormField label={t('form.assignedClasses')} id="teacher-classes">
        <div className="flex flex-wrap gap-3 rounded-lg border border-input bg-background p-3">
          {classes.map(cls => (
            <label key={cls.id} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.class_ids.includes(cls.id)}
                onChange={() => handleClassToggle(cls.id)}
                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
              />
              <span className="text-sm">{cls.name} (Grade {cls.grade_id})</span>
            </label>
          ))}
        </div>
      </FormField>

      <FormField label={t('col.attachments')} id="teacher-attachments">
        <div className="flex items-center gap-3">
          <label
            htmlFor="teacher-attachments"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input bg-background px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <Paperclip className="h-4 w-4" />
            {t('form.addAttachments')}
          </label>
          <input
            id="teacher-attachments"
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
            onChange={e => setAttachments(Array.from(e.target.files || []))}
          />
          {attachments.length > 0 && (
            <span className="text-sm text-muted-foreground">
              {attachments.length} {t('form.filesSelected')}
            </span>
          )}
        </div>
        {attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {attachments.map((file, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                <Paperclip className="h-3 w-3" />
                {file.name}
                <button type="button" className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => setAttachments(a => a.filter((_, idx) => idx !== i))}>×</button>
              </span>
            ))}
          </div>
        )}
      </FormField>
    </FormDialog>
  );
}

export default function AdminTeachers() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();
  const teachers = (bootstrap?.teachers || []) as Teacher[];
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: TeacherSavePayload; id?: number }) => (
      id ? adminTeachersApi.update(id, payload) : adminTeachersApi.create(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const columns: CrudColumn<Teacher>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'email', label: t('col.email') },
    { key: 'gender', label: t('col.gender'), render: tc => <span className="capitalize">{tc.gender || '—'}</span> },
    { key: 'status', label: t('col.status'), render: tc => <StatusBadge status={tc.status || 'active'} /> },
    { key: 'specialization', label: t('col.subject'), sortable: true },
    { key: 'class_ids', label: t('form.assignedClasses'), render: tc => {
      if (!tc.class_ids?.length) return '—';
      return tc.class_ids.map(id => {
        const cls = classes.find(c => c.id === id);
        return cls?.name || id;
      }).join(', ');
    }},
  ];

  return (
    <CrudPage<Teacher>
      title={t('nav.teachers')}
      description={t('page.teachers.desc')}
      columns={columns}
      data={teachers}
      searchKeys={['name', 'email', 'specialization']}
      renderForm={(item, onClose) => (
        <TeacherForm
          item={item}
          onClose={onClose}
          onSave={async (payload, id) => {
            await saveMutation.mutateAsync({ payload, id });
          }}
          saving={saveMutation.isPending}
          classes={classes}
        />
      )}
      onDelete={item => console.log('delete', item.id)}
    />
  );
}

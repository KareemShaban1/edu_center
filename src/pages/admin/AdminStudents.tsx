import React, { useMemo, useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import type { Student } from '@/types/models';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import StatusBadge from '@/components/StatusBadge';
import { Paperclip } from 'lucide-react';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { adminStudentsApi, type StudentSavePayload } from '@/services/endpoints/admin-students';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function StudentForm({
  item,
  onClose,
  onSave,
  saving,
  parents,
  grades,
  classes,
  sections,
}: {
  item: Student | null;
  onClose: () => void;
  onSave: (payload: StudentSavePayload, id?: number) => Promise<void>;
  saving: boolean;
  parents: Array<{ id: number; name: string }>;
  grades: Array<{ id: number; name: string }>;
  classes: Array<{ id: number; name: string; grade_id: number }>;
  sections: Array<{ id: number; name: string; class_id: number; grade_id: number; class_name: string; grade_name: string; section_name: string }>;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    name: item?.name || '',
    email: item?.email || '',
    password: '',
    gender: item?.gender || 'male',
    status: item?.status || 'active',
    grade_id: item?.grade_id || 0,
    classroom_id: item?.classroom_id || 0,
    section_id: item?.section_id || 0,
    parent_id: item?.parent_id || 0,
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  const classesByGrade = useMemo(
    () => classes.filter(c => c.grade_id === form.grade_id),
    [classes, form.grade_id],
  );
  const sectionsByClass = useMemo(
    () => sections.filter(s => s.class_id === form.classroom_id),
    [sections, form.classroom_id],
  );

  const handleGradeChange = (gradeId: number) => {
    setForm(f => ({
      ...f,
      grade_id: gradeId,
      classroom_id: 0,
      section_id: 0,
    }));
  };

  const handleClassChange = (classId: number) => {
    setForm(f => ({
      ...f,
      classroom_id: classId,
      section_id: 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.grade_id || !form.classroom_id || !form.section_id || !form.email.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please fill name, email, grade, class, and section.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onSave(
        {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password || undefined,
          gender: form.gender,
          status: form.status,
          grade_id: form.grade_id,
          classroom_id: form.classroom_id,
          section_id: form.section_id,
          parent_id: form.parent_id || null,
        },
        item?.id,
      );
      toast({ title: item ? t('crud.edit') : t('crud.addNew'), description: form.name });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save student';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <FormDialog
      open
      title={item ? `${t('crud.edit')} ${t('nav.students')}` : `${t('crud.addNew')} ${t('nav.students')}`}
      onClose={onClose}
      onSubmit={handleSubmit}
      loading={saving}
    >
      <FormField label={t('col.name')} id="student-name" required>
        <FormInput id="student-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required maxLength={100} />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.email')} id="student-email">
          <FormInput id="student-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} maxLength={255} />
        </FormField>
        <FormField label={t('col.password')} id="student-password">
          <FormInput id="student-password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={item ? '••••••••' : ''} maxLength={100} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.gender')} id="student-gender">
          <FormSelect title={t('col.gender')} id="student-gender" value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </FormSelect>
        </FormField>
        <FormField label={t('col.status')} id="student-status">
          <FormSelect title={t('col.status')} id="student-status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Student['status'] }))}>
            <option value="active">{t('status.active')}</option>
            <option value="inactive">{t('status.inactive')}</option>
            <option value="graduated">{t('status.graduated')}</option>
            <option value="suspended">{t('status.suspended')}</option>
          </FormSelect>
        </FormField>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField label={t('col.grade')} id="student-grade">
          <FormSelect title={t('col.grade')} id="student-grade" value={form.grade_id} onChange={e => handleGradeChange(Number(e.target.value))}>
            <option value={0} disabled>{t('col.grade')}</option>
            {grades.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </FormSelect>
        </FormField>
        <FormField label={t('col.class')} id="student-class">
          <FormSelect
            title={t('col.class')}
            id="student-class"
            value={form.classroom_id}
            disabled={!form.grade_id}
            onChange={e => handleClassChange(Number(e.target.value))}
          >
            <option value={0} disabled>{form.grade_id ? t('col.class') : 'Select grade first'}</option>
            {classesByGrade.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </FormSelect>
        </FormField>
        <FormField label={t('col.section')} id="student-section">
          <FormSelect
            title={t('col.section')}
            id="student-section"
            value={form.section_id}
            disabled={!form.classroom_id}
            onChange={e => setForm(f => ({ ...f, section_id: Number(e.target.value) }))}
          >
            <option value={0} disabled>{form.classroom_id ? t('col.section') : 'Select class first'}</option>
            {sectionsByClass.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </FormSelect>
        </FormField>
      </div>

      <FormField label={t('col.parent')} id="student-parent">
        <FormSelect title={t('col.parent')} id="student-parent" value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: Number(e.target.value) }))}>
          <option value={0}>{t('form.noParent')}</option>
          {parents.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </FormSelect>
      </FormField>

      <FormField label={t('col.attachments')} id="student-attachments">
        <div className="flex items-center gap-3">
          <label
            htmlFor="student-attachments"
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-input bg-background px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
          >
            <Paperclip className="h-4 w-4" />
            {t('form.addAttachments')}
          </label>
          <input
            id="student-attachments"
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

export default function AdminStudents() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();
  const students = (bootstrap?.students || []) as Student[];
  const grades = ((bootstrap?.grades || []) as Array<{ id: number; name: string }>).map(g => ({ id: Number(g.id), name: g.name }));
  const classes = ((bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>).map(c => ({
    id: Number(c.id),
    name: c.name,
    grade_id: Number(c.grade_id),
  }));
  const sections = ((bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number; grade_id: number; class_name: string; grade_name: string; section_name: string }>).map(s => ({
    id: Number(s.id),
    name: s.name,
    class_id: Number(s.class_id),
    grade_id: Number(s.grade_id),
    grade_name: s.grade_name,
    class_name: s.class_name,
    section_name: s.section_name,
  }));
  const parents = ((bootstrap?.parents || []) as Array<{ id: number; name: string }>).map(p => ({ id: Number(p.id), name: p.name }));
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: StudentSavePayload; id?: number }) => (
      id ? adminStudentsApi.update(id, payload) : adminStudentsApi.create(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const columns: CrudColumn<Student>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'email', label: t('col.email') },
    { key: 'gender', label: t('col.gender'), render: s => <span className="capitalize"> {t(`gender.${s.gender}`)}</span> },
    { key: 'status', label: t('col.status'), render: s => <StatusBadge status={s.status} /> },
    { key: 'grade_name', label: t('col.grade'), render: s => `${s.grade_name}` },
    { key: 'class_name', label: t('col.class'), render: s => `${s.class_name}` },
    { key: 'section_name', label: t('col.section'), render: s => `${s.section_name}` },
    { key: 'parent_name', label: t('col.parent'), render: s => {
      const parent = parents.find(p => p.id === s.parent_id);
      return parent ? parent.name : '—';
    }},
    { key: 'created_at', label: t('col.enrolled'), sortable: true },
  ];

  return (
    <CrudPage<Student>
      title={t('nav.students')}
      description={t('page.students.desc')}
      columns={columns}
      data={students}
      searchKeys={['name', 'email']}
      renderForm={(item, onClose) => (
        <StudentForm
          item={item}
          onClose={onClose}
          onSave={async (payload, id) => {
            await saveMutation.mutateAsync({ payload, id });
          }}
          saving={saveMutation.isPending}
          parents={parents}
          grades={grades}
          classes={classes}
          sections={sections}
        />
      )}
      onDelete={item => console.log('delete', item.id)}
    />
  );
}

import React, { useMemo, useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import StatusBadge from '@/components/StatusBadge';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import StudentFilterField from '@/components/student/StudentFilterField';
import type { Teacher, TeacherSectionAssignment } from '@/types/models';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { Eye, Paperclip } from 'lucide-react';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminTeachersApi, type TeacherSavePayload } from '@/services/endpoints/admin-teachers';
import {
  useAdminScopeFilterState,
} from '@/hooks/use-admin-scope-filters';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type TeacherRow = Teacher & { section_labels?: string };

function formatSectionLabel(section: TeacherSectionAssignment): string {
  return [section.grade_name, section.class_name, section.name].filter(Boolean).join(' — ');
}

function matchTeacherScope(
  teacher: TeacherRow,
  filters: { gradeFilter: string; classFilter: string; sectionFilter: string },
): boolean {
  const sections = teacher.sections ?? [];
  const hasScopeFilter = Boolean(filters.gradeFilter || filters.classFilter || filters.sectionFilter);

  if (!hasScopeFilter) {
    return true;
  }

  if (sections.length === 0) {
    return false;
  }

  return sections.some(section => {
    if (filters.sectionFilter && section.id !== Number(filters.sectionFilter)) {
      return false;
    }
    if (filters.classFilter && section.class_id !== Number(filters.classFilter)) {
      return false;
    }
    if (filters.gradeFilter && section.grade_id !== Number(filters.gradeFilter)) {
      return false;
    }
    return true;
  });
}

function TeacherShowDialog({
  teacher,
  classes,
  grades,
  onClose,
}: {
  teacher: TeacherRow;
  classes: Array<{ id: number; name: string; grade_id: number }>;
  grades: Array<{ id: number; name: string }>;
  onClose: () => void;
}) {
  const { t } = useLocale();
  const sections = teacher.sections ?? [];
  const assignedClasses = (teacher.class_ids ?? [])
    .map(classId => {
      const cls = classes.find(c => c.id === classId);
      if (!cls) return null;
      const gradeName = grades.find(g => g.id === cls.grade_id)?.name;
      return [gradeName, cls.name].filter(Boolean).join(' — ');
    })
    .filter(Boolean) as string[];

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{teacher.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <p><span className="font-medium text-muted-foreground">{t('col.id')}:</span> {teacher.id}</p>
            <p>
              <span className="font-medium text-muted-foreground">{t('col.status')}:</span>{' '}
              <StatusBadge status={teacher.status || 'active'} label={t(`status.${teacher.status || 'active'}`)} />
            </p>
            <p className="sm:col-span-2"><span className="font-medium text-muted-foreground">{t('col.name')}:</span> {teacher.name}</p>
            <p className="sm:col-span-2"><span className="font-medium text-muted-foreground">{t('col.email')}:</span> {teacher.email || '—'}</p>
            <p><span className="font-medium text-muted-foreground">{t('col.phone')}:</span> {teacher.phone || '—'}</p>
            <p><span className="font-medium text-muted-foreground">{t('col.gender')}:</span> {teacher.gender ? t(`gender.${teacher.gender}`) : '—'}</p>
            <p className="sm:col-span-2"><span className="font-medium text-muted-foreground">{t('col.subject')}:</span> {teacher.specialization || '—'}</p>
            {teacher.address ? (
              <p className="sm:col-span-2"><span className="font-medium text-muted-foreground">{t('col.address')}:</span> {teacher.address}</p>
            ) : null}
          </div>

          <div className="border-t pt-3">
            <p className="mb-2 font-medium">{t('form.assignedClasses')}</p>
            {assignedClasses.length > 0 ? (
              <ul className="space-y-1">
                {assignedClasses.map((label, index) => (
                  <li key={index} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
                    {label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{t('misc.noDataAvailable')}</p>
            )}
          </div>

          <div className="border-t pt-3">
            <p className="mb-2 font-medium">{t('col.section')}</p>
            {sections.length > 0 ? (
              <ul className="space-y-2">
                {sections.map(section => (
                  <li key={section.id} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <p className="font-medium">{formatSectionLabel(section)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{t('misc.noDataAvailable')}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TeacherForm({
  item,
  onClose,
  onSave,
  saving,
  classes,
  grades,
}: {
  item: Teacher | null;
  onClose: () => void;
  onSave: (payload: TeacherSavePayload, id?: number) => Promise<void>;
  saving: boolean;
  classes: Array<{ id: number; name: string; grade_id: number }>;
  grades: Array<{ id: number; name: string }>;
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
            <option value="male">{t('gender.male')}</option>
            <option value="female">{t('gender.female')}</option>
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
          {classes.map(cls => {
            const gradeName = grades.find(g => g.id === cls.grade_id)?.name;
            return (
              <label key={cls.id} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.class_ids.includes(cls.id)}
                  onChange={() => handleClassToggle(cls.id)}
                  className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                />
                <span className="text-sm">
                  {[gradeName, cls.name].filter(Boolean).join(' — ')}
                </span>
              </label>
            );
          })}
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
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number; grade_id?: number }>;
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [showItem, setShowItem] = useState<TeacherRow | null>(null);

  const teachers = useMemo(() => {
    return ((bootstrap?.teachers || []) as Teacher[]).map(teacher => ({
      ...teacher,
      section_labels: (teacher.sections ?? []).map(formatSectionLabel).join(' '),
    })) as TeacherRow[];
  }, [bootstrap?.teachers]);

  const {
    gradeFilter,
    classFilter,
    sectionFilter,
    grades: gradeOptions,
    classesByGrade,
    sectionsByClass,
    appliedCount: scopeAppliedCount,
    clearFilters: clearScopeFilters,
    handleGradeChange,
    handleClassChange,
    setSectionFilter,
  } = useAdminScopeFilterState(grades, classes, sections);

  const filteredTeachers = useMemo(() => {
    return teachers.filter(teacher => {
      if (!matchTeacherScope(teacher, { gradeFilter, classFilter, sectionFilter })) {
        return false;
      }
      if (statusFilter && (teacher.status || 'active') !== statusFilter) {
        return false;
      }
      if (genderFilter && (teacher.gender || '') !== genderFilter) {
        return false;
      }
      return true;
    });
  }, [teachers, gradeFilter, classFilter, sectionFilter, statusFilter, genderFilter]);

  const appliedCount = scopeAppliedCount + [statusFilter, genderFilter].filter(Boolean).length;
  const clearFilters = () => {
    clearScopeFilters();
    setStatusFilter('');
    setGenderFilter('');
  };

  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: TeacherSavePayload; id?: number }) => (
      id ? adminTeachersApi.update(id, payload) : adminTeachersApi.create(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const columns: CrudColumn<TeacherRow>[] = [
    { key: 'id', label: t('col.id'), sortable: true, hideOnMobile: true },
    { key: 'name', label: t('col.name'), sortable: true, primary: true },
    { key: 'email', label: t('col.email') },
    { key: 'phone', label: t('col.phone'), hideOnMobile: true },
    { key: 'gender', label: t('col.gender'), render: tc => <span className="capitalize">{t(`gender.${tc.gender}`)}</span> },
    { key: 'status', label: t('col.status'), render: tc => <StatusBadge status={tc.status || 'active'} label={t(`status.${tc.status}`)} /> },
    { key: 'specialization', label: t('col.subject'), sortable: true },
  ];

  return (
    <>
    <CrudPage<TeacherRow>
      title={t('nav.teachers')}
      description={t('page.teachers.desc')}
      columns={columns}
      data={filteredTeachers}
      searchKeys={['name', 'email', 'phone', 'specialization', 'section_labels']}
      topContent={(
        <AdminScopeFilterBar
          grades={gradeOptions}
          classesByGrade={classesByGrade}
          sectionsByClass={sectionsByClass}
          gradeFilter={gradeFilter}
          classFilter={classFilter}
          sectionFilter={sectionFilter}
          onGradeChange={handleGradeChange}
          onClassChange={handleClassChange}
          onSectionChange={setSectionFilter}
          appliedCount={appliedCount}
          onClear={clearFilters}
          resultCount={filteredTeachers.length}
          extraFilters={(
            <>
              <StudentFilterField id="teacher-status-filter" label={t('col.status')}>
                <FormSelect
                  id="teacher-status-filter"
                  title={t('col.status')}
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="">{t('filter.all')}</option>
                  <option value="active">{t('status.active')}</option>
                  <option value="inactive">{t('status.inactive')}</option>
                </FormSelect>
              </StudentFilterField>
              <StudentFilterField id="teacher-gender-filter" label={t('col.gender')}>
                <FormSelect
                  id="teacher-gender-filter"
                  title={t('col.gender')}
                  value={genderFilter}
                  onChange={e => setGenderFilter(e.target.value)}
                >
                  <option value="">{t('filter.all')}</option>
                  <option value="male">{t('gender.male')}</option>
                  <option value="female">{t('gender.female')}</option>
                </FormSelect>
              </StudentFilterField>
            </>
          )}
        />
      )}
      renderForm={(item, onClose) => (
        <TeacherForm
          item={item}
          onClose={onClose}
          onSave={async (payload, id) => {
            await saveMutation.mutateAsync({ payload, id });
          }}
          saving={saveMutation.isPending}
          classes={classes}
          grades={grades}
        />
      )}
      onDelete={item => console.log('delete', item.id)}
      renderExtraActions={teacher => (
        <button
          type="button"
          onClick={() => setShowItem(teacher)}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t('crud.show')}
          title={t('crud.show')}
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
    />

    {showItem && (
      <TeacherShowDialog
        teacher={showItem}
        classes={classes}
        grades={grades}
        onClose={() => setShowItem(null)}
      />
    )}
    </>
  );
}

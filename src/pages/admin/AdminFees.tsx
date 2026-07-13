import React, { useMemo, useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import type { Fee } from '@/types/models';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useAdminScopeFilters } from '@/hooks/use-admin-scope-filters';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminFeesApi, type FeePayload } from '@/services/endpoints/admin-fees';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const FEE_MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function FeeForm({
  item,
  onClose,
  onSave,
  saving,
  grades,
  classes,
  sections,
}: {
  item: Fee | null;
  onClose: () => void;
  onSave: (payload: FeePayload, id?: number) => Promise<void>;
  saving: boolean;
  grades: Array<{ id: number; name: string }>;
  classes: Array<{ id: number; name: string; grade_id: number }>;
  sections: Array<{ id: number; name: string; class_id: number }>;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    title: item?.title || '',
    amount: item?.amount || 0,
    grade_id: item?.grade_id || 0,
    classroom_id: item?.classroom_id || 0,
    section_id: item?.section_id || 0,
    description: item?.description || '',
    year: item?.year || String(new Date().getFullYear()),
    month: item?.month || 'january',
    type: item?.type || 'monthly',
  });
  const classesByGrade = useMemo(() => classes.filter(c => c.grade_id === form.grade_id), [classes, form.grade_id]);
  const sectionsByClass = useMemo(() => sections.filter(s => s.class_id === form.classroom_id), [sections, form.classroom_id]);
  const months = FEE_MONTHS;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.grade_id || !form.classroom_id || !form.section_id || !form.month) {
      toast({ title: 'Validation error', description: 'Please fill all required fee fields.', variant: 'destructive' });
      return;
    }
    try {
      await onSave(
        {
          title: form.title.trim(),
          amount: Number(form.amount || 0),
          grade_id: form.grade_id,
          classroom_id: form.classroom_id,
          section_id: form.section_id,
          description: form.description || '',
          year: form.year || '',
          month: form.month,
          type: form.type,
        },
        item?.id,
      );
      toast({ title: t('crud.save') });
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save fee';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <FormDialog open title={item ? `${t('crud.edit')}` : `${t('crud.addNew')}`} onClose={onClose} onSubmit={handleSubmit} loading={saving}>
      <FormField label={t('col.title')} id="fee-title" required>
        <FormInput id="fee-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required maxLength={100} />
      </FormField>
      <div className="grid grid-cols-3 gap-4">
        <FormField label={t('col.amount')} id="fee-amount" required>
          <FormInput id="fee-amount" type="number" min={0} value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} required />
        </FormField>
        <FormField label={t('col.year')} id="fee-year">
          <FormInput id="fee-year" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
        </FormField>
        <FormField label="Month" id="fee-month">
          <FormSelect title="Month" id="fee-month" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </FormSelect>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.grade')} id="fee-grade" required>
          <FormSelect title={t('col.grade')} id="fee-grade" value={form.grade_id} onChange={e => setForm(f => ({ ...f, grade_id: Number(e.target.value), classroom_id: 0, section_id: 0 }))}>
            <option value={0}>Select grade</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </FormSelect>
        </FormField>
        <FormField label={t('col.class')} id="fee-class" required>
          <FormSelect title={t('col.class')} id="fee-class" value={form.classroom_id} disabled={!form.grade_id} onChange={e => setForm(f => ({ ...f, classroom_id: Number(e.target.value), section_id: 0 }))}>
            <option value={0}>{form.grade_id ? 'Select class' : 'Select grade first'}</option>
            {classesByGrade.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FormSelect>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.section')} id="fee-section" required>
          <FormSelect title={t('col.section')} id="fee-section" value={form.section_id} disabled={!form.classroom_id} onChange={e => setForm(f => ({ ...f, section_id: Number(e.target.value) }))}>
            <option value={0}>{form.classroom_id ? 'Select section' : 'Select class first'}</option>
            {sectionsByClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FormSelect>
        </FormField>
        <FormField label={t('col.type')} id="fee-type">
          <FormSelect id="fee-type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="monthly">monthly</option>
            <option value="half-monthly">half-monthly</option>
            <option value="book">book</option>
            <option value="other">other</option>
          </FormSelect>
        </FormField>
      </div>
      <FormField label={t('col.description')} id="fee-description">
        <FormInput id="fee-description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </FormField>
    </FormDialog>
  );
}

export default function AdminFees() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();
  const fees = (bootstrap?.fees || []) as Fee[];
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;
  const [viewItem, setViewItem] = useState<Fee | null>(null);
  const [monthFilter, setMonthFilter] = useState('');
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: FeePayload; id?: number }) => (
      id ? adminFeesApi.update(id, payload) : adminFeesApi.create(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminFeesApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const {
    gradeFilter,
    classFilter,
    sectionFilter,
    setSectionFilter,
    grades: gradeOptions,
    classesByGrade,
    sectionsByClass,
    filteredRows: scopeFilteredRows,
    appliedCount: scopeAppliedCount,
    clearFilters: clearScopeFilters,
    handleGradeChange,
    handleClassChange,
  } = useAdminScopeFilters(grades, classes, sections, fees);

  const filteredRows = useMemo(() => {
    if (!monthFilter) return scopeFilteredRows;
    return scopeFilteredRows.filter(f => f.month === monthFilter);
  }, [scopeFilteredRows, monthFilter]);

  const appliedCount = scopeAppliedCount + (monthFilter ? 1 : 0);
  const clearFilters = () => {
    clearScopeFilters();
    setMonthFilter('');
  };

  const columns: CrudColumn<Fee>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'title', label: t('col.title'), sortable: true },
    {
      key: 'scope',
      label: `${t('col.grade')} · ${t('col.class')} · ${t('col.section')}`,
      render: f => {
        const parts = [
          grades.find(g => g.id === f.grade_id)?.name,
          classes.find(c => c.id === f.classroom_id)?.name,
          sections.find(s => s.id === f.section_id)?.name,
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(' · ') : '—';
      },
    },
    { key: 'amount', label: t('col.amount'), render: f => `${f.amount.toLocaleString()}` },
    { key: 'type', label: t('col.type'), render: f => <span className="capitalize">{f.type}</span> },
    { key: 'year', label: t('col.year'), sortable: true },
    { key: 'month', label: t('col.month'), sortable: true },
    { key: 'show', label: t('crud.show'), render: f => <button title={t('crud.show')} onClick={() => setViewItem(f)} className="text-primary hover:underline">{t('attendance.view')}</button> },
  ];
  return (
    <>
      <CrudPage<Fee>
        title={t('nav.fees')}
        description={t('page.fees.desc')}
        columns={columns}
        data={filteredRows}
        searchKeys={['title', 'type', 'month']}
        topContent={(
          <AdminScopeFilterBar
            grades={gradeOptions}
            classesByGrade={classesByGrade}
            sectionsByClass={sectionsByClass}
            gradeFilter={gradeFilter}
            classFilter={classFilter}
            sectionFilter={sectionFilter}
            monthFilter={monthFilter}
            showMonth
            monthOptions={FEE_MONTHS}
            onMonthChange={setMonthFilter}
            onGradeChange={handleGradeChange}
            onClassChange={handleClassChange}
            onSectionChange={setSectionFilter}
            appliedCount={appliedCount}
            onClear={clearFilters}
            resultCount={filteredRows.length}
          />
        )}
        renderForm={(item, onClose) => (
          <FeeForm
            item={item}
            onClose={onClose}
            onSave={async (payload, id) => {
              await saveMutation.mutateAsync({ payload, id });
            }}
            saving={saveMutation.isPending}
            grades={grades}
            classes={classes}
            sections={sections}
          />
        )}
        onDelete={item => {
          void deleteMutation.mutateAsync(item.id as number);
        }}
      />
      {viewItem && (
        <Dialog open onOpenChange={v => !v && setViewItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{viewItem.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p><strong>{t('col.amount')}:</strong> {viewItem.amount}</p>
              <p><strong>{t('col.grade')}:</strong> {grades.find(g => g.id === viewItem.grade_id)?.name ?? '—'}</p>
              <p><strong>{t('col.class')}:</strong> {classes.find(c => c.id === viewItem.classroom_id)?.name ?? '—'}</p>
              <p><strong>{t('col.section')}:</strong> {sections.find(s => s.id === viewItem.section_id)?.name ?? '—'}</p>
              <p><strong>{t('col.type')}:</strong> {viewItem.type}</p>
              <p><strong>{t('col.year')}:</strong> {viewItem.year || '—'}</p>
              <p><strong> {t('col.month')}:</strong> {viewItem.month || '—'}</p>
              <p><strong>{t('col.description')}:</strong> {viewItem.description || '—'}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

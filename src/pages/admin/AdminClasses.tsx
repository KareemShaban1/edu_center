import { useEffect, useMemo, useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormSelect } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import type { ClassRoom } from '@/types/models';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAcademicsApi } from '@/services/endpoints/admin-academics';
import { toast } from '@/hooks/use-toast';

export default function AdminClasses() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const [data, setData] = useState<ClassRoom[]>([]);
  const [gradeFilter, setGradeFilter] = useState('');
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: Pick<ClassRoom, 'name' | 'grade_id' | 'notes'>; id?: number }) => (
      id ? adminAcademicsApi.updateClass(id, payload) : adminAcademicsApi.createClass(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  useEffect(() => {
    setData((bootstrap?.classes || []) as ClassRoom[]);
  }, [bootstrap]);

  const filteredData = useMemo(() => {
    if (!gradeFilter) return data;
    const gradeId = Number(gradeFilter);
    return data.filter(c => c.grade_id === gradeId);
  }, [data, gradeFilter]);

  const columns: CrudColumn<ClassRoom>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'name', label: t('col.name'), sortable: true },
    {
      key: 'grade_id', label: t('col.grade'), sortable: true,
      render: (c) => grades.find(g => g.id === c.grade_id)?.name ?? '—',
    },
    { key: 'notes', label: t('col.notes'), render: (c) => c.notes || '—' },
  ];

  return (
    <CrudPage
      title={t('nav.classes')}
      description={t('page.classesAdmin.desc')}
      topContent={(
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="w-full sm:max-w-xs">
            <label htmlFor="classes-grade-filter" className="mb-1.5 block text-sm font-medium">
              {t('col.grade')}
            </label>
            <FormSelect
              id="classes-grade-filter"
              title={t('col.grade')}
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
            >
              <option value="">{t('filter.all')}</option>
              {grades.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </FormSelect>
          </div>
        </div>
      )}
      columns={columns}
      data={filteredData}
      searchKeys={['name']}
      onDelete={(item) => setData(prev => prev.filter(i => i.id !== item.id))}
      renderForm={(item, onClose) => (
        <ClassForm
          item={item}
          grades={grades}
          onClose={onClose}
          onSave={async (cls) => {
            try {
              await saveMutation.mutateAsync({
                payload: { name: cls.name, grade_id: cls.grade_id, notes: cls.notes },
                id: item?.id,
              });
              onClose();
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to save class';
              toast({ title: 'Save failed', description: message, variant: 'destructive' });
            }
          }}
          saving={saveMutation.isPending}
        />
      )}
    />
  );
}

function ClassForm({
  item,
  grades,
  onClose,
  onSave,
  saving,
}: {
  item: ClassRoom | null;
  grades: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSave: (c: ClassRoom) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(item?.name ?? '');
  const [gradeId, setGradeId] = useState(item?.grade_id ?? grades[0]?.id ?? 0);
  const [notes, setNotes] = useState(item?.notes ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !gradeId) return;
    await onSave({ id: item?.id ?? 0, name: name.trim(), grade_id: gradeId, notes });
  };

  return (
    <FormDialog
      open
      onClose={onClose}
      title={item ? `${t('crud.edit')} ${t('nav.classes')}` : `${t('crud.addNew')} ${t('nav.classes')}`}
      onSubmit={handleSubmit}
      loading={saving}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">{t('col.grade')}</label>
          <select
            title={t('col.grade')}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={gradeId}
            onChange={e => setGradeId(Number(e.target.value))}
          >
            {grades.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">{t('col.name')}</label>
          <input
            title={t('col.name')}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t('col.notes')}</label>
          <textarea
            title={t('col.notes')}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>
    </FormDialog>
  );
}

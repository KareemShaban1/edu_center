import { useEffect, useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { useLocale } from '@/contexts/LocaleContext';
import type { Grade } from '@/types/models';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAcademicsApi } from '@/services/endpoints/admin-academics';
import { toast } from '@/hooks/use-toast';

export default function AdminGrades() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();
  const [data, setData] = useState<Grade[]>([]);
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: Pick<Grade, 'name' | 'notes'>; id?: number }) => (
      id ? adminAcademicsApi.updateGrade(id, payload) : adminAcademicsApi.createGrade(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  useEffect(() => {
    setData((bootstrap?.grades || []) as Grade[]);
  }, [bootstrap]);

  const columns: CrudColumn<Grade>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'notes', label: t('col.notes'), render: (g) => g.notes || '—' },
  ];

  return (
    <CrudPage
      title={t('nav.grades')}
      description={t('page.gradesAdmin.desc')}
      columns={columns}
      data={data}
      searchKeys={['name', 'notes']}
      onDelete={(item) => setData(prev => prev.filter(i => i.id !== item.id))}
      renderForm={(item, onClose) => (
        <GradeForm
          item={item}
          onClose={onClose}
          onSave={async (grade) => {
            try {
              await saveMutation.mutateAsync({
                payload: { name: grade.name, notes: grade.notes },
                id: item?.id,
              });
              onClose();
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Failed to save grade';
              toast({ title: 'Save failed', description: message, variant: 'destructive' });
            }
          }}
          saving={saveMutation.isPending}
        />
      )}
    />
  );
}

function GradeForm({ item, onClose, onSave, saving }: { item: Grade | null; onClose: () => void; onSave: (g: Grade) => Promise<void>; saving: boolean }) {
  const { t } = useLocale();
  const [name, setName] = useState(item?.name ?? '');
  const [notes, setNotes] = useState(item?.notes ?? '');
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSave({ id: item?.id ?? 0, name: name.trim(), notes });
  };

  return (
    <FormDialog
      open
      onClose={onClose}
      title={item ? `${t('crud.edit')} ${t('nav.grades')}` : `${t('crud.addNew')} ${t('nav.grades')}`}
      onSubmit={handleSubmit}
      loading={saving}
    >
      <div className="space-y-4">
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

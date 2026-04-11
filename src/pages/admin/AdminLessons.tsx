import { useEffect, useRef, useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { useLocale } from '@/contexts/LocaleContext';
import { X, Upload, FileText, Image } from 'lucide-react';
import type { Lesson, MediaFile } from '@/types/models';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminLearningApi } from '@/services/endpoints/admin-learning';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminLessons() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();
  const units = (bootstrap?.units || []) as Array<{ id: number; name: string }>;
  const [data, setData] = useState<Lesson[]>([]);
  const [viewItem, setViewItem] = useState<Lesson | null>(null);
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: Pick<Lesson, 'name' | 'unit_id' | 'notes'>; id?: number }) => (
      id ? adminLearningApi.updateLesson(id, payload) : adminLearningApi.createLesson(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  useEffect(() => {
    setData((bootstrap?.lessons || []) as Lesson[]);
  }, [bootstrap]);

  const columns: CrudColumn<Lesson>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'name', label: t('col.name'), sortable: true },
    {
      key: 'unit_id', label: t('col.unit'), sortable: true,
      render: (l) => units.find(u => u.id === l.unit_id)?.name ?? '—',
    },
    { key: 'notes', label: t('col.notes'), render: (l) => l.notes || '—' },
    {
      key: 'media' as keyof Lesson, label: t('col.media'),
      render: (l) => <span className="text-muted-foreground">{l.media?.length || 0} files</span>,
    },
    { key: 'show', label: t('crud.show'), render: (l) => <button title={t('crud.show')} onClick={() => setViewItem(l)} className="text-primary hover:underline">{t('attendance.view')}</button> },
  ];

  return (
    <>
      <CrudPage
        title={t('nav.lessons')}
        description={t('page.lessonsAdmin.desc')}
        columns={columns}
        data={data}
        searchKeys={['name']}
        onDelete={(item) => setData(prev => prev.filter(i => i.id !== item.id))}
        renderForm={(item, onClose) => (
          <LessonForm
            item={item}
            units={units}
            onClose={onClose}
            onSave={async (lesson) => {
              try {
                await saveMutation.mutateAsync({ payload: { name: lesson.name, unit_id: lesson.unit_id, notes: lesson.notes }, id: item?.id });
                onClose();
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to save lesson';
                toast({ title: 'Save failed', description: message, variant: 'destructive' });
              }
            }}
            saving={saveMutation.isPending}
          />
        )}
      />
      {viewItem && (
        <Dialog open onOpenChange={v => !v && setViewItem(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{viewItem.name}</DialogTitle></DialogHeader>
            <div className="space-y-2 text-sm">
              <p><strong>{t('col.unit')}:</strong> {units.find(u => u.id === viewItem.unit_id)?.name ?? '—'}</p>
              <p><strong>{t('col.notes')}:</strong> {viewItem.notes || '—'}</p>
              <p><strong>{t('col.media')}:</strong> {viewItem.media?.length || 0}</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function LessonForm({
  item,
  units,
  onClose,
  onSave,
  saving,
}: {
  item: Lesson | null;
  units: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSave: (l: Lesson) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(item?.name ?? '');
  const [unitId, setUnitId] = useState(item?.unit_id ?? units[0]?.id ?? 0);
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [media, setMedia] = useState<MediaFile[]>(item?.media ?? []);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newMedia: MediaFile[] = files.map(f => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      url: URL.createObjectURL(f),
    }));
    setMedia(prev => [...prev, ...newMedia]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeFile = (id: string) => setMedia(prev => prev.filter(f => f.id !== id));

  const formatSize = (bytes: number) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <FormDialog
      open
      onClose={onClose}
      title={item ? `${t('crud.edit')} ${t('nav.lessons')}` : `${t('crud.addNew')} ${t('nav.lessons')}`}
      onSubmit={(e) => { e.preventDefault(); void onSave({ id: item?.id ?? 0, name, unit_id: unitId, notes, media }); }}
      loading={saving}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">{t('col.name')}</label>
          <input
            title={t('col.name')}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={name} onChange={e => setName(e.target.value)} required
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t('col.unit')}</label>
          <select
            title={t('col.unit')}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={unitId} onChange={e => setUnitId(Number(e.target.value))}
          >
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">{t('col.notes')}</label>
          <textarea
            title={t('col.notes')}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            rows={3} value={notes} onChange={e => setNotes(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t('col.media')}</label>
          <input title={t('col.media')} ref={fileRef} type="file" multiple className="hidden" onChange={handleFiles} accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            <Upload className="h-4 w-4" /> {t('col.addFiles')}
          </button>
          {media.length > 0 && (
            <ul className="mt-2 space-y-1.5">
              {media.map(f => (
                <li key={f.id} className="flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
                  {f.type.startsWith('image/') ? <Image className="h-4 w-4 shrink-0 text-primary" /> : <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />}
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-muted-foreground">{formatSize(f.size)}</span>
                  <button title={t('crud.delete')} type="button" onClick={() => removeFile(f.id)} className="text-destructive hover:text-destructive/80">
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </FormDialog>
  );
}

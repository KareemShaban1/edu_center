import { useEffect, useMemo, useRef, useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import FormDialog from '@/components/FormDialog';
import MediaPreviewList, { formatMediaSize } from '@/components/MediaPreviewList';
import { useLocale } from '@/contexts/LocaleContext';
import { Eye, Upload, X } from 'lucide-react';
import type { Unit, MediaFile } from '@/types/models';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useAdminScopeFilters } from '@/hooks/use-admin-scope-filters';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminLearningApi, type UnitSavePayload } from '@/services/endpoints/admin-learning';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminUnits() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;
  const [data, setData] = useState<Unit[]>([]);
  const [viewItem, setViewItem] = useState<Unit | null>(null);
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: UnitSavePayload; id?: number }) => (
      id ? adminLearningApi.updateUnit(id, payload) : adminLearningApi.createUnit(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  useEffect(() => {
    setData((bootstrap?.units || []) as Unit[]);
  }, [bootstrap]);

  const {
    gradeFilter,
    classFilter,
    sectionFilter,
    setSectionFilter,
    grades: gradeOptions,
    classesByGrade,
    sectionsByClass,
    filteredRows,
    appliedCount,
    clearFilters,
    handleGradeChange,
    handleClassChange,
  } = useAdminScopeFilters(grades, classes, sections, data);

  const columns: CrudColumn<Unit>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'name', label: t('col.name'), sortable: true },
    {
      key: 'class_id', label: t('col.class'), sortable: true,
      render: (u) => classes.find(c => c.id === u.class_id)?.name ?? '—',
    },
    { key: 'notes', label: t('col.notes'), render: (u) => u.notes || '—' },
    {
      key: 'media' as keyof Unit, label: t('col.media'),
      render: (u) => <span className="text-muted-foreground">{u.media?.length || 0} files</span>,
    },
    {
      key: 'show',
      label: t('crud.show'),
      render: (u) => (
        <button
          type="button"
          title={t('crud.show')}
          onClick={() => setViewItem(u)}
          className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <>
      <CrudPage
        title={t('nav.units')}
        description={t('page.unitsAdmin.desc')}
        columns={columns}
        data={filteredRows}
        searchKeys={['name']}
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
            resultCount={filteredRows.length}
          />
        )}
        onDelete={(item) => setData(prev => prev.filter(i => i.id !== item.id))}
        renderForm={(item, onClose) => (
          <UnitForm
            item={item}
            classes={classes}
            onClose={onClose}
            onSave={async (payload) => {
              try {
                await saveMutation.mutateAsync({ payload, id: item?.id });
                onClose();
              } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to save unit';
                toast({ title: 'Save failed', description: message, variant: 'destructive' });
              }
            }}
            saving={saveMutation.isPending}
          />
        )}
      />
      {viewItem && (
        <Dialog open onOpenChange={v => !v && setViewItem(null)}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader><DialogTitle>{viewItem.name}</DialogTitle></DialogHeader>
            <div className="space-y-4 text-sm">
              <p><strong>{t('col.class')}:</strong> {classes.find(c => c.id === viewItem.class_id)?.name ?? '—'}</p>
              <p><strong>{t('col.notes')}:</strong> {viewItem.notes || '—'}</p>
              <div>
                <p className="mb-2 font-medium">{t('col.media')}</p>
                <MediaPreviewList media={viewItem.media || []} />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

function UnitForm({
  item,
  classes,
  onClose,
  onSave,
  saving,
}: {
  item: Unit | null;
  classes: Array<{ id: number; name: string }>;
  onClose: () => void;
  onSave: (payload: UnitSavePayload) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(item?.name ?? '');
  const [classId, setClassId] = useState(item?.class_id ?? classes[0]?.id ?? 0);
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [removeMediaIds, setRemoveMediaIds] = useState<number[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const existingMedia = useMemo(
    () => (item?.media || []).filter(m => !removeMediaIds.includes(Number(m.id))),
    [item?.media, removeMediaIds],
  );

  const pendingMedia = useMemo<MediaFile[]>(
    () => files.map((file, index) => ({
      id: `pending-${index}-${file.name}`,
      name: file.name,
      file_name: file.name,
      size: file.size,
      type: file.type,
      mime_type: file.type,
      url: URL.createObjectURL(file),
    })),
    [files],
  );

  const toggleRemoveMedia = (id: number) => {
    setRemoveMediaIds(prev => (prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]));
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...picked]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removePendingFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <FormDialog
      open
      onClose={onClose}
      title={item ? `${t('crud.edit')} ${t('nav.units')}` : `${t('crud.addNew')} ${t('nav.units')}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim() || !classId) return;
        void onSave({
          name: name.trim(),
          class_id: classId,
          notes,
          files,
          remove_media_ids: removeMediaIds,
        });
      }}
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
          <label className="text-sm font-medium">{t('col.class')}</label>
          <select
            title={t('col.class')}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={classId} onChange={e => setClassId(Number(e.target.value))}
          >
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
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

        {item && (item.media?.length || 0) > 0 && (
          <div>
            <label className="mb-2 block text-sm font-medium">{t('col.media')}</label>
            <div className="space-y-2 rounded-lg border border-border p-3">
              {(item.media || []).map(m => {
                const mediaId = Number(m.id);
                const marked = removeMediaIds.includes(mediaId);
                return (
                  <div key={String(m.id)} className={`flex items-center justify-between rounded-md px-2 py-1.5 ${marked ? 'bg-destructive/10' : 'bg-muted/30'}`}>
                    <span className="truncate text-sm">{m.file_name || m.name}</span>
                    <button
                      type="button"
                      title={marked ? 'Undo remove' : t('crud.delete')}
                      onClick={() => toggleRemoveMedia(mediaId)}
                      className={`rounded p-1 ${marked ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm font-medium">{t('col.addFiles')}</label>
          <input
            ref={fileRef}
            title={t('col.media')}
            type="file"
            multiple
            className="hidden"
            onChange={handleFiles}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            <Upload className="h-4 w-4" /> {t('col.addFiles')}
          </button>
        </div>

        {(existingMedia.length > 0 || pendingMedia.length > 0) && (
          <div>
            <label className="mb-2 block text-sm font-medium">{t('crud.view')}</label>
            <MediaPreviewList media={[...existingMedia, ...pendingMedia]} />
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`} className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate">{file.name} · {formatMediaSize(file.size)}</span>
                    <button
                      type="button"
                      title={t('crud.delete')}
                      aria-label={t('crud.delete')}
                      onClick={() => removePendingFile(index)}
                      className="text-destructive hover:text-destructive/80"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </FormDialog>
  );
}

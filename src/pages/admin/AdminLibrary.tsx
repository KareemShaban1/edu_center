import React, { useMemo, useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import { toast } from '@/hooks/use-toast';
import { Download, Eye, FileText, X } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminLibraryApi, type LibraryItemPayload, type LibrarySavePayload } from '@/services/endpoints/admin-library';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function LibraryForm({
  item,
  onClose,
  onSave,
  saving,
  grades,
  classes,
  sections,
}: {
  item: LibraryItemPayload | null;
  onClose: () => void;
  onSave: (payload: LibrarySavePayload, id?: number) => Promise<void>;
  saving: boolean;
  grades: Array<{ id: number; name: string }>;
  classes: Array<{ id: number; name: string; grade_id: number }>;
  sections: Array<{ id: number; name: string; class_id: number }>;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    title: item?.title || '',
    grade_id: item?.grade_id || 0,
    class_id: item?.class_id || 0,
    section_id: item?.section_id || 0,
    type: item?.type || 'textbook',
    notes: item?.notes || '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [removeMediaIds, setRemoveMediaIds] = useState<number[]>([]);
  const classesByGrade = useMemo(() => classes.filter(c => c.grade_id === form.grade_id), [classes, form.grade_id]);
  const sectionsByClass = useMemo(() => sections.filter(s => s.class_id === form.class_id), [sections, form.class_id]);

  const toggleRemoveMedia = (id: number) => {
    setRemoveMediaIds(prev => (prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.grade_id || !form.class_id || !form.section_id) {
      toast({ title: 'Validation error', description: 'Please fill required library fields.', variant: 'destructive' });
      return;
    }
    onSave(
      {
        title: form.title.trim(),
        grade_id: form.grade_id,
        class_id: form.class_id,
        section_id: form.section_id,
        type: form.type as LibrarySavePayload['type'],
        notes: form.notes || '',
        files,
        remove_media_ids: removeMediaIds,
      },
      item?.id,
    )
      .then(() => {
        toast({ title: t('crud.save') });
        onClose();
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Failed to save library item';
        toast({ title: 'Save failed', description: message, variant: 'destructive' });
      });
  };

  return (
    <FormDialog open title={item ? t('crud.edit') : t('crud.addNew')} onClose={onClose} onSubmit={handleSubmit} loading={saving}>
      <FormField label={t('col.title')} id="lib-title" required>
        <FormInput id="lib-title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required maxLength={200} />
      </FormField>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.grade')} id="lib-grade" required>
          <FormSelect id="lib-grade" value={form.grade_id} onChange={e => setForm(f => ({ ...f, grade_id: Number(e.target.value), class_id: 0, section_id: 0 }))}>
            <option value={0}>Select grade</option>
            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </FormSelect>
        </FormField>
        <FormField label={t('col.class')} id="lib-class" required>
          <FormSelect id="lib-class" value={form.class_id} disabled={!form.grade_id} onChange={e => setForm(f => ({ ...f, class_id: Number(e.target.value), section_id: 0 }))}>
            <option value={0}>{form.grade_id ? 'Select class' : 'Select grade first'}</option>
            {classesByGrade.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </FormSelect>
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <FormField label={t('col.section')} id="lib-section" required>
          <FormSelect id="lib-section" value={form.section_id} disabled={!form.class_id} onChange={e => setForm(f => ({ ...f, section_id: Number(e.target.value) }))}>
            <option value={0}>{form.class_id ? 'Select section' : 'Select class first'}</option>
            {sectionsByClass.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </FormSelect>
        </FormField>
        <FormField label={t('col.type')} id="lib-type">
          <FormSelect id="lib-type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            <option value="textbook">Textbook</option>
            <option value="manual">Manual</option>
            <option value="workbook">Workbook</option>
            <option value="reference">Reference</option>
            <option value="resource">Resource</option>
          </FormSelect>
        </FormField>
      </div>
      <FormField label={t('col.notes')} id="lib-notes">
        <FormInput id="lib-notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
      </FormField>

      {item && item.media.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium">Existing Files</label>
          <div className="space-y-2 rounded-lg border border-border p-3 max-h-40 overflow-auto">
            {item.media.map(m => {
              const marked = removeMediaIds.includes(m.id);
              return (
                <div key={m.id} className={`flex items-center justify-between rounded-md px-2 py-1.5 ${marked ? 'bg-destructive/10' : 'bg-muted/30'}`}>
                  <a href={m.url} target="_blank" rel="noreferrer" className="text-sm hover:underline truncate">{m.file_name}</a>
                  <button
                    type="button"
                    title={marked ? 'Undo remove' : 'Remove file'}
                    onClick={() => toggleRemoveMedia(m.id)}
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

      <FormField label="Upload Files (multiple media types)" id="lib-files">
        <input
          id="lib-files"
          title="Library files"
          aria-label="Library files"
          type="file"
          multiple
          onChange={e => setFiles(Array.from(e.target.files || []))}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
        />
        {files.length > 0 && (
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            {files.map((f, idx) => <p key={`${f.name}-${idx}`}>{f.name}</p>)}
          </div>
        )}
      </FormField>
    </FormDialog>
  );
}

export default function AdminLibrary() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;
  const [viewItem, setViewItem] = useState<LibraryItemPayload | null>(null);
  const { data: library = [] } = useQuery({
    queryKey: ['admin-library'],
    queryFn: () => adminLibraryApi.list(),
  });
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: LibrarySavePayload; id?: number }) => (
      id ? adminLibraryApi.update(id, payload) : adminLibraryApi.create(payload)
    ),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-library'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminLibraryApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-library'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-bootstrap'] });
    },
  });

  const columns: CrudColumn<LibraryItemPayload>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'title', label: t('col.title'), sortable: true },
    { key: 'type', label: t('col.type'), render: l => <span className="capitalize">{l.type}</span> },
    { key: 'grade_name', label: t('col.grade') },
    { key: 'class_name', label: t('col.class') },
    { key: 'section_name', label: t('col.section') },
    { key: 'created_at', label: t('col.date'), sortable: true },
    {
      key: 'show',
      label: t('crud.view'),
      render: l => (
        <button title={t('crud.view')} onClick={() => setViewItem(l)} className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground">
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
    {
      key: 'download',
      label: '',
      render: l => (
        <a
          title="Download first file"
          href={l.media[0]?.url || '#'}
          target="_blank"
          rel="noreferrer"
          className={`rounded-lg p-1.5 inline-flex ${l.media.length ? 'hover:bg-muted text-muted-foreground hover:text-foreground' : 'text-muted-foreground/40 pointer-events-none'}`}
        >
          <Download className="h-4 w-4" />
        </a>
      ),
    },
  ];

  return (
    <>
      <CrudPage<LibraryItemPayload>
        title={t('nav.library')}
        description={t('page.library.desc')}
        columns={columns}
        data={library}
        searchKeys={['title', 'type', 'grade_name', 'class_name', 'section_name']}
        renderForm={(item, onClose) => (
          <LibraryForm
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
          void deleteMutation.mutateAsync(item.id);
        }}
      />

      {viewItem && (
        <Dialog open onOpenChange={v => !v && setViewItem(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{viewItem.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p><strong>{t('col.type')}:</strong> {viewItem.type}</p>
              <p><strong>{t('col.grade')}:</strong> {viewItem.grade_name || '—'}</p>
              <p><strong>{t('col.class')}:</strong> {viewItem.class_name || '—'}</p>
              <p><strong>{t('col.section')}:</strong> {viewItem.section_name || '—'}</p>
              <p><strong>{t('col.notes')}:</strong> {viewItem.notes || '—'}</p>
              <p><strong>{t('col.date')}:</strong> {viewItem.created_at}</p>
              <div>
                <strong>Media Files:</strong>
                {viewItem.media.length === 0 ? (
                  <p className="text-muted-foreground mt-1">No files uploaded.</p>
                ) : (
                  <div className="mt-2 space-y-1">
                    {viewItem.media.map(m => (
                      <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                        <FileText className="h-4 w-4" />
                        <span>{m.file_name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

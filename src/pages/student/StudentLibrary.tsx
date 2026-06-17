import { useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import { Download } from 'lucide-react';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import { studentSelfApi, type StudentLibraryPayload } from '@/services/endpoints/student-self';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface LibRow { id: number; title: string; type: string; notes?: string; url?: string | null; }

function LibraryShowDialog({ item, onClose }: { item: LibRow; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('crud.view')} {t('nav.library')}</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <p><strong>{t('col.title')}:</strong> {item.title}</p>
          <p><strong>{t('col.type')}:</strong> {item.type}</p>
          <p><strong>{t('col.notes')}:</strong> {item.notes || '—'}</p>
          <p><strong>URL:</strong> {item.url ? <a className="text-primary underline" href={item.url} target="_blank" rel="noreferrer">Open</a> : '—'}</p>
        </div>
        <div className="flex justify-end"><Button variant="outline" onClick={onClose}>{t('misc.close')}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentLibrary() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data } = useStudentBootstrap();
  const rows = (data?.library || []) as LibRow[];
  const [showItem, setShowItem] = useState<LibRow | null>(null);
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: StudentLibraryPayload; id?: number }) => id ? studentSelfApi.updateLibrary(id, payload) : studentSelfApi.createLibrary(payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentSelfApi.deleteLibrary(id),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] }); },
  });
  const columns: CrudColumn<LibRow>[] = [
    { key: 'title', label: t('col.title'), sortable: true },
    { key: 'type', label: t('col.type') },
    { key: 'notes', label: t('col.notes'), render: l => l.notes || '—' },
    { key: 'download', label: '', render: l => (
      l.url ? <a href={l.url} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground inline-block"><Download className="h-4 w-4" /></a> : '—'
    )},
    { key: '_show', label: t('crud.view'), render: l => <button onClick={() => setShowItem(l)} className="rounded-lg border px-2 py-1 text-xs">{t('crud.view')}</button> },
  ];
  return (
    <>
      <CrudPage<LibRow>
        title={t('nav.library')}
        description={t('page.library.desc')}
        columns={columns}
        data={rows}
        searchKeys={['title', 'type', 'notes']}
        onDelete={item => { void deleteMutation.mutateAsync(item.id); }}
      />
      {showItem && <LibraryShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}

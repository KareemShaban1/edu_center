import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Pencil, Pin, Plus, Search, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DeleteDialog from '@/components/DeleteDialog';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  personalProductivityApi,
  type NoteColor,
  type PersonalNote,
  type PersonalNoteInput,
} from '@/services/endpoints/personal-productivity';

const noteColors: NoteColor[] = ['slate', 'amber', 'green', 'blue', 'purple', 'rose'];
const colorClasses: Record<NoteColor, string> = {
  slate: 'border-slate-300 bg-slate-50/70 dark:border-slate-700 dark:bg-slate-900/30',
  amber: 'border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/30',
  green: 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30',
  blue: 'border-blue-300 bg-blue-50/70 dark:border-blue-800 dark:bg-blue-950/30',
  purple: 'border-purple-300 bg-purple-50/70 dark:border-purple-800 dark:bg-purple-950/30',
  rose: 'border-rose-300 bg-rose-50/70 dark:border-rose-800 dark:bg-rose-950/30',
};

function NoteForm({
  item,
  saving,
  onClose,
  onSave,
}: {
  item: PersonalNote | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: PersonalNoteInput) => void;
}) {
  const { t } = useLocale();
  const [title, setTitle] = useState(item?.title ?? '');
  const [content, setContent] = useState(item?.content ?? '');
  const [color, setColor] = useState<NoteColor>(item?.color ?? 'slate');
  const [isPinned, setIsPinned] = useState(item?.is_pinned ?? false);

  return (
    <FormDialog
      open
      onClose={onClose}
      title={item ? t('personal.notes.edit') : t('personal.notes.add')}
      loading={saving}
      onSubmit={event => {
        event.preventDefault();
        onSave({ title: title.trim(), content: content.trim(), color, is_pinned: isPinned });
      }}
    >
      <FormField label={t('col.title')} id="note-title" required>
        <FormInput id="note-title" value={title} onChange={event => setTitle(event.target.value)} maxLength={255} required autoFocus />
      </FormField>
      <FormField label={t('personal.notes.content')} id="note-content" required>
        <FormTextarea id="note-content" value={content} onChange={event => setContent(event.target.value)} rows={8} maxLength={20000} required />
      </FormField>
      <FormField label={t('personal.notes.color')} id="note-color">
        <FormSelect id="note-color" value={color} onChange={event => setColor(event.target.value as NoteColor)}>
          {noteColors.map(value => <option key={value} value={value}>{t(`personal.color.${value}`)}</option>)}
        </FormSelect>
      </FormField>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-3">
        <input type="checkbox" checked={isPinned} onChange={event => setIsPinned(event.target.checked)} className="h-4 w-4 accent-primary" />
        <Pin className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{t('personal.notes.pin')}</span>
      </label>
    </FormDialog>
  );
}

export default function PersonalNotesPage() {
  const { t, locale } = useLocale();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PersonalNote | null | 'new'>(null);
  const [deleting, setDeleting] = useState<PersonalNote | null>(null);
  const [search, setSearch] = useState('');

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['personal-notes'],
    queryFn: personalProductivityApi.listNotes,
  });
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['personal-notes'] });

  const saveMutation = useMutation({
    mutationFn: ({ item, payload }: { item: PersonalNote | null; payload: PersonalNoteInput }) =>
      item
        ? personalProductivityApi.updateNote(item.id, payload)
        : personalProductivityApi.createNote(payload),
    onSuccess: async () => {
      await refresh();
      setEditing(null);
      toast({ title: t('personal.saved') });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: personalProductivityApi.deleteNote,
    onSuccess: async () => {
      await refresh();
      setDeleting(null);
      toast({ title: t('personal.deleted') });
    },
  });

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return notes.filter(item => !query || `${item.title} ${item.content}`.toLowerCase().includes(query));
  }, [notes, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="page-header flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="page-title">{t('nav.notes')}</h1>
            <p className="page-description">{t('personal.notes.desc')}</p>
          </div>
          <Button className="gap-2" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" />
            {t('personal.notes.add')}
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-xl">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={event => setSearch(event.target.value)} placeholder={t('personal.notes.search')} className="ps-9" />
          </div>
          <p className="text-sm text-muted-foreground">{notes.length} {t('nav.notes')}</p>
        </div>

        {isLoading ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center">
            <FileText className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium">{t('personal.notes.empty')}</p>
          </div>
        ) : (
          <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(item => (
              <article key={item.id} className={cn('group rounded-xl border p-4 shadow-card', colorClasses[item.color])}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="flex items-center gap-2 font-semibold">
                      {item.is_pinned && <Pin className="h-4 w-4 shrink-0 fill-current text-primary" />}
                      <span className="truncate">{item.title}</span>
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.updated_at))}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleting(item)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
                <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed">{item.content}</p>
              </article>
            ))}
          </div>
        )}

        {editing && (
          <NoteForm
            item={editing === 'new' ? null : editing}
            saving={saveMutation.isPending}
            onClose={() => setEditing(null)}
            onSave={payload => saveMutation.mutate({ item: editing === 'new' ? null : editing, payload })}
          />
        )}
        <DeleteDialog
          open={Boolean(deleting)}
          onClose={() => setDeleting(null)}
          onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
          loading={deleteMutation.isPending}
          title={t('personal.notes.deleteTitle')}
          description={t('personal.notes.deleteDesc')}
        />
      </div>
    </DashboardLayout>
  );
}

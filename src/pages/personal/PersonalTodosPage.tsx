import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarClock, CheckCircle2, Circle, Clock3, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import DeleteDialog from '@/components/DeleteDialog';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  personalProductivityApi,
  type PersonalTodo,
  type PersonalTodoInput,
  type TodoPriority,
} from '@/services/endpoints/personal-productivity';

type StatusFilter = 'all' | 'active' | 'completed';

function toDateTimeLocal(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function TodoForm({
  item,
  saving,
  onClose,
  onSave,
}: {
  item: PersonalTodo | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: PersonalTodoInput) => void;
}) {
  const { t } = useLocale();
  const [title, setTitle] = useState(item?.title ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [priority, setPriority] = useState<TodoPriority>(item?.priority ?? 'medium');
  const [dueAt, setDueAt] = useState(toDateTimeLocal(item?.due_at ?? null));

  return (
    <FormDialog
      open
      onClose={onClose}
      title={item ? t('personal.todos.edit') : t('personal.todos.add')}
      loading={saving}
      onSubmit={event => {
        event.preventDefault();
        onSave({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          due_at: dueAt ? new Date(dueAt).toISOString() : null,
        });
      }}
    >
      <FormField label={t('col.title')} id="todo-title" required>
        <FormInput id="todo-title" value={title} onChange={event => setTitle(event.target.value)} maxLength={255} required autoFocus />
      </FormField>
      <FormField label={t('personal.description')} id="todo-description">
        <FormTextarea id="todo-description" value={description} onChange={event => setDescription(event.target.value)} rows={4} maxLength={5000} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t('personal.priority')} id="todo-priority">
          <FormSelect id="todo-priority" value={priority} onChange={event => setPriority(event.target.value as TodoPriority)}>
            <option value="low">{t('personal.priority.low')}</option>
            <option value="medium">{t('personal.priority.medium')}</option>
            <option value="high">{t('personal.priority.high')}</option>
          </FormSelect>
        </FormField>
        <FormField label={t('personal.dueAt')} id="todo-due-at">
          <FormInput id="todo-due-at" type="datetime-local" value={dueAt} onChange={event => setDueAt(event.target.value)} />
        </FormField>
      </div>
    </FormDialog>
  );
}

export default function PersonalTodosPage() {
  const { t, locale } = useLocale();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PersonalTodo | null | 'new'>(null);
  const [deleting, setDeleting] = useState<PersonalTodo | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('active');

  const { data: todos = [], isLoading } = useQuery({
    queryKey: ['personal-todos'],
    queryFn: personalProductivityApi.listTodos,
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['personal-todos'] });
  const saveMutation = useMutation({
    mutationFn: ({ item, payload }: { item: PersonalTodo | null; payload: PersonalTodoInput }) =>
      item
        ? personalProductivityApi.updateTodo(item.id, payload)
        : personalProductivityApi.createTodo(payload),
    onSuccess: async () => {
      await refresh();
      setEditing(null);
      toast({ title: t('personal.saved') });
    },
  });
  const completeMutation = useMutation({
    mutationFn: ({ id, completed }: { id: number; completed: boolean }) =>
      personalProductivityApi.completeTodo(id, completed),
    onSuccess: refresh,
  });
  const deleteMutation = useMutation({
    mutationFn: personalProductivityApi.deleteTodo,
    onSuccess: async () => {
      await refresh();
      setDeleting(null);
      toast({ title: t('personal.deleted') });
    },
  });

  const counts = useMemo(() => ({
    all: todos.length,
    active: todos.filter(item => !item.completed_at).length,
    completed: todos.filter(item => item.completed_at).length,
  }), [todos]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return todos.filter(item => {
      if (status === 'active' && item.completed_at) return false;
      if (status === 'completed' && !item.completed_at) return false;
      return !query || `${item.title} ${item.description ?? ''}`.toLowerCase().includes(query);
    });
  }, [search, status, todos]);

  const priorityVariant = (priority: TodoPriority) =>
    priority === 'high' ? 'destructive' : priority === 'medium' ? 'default' : 'secondary';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="page-header flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="page-title">{t('nav.todos')}</h1>
            <p className="page-description">{t('personal.todos.desc')}</p>
          </div>
          <Button className="gap-2" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" />
            {t('personal.todos.add')}
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {([
            ['active', t('personal.active'), counts.active, Clock3],
            ['completed', t('personal.completed'), counts.completed, CheckCircle2],
            ['all', t('filter.all'), counts.all, Circle],
          ] as const).map(([key, label, count, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={cn(
                'flex items-center justify-between rounded-xl border bg-card p-4 text-start shadow-card transition',
                status === key && 'border-primary ring-2 ring-primary/15',
              )}
            >
              <span>
                <span className="block text-sm text-muted-foreground">{label}</span>
                <span className="mt-1 block text-2xl font-bold">{count}</span>
              </span>
              <Icon className="h-6 w-6 text-primary" />
            </button>
          ))}
        </div>

        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={event => setSearch(event.target.value)} placeholder={t('personal.todos.search')} className="ps-9" />
        </div>

        {isLoading ? (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">{t('common.loading')}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed bg-card p-10 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium">{t('personal.todos.empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => {
              const completed = Boolean(item.completed_at);
              const overdue = !completed && item.due_at && new Date(item.due_at) < new Date();
              return (
                <article key={item.id} className={cn('flex gap-3 rounded-xl border bg-card p-4 shadow-card', completed && 'opacity-65')}>
                  <button
                    type="button"
                    className="mt-0.5 shrink-0 text-primary"
                    onClick={() => completeMutation.mutate({ id: item.id, completed: !completed })}
                    aria-label={completed ? t('personal.markActive') : t('personal.markCompleted')}
                  >
                    {completed ? <CheckCircle2 className="h-6 w-6" /> : <Circle className="h-6 w-6" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className={cn('font-semibold', completed && 'line-through')}>{item.title}</h2>
                      <Badge variant={priorityVariant(item.priority)}>{t(`personal.priority.${item.priority}`)}</Badge>
                    </div>
                    {item.description && <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.description}</p>}
                    {item.due_at && (
                      <p className={cn('mt-2 flex items-center gap-1.5 text-xs text-muted-foreground', overdue && 'font-medium text-destructive')}>
                        <CalendarClock className="h-3.5 w-3.5" />
                        {new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.due_at))}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-start gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => setDeleting(item)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {editing && (
          <TodoForm
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
          title={t('personal.todos.deleteTitle')}
          description={t('personal.todos.deleteDesc')}
        />
      </div>
    </DashboardLayout>
  );
}

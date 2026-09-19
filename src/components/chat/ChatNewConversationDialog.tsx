import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/services/endpoints/chat';
import type { ChatContact, ChatConversation, ChatRole } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

const MIN_QUERY_LENGTH = 3;
const SEARCH_DEBOUNCE_MS = 300;

interface ChatNewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canCreateGroup: boolean;
  onStarted: (conversation: ChatConversation) => void;
}

export function ChatNewConversationDialog({
  open,
  onOpenChange,
  canCreateGroup,
  onStarted,
}: ChatNewConversationDialogProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [title, setTitle] = useState('');
  const [selected, setSelected] = useState<Record<string, ChatContact>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [query]);

  const searchTerm = debouncedQuery;
  const canSearch = searchTerm.length >= MIN_QUERY_LENGTH;

  const contactsQuery = useQuery({
    queryKey: ['chat', 'contacts', searchTerm],
    queryFn: () => chatApi.contacts({ q: searchTerm }),
    enabled: open && canSearch,
    staleTime: 30_000,
  });

  const contacts = contactsQuery.data ?? [];
  const selectedList = useMemo(() => Object.values(selected), [selected]);

  const reset = () => {
    setMode('direct');
    setQuery('');
    setDebouncedQuery('');
    setTitle('');
    setSelected({});
    setError(null);
  };

  const contactKey = (contact: ChatContact) => `${contact.type}:${contact.id}:${contact.center_id}`;

  const toggle = (contact: ChatContact) => {
    const key = contactKey(contact);
    setSelected(prev => {
      if (mode === 'direct') {
        return { [key]: contact };
      }
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = contact;
      return next;
    });
  };

  const startWith = async (members: ChatContact[]) => {
    if (members.length === 0 || saving) return;
    setSaving(true);
    setError(null);
    try {
      if (mode === 'direct') {
        const peer = members[0];
        const conversation = await chatApi.startDirect({
          type: peer.type,
          id: peer.id,
          center_id: peer.center_id,
        });
        onStarted(conversation);
      } else {
        const centerId = members[0].center_id;
        if (members.some(item => item.center_id !== centerId)) {
          setError(t('chat.groupSameCenter'));
          setSaving(false);
          return;
        }
        const conversation = await chatApi.startGroup({
          title: title.trim(),
          center_id: centerId,
          members: members.map(item => ({ type: item.type, id: item.id })),
        });
        onStarted(conversation);
      }
      onOpenChange(false);
      reset();
    } catch (err) {
      const message = typeof err === 'object' && err && 'message' in err
        ? String((err as { message?: string }).message)
        : t('chat.startFailed');
      setError(message || t('chat.startFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={next => {
      onOpenChange(next);
      if (!next) reset();
    }}>
      <DialogContent className="z-[100] max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'group' ? t('chat.newGroup') : t('chat.newChat')}</DialogTitle>
        </DialogHeader>

        {canCreateGroup ? (
          <div className="flex gap-2">
            <Button type="button" size="sm" variant={mode === 'direct' ? 'default' : 'outline'} onClick={() => { setMode('direct'); setSelected({}); }}>
              {t('chat.direct')}
            </Button>
            <Button type="button" size="sm" variant={mode === 'group' ? 'default' : 'outline'} onClick={() => { setMode('group'); setSelected({}); }}>
              {t('chat.group')}
            </Button>
          </div>
        ) : null}

        {mode === 'group' ? (
          <Input value={title} onChange={event => setTitle(event.target.value)} placeholder={t('chat.groupTitle')} />
        ) : null}

        <Input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder={t('chat.searchContactsHint')}
          autoFocus
        />

        <div className="max-h-64 space-y-1 overflow-y-auto">
          {!canSearch ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t('chat.typeToSearch')}</p>
          ) : contactsQuery.isFetching ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t('chat.searching')}</p>
          ) : contacts.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">{t('chat.noContacts')}</p>
          ) : (
            contacts.map(contact => {
              const key = contactKey(contact);
              const checked = Boolean(selected[key]);
              return (
                <button
                  key={key}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    if (mode === 'direct') {
                      void startWith([contact]);
                      return;
                    }
                    toggle(contact);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-start hover:bg-muted',
                    checked && 'bg-muted',
                  )}
                >
                  {mode === 'group' ? (
                    <Checkbox checked={checked} />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{contact.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {t(`role.${contact.role as ChatRole}`)}
                      {contact.center_name ? ` · ${contact.center_name}` : ''}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {mode === 'group' ? (
          <DialogFooter>
            <Button
              type="button"
              onClick={() => void startWith(selectedList)}
              disabled={saving || selectedList.length === 0 || !title.trim()}
            >
              {t('chat.start')}
            </Button>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

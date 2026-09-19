import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Plus, Search } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatMessageBubble } from '@/components/chat/ChatMessageBubble';
import { ChatNewConversationDialog } from '@/components/chat/ChatNewConversationDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useChatStream } from '@/hooks/use-chat-stream';
import { chatApi } from '@/services/endpoints/chat';
import { cn } from '@/lib/utils';
import type { ChatConversation, ChatMessage, ChatTypingEvent } from '@/types/chat';

function chatBasePath(role?: string): string {
  if (role === 'teacher') return '/teacher/chat';
  if (role === 'student') return '/student/chat';
  if (role === 'parent') return '/parent/chat';
  return '/admin/chat';
}

export default function ChatPage() {
  const { t } = useLocale();
  const { user } = useAuth();
  const navigate = useNavigate();
  const params = useParams<{ conversationId?: string }>();
  const queryClient = useQueryClient();
  const basePath = chatBasePath(user?.role);
  const conversationId = params.conversationId ? Number(params.conversationId) : null;
  const [search, setSearch] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const [typing, setTyping] = useState<ChatTypingEvent[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const canCreateGroup = user?.role === 'admin' || user?.role === 'teacher';

  const conversationsQuery = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: () => chatApi.conversations(),
  });

  const conversationQuery = useQuery({
    queryKey: ['chat', 'conversation', conversationId],
    queryFn: () => chatApi.conversation(conversationId as number),
    enabled: Number.isFinite(conversationId) && (conversationId as number) > 0,
  });

  const messagesQuery = useQuery({
    queryKey: ['chat', 'messages', conversationId],
    queryFn: () => chatApi.messages(conversationId as number),
    enabled: Number.isFinite(conversationId) && (conversationId as number) > 0,
  });

  const conversations = conversationsQuery.data?.conversations ?? [];
  const filtered = conversations.filter(item => {
    if (!search.trim()) return true;
    const haystack = `${item.title ?? ''} ${item.participants.map(p => p.name).join(' ')}`.toLowerCase();
    return haystack.includes(search.trim().toLowerCase());
  });
  const active = conversations.find(item => item.id === conversationId) ?? conversationQuery.data ?? null;
  const messages = messagesQuery.data?.messages ?? [];
  const lastId = messages.reduce((max, message) => Math.max(max, message.id), 0);

  const mergeMessage = (message: ChatMessage) => {
    queryClient.setQueryData(['chat', 'messages', message.conversation_id], (current: { messages: ChatMessage[]; next_cursor: number | null } | undefined) => {
      const existing = current?.messages ?? [];
      if (existing.some(item => item.id === message.id)) return current;
      const withoutTemp = existing.filter(item => item.id > 0 || item.body !== message.body);
      return { messages: [...withoutTemp, message], next_cursor: current?.next_cursor ?? null };
    });
    queryClient.setQueryData(['chat', 'conversations'], (current: { conversations: ChatConversation[]; unread_count: number } | undefined) => {
      if (!current) return current;
      const conversations = current.conversations.map(item => (
        item.id === message.conversation_id
          ? { ...item, last_message: message, updated_at: message.created_at }
          : item
      ));
      const index = conversations.findIndex(item => item.id === message.conversation_id);
      if (index > 0) {
        const [row] = conversations.splice(index, 1);
        conversations.unshift(row);
      }
      return { ...current, conversations };
    });
  };

  useChatStream({
    enabled: Boolean(user),
    lastId,
    onMessage: mergeMessage,
    onTyping: setTyping,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, conversationId]);

  useEffect(() => {
    if (!conversationId || messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (!last || last.is_mine || last.id < 1) return;
    void chatApi.markRead(conversationId, lastId);
  }, [conversationId, lastId, messages]);

  const sendText = useMutation({
    mutationFn: ({ body }: { type: 'text' | 'emoji'; body: string }) => {
      if (!conversationId) throw new Error('No conversation');
      return chatApi.sendText(conversationId, 'text', body);
    },
    onMutate: async ({ body }) => {
      if (!conversationId || !user) return;
      const temp: ChatMessage = {
        id: -Date.now(),
        conversation_id: conversationId,
        sender_type: user.role === 'admin' ? 'admin' : user.role,
        sender_id: user.id,
        type: 'text',
        body,
        is_mine: true,
        created_at: new Date().toISOString(),
        attachment: null,
      };
      mergeMessage(temp);
      return { tempId: temp.id };
    },
    onSuccess: (saved, _vars, ctx) => {
      if (ctx?.tempId) {
        queryClient.setQueryData(['chat', 'messages', saved.conversation_id], (current: { messages: ChatMessage[]; next_cursor: number | null } | undefined) => {
          const existing = (current?.messages ?? []).filter(item => item.id !== ctx.tempId);
          if (existing.some(item => item.id === saved.id)) {
            return { messages: existing, next_cursor: current?.next_cursor ?? null };
          }
          return { messages: [...existing, saved], next_cursor: current?.next_cursor ?? null };
        });
      } else {
        mergeMessage(saved);
      }
    },
    onError: (_error, _vars, ctx) => {
      if (!ctx?.tempId || !conversationId) return;
      queryClient.setQueryData(['chat', 'messages', conversationId], (current: { messages: ChatMessage[]; next_cursor: number | null } | undefined) => ({
        messages: (current?.messages ?? []).filter(item => item.id !== ctx.tempId),
        next_cursor: current?.next_cursor ?? null,
      }));
    },
  });

  const sendFile = useMutation({
    mutationFn: ({ type, file }: { type: 'image' | 'voice'; file: File }) => {
      if (!conversationId) throw new Error('No conversation');
      return chatApi.sendFile(conversationId, type, file);
    },
    onSuccess: mergeMessage,
  });

  const participantName = useMemo(() => {
    const map = new Map<string, string>();
    for (const person of active?.participants ?? []) {
      map.set(`${person.type}:${person.id}`, person.name);
    }
    return (type: string, id: number) => map.get(`${type}:${id}`) ?? type;
  }, [active]);

  const isMine = (message: ChatMessage) => {
    if (message.is_mine) return true;
    if (!user) return false;
    const role = user.role === 'admin' ? 'admin' : user.role;
    return message.sender_type === role && message.sender_id === user.id;
  };

  const typingLabel = typing
    .filter(event => event.conversation_id === conversationId)
    .flatMap(event => event.actors.map(actor => actor.name))
    .filter(Boolean)
    .join(', ');

  const openConversation = (conversation: ChatConversation) => {
    navigate(`${basePath}/${conversation.id}`);
  };

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-8.5rem)] min-h-[28rem] overflow-hidden rounded-xl border bg-card">
        <aside className={cn('w-full shrink-0 border-e md:w-80', conversationId ? 'hidden md:flex md:flex-col' : 'flex flex-col')}>
          <div className="flex items-center gap-2 border-b p-3">
            <div className="relative flex-1">
              <Search className="absolute top-2.5 h-4 w-4 text-muted-foreground ltr:left-2 rtl:right-2" />
              <Input value={search} onChange={event => setSearch(event.target.value)} placeholder={t('chat.search')} className="ltr:pl-8 rtl:pr-8" />
            </div>
            <Button type="button" size="icon" onClick={() => setComposerOpen(true)} aria-label={t('chat.newChat')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map(conversation => {
              const activeRow = conversation.id === conversationId;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => openConversation(conversation)}
                  className={cn(
                    'flex w-full flex-col gap-1 border-b px-4 py-3 text-start hover:bg-muted/70',
                    activeRow && 'bg-muted',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{conversation.title || t('chat.conversation')}</span>
                    {conversation.unread_count > 0 ? (
                      <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                      </span>
                    ) : null}
                  </div>
                  <span className="truncate text-xs text-muted-foreground">
                    {conversation.last_message?.body
                      || (conversation.last_message?.type === 'image' ? t('chat.image') : null)
                      || (conversation.last_message?.type === 'voice' ? t('chat.voice') : t('chat.noMessages'))}
                  </span>
                </button>
              );
            })}
            {filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-sm text-muted-foreground">{t('chat.emptyInbox')}</div>
            ) : null}
          </div>
        </aside>

        <section className={cn('min-w-0 flex-1 flex-col', conversationId ? 'flex' : 'hidden md:flex')}>
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b px-4 py-3">
                <Button type="button" variant="ghost" className="md:hidden" onClick={() => navigate(basePath)}>
                  {t('chat.back')}
                </Button>
                <div className="min-w-0">
                  <h2 className="truncate font-semibold">{active.title || t('chat.conversation')}</h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {active.type === 'group' ? t('chat.group') : t('chat.direct')}
                    {active.participants.length ? ` · ${active.participants.map(p => p.name).join(', ')}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map(message => (
                  <ChatMessageBubble
                    key={message.id}
                    message={message}
                    mine={isMine(message)}
                    senderName={participantName(message.sender_type, message.sender_id)}
                  />
                ))}
                {typingLabel ? <p className="text-xs text-muted-foreground">{typingLabel} {t('chat.typing')}</p> : null}
                <div ref={bottomRef} />
              </div>
              <ChatComposer
                disabled={sendFile.isPending}
                onSendText={(type, body) => sendText.mutateAsync({ type, body })}
                onSendFile={(type, file) => sendFile.mutateAsync({ type, file })}
                onTyping={() => { if (conversationId) void chatApi.typing(conversationId); }}
              />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
              <MessageCircle className="h-10 w-10" />
              <p>{t('chat.pickConversation')}</p>
              <Button type="button" onClick={() => setComposerOpen(true)}>{t('chat.newChat')}</Button>
            </div>
          )}
        </section>
      </div>

      <ChatNewConversationDialog
        open={composerOpen}
        onOpenChange={setComposerOpen}
        canCreateGroup={canCreateGroup}
        onStarted={conversation => {
          queryClient.setQueryData(['chat', 'conversation', conversation.id], conversation);
          queryClient.setQueryData(['chat', 'conversations'], (current: { conversations: ChatConversation[]; unread_count: number } | undefined) => {
            const existing = current?.conversations ?? [];
            const next = [conversation, ...existing.filter(item => item.id !== conversation.id)];
            return { conversations: next, unread_count: current?.unread_count ?? 0 };
          });
          navigate(`${basePath}/${conversation.id}`);
        }}
      />
    </DashboardLayout>
  );
}

import { useEffect, useState } from 'react';
import { chatApi } from '@/services/endpoints/chat';
import type { ChatMessage } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  mine: boolean;
  senderName?: string;
}

export function ChatMessageBubble({ message, mine, senderName }: ChatMessageBubbleProps) {
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!message.attachment) return;
    let objectUrl: string | null = null;
    let cancelled = false;
    void chatApi.attachmentBlob(message.conversation_id, message.attachment.id).then(blob => {
      if (cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setMediaUrl(objectUrl);
    }).catch(() => undefined);

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [message.attachment, message.conversation_id]);

  return (
    <div className={cn('flex w-full', mine ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm',
          mine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
        )}
      >
        {!mine && senderName ? (
          <p className="mb-1 text-[11px] font-medium opacity-80">{senderName}</p>
        ) : null}

        {message.type === 'emoji' ? (
          <p className="text-3xl leading-none">{message.body}</p>
        ) : null}

        {message.type === 'text' ? (
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        ) : null}

        {message.type === 'image' && mediaUrl ? (
          <img src={mediaUrl} alt="" className="max-h-64 max-w-full rounded-lg object-cover" />
        ) : null}

        {message.type === 'voice' && mediaUrl ? (
          <audio controls src={mediaUrl} className="w-56 max-w-full" />
        ) : null}

        {(message.type === 'image' || message.type === 'voice') && !mediaUrl ? (
          <p className="text-xs opacity-70">…</p>
        ) : null}

        {message.created_at ? (
          <p className={cn('mt-1 text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        ) : null}
      </div>
    </div>
  );
}

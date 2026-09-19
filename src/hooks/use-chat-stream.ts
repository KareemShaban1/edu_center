import { useEffect, useRef } from 'react';
import { chatApi } from '@/services/endpoints/chat';
import type { ChatMessage, ChatTypingEvent } from '@/types/chat';

interface UseChatStreamOptions {
  enabled: boolean;
  lastId: number;
  onMessage: (message: ChatMessage) => void;
  onTyping?: (events: ChatTypingEvent[]) => void;
}

function parseSseChunk(buffer: string): { events: Array<{ event: string; data: string }>; rest: string } {
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';
  const events: Array<{ event: string; data: string }> = [];

  for (const part of parts) {
    let event = 'message';
    const dataLines: string[] = [];
    for (const line of part.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
    }
    if (dataLines.length > 0) {
      events.push({ event, data: dataLines.join('\n') });
    }
  }

  return { events, rest };
}

export function useChatStream({ enabled, lastId, onMessage, onTyping }: UseChatStreamOptions) {
  const lastIdRef = useRef(lastId);
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  lastIdRef.current = lastId;
  onMessageRef.current = onMessage;
  onTypingRef.current = onTyping;

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let pollTimer: number | undefined;
    let usingSse = false;

    const handleEvent = (event: string, data: string) => {
      if (event === 'message.created') {
        try {
          const message = JSON.parse(data) as ChatMessage;
          if (message?.id) {
            lastIdRef.current = Math.max(lastIdRef.current, message.id);
            onMessageRef.current(message);
          }
        } catch {
          /* ignore malformed payloads */
        }
      }
      if (event === 'typing') {
        try {
          onTypingRef.current?.(JSON.parse(data) as ChatTypingEvent[]);
        } catch {
          /* ignore */
        }
      }
    };

    const pollFallback = () => {
      if (cancelled || usingSse) return;
      void chatApi.conversations().then(res => {
        const newest = res.conversations
          .map(c => c.last_message?.id ?? 0)
          .reduce((max, id) => Math.max(max, id), lastIdRef.current);
        if (newest > lastIdRef.current) {
          lastIdRef.current = newest;
          for (const conversation of res.conversations) {
            if (conversation.last_message && conversation.last_message.id === newest) {
              onMessageRef.current(conversation.last_message);
            }
          }
        }
      }).catch(() => undefined);
      pollTimer = window.setTimeout(pollFallback, 5000);
    };

    const connect = async () => {
      while (!cancelled) {
        try {
          const response = await chatApi.openStream(lastIdRef.current);
          if (!response.ok || !response.body) {
            throw new Error('stream unavailable');
          }
          usingSse = true;
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (!cancelled) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const parsed = parseSseChunk(buffer);
            buffer = parsed.rest;
            for (const item of parsed.events) {
              handleEvent(item.event, item.data);
            }
          }
        } catch {
          usingSse = false;
          if (!cancelled && pollTimer === undefined) {
            pollFallback();
          }
        }

        if (cancelled) break;
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    };

    void connect();

    return () => {
      cancelled = true;
      if (pollTimer) window.clearTimeout(pollTimer);
    };
  }, [enabled]);
}

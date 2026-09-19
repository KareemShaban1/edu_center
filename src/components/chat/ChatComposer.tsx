import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Mic, Send, Smile, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';

const EMOJIS = ['😀', '😁', '😂', '😍', '🤩', '😊', '😢', '😮', '🙏', '👍', '👏', '🎉', '❤️', '🔥', '✅', '❓', '🤝', '😅', '😎', '💯', '🌸', '⭐'];

interface ChatComposerProps {
  disabled?: boolean;
  onSendText: (type: 'text' | 'emoji', body: string) => Promise<void> | void;
  onSendFile: (type: 'image' | 'voice', file: File) => Promise<void> | void;
  onTyping?: () => void;
}

export function ChatComposer({ disabled, onSendText, onSendFile, onTyping }: ChatComposerProps) {
  const { t } = useLocale();
  const [text, setText] = useState('');
  const [recording, setRecording] = useState(false);
  const [sendingFile, setSendingFile] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const typingAtRef = useRef(0);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  const emitTyping = () => {
    const now = Date.now();
    if (now - typingAtRef.current < 2000) return;
    typingAtRef.current = now;
    onTyping?.();
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    const next = `${text.slice(0, start)}${emoji}${text.slice(end)}`;
    setText(next);
    requestAnimationFrame(() => {
      el?.focus();
      const pos = start + emoji.length;
      el?.setSelectionRange(pos, pos);
    });
  };

  const submitText = async () => {
    const value = text.trim();
    if (!value || disabled || sendingFile) return;
    setText('');
    try {
      await onSendText('text', value);
    } catch {
      setText(value);
    }
  };

  const sendFile = async (type: 'image' | 'voice', file: File) => {
    setSendingFile(true);
    try {
      await onSendFile(type, file);
    } finally {
      setSendingFile(false);
    }
  };

  const startRecording = async () => {
    if (recording || disabled) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = event => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      const file = new File([blob], `voice-${Date.now()}.webm`, { type: blob.type });
      void sendFile('voice', file);
    };
    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  };

  const busy = disabled || sendingFile;

  return (
    <div className="border-t bg-card p-3">
      <div className="flex items-end gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" size="icon" variant="ghost" disabled={busy} aria-label={t('chat.emoji')}>
              <Smile className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="z-[110] w-64 p-2" align="start" onOpenAutoFocus={event => event.preventDefault()}>
            <div className="grid grid-cols-8 gap-1">
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  className="rounded-md p-1 text-lg hover:bg-muted"
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => insertEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void sendFile('image', file);
          }}
        />
        <Button
          type="button"
          size="icon"
          variant="ghost"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          aria-label={t('chat.image')}
        >
          <ImagePlus className="h-5 w-5" />
        </Button>

        <textarea
          ref={textareaRef}
          value={text}
          disabled={busy || recording}
          onChange={event => {
            setText(event.target.value);
            emitTyping();
          }}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void submitText();
            }
          }}
          rows={1}
          placeholder={t('chat.placeholder')}
          className="max-h-32 min-h-10 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm"
        />

        {text.trim() ? (
          <Button type="button" size="icon" disabled={busy} onClick={() => void submitText()} aria-label={t('chat.send')}>
            <Send className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            variant={recording ? 'destructive' : 'ghost'}
            disabled={busy}
            onClick={() => (recording ? stopRecording() : void startRecording().catch(() => setRecording(false)))}
            aria-label={recording ? t('chat.stopVoice') : t('chat.voice')}
            className={cn(recording && 'animate-pulse')}
          >
            {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}

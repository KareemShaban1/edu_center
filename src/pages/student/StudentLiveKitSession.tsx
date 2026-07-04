import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Room, RoomEvent } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import { studentSelfApi } from '@/services/endpoints/student-self';

export default function StudentLiveKitSession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const id = Number(sessionId);
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('connecting');
  const roomRef = useRef<Room | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError('Invalid session');
      setStatus('error');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { token, url } = await studentSelfApi.getLiveKitToken(id);
        if (!url || !token) {
          setError('LiveKit is not configured');
          setStatus('error');
          return;
        }
        const r = new Room();
        await r.connect(url, token, { autoSubscribe: true });
        if (cancelled) {
          r.disconnect();
          return;
        }
        roomRef.current = r;
        setStatus('connected');

        const attach = (track: unknown) => {
          if (!containerRef.current) return;
          const maybeTrack = track as { attach?: () => HTMLElement | null };
          if (!maybeTrack.attach) return;
          const el = maybeTrack.attach();
          if (!el) return;
          el.className = 'w-full max-h-[50vh] rounded-lg bg-black';
          containerRef.current.appendChild(el);
        };

        r.on(RoomEvent.TrackSubscribed, (track) => {
          attach(track);
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Connection failed');
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      roomRef.current?.disconnect();
      roomRef.current = null;
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{t('sessions.liveKitRoom')}</h1>
        <Button variant="outline" asChild>
          <Link to="/student/sessions">{t('misc.back')}</Link>
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {!error && <p className="text-sm text-muted-foreground">{status}</p>}
      <div ref={containerRef} className="flex flex-col gap-2" />
    </div>
  );
}

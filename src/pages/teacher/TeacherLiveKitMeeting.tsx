import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Room, RoomEvent } from 'livekit-client';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import { teacherMeetingSeriesApi } from '@/services/endpoints/teacher-meeting-series';

export default function TeacherLiveKitMeeting() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const id = Number(meetingId);
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [isConfigError, setIsConfigError] = useState(false);
  const [status, setStatus] = useState<string>('connecting');
  const roomRef = useRef<Room | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError('Invalid meeting');
      setStatus('error');
      return;
    }
    const containerEl = containerRef.current;
    let cancelled = false;
    (async () => {
      try {
        const { token, url } = await teacherMeetingSeriesApi.getLiveKitToken(id);
        if (!url || !token) {
          setIsConfigError(true);
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
          if (!containerEl) return;
          const maybeTrack = track as { attach?: () => HTMLElement | null };
          if (!maybeTrack.attach) return;
          const el = maybeTrack.attach();
          if (!el) return;
          el.className = 'w-full max-h-[50vh] rounded-lg bg-black';
          containerEl.appendChild(el);
        };

        r.on(RoomEvent.TrackSubscribed, (track) => {
          attach(track);
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Connection failed';
        const lowered = message.toLowerCase();
        const configIssue = lowered.includes('not configured') || lowered.includes('credentials');
        setIsConfigError(configIssue);
        setError(message);
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      roomRef.current?.disconnect();
      roomRef.current = null;
      if (containerEl) containerEl.innerHTML = '';
    };
  }, [id]);

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-semibold">{t('meetings.liveKitRoom')}</h1>
        <Button variant="outline" asChild>
          <Link to="/teacher/meeting-series">{t('misc.back')}</Link>
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {isConfigError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
          <p className="font-medium text-destructive">LiveKit is not configured for this tenant.</p>
          <p className="mt-1 text-muted-foreground">
            Set <code>LIVEKIT_URL</code>, <code>LIVEKIT_API_KEY</code>, and <code>LIVEKIT_API_SECRET</code> in backend environment, then retry.
          </p>
        </div>
      )}
      {!error && <p className="text-sm text-muted-foreground">{status}</p>}
      <div ref={containerRef} className="flex flex-col gap-2" />
    </div>
  );
}


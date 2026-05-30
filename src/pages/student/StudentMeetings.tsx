import { useState } from 'react';
import { Link } from 'react-router-dom';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import { useLocale } from '@/contexts/LocaleContext';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MeetingRow {
  id: number;
  topic: string;
  teacher: string;
  start_at: string;
  duration: number;
  provider: string;
  room_slug?: string;
  join_url?: string;
  moderator_url?: string;
  password?: string;
  record_enabled?: boolean;
  livekit_url?: string;
  external_ref?: string;
  location?: string;
  notes?: string;
}

function MeetingShowDialog({ item, onClose }: { item: MeetingRow; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{t('crud.view')} {t('nav.myMeetings')}</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <p><strong>{t('col.title')}:</strong> {item.topic}</p>
          <p><strong>{t('col.teacher')}:</strong> {item.teacher}</p>
          <p><strong>{t('col.startDate')}:</strong> {item.start_at}</p>
          <p><strong>{t('col.durationMinutes')}:</strong> {item.duration}</p>
          <p><strong>Provider:</strong> {item.provider}</p>
          {item.provider === 'offline' ? (
            <>
              <p><strong>Location:</strong> {item.location || '—'}</p>
              <p><strong>Notes:</strong> {item.notes || '—'}</p>
            </>
          ) : (
            <p><strong>Join URL:</strong> {(item.join_url && item.join_url !== '#') ? item.join_url : '—'}</p>
          )}
          {item.provider === 'livekit' && (
            <p>
              <Button asChild variant="secondary" size="sm">
                <Link to={`/student/meetings/${item.id}/livekit`}>{t('meetings.openLiveKit')}</Link>
              </Button>
            </p>
          )}
        </div>
        <div className="flex justify-end"><Button variant="outline" onClick={onClose}>{t('misc.close')}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentMeetings() {
  const { t } = useLocale();
  const { data } = useStudentBootstrap();
  const [showItem, setShowItem] = useState<MeetingRow | null>(null);
  const rows = (data?.meetings || []) as MeetingRow[];
  const columns: CrudColumn<MeetingRow>[] = [
    { key: 'topic', label: t('col.title'), sortable: true },
    { key: 'teacher', label: t('col.teacher') },
    { key: 'start_at', label: t('col.startDate'), sortable: true },
    { key: 'duration', label: t('col.durationMinutes'), render: c => `${c.duration} min` },
    { key: 'provider', label: 'Provider' },
    {
      key: '_join',
      label: t('meetings.join'),
      render: c => {
        if (c.provider === 'offline') {
          return <span className="text-xs text-muted-foreground">{c.location || 'Offline'}</span>;
        }
        if (c.provider === 'livekit') {
          return <Link className="text-primary underline text-xs" to={`/student/meetings/${c.id}/livekit`}>{t('meetings.openLiveKit')}</Link>;
        }
        if (c.join_url) {
          return <a className="text-primary underline text-xs" href={c.join_url} target="_blank" rel="noreferrer">{t('meetings.join')}</a>;
        }
        return '—';
      },
    },
    { key: '_show', label: t('crud.view'), render: c => <button type="button" onClick={() => setShowItem(c)} className="rounded-lg border px-2 py-1 text-xs">{t('crud.view')}</button> },
  ];
  return (
    <>
      <CrudPage<MeetingRow>
        title={t('nav.myMeetings')}
        description={t('page.studentMeetings.desc')}
        columns={columns}
        data={rows}
        searchKeys={['topic', 'teacher', 'start_at', 'provider']}
        readOnly
        canEdit={false}
        canDelete={false}
      />
      {showItem && <MeetingShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}

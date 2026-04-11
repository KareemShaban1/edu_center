import { useState } from 'react';
import { Link } from 'react-router-dom';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import { studentSelfApi, type StudentMeetingPayload } from '@/services/endpoints/student-self';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MeetingRow {
  id: number;
  topic: string;
  teacher: string;
  start_at: string;
  duration: number;
  provider: 'jitsi' | 'livekit' | 'external' | 'offline';
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
            <p><strong>Join URL:</strong> {item.join_url || '—'}</p>
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

function MeetingForm({
  item,
  onClose,
  onSave,
  saving,
}: {
  item: MeetingRow | null;
  onClose: () => void;
  onSave: (payload: StudentMeetingPayload, id?: number) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    topic: item?.topic || '',
    start_at: item?.start_at ? String(item.start_at).slice(0, 16) : '',
    duration: item?.duration || 45,
    provider: (item?.provider || 'jitsi') as StudentMeetingPayload['provider'],
    join_url: item?.join_url || '',
    moderator_url: item?.moderator_url || '',
    password: item?.password || '',
    external_ref: item?.external_ref || '',
    record_enabled: item?.record_enabled ?? false,
  });
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.topic.trim() || !form.start_at) {
      toast({ title: 'Validation error', description: 'Topic and start date are required.', variant: 'destructive' });
      return;
    }
    onSave({
      topic: form.topic.trim(),
      start_at: form.start_at,
      duration: Number(form.duration || 45),
      provider: form.provider,
      join_url: form.provider === 'external' ? form.join_url || undefined : undefined,
      moderator_url: form.provider === 'external' ? form.moderator_url || undefined : undefined,
      password: form.password || undefined,
      external_ref: form.external_ref || undefined,
      record_enabled: form.record_enabled,
    }, item?.id).then(onClose).catch((error: unknown) => {
      toast({ title: 'Save failed', description: error instanceof Error ? error.message : 'Failed to save', variant: 'destructive' });
    });
  };
  return (
    <FormDialog open onClose={onClose} title={item ? `${t('crud.edit')} ${t('nav.myMeetings')}` : `${t('crud.addNew')} ${t('nav.myMeetings')}`} onSubmit={submit} loading={saving}>
      <FormField label={t('col.title')} id="meet-topic" required>
        <FormInput id="meet-topic" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} required />
      </FormField>
      <FormField label={t('col.startDate')} id="meet-start" required>
        <FormInput id="meet-start" type="datetime-local" value={form.start_at} onChange={e => setForm(f => ({ ...f, start_at: e.target.value }))} required />
      </FormField>
      <FormField label={t('col.durationMinutes')} id="meet-duration" required>
        <FormInput id="meet-duration" type="number" min={15} max={480} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} required />
      </FormField>
      <FormField label="Provider" id="meet-provider">
        <FormSelect id="meet-provider" value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value as StudentMeetingPayload['provider'] }))}>
          <option value="jitsi">Jitsi (free)</option>
          <option value="livekit">LiveKit</option>
          <option value="external">External link</option>
        </FormSelect>
      </FormField>
      <FormField label="Recording flag (LiveKit)" id="meet-rec">
        <FormSelect id="meet-rec" value={form.record_enabled ? '1' : '0'} onChange={e => setForm(f => ({ ...f, record_enabled: e.target.value === '1' }))}>
          <option value="0">No</option>
          <option value="1">Yes</option>
        </FormSelect>
      </FormField>
      {form.provider === 'external' && (
        <>
          <FormField label="Join URL" id="meet-join"><FormTextarea id="meet-join" value={form.join_url} onChange={e => setForm(f => ({ ...f, join_url: e.target.value }))} required /></FormField>
          <FormField label="Moderator URL" id="meet-mod"><FormInput id="meet-mod" value={form.moderator_url} onChange={e => setForm(f => ({ ...f, moderator_url: e.target.value }))} /></FormField>
        </>
      )}
      <FormField label="Password (optional)" id="meet-pw"><FormInput id="meet-pw" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} /></FormField>
    </FormDialog>
  );
}

export default function StudentMeetings() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data } = useStudentBootstrap();
  const [showItem, setShowItem] = useState<MeetingRow | null>(null);
  const rows = (data?.meetings || []) as MeetingRow[];
  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: StudentMeetingPayload; id?: number }) => id ? studentSelfApi.updateMeeting(id, payload) : studentSelfApi.createMeeting(payload),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] }); },
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentSelfApi.deleteMeeting(id),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] }); },
  });
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
        description={t('page.meetings.desc')}
        columns={columns}
        data={rows}
        searchKeys={['topic', 'teacher', 'start_at', 'provider']}
        readOnly
        renderForm={(item, onClose) => (
          <MeetingForm item={item} onClose={onClose} onSave={async (payload, id) => saveMutation.mutateAsync({ payload, id })} saving={saveMutation.isPending} />
        )}
        onDelete={item => { void deleteMutation.mutateAsync(item.id); }}
      />
      {showItem && <MeetingShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}

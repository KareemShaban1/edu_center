import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { useTeacherBootstrap } from '@/hooks/use-teacher-bootstrap';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  teacherMeetingsApi,
  type TeacherMeetingRow,
  type TeacherMeetingSavePayload,
  type TeacherMeetingSeriesOption,
} from '@/services/endpoints/teacher-meetings';
import type { MeetingSeriesProvider } from '@/services/endpoints/teacher-meeting-series';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const urlProviders: MeetingSeriesProvider[] = ['external', 'zoom', 'microsoft_teams', 'google_meet'];

function errMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) return String((error as { message: unknown }).message);
  return 'Request failed';
}

interface TeacherSectionOption {
  id: number;
  name: string;
  grade_id: number;
  class_id: number;
}

function MeetingShowDialog({ item, onClose }: { item: TeacherMeetingRow; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t('crud.view')} — {item.topic}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>
            <strong>{t('col.section')}:</strong> {item.section_label || '—'}
          </p>
          <p>
            <strong>{t('col.title')}:</strong> {item.topic}
          </p>
          <p>
            <strong>{t('col.startDate')}:</strong> {item.start_at}
          </p>
          <p>
            <strong>{t('col.durationMinutes')}:</strong> {item.duration}
          </p>
          <p>
            <strong>Provider:</strong> {item.provider}
          </p>
          {item.series_id ? (
            <p>
              <strong>Series ID:</strong> {item.series_id}
            </p>
          ) : null}
          {item.provider === 'offline' ? (
            <>
              <p>
                <strong>Location:</strong> {item.location || '—'}
              </p>
              <p>
                <strong>Notes:</strong> {item.notes || '—'}
              </p>
            </>
          ) : (
            <p>
              <strong>Join URL:</strong> {item.join_url || '—'}
            </p>
          )}
          {item.provider === 'livekit' && (
            <p>
              <Button asChild variant="secondary" size="sm">
                <Link to={`/teacher/meetings/${item.id}/livekit`}>{t('meetings.openLiveKit')}</Link>
              </Button>
            </p>
          )}
        </div>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {t('misc.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MeetingForm({
  item,
  sections,
  sectionLabel,
  seriesForSection,
  onClose,
  onSave,
  saving,
}: {
  item: TeacherMeetingRow | null;
  sections: TeacherSectionOption[];
  sectionLabel: (s: TeacherSectionOption) => string;
  seriesForSection: TeacherMeetingSeriesOption[];
  onClose: () => void;
  onSave: (payload: TeacherMeetingSavePayload, id: number) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  if (!item) {
    return null;
  }

  const [form, setForm] = useState({
    section_id: item.section_id || sections[0]?.id || 0,
    topic: item.topic || '',
    start_at: item.start_at ? String(item.start_at).slice(0, 16) : '',
    duration: item.duration || 45,
    provider: (item.provider || 'jitsi') as MeetingSeriesProvider,
    series_id: item.series_id ?? 0,
    join_url: item.join_url && item.join_url !== '#' ? item.join_url : '',
    moderator_url: item.moderator_url || '',
    password: item.password || '',
    external_ref: item.external_ref || '',
    location: item.location || '',
    notes: item.notes || '',
    record_enabled: item.record_enabled ?? false,
  });

  const seriesOptions = useMemo(
    () => seriesForSection.filter(s => !form.section_id || s.section_id === form.section_id),
    [seriesForSection, form.section_id],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.section_id || !form.topic.trim() || !form.start_at) {
      toast({ title: 'Validation error', description: 'Section, topic, and start time are required.', variant: 'destructive' });
      return;
    }
    if (urlProviders.includes(form.provider) && !form.join_url.trim()) {
      toast({ title: 'Validation error', description: 'Join URL is required for this provider.', variant: 'destructive' });
      return;
    }
    if (form.provider === 'offline' && !form.location.trim()) {
      toast({ title: 'Validation error', description: 'Location is required for offline meetings.', variant: 'destructive' });
      return;
    }

    const payload: TeacherMeetingSavePayload = {
      section_id: form.section_id,
      topic: form.topic.trim(),
      start_at: form.start_at,
      duration: Number(form.duration || 45),
      provider: form.provider,
      record_enabled: form.record_enabled,
      series_id: form.series_id > 0 ? form.series_id : null,
      join_url: urlProviders.includes(form.provider) ? form.join_url.trim() : undefined,
      moderator_url: urlProviders.includes(form.provider) ? form.moderator_url.trim() || undefined : undefined,
      password: form.password.trim() || undefined,
      external_ref: urlProviders.includes(form.provider) ? form.external_ref.trim() || undefined : undefined,
      location: form.provider === 'offline' ? form.location.trim() : form.location.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      await onSave(payload, item.id);
      toast({ title: t('crud.edit'), description: form.topic.trim() });
      onClose();
    } catch (error: unknown) {
      toast({ title: 'Save failed', description: errMessage(error), variant: 'destructive' });
    }
  };

  return (
    <FormDialog
      open
      onClose={onClose}
      title={`${t('crud.edit')} — ${t('nav.teacherMeetings')}`}
      onSubmit={submit}
      loading={saving}
    >
      <FormField label={t('col.section')} id="tch-meet-section" required>
        <FormSelect
          id="tch-meet-section"
          title={t('col.section')}
          value={form.section_id || ''}
          onChange={e => {
            const sid = Number(e.target.value);
            setForm(f => ({ ...f, section_id: sid, series_id: 0 }));
          }}
          required
        >
          {sections.map(s => (
            <option key={s.id} value={s.id}>
              {sectionLabel(s)}
            </option>
          ))}
        </FormSelect>
      </FormField>

      <FormField label={t('col.title')} id="tch-meet-topic" required>
        <FormInput id="tch-meet-topic" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} required maxLength={255} />
      </FormField>

      <FormField label={t('col.startDate')} id="tch-meet-start" required>
        <FormInput
          id="tch-meet-start"
          type="datetime-local"
          value={form.start_at}
          onChange={e => setForm(f => ({ ...f, start_at: e.target.value }))}
          required
        />
      </FormField>

      <FormField label={t('col.durationMinutes')} id="tch-meet-duration" required>
        <FormInput
          id="tch-meet-duration"
          type="number"
          min={15}
          max={480}
          value={form.duration}
          onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
          required
        />
      </FormField>

      <FormField label="Provider" id="tch-meet-provider" required>
        <FormSelect
          id="tch-meet-provider"
          title="Provider"
          value={form.provider}
          onChange={e => setForm(f => ({ ...f, provider: e.target.value as MeetingSeriesProvider }))}
          required
        >
          <option value="jitsi">Jitsi</option>
          <option value="livekit">LiveKit</option>
          <option value="external">External link</option>
          <option value="offline">Offline</option>
          <option value="zoom">Zoom</option>
          <option value="microsoft_teams">Microsoft Teams</option>
          <option value="google_meet">Google Meet</option>
        </FormSelect>
      </FormField>

      {seriesOptions.length > 0 && (
        <FormField label="Meeting series (optional)" id="tch-meet-series">
          <FormSelect
            id="tch-meet-series"
            title="Meeting series"
            value={form.series_id || ''}
            onChange={e => setForm(f => ({ ...f, series_id: Number(e.target.value) }))}
          >
            <option value={0}>—</option>
            {seriesOptions.map(s => (
              <option key={s.id} value={s.id}>
                {s.topic}
              </option>
            ))}
          </FormSelect>
        </FormField>
      )}

      <FormField label="Recording (LiveKit)" id="tch-meet-rec">
        <FormSelect
          id="tch-meet-rec"
          value={form.record_enabled ? '1' : '0'}
          onChange={e => setForm(f => ({ ...f, record_enabled: e.target.value === '1' }))}
        >
          <option value="0">No</option>
          <option value="1">Yes</option>
        </FormSelect>
      </FormField>

      {urlProviders.includes(form.provider) && (
        <>
          <FormField label="Join URL" id="tch-meet-join" required>
            <FormTextarea id="tch-meet-join" value={form.join_url} onChange={e => setForm(f => ({ ...f, join_url: e.target.value }))} required />
          </FormField>
          <FormField label="Moderator URL" id="tch-meet-mod">
            <FormInput id="tch-meet-mod" value={form.moderator_url} onChange={e => setForm(f => ({ ...f, moderator_url: e.target.value }))} />
          </FormField>
        </>
      )}

      {form.provider === 'offline' && (
        <>
          <FormField label="Location" id="tch-meet-loc" required>
            <FormTextarea id="tch-meet-loc" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
          </FormField>
          <FormField label="Notes" id="tch-meet-notes">
            <FormTextarea id="tch-meet-notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>
        </>
      )}

      {(form.provider === 'jitsi' || form.provider === 'livekit') && (
        <FormField label="Password (optional)" id="tch-meet-pw">
          <FormInput id="tch-meet-pw" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </FormField>
      )}
    </FormDialog>
  );
}

export default function TeacherMeetings() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: boot } = useTeacherBootstrap();
  const [showItem, setShowItem] = useState<TeacherMeetingRow | null>(null);

  const { data } = useQuery({
    queryKey: ['teacher-meetings'],
    queryFn: () => teacherMeetingsApi.list(),
  });

  const classes = boot?.classes || [];
  const sections: TeacherSectionOption[] = useMemo(
    () => classes.map(c => ({ id: c.id, name: c.name, grade_id: 0, class_id: 0 })),
    [classes],
  );
  const sectionLabel = (s: TeacherSectionOption) => s.name;

  const rows = data?.meetings || [];
  const seriesOptions = data?.series_options || [];

  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: TeacherMeetingSavePayload; id: number }) => teacherMeetingsApi.update(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teacher-meetings'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => teacherMeetingsApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teacher-meetings'] });
    },
  });

  const columns: CrudColumn<TeacherMeetingRow>[] = [
    { key: 'topic', label: t('col.title'), sortable: true },
    { key: 'section_label', label: t('col.section'), sortable: true },
    { key: 'start_at', label: t('col.startDate'), sortable: true },
    { key: 'duration', label: t('col.durationMinutes'), render: r => `${r.duration} min` },
    { key: 'provider', label: 'Provider' },
    {
      key: '_join',
      label: t('meetings.join'),
      render: r => {
        if (r.provider === 'offline') {
          return <span className="text-xs text-muted-foreground">{r.location || 'Offline'}</span>;
        }
        if (r.provider === 'livekit') {
          return (
            <Link className="text-primary underline text-xs" to={`/teacher/meetings/${r.id}/livekit`}>
              {t('meetings.openLiveKit')}
            </Link>
          );
        }
        if (r.join_url && r.join_url !== '#') {
          return (
            <a className="text-primary underline text-xs" href={r.join_url} target="_blank" rel="noreferrer">
              {t('meetings.join')}
            </a>
          );
        }
        return '—';
      },
    },
    {
      key: '_show',
      label: t('crud.view'),
      render: r => (
        <button type="button" onClick={() => setShowItem(r)} className="rounded-lg border px-2 py-1 text-xs">
          {t('crud.view')}
        </button>
      ),
    },
  ];

  return (
    <>
      <CrudPage<TeacherMeetingRow>
        title={t('nav.teacherMeetings')}
        description={t('page.teacherMeetings.desc')}
        columns={columns}
        data={rows}
        canCreate={false}
        searchKeys={['topic', 'section_label', 'start_at', 'provider', 'created_by']}
        renderForm={(item, onClose) => {
          if (!item) return null;
          const formSections =
            sections.length > 0
              ? sections
              : [
                  {
                    id: item.section_id,
                    name: item.section_label || `Section ${item.section_id}`,
                    grade_id: item.grade_id,
                    class_id: item.class_id,
                  },
                ];
          return (
            <MeetingForm
              item={item}
              sections={formSections}
              sectionLabel={sectionLabel}
              seriesForSection={seriesOptions}
              onClose={onClose}
              onSave={async (payload, id) => {
                await saveMutation.mutateAsync({ payload, id });
              }}
              saving={saveMutation.isPending}
            />
          );
        }}
        onDelete={item => deleteMutation.mutateAsync(item.id)}
      />
      {showItem && <MeetingShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}

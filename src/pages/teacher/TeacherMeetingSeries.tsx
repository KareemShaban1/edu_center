import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { teacherMeetingSeriesApi, type MeetingSeriesProvider, type TeacherMeetingSeriesPayload, type TeacherMeetingSeriesRow } from '@/services/endpoints/teacher-meeting-series';
import { toast } from '@/hooks/use-toast';

type WeekDay = { value: number; label: string };

const weekDays: WeekDay[] = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

function ProviderLabel({ provider }: { provider: MeetingSeriesProvider }) {
  if (provider === 'jitsi') return <span>Jitsi (free)</span>;
  if (provider === 'livekit') return <span>LiveKit</span>;
  if (provider === 'zoom') return <span>Zoom</span>;
  if (provider === 'microsoft_teams') return <span>Microsoft Teams</span>;
  if (provider === 'google_meet') return <span>Google Meet</span>;
  if (provider === 'external') return <span>External</span>;
  return <span>Offline</span>;
}

function seriesWeekDaysToString(days: number[]) {
  return weekDays.filter(d => days.includes(d.value)).map(d => d.label).join(', ');
}

function ProviderGuidance({ provider, t }: { provider: MeetingSeriesProvider; t: (key: string) => string }) {
  if (provider === 'jitsi') {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{t('provider.guide.jitsi.title')}</p>
        <p>{t('provider.guide.jitsi.students')}</p>
        <p>{t('provider.guide.jitsi.internet')}</p>
        <p>{t('provider.guide.jitsi.notes')}</p>
      </div>
    );
  }
  if (provider === 'livekit') {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{t('provider.guide.livekit.title')}</p>
        <p>{t('provider.guide.livekit.students')}</p>
        <p>{t('provider.guide.livekit.internet')}</p>
        <p>{t('provider.guide.livekit.notes')}</p>
      </div>
    );
  }
  if (provider === 'zoom') {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{t('provider.guide.zoom.title')}</p>
        <p>{t('provider.guide.zoom.students')}</p>
        <p>{t('provider.guide.zoom.internet')}</p>
        <p>{t('provider.guide.zoom.notes')}</p>
      </div>
    );
  }
  if (provider === 'microsoft_teams') {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{t('provider.guide.teams.title')}</p>
        <p>{t('provider.guide.teams.students')}</p>
        <p>{t('provider.guide.teams.internet')}</p>
        <p>{t('provider.guide.teams.notes')}</p>
      </div>
    );
  }
  if (provider === 'google_meet') {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{t('provider.guide.gmeet.title')}</p>
        <p>{t('provider.guide.gmeet.students')}</p>
        <p>{t('provider.guide.gmeet.internet')}</p>
        <p>{t('provider.guide.gmeet.notes')}</p>
      </div>
    );
  }
  if (provider === 'external') {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">{t('provider.guide.external.title')}</p>
        <p>{t('provider.guide.external.students')}</p>
        <p>{t('provider.guide.external.internet')}</p>
        <p>{t('provider.guide.external.notes')}</p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
      <p className="font-medium text-foreground">{t('provider.guide.offline.title')}</p>
      <p>{t('provider.guide.offline.students')}</p>
      <p>{t('provider.guide.offline.internet')}</p>
      <p>{t('provider.guide.offline.notes')}</p>
    </div>
  );
}

function parseMeetingDate(raw: string) {
  const normalized = raw.includes('T') ? raw : raw.replace(' ', 'T');
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isOccurrenceOver(startAt: string, durationMinutes: number) {
  const start = parseMeetingDate(startAt);
  if (!start) return false;
  const end = new Date(start.getTime() + Math.max(0, durationMinutes) * 60 * 1000);
  return Date.now() > end.getTime();
}

function getOccurrenceStatus(occ: { start_at: string; duration: number; is_over?: boolean }) {
  const start = parseMeetingDate(occ.start_at);
  if (!start) return 'unknown' as const;
  const end = new Date(start.getTime() + Math.max(0, occ.duration) * 60 * 1000);
  const now = Date.now();

  if ((occ.is_over ?? false) || now > end.getTime()) return 'finished' as const;
  if (now < start.getTime()) return 'not_started' as const;
  return 'in_progress' as const;
}

function getDisplayedOccurrence(row: TeacherMeetingSeriesRow) {
  if (row.next_startable_occurrence) {
    return row.next_startable_occurrence;
  }
  const occurrences = row.next_occurrences || [];
  if (occurrences.length === 0) return null;

  const active = occurrences.find(o => !(o.is_over ?? isOccurrenceOver(o.start_at, o.duration)));
  return active || occurrences[0];
}

function StartAction({ row, t }: { row: TeacherMeetingSeriesRow; t: (key: string) => string }) {
  const next = getDisplayedOccurrence(row);
  if (!next) return <span className="text-xs text-muted-foreground">—</span>;
  const status = getOccurrenceStatus(next);
  if (status !== 'in_progress') {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (next.provider === 'offline') return <span className="text-xs text-muted-foreground">Offline</span>;
  if (next.provider === 'livekit') {
    return (
      <Link className="text-primary underline text-xs" to={`/teacher/meetings/${next.id}/livekit`}>
        {t('meetings.openLiveKit')}
      </Link>
    );
  }
  const url = next.moderator_url || next.join_url;
  if (!url) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <a className="text-primary underline text-xs" href={url} target="_blank" rel="noreferrer">
      Start
    </a>
  );
}

export default function TeacherMeetingSeries() {
  const urlProviders = useMemo<MeetingSeriesProvider[]>(
    () => ['external', 'zoom', 'microsoft_teams', 'google_meet'],
    []
  );
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['teacher-meeting-series'],
    queryFn: () => teacherMeetingSeriesApi.list(),
  });
  const sections = useMemo(() => data?.sections || [], [data?.sections]);
  const firstSectionId = sections[0]?.id ?? null;

  const rows = (data?.series || []) as TeacherMeetingSeriesRow[];

  const [form, setForm] = useState<{
    section_id: number | null;
    topic: string;
    provider: MeetingSeriesProvider;
    week_days: number[];
    start_date: string;
    end_date: string;
    start_time: string;
    duration: number;
    generate_value: number;
    generate_unit: 'weeks' | 'months';
    record_enabled: boolean;
    join_url: string;
    moderator_url: string;
    password: string;
    external_ref: string;
    location: string;
    notes: string;
  }>({
    section_id: null,
    topic: '',
    provider: 'jitsi',
    week_days: [1],
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    start_time: '10:00',
    duration: 45,
    generate_value: 8,
    generate_unit: 'weeks',
    record_enabled: false,
    join_url: '',
    moderator_url: '',
    password: '',
    external_ref: '',
    location: '',
    notes: '',
  });

  useEffect(() => {
    if (firstSectionId && !form.section_id) {
      setForm(f => ({ ...f, section_id: firstSectionId }));
    }
  }, [firstSectionId, form.section_id]);

  const createMutation = useMutation({
    mutationFn: async (payload: TeacherMeetingSeriesPayload) => teacherMeetingSeriesApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teacher-meeting-series'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => teacherMeetingSeriesApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teacher-meeting-series'] });
    },
  });

  const columns: CrudColumn<TeacherMeetingSeriesRow>[] = useMemo(() => ([
    { key: 'topic', label: t('col.title'), sortable: true },
    { key: 'provider', label: 'Provider', render: r => <ProviderLabel provider={r.provider} /> },
    { key: 'week_days', label: 'Week Days', render: r => seriesWeekDaysToString(r.week_days) },
    { key: 'start_time', label: 'Start Time' },
    { key: 'duration', label: t('col.durationMinutes'), render: r => `${r.duration} min` },
    {
      key: 'next_occurrences',
      label: 'Next Occurrence',
      render: r => {
        const next = getDisplayedOccurrence(r);
        if (!next?.start_at) return '—';
        return String(next.start_at);
      },
    },
    {
      key: '_status',
      label: t('col.status'),
      render: r => {
        const next = getDisplayedOccurrence(r);
        if (!next) return <span className="text-xs text-muted-foreground">—</span>;
        const status = getOccurrenceStatus(next);
        if (status === 'finished') return <span className="text-xs text-destructive">Finished</span>;
        if (status === 'in_progress') return <span className="text-xs text-green-600">In progress</span>;
        if (status === 'not_started') return <span className="text-xs text-amber-600">Not started</span>;
        return <span className="text-xs text-muted-foreground">Unknown</span>;
      },
    },
    {
      key: '_start',
      label: 'Start',
      render: r => <StartAction row={r} t={t} />,
    },
    {
      key: 'location',
      label: 'Location / Notes',
      render: r => r.provider === 'offline' ? r.location || r.notes || '—' : (r.notes || '—'),
    },
  ]), [t]);

  const submit = (e: React.FormEvent, close: () => void) => {
    e.preventDefault();
    if (!form.section_id) {
      toast({ title: 'Validation error', description: 'Select a section.', variant: 'destructive' });
      return;
    }
    if (!form.topic.trim()) {
      toast({ title: 'Validation error', description: 'Topic is required.', variant: 'destructive' });
      return;
    }
    if (form.week_days.length === 0) {
      toast({ title: 'Validation error', description: 'Select at least one weekday.', variant: 'destructive' });
      return;
    }
    if (!form.start_date) {
      toast({ title: 'Validation error', description: 'Start date is required.', variant: 'destructive' });
      return;
    }
    if (urlProviders.includes(form.provider) && !form.join_url.trim()) {
      toast({ title: 'Validation error', description: 'Join URL is required for this provider.', variant: 'destructive' });
      return;
    }
    if (form.provider === 'offline' && !form.location.trim()) {
      toast({ title: 'Validation error', description: 'Location is required for offline provider.', variant: 'destructive' });
      return;
    }

    const payload: TeacherMeetingSeriesPayload = {
      section_id: form.section_id,
      topic: form.topic.trim(),
      provider: form.provider,
      week_days: form.week_days,
      start_date: form.start_date,
      end_date: form.end_date || null,
      start_time: form.start_time,
      duration: Number(form.duration || 45),
      generate_value: Number(form.generate_value || 8),
      generate_unit: form.generate_unit,
      record_enabled: !!form.record_enabled,
      join_url: urlProviders.includes(form.provider) ? form.join_url.trim() : undefined,
      moderator_url: urlProviders.includes(form.provider) ? form.moderator_url.trim() : undefined,
      password: urlProviders.includes(form.provider) ? (form.password.trim() || undefined) : undefined,
      external_ref: urlProviders.includes(form.provider) ? (form.external_ref.trim() || undefined) : undefined,
      location: form.provider === 'offline' ? form.location.trim() : undefined,
      notes: form.notes.trim() || undefined,
    };

    void createMutation.mutateAsync(payload)
      .then(() => close())
      .catch((error: unknown) => {
        toast({
          title: 'Save failed',
          description: error instanceof Error ? error.message : 'Failed to save',
          variant: 'destructive',
        });
      });
  };

  return (
    <CrudPage<TeacherMeetingSeriesRow>
      title={t('nav.meetingSeries')}
      description="Manage weekly series (recurrence templates) for your sections."
      columns={columns}
      data={rows}
      searchKeys={['topic', 'provider']}
      canEdit={false}
      renderForm={(item, onClose) => (
        <FormDialog
          open
          onClose={onClose}
          title="Add Weekly Series"
          onSubmit={(e) => submit(e, onClose)}
          loading={createMutation.isPending}
        >
          <div className="space-y-4">
            <FormField label="Section" id="meeting-series-section" required>
              <FormSelect
                id="meeting-series-section"
                value={form.section_id ?? ''}
                onChange={(e) => setForm(f => ({ ...f, section_id: Number(e.target.value) }))}
              >
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </FormSelect>
            </FormField>

            <FormField label={t('col.title')} id="meeting-series-topic" required>
              <FormInput
                id="meeting-series-topic"
                value={form.topic}
                onChange={(e) => setForm(f => ({ ...f, topic: e.target.value }))}
                required
              />
            </FormField>

            <FormField label="Provider" id="meeting-series-provider" required>
              <FormSelect
                id="meeting-series-provider"
                value={form.provider}
                onChange={(e) => setForm(f => ({ ...f, provider: e.target.value as MeetingSeriesProvider }))}
              >
                <option value="jitsi">Jitsi (free)</option>
                <option value="livekit">LiveKit</option>
                <option value="zoom">Zoom</option>
                <option value="microsoft_teams">Microsoft Teams</option>
                <option value="google_meet">Google Meet</option>
                <option value="external">External link</option>
                <option value="offline">Offline</option>
              </FormSelect>
            </FormField>
            <ProviderGuidance provider={form.provider} t={t} />

            <FormField label="Weekly days" id="meeting-series-weekdays" required>
              <div className="flex flex-wrap gap-3">
                {weekDays.map(d => (
                  <label key={d.value} className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.week_days.includes(d.value)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm(f => ({
                          ...f,
                          week_days: checked ? Array.from(new Set([...f.week_days, d.value])) : f.week_days.filter(x => x !== d.value),
                        }));
                      }}
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Start date" id="meeting-series-start-date" required>
                <FormInput
                  id="meeting-series-start-date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label="End date (optional)" id="meeting-series-end-date">
                <FormInput
                  id="meeting-series-end-date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Start time" id="meeting-series-start-time" required>
                <FormInput
                  id="meeting-series-start-time"
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm(f => ({ ...f, start_time: e.target.value }))}
                  required
                />
              </FormField>
              <FormField label={t('col.durationMinutes')} id="meeting-series-duration" required>
                <FormInput
                  id="meeting-series-duration"
                  type="number"
                  min={15}
                  max={480}
                  value={form.duration}
                  onChange={(e) => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                  required
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Generate sessions for" id="meeting-series-generate-value" required>
                <FormInput
                  id="meeting-series-generate-value"
                  type="number"
                  min={1}
                  max={24}
                  value={form.generate_value}
                  onChange={(e) => setForm(f => ({ ...f, generate_value: Number(e.target.value) }))}
                  required
                />
              </FormField>
              <FormField label="Generate unit" id="meeting-series-generate-unit" required>
                <FormSelect
                  id="meeting-series-generate-unit"
                  value={form.generate_unit}
                  onChange={(e) => setForm(f => ({ ...f, generate_unit: e.target.value as 'weeks' | 'months' }))}
                >
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </FormSelect>
              </FormField>
            </div>

            {form.provider === 'livekit' && (
              <FormField label="Allow recording" id="meeting-series-record">
                <div className="flex items-center gap-2">
                  <input
                    id="meeting-series-record"
                    type="checkbox"
                    checked={form.record_enabled}
                    onChange={(e) => setForm(f => ({ ...f, record_enabled: e.target.checked }))}
                  />
                  <span className="text-sm text-muted-foreground">Only applies to LiveKit meetings.</span>
                </div>
              </FormField>
            )}

            {urlProviders.includes(form.provider) && (
              <>
                <FormField label="Student join URL" id="meeting-series-join-url" required>
                  <FormTextarea
                    id="meeting-series-join-url"
                    value={form.join_url}
                    onChange={(e) => setForm(f => ({ ...f, join_url: e.target.value }))}
                    required
                  />
                </FormField>
                <FormField label="Host / moderator URL" id="meeting-series-moderator-url">
                  <FormTextarea
                    id="meeting-series-moderator-url"
                    value={form.moderator_url}
                    onChange={(e) => setForm(f => ({ ...f, moderator_url: e.target.value }))}
                  />
                </FormField>
                <FormField label="Password (optional)" id="meeting-series-password">
                  <FormInput
                    id="meeting-series-password"
                    value={form.password}
                    onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                </FormField>
                <FormField label="External reference" id="meeting-series-external-ref">
                  <FormInput
                    id="meeting-series-external-ref"
                    value={form.external_ref}
                    onChange={(e) => setForm(f => ({ ...f, external_ref: e.target.value }))}
                  />
                </FormField>
              </>
            )}

            {form.provider === 'offline' && (
              <>
                <FormField label="Location" id="meeting-series-location" required>
                  <FormInput
                    id="meeting-series-location"
                    value={form.location}
                    onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                    required
                  />
                </FormField>
                <FormField label="Notes" id="meeting-series-notes">
                  <FormTextarea
                    id="meeting-series-notes"
                    value={form.notes}
                    onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </FormField>
              </>
            )}
          </div>
        </FormDialog>
      )}
      onDelete={(item) => { void deleteMutation.mutateAsync(item.id); }}
    />
  );
}


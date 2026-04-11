import { useMemo, useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminMeetingSeriesApi, type AdminMeetingSeriesPayload, type AdminMeetingSeriesRow } from '@/services/endpoints/admin-meeting-series';
import type { MeetingSeriesProvider } from '@/services/endpoints/teacher-meeting-series';
import { toast } from '@/hooks/use-toast';

const weekDays = [
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
  { value: 7, label: 'Sun' },
];

export default function AdminMeetingSeries() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const urlProviders: MeetingSeriesProvider[] = ['external', 'zoom', 'microsoft_teams', 'google_meet'];

  const { data } = useQuery({
    queryKey: ['admin-meeting-series'],
    queryFn: () => adminMeetingSeriesApi.list(),
  });

  const rows = (data?.series || []) as AdminMeetingSeriesRow[];
  const teachers = data?.teachers || [];
  const sectionsByTeacher = useMemo(() => data?.sections_by_teacher || {}, [data?.sections_by_teacher]);

  const [form, setForm] = useState({
    teacher_id: 0,
    section_id: 0,
    topic: '',
    provider: 'jitsi' as MeetingSeriesProvider,
    week_days: [1],
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
    start_time: '10:00',
    duration: 45,
    generate_value: 8,
    generate_unit: 'weeks' as 'weeks' | 'months',
    record_enabled: false,
    join_url: '',
    moderator_url: '',
    password: '',
    external_ref: '',
    location: '',
    notes: '',
  });

  const sections = useMemo(() => sectionsByTeacher[String(form.teacher_id)] || [], [sectionsByTeacher, form.teacher_id]);

  const createMutation = useMutation({
    mutationFn: async (payload: AdminMeetingSeriesPayload) => adminMeetingSeriesApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-meeting-series'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => adminMeetingSeriesApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-meeting-series'] });
    },
  });

  const columns: CrudColumn<AdminMeetingSeriesRow>[] = [
    { key: 'topic', label: t('col.title'), sortable: true },
    { key: 'teacher_name', label: t('col.teacher') },
    { key: 'section_name', label: t('col.section') },
    { key: 'provider', label: 'Provider' },
    { key: 'start_date', label: t('col.startDate'), sortable: true },
    { key: 'start_time', label: 'Start Time' },
    { key: 'duration', label: t('col.durationMinutes'), render: (r) => `${r.duration} min` },
  ];

  const onSubmit = (e: React.FormEvent, onClose: () => void) => {
    e.preventDefault();
    if (!form.teacher_id || !form.section_id || !form.topic.trim()) {
      toast({ title: 'Validation error', description: 'Teacher, section, and topic are required.', variant: 'destructive' });
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
    const payload: AdminMeetingSeriesPayload = {
      teacher_id: form.teacher_id,
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

    void createMutation.mutateAsync(payload).then(() => onClose()).catch((error: unknown) => {
      toast({ title: 'Save failed', description: error instanceof Error ? error.message : 'Failed to save', variant: 'destructive' });
    });
  };

  return (
    <CrudPage<AdminMeetingSeriesRow>
      title={t('nav.meetingSeriesAdmin')}
      description="Create and manage weekly series by teacher and section."
      columns={columns}
      data={rows}
      searchKeys={['topic', 'teacher_name', 'section_name', 'provider']}
      canEdit={false}
      onDelete={(item) => { void deleteMutation.mutateAsync(item.id); }}
      renderForm={(_, onClose) => (
        <FormDialog open onClose={onClose} title="Add Weekly Series (Admin)" onSubmit={(e) => onSubmit(e, onClose)} loading={createMutation.isPending}>
          <div className="space-y-4">
            <FormField label={t('col.teacher')} id="admin-series-teacher" required>
              <FormSelect
                id="admin-series-teacher"
                value={form.teacher_id || ''}
                onChange={(e) => {
                  const teacherId = Number(e.target.value);
                  const teacherSections = sectionsByTeacher[String(teacherId)] || [];
                  setForm((f) => ({ ...f, teacher_id: teacherId, section_id: teacherSections[0]?.id || 0 }));
                }}
              >
                <option value="">Select teacher</option>
                {teachers.map((tRow) => <option key={tRow.id} value={tRow.id}>{tRow.name}</option>)}
              </FormSelect>
            </FormField>

            <FormField label={t('col.section')} id="admin-series-section" required>
              <FormSelect id="admin-series-section" value={form.section_id || ''} onChange={(e) => setForm((f) => ({ ...f, section_id: Number(e.target.value) }))}>
                <option value="">Select section</option>
                {sections.map((s: { id: number; name: string }) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </FormSelect>
            </FormField>

            <FormField label={t('col.title')} id="admin-series-topic" required>
              <FormInput id="admin-series-topic" value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} />
            </FormField>

            <FormField label="Provider" id="admin-series-provider" required>
              <FormSelect id="admin-series-provider" value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value as MeetingSeriesProvider }))}>
                <option value="jitsi">Jitsi</option>
                <option value="livekit">LiveKit</option>
                <option value="zoom">Zoom</option>
                <option value="microsoft_teams">Microsoft Teams</option>
                <option value="google_meet">Google Meet</option>
                <option value="external">External link</option>
                <option value="offline">Offline</option>
              </FormSelect>
            </FormField>

            <FormField label="Weekly days" id="admin-series-weekdays" required>
              <div className="flex flex-wrap gap-3">
                {weekDays.map((d) => (
                  <label key={d.value} className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.week_days.includes(d.value)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm((f) => ({ ...f, week_days: checked ? Array.from(new Set([...f.week_days, d.value])) : f.week_days.filter((x) => x !== d.value) }));
                      }}
                    />
                    {d.label}
                  </label>
                ))}
              </div>
            </FormField>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Start date" id="admin-series-start-date" required>
                <FormInput id="admin-series-start-date" type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
              </FormField>
              <FormField label="End date (optional)" id="admin-series-end-date">
                <FormInput id="admin-series-end-date" type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Start time" id="admin-series-start-time" required>
                <FormInput id="admin-series-start-time" type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
              </FormField>
              <FormField label={t('col.durationMinutes')} id="admin-series-duration" required>
                <FormInput id="admin-series-duration" type="number" min={15} max={480} value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Generate sessions for" id="admin-series-generate-value" required>
                <FormInput id="admin-series-generate-value" type="number" min={1} max={24} value={form.generate_value} onChange={(e) => setForm((f) => ({ ...f, generate_value: Number(e.target.value) }))} />
              </FormField>
              <FormField label="Generate unit" id="admin-series-generate-unit" required>
                <FormSelect id="admin-series-generate-unit" value={form.generate_unit} onChange={(e) => setForm((f) => ({ ...f, generate_unit: e.target.value as 'weeks' | 'months' }))}>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </FormSelect>
              </FormField>
            </div>

            {urlProviders.includes(form.provider) && (
              <>
                <FormField label="Student join URL" id="admin-series-join-url" required>
                  <FormTextarea id="admin-series-join-url" value={form.join_url} onChange={(e) => setForm((f) => ({ ...f, join_url: e.target.value }))} />
                </FormField>
                <FormField label="Host / moderator URL" id="admin-series-mod-url">
                  <FormTextarea id="admin-series-mod-url" value={form.moderator_url} onChange={(e) => setForm((f) => ({ ...f, moderator_url: e.target.value }))} />
                </FormField>
              </>
            )}

            {form.provider === 'offline' && (
              <FormField label="Location" id="admin-series-location" required>
                <FormInput id="admin-series-location" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
              </FormField>
            )}
          </div>
        </FormDialog>
      )}
    />
  );
}


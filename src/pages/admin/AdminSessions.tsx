import { useMemo, useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useAdminScopeFilters } from '@/hooks/use-admin-scope-filters';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminSessionsApi,
  type AdminSessionRow,
  type AdminSessionSavePayload,
} from '@/services/endpoints/admin-sessions';
import type { SessionOnlineProvider } from '@/services/endpoints/session-types';
import SessionProviderPicker, { type SessionProviderValue } from '@/components/admin/SessionProviderPicker';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const urlProviders: SessionOnlineProvider[] = ['external', 'zoom', 'microsoft_teams', 'google_meet'];

function errMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error && 'message' in error) return String((error as { message: unknown }).message);
  return 'Request failed';
}

interface BootstrapSection {
  id: number;
  name: string;
  class_id: number;
  grade_id: number;
}

interface BootstrapGrade {
  id: number;
  name: string;
}

interface BootstrapClass {
  id: number;
  name: string;
  grade_id: number;
}

function SessionShowDialog({ item, onClose }: { item: AdminSessionRow; onClose: () => void }) {
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
            <strong>{t('col.provider')}:</strong> {item.provider}
          </p>
          {item.provider === 'offline' ? (
            <>
              <p>
                <strong>{t('col.location')}:</strong> {item.location || '—'}
              </p>
              <p>
                <strong>{t('col.notes')}:</strong> {item.notes || '—'}
              </p>
            </>
          ) : (
            <p>
              <strong>{t('col.joinUrl')}:</strong> {item.join_url || '—'}
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

function SessionForm({
  item,
  sections,
  sectionLabel,
  onClose,
  onSave,
  saving,
}: {
  item: AdminSessionRow | null;
  sections: BootstrapSection[];
  sectionLabel: (s: BootstrapSection) => string;
  onClose: () => void;
  onSave: (payload: AdminSessionSavePayload, id?: number) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    section_id: item?.section_id || sections[0]?.id || 0,
    topic: item?.topic || '',
    start_at: item?.start_at ? String(item.start_at).slice(0, 16) : '',
    duration: item?.duration || 45,
    provider: (item?.provider || 'jitsi') as SessionProviderValue,
    join_url: item?.join_url && item.join_url !== '#' ? item.join_url : '',
    moderator_url: item?.moderator_url || '',
    password: item?.password || '',
    external_ref: item?.external_ref || '',
    location: item?.location || '',
    notes: item?.notes || '',
    record_enabled: item?.record_enabled ?? false,
  });

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
      toast({ title: 'Validation error', description: 'Location is required for offline sessions.', variant: 'destructive' });
      return;
    }

    const payload: AdminSessionSavePayload = {
      section_id: form.section_id,
      topic: form.topic.trim(),
      start_at: form.start_at,
      duration: Number(form.duration || 45),
      provider: form.provider,
      record_enabled: form.record_enabled,
      join_url: urlProviders.includes(form.provider) ? form.join_url.trim() : undefined,
      moderator_url: urlProviders.includes(form.provider) ? form.moderator_url.trim() || undefined : undefined,
      password: form.password.trim() || undefined,
      external_ref: urlProviders.includes(form.provider) ? form.external_ref.trim() || undefined : undefined,
      location: form.provider === 'offline' ? form.location.trim() : form.location.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };

    try {
      await onSave(payload, item?.id);
      toast({ title: item ? t('crud.edit') : t('crud.addNew'), description: form.topic.trim() });
      onClose();
    } catch (error: unknown) {
      toast({ title: 'Save failed', description: errMessage(error), variant: 'destructive' });
    }
  };

  return (
    <FormDialog
      open
      onClose={onClose}
      title={item ? `${t('crud.edit')} — ${t('nav.adminSessions')}` : `${t('crud.addNew')} — ${t('nav.adminSessions')}`}
      onSubmit={submit}
      loading={saving}
    >
      <FormField label={t('col.section')} id="adm-meet-section" required>
        <FormSelect
          id="adm-meet-section"
          title={t('col.section')}
          value={form.section_id || ''}
          onChange={e => {
            const sid = Number(e.target.value);
            setForm(f => ({ ...f, section_id: sid }));
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

      <FormField label={t('col.title')} id="adm-meet-topic" required>
        <FormInput id="adm-meet-topic" value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} required maxLength={255} />
      </FormField>

      <FormField label={t('col.startDate')} id="adm-meet-start" required>
        <FormInput
          id="adm-meet-start"
          type="datetime-local"
          value={form.start_at}
          onChange={e => setForm(f => ({ ...f, start_at: e.target.value }))}
          required
        />
      </FormField>

      <FormField label={t('col.durationMinutes')} id="adm-meet-duration" required>
        <FormInput
          id="adm-meet-duration"
          type="number"
          min={15}
          max={480}
          value={form.duration}
          onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
          required
        />
      </FormField>

      <FormField label={t('col.provider')} id="adm-meet-provider" required>
        <SessionProviderPicker
          id="adm-meet-provider"
          value={form.provider}
          onChange={provider => setForm(f => ({ ...f, provider }))}
        />
      </FormField>

	{form.provider === 'livekit' && (
	<>
	<FormField label="Recording (LiveKit)" id="adm-meet-rec">
	<FormSelect
		id="adm-meet-rec"
		value={form.record_enabled ? '1' : '0'}
		onChange={e => setForm(f => ({ ...f, record_enabled: e.target.value === '1' }))}
	>
		<option value="0">No</option>
		<option value="1">Yes</option>
	</FormSelect>
	</FormField>
	      </>
	      )}


      {urlProviders.includes(form.provider) && (
        <>
          <FormField label="Join URL" id="adm-meet-join" required>
            <FormTextarea id="adm-meet-join" value={form.join_url} onChange={e => setForm(f => ({ ...f, join_url: e.target.value }))} required />
          </FormField>
          <FormField label="Moderator URL" id="adm-meet-mod">
            <FormInput id="adm-meet-mod" value={form.moderator_url} onChange={e => setForm(f => ({ ...f, moderator_url: e.target.value }))} />
          </FormField>
        </>
      )}

      {form.provider === 'offline' && (
        <>
          <FormField label="Location" id="adm-meet-loc" required>
            <FormTextarea id="adm-meet-loc" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} required />
          </FormField>
          <FormField label="Notes" id="adm-meet-notes">
            <FormTextarea id="adm-meet-notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </FormField>
        </>
      )}

      {(form.provider === 'jitsi' || form.provider === 'livekit') && (
        <FormField label="Password (optional)" id="adm-meet-pw">
          <FormInput id="adm-meet-pw" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </FormField>
      )}
    </FormDialog>
  );
}

export default function AdminSessions() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data: boot } = useAdminBootstrap();
  const [showItem, setShowItem] = useState<AdminSessionRow | null>(null);

  const { data } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: () => adminSessionsApi.list(),
  });

  const grades = (boot?.grades || []) as BootstrapGrade[];
  const classes = (boot?.classes || []) as BootstrapClass[];
  const sections = (boot?.sections || []) as BootstrapSection[];

  const sectionLabel = useMemo(
    () => (s: BootstrapSection) => {
      const g = grades.find(x => x.id === s.grade_id)?.name;
      const c = classes.find(x => x.id === s.class_id)?.name;
      return [g, c, s.name].filter(Boolean).join(' — ');
    },
    [grades, classes],
  );

  const rows = data?.sessions || [];

  const {
    gradeFilter,
    classFilter,
    sectionFilter,
    dateFilter,
    setDateFilter,
    setSectionFilter,
    grades: gradeOptions,
    classesByGrade,
    sectionsByClass,
    filteredRows,
    appliedCount,
    clearFilters,
    handleGradeChange,
    handleClassChange,
  } = useAdminScopeFilters(grades, classes, sections, rows, row => row.start_at);

  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: AdminSessionSavePayload; id?: number }) =>
      id ? adminSessionsApi.update(id, payload) : adminSessionsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminSessionsApi.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
    },
  });

  const columns: CrudColumn<AdminSessionRow>[] = [
    { key: 'topic', label: t('col.title'), sortable: true },
    { key: 'section_label', label: t('col.section'), sortable: true },
    { key: 'start_at', label: t('col.startDate'), sortable: true },
    { key: 'duration', label: t('col.durationMinutes'), render: r => `${r.duration} min` },
    { key: 'provider', label: t('col.provider'), sortable: true },
    {
      key: '_join',
      label: t('sessions.join'),
      render: r => {
        if (r.provider === 'offline') {
          return <span className="text-xs text-muted-foreground">{r.location || 'Offline'}</span>;
        }
        if (r.join_url && r.join_url !== '#') {
          return (
            <a className="text-primary underline text-xs" href={r.join_url} target="_blank" rel="noreferrer">
              {t('sessions.join')}
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
      <CrudPage<AdminSessionRow>
        title={t('nav.adminSessions')}
        description={t('page.adminSessions.desc')}
        columns={columns}
        data={filteredRows}
        canCreate={sections.length > 0}
        searchKeys={['topic', 'section_label', 'start_at', 'provider', 'created_by']}
        topContent={(
          <AdminScopeFilterBar
            grades={gradeOptions}
            classesByGrade={classesByGrade}
            sectionsByClass={sectionsByClass}
            gradeFilter={gradeFilter}
            classFilter={classFilter}
            sectionFilter={sectionFilter}
            dateFilter={dateFilter}
            showDate
            dateLabel={t('col.startDate')}
            onGradeChange={handleGradeChange}
            onClassChange={handleClassChange}
            onSectionChange={setSectionFilter}
            onDateChange={setDateFilter}
            appliedCount={appliedCount}
            onClear={clearFilters}
            resultCount={filteredRows.length}
          />
        )}
        renderForm={(item, onClose) => {
          const formSections =
            sections.length > 0
              ? sections
              : item
                ? [
                    {
                      id: item.section_id,
                      name: item.section_label || `Section ${item.section_id}`,
                      grade_id: item.grade_id,
                      class_id: item.class_id,
                    },
                  ]
                : [];
          return (
            <SessionForm
              item={item}
              sections={formSections}
              sectionLabel={sectionLabel}
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
      {showItem && <SessionShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}

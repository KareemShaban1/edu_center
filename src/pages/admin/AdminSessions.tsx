import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarClock,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  Edit,
  Eye,
  FoldVertical,
  GraduationCap,
  LayoutGrid,
  MapPin,
  MonitorPlay,
  Plus,
  QrCode,
  Search,
  Settings,
  Trash2,
  UnfoldVertical,
  Video,
} from 'lucide-react';
import AdminScopeFilterBar from '@/components/admin/AdminScopeFilterBar';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import DashboardLayout from '@/components/DashboardLayout';
import TableLoading from '@/components/TableLoading';
import DeleteDialog from '@/components/DeleteDialog';
import SessionProviderPicker, { type SessionProviderValue } from '@/components/admin/SessionProviderPicker';
import SessionSectionSelect from '@/components/admin/SessionSectionSelect';
import SessionAttendanceQrDialog from '@/components/SessionAttendanceQrDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { useAdminScopeFilters } from '@/hooks/use-admin-scope-filters';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminSessionsApi,
  type AdminSessionRow,
  type AdminSessionSavePayload,
} from '@/services/endpoints/admin-sessions';
import { adminSettingsApi } from '@/services/endpoints/admin-settings';
import type { SessionOnlineProvider } from '@/services/endpoints/session-types';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { weekDayFromStartAt, weekDayLabel } from '@/lib/section-week-days';

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

function isSessionPast(startAt?: string | null): boolean {
  if (!startAt) return false;
  const ts = Date.parse(String(startAt).replace(' ', 'T'));
  if (Number.isNaN(ts)) return false;
  return ts < Date.now();
}

function sessionProviderLabel(provider: string | null | undefined, t: (key: string) => string): string {
  if (!provider || provider === 'offline') return t('session.type.offline');
  if (provider === 'jitsi') return 'Jitsi';
  if (provider === 'livekit') return 'LiveKit';
  if (provider === 'zoom') return 'Zoom';
  if (provider === 'microsoft_teams') return 'Teams';
  if (provider === 'google_meet') return 'Meet';
  if (provider === 'external') return t('session.type.online');
  return provider;
}

function formatSessionWhen(startAt: string, t: (key: string) => string): string {
  const day = weekDayFromStartAt(startAt);
  const dayLabel = day ? weekDayLabel(day, t) : '';
  const raw = String(startAt);
  const datePart = raw.slice(0, 10);
  const timePart = raw.includes('T') ? raw.slice(11, 16) : raw.slice(11, 16);
  return [dayLabel, datePart, timePart].filter(Boolean).join(' · ');
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
            <strong>{t('col.weekday')}:</strong>{' '}
            {(() => {
              const day = weekDayFromStartAt(item.start_at);
              return day ? weekDayLabel(day, t) : '—';
            })()}
          </p>
          <p>
            <strong>{t('col.durationMinutes')}:</strong> {item.duration}
          </p>
          <p>
            <strong>{t('col.provider')}:</strong> {sessionProviderLabel(item.provider, t)}
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
  grades,
  classes,
  existingSessions,
  defaultDuration,
  defaultLocation,
  onClose,
  onSave,
  saving,
}: {
  item: AdminSessionRow | null;
  sections: BootstrapSection[];
  grades: BootstrapGrade[];
  classes: BootstrapClass[];
  existingSessions: AdminSessionRow[];
  defaultDuration: number;
  defaultLocation: string;
  onClose: () => void;
  onSave: (payload: AdminSessionSavePayload, id?: number) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState({
    section_id: item?.section_id || 0,
    topic: item?.topic || '',
    start_at: item?.start_at ? String(item.start_at).slice(0, 16) : '',
    duration: item?.duration || defaultDuration,
    provider: (item?.provider || 'jitsi') as SessionProviderValue,
    join_url: item?.join_url && item.join_url !== '#' ? item.join_url : '',
    moderator_url: item?.moderator_url || '',
    password: item?.password || '',
    external_ref: item?.external_ref || '',
    location: item?.location || defaultLocation,
    notes: item?.notes || '',
    record_enabled: item?.record_enabled ?? false,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.section_id || !form.topic.trim() || !form.start_at) {
      toast({ title: 'Validation error', description: 'Section, topic, and start time are required.', variant: 'destructive' });
      return;
    }
    const sessionDate = String(form.start_at).slice(0, 10);
    const duplicate = existingSessions.some(session => (
      session.section_id === form.section_id
      && String(session.start_at).slice(0, 10) === sessionDate
      && session.id !== item?.id
    ));
    if (duplicate) {
      toast({ title: 'Validation error', description: t('page.adminSessions.duplicateSameDay'), variant: 'destructive' });
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
      duration: Number(form.duration || defaultDuration),
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
        <SessionSectionSelect
          id="adm-meet-section"
          sections={sections}
          grades={grades}
          classes={classes}
          value={form.section_id}
          onChange={sectionId => setForm(f => ({ ...f, section_id: sectionId }))}
        />
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
          onChange={provider => setForm(f => ({
            ...f,
            provider,
            location: provider === 'offline' && !f.location.trim() ? defaultLocation : f.location,
          }))}
        />
      </FormField>

      {form.provider === 'livekit' && (
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
  const { data: boot, isLoading: bootLoading } = useAdminBootstrap();
  const [search, setSearch] = useState('');
  const [showItem, setShowItem] = useState<AdminSessionRow | null>(null);
  const [qrItem, setQrItem] = useState<AdminSessionRow | null>(null);
  const [editItem, setEditItem] = useState<AdminSessionRow | null | 'new'>(null);
  const [deleteItem, setDeleteItem] = useState<AdminSessionRow | null>(null);
  const [expandedGrades, setExpandedGrades] = useState<Set<number>>(new Set());
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(new Set());

  const { data, isLoading: sessionsLoading } = useQuery({
    queryKey: ['admin-sessions'],
    queryFn: () => adminSessionsApi.list(),
  });

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminSettingsApi.get(),
  });

  const grades = (boot?.grades || []) as BootstrapGrade[];
  const classes = (boot?.classes || []) as BootstrapClass[];
  const sections = (boot?.sections || []) as BootstrapSection[];
  const rows = data?.sessions || [];
  const isLoading = bootLoading || sessionsLoading;

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
    filteredRows: scopeFilteredRows,
    appliedCount,
    clearFilters,
    handleGradeChange,
    handleClassChange,
  } = useAdminScopeFilters(grades, classes, sections, rows, row => row.start_at);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = scopeFilteredRows;
    if (q) {
      list = list.filter(item => {
        const gradeName = grades.find(g => g.id === item.grade_id)?.name ?? '';
        const className = classes.find(c => c.id === item.class_id)?.name ?? '';
        const provider = sessionProviderLabel(item.provider, t);
        const weekday = weekDayFromStartAt(item.start_at);
        const weekdayText = weekday ? weekDayLabel(weekday, t) : '';
        return [
          item.topic,
          item.section_label,
          item.start_at,
          item.provider,
          provider,
          item.location,
          item.notes,
          gradeName,
          className,
          weekdayText,
        ].some(value => String(value || '').toLowerCase().includes(q));
      });
    }
    return [...list].sort((a, b) => {
      const aTime = Date.parse(String(a.start_at).replace(' ', 'T')) || 0;
      const bTime = Date.parse(String(b.start_at).replace(' ', 'T')) || 0;
      if (bTime !== aTime) return bTime - aTime;
      return b.id - a.id;
    });
  }, [scopeFilteredRows, search, grades, classes, t]);

  const grouped = useMemo(() => {
    const map = new Map<number, Map<number, AdminSessionRow[]>>();
    for (const item of filteredRows) {
      const gradeId = item.grade_id ?? 0;
      const classId = item.class_id ?? 0;
      if (!map.has(gradeId)) map.set(gradeId, new Map());
      const classMap = map.get(gradeId)!;
      if (!classMap.has(classId)) classMap.set(classId, []);
      classMap.get(classId)!.push(item);
    }
    return map;
  }, [filteredRows]);

  const visibleGrades = useMemo(() => {
    const list = gradeFilter ? grades.filter(g => g.id === Number(gradeFilter)) : [...grades];
    return list
      .filter(g => grouped.get(g.id) && Array.from(grouped.get(g.id)!.values()).some(arr => arr.length > 0))
      .sort((a, b) => {
        const aMax = Math.max(0, ...(grouped.get(a.id) ? Array.from(grouped.get(a.id)!.values()).flat().map(i => i.id) : [0]));
        const bMax = Math.max(0, ...(grouped.get(b.id) ? Array.from(grouped.get(b.id)!.values()).flat().map(i => i.id) : [0]));
        if (bMax !== aMax) return bMax - aMax;
        return b.id - a.id;
      });
  }, [grades, gradeFilter, grouped]);

  const statTotal = filteredRows.length;
  const statUpcoming = useMemo(() => filteredRows.filter(s => !isSessionPast(s.start_at)).length, [filteredRows]);
  const statOffline = useMemo(() => filteredRows.filter(s => !s.provider || s.provider === 'offline').length, [filteredRows]);

  const expandAll = useCallback(() => {
    setExpandedGrades(new Set(grades.map(g => g.id)));
    const keys = new Set<string>();
    classes.forEach(cls => keys.add(`${cls.grade_id}-${cls.id}`));
    setExpandedClasses(keys);
  }, [grades, classes]);

  const collapseAll = useCallback(() => {
    setExpandedGrades(new Set());
    setExpandedClasses(new Set());
  }, []);

  useEffect(() => {
    setExpandedGrades(new Set(grades.map(g => g.id)));
    const keys = new Set<string>();
    rows.forEach(item => keys.add(`${item.grade_id}-${item.class_id}`));
    setExpandedClasses(keys);
  }, [grades, rows]);

  useEffect(() => {
    if (!search.trim()) return;
    const gIds = new Set<number>();
    const cKeys = new Set<string>();
    filteredRows.forEach(item => {
      if (item.grade_id) gIds.add(item.grade_id);
      cKeys.add(`${item.grade_id}-${item.class_id}`);
    });
    setExpandedGrades(prev => new Set([...prev, ...gIds]));
    setExpandedClasses(prev => new Set([...prev, ...cKeys]));
  }, [search, filteredRows]);

  const toggleGrade = (id: number) => {
    setExpandedGrades(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleClass = (key: string) => {
    setExpandedClasses(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const visibleClassesForGrade = (gradeId: number, classMap?: Map<number, AdminSessionRow[]>) => {
    const list = classes.filter(c => c.grade_id === gradeId);
    const filtered = classFilter ? list.filter(c => c.id === Number(classFilter)) : list;
    return filtered.slice().sort((a, b) => {
      const aMax = Math.max(0, ...(classMap?.get(a.id) || []).map(i => i.id));
      const bMax = Math.max(0, ...(classMap?.get(b.id) || []).map(i => i.id));
      if (bMax !== aMax) return bMax - aMax;
      return b.id - a.id;
    });
  };

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

  const generateMutation = useMutation({
    mutationFn: () => adminSessionsApi.generate({ force: true }),
    onSuccess: async result => {
      await queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      toast({
        title: t('settings.generateNow'),
        description: t('settings.sessionsGenerated')
          .replace('{created}', String(result.generation.created))
          .replace('{skipped}', String(result.generation.skipped)),
      });
    },
    onError: (error: unknown) => {
      toast({ title: t('settings.generateNow'), description: errMessage(error), variant: 'destructive' });
    },
  });

  const formSectionsFor = (item: AdminSessionRow | null) => (
    sections.length > 0
      ? sections
      : item
        ? [{
            id: item.section_id,
            name: item.section_label || `Section ${item.section_id}`,
            grade_id: item.grade_id,
            class_id: item.class_id,
          }]
        : []
  );

  return (
    <DashboardLayout>
      <div className="page-header flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="page-title">{t('nav.adminSessions')}</h1>
          <p className="page-description">{t('page.adminSessions.desc')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button asChild variant="outline" size="sm" className="gap-1.5">
            <Link to="/admin/settings">
              <Settings className="h-4 w-4" />
              {t('nav.settings')}
            </Link>
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-1.5"
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            <CalendarPlus className="h-4 w-4" />
            {generateMutation.isPending ? t('common.loading') : t('settings.generateNow')}
          </Button>
          <Button
            onClick={() => setEditItem('new')}
            className="gap-2"
            disabled={sections.length === 0}
          >
            <Plus className="h-4 w-4" /> {t('crud.addNew')}
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{statTotal}</p>
              <p className="text-xs text-muted-foreground">{t('page.adminSessions.statTotal')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Video className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{statUpcoming}</p>
              <p className="text-xs text-muted-foreground">{t('page.adminSessions.statUpcoming')}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/80 shadow-card">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-display text-2xl font-semibold tabular-nums">{statOffline}</p>
              <p className="text-xs text-muted-foreground">{t('page.adminSessions.statOffline')}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {settings?.auto_generate_sessions ? (
        <p className="mb-4 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {t('settings.autoSessionsDesc')} ({settings.auto_session_days_ahead} {t('settings.daysAhead').toLowerCase()})
        </p>
      ) : null}

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

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
          <Input
            className="ps-9"
            placeholder={t('page.adminSessions.searchPlaceholder')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label={t('page.adminSessions.searchPlaceholder')}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={expandAll}>
            <UnfoldVertical className="h-3.5 w-3.5" />
            {t('page.sectionsAdmin.expandAll')}
          </Button>
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={collapseAll}>
            <FoldVertical className="h-3.5 w-3.5" />
            {t('page.sectionsAdmin.collapseAll')}
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {isLoading ? (
          <Card className="border-border/80 shadow-card">
            <CardContent>
              <TableLoading />
            </CardContent>
          </Card>
        ) : visibleGrades.length === 0 ? (
          <Card className="border-dashed border-border bg-muted/20">
            <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <LayoutGrid className="h-10 w-10 text-muted-foreground/40" />
              <p className="max-w-sm text-sm text-muted-foreground">
                {search.trim() || appliedCount > 0
                  ? t('page.adminSessions.emptySearch')
                  : t('page.adminSessions.noItemsYet')}
              </p>
              {!search.trim() && appliedCount === 0 && sections.length > 0 && (
                <Button variant="secondary" size="sm" className="mt-2 gap-1.5" onClick={() => setEditItem('new')}>
                  <Plus className="h-4 w-4" />
                  {t('crud.addNew')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          visibleGrades.map(grade => {
            const classMap = grouped.get(grade.id);
            const gradeExpanded = expandedGrades.has(grade.id);
            const itemCount = classMap
              ? Array.from(classMap.values()).reduce((a, b) => a + b.length, 0)
              : 0;

            return (
              <section
                key={grade.id}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card"
              >
                <button
                  type="button"
                  onClick={() => toggleGrade(grade.id)}
                  className="flex w-full items-center gap-3 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent px-4 py-4 text-start transition-colors hover:from-primary/20"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                    <GraduationCap className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('col.grade')}</p>
                    <h2 className="font-display text-lg font-semibold leading-tight">{grade.name}</h2>
                  </div>
                  <Badge variant="secondary" className="shrink-0 font-medium tabular-nums">
                    {itemCount}
                  </Badge>
                  {gradeExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </button>

                {gradeExpanded && (
                  <div className="space-y-4 p-4">
                    {visibleClassesForGrade(grade.id, classMap).map(cls => {
                      const classItems = classMap?.get(cls.id) || [];
                      const classKey = `${grade.id}-${cls.id}`;
                      const classExpanded = expandedClasses.has(classKey);
                      if (search.trim() && classItems.length === 0) return null;

                      return (
                        <div key={cls.id} className="rounded-xl border border-border/70 bg-muted/20">
                          <button
                            type="button"
                            onClick={() => toggleClass(classKey)}
                            className="flex w-full items-center gap-3 px-3 py-3 text-start transition-colors hover:bg-muted/40"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
                              <BookOpen className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('col.class')}</p>
                              <p className="text-sm font-semibold leading-tight">{cls.name}</p>
                            </div>
                            <span className="text-xs tabular-nums text-muted-foreground">({classItems.length})</span>
                            {classExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            )}
                          </button>

                          {classExpanded && classItems.length > 0 && (
                            <div className="grid gap-3 p-3 pt-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                              {classItems.map(item => {
                                const past = isSessionPast(item.start_at);
                                const offline = !item.provider || item.provider === 'offline';
                                const canDelete = !item.has_related;
                                return (
                                  <article
                                    key={item.id}
                                    className={cn(
                                      'relative flex flex-col overflow-hidden rounded-xl border bg-background p-3 shadow-sm transition-shadow hover:shadow-md',
                                      past ? 'border-border/60 opacity-90' : 'border-border',
                                    )}
                                  >
                                    <span
                                      className={cn(
                                        'absolute inset-x-0 top-0 h-1',
                                        past ? 'bg-muted-foreground/40' : offline ? 'bg-amber-500' : 'bg-sky-500',
                                      )}
                                      aria-hidden
                                    />
                                    <div className="mb-3 flex items-start gap-3 pt-1">
                                      <div className={cn(
                                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
                                        offline ? 'bg-amber-500/10 text-amber-600' : 'bg-sky-500/10 text-sky-600',
                                      )}>
                                        {offline ? <MapPin className="h-4 w-4" /> : <MonitorPlay className="h-4 w-4" />}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-display text-sm font-semibold leading-tight line-clamp-2">{item.topic}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">{item.section_label || '—'}</p>
                                      </div>
                                    </div>

                                    <div className="mb-3 space-y-1.5 text-xs text-muted-foreground">
                                      <p className="flex items-center gap-1.5">
                                        <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                                        <span className="line-clamp-2">{formatSessionWhen(item.start_at, t)}</span>
                                      </p>
                                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] tabular-nums">
                                          {item.duration} min
                                        </Badge>
                                        <Badge
                                          variant="secondary"
                                          className={cn(
                                            'h-5 px-1.5 text-[10px]',
                                            offline ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
                                          )}
                                        >
                                          {sessionProviderLabel(item.provider, t)}
                                        </Badge>
                                        {past ? (
                                          <Badge variant="outline" className="h-5 px-1.5 text-[10px] text-muted-foreground">
                                            {t('page.adminSessions.past')}
                                          </Badge>
                                        ) : null}
                                      </div>
                                      {offline && item.location ? (
                                        <p className="line-clamp-1 pt-0.5">{item.location}</p>
                                      ) : null}
                                    </div>

                                    <div className="mt-auto flex items-center justify-between gap-1 border-t border-border/60 pt-2">
                                      <div className="flex items-center gap-0.5">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                              onClick={() => setShowItem(item)}
                                              aria-label={t('crud.view')}
                                            >
                                              <Eye className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>{t('crud.view')}</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                              onClick={() => setQrItem(item)}
                                              aria-label={t('attendanceQr.title')}
                                            >
                                              <QrCode className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>{t('attendanceQr.title')}</TooltipContent>
                                        </Tooltip>
                                      </div>
                                      <div className="flex items-center gap-0.5">
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                              onClick={() => setEditItem(item)}
                                              aria-label={t('crud.edit')}
                                            >
                                              <Edit className="h-4 w-4" />
                                            </Button>
                                          </TooltipTrigger>
                                          <TooltipContent>{t('crud.edit')}</TooltipContent>
                                        </Tooltip>
                                        {canDelete ? (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => setDeleteItem(item)}
                                                aria-label={t('crud.delete')}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>{t('crud.delete')}</TooltipContent>
                                          </Tooltip>
                                        ) : null}
                                      </div>
                                    </div>
                                  </article>
                                );
                              })}
                            </div>
                          )}

                          {classExpanded && classItems.length === 0 && (
                            <p className="px-4 pb-3 text-xs text-muted-foreground">{t('crud.noData')}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })
        )}
      </div>

      {editItem !== null && (
        <SessionForm
          item={editItem === 'new' ? null : editItem}
          sections={formSectionsFor(editItem === 'new' ? null : editItem)}
          grades={grades}
          classes={classes}
          existingSessions={rows}
          defaultDuration={settings?.auto_session_duration || 60}
          defaultLocation={(settings?.auto_session_location || settings?.address || '').trim()}
          onClose={() => setEditItem(null)}
          onSave={async (payload, id) => {
            await saveMutation.mutateAsync({ payload, id });
          }}
          saving={saveMutation.isPending}
        />
      )}

      {deleteItem && (
        <DeleteDialog
          open
          onClose={() => setDeleteItem(null)}
          onConfirm={async () => {
            try {
              await deleteMutation.mutateAsync(deleteItem.id);
              toast({ title: t('crud.deleted'), description: t('crud.deletedDesc') });
            } catch (error: unknown) {
              toast({ title: t('crud.deleteFailed'), description: errMessage(error), variant: 'destructive' });
            } finally {
              setDeleteItem(null);
            }
          }}
          loading={deleteMutation.isPending}
        />
      )}

      {showItem && <SessionShowDialog item={showItem} onClose={() => setShowItem(null)} />}
      {qrItem && (
        <SessionAttendanceQrDialog
          sessionId={qrItem.id}
          topic={qrItem.topic}
          role="admin"
          onClose={() => setQrItem(null)}
        />
      )}
    </DashboardLayout>
  );
}

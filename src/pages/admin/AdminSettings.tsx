import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { adminSettingsApi, type AdminSettings } from '@/services/endpoints/admin-settings';

const emptyForm: AdminSettings = {
  center_name: '',
  center_email: '',
  phone: '',
  address: '',
  current_session: '',
  timezone: 'UTC',
  auto_generate_sessions: false,
  auto_session_days_ahead: 14,
  auto_session_duration: 60,
  auto_session_type: 'offline',
  auto_session_provider: 'offline',
  auto_session_location: '',
};

export default function AdminSettings() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AdminSettings>(emptyForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => adminSettingsApi.get(),
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: (payload: AdminSettings & { generate_now?: boolean }) => adminSettingsApi.update(payload),
    onSuccess: async result => {
      setForm(result.settings);
      await queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      const gen = result.generation;
      toast({
        title: t('section.saveSettings'),
        description: gen
          ? t('settings.sessionsGenerated')
              .replace('{created}', String(gen.created))
              .replace('{skipped}', String(gen.skipped))
          : t('crud.save'),
      });
    },
    onError: (error: Error) => {
      toast({ title: t('crud.save'), description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      ...form,
      generate_now: form.auto_generate_sessions,
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('nav.settings')}</h1>
        <p className="page-description">{t('page.settings.desc')}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <h3 className="font-display font-semibold">{t('section.schoolInfo')}</h3>
          <FormField label={t('section.schoolName')} id="set-name" required>
            <FormInput
              id="set-name"
              value={form.center_name}
              onChange={e => setForm(f => ({ ...f, center_name: e.target.value }))}
              required
              maxLength={200}
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t('section.schoolEmail')} id="set-email">
              <FormInput
                id="set-email"
                type="email"
                value={form.center_email}
                onChange={e => setForm(f => ({ ...f, center_email: e.target.value }))}
                maxLength={255}
              />
            </FormField>
            <FormField label={t('section.schoolPhone')} id="set-phone">
              <FormInput
                id="set-phone"
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                maxLength={20}
              />
            </FormField>
          </div>
          <FormField label={t('col.address') || 'Address'} id="set-address">
            <FormInput
              id="set-address"
              value={form.address}
              onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              maxLength={500}
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t('section.currentYear')} id="set-year">
              <FormInput
                id="set-year"
                value={form.current_session}
                onChange={e => setForm(f => ({ ...f, current_session: e.target.value }))}
                maxLength={50}
              />
            </FormField>
            <FormField label={t('settings.timezone')} id="set-tz">
              <FormSelect
                id="set-tz"
                value={form.timezone}
                onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
              >
                <option value="Africa/Cairo">Africa/Cairo (UTC+2)</option>
                <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">US Eastern</option>
              </FormSelect>
            </FormField>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display font-semibold">{t('settings.autoSessions')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t('settings.autoSessionsDesc')}</p>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Switch
                id="set-auto-sessions"
                checked={form.auto_generate_sessions}
                onCheckedChange={checked => setForm(f => ({ ...f, auto_generate_sessions: checked }))}
              />
              <Label htmlFor="set-auto-sessions" className="text-sm">
                {form.auto_generate_sessions ? t('settings.enabled') : t('settings.disabled')}
              </Label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t('settings.daysAhead')} id="set-days-ahead">
              <FormInput
                id="set-days-ahead"
                type="number"
                min={1}
                max={60}
                value={form.auto_session_days_ahead}
                onChange={e => setForm(f => ({ ...f, auto_session_days_ahead: Number(e.target.value) || 14 }))}
                disabled={!form.auto_generate_sessions}
              />
            </FormField>
            <FormField label={t('col.durationMinutes')} id="set-duration">
              <FormInput
                id="set-duration"
                type="number"
                min={15}
                max={480}
                value={form.auto_session_duration}
                onChange={e => setForm(f => ({ ...f, auto_session_duration: Number(e.target.value) || 60 }))}
                disabled={!form.auto_generate_sessions}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label={t('col.type')} id="set-session-type">
              <FormSelect
                id="set-session-type"
                value={form.auto_session_type}
                onChange={e => {
                  const sessionType = e.target.value as AdminSettings['auto_session_type'];
                  setForm(f => ({
                    ...f,
                    auto_session_type: sessionType,
                    auto_session_provider: sessionType === 'offline' ? 'offline' : f.auto_session_provider === 'offline' ? 'jitsi' : f.auto_session_provider,
                  }));
                }}
                disabled={!form.auto_generate_sessions}
              >
                <option value="offline">{t('sessions.type.offline') || 'Offline'}</option>
                <option value="online">{t('sessions.type.online') || 'Online'}</option>
              </FormSelect>
            </FormField>
            <FormField label={t('col.provider')} id="set-session-provider">
              <FormSelect
                id="set-session-provider"
                value={form.auto_session_provider}
                onChange={e => setForm(f => ({ ...f, auto_session_provider: e.target.value as AdminSettings['auto_session_provider'] }))}
                disabled={!form.auto_generate_sessions || form.auto_session_type === 'offline'}
              >
                <option value="offline">Offline</option>
                <option value="jitsi">Jitsi</option>
                <option value="livekit">LiveKit</option>
              </FormSelect>
            </FormField>
          </div>

          {form.auto_session_type === 'offline' && (
            <FormField label={t('col.location') || 'Location'} id="set-location">
              <FormInput
                id="set-location"
                value={form.auto_session_location}
                onChange={e => setForm(f => ({ ...f, auto_session_location: e.target.value }))}
                disabled={!form.auto_generate_sessions}
                maxLength={2000}
              />
            </FormField>
          )}

          <p className="text-xs text-muted-foreground">{t('settings.autoSessionsHint')}</p>
        </div>

        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? t('common.loading') : t('section.saveSettings')}
        </Button>
      </form>
    </DashboardLayout>
  );
}

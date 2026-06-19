import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { toast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { notificationsApi } from '@/services/endpoints/notifications';
import { Bell, Send } from 'lucide-react';

export default function AdminNotifications() {
  const { t } = useLocale();
  const { data: bootstrap } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;
  const [form, setForm] = useState({
    title: '',
    body: '',
    audience: 'both' as 'students' | 'parents' | 'both',
    grade_id: 0,
    class_id: 0,
    section_id: 0,
    url: '',
    send_push: true,
  });

  const classesByGrade = useMemo(
    () => classes.filter(c => c.grade_id === form.grade_id),
    [classes, form.grade_id],
  );
  const sectionsByClass = useMemo(
    () => sections.filter(s => s.class_id === form.class_id),
    [sections, form.class_id],
  );

  const sendMutation = useMutation({
    mutationFn: () =>
      notificationsApi.adminSend({
        title: form.title.trim(),
        body: form.body.trim(),
        audience: form.audience,
        section_id: form.section_id || null,
        url: form.url.trim() || null,
        send_push: form.send_push,
      }),
    onSuccess: data => {
      toast({
        title: t('notifications.sent'),
        description: `${data.sent.students} students, ${data.sent.parents} parents notified`,
      });
      setForm(f => ({ ...f, title: '', body: '', url: '' }));
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('notifications.sendFailed');
      toast({ title: t('notifications.sendFailed'), description: message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim() || !form.section_id) {
      toast({
        title: t('notifications.validationError'),
        description: t('notifications.validationDesc'),
        variant: 'destructive',
      });
      return;
    }
    sendMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Bell className="h-6 w-6" />
            {t('nav.notifications')}
          </h1>
          <p className="mt-1 text-muted-foreground">{t('page.notifications.desc')}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border bg-card p-6 shadow-sm"
        >
          <FormField label={t('col.title')} id="notif-title" required>
            <FormInput
              id="notif-title"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              maxLength={255}
              required
            />
          </FormField>

          <FormField label={t('col.message')} id="notif-body" required>
            <FormTextarea
              id="notif-body"
              value={form.body}
              onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
              maxLength={2000}
              rows={4}
              required
            />
          </FormField>

          <FormField label={t('notifications.audience')} id="notif-audience" required>
            <FormSelect
              id="notif-audience"
              value={form.audience}
              onChange={e =>
                setForm(f => ({
                  ...f,
                  audience: e.target.value as 'students' | 'parents' | 'both',
                }))
              }
            >
              <option value="students">{t('notifications.audienceStudents')}</option>
              <option value="parents">{t('notifications.audienceParents')}</option>
              <option value="both">{t('notifications.audienceBoth')}</option>
            </FormSelect>
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label={t('col.grade')} id="notif-grade" required>
              <FormSelect
                id="notif-grade"
                value={form.grade_id}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    grade_id: Number(e.target.value),
                    class_id: 0,
                    section_id: 0,
                  }))
                }
              >
                <option value={0}>{t('notifications.selectGrade')}</option>
                {grades.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </FormSelect>
            </FormField>
            <FormField label={t('col.class')} id="notif-class" required>
              <FormSelect
                id="notif-class"
                value={form.class_id}
                disabled={!form.grade_id}
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    class_id: Number(e.target.value),
                    section_id: 0,
                  }))
                }
              >
                <option value={0}>
                  {form.grade_id ? t('notifications.selectClass') : t('notifications.selectGradeFirst')}
                </option>
                {classesByGrade.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </FormSelect>
            </FormField>
            <FormField label={t('col.section')} id="notif-section" required>
              <FormSelect
                id="notif-section"
                value={form.section_id}
                disabled={!form.class_id}
                onChange={e => setForm(f => ({ ...f, section_id: Number(e.target.value) }))}
              >
                <option value={0}>
                  {form.class_id ? t('notifications.selectSection') : t('notifications.selectClassFirst')}
                </option>
                {sectionsByClass.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </FormSelect>
            </FormField>
          </div>

          <FormField label={t('notifications.linkOptional')} id="notif-url">
            <FormInput
              id="notif-url"
              value={form.url}
              onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              placeholder="/student/announcements"
            />
          </FormField>

          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <Label htmlFor="notif-push">{t('notifications.sendPush')}</Label>
              <p className="text-xs text-muted-foreground">{t('notifications.sendPushDesc')}</p>
            </div>
            <Switch
              id="notif-push"
              checked={form.send_push}
              onCheckedChange={checked => setForm(f => ({ ...f, send_push: checked }))}
            />
          </div>

          <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            {t('notifications.autoNote')}
          </div>

          <Button type="submit" disabled={sendMutation.isPending} className="gap-2">
            <Send className="h-4 w-4" />
            {sendMutation.isPending ? t('notifications.sending') : t('notifications.send')}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}

import React, { useMemo, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable from '@/components/DataTable';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/services/endpoints/notifications';
import type { CenterSentNotification } from '@/types/models';
import { Bell, Eye, Plus } from 'lucide-react';

const emptyForm = {
  title: '',
  body: '',
  audience: 'both' as 'students' | 'parents' | 'both',
  grade_id: 0,
  class_id: 0,
  section_id: 0,
  url: '',
  send_push: true,
};

function formatDateTime(value: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function channelLabel(type: string, t: (key: string) => string): string {
  switch (type) {
    case 'manual':
      return t('notifications.channelManual');
    case 'announcement':
      return t('notifications.channelAnnouncement');
    case 'attendance':
      return t('notifications.channelAttendance');
    default:
      return t('notifications.channelGeneral');
  }
}

function audienceLabel(audience: CenterSentNotification['audience'], t: (key: string) => string): string {
  switch (audience) {
    case 'students':
      return t('notifications.audienceStudents');
    case 'parents':
      return t('notifications.audienceParents');
    case 'both':
      return t('notifications.audienceBoth');
    default:
      return '—';
  }
}

function scopeLabel(item: CenterSentNotification): string {
  const parts = [item.grade_name, item.class_name, item.section_name].filter(Boolean);
  return parts.length ? parts.join(' · ') : '—';
}

export default function AdminNotifications() {
  const { t, locale } = useLocale();
  const queryClient = useQueryClient();
  const { data: bootstrap } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;
  const [selected, setSelected] = useState<CenterSentNotification | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['admin-notifications-history'],
    queryFn: () => notificationsApi.adminList(),
  });

  const history = historyData?.notifications ?? [];

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
      setForm(emptyForm);
      setFormOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-notifications-history'] });
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

  const openForm = () => {
    setForm(emptyForm);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (sendMutation.isPending) return;
    setFormOpen(false);
  };

  const columns = useMemo(
    () => [
      {
        key: 'title',
        label: t('col.title'),
        primary: true,
        render: (item: CenterSentNotification) => (
          <div className="space-y-1">
            <p className="font-medium">{item.title || '—'}</p>
            <p className="line-clamp-2 text-xs text-muted-foreground">{item.body || '—'}</p>
          </div>
        ),
      },
      {
        key: 'channel_type',
        label: t('notifications.type'),
        render: (item: CenterSentNotification) => (
          <Badge variant="secondary">{channelLabel(item.channel_type, t)}</Badge>
        ),
      },
      {
        key: 'sent_at',
        label: t('notifications.sentAt'),
        render: (item: CenterSentNotification) => formatDateTime(item.sent_at, locale),
      },
      {
        key: 'recipients_count',
        label: t('notifications.recipients'),
        render: (item: CenterSentNotification) => (
          <span>
            {item.recipients_count}
            <span className="ms-1 text-xs text-muted-foreground">
              ({item.students_count} / {item.parents_count})
            </span>
          </span>
        ),
      },
      {
        key: 'read_count',
        label: t('notifications.readCount'),
        render: (item: CenterSentNotification) => `${item.read_count} / ${item.recipients_count}`,
      },
      {
        key: 'actions',
        label: t('crud.actions'),
        render: (item: CenterSentNotification) => (
          <Button type="button" size="sm" variant="outline" className="gap-1.5" onClick={() => setSelected(item)}>
            <Eye className="h-3.5 w-3.5" />
            {t('crud.view')}
          </Button>
        ),
      },
    ],
    [t, locale],
  );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Bell className="h-6 w-6" />
              {t('nav.notifications')}
            </h1>
            <p className="mt-1 text-muted-foreground">{t('page.notifications.desc')}</p>
          </div>
          <Button type="button" className="gap-2" onClick={openForm}>
            <Plus className="h-4 w-4" />
            {t('notifications.sendNew')}
          </Button>
        </div>

        <section className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold">{t('notifications.sentHistory')}</h2>
              <p className="text-sm text-muted-foreground">{t('notifications.sentHistoryDesc')}</p>
            </div>
            {historyData?.total != null ? (
              <p className="text-sm text-muted-foreground">
                {t('notifications.totalSent')}: {historyData.total}
              </p>
            ) : null}
          </div>

          {historyLoading ? (
            <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
              {locale === 'ar' ? 'جاري التحميل…' : 'Loading…'}
            </p>
          ) : (
            <DataTable columns={columns} data={history} searchable responsive />
          )}
        </section>
      </div>

      <FormDialog
        open={formOpen}
        onClose={closeForm}
        title={t('notifications.sendNew')}
        description={t('page.notifications.desc')}
        onSubmit={handleSubmit}
        loading={sendMutation.isPending}
        submitLabel={sendMutation.isPending ? t('notifications.sending') : t('notifications.send')}
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
      </FormDialog>

      <Dialog open={Boolean(selected)} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('notifications.details')}</DialogTitle>
          </DialogHeader>
          {selected ? (
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">{t('col.title')}</dt>
                <dd className="font-medium">{selected.title || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('col.message')}</dt>
                <dd className="whitespace-pre-wrap">{selected.body || '—'}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-muted-foreground">{t('notifications.type')}</dt>
                  <dd>{channelLabel(selected.channel_type, t)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('notifications.sentAt')}</dt>
                  <dd>{formatDateTime(selected.sent_at, locale)}</dd>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-muted-foreground">{t('notifications.audience')}</dt>
                  <dd>{audienceLabel(selected.audience, t)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('notifications.sendPush')}</dt>
                  <dd>
                    {selected.send_push == null
                      ? '—'
                      : selected.send_push
                        ? (locale === 'ar' ? 'نعم' : 'Yes')
                        : (locale === 'ar' ? 'لا' : 'No')}
                  </dd>
                </div>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('notifications.scope')}</dt>
                <dd>{scopeLabel(selected)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('notifications.linkOptional')}</dt>
                <dd className="break-all">{selected.url || '—'}</dd>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <dt className="text-muted-foreground">{t('notifications.recipients')}</dt>
                  <dd>
                    {selected.recipients_count} ({selected.students_count} {t('nav.students')},{' '}
                    {selected.parents_count} {t('nav.parents')})
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('notifications.readCount')}</dt>
                  <dd>
                    {selected.read_count} / {selected.recipients_count}
                  </dd>
                </div>
              </div>
              <div>
                <dt className="text-muted-foreground">{t('notifications.notificationClass')}</dt>
                <dd className="font-mono text-xs">{selected.notification_type}</dd>
              </div>
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

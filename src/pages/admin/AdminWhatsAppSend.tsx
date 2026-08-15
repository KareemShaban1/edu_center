import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  adminWhatsAppApi,
  type WhatsAppPreparedMessage,
  type WhatsAppSendResult,
} from '@/services/endpoints/admin-whatsapp';
import WhatsAppMessagePreview from '@/components/admin/WhatsAppMessagePreview';
import {
  inferWhatsAppMessageLang,
  inferWhatsAppTemplateType,
  WHATSAPP_TEMPLATE_TYPES,
  type WhatsAppTemplateType,
} from '@/lib/whatsapp-template-variables';
import { CheckCircle2, ExternalLink, MessageCircle, Settings2, Send, Users, XCircle } from 'lucide-react';

function buildPayload(
  form: {
    template_id: number;
    audience: 'students' | 'parents' | 'both';
    section_id: number;
  },
  variableValues: Record<string, string>,
) {
  return {
    template_id: form.template_id,
    audience: form.audience,
    section_id: form.section_id || null,
    variables: Object.fromEntries(
      Object.entries(variableValues).filter(([, value]) => value.trim() !== ''),
    ),
  };
}

export default function AdminWhatsAppSend() {
  const { t } = useLocale();
  const { data: bootstrap } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['admin-whatsapp-templates'],
    queryFn: () => adminWhatsAppApi.listTemplates(),
  });

  const { data: whatsappStatus } = useQuery({
    queryKey: ['admin-whatsapp-status'],
    queryFn: () => adminWhatsAppApi.status(),
  });

  const automaticAvailable = whatsappStatus?.automatic_available ?? false;

  const [form, setForm] = useState({
    template_id: 0,
    audience: 'parents' as 'students' | 'parents' | 'both',
    grade_id: 0,
    class_id: 0,
    section_id: 0,
  });
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [typeFilter, setTypeFilter] = useState<WhatsAppTemplateType | 'all'>('all');
  const [preparedMessages, setPreparedMessages] = useState<WhatsAppPreparedMessage[]>([]);
  const [sendResults, setSendResults] = useState<WhatsAppSendResult[]>([]);
  const [prepareCounts, setPrepareCounts] = useState<{ ready: number; skipped: number; total: number } | null>(null);
  const [sendCounts, setSendCounts] = useState<{ sent: number; failed: number; skipped: number } | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find(template => template.id === form.template_id) ?? null,
    [templates, form.template_id],
  );

  const filteredTemplates = useMemo(() => {
    if (typeFilter === 'all') return templates;
    return templates.filter(template => inferWhatsAppTemplateType(template.name, template.type) === typeFilter);
  }, [templates, typeFilter]);

  const classesByGrade = useMemo(
    () => classes.filter(c => c.grade_id === form.grade_id),
    [classes, form.grade_id],
  );
  const sectionsByClass = useMemo(
    () => sections.filter(s => s.class_id === form.class_id),
    [sections, form.class_id],
  );

  const customVariables = useMemo(() => {
    if (!selectedTemplate) return [];
    const builtIns = new Set(['name', 'student_name', 'parent_name']);
    return (selectedTemplate.variables ?? []).filter(key => !builtIns.has(key));
  }, [selectedTemplate]);

  const previewLang = selectedTemplate ? inferWhatsAppMessageLang(selectedTemplate.content) : 'ar';

  const resetResults = () => {
    setPreparedMessages([]);
    setSendResults([]);
    setPrepareCounts(null);
    setSendCounts(null);
  };

  const validateForm = () => {
    if (!form.template_id || !form.section_id) {
      toast({
        title: t('whatsapp.validationError'),
        description: t('whatsapp.validationDesc'),
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const prepareMutation = useMutation({
    mutationFn: () => adminWhatsAppApi.prepare(buildPayload(form, variableValues)),
    onSuccess: data => {
      setPreparedMessages(data.messages);
      setSendResults([]);
      setPrepareCounts(data.counts);
      setSendCounts(null);
      if (data.counts.ready === 0) {
        toast({
          title: t('whatsapp.noRecipients'),
          description: t('whatsapp.noRecipientsDesc'),
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: t('whatsapp.linksReady'),
        description: `${data.counts.ready} ${t('whatsapp.readyCount')}, ${data.counts.skipped} ${t('whatsapp.skippedCount')}`,
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('whatsapp.prepareFailed');
      toast({ title: t('whatsapp.prepareFailed'), description: message, variant: 'destructive' });
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => adminWhatsAppApi.send(buildPayload(form, variableValues)),
    onSuccess: data => {
      setSendResults(data.results);
      setPreparedMessages([]);
      setSendCounts(data.counts);
      setPrepareCounts(null);
      toast({
        title: t('whatsapp.sendComplete'),
        description: `${data.counts.sent} ${t('whatsapp.sentCount')}, ${data.counts.failed} ${t('whatsapp.failedCount')}`,
        variant: data.counts.failed > 0 ? 'destructive' : 'default',
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('whatsapp.sendFailed');
      toast({ title: t('whatsapp.sendFailed'), description: message, variant: 'destructive' });
    },
  });

  const handlePrepare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    prepareMutation.mutate();
  };

  const handleSendAutomatic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    sendMutation.mutate();
  };

  const openAllSequentially = () => {
    preparedMessages.forEach((item, index) => {
      window.setTimeout(() => {
        window.open(item.whatsapp_url, '_blank', 'noopener,noreferrer');
      }, index * 600);
    });
  };

  const isBusy = prepareMutation.isPending || sendMutation.isPending;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <MessageCircle className="h-6 w-6 text-emerald-600" />
              {t('whatsapp.sendTitle')}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {automaticAvailable ? t('whatsapp.sendDescAutomatic') : t('whatsapp.sendDesc')}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to="/admin/whatsapp/templates">
              <Settings2 className="h-4 w-4" />
              {t('whatsapp.manageTemplates')}
            </Link>
          </Button>
        </div>

        {whatsappStatus?.mode === 'evolution' && !automaticAvailable && (
          <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
            <p className="font-medium">{t('whatsapp.evolutionNotReady')}</p>
            <p className="mt-1 text-xs opacity-90">
              {whatsappStatus.evolution.error || t('whatsapp.evolutionSetupHint')}
            </p>
          </div>
        )}

        <form
          onSubmit={automaticAvailable ? handleSendAutomatic : handlePrepare}
          className="space-y-4"
        >
          <Card className="border-border/80 shadow-card">
            <CardContent className="space-y-4 p-5">
              <p className="text-sm font-semibold">{t('whatsapp.stepTemplate')}</p>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  size="sm"
                  variant={typeFilter === 'all' ? 'default' : 'outline'}
                  className="h-8"
                  onClick={() => setTypeFilter('all')}
                >
                  {t('whatsapp.allTypes')}
                </Button>
                {WHATSAPP_TEMPLATE_TYPES.map(value => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={typeFilter === value ? 'default' : 'outline'}
                    className="h-8"
                    onClick={() => setTypeFilter(value)}
                  >
                    {t(`whatsapp.type.${value}`)}
                  </Button>
                ))}
              </div>
              <FormField label={t('whatsapp.template')} id="wa-template" required>
                <FormSelect
                  id="wa-template"
                  value={form.template_id}
                  disabled={templatesLoading}
                  onChange={e => {
                    const templateId = Number(e.target.value);
                    const template = templates.find(item => item.id === templateId) ?? null;
                    setForm(f => ({ ...f, template_id: templateId }));
                    setVariableValues({});
                    resetResults();
                    if (template) {
                      const builtIns = new Set(['name', 'student_name', 'parent_name']);
                      const nextValues: Record<string, string> = {};
                      (template.variables ?? []).forEach(key => {
                        if (!builtIns.has(key)) nextValues[key] = '';
                      });
                      setVariableValues(nextValues);
                    }
                  }}
                >
                  <option value={0}>
                    {templatesLoading ? t('whatsapp.loadingTemplates') : t('whatsapp.selectTemplate')}
                  </option>
                  {filteredTemplates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </FormSelect>
                {templates.length === 0 && !templatesLoading && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t('whatsapp.noTemplatesHint')}{' '}
                    <Link to="/admin/whatsapp/templates" className="text-primary underline">
                      {t('whatsapp.createFirstTemplate')}
                    </Link>
                  </p>
                )}
              </FormField>
              {selectedTemplate && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{t('whatsapp.livePreview')}</p>
                    <Badge variant="outline" className="font-normal">
                      {t(`whatsapp.type.${inferWhatsAppTemplateType(selectedTemplate.name, selectedTemplate.type)}`)}
                    </Badge>
                    <Badge variant="secondary" className="font-normal">
                      {previewLang === 'ar' ? t('whatsapp.langArabic') : t('whatsapp.langEnglish')}
                    </Badge>
                  </div>
                  <WhatsAppMessagePreview
                    content={selectedTemplate.content}
                    extraValues={variableValues}
                    lang={previewLang}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-card">
            <CardContent className="space-y-4 p-5">
              <p className="text-sm font-semibold">{t('whatsapp.stepAudience')}</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {([
                  ['parents', t('notifications.audienceParents')],
                  ['students', t('notifications.audienceStudents')],
                  ['both', t('notifications.audienceBoth')],
                ] as const).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant={form.audience === value ? 'default' : 'outline'}
                    className="h-11 justify-start gap-2"
                    onClick={() => setForm(f => ({ ...f, audience: value }))}
                  >
                    <Users className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-card">
            <CardContent className="space-y-4 p-5">
              <p className="text-sm font-semibold">{t('whatsapp.stepSection')}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField label={t('col.grade')} id="wa-grade" required>
                  <FormSelect
                    id="wa-grade"
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
                <FormField label={t('col.class')} id="wa-class" required>
                  <FormSelect
                    id="wa-class"
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
                <FormField label={t('col.section')} id="wa-section" required>
                  <FormSelect
                    id="wa-section"
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
            </CardContent>
          </Card>

          {customVariables.length > 0 && (
            <Card className="border-border/80 shadow-card">
              <CardContent className="space-y-3 p-5">
                <p className="text-sm font-semibold">{t('whatsapp.stepValues')}</p>
                <p className="text-xs text-muted-foreground">{t('whatsapp.customVariablesDesc')}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {customVariables.map(key => (
                    <FormField key={key} label={`{{${key}}}`} id={`wa-var-${key}`}>
                      <FormInput
                        id={`wa-var-${key}`}
                        value={variableValues[key] ?? ''}
                        onChange={e =>
                          setVariableValues(prev => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        placeholder={key}
                      />
                    </FormField>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            {automaticAvailable ? t('whatsapp.automaticNote') : t('whatsapp.manualNote')}
          </div>

          <Button
            type="submit"
            disabled={isBusy || templates.length === 0 || (whatsappStatus?.mode === 'evolution' && !automaticAvailable)}
            className="h-11 w-full gap-2 bg-emerald-600 hover:bg-emerald-700 sm:w-auto"
          >
            <Send className="h-4 w-4" />
            {isBusy
              ? automaticAvailable
                ? t('whatsapp.sending')
                : t('whatsapp.preparing')
              : automaticAvailable
                ? t('whatsapp.sendAutomatic')
                : t('whatsapp.generateLinks')}
          </Button>
        </form>

        {prepareCounts && (
          <div className="rounded-xl border bg-card p-4 text-sm">
            <p>
              {prepareCounts.ready} {t('whatsapp.readyCount')}
              {prepareCounts.skipped > 0 && (
                <span className="text-muted-foreground">
                  {' '}
                  · {prepareCounts.skipped} {t('whatsapp.skippedCount')}
                </span>
              )}
            </p>
          </div>
        )}

        {sendCounts && (
          <div className="rounded-xl border bg-card p-4 text-sm">
            <p>
              {sendCounts.sent} {t('whatsapp.sentCount')}
              {sendCounts.failed > 0 && (
                <span className="text-destructive">
                  {' '}
                  · {sendCounts.failed} {t('whatsapp.failedCount')}
                </span>
              )}
              {sendCounts.skipped > 0 && (
                <span className="text-muted-foreground">
                  {' '}
                  · {sendCounts.skipped} {t('whatsapp.skippedCount')}
                </span>
              )}
            </p>
          </div>
        )}

        {preparedMessages.length > 0 && (
          <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{t('whatsapp.recipients')}</h2>
              <Button type="button" variant="outline" size="sm" className="gap-2" onClick={openAllSequentially}>
                <ExternalLink className="h-4 w-4" />
                {t('whatsapp.openAll')}
              </Button>
            </div>

            <div className="space-y-3">
              {preparedMessages.map(item => (
                <div
                  key={`${item.recipient_type}-${item.recipient_id}`}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.phone} · {item.recipient_type === 'parent' ? t('role.parent') : t('role.student')}
                    </p>
                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {item.message}
                    </p>
                  </div>
                  <Button asChild className="shrink-0 gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <a href={item.whatsapp_url} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                      {t('whatsapp.openWhatsApp')}
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {sendResults.length > 0 && (
          <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{t('whatsapp.sendResults')}</h2>
            <div className="space-y-3">
              {sendResults.map(item => (
                <div
                  key={`${item.recipient_type}-${item.recipient_id}`}
                  className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-medium">
                      {item.status === 'sent' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                      {item.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.phone} · {item.recipient_type === 'parent' ? t('role.parent') : t('role.student')}
                    </p>
                    <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-muted-foreground">
                      {item.message}
                    </p>
                    {item.error && (
                      <p className="mt-1 text-xs text-destructive">{item.error}</p>
                    )}
                  </div>
                  <span
                    className={
                      item.status === 'sent'
                        ? 'text-sm font-medium text-emerald-600'
                        : 'text-sm font-medium text-destructive'
                    }
                  >
                    {item.status === 'sent' ? t('whatsapp.statusSent') : t('whatsapp.statusFailed')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

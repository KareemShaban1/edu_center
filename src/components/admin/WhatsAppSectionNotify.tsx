import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MessageCircle, Send, ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormField, FormSelect } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import {
  adminWhatsAppApi,
  type WhatsAppPreparedMessage,
  type WhatsAppPreparePayload,
  type WhatsAppSendResult,
} from '@/services/endpoints/admin-whatsapp';

export type WhatsAppSectionContext = 'attendance' | 'exam' | 'quiz';

export interface WhatsAppSectionRow {
  student_id: number;
  student_name: string;
  status: 'present' | 'absent' | 'late';
  degree?: string;
  notes?: string;
}

interface WhatsAppSectionNotifyProps {
  context: WhatsAppSectionContext;
  sectionId: number;
  date: string;
  sectionLabel: string;
  rows: WhatsAppSectionRow[];
}

function buildStudentVariables(
  row: WhatsAppSectionRow,
  context: WhatsAppSectionContext,
  date: string,
  sectionLabel: string,
  t: (key: string) => string,
): Record<string, string> {
  const base: Record<string, string> = {
    date,
    section_name: sectionLabel,
    status: t(`attendance.${row.status}`),
    notes: row.notes?.trim() || '—',
  };

  if (context === 'exam' || context === 'quiz') {
    return {
      ...base,
      degree: row.degree?.trim() || '—',
      assessment_type: context === 'exam' ? t('nav.exams') : t('nav.quizzes'),
    };
  }

  return base;
}

function buildPayload(
  templateId: number,
  sectionId: number,
  targetRows: WhatsAppSectionRow[],
  context: WhatsAppSectionContext,
  date: string,
  sectionLabel: string,
  t: (key: string) => string,
): WhatsAppPreparePayload {
  const studentVariables: Record<number, Record<string, string>> = {};
  targetRows.forEach(row => {
    studentVariables[row.student_id] = buildStudentVariables(row, context, date, sectionLabel, t);
  });

  return {
    template_id: templateId,
    audience: 'parents',
    section_id: sectionId,
    student_ids: targetRows.map(row => row.student_id),
    student_variables: studentVariables,
  };
}

export default function WhatsAppSectionNotify({
  context,
  sectionId,
  date,
  sectionLabel,
  rows,
}: WhatsAppSectionNotifyProps) {
  const { t } = useLocale();
  const [templateId, setTemplateId] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preparedMessages, setPreparedMessages] = useState<WhatsAppPreparedMessage[]>([]);
  const [sendResults, setSendResults] = useState<WhatsAppSendResult[]>([]);
  const [resultMode, setResultMode] = useState<'link' | 'send'>('link');

  const { data: templates = [] } = useQuery({
    queryKey: ['admin-whatsapp-templates'],
    queryFn: () => adminWhatsAppApi.listTemplates(),
  });

  const { data: whatsappStatus } = useQuery({
    queryKey: ['admin-whatsapp-status'],
    queryFn: () => adminWhatsAppApi.status(),
  });

  const automaticAvailable = whatsappStatus?.automatic_available ?? false;

  const contextTemplates = useMemo(() => {
    const keywords: Record<WhatsAppSectionContext, string[]> = {
      attendance: ['attendance', 'حضور', 'غياب'],
      exam: ['exam', 'امتحان', 'درجة'],
      quiz: ['quiz', 'اختبار', 'كويز'],
    };
    const keys = keywords[context];
    const matched = templates.filter(template =>
      keys.some(key => template.name.toLowerCase().includes(key.toLowerCase())),
    );
    return matched.length > 0 ? matched : templates;
  }, [templates, context]);

  const defaultTemplateId = contextTemplates[0]?.id ?? templates[0]?.id ?? 0;
  const activeTemplateId = templateId || defaultTemplateId;

  const prepareMutation = useMutation({
    mutationFn: (targetRows: WhatsAppSectionRow[]) =>
      adminWhatsAppApi.prepare(
        buildPayload(activeTemplateId, sectionId, targetRows, context, date, sectionLabel, t),
      ),
    onSuccess: data => {
      setPreparedMessages(data.messages);
      setSendResults([]);
      setResultMode('link');
      setDialogOpen(true);
      if (data.counts.ready === 0) {
        toast({
          title: t('whatsapp.noRecipients'),
          description: t('whatsapp.noRecipientsDesc'),
          variant: 'destructive',
        });
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('whatsapp.prepareFailed');
      toast({ title: t('whatsapp.prepareFailed'), description: message, variant: 'destructive' });
    },
  });

  const sendMutation = useMutation({
    mutationFn: (targetRows: WhatsAppSectionRow[]) =>
      adminWhatsAppApi.send(
        buildPayload(activeTemplateId, sectionId, targetRows, context, date, sectionLabel, t),
      ),
    onSuccess: data => {
      setSendResults(data.results);
      setPreparedMessages([]);
      setResultMode('send');
      setDialogOpen(true);
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

  const notify = (targetRows: WhatsAppSectionRow[], automatic: boolean) => {
    if (!activeTemplateId) {
      toast({
        title: t('whatsapp.validationError'),
        description: t('whatsapp.selectTemplateFirst'),
        variant: 'destructive',
      });
      return;
    }
    if (targetRows.length === 0) {
      toast({
        title: t('whatsapp.noRecipients'),
        description: t('whatsapp.noRecipientsDesc'),
        variant: 'destructive',
      });
      return;
    }
    if (automatic) {
      sendMutation.mutate(targetRows);
    } else {
      prepareMutation.mutate(targetRows);
    }
  };

  const absentRows = rows.filter(row => row.status === 'absent');
  const isBusy = prepareMutation.isPending || sendMutation.isPending;

  if (rows.length === 0 || templates.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-4 rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1 space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              {t('whatsapp.sectionNotifyTitle')}
            </p>
            <FormField label={t('whatsapp.template')} id={`wa-template-${context}`}>
              <FormSelect
                id={`wa-template-${context}`}
                value={activeTemplateId}
                onChange={e => setTemplateId(Number(e.target.value))}
              >
                {contextTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </FormSelect>
            </FormField>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isBusy}
              onClick={() => notify(rows, false)}
            >
              <ExternalLink className="h-4 w-4" />
              {t('whatsapp.notifyAllParents')}
            </Button>
            {automaticAvailable && (
              <Button
                type="button"
                size="sm"
                className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                disabled={isBusy}
                onClick={() => notify(rows, true)}
              >
                <Send className="h-4 w-4" />
                {t('whatsapp.sendAllParents')}
              </Button>
            )}
            {context === 'attendance' && absentRows.length > 0 && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="gap-2"
                disabled={isBusy}
                onClick={() => notify(absentRows, automaticAvailable)}
              >
                <MessageCircle className="h-4 w-4" />
                {automaticAvailable ? t('whatsapp.sendAbsentParents') : t('whatsapp.notifyAbsentParents')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('whatsapp.sendResults')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {resultMode === 'link' &&
              preparedMessages.map(item => (
                <div key={`${item.recipient_id}-${item.student_id}`} className="rounded-lg border p-3">
                  <p className="font-medium">{item.student_name || item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.phone}</p>
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">{item.message}</p>
                  <Button asChild size="sm" className="mt-3 gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <a href={item.whatsapp_url} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                      {t('whatsapp.openWhatsApp')}
                    </a>
                  </Button>
                </div>
              ))}
            {resultMode === 'send' &&
              sendResults.map(item => (
                <div key={`${item.recipient_id}-${item.student_id ?? 'x'}`} className="rounded-lg border p-3">
                  <p className="flex items-center gap-2 font-medium">
                    {item.status === 'sent' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    {item.student_name || item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.phone}</p>
                  {item.error && <p className="mt-1 text-xs text-destructive">{item.error}</p>}
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function WhatsAppRowButton({
  context,
  sectionId,
  date,
  sectionLabel,
  row,
}: {
  context: WhatsAppSectionContext;
  sectionId: number;
  date: string;
  sectionLabel: string;
  row: WhatsAppSectionRow;
}) {
  const { t } = useLocale();

  const { data: templates = [] } = useQuery({
    queryKey: ['admin-whatsapp-templates'],
    queryFn: () => adminWhatsAppApi.listTemplates(),
  });

  const templateId = useMemo(() => {
    const keywords: Record<WhatsAppSectionContext, string[]> = {
      attendance: ['attendance', 'حضور', 'غياب'],
      exam: ['exam', 'امتحان', 'درجة'],
      quiz: ['quiz', 'اختبار', 'كويز'],
    };
    const keys = keywords[context];
    const matched = templates.find(template =>
      keys.some(key => template.name.toLowerCase().includes(key.toLowerCase())),
    );
    return matched?.id ?? templates[0]?.id ?? 0;
  }, [templates, context]);

  const { data: whatsappStatus } = useQuery({
    queryKey: ['admin-whatsapp-status'],
    queryFn: () => adminWhatsAppApi.status(),
  });

  const automaticAvailable = whatsappStatus?.automatic_available ?? false;

  const prepareMutation = useMutation({
    mutationFn: () =>
      adminWhatsAppApi.prepare(
        buildPayload(templateId, sectionId, [row], context, date, sectionLabel, t),
      ),
    onSuccess: data => {
      const message = data.messages[0];
      if (!message) {
        toast({
          title: t('whatsapp.noRecipients'),
          description: t('whatsapp.noRecipientsDesc'),
          variant: 'destructive',
        });
        return;
      }
      window.open(message.whatsapp_url, '_blank', 'noopener,noreferrer');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('whatsapp.prepareFailed');
      toast({ title: t('whatsapp.prepareFailed'), description: message, variant: 'destructive' });
    },
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      adminWhatsAppApi.send(
        buildPayload(templateId, sectionId, [row], context, date, sectionLabel, t),
      ),
    onSuccess: data => {
      const result = data.results[0];
      if (!result) {
        toast({
          title: t('whatsapp.noRecipients'),
          description: t('whatsapp.noRecipientsDesc'),
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: result.status === 'sent' ? t('whatsapp.statusSent') : t('whatsapp.statusFailed'),
        description: result.student_name || result.name,
        variant: result.status === 'sent' ? 'default' : 'destructive',
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('whatsapp.sendFailed');
      toast({ title: t('whatsapp.sendFailed'), description: message, variant: 'destructive' });
    },
  });

  if (!templateId) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
      disabled={prepareMutation.isPending || sendMutation.isPending}
      title={t('whatsapp.notifyParent')}
      onClick={() => {
        if (automaticAvailable) {
          sendMutation.mutate();
        } else {
          prepareMutation.mutate();
        }
      }}
    >
      <MessageCircle className="h-4 w-4" />
    </Button>
  );
}

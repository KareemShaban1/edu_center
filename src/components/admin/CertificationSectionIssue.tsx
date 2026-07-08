import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Award, CheckCircle2 } from 'lucide-react';
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
  adminCertificationsApi,
  type CertificationPreparePayload,
  type CertificationPreview,
  type StudentCertification,
} from '@/services/endpoints/admin-certifications';
import CertificatePreview from '@/components/certification/CertificatePreview';
import CertificateDownloadActions from '@/components/certification/CertificateDownloadActions';
import { designConfigFromPreset } from '@/lib/certification/design-presets';
import type { CertificateDesignConfig } from '@/lib/certification/types';

export type CertificationSectionContext = 'attendance' | 'exam' | 'quiz';

export interface CertificationSectionRow {
  student_id: number;
  student_name: string;
  status: 'present' | 'absent' | 'late';
  degree?: string;
  notes?: string;
}

interface CertificationSectionIssueProps {
  context: CertificationSectionContext;
  sectionId: number;
  date: string;
  sectionLabel: string;
  rows: CertificationSectionRow[];
}

function buildStudentVariables(
  row: CertificationSectionRow,
  context: CertificationSectionContext,
  date: string,
  sectionLabel: string,
  t: (key: string) => string,
): Record<string, string> {
  const base: Record<string, string> = {
    date,
    issue_date: date,
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
  targetRows: CertificationSectionRow[],
  context: CertificationSectionContext,
  date: string,
  sectionLabel: string,
  t: (key: string) => string,
): CertificationPreparePayload {
  const studentVariables: Record<number, Record<string, string>> = {};
  targetRows.forEach(row => {
    studentVariables[row.student_id] = buildStudentVariables(row, context, date, sectionLabel, t);
  });

  return {
    template_id: templateId,
    section_id: sectionId,
    student_ids: targetRows.map(row => row.student_id),
    student_variables: studentVariables,
    context,
    context_date: date,
  };
}

function resolvePreviewDesign(item: CertificationPreview | StudentCertification): CertificateDesignConfig {
  if (item.design) return item.design;
  return {
    ...designConfigFromPreset('classic-gold'),
    fields: { heading: item.title, subtitle: '', body: item.content, footer: '' },
  };
}

export default function CertificationSectionIssue({
  context,
  sectionId,
  date,
  sectionLabel,
  rows,
}: CertificationSectionIssueProps) {
  const { t } = useLocale();
  const [templateId, setTemplateId] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previews, setPreviews] = useState<CertificationPreview[]>([]);
  const [issued, setIssued] = useState<StudentCertification[]>([]);
  const [resultMode, setResultMode] = useState<'preview' | 'issue'>('preview');

  const { data: templates = [] } = useQuery({
    queryKey: ['admin-certification-templates'],
    queryFn: () => adminCertificationsApi.listTemplates(),
  });

  const contextTemplates = useMemo(() => {
    const keywords: Record<CertificationSectionContext, string[]> = {
      attendance: ['participation', 'attendance', 'حضور', 'مشاركة'],
      exam: ['excellence', 'honor', 'achievement', 'exam', 'امتحان', 'تميز', 'تفوق'],
      quiz: ['achievement', 'quiz', 'اختبار', 'إنجاز'],
    };
    const keys = keywords[context];
    const matched = templates.filter(template =>
      keys.some(key => template.title.toLowerCase().includes(key.toLowerCase())),
    );
    return matched.length > 0 ? matched : templates;
  }, [templates, context]);

  const defaultTemplateId = contextTemplates[0]?.id ?? templates[0]?.id ?? 0;
  const activeTemplateId = templateId || defaultTemplateId;

  const prepareMutation = useMutation({
    mutationFn: (targetRows: CertificationSectionRow[]) =>
      adminCertificationsApi.prepare(
        buildPayload(activeTemplateId, sectionId, targetRows, context, date, sectionLabel, t),
      ),
    onSuccess: data => {
      setPreviews(data.certifications);
      setIssued([]);
      setResultMode('preview');
      setDialogOpen(true);
      if (data.counts.ready === 0) {
        toast({
          title: t('certification.noStudents'),
          description: t('certification.noStudentsDesc'),
          variant: 'destructive',
        });
      }
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('certification.prepareFailed');
      toast({ title: t('certification.prepareFailed'), description: message, variant: 'destructive' });
    },
  });

  const issueMutation = useMutation({
    mutationFn: (targetRows: CertificationSectionRow[]) =>
      adminCertificationsApi.issue(
        buildPayload(activeTemplateId, sectionId, targetRows, context, date, sectionLabel, t),
      ),
    onSuccess: data => {
      setIssued(data.certifications);
      setPreviews([]);
      setResultMode('issue');
      setDialogOpen(true);
      toast({
        title: t('certification.issueComplete'),
        description: `${data.counts.issued} ${t('certification.issuedCount')}`,
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('certification.issueFailed');
      toast({ title: t('certification.issueFailed'), description: message, variant: 'destructive' });
    },
  });

  const issue = (targetRows: CertificationSectionRow[], previewOnly: boolean) => {
    if (!activeTemplateId) {
      toast({
        title: t('certification.validationError'),
        description: t('certification.selectTemplateFirst'),
        variant: 'destructive',
      });
      return;
    }
    if (targetRows.length === 0) {
      toast({
        title: t('certification.noStudents'),
        description: t('certification.noStudentsDesc'),
        variant: 'destructive',
      });
      return;
    }
    if (previewOnly) {
      prepareMutation.mutate(targetRows);
    } else {
      issueMutation.mutate(targetRows);
    }
  };

  const presentRows = rows.filter(row => row.status === 'present');
  const isBusy = prepareMutation.isPending || issueMutation.isPending;

  if (rows.length === 0 || templates.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-4 rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex-1 space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Award className="h-4 w-4 text-amber-600" />
              {t('certification.sectionIssueTitle')}
            </p>
            <FormField label={t('certification.template')} id={`cert-template-${context}`}>
              <FormSelect
                id={`cert-template-${context}`}
                value={activeTemplateId}
                onChange={e => setTemplateId(Number(e.target.value))}
              >
                {contextTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.title}
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
              onClick={() => issue(rows, true)}
            >
              {t('certification.previewAll')}
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-2 bg-amber-600 hover:bg-amber-700"
              disabled={isBusy}
              onClick={() => issue(rows, false)}
            >
              <Award className="h-4 w-4" />
              {t('certification.issueAll')}
            </Button>
            {(context === 'exam' || context === 'quiz') && presentRows.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="gap-2"
                disabled={isBusy}
                onClick={() => issue(presentRows, false)}
              >
                <Award className="h-4 w-4" />
                {t('certification.issuePresent')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {resultMode === 'preview' ? t('certification.previewList') : t('certification.issueResults')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {resultMode === 'preview' &&
              previews.map(item => (
                <div key={item.student_id} className="rounded-lg border p-3">
                  <p className="mb-2 font-medium">{item.student_name}</p>
                  <CertificatePreview design={resolvePreviewDesign(item)} compact />
                </div>
              ))}
            {resultMode === 'issue' &&
              issued.map(item => (
                <div key={item.id} className="space-y-3 rounded-lg border p-3">
                  <p className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-600" />
                    {item.student_name}
                  </p>
                  <CertificatePreview design={resolvePreviewDesign(item)} compact />
                  <CertificateDownloadActions
                    design={resolvePreviewDesign(item)}
                    title={`${item.student_name ?? 'student'}-${item.title}`}
                    variant="compact"
                  />
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CertificationRowButton({
  context,
  sectionId,
  date,
  sectionLabel,
  row,
}: {
  context: CertificationSectionContext;
  sectionId: number;
  date: string;
  sectionLabel: string;
  row: CertificationSectionRow;
}) {
  const { t } = useLocale();

  const { data: templates = [] } = useQuery({
    queryKey: ['admin-certification-templates'],
    queryFn: () => adminCertificationsApi.listTemplates(),
  });

  const templateId = useMemo(() => {
    const keywords: Record<CertificationSectionContext, string[]> = {
      attendance: ['participation', 'attendance', 'حضور', 'مشاركة'],
      exam: ['excellence', 'honor', 'achievement', 'exam', 'امتحان', 'تميز', 'تفوق'],
      quiz: ['achievement', 'quiz', 'اختبار', 'إنجاز'],
    };
    const keys = keywords[context];
    const matched = templates.find(template =>
      keys.some(key => template.title.toLowerCase().includes(key.toLowerCase())),
    );
    return matched?.id ?? templates[0]?.id ?? 0;
  }, [templates, context]);

  const issueMutation = useMutation({
    mutationFn: () =>
      adminCertificationsApi.issue(
        buildPayload(templateId, sectionId, [row], context, date, sectionLabel, t),
      ),
    onSuccess: data => {
      const result = data.certifications[0];
      if (!result) {
        toast({
          title: t('certification.issueFailed'),
          description: t('certification.noStudentsDesc'),
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: t('certification.issueComplete'),
        description: result.student_name || result.title,
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('certification.issueFailed');
      toast({ title: t('certification.issueFailed'), description: message, variant: 'destructive' });
    },
  });

  if (!templateId) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-amber-600 hover:text-amber-700"
      disabled={issueMutation.isPending}
      title={t('certification.issueToStudent')}
      onClick={() => issueMutation.mutate()}
    >
      <Award className="h-4 w-4" />
    </Button>
  );
}

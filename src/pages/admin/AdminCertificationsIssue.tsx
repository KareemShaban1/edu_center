import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import { toast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  adminCertificationsApi,
  type CertificationPreview,
  type StudentCertification,
} from '@/services/endpoints/admin-certifications';
import CertificatePreview from '@/components/certification/CertificatePreview';
import CertificateDownloadActions from '@/components/certification/CertificateDownloadActions';
import { designConfigFromPreset } from '@/lib/certification/design-presets';
import type { CertificateDesignConfig } from '@/lib/certification/types';
import { Award, CheckCircle2, Settings2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

function buildPayload(
  form: {
    mode: 'template' | 'custom';
    template_id: number;
    custom_title: string;
    custom_content: string;
    section_id: number;
  },
  variableValues: Record<string, string>,
) {
  if (form.mode === 'custom') {
    return {
      custom_title: form.custom_title.trim(),
      custom_content: form.custom_content.trim(),
      section_id: form.section_id || null,
      variables: Object.fromEntries(
        Object.entries(variableValues).filter(([, value]) => value.trim() !== ''),
      ),
    };
  }
  return {
    template_id: form.template_id,
    section_id: form.section_id || null,
    variables: Object.fromEntries(
      Object.entries(variableValues).filter(([, value]) => value.trim() !== ''),
    ),
  };
}

export default function AdminCertificationsIssue() {
  const { t } = useLocale();
  const { data: bootstrap } = useAdminBootstrap();
  const grades = (bootstrap?.grades || []) as Array<{ id: number; name: string }>;
  const classes = (bootstrap?.classes || []) as Array<{ id: number; name: string; grade_id: number }>;
  const sections = (bootstrap?.sections || []) as Array<{ id: number; name: string; class_id: number }>;

  const { data: templates = [], isLoading: templatesLoading } = useQuery({
    queryKey: ['admin-certification-templates'],
    queryFn: () => adminCertificationsApi.listTemplates(),
  });

  const [form, setForm] = useState({
    mode: 'template' as 'template' | 'custom',
    template_id: 0,
    custom_title: '',
    custom_content: '',
    grade_id: 0,
    class_id: 0,
    section_id: 0,
  });
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [previews, setPreviews] = useState<CertificationPreview[]>([]);
  const [issued, setIssued] = useState<StudentCertification[]>([]);
  const [prepareCounts, setPrepareCounts] = useState<{ ready: number; total: number } | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find(template => template.id === form.template_id) ?? null,
    [templates, form.template_id],
  );

  const classesByGrade = useMemo(
    () => classes.filter(c => c.grade_id === form.grade_id),
    [classes, form.grade_id],
  );
  const sectionsByClass = useMemo(
    () => sections.filter(s => s.class_id === form.class_id),
    [sections, form.class_id],
  );

  const customVariables = useMemo(() => {
    const content = form.mode === 'custom' ? form.custom_content : selectedTemplate?.content ?? '';
    const title = form.mode === 'custom' ? form.custom_title : selectedTemplate?.title ?? '';
    const matches = `${title}\n${content}`.match(/\{\{(\w+)\}\}/g) ?? [];
    const vars = [...new Set(matches.map(token => token.replace(/[{}]/g, '')))];
    const builtIns = new Set(['name', 'student_name', 'parent_name', 'section_name', 'date', 'issue_date', 'center_name']);
    return vars.filter(key => !builtIns.has(key));
  }, [form.mode, form.custom_content, form.custom_title, selectedTemplate]);

  const resetResults = () => {
    setPreviews([]);
    setIssued([]);
    setPrepareCounts(null);
  };

  const validateForm = () => {
    if (!form.section_id) {
      toast({
        title: t('certification.validationError'),
        description: t('certification.sectionRequired'),
        variant: 'destructive',
      });
      return false;
    }
    if (form.mode === 'template' && !form.template_id) {
      toast({
        title: t('certification.validationError'),
        description: t('certification.templateRequired'),
        variant: 'destructive',
      });
      return false;
    }
    if (form.mode === 'custom' && (!form.custom_title.trim() || !form.custom_content.trim())) {
      toast({
        title: t('certification.validationError'),
        description: t('certification.customRequired'),
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const prepareMutation = useMutation({
    mutationFn: () => adminCertificationsApi.prepare(buildPayload(form, variableValues)),
    onSuccess: data => {
      setPreviews(data.certifications);
      setIssued([]);
      setPrepareCounts(data.counts);
      if (data.counts.ready === 0) {
        toast({
          title: t('certification.noStudents'),
          description: t('certification.noStudentsDesc'),
          variant: 'destructive',
        });
        return;
      }
      toast({
        title: t('certification.previewReady'),
        description: `${data.counts.ready} ${t('certification.studentsReady')}`,
      });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('certification.prepareFailed');
      toast({ title: t('certification.prepareFailed'), description: message, variant: 'destructive' });
    },
  });

  const issueMutation = useMutation({
    mutationFn: () => adminCertificationsApi.issue(buildPayload(form, variableValues)),
    onSuccess: data => {
      setIssued(data.certifications);
      setPreviews([]);
      setPrepareCounts(null);
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

  const handlePrepare = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    prepareMutation.mutate();
  };

  const handleIssue = () => {
    if (!validateForm()) return;
    issueMutation.mutate();
  };

  const isBusy = prepareMutation.isPending || issueMutation.isPending;

  const resolvePreviewDesign = (item: CertificationPreview | StudentCertification): CertificateDesignConfig => {
    if (item.design) return item.design;
    return {
      ...designConfigFromPreset('classic-gold'),
      fields: { heading: item.title, subtitle: '', body: item.content, footer: '' },
    };
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Award className="h-6 w-6 text-amber-600" />
              {t('certification.issueTitle')}
            </h1>
            <p className="mt-1 text-muted-foreground">{t('certification.issueDesc')}</p>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to="/admin/certifications/templates">
              <Settings2 className="h-4 w-4" />
              {t('certification.manageTemplates')}
            </Link>
          </Button>
        </div>

        <form onSubmit={handlePrepare} className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
          <Tabs
            value={form.mode}
            onValueChange={v => {
              setForm(f => ({ ...f, mode: v as 'template' | 'custom' }));
              resetResults();
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="template">{t('certification.useTemplate')}</TabsTrigger>
              <TabsTrigger value="custom">{t('certification.customCert')}</TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="mt-4 space-y-4">
              <FormField label={t('certification.template')} id="cert-template" required>
                <FormSelect
                  id="cert-template"
                  value={form.template_id}
                  disabled={templatesLoading}
                  onChange={e => {
                    const templateId = Number(e.target.value);
                    setForm(f => ({ ...f, template_id: templateId }));
                    setVariableValues({});
                    resetResults();
                  }}
                >
                  <option value={0}>
                    {templatesLoading ? t('certification.loadingTemplates') : t('certification.selectTemplate')}
                  </option>
                  {templates.map(template => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </FormSelect>
              </FormField>

              {selectedTemplate && (
                <div className="rounded-lg border bg-muted/20 px-4 py-3 text-sm">
                  <p className="mb-1 font-medium">{t('certification.previewTemplate')}</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">{selectedTemplate.content}</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="custom" className="mt-4 space-y-4">
              <FormField label={t('col.title')} id="cert-custom-title" required>
                <FormInput
                  id="cert-custom-title"
                  value={form.custom_title}
                  onChange={e => {
                    setForm(f => ({ ...f, custom_title: e.target.value }));
                    resetResults();
                  }}
                  placeholder={t('certification.customTitlePlaceholder')}
                />
              </FormField>
              <FormField label={t('col.content')} id="cert-custom-content" required>
                <FormTextarea
                  id="cert-custom-content"
                  rows={8}
                  value={form.custom_content}
                  onChange={e => {
                    setForm(f => ({ ...f, custom_content: e.target.value }));
                    resetResults();
                  }}
                  placeholder={t('certification.templatePlaceholder')}
                />
              </FormField>
              <p className="text-xs text-muted-foreground">{t('certification.customHint')}</p>
            </TabsContent>
          </Tabs>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label={t('col.grade')} id="cert-grade" required>
              <FormSelect
                id="cert-grade"
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
            <FormField label={t('col.class')} id="cert-class" required>
              <FormSelect
                id="cert-class"
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
            <FormField label={t('col.section')} id="cert-section" required>
              <FormSelect
                id="cert-section"
                value={form.section_id}
                disabled={!form.class_id}
                onChange={e => {
                  setForm(f => ({ ...f, section_id: Number(e.target.value) }));
                  resetResults();
                }}
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

          {customVariables.length > 0 && (
            <div className="space-y-3 rounded-lg border px-4 py-4">
              <p className="text-sm font-medium">{t('certification.customVariables')}</p>
              <p className="text-xs text-muted-foreground">{t('certification.customVariablesDesc')}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {customVariables.map(key => (
                  <FormField key={key} label={`{{${key}}}`} id={`cert-var-${key}`}>
                    <FormInput
                      id={`cert-var-${key}`}
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
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="outline" disabled={isBusy} className="gap-2">
              {isBusy ? t('certification.preparing') : t('certification.preview')}
            </Button>
            <Button
              type="button"
              disabled={isBusy || (previews.length === 0 && !prepareCounts)}
              className="gap-2 bg-amber-600 hover:bg-amber-700"
              onClick={handleIssue}
            >
              <Award className="h-4 w-4" />
              {issueMutation.isPending ? t('certification.issuing') : t('certification.issueToSection')}
            </Button>
          </div>
        </form>

        {prepareCounts && (
          <div className="rounded-xl border bg-card p-4 text-sm">
            <p>
              {prepareCounts.ready} {t('certification.studentsReady')}
            </p>
          </div>
        )}

        {previews.length > 0 && (
          <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{t('certification.previewList')}</h2>
            <div className="space-y-3">
              {previews.map(item => (
                <div key={item.student_id} className="rounded-lg border p-4">
                  <p className="mb-2 font-medium">{item.student_name}</p>
                  <CertificatePreview design={resolvePreviewDesign(item)} compact />
                </div>
              ))}
            </div>
          </div>
        )}

        {issued.length > 0 && (
          <div className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{t('certification.issueResults')}</h2>
            <div className="space-y-3">
              {issued.map(item => (
                <div key={item.id} className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                    <p className="font-medium">{item.student_name}</p>
                  </div>
                  <CertificatePreview design={resolvePreviewDesign(item)} compact />
                  <CertificateDownloadActions
                    design={resolvePreviewDesign(item)}
                    title={`${item.student_name ?? 'student'}-${item.title}`}
                    variant="compact"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import CertificatePreview from '@/components/certification/CertificatePreview';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import {
  adminCertificationsApi,
  type CertificationTemplate,
} from '@/services/endpoints/admin-certifications';
import { designConfigFromPreset } from '@/lib/certification/design-presets';
import type { CertificateDesignConfig } from '@/lib/certification/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Plus, Pencil, Trash2, Award } from 'lucide-react';
import { useMemo } from 'react';

function resolveDesign(template: CertificationTemplate): CertificateDesignConfig {
  if (template.design) return template.design;
  if (template.design_id) return designConfigFromPreset(template.design_id);
  return designConfigFromPreset('classic-gold');
}

export default function AdminCertificationTemplates() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-certification-templates'],
    queryFn: () => adminCertificationsApi.listTemplates(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminCertificationsApi.deleteTemplate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-certification-templates'] });
      toast({ title: t('crud.deleted') });
    },
  });

  const sorted = useMemo(
    () => [...templates].sort((a, b) => Number(b.is_system) - Number(a.is_system) || a.title.localeCompare(b.title)),
    [templates],
  );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-4 lg:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Award className="h-6 w-6 text-amber-600" />
              {t('certification.templatesTitle')}
            </h1>
            <p className="mt-1 text-muted-foreground">{t('certification.templatesDesc')}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild className="gap-2">
              <Link to="/admin/certifications">
                <Send className="h-4 w-4" />
                {t('certification.issueTitle')}
              </Link>
            </Button>
            <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700" onClick={() => navigate('/admin/certifications/templates/new')}>
              <Plus className="h-4 w-4" />
              {t('certBuilder.createTitle')}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">{t('certification.loadingTemplates')}</p>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border bg-card p-12 text-center">
            <p className="text-muted-foreground">{t('certification.noTemplatesHint')}</p>
            <Button className="mt-4 gap-2" onClick={() => navigate('/admin/certifications/templates/new')}>
              <Plus className="h-4 w-4" />
              {t('certBuilder.createTitle')}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sorted.map(template => {
              const design = resolveDesign(template);
              return (
                <div key={template.id} className="group overflow-hidden rounded-xl border bg-card shadow-sm transition hover:shadow-md">
                  <div className="border-b bg-slate-50 p-3 dark:bg-slate-900/30">
                    <CertificatePreview design={design} compact />
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold leading-tight">{template.title}</h3>
                      {template.is_system && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          {t('certification.systemTemplate')}
                        </Badge>
                      )}
                    </div>
                    {template.design_id && (
                      <p className="text-xs text-muted-foreground">{t('certBuilder.designId')}: {template.design_id}</p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {(template.variables ?? []).slice(0, 4).map(v => (
                        <Badge key={v} variant="outline" className="font-mono text-[10px]">{`{{${v}}}`}</Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1"
                        onClick={() => navigate(`/admin/certifications/templates/${template.id}/edit`)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {t('certBuilder.editInBuilder')}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm(t('crud.deleteConfirm'))) {
                            void deleteMutation.mutateAsync(template.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DashboardLayout from '@/components/DashboardLayout';
import CertificateBuilder, { type CertificateBuilderValue } from '@/components/certification/CertificateBuilder';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import { adminCertificationsApi } from '@/services/endpoints/admin-certifications';
import { designConfigFromPreset } from '@/lib/certification/design-presets';
import type { CertificateDesignConfig } from '@/lib/certification/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AdminCertificationBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const isEdit = Boolean(id);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-certification-templates'],
    queryFn: () => adminCertificationsApi.listTemplates(),
    enabled: isEdit,
  });

  const template = isEdit ? templates.find(item => item.id === Number(id)) : null;

  const saveMutation = useMutation({
    mutationFn: (value: CertificateBuilderValue) =>
      isEdit && template
        ? adminCertificationsApi.updateTemplate(template.id, value)
        : adminCertificationsApi.createTemplate(value),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-certification-templates'] });
      toast({ title: t('certification.saveSuccess') });
      navigate('/admin/certifications/templates');
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : t('certification.saveFailed');
      toast({ title: t('certification.saveFailed'), description: message, variant: 'destructive' });
    },
  });

  if (isEdit && isLoading) {
    return (
      <DashboardLayout>
        <p className="p-6 text-muted-foreground">{t('certification.loadingTemplates')}</p>
      </DashboardLayout>
    );
  }

  if (isEdit && !isLoading && !template) {
    return (
      <DashboardLayout>
        <p className="p-6 text-muted-foreground">{t('crud.noData')}</p>
      </DashboardLayout>
    );
  }

  const initialDesign = (template?.design as CertificateDesignConfig | null | undefined)
    ?? (template?.design_id ? designConfigFromPreset(template.design_id) : null);

  return (
    <DashboardLayout>
      <div className="mb-3 flex items-center gap-3 px-4 pt-4 lg:px-6">
        <Button asChild variant="ghost" size="icon">
          <Link to="/admin/certifications/templates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-lg font-bold">
            {isEdit ? t('certBuilder.editTitle') : t('certBuilder.createTitle')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('certBuilder.subtitle')}</p>
        </div>
      </div>

      <CertificateBuilder
        initialTitle={template?.title}
        initialDesignId={template?.design_id ?? undefined}
        initialDesign={initialDesign}
        saving={saveMutation.isPending}
        onCancel={() => navigate('/admin/certifications/templates')}
        onSave={async value => {
          await saveMutation.mutateAsync(value);
        }}
      />
    </DashboardLayout>
  );
}

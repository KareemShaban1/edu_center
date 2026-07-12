import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import { adminWhatsAppApi, type WhatsAppTemplate } from '@/services/endpoints/admin-whatsapp';
import WhatsAppTemplatesGuide from '@/components/admin/WhatsAppTemplatesGuide';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useMemo, useState } from 'react';

function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) ?? [];
  return [...new Set(matches.map(token => token.replace(/[{}]/g, '')))];
}

export default function AdminWhatsAppTemplates() {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-whatsapp-templates'],
    queryFn: () => adminWhatsAppApi.listTemplates(),
  });

  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: Pick<WhatsAppTemplate, 'name' | 'content'>; id?: number }) =>
      id ? adminWhatsAppApi.updateTemplate(id, payload) : adminWhatsAppApi.createTemplate(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-templates'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminWhatsAppApi.deleteTemplate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-whatsapp-templates'] });
    },
  });

  const columns: CrudColumn<WhatsAppTemplate>[] = useMemo(
    () => [
      { key: 'id', label: t('col.id'), sortable: true, hideOnMobile: true },
      { key: 'name', label: t('col.name'), sortable: true, primary: true },
      {
        key: 'variables',
        label: t('whatsapp.variables'),
        render: item =>
          item.variables?.length ? item.variables.map(v => `{{${v}}}`).join(', ') : '—',
      },
      {
        key: 'content',
        label: t('col.message'),
        render: item => (
          <span className="line-clamp-2 max-w-md whitespace-pre-wrap text-muted-foreground">{item.content}</span>
        ),
      },
    ],
    [t],
  );

  return (
    <CrudPage
      title={t('whatsapp.templatesTitle')}
      description={t('whatsapp.templatesDesc')}
      columns={columns}
      data={isLoading ? [] : templates}
      searchKeys={['name', 'content']}
      actions={(
        <>
          <WhatsAppTemplatesGuide />
          <Button variant="outline" size="sm" asChild className="gap-2">
            <Link to="/admin/whatsapp">
              <Send className="h-4 w-4" />
              {t('whatsapp.sendTitle')}
            </Link>
          </Button>
        </>
      )}
      onDelete={item => {
        void deleteMutation.mutateAsync(item.id);
      }}
      renderForm={(item, onClose) => (
        <TemplateForm
          item={item}
          onClose={onClose}
          saving={saveMutation.isPending}
          onSave={async payload => {
            try {
              await saveMutation.mutateAsync({ payload, id: item?.id });
              onClose();
            } catch (error) {
              const message = error instanceof Error ? error.message : t('whatsapp.saveFailed');
              toast({ title: t('whatsapp.saveFailed'), description: message, variant: 'destructive' });
            }
          }}
        />
      )}
    />
  );
}

function TemplateForm({
  item,
  onClose,
  onSave,
  saving,
}: {
  item: WhatsAppTemplate | null;
  onClose: () => void;
  onSave: (payload: Pick<WhatsAppTemplate, 'name' | 'content'>) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(item?.name ?? '');
  const [content, setContent] = useState(item?.content ?? '');
  const variables = useMemo(() => extractVariables(content), [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    await onSave({ name: name.trim(), content: content.trim() });
  };

  return (
    <FormDialog
      open
      onClose={onClose}
      title={item ? t('whatsapp.editTemplate') : t('whatsapp.addTemplate')}
      onSubmit={handleSubmit}
      loading={saving}
    >
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">{t('col.name')}</label>
          <input
            title={t('col.name')}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t('col.message')}</label>
          <textarea
            title={t('col.message')}
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            rows={6}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={t('whatsapp.templatePlaceholder')}
            required
          />
          <p className="mt-2 text-xs text-muted-foreground">{t('whatsapp.templateHint')}</p>
        </div>
        {variables.length > 0 && (
          <div className="rounded-lg border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{t('whatsapp.detectedVariables')}: </span>
            {variables.map(v => `{{${v}}}`).join(', ')}
          </div>
        )}
      </div>
    </FormDialog>
  );
}

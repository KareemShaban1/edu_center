import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import {
  inferWhatsAppMessageLang,
  inferWhatsAppTemplateType,
  insertWhatsAppVariable,
  isWhatsAppStarter,
  WHATSAPP_TEMPLATE_TYPES,
  WHATSAPP_TYPE_STARTERS,
  WHATSAPP_VARIABLES_BY_TYPE,
  type WhatsAppMessageLang,
  type WhatsAppTemplateType,
} from '@/lib/whatsapp-template-variables';
import WhatsAppMessagePreview from '@/components/admin/WhatsAppMessagePreview';
import { adminWhatsAppApi, type WhatsAppTemplate } from '@/services/endpoints/admin-whatsapp';
import WhatsAppTemplatesGuide from '@/components/admin/WhatsAppTemplatesGuide';
import { Link } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) ?? [];
  return [...new Set(matches.map(token => token.replace(/[{}]/g, '')))];
}

function typeLabel(type: string, t: (key: string) => string) {
  return t(`whatsapp.type.${type}`);
}

export default function AdminWhatsAppTemplates() {
  const { t } = useLocale();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['admin-whatsapp-templates'],
    queryFn: () => adminWhatsAppApi.listTemplates(),
  });

  const saveMutation = useMutation({
    mutationFn: ({ payload, id }: { payload: Pick<WhatsAppTemplate, 'name' | 'content'> & { type?: string }; id?: number }) =>
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
        key: 'type',
        label: t('col.type'),
        render: item => (
          <Badge variant="outline" className="font-normal">
            {typeLabel(inferWhatsAppTemplateType(item.name, item.type), t)}
          </Badge>
        ),
      },
      {
        key: 'variables',
        label: t('whatsapp.variables'),
        render: item =>
          item.variables?.length ? (
            <span className="flex flex-wrap gap-1">
              {item.variables.slice(0, 4).map(v => (
                <code key={v} className="rounded bg-muted px-1.5 py-0.5 text-[10px]">{`{{${v}}}`}</code>
              ))}
              {item.variables.length > 4 ? (
                <span className="text-xs text-muted-foreground">+{item.variables.length - 4}</span>
              ) : null}
            </span>
          ) : (
            '—'
          ),
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
      data={templates}
      loading={isLoading}
      searchKeys={['name', 'content', 'type']}
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
  onSave: (payload: Pick<WhatsAppTemplate, 'name' | 'content'> & { type?: string }) => Promise<void>;
  saving: boolean;
}) {
  const { t } = useLocale();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [name, setName] = useState(item?.name ?? '');
  const [type, setType] = useState<WhatsAppTemplateType>(
    inferWhatsAppTemplateType(item?.name ?? '', item?.type),
  );
  const [lang, setLang] = useState<WhatsAppMessageLang>(
    item?.content ? inferWhatsAppMessageLang(item.content) : 'ar',
  );
  const [content, setContent] = useState(item?.content ?? WHATSAPP_TYPE_STARTERS.ar.general);
  const variables = useMemo(() => extractVariables(content), [content]);
  const available = WHATSAPP_VARIABLES_BY_TYPE[type];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';

  const insertVariable = (key: string) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? content.length;
    const end = el?.selectionEnd ?? content.length;
    const { next, cursor } = insertWhatsAppVariable(content, key, start, end);
    setContent(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(cursor, cursor);
    });
  };

  const applyStarter = (nextType: WhatsAppTemplateType, nextLang: WhatsAppMessageLang) => {
    if (!content.trim() || isWhatsAppStarter(content)) {
      setContent(WHATSAPP_TYPE_STARTERS[nextLang][nextType]);
    }
  };

  const handleTypeChange = (nextType: WhatsAppTemplateType) => {
    setType(nextType);
    applyStarter(nextType, lang);
  };

  const handleLangChange = (nextLang: WhatsAppMessageLang) => {
    setLang(nextLang);
    applyStarter(type, nextLang);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    await onSave({ name: name.trim(), content: content.trim(), type });
  };

  return (
    <FormDialog
      open
      size="lg"
      onClose={onClose}
      title={item ? t('whatsapp.editTemplate') : t('whatsapp.addTemplate')}
      description={t('whatsapp.templateFormDesc')}
      onSubmit={handleSubmit}
      loading={saving}
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t('col.name')} id="wa-tpl-name" required>
            <FormInput id="wa-tpl-name" value={name} onChange={e => setName(e.target.value)} required />
          </FormField>
          <FormField label={t('whatsapp.templateType')} id="wa-tpl-type">
            <FormSelect
              id="wa-tpl-type"
              value={type}
              onChange={e => handleTypeChange(e.target.value as WhatsAppTemplateType)}
            >
              {WHATSAPP_TEMPLATE_TYPES.map(value => (
                <option key={value} value={value}>{typeLabel(value, t)}</option>
              ))}
            </FormSelect>
          </FormField>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">{t('whatsapp.messageLanguage')}</p>
          <p className="mb-2 text-xs text-muted-foreground">{t('whatsapp.messageLanguageHint')}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={lang === 'ar' ? 'default' : 'outline'}
              onClick={() => handleLangChange('ar')}
            >
              {t('whatsapp.langArabic')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={lang === 'en' ? 'default' : 'outline'}
              onClick={() => handleLangChange('en')}
            >
              {t('whatsapp.langEnglish')}
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">{t('whatsapp.insertVariables')}</p>
          <p className="mb-2 text-xs text-muted-foreground">{t('whatsapp.insertVariablesHint')}</p>
          <div className="flex flex-wrap gap-1.5">
            {available.map(variable => {
              const used = variables.includes(variable.key);
              return (
                <Button
                  key={variable.key}
                  type="button"
                  size="sm"
                  variant={used ? 'secondary' : 'outline'}
                  className="h-8 gap-1 px-2 font-mono text-xs"
                  onClick={() => insertVariable(variable.key)}
                >
                  {`{{${variable.key}}}`}
                  <span className="font-sans font-normal text-muted-foreground">{t(variable.labelKey)}</span>
                </Button>
              );
            })}
          </div>
        </div>

        <FormField label={t('col.message')} id="wa-tpl-content" required>
          <FormTextarea
            ref={textareaRef}
            id="wa-tpl-content"
            className="min-h-[140px] font-sans"
            dir={dir}
            lang={lang}
            rows={7}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={WHATSAPP_TYPE_STARTERS[lang][type]}
            required
          />
        </FormField>

        <div>
          <p className="mb-1.5 text-sm font-medium">{t('whatsapp.livePreview')}</p>
          <p className="mb-2 text-xs text-muted-foreground">{t('whatsapp.previewHint')}</p>
          <WhatsAppMessagePreview content={content} lang={lang} />
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

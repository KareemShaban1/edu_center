import { useMemo, useState } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import CertificatePreview from '@/components/certification/CertificatePreview';
import {
  CERTIFICATE_DESIGN_PRESETS,
  BORDER_STYLE_OPTIONS,
  FONT_OPTIONS,
  designConfigFromPreset,
  cloneDesignConfig,
} from '@/lib/certification/design-presets';
import type { CertificateDesignConfig, CertificateCategory } from '@/lib/certification/types';
import { BUILTIN_VARIABLES } from '@/lib/certification/types';
import { collectDesignVariables, buildContentFromDesign } from '@/lib/certification/render-utils';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Check, Palette, Type, Layout, Variable } from 'lucide-react';

export interface CertificateBuilderValue {
  title: string;
  design_id: string;
  design: CertificateDesignConfig;
  content: string;
  variables: string[];
}

interface CertificateBuilderProps {
  initialTitle?: string;
  initialDesignId?: string;
  initialDesign?: CertificateDesignConfig | null;
  saving?: boolean;
  onSave: (value: CertificateBuilderValue) => Promise<void>;
  onCancel: () => void;
}

const CATEGORIES: CertificateCategory[] = ['classic', 'modern', 'academic', 'elegant', 'arabic', 'kids'];

function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 w-10 cursor-pointer rounded border border-input"
        title={label}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium">{label}</p>
        <p className="truncate text-[10px] text-muted-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function CertificateBuilder({
  initialTitle = '',
  initialDesignId,
  initialDesign,
  saving = false,
  onSave,
  onCancel,
}: CertificateBuilderProps) {
  const { t } = useLocale();
  const startPreset = initialDesignId ?? initialDesign?.presetId ?? CERTIFICATE_DESIGN_PRESETS[0].id;
  const [title, setTitle] = useState(initialTitle || t('certification.newTemplateDefault'));
  const [design, setDesign] = useState<CertificateDesignConfig>(
    () => initialDesign ? cloneDesignConfig(initialDesign) : designConfigFromPreset(startPreset),
  );
  const [categoryFilter, setCategoryFilter] = useState<CertificateCategory | 'all'>('all');
  const [activeTab, setActiveTab] = useState('design');

  const filteredPresets = useMemo(() => {
    if (categoryFilter === 'all') return CERTIFICATE_DESIGN_PRESETS;
    return CERTIFICATE_DESIGN_PRESETS.filter(p => p.category === categoryFilter);
  }, [categoryFilter]);

  const variables = useMemo(() => collectDesignVariables(design), [design]);

  const updateDesign = (patch: Partial<CertificateDesignConfig>) => {
    setDesign(prev => ({ ...prev, ...patch }));
  };

  const updateColors = (key: keyof CertificateDesignConfig['colors'], value: string) => {
    setDesign(prev => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
  };

  const updateLayout = (key: keyof CertificateDesignConfig['layout'], value: boolean | string) => {
    setDesign(prev => ({ ...prev, layout: { ...prev.layout, [key]: value } }));
  };

  const updateFields = (key: keyof CertificateDesignConfig['fields'], value: string) => {
    setDesign(prev => ({ ...prev, fields: { ...prev.fields, [key]: value } }));
  };

  const applyPreset = (presetId: string) => {
    const next = designConfigFromPreset(presetId);
    setDesign(prev => ({
      ...next,
      fields: prev.fields.heading ? prev.fields : next.fields,
      logoUrl: prev.logoUrl ?? next.logoUrl,
    }));
  };

  const insertVariable = (field: keyof CertificateDesignConfig['fields'], varName: string) => {
    const token = `{{${varName}}}`;
    setDesign(prev => ({
      ...prev,
      fields: { ...prev.fields, [field]: `${prev.fields[field]}${prev.fields[field] ? ' ' : ''}${token}` },
    }));
  };

  const handleSave = async () => {
    const content = buildContentFromDesign(design);
    await onSave({
      title: title.trim(),
      design_id: design.presetId,
      design,
      content,
      variables,
    });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Sidebar controls */}
      <div className="flex w-full flex-col border-b lg:w-[420px] lg:border-b-0 lg:border-e lg:overflow-y-auto">
        <div className="border-b p-4">
          <FormField label={t('col.title')} id="builder-title">
            <FormInput id="builder-title" value={title} onChange={e => setTitle(e.target.value)} />
          </FormField>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="mx-4 mt-3 grid w-auto grid-cols-4">
            <TabsTrigger value="design" className="gap-1 text-xs">
              <Palette className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('certBuilder.tabDesign')}</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-1 text-xs">
              <Type className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('certBuilder.tabContent')}</span>
            </TabsTrigger>
            <TabsTrigger value="style" className="gap-1 text-xs">
              <Layout className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('certBuilder.tabStyle')}</span>
            </TabsTrigger>
            <TabsTrigger value="variables" className="gap-1 text-xs">
              <Variable className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('certBuilder.tabVars')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="design" className="space-y-4 px-4 pb-4">
            <div>
              <p className="mb-2 text-sm font-medium">{t('certBuilder.chooseDesign')}</p>
              <div className="mb-3 flex flex-wrap gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant={categoryFilter === 'all' ? 'default' : 'outline'}
                  className="h-7 text-xs"
                  onClick={() => setCategoryFilter('all')}
                >
                  {t('certBuilder.all')}
                </Button>
                {CATEGORIES.map(cat => (
                  <Button
                    key={cat}
                    type="button"
                    size="sm"
                    variant={categoryFilter === cat ? 'default' : 'outline'}
                    className="h-7 text-xs"
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {t(`certBuilder.cat.${cat}`)}
                  </Button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-[320px] overflow-y-auto pr-1">
                {filteredPresets.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.id)}
                    className={cn(
                      'relative rounded-lg border p-1 text-start transition hover:shadow-md',
                      design.presetId === preset.id && 'ring-2 ring-primary',
                    )}
                  >
                    <CertificatePreview design={preset.config} compact />
                    <p className="mt-1 truncate px-1 text-[10px] font-medium">{t(preset.nameKey)}</p>
                    {design.presetId === preset.id && (
                      <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="space-y-3 px-4 pb-4">
            {(['heading', 'subtitle', 'body', 'footer'] as const).map(field => (
              <FormField key={field} label={t(`certBuilder.field.${field}`)} id={`field-${field}`}>
                {field === 'body' ? (
                  <FormTextarea
                    id={`field-${field}`}
                    rows={3}
                    value={design.fields[field]}
                    onChange={e => updateFields(field, e.target.value)}
                  />
                ) : (
                  <FormInput
                    id={`field-${field}`}
                    value={design.fields[field]}
                    onChange={e => updateFields(field, e.target.value)}
                  />
                )}
              </FormField>
            ))}
            <p className="text-xs text-muted-foreground">{t('certification.templateHint')}</p>
          </TabsContent>

          <TabsContent value="style" className="space-y-4 px-4 pb-4">
            <FormField label={t('certBuilder.orientation')} id="orientation">
              <FormSelect
                id="orientation"
                value={design.orientation}
                onChange={e => updateDesign({ orientation: e.target.value as CertificateDesignConfig['orientation'] })}
              >
                <option value="landscape">{t('certBuilder.landscape')}</option>
                <option value="portrait">{t('certBuilder.portrait')}</option>
              </FormSelect>
            </FormField>

            <FormField label={t('certBuilder.borderStyle')} id="border-style">
              <FormSelect
                id="border-style"
                value={design.layout.borderStyle}
                onChange={e => updateLayout('borderStyle', e.target.value)}
              >
                {BORDER_STYLE_OPTIONS.map(style => (
                  <option key={style} value={style}>{t(`certBuilder.border.${style}`)}</option>
                ))}
              </FormSelect>
            </FormField>

            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={design.layout.showBorder} onChange={e => updateLayout('showBorder', e.target.checked)} />
                {t('certBuilder.showBorder')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={design.layout.showSeal} onChange={e => updateLayout('showSeal', e.target.checked)} />
                {t('certBuilder.showSeal')}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={design.layout.showLogo} onChange={e => updateLayout('showLogo', e.target.checked)} />
                {t('certBuilder.showLogo')}
              </label>
            </div>

            <FormField label={t('certBuilder.headingFont')} id="font-heading">
              <FormSelect
                id="font-heading"
                value={design.fonts.heading}
                onChange={e => setDesign(prev => ({ ...prev, fonts: { ...prev.fonts, heading: e.target.value } }))}
              >
                {FONT_OPTIONS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </FormSelect>
            </FormField>

            <FormField label={t('certBuilder.bodyFont')} id="font-body">
              <FormSelect
                id="font-body"
                value={design.fonts.body}
                onChange={e => setDesign(prev => ({ ...prev, fonts: { ...prev.fonts, body: e.target.value } }))}
              >
                {FONT_OPTIONS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </FormSelect>
            </FormField>

            <FormField label={t('certBuilder.logoUrl')} id="logo-url">
              <FormInput
                id="logo-url"
                value={design.logoUrl ?? ''}
                onChange={e => updateDesign({ logoUrl: e.target.value || null })}
                placeholder="https://..."
              />
            </FormField>

            <div>
              <p className="mb-2 text-sm font-medium">{t('certBuilder.colors')}</p>
              <div className="grid grid-cols-2 gap-3">
                <ColorInput label={t('certBuilder.colorPrimary')} value={design.colors.primary} onChange={v => updateColors('primary', v)} />
                <ColorInput label={t('certBuilder.colorSecondary')} value={design.colors.secondary} onChange={v => updateColors('secondary', v)} />
                <ColorInput label={t('certBuilder.colorAccent')} value={design.colors.accent} onChange={v => updateColors('accent', v)} />
                <ColorInput label={t('certBuilder.colorText')} value={design.colors.text} onChange={v => updateColors('text', v)} />
                <ColorInput label={t('certBuilder.colorBorder')} value={design.colors.border} onChange={v => updateColors('border', v)} />
                <ColorInput label={t('certBuilder.colorBg')} value={design.colors.background} onChange={v => updateColors('background', v)} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="variables" className="space-y-4 px-4 pb-4">
            <p className="text-sm text-muted-foreground">{t('certBuilder.varsDesc')}</p>
            <div className="flex flex-wrap gap-1">
              {BUILTIN_VARIABLES.map(v => (
                <Badge key={v} variant="secondary" className="font-mono text-xs">{`{{${v}}}`}</Badge>
              ))}
            </div>
            {variables.length > 0 && (
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="mb-2 text-xs font-medium">{t('certification.detectedVariables')}</p>
                <div className="flex flex-wrap gap-1">
                  {variables.map(v => (
                    <Badge key={v} variant="outline" className="font-mono text-xs">{`{{${v}}}`}</Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-xs font-medium">{t('certBuilder.insertVar')}</p>
              {(['heading', 'subtitle', 'body', 'footer'] as const).map(field => (
                <div key={field} className="flex flex-wrap items-center gap-1">
                  <span className="w-16 text-xs text-muted-foreground">{t(`certBuilder.field.${field}`)}:</span>
                  {BUILTIN_VARIABLES.slice(0, 4).map(v => (
                    <Button key={v} type="button" variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => insertVariable(field, v)}>
                      {v}
                    </Button>
                  ))}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-auto flex gap-2 border-t p-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={saving}>
            {t('crud.cancel')}
          </Button>
          <Button type="button" className="flex-1 bg-amber-600 hover:bg-amber-700" onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? t('crud.saving') : t('crud.save')}
          </Button>
        </div>
      </div>

      {/* Live preview */}
      <div className="flex flex-1 flex-col bg-slate-100 dark:bg-slate-900/50">
        <div className="border-b bg-card px-4 py-3">
          <p className="text-sm font-medium">{t('certBuilder.livePreview')}</p>
          <p className="text-xs text-muted-foreground">{t('certBuilder.previewNote')}</p>
        </div>
        <div className="flex flex-1 items-center justify-center overflow-auto p-6">
          <div className="w-full max-w-3xl shadow-2xl">
            <CertificatePreview design={design} />
          </div>
        </div>
      </div>
    </div>
  );
}

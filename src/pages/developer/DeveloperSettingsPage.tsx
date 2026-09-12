import React, { useEffect, useRef, useState } from 'react';
import { FormField, FormSelect } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { useBranding } from '@/contexts/BrandingContext';
import {
  APP_ARABIC_FONT_OPTIONS,
  APP_LATIN_FONT_OPTIONS,
  APP_TEXT_SCALE_OPTIONS,
  applyBrandingToDocument,
  colorInputValue,
  hexToRgb,
  normalizeBranding,
  type AppBranding,
} from '@/lib/branding';
import { Loader2, Palette, Type, LayoutList, Globe } from 'lucide-react';
import { resolveLandingFonts } from '@/components/landing/platform-landing/typography';

function ScaleSelect({
  id,
  label,
  value,
  onChange,
  t,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  t: (key: string) => string;
}) {
  return (
    <FormField label={label} id={id}>
      <FormSelect id={id} value={value} onChange={e => onChange(e.target.value)}>
        {APP_TEXT_SCALE_OPTIONS.map(opt => (
          <option key={`${id}-${opt.value}`} value={opt.value}>
            {t(opt.labelKey)} ({opt.value}%)
          </option>
        ))}
      </FormSelect>
    </FormField>
  );
}

export default function DeveloperSettingsPage() {
  const { t } = useLocale();
  const { branding, loading, save } = useBranding();
  const [form, setForm] = useState<AppBranding>(() => normalizeBranding(branding));
  const [saving, setSaving] = useState(false);
  const [colorHex, setColorHex] = useState(colorInputValue(branding.primary_color));

  const savedBrandingRef = useRef(branding);
  savedBrandingRef.current = branding;

  useEffect(() => {
    const next = normalizeBranding(branding);
    setForm(next);
    setColorHex(colorInputValue(next.primary_color));
  }, [branding]);

  useEffect(() => {
    applyBrandingToDocument(form);
    return () => applyBrandingToDocument(savedBrandingRef.current);
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await save(form);
      toast({ title: t('platform.settings.saved'), description: t('platform.settings.savedDesc') });
    } catch {
      toast({ title: t('platform.settings.saveFailed'), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = (hex: string) => {
    setColorHex(hex);
    setForm(prev => ({ ...prev, primary_color: hexToRgb(hex) }));
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="me-2 h-5 w-5 animate-spin" />
        {t('landing.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('platform.settings.title')}</h1>
        <p className="page-description">{t('platform.settings.desc')}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <h3 className="font-display font-semibold">{t('platform.settings.appearance')}</h3>
              </div>

              <FormField label={t('platform.settings.primaryColor')} id="primary-color">
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    id="primary-color"
                    type="color"
                    value={colorHex}
                    onChange={e => handleColorChange(e.target.value)}
                    className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-transparent p-1"
                    aria-label={t('platform.settings.primaryColor')}
                  />
                  <div
                    className="flex h-11 min-w-[140px] flex-1 items-center rounded-lg border border-border px-3 text-sm font-medium text-foreground"
                    style={{ backgroundColor: form.primary_color, color: '#fff' }}
                  >
                    {form.primary_color}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleColorChange('#ba181b')}
                  >
                    {t('platform.settings.resetColor')}
                  </Button>
                </div>
              </FormField>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
              <div className="flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                <h3 className="font-display font-semibold">{t('platform.settings.typography')}</h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label={t('platform.settings.fontLatinBody')} id="font-latin-body">
                  <FormSelect
                    id="font-latin-body"
                    value={form.font_body}
                    onChange={e => setForm(prev => ({ ...prev, font_body: e.target.value }))}
                  >
                    {APP_LATIN_FONT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value} style={{ fontFamily: opt.value }}>
                        {opt.label}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>

                <FormField label={t('platform.settings.fontLatinDisplay')} id="font-latin-display">
                  <FormSelect
                    id="font-latin-display"
                    value={form.font_display}
                    onChange={e => setForm(prev => ({ ...prev, font_display: e.target.value }))}
                  >
                    {APP_LATIN_FONT_OPTIONS.map(opt => (
                      <option key={`display-${opt.value}`} value={opt.value} style={{ fontFamily: opt.value }}>
                        {opt.label}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>

                <FormField label={t('platform.settings.fontArabic')} id="font-arabic">
                  <FormSelect
                    id="font-arabic"
                    value={form.font_arabic}
                    onChange={e => setForm(prev => ({ ...prev, font_arabic: e.target.value }))}
                  >
                    {APP_ARABIC_FONT_OPTIONS.map(opt => (
                      <option key={`ar-${opt.value}`} value={opt.value} style={{ fontFamily: opt.value }}>
                        {opt.label}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>

                <FormField label={t('platform.settings.textSizeLatin')} id="text-scale">
                  <FormSelect
                    id="text-scale"
                    value={form.text_scale}
                    onChange={e => setForm(prev => ({ ...prev, text_scale: e.target.value }))}
                  >
                    {APP_TEXT_SCALE_OPTIONS.map(opt => (
                      <option key={`scale-${opt.value}`} value={opt.value}>
                        {t(opt.labelKey)} ({opt.value}%)
                      </option>
                    ))}
                  </FormSelect>
                </FormField>

                <FormField label={t('platform.settings.textSizeArabic')} id="text-scale-ar">
                  <FormSelect
                    id="text-scale-ar"
                    value={form.text_scale_ar}
                    onChange={e => setForm(prev => ({ ...prev, text_scale_ar: e.target.value }))}
                  >
                    {APP_TEXT_SCALE_OPTIONS.map(opt => (
                      <option key={`scale-ar-${opt.value}`} value={opt.value}>
                        {t(opt.labelKey)} ({opt.value}%)
                      </option>
                    ))}
                  </FormSelect>
                </FormField>
              </div>

              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-medium">{t('platform.settings.preview')}</p>
                <p style={{ fontFamily: form.font_body, fontSize: `calc(1rem * ${form.text_scale} / 100)` }}>
                  {t('platform.settings.previewLatinBody')}
                </p>
                <p style={{ fontFamily: form.font_display, fontSize: `calc(1.125rem * ${form.text_scale} / 100)` }}>
                  {t('platform.settings.previewLatinDisplay')}
                </p>
                <p dir="rtl" style={{ fontFamily: form.font_arabic, fontSize: `calc(1rem * ${form.text_scale_ar} / 100)` }}>
                  {t('platform.settings.previewArabic')}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
              <div className="flex items-center gap-2">
                <LayoutList className="h-5 w-5 text-primary" />
                <h3 className="font-display font-semibold">{t('platform.settings.componentSizes')}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{t('platform.settings.componentSizesDesc')}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <ScaleSelect
                  id="nav-font-scale"
                  label={t('platform.settings.navSizeLatin')}
                  value={form.nav_font_scale}
                  onChange={value => setForm(prev => ({ ...prev, nav_font_scale: value }))}
                  t={t}
                />
                <ScaleSelect
                  id="nav-font-scale-ar"
                  label={t('platform.settings.navSizeArabic')}
                  value={form.nav_font_scale_ar}
                  onChange={value => setForm(prev => ({ ...prev, nav_font_scale_ar: value }))}
                  t={t}
                />
                <ScaleSelect
                  id="button-font-scale"
                  label={t('platform.settings.buttonSizeLatin')}
                  value={form.button_font_scale}
                  onChange={value => setForm(prev => ({ ...prev, button_font_scale: value }))}
                  t={t}
                />
                <ScaleSelect
                  id="button-font-scale-ar"
                  label={t('platform.settings.buttonSizeArabic')}
                  value={form.button_font_scale_ar}
                  onChange={value => setForm(prev => ({ ...prev, button_font_scale_ar: value }))}
                  t={t}
                />
                <ScaleSelect
                  id="table-font-scale"
                  label={t('platform.settings.tableSizeLatin')}
                  value={form.table_font_scale}
                  onChange={value => setForm(prev => ({ ...prev, table_font_scale: value }))}
                  t={t}
                />
                <ScaleSelect
                  id="table-font-scale-ar"
                  label={t('platform.settings.tableSizeArabic')}
                  value={form.table_font_scale_ar}
                  onChange={value => setForm(prev => ({ ...prev, table_font_scale_ar: value }))}
                  t={t}
                />
              </div>

              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 space-y-3">
                <p className="text-sm font-medium">{t('platform.settings.componentPreview')}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className="rounded-lg bg-sidebar px-3 py-2 text-sidebar-foreground"
                    style={{ fontSize: `calc(1rem * ${form.nav_font_scale} / 100)` }}
                  >
                    {t('platform.settings.previewNav')}
                  </span>
                  <span
                    className="inline-flex rounded-md bg-primary px-4 py-2 text-primary-foreground"
                    style={{ fontSize: `calc(0.875rem * ${form.button_font_scale} / 100)` }}
                  >
                    {t('platform.settings.previewButton')}
                  </span>
                </div>
                <div
                  className="overflow-hidden rounded-lg border border-border"
                  style={{ fontSize: `calc(1rem * ${form.table_font_scale} / 100)` }}
                >
                  <div className="grid grid-cols-2 bg-muted/50 px-3 py-2 font-medium text-muted-foreground">
                    <span>{t('col.name')}</span>
                    <span>{t('col.status')}</span>
                  </div>
                  <div className="grid grid-cols-2 border-t border-border px-3 py-2">
                    <span>{t('platform.settings.previewTableRow')}</span>
                    <span>{t('payments.status.paid')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-card space-y-5">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            <h3 className="font-display font-semibold">{t('platform.settings.landingSizes')}</h3>
          </div>
          <p className="text-sm text-muted-foreground">{t('platform.settings.landingSizesDesc')}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <ScaleSelect
              id="landing-text-scale"
              label={t('platform.settings.landingSizeLatin')}
              value={form.landing_text_scale}
              onChange={value => setForm(prev => ({ ...prev, landing_text_scale: value }))}
              t={t}
            />
            <ScaleSelect
              id="landing-text-scale-ar"
              label={t('platform.settings.landingSizeArabic')}
              value={form.landing_text_scale_ar}
              onChange={value => setForm(prev => ({ ...prev, landing_text_scale_ar: value }))}
              t={t}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {([
              {
                lang: 'en' as const,
                scale: form.landing_text_scale,
                bodyFont: form.font_body,
                displayFont: form.font_display,
                previewLabelKey: 'platform.settings.landingPreviewEn',
                titleKey: 'platform.settings.landingSampleTitleEn',
                subtitleKey: 'platform.settings.landingSampleSubtitleEn',
                sectionKey: 'platform.settings.landingSampleSectionEn',
                cardKey: 'platform.settings.landingSampleCardEn',
              },
              {
                lang: 'ar' as const,
                scale: form.landing_text_scale_ar,
                bodyFont: form.font_arabic,
                displayFont: form.font_arabic,
                previewLabelKey: 'platform.settings.landingPreviewAr',
                titleKey: 'platform.settings.landingSampleTitleAr',
                subtitleKey: 'platform.settings.landingSampleSubtitleAr',
                sectionKey: 'platform.settings.landingSampleSectionAr',
                cardKey: 'platform.settings.landingSampleCardAr',
              },
            ]).map(preview => {
              const landingFonts = resolveLandingFonts('desktop', Number(preview.scale) || 100);
              return (
                <div
                  key={preview.lang}
                  dir={preview.lang === 'ar' ? 'rtl' : 'ltr'}
                  className="rounded-lg border border-dashed border-border bg-muted/30 p-4 space-y-3"
                >
                  <p className="text-sm font-medium">{t(preview.previewLabelKey)}</p>
                  <p className="font-bold leading-tight" style={{ fontFamily: preview.displayFont, fontSize: landingFonts.heroTitle }}>
                    {t(preview.titleKey)}
                  </p>
                  <p className="text-muted-foreground" style={{ fontFamily: preview.bodyFont, fontSize: landingFonts.heroSubtitle }}>
                    {t(preview.subtitleKey)}
                  </p>
                  <p className="font-semibold" style={{ fontFamily: preview.displayFont, fontSize: landingFonts.sectionTitle }}>
                    {t(preview.sectionKey)}
                  </p>
                  <p style={{ fontFamily: preview.bodyFont, fontSize: landingFonts.cardBody }}>
                    {t(preview.cardKey)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t('section.saveSettings')}
          </Button>
        </div>
      </form>
    </div>
  );
}

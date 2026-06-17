import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { FormField, FormSelect } from '@/components/FormFields';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { useBranding } from '@/contexts/BrandingContext';
import {
  APP_ARABIC_FONT_OPTIONS,
  APP_LATIN_FONT_OPTIONS,
  colorInputValue,
  hexToRgb,
  type AppBranding,
} from '@/lib/branding';
import { Loader2, Palette, Type } from 'lucide-react';

export default function PlatformSettings() {
  const { t } = useLocale();
  const { branding, loading, save } = useBranding();
  const [form, setForm] = useState<AppBranding>(branding);
  const [saving, setSaving] = useState(false);
  const [colorHex, setColorHex] = useState(colorInputValue(branding.primary_color));

  useEffect(() => {
    setForm(branding);
    setColorHex(colorInputValue(branding.primary_color));
  }, [branding]);

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

  const handleLatinFontChange = (value: string) => {
    setForm(prev => ({ ...prev, font_body: value, font_display: value }));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
          <Loader2 className="me-2 h-5 w-5 animate-spin" />
          {t('landing.loading')}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">{t('platform.settings.title')}</h1>
        <p className="page-description">{t('platform.settings.desc')}</p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
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

          <FormField label={t('platform.settings.fontLatin')} id="font-latin">
            <FormSelect
              id="font-latin"
              value={form.font_body}
              onChange={e => handleLatinFontChange(e.target.value)}
            >
              {APP_LATIN_FONT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
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

          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 space-y-2">
            <p className="text-sm font-medium">{t('platform.settings.preview')}</p>
            <p style={{ fontFamily: form.font_body }}>{t('platform.settings.previewLatin')}</p>
            <p dir="rtl" style={{ fontFamily: form.font_arabic }}>{t('platform.settings.previewArabic')}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t('section.saveSettings')}
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/contexts/LocaleContext';
import { ANIMATION_OPTIONS } from '@/lib/landing/constants';
import { FONT_FAMILIES, FONT_WEIGHTS, getSectionTextFields } from '@/lib/landing/typography';
import type { LandingPage, LandingSection, LocalizedText, TextStyle } from '@/types/landing';
import { SECTION_CATALOG } from '@/lib/landing/constants';
import { TypographyControls } from './TypographyControls';
import { SectionImageEditor } from './SectionImageEditor';

interface PropertiesPanelProps {
  page: LandingPage;
  section: LandingSection | null;
  previewLocale: 'en' | 'ar';
  selectedTextKey?: string | null;
  onSelectTextField?: (key: string | null) => void;
  onUpdateSection: (id: string, patch: Partial<LandingSection>) => void;
  onUpdateSectionContent: (id: string, content: Record<string, unknown>) => void;
  onUpdateSectionStyle: (id: string, style: Partial<NonNullable<LandingSection['style']>>) => void;
  onUpdateTextStyle: (sectionId: string, fieldKey: string, style?: TextStyle) => void;
  onUpdateTheme: (theme: Partial<LandingPage['theme']>) => void;
  onUpdateSeo: (seo: Partial<LandingPage['seo']>) => void;
  onUpdateBranding: (branding: Partial<LandingPage['branding']>) => void;
  onUpdateMeta: (patch: Partial<LandingPage>) => void;
  onPickFromMedia?: (apply: (url: string) => void) => void;
}

function LocalizedField({
  label, value, locale, onChange,
}: {
  label: string;
  value: LocalizedText;
  locale: 'en' | 'ar';
  onChange: (v: LocalizedText) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label} ({locale.toUpperCase()})</Label>
      <Input
        value={value[locale]}
        onChange={e => onChange({ ...value, [locale]: e.target.value })}
      />
    </div>
  );
}

export function PropertiesPanel({
  page, section, previewLocale, selectedTextKey, onSelectTextField,
  onUpdateSection, onUpdateSectionContent, onUpdateSectionStyle, onUpdateTextStyle, onUpdateTheme, onUpdateSeo, onUpdateBranding, onUpdateMeta,
  onPickFromMedia,
}: PropertiesPanelProps) {
  const { t } = useLocale();
  const textFields = section ? getSectionTextFields(section.type) : [];

  return (
    <div className="w-80 border-s bg-muted/30 flex flex-col shrink-0 h-full min-h-0 overflow-hidden">
      <Tabs defaultValue="typography" className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <TabsList className="mx-3 mt-3 grid grid-cols-5 shrink-0">
          <TabsTrigger value="typography" className="text-[10px] px-1">{t('landing.typography')}</TabsTrigger>
          <TabsTrigger value="section" className="text-[10px] px-1">{t('landing.section')}</TabsTrigger>
          <TabsTrigger value="design" className="text-[10px] px-1">{t('landing.design')}</TabsTrigger>
          <TabsTrigger value="seo" className="text-[10px] px-1">SEO</TabsTrigger>
          <TabsTrigger value="page" className="text-[10px] px-1">{t('landing.page')}</TabsTrigger>
        </TabsList>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
          <div className="pb-4">
          <TabsContent value="typography" className="p-3 space-y-3 mt-0">
            {!section ? (
              <p className="text-sm text-muted-foreground">{t('landing.selectSection')}</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">{t('landing.typoHint')}</p>
                {textFields.map(field => (
                  <TypographyControls
                    key={field.key}
                    fieldKey={field.key}
                    fieldLabel={t(field.labelKey)}
                    value={section.textStyles?.[field.key]}
                    isActive={selectedTextKey === field.key}
                    onSelect={() => onSelectTextField?.(field.key)}
                    onChange={style => onUpdateTextStyle(section.id, field.key, style)}
                  />
                ))}
              </>
            )}
          </TabsContent>

          <TabsContent value="section" className="p-3 space-y-4 mt-0">
            {!section ? (
              <p className="text-sm text-muted-foreground">{t('landing.selectSection')}</p>
            ) : (
              <>
                <div>
                  <Label className="text-xs">{t('landing.sectionType')}</Label>
                  <p className="text-sm font-medium">
                    {t(SECTION_CATALOG.find(s => s.type === section.type)?.labelKey ?? section.type)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs">{t('landing.visible')}</Label>
                  <Switch checked={section.visible} onCheckedChange={v => onUpdateSection(section.id, { visible: v })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('landing.animation')}</Label>
                  <Select value={section.animation ?? 'fade-in'} onValueChange={v => onUpdateSection(section.id, { animation: v as LandingSection['animation'] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ANIMATION_OPTIONS.map(a => (
                        <SelectItem key={a.value} value={a.value}>{t(a.labelKey)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <SectionImageEditor
                  section={section}
                  onPickFromMedia={onPickFromMedia}
                  onUpdateContent={patch => onUpdateSectionContent(section.id, patch)}
                  onUpdateStyle={patch => onUpdateSectionStyle(section.id, patch)}
                />
                <Separator />
                <div className="space-y-1">
                  <Label className="text-xs">{t('landing.bgColor')}</Label>
                  <Input type="color" value={section.style?.backgroundColor ?? '#ffffff'} onChange={e => onUpdateSection(section.id, { style: { ...section.style, backgroundColor: e.target.value } })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('landing.sectionTextColor')}</Label>
                  <Input type="color" value={section.style?.textColor ?? page.theme.textColor} onChange={e => onUpdateSection(section.id, { style: { ...section.style, textColor: e.target.value } })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('landing.paddingTop')}</Label>
                  <Slider value={[section.style?.paddingTop ?? 64]} min={0} max={128} step={8} onValueChange={([v]) => onUpdateSection(section.id, { style: { ...section.style, paddingTop: v } })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('landing.paddingBottom')}</Label>
                  <Slider value={[section.style?.paddingBottom ?? 64]} min={0} max={128} step={8} onValueChange={([v]) => onUpdateSection(section.id, { style: { ...section.style, paddingBottom: v } })} />
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="design" className="p-3 space-y-4 mt-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('landing.globalTypography')}</p>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.headingFont')}</Label>
              <Select value={page.theme.headingFont} onValueChange={v => onUpdateTheme({ headingFont: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.bodyFont')}</Label>
              <Select value={page.theme.bodyFont} onValueChange={v => onUpdateTheme({ bodyFont: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_FAMILIES.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.headingSize')} ({page.theme.headingSize}px)</Label>
              <Slider value={[page.theme.headingSize]} min={20} max={72} step={2} onValueChange={([v]) => onUpdateTheme({ headingSize: v })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.bodySize')} ({page.theme.bodySize}px)</Label>
              <Slider value={[page.theme.bodySize]} min={12} max={24} step={1} onValueChange={([v]) => onUpdateTheme({ bodySize: v })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.headingFontWeight')}</Label>
              <Select value={String(page.theme.headingFontWeight ?? 700)} onValueChange={v => onUpdateTheme({ headingFontWeight: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHTS.map(w => (
                    <SelectItem key={w.value} value={String(w.value)}>{w.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.bodyFontWeight')}</Label>
              <Select value={String(page.theme.bodyFontWeight ?? 400)} onValueChange={v => onUpdateTheme({ bodyFontWeight: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FONT_WEIGHTS.map(w => (
                    <SelectItem key={w.value} value={String(w.value)}>{w.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.lineHeight')}</Label>
              <Slider value={[page.theme.lineHeight ?? 1.5]} min={1} max={2.5} step={0.1} onValueChange={([v]) => onUpdateTheme({ lineHeight: v })} />
            </div>
            <Separator />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t('landing.colors')}</p>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.primaryColor')}</Label>
              <Input type="color" value={page.theme.primaryColor} onChange={e => onUpdateTheme({ primaryColor: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.headingColor')}</Label>
              <Input type="color" value={page.theme.headingColor ?? page.theme.textColor} onChange={e => onUpdateTheme({ headingColor: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.bodyColor')}</Label>
              <Input type="color" value={page.theme.bodyColor ?? page.theme.textColor} onChange={e => onUpdateTheme({ bodyColor: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.bgColor')}</Label>
              <Input type="color" value={page.theme.backgroundColor} onChange={e => onUpdateTheme({ backgroundColor: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.borderRadius')}</Label>
              <Slider value={[page.theme.borderRadius]} min={0} max={32} step={2} onValueChange={([v]) => onUpdateTheme({ borderRadius: v })} />
            </div>
          </TabsContent>

          <TabsContent value="seo" className="p-3 space-y-4 mt-0">
            <LocalizedField label={t('landing.metaTitle')} value={page.seo.metaTitle} locale={previewLocale} onChange={v => onUpdateSeo({ metaTitle: v })} />
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.metaDescription')} ({previewLocale.toUpperCase()})</Label>
              <Textarea value={page.seo.metaDescription[previewLocale]} onChange={e => onUpdateSeo({ metaDescription: { ...page.seo.metaDescription, [previewLocale]: e.target.value } })} rows={3} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.keywords')}</Label>
              <Input value={page.seo.keywords.join(', ')} onChange={e => onUpdateSeo({ keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.ogImage')}</Label>
              <Input value={page.seo.ogImage ?? ''} onChange={e => onUpdateSeo({ ogImage: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.schemaType')}</Label>
              <Select value={page.seo.schemaType ?? 'organization'} onValueChange={v => onUpdateSeo({ schemaType: v as LandingPage['seo']['schemaType'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="page" className="p-3 space-y-4 mt-0">
            <LocalizedField label={t('landing.pageTitle')} value={page.title} locale={previewLocale} onChange={v => onUpdateMeta({ title: v })} />
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.slug')}</Label>
              <Input value={page.slug} onChange={e => onUpdateMeta({ slug: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.pageType')}</Label>
              <Select value={page.type} onValueChange={v => onUpdateMeta({ type: v as LandingPage['type'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['teacher', 'subject', 'course', 'event', 'branch', 'online_class', 'summer_course', 'exam_prep', 'center', 'custom'].map(tp => (
                    <SelectItem key={tp} value={tp}>{t(`landing.type.${tp}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.logoUrl')}</Label>
              <Input value={page.branding.logoUrl ?? ''} onChange={e => onUpdateBranding({ logoUrl: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('landing.customDomain')}</Label>
              <Input value={page.branding.customDomain ?? ''} onChange={e => onUpdateBranding({ customDomain: e.target.value })} placeholder="www.yourschool.com" />
            </div>
          </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}

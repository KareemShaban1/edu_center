import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLocale } from '@/contexts/LocaleContext';
import { COMPONENT_CATALOG } from '@/lib/landing/constants';
import { BUILDER_COMPONENT_TYPES } from '@/lib/landing/component-defaults';
import type { ComponentType, LandingComponent, LandingSection, LocalizedText } from '@/types/landing';
import { cn } from '@/lib/utils';
import { ImageUrlField } from './ImageUrlField';

interface ComponentBuilderPanelProps {
  section: LandingSection;
  previewLocale: 'en' | 'ar';
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  onAddComponent: (type: ComponentType) => void;
  onRemoveComponent: (componentId: string) => void;
  onMoveComponent: (from: number, to: number) => void;
  onUpdateComponentContent: (componentId: string, content: Record<string, unknown>) => void;
  onUpdateSectionContent: (content: Record<string, unknown>) => void;
  onPickFromMedia?: (apply: (url: string) => void) => void;
}

function LocalizedInput({
  label, value, locale, onChange, multiline,
}: {
  label: string;
  value: LocalizedText;
  locale: 'en' | 'ar';
  onChange: (v: LocalizedText) => void;
  multiline?: boolean;
}) {
  const field = (
    multiline ? (
      <Textarea
        value={value[locale]}
        onChange={e => onChange({ ...value, [locale]: e.target.value })}
        rows={3}
      />
    ) : (
      <Input
        value={value[locale]}
        onChange={e => onChange({ ...value, [locale]: e.target.value })}
      />
    )
  );
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label} ({locale.toUpperCase()})</Label>
      {field}
    </div>
  );
}

function ComponentPropertyEditor({
  component,
  previewLocale,
  onUpdateContent,
  onPickFromMedia,
}: {
  component: LandingComponent;
  previewLocale: 'en' | 'ar';
  onUpdateContent: (content: Record<string, unknown>) => void;
  onPickFromMedia?: (apply: (url: string) => void) => void;
}) {
  const { t } = useLocale();
  const c = component.content;

  const set = (patch: Record<string, unknown>) => onUpdateContent(patch);

  const localizedField = (key: string, labelKey: string, multiline?: boolean) => {
    const val = (c[key] as LocalizedText) ?? { en: '', ar: '' };
    return (
      <LocalizedInput
        label={t(labelKey)}
        value={val}
        locale={previewLocale}
        onChange={v => set({ [key]: v })}
        multiline={multiline}
      />
    );
  };

  switch (component.type) {
    case 'heading':
      return (
        <>
          {localizedField('text', 'landing.text.headline')}
          <div className="space-y-1">
            <Label className="text-xs">{t('landing.componentLevel')}</Label>
            <Select value={String(c.level ?? 'h2')} onValueChange={v => set({ level: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="h1">H1</SelectItem>
                <SelectItem value="h2">H2</SelectItem>
                <SelectItem value="h3">H3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );
    case 'paragraph':
      return localizedField('text', 'landing.text.body', true);
    case 'button':
      return (
        <>
          {localizedField('label', 'landing.text.ctaPrimary')}
          <div className="space-y-1">
            <Label className="text-xs">URL</Label>
            <Input value={String(c.url ?? '')} onChange={e => set({ url: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('landing.componentVariant')}</Label>
            <Select value={String(c.variant ?? 'primary')} onValueChange={v => set({ variant: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">{t('landing.variantPrimary')}</SelectItem>
                <SelectItem value="outline">{t('landing.variantOutline')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );
    case 'image':
      return (
        <>
          <ImageUrlField
            label={t('landing.imageUrl')}
            value={String(c.url ?? '')}
            onChange={url => set({ url })}
            onPickFromMedia={onPickFromMedia}
          />
          {localizedField('alt', 'landing.imageAlt')}
          <div className="space-y-1">
            <Label className="text-xs">{t('landing.imageWidth')}</Label>
            <Select value={String(c.width ?? 'full')} onValueChange={v => set({ width: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full">{t('landing.widthFull')}</SelectItem>
                <SelectItem value="medium">{t('landing.widthMedium')}</SelectItem>
                <SelectItem value="small">{t('landing.widthSmall')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      );
    case 'video':
      return (
        <div className="space-y-1">
          <Label className="text-xs">{t('landing.videoUrl')}</Label>
          <Input value={String(c.url ?? '')} onChange={e => set({ url: e.target.value })} placeholder="https://youtube.com/embed/..." />
        </div>
      );
    case 'badge':
    case 'tag':
      return localizedField('text', 'landing.text.badge');
    case 'icon':
      return (
        <>
          <div className="space-y-1">
            <Label className="text-xs">{t('landing.iconName')}</Label>
            <Input value={String(c.icon ?? 'BookOpen')} onChange={e => set({ icon: e.target.value })} placeholder="BookOpen" />
          </div>
          {localizedField('label', 'landing.text.title')}
        </>
      );
    case 'card':
      return (
        <>
          <ImageUrlField
            label={t('landing.imageUrl')}
            value={String(c.imageUrl ?? '')}
            onChange={url => set({ imageUrl: url })}
            onPickFromMedia={onPickFromMedia}
          />
          {localizedField('title', 'landing.text.title')}
          {localizedField('body', 'landing.text.body', true)}
        </>
      );
    case 'counter':
      return (
        <>
          <div className="space-y-1">
            <Label className="text-xs">{t('landing.counterValue')}</Label>
            <Input value={String(c.value ?? '')} onChange={e => set({ value: e.target.value })} />
          </div>
          {localizedField('label', 'landing.text.title')}
        </>
      );
    case 'testimonial':
      return (
        <>
          <div className="space-y-1">
            <Label className="text-xs">{t('landing.name')}</Label>
            <Input value={String(c.name ?? '')} onChange={e => set({ name: e.target.value })} />
          </div>
          {localizedField('role', 'landing.text.role')}
          {localizedField('text', 'landing.text.quote', true)}
          <div className="space-y-1">
            <Label className="text-xs">{t('landing.rating')}</Label>
            <Input type="number" min={1} max={5} value={Number(c.rating ?? 5)} onChange={e => set({ rating: Number(e.target.value) })} />
          </div>
        </>
      );
    case 'form':
      return (
        <>
          {localizedField('title', 'landing.text.title')}
          {localizedField('submitLabel', 'landing.text.ctaPrimary')}
        </>
      );
    case 'progress':
      return (
        <>
          <div className="space-y-1">
            <Label className="text-xs">{t('landing.progressValue')}</Label>
            <Input type="number" min={0} max={100} value={Number(c.value ?? 0)} onChange={e => set({ value: Number(e.target.value) })} />
          </div>
          {localizedField('label', 'landing.text.title')}
        </>
      );
    case 'social_links':
      return (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Facebook</Label>
            <Input value={String(c.facebook ?? '')} onChange={e => set({ facebook: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Instagram</Label>
            <Input value={String(c.instagram ?? '')} onChange={e => set({ instagram: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">WhatsApp</Label>
            <Input value={String(c.whatsapp ?? '')} onChange={e => set({ whatsapp: e.target.value })} placeholder="+201234567890" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Twitter / X</Label>
            <Input value={String(c.twitter ?? '')} onChange={e => set({ twitter: e.target.value })} />
          </div>
        </>
      );
    default:
      return (
        <p className="text-xs text-muted-foreground">{t('landing.componentAdvancedEdit')}</p>
      );
  }
}

export function ComponentBuilderPanel({
  section,
  previewLocale,
  selectedComponentId,
  onSelectComponent,
  onAddComponent,
  onRemoveComponent,
  onMoveComponent,
  onUpdateComponentContent,
  onUpdateSectionContent,
  onPickFromMedia,
}: ComponentBuilderPanelProps) {
  const { t } = useLocale();
  const components = [...(section.components ?? [])].sort((a, b) => a.order - b.order);
  const selected = components.find(c => c.id === selectedComponentId) ?? null;
  const catalog = COMPONENT_CATALOG.filter(c => BUILDER_COMPONENT_TYPES.includes(c.type));

  return (
    <div className="space-y-4">
      <div>
        <LocalizedInput
          label={t('landing.sectionTitle')}
          value={(section.content.title as LocalizedText) ?? { en: '', ar: '' }}
          locale={previewLocale}
          onChange={v => onUpdateSectionContent({ title: v })}
        />
      </div>

      <Separator />

      <div>
        <Label className="text-xs font-semibold">{t('landing.addComponent')}</Label>
        <ScrollArea className="h-24 mt-2 border rounded-md">
          <div className="p-2 flex flex-wrap gap-1">
            {catalog.map(item => (
              <Button
                key={item.type}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onAddComponent(item.type)}
              >
                <Plus className="w-3 h-3 me-1" />
                {t(item.labelKey)}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div>
        <Label className="text-xs font-semibold">{t('landing.components')}</Label>
        <div className="mt-2 space-y-1">
          {components.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t('landing.noComponents')}</p>
          ) : components.map((component, index) => {
            const meta = catalog.find(c => c.type === component.type);
            return (
              <div
                key={component.id}
                className={cn(
                  'flex items-center gap-1 p-2 rounded-md border text-xs cursor-pointer',
                  selectedComponentId === component.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50',
                )}
                onClick={() => onSelectComponent(component.id)}
              >
                <GripVertical className="w-3 h-3 shrink-0 opacity-40" />
                <span className="flex-1 truncate">{meta ? t(meta.labelKey) : component.type}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === 0} onClick={e => { e.stopPropagation(); onMoveComponent(index, index - 1); }}>
                  <ChevronUp className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" disabled={index === components.length - 1} onClick={e => { e.stopPropagation(); onMoveComponent(index, index + 1); }}>
                  <ChevronDown className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={e => { e.stopPropagation(); onRemoveComponent(component.id); }}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <>
          <Separator />
          <div className="space-y-3">
            <Label className="text-xs font-semibold">{t('landing.componentSettings')}</Label>
            <ComponentPropertyEditor
              component={selected}
              previewLocale={previewLocale}
              onUpdateContent={content => onUpdateComponentContent(selected.id, content)}
              onPickFromMedia={onPickFromMedia}
            />
          </div>
        </>
      )}
    </div>
  );
}

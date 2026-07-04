import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';
import { HERO_BACKGROUND_PRESETS, applyHeroBackgroundPreset } from '@/lib/landing/hero-backgrounds';
import { getSectionLayouts, resolveSectionLayout } from '@/lib/landing/section-layouts';
import type { LandingPage, LandingSection } from '@/types/landing';
import { ImageUrlField } from './ImageUrlField';

interface HeroSectionEditorProps {
  section: LandingSection;
  page: LandingPage;
  onUpdateContent: (patch: Record<string, unknown>) => void;
  onUpdateStyle: (patch: Partial<NonNullable<LandingSection['style']>>) => void;
  onPickFromMedia?: (apply: (url: string) => void) => void;
}

function HeroLayoutPreview({ layout, active }: { layout: string; active: boolean }) {
  const box = 'rounded-sm bg-primary/70';
  const muted = 'rounded-sm bg-muted-foreground/25';

  const render = () => {
    switch (layout) {
      case 'split-reverse':
        return (
          <div className="grid h-full grid-cols-2 gap-0.5 p-1">
            <div className={cn(box, 'h-full')} />
            <div className="space-y-0.5 p-0.5">
              <div className={cn(muted, 'h-1 w-full')} />
              <div className={cn(muted, 'h-1 w-3/4')} />
            </div>
          </div>
        );
      case 'centered':
        return (
          <div className="flex h-full flex-col items-center justify-center gap-0.5 p-1">
            <div className={cn(muted, 'h-1 w-3/4')} />
            <div className={cn(box, 'h-2 w-1/2')} />
          </div>
        );
      case 'image-top':
        return (
          <div className="flex h-full flex-col gap-0.5 p-1">
            <div className={cn(box, 'h-2/3 w-full')} />
            <div className={cn(muted, 'h-1 w-full')} />
          </div>
        );
      case 'image-bottom':
        return (
          <div className="flex h-full flex-col gap-0.5 p-1">
            <div className={cn(muted, 'h-1 w-full')} />
            <div className={cn(box, 'h-2/3 w-full')} />
          </div>
        );
      case 'background':
        return (
          <div className={cn(box, 'relative m-1 h-[calc(100%-0.5rem)] w-[calc(100%-0.5rem)]')}>
            <div className="absolute inset-1 space-y-0.5">
              <div className="h-1 w-2/3 rounded-sm bg-white/80" />
              <div className="h-1 w-1/2 rounded-sm bg-white/50" />
            </div>
          </div>
        );
      case 'minimal':
        return (
          <div className="flex h-full flex-col items-start justify-center gap-0.5 p-2">
            <div className={cn(muted, 'h-1 w-full')} />
            <div className={cn(muted, 'h-1 w-4/5')} />
            <div className={cn(box, 'mt-0.5 h-1 w-1/3')} />
          </div>
        );
      case 'stats-row':
        return (
          <div className="grid h-full grid-cols-2 gap-0.5 p-1">
            <div className="space-y-0.5">
              <div className={cn(muted, 'h-1 w-full')} />
              <div className="mt-1 grid grid-cols-2 gap-0.5">
                <div className={cn(box, 'h-1')} />
                <div className={cn(box, 'h-1')} />
              </div>
            </div>
            <div className={cn(box, 'h-full')} />
          </div>
        );
      default:
        return (
          <div className="grid h-full grid-cols-2 gap-0.5 p-1">
            <div className="space-y-0.5 p-0.5">
              <div className={cn(muted, 'h-1 w-full')} />
              <div className={cn(muted, 'h-1 w-3/4')} />
            </div>
            <div className={cn(box, 'h-full')} />
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        'h-14 w-full overflow-hidden rounded-md border bg-background',
        active && 'ring-2 ring-primary ring-offset-1',
      )}
    >
      {render()}
    </div>
  );
}

export function HeroSectionEditor({
  section,
  page,
  onUpdateContent,
  onUpdateStyle,
  onPickFromMedia,
}: HeroSectionEditorProps) {
  const { t } = useLocale();
  const c = section.content;
  const layoutOptions = getSectionLayouts('hero');
  const currentLayout = resolveSectionLayout(section);
  const style = section.style ?? {};

  const applyPreset = (presetId: string) => {
    if (presetId === 'default') {
      onUpdateStyle({
        backgroundColor: page.theme.backgroundColor,
        backgroundGradient: '',
        backgroundImage: '',
        textColor: page.theme.textColor,
      });
      return;
    }
    const patch = applyHeroBackgroundPreset(presetId, page.theme);
    onUpdateStyle(patch);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs font-semibold">{t('landing.heroLayout')}</Label>
        <div className="grid grid-cols-2 gap-2">
          {layoutOptions.map(option => (
            <button
              key={option.value}
              type="button"
              className="rounded-lg border p-2 text-start transition-colors hover:border-primary hover:bg-primary/5"
              onClick={() => onUpdateContent({ layout: option.value })}
            >
              <HeroLayoutPreview layout={option.value} active={currentLayout === option.value} />
              <span className="mt-1.5 block text-[10px] font-medium leading-tight">
                {t(option.labelKey)}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-semibold">{t('landing.heroBackground')}</Label>
        <div className="grid grid-cols-3 gap-1.5">
          {HERO_BACKGROUND_PRESETS.map(preset => (
            <Button
              key={preset.id}
              type="button"
              variant="outline"
              size="sm"
              className="h-auto min-h-8 px-1 py-1 text-[10px] leading-tight"
              onClick={() => applyPreset(preset.id)}
            >
              {t(preset.labelKey)}
            </Button>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-auto min-h-8 px-1 py-1 text-[10px] leading-tight"
            onClick={() => applyPreset('theme')}
          >
            {t('landing.heroBg.theme')}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">{t('landing.bgColor')}</Label>
            <Input
              type="color"
              value={style.backgroundColor ?? page.theme.backgroundColor}
              onChange={e => onUpdateStyle({ backgroundColor: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('landing.sectionTextColor')}</Label>
            <Input
              type="color"
              value={style.textColor ?? page.theme.textColor}
              onChange={e => onUpdateStyle({ textColor: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">{t('landing.heroBgGradient')}</Label>
          <Input
            value={style.backgroundGradient ?? ''}
            onChange={e => onUpdateStyle({ backgroundGradient: e.target.value || undefined })}
            placeholder="linear-gradient(135deg, #0f2847, #c9a227)"
            className="text-xs"
          />
        </div>

        <ImageUrlField
          label={t('landing.backgroundImage')}
          value={style.backgroundImage ?? ''}
          onChange={url => onUpdateStyle({ backgroundImage: url || undefined })}
          onPickFromMedia={onPickFromMedia}
        />

        <div className="space-y-1">
          <Label className="text-xs">{t('landing.heroOverlay')}</Label>
          <Input
            type="range"
            min={0}
            max={90}
            step={5}
            value={Number(c.overlayOpacity ?? 0)}
            onChange={e => onUpdateContent({ overlayOpacity: Number(e.target.value) })}
          />
          <p className="text-[10px] text-muted-foreground">{Number(c.overlayOpacity ?? 0)}%</p>
        </div>
      </div>

      <Separator />

      <ImageUrlField
        label={t('landing.sectionImage')}
        value={(c.imageUrl as string) ?? ''}
        onChange={url => onUpdateContent({ imageUrl: url })}
        onPickFromMedia={onPickFromMedia}
      />

      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`hero-show-stats-${section.id}`} className="text-xs">{t('landing.heroShowStats')}</Label>
        <input
          id={`hero-show-stats-${section.id}`}
          type="checkbox"
          checked={c.showStats !== false}
          onChange={e => onUpdateContent({ showStats: e.target.checked })}
          className="h-4 w-4"
          aria-label={t('landing.heroShowStats')}
        />
      </div>
    </div>
  );
}

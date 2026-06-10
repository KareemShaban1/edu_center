import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import type { TextStyle } from '@/types/landing';
import { FONT_FAMILIES, FONT_WEIGHTS, TEXT_ALIGNS, TEXT_TRANSFORMS } from '@/lib/landing/typography';
import { cn } from '@/lib/utils';
import { RotateCcw } from 'lucide-react';

const INHERIT = '__inherit__';

interface TypographyControlsProps {
  fieldKey: string;
  fieldLabel: string;
  value?: TextStyle;
  onChange: (style: TextStyle | undefined) => void;
  isActive?: boolean;
  onSelect?: () => void;
}

export function TypographyControls({
  fieldKey,
  fieldLabel,
  value = {},
  onChange,
  isActive,
  onSelect,
}: TypographyControlsProps) {
  const { t } = useLocale();

  const update = (patch: Partial<TextStyle>) => {
    onChange({ ...value, ...patch });
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-3 space-y-3 transition-colors',
        isActive && 'border-primary bg-primary/5',
      )}
    >
      <button
        type="button"
        className="w-full text-start flex items-center justify-between"
        onClick={onSelect}
      >
        <span className="text-sm font-medium">{fieldLabel}</span>
        <span className="text-xs text-muted-foreground font-mono">{fieldKey}</span>
      </button>

      <div className="space-y-1">
        <Label className="text-xs">{t('landing.typo.fontFamily')}</Label>
        <Select
          value={value.fontFamily ?? INHERIT}
          onValueChange={v => update({ fontFamily: v === INHERIT ? undefined : v })}
        >
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t('landing.typo.inherit')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value={INHERIT}>{t('landing.typo.inherit')}</SelectItem>
            {FONT_FAMILIES.map(f => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{t('landing.typo.fontSize')}</Label>
          <Input
            type="number"
            min={10}
            max={96}
            className="h-8 text-xs"
            value={value.fontSize ?? ''}
            placeholder="—"
            onChange={e => update({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('landing.typo.fontWeight')}</Label>
          <Select
            value={value.fontWeight !== undefined ? String(value.fontWeight) : INHERIT}
            onValueChange={v => update({ fontWeight: v === INHERIT ? undefined : Number(v) })}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={INHERIT}>{t('landing.typo.inherit')}</SelectItem>
              {FONT_WEIGHTS.map(w => (
                <SelectItem key={w.value} value={String(w.value)}>{w.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">{t('landing.typo.color')}</Label>
        <div className="flex gap-2">
          <Input type="color" className="w-10 h-8 p-1" value={value.color ?? '#1e293b'} onChange={e => update({ color: e.target.value })} />
          <Input className="h-8 text-xs flex-1" value={value.color ?? ''} placeholder="#1e293b" onChange={e => update({ color: e.target.value || undefined })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{t('landing.typo.lineHeight')}</Label>
          <Input
            type="number"
            step={0.1}
            min={0.8}
            max={3}
            className="h-8 text-xs"
            value={value.lineHeight ?? ''}
            placeholder="—"
            onChange={e => update({ lineHeight: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('landing.typo.letterSpacing')}</Label>
          <Input
            type="number"
            step={0.5}
            min={-2}
            max={10}
            className="h-8 text-xs"
            value={value.letterSpacing ?? ''}
            placeholder="—"
            onChange={e => update({ letterSpacing: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{t('landing.typo.textAlign')}</Label>
          <Select
            value={value.textAlign ?? INHERIT}
            onValueChange={v => update({ textAlign: v === INHERIT ? undefined : v as TextStyle['textAlign'] })}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={INHERIT}>{t('landing.typo.inherit')}</SelectItem>
              {TEXT_ALIGNS.map(a => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('landing.typo.textTransform')}</Label>
          <Select
            value={value.textTransform ?? INHERIT}
            onValueChange={v => update({ textTransform: v === INHERIT ? undefined : v as TextStyle['textTransform'] })}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={INHERIT}>{t('landing.typo.inherit')}</SelectItem>
              {TEXT_TRANSFORMS.map(txf => (
                <SelectItem key={txf.value} value={txf.value}>{txf.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">{t('landing.typo.fontStyle')}</Label>
          <Select
            value={value.fontStyle ?? INHERIT}
            onValueChange={v => update({ fontStyle: v === INHERIT ? undefined : v as TextStyle['fontStyle'] })}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t('landing.typo.inherit')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value={INHERIT}>{t('landing.typo.inherit')}</SelectItem>
              <SelectItem value="normal">{t('landing.typo.normal')}</SelectItem>
              <SelectItem value="italic">{t('landing.typo.italic')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">{t('landing.typo.decoration')}</Label>
          <Select
            value={value.textDecoration ?? INHERIT}
            onValueChange={v => update({ textDecoration: v === INHERIT ? undefined : v as TextStyle['textDecoration'] })}
          >
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t('landing.typo.inherit')} /></SelectTrigger>
            <SelectContent>
              <SelectItem value={INHERIT}>{t('landing.typo.inherit')}</SelectItem>
              <SelectItem value="none">{t('landing.typo.none')}</SelectItem>
              <SelectItem value="underline">{t('landing.typo.underline')}</SelectItem>
              <SelectItem value="line-through">{t('landing.typo.lineThrough')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full h-7 text-xs"
        onClick={() => onChange(undefined)}
      >
        <RotateCcw className="w-3 h-3 me-1" />
        {t('landing.typo.reset')}
      </Button>
    </div>
  );
}

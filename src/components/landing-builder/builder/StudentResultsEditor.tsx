import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/contexts/LocaleContext';
import { lt } from '@/lib/landing/defaults';
import type { LandingSection, LocalizedText } from '@/types/landing';

type StudentResult = {
  year: string | LocalizedText;
  passRate: string | LocalizedText;
  topScore: string | LocalizedText;
};

interface StudentResultsEditorProps {
  section: LandingSection;
  previewLocale: 'en' | 'ar';
  onUpdateContent: (patch: Record<string, unknown>) => void;
}

function toLocalized(value: string | LocalizedText | undefined): LocalizedText {
  if (value == null) return { en: '', ar: '' };
  if (typeof value === 'string') return { en: value, ar: value };
  return { en: value.en ?? '', ar: value.ar ?? '' };
}

function LocalizedInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: LocalizedText;
  onChange: (v: LocalizedText) => void;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="grid grid-cols-1 gap-1.5">
        <div className="space-y-0.5">
          <Label className="text-[10px] text-muted-foreground">EN</Label>
          <Input
            value={value.en}
            onChange={e => onChange({ ...value, en: e.target.value })}
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-0.5">
          <Label className="text-[10px] text-muted-foreground">AR</Label>
          <Input
            value={value.ar}
            onChange={e => onChange({ ...value, ar: e.target.value })}
            className="h-8 text-xs"
            dir="rtl"
          />
        </div>
      </div>
    </div>
  );
}

export function StudentResultsEditor({
  section,
  onUpdateContent,
}: StudentResultsEditorProps) {
  const { t } = useLocale();
  const c = section.content;
  const results = (c.results as StudentResult[]) ?? [];

  const leftColumnLabel = toLocalized(
    (c.leftColumnLabel as LocalizedText | undefined) ?? lt('Pass Rate', 'نسبة النجاح'),
  );
  const rightColumnLabel = toLocalized(
    (c.rightColumnLabel as LocalizedText | undefined) ?? lt('Top Score', 'أعلى درجة'),
  );

  const setResults = (next: StudentResult[]) => onUpdateContent({ results: next });

  const updateResult = (index: number, patch: Partial<StudentResult>) => {
    setResults(results.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const addResult = () => {
    setResults([
      ...results,
      {
        year: lt('New metric', 'مقياس جديد'),
        passRate: '0%',
        topScore: lt('Value', 'قيمة'),
      },
    ]);
  };

  const removeResult = (index: number) => {
    setResults(results.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <LocalizedInput
        label={t('landing.results.leftColumnLabel')}
        value={leftColumnLabel}
        onChange={v => onUpdateContent({ leftColumnLabel: v })}
      />
      <LocalizedInput
        label={t('landing.results.rightColumnLabel')}
        value={rightColumnLabel}
        onChange={v => onUpdateContent({ rightColumnLabel: v })}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs font-semibold">{t('landing.results.heading')}</Label>
          <Button type="button" variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={addResult}>
            <Plus className="h-3 w-3" />
            {t('landing.results.add')}
          </Button>
        </div>

        {results.length === 0 && (
          <p className="text-xs text-muted-foreground">{t('landing.results.empty')}</p>
        )}

        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={index} className="space-y-2 rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {t('landing.results.card')} {index + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => removeResult(index)}
                  title={t('landing.results.remove')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <LocalizedInput
                label={t('landing.results.cardTitle')}
                value={toLocalized(result.year)}
                onChange={v => updateResult(index, { year: v })}
              />
              <LocalizedInput
                label={t('landing.results.leftValue')}
                value={toLocalized(result.passRate)}
                onChange={v => updateResult(index, { passRate: v })}
              />
              <LocalizedInput
                label={t('landing.results.rightValue')}
                value={toLocalized(result.topScore)}
                onChange={v => updateResult(index, { topScore: v })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

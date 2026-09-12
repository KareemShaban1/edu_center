import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import IconPicker from '@/components/IconPicker';
import { useLocale } from '@/contexts/LocaleContext';
import { resolveLucideIcon } from '@/lib/lucide-icons';

interface IconNameFieldProps {
  label: string;
  value: string;
  onChange: (icon: string) => void;
}

export default function IconNameField({ label, value, onChange }: IconNameFieldProps) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const [open, setOpen] = useState(false);
  const Icon = resolveLucideIcon(value || 'BookOpen');

  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
          <Icon className="h-4 w-4" />
        </div>
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder="BookOpen" />
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          {isAr ? 'اختيار' : 'Pick'}
        </Button>
      </div>
      <IconPicker
        open={open}
        onOpenChange={setOpen}
        value={value || 'BookOpen'}
        onSelect={onChange}
        isAr={isAr}
      />
    </div>
  );
}

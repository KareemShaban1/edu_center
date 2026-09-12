import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, RefreshCcw, Search, Shapes } from 'lucide-react';
import IconPicker from '@/components/IconPicker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UI_ICONS, type UiIconCategory, type UiIconDefinition } from '@/config/ui-icons';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import { resolveLucideIcon } from '@/lib/lucide-icons';
import { uiIconsApi } from '@/services/endpoints/ui-icons';
import { cn } from '@/lib/utils';

function IconCard({
  definition,
  currentIcon,
  isOverride,
  onPick,
  onReset,
  saving,
}: {
  definition: UiIconDefinition;
  currentIcon: string;
  isOverride: boolean;
  onPick: () => void;
  onReset: () => void;
  saving: boolean;
}) {
  const { locale, t } = useLocale();
  const Icon = resolveLucideIcon(currentIcon);

  return (
    <article className="flex flex-col rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <Badge variant={isOverride ? 'default' : 'secondary'}>
          {isOverride ? t('platform.icons.badgeCustom') : t('platform.icons.badgeDefault')}
        </Badge>
      </div>

      <h2 className="font-semibold leading-snug">
        {locale === 'ar' ? definition.labelAr : definition.labelEn}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">{definition.pages.join(' · ')}</p>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground">{currentIcon}</p>

      <div className="mt-auto flex gap-2 pt-4">
        <Button type="button" className="flex-1" onClick={onPick} disabled={saving}>
          {t('platform.icons.change')}
        </Button>
        {isOverride ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onReset}
            disabled={saving}
            title={t('platform.icons.restoreDefault')}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export default function DeveloperIconsPage() {
  const { locale, t } = useLocale();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<'all' | UiIconCategory>('all');
  const [pickerKey, setPickerKey] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const { data: overrides = {}, isLoading } = useQuery({
    queryKey: ['ui-icons'],
    queryFn: uiIconsApi.list,
  });

  const updateMutation = useMutation({
    mutationFn: ({ key, icon }: { key: string; icon: string }) => uiIconsApi.updateOne(key, icon),
    onMutate: ({ key }) => setBusyKey(key),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ui-icons'] });
      toast({ title: t('platform.icons.updated') });
    },
    onError: error => toast({
      title: t('platform.icons.updateFailed'),
      description: error instanceof Error ? error.message : undefined,
      variant: 'destructive',
    }),
    onSettled: () => setBusyKey(null),
  });

  const resetMutation = useMutation({
    mutationFn: (key: string) => uiIconsApi.reset(key),
    onMutate: key => setBusyKey(key),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ui-icons'] });
      toast({ title: t('platform.icons.restored') });
    },
    onError: error => toast({
      title: t('platform.icons.restoreFailed'),
      description: error instanceof Error ? error.message : undefined,
      variant: 'destructive',
    }),
    onSettled: () => setBusyKey(null),
  });

  const categories = useMemo(
    () => [...new Set(UI_ICONS.map(icon => icon.category))],
    [],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return UI_ICONS.filter(icon => {
      if (category !== 'all' && icon.category !== category) return false;
      if (!q) return true;
      return `${icon.labelEn} ${icon.labelAr} ${icon.key} ${icon.defaultIcon} ${icon.pages.join(' ')} ${icon.category}`
        .toLowerCase()
        .includes(q);
    });
  }, [category, search]);

  const activeDefinition = pickerKey ? UI_ICONS.find(icon => icon.key === pickerKey) : null;
  const activeValue = activeDefinition
    ? (overrides[activeDefinition.key] || activeDefinition.defaultIcon)
    : 'HelpCircle';

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">{t('platform.icons.title')}</h1>
        <p className="page-description">{t('platform.icons.desc')}</p>
      </div>

      <div className="mb-5 rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="grid gap-3 md:grid-cols-[1fr_16rem_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('platform.icons.search')}
              className="ps-9"
            />
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value as 'all' | UiIconCategory)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="all">{t('platform.icons.allCategories')}</option>
            {categories.map(item => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shapes className="h-4 w-4" />
            {filtered.length} / {UI_ICONS.length}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center text-muted-foreground">
          <Loader2 className="me-2 h-5 w-5 animate-spin" />
          {t('landing.loading')}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map(definition => {
            const currentIcon = overrides[definition.key] || definition.defaultIcon;
            const isOverride = Boolean(overrides[definition.key]);
            return (
              <IconCard
                key={definition.key}
                definition={definition}
                currentIcon={currentIcon}
                isOverride={isOverride}
                onPick={() => setPickerKey(definition.key)}
                onReset={() => resetMutation.mutate(definition.key)}
                saving={busyKey === definition.key}
              />
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !isLoading ? (
        <p className={cn('rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center text-sm text-muted-foreground')}>
          {t('platform.icons.empty')}
        </p>
      ) : null}

      <IconPicker
        open={Boolean(pickerKey)}
        onOpenChange={open => {
          if (!open) setPickerKey(null);
        }}
        value={activeValue}
        isAr={locale === 'ar'}
        title={activeDefinition
          ? (locale === 'ar' ? activeDefinition.labelAr : activeDefinition.labelEn)
          : undefined}
        onSelect={icon => {
          if (!pickerKey) return;
          updateMutation.mutate({ key: pickerKey, icon });
        }}
      />
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DataTable from '@/components/DataTable';
import DeleteDialog from '@/components/DeleteDialog';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect, FormTextarea } from '@/components/FormFields';
import Pagination from '@/components/Pagination';
import { useLocale } from '@/contexts/LocaleContext';
import { toast } from '@/hooks/use-toast';
import {
  uiTranslationsApi,
  type UiTranslationInput,
  type UiTranslationOverride,
} from '@/services/endpoints/ui-translations';

const PER_PAGE = 25;

interface TranslationRow {
  id: string;
  key: string;
  en: string;
  ar: string;
  source: 'default' | 'custom' | 'override';
  namespace: string;
}

type SourceFilter = 'all' | TranslationRow['source'];

function TranslationForm({
  item,
  existingKeys,
  saving,
  onClose,
  onSave,
}: {
  item: TranslationRow | null;
  existingKeys: Set<string>;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: UiTranslationInput, currentKey?: string) => Promise<void>;
}) {
  const { t } = useLocale();
  const [form, setForm] = useState<UiTranslationInput>({
    key: item?.key || '',
    en: item?.en || '',
    ar: item?.ar || '',
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = {
      key: form.key.trim(),
      en: form.en.trim(),
      ar: form.ar.trim(),
    };

    if (!payload.key || !payload.en || !payload.ar) {
      toast({
        title: t('notifications.validationError'),
        description: t('developer.translations.required'),
        variant: 'destructive',
      });
      return;
    }

    if (!/^[A-Za-z0-9_.-]+$/.test(payload.key)) {
      toast({
        title: t('notifications.validationError'),
        description: t('developer.translations.keyFormat'),
        variant: 'destructive',
      });
      return;
    }

    if (payload.key !== item?.key && existingKeys.has(payload.key)) {
      toast({
        title: t('notifications.validationError'),
        description: t('developer.translations.duplicate'),
        variant: 'destructive',
      });
      return;
    }

    void onSave(payload, item?.key);
  };

  return (
    <FormDialog
      open
      onClose={onClose}
      title={item ? t('developer.translations.edit') : t('developer.translations.add')}
      description={t('developer.translations.formDesc')}
      onSubmit={submit}
      loading={saving}
    >
      <FormField label={t('developer.translations.key')} id="translation-key" required>
        <FormInput
          id="translation-key"
          value={form.key}
          onChange={event => setForm(current => ({ ...current, key: event.target.value }))}
          placeholder="nav.example"
          dir="ltr"
          required
        />
      </FormField>
      <FormField label={t('developer.translations.english')} id="translation-en" required>
        <FormTextarea
          id="translation-en"
          value={form.en}
          onChange={event => setForm(current => ({ ...current, en: event.target.value }))}
          rows={3}
          dir="ltr"
          required
        />
      </FormField>
      <FormField label={t('developer.translations.arabic')} id="translation-ar" required>
        <FormTextarea
          id="translation-ar"
          value={form.ar}
          onChange={event => setForm(current => ({ ...current, ar: event.target.value }))}
          rows={3}
          dir="rtl"
          required
        />
      </FormField>
    </FormDialog>
  );
}

export default function DeveloperTranslationsPage() {
  const { t, refreshTranslations, defaultTranslations } = useLocale();
  const queryClient = useQueryClient();
  const [editItem, setEditItem] = useState<TranslationRow | null | 'new'>(null);
  const [deleteItem, setDeleteItem] = useState<TranslationRow | null>(null);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [namespaceFilter, setNamespaceFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: overrides = [], isLoading } = useQuery({
    queryKey: ['ui-translations'],
    queryFn: uiTranslationsApi.list,
  });

  const rows = useMemo<TranslationRow[]>(() => {
    const overridesByKey = new Map<string, UiTranslationOverride>(
      overrides.map(item => [item.key, item]),
    );
    const keys = new Set([
      ...Object.keys(defaultTranslations.en),
      ...Object.keys(defaultTranslations.ar),
      ...overrides.map(item => item.key),
    ]);

    return [...keys]
      .filter(key => !overridesByKey.get(key)?.is_deleted)
      .map(key => {
        const override = overridesByKey.get(key);
        const hasDefault = key in defaultTranslations.en || key in defaultTranslations.ar;
        return {
          id: key,
          key,
          en: override?.en ?? defaultTranslations.en[key] ?? '',
          ar: override?.ar ?? defaultTranslations.ar[key] ?? '',
          source: override ? (hasDefault ? 'override' : 'custom') : 'default',
          namespace: key.includes('.') ? key.split('.')[0] : key,
        };
      })
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [overrides, defaultTranslations]);

  const namespaces = useMemo(
    () => [...new Set(rows.map(row => row.namespace))].sort((a, b) => a.localeCompare(b)),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(row => {
      if (sourceFilter !== 'all' && row.source !== sourceFilter) return false;
      if (namespaceFilter && row.namespace !== namespaceFilter) return false;
      if (!query) return true;
      return (
        row.key.toLowerCase().includes(query)
        || row.en.toLowerCase().includes(query)
        || row.ar.toLowerCase().includes(query)
      );
    });
  }, [rows, search, sourceFilter, namespaceFilter]);

  const appliedFilters = [search.trim(), sourceFilter !== 'all' ? sourceFilter : '', namespaceFilter].filter(Boolean).length;

  useEffect(() => {
    setPage(1);
  }, [search, sourceFilter, namespaceFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE),
    [filteredRows, currentPage],
  );

  const existingKeys = useMemo(() => new Set(rows.map(row => row.key)), [rows]);

  const saveMutation = useMutation({
    mutationFn: ({ payload, currentKey }: { payload: UiTranslationInput; currentKey?: string }) =>
      currentKey
        ? uiTranslationsApi.update(currentKey, payload)
        : uiTranslationsApi.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ui-translations'] });
      await refreshTranslations();
      toast({ title: t('developer.translations.saved') });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => uiTranslationsApi.delete(key),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['ui-translations'] });
      await refreshTranslations();
      toast({ title: t('developer.translations.deleted') });
    },
  });

  const clearFilters = () => {
    setSearch('');
    setSourceFilter('all');
    setNamespaceFilter('');
  };

  const columns = [
    {
      key: 'key',
      label: t('developer.translations.key'),
      primary: true,
      render: (row: TranslationRow) => <code className="break-all text-xs">{row.key}</code>,
    },
    {
      key: 'en',
      label: t('developer.translations.english'),
      render: (row: TranslationRow) => (
        <span dir="ltr" className="line-clamp-2 block text-start">{row.en}</span>
      ),
    },
    {
      key: 'ar',
      label: t('developer.translations.arabic'),
      render: (row: TranslationRow) => (
        <span dir="rtl" className="line-clamp-2 block text-start">{row.ar}</span>
      ),
    },
    {
      key: 'source',
      label: t('developer.translations.source'),
      render: (row: TranslationRow) => (
        <Badge variant={row.source === 'default' ? 'secondary' : 'default'}>
          {t(`developer.translations.source.${row.source}`)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: t('crud.actions'),
      render: (row: TranslationRow) => (
        <div className="flex items-center gap-1">
          <Button type="button" size="icon" variant="ghost" onClick={() => setEditItem(row)}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">{t('crud.edit')}</span>
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setDeleteItem(row)}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">{t('crud.delete')}</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="page-header flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{t('developer.tab.translations')}</h1>
          <p className="page-description">{t('developer.translations.pageDesc')}</p>
        </div>
        <Button type="button" className="gap-2" onClick={() => setEditItem('new')}>
          <Plus className="h-4 w-4" />
          {t('developer.translations.add')}
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label={t('crud.search')} id="translation-search">
            <FormInput
              id="translation-search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={t('developer.translations.searchPlaceholder')}
            />
          </FormField>
          <FormField label={t('developer.translations.source')} id="translation-source">
            <FormSelect
              id="translation-source"
              value={sourceFilter}
              onChange={event => setSourceFilter(event.target.value as SourceFilter)}
            >
              <option value="all">{t('filter.all')}</option>
              <option value="default">{t('developer.translations.source.default')}</option>
              <option value="override">{t('developer.translations.source.override')}</option>
              <option value="custom">{t('developer.translations.source.custom')}</option>
            </FormSelect>
          </FormField>
          <FormField label={t('developer.translations.namespace')} id="translation-namespace">
            <FormSelect
              id="translation-namespace"
              value={namespaceFilter}
              onChange={event => setNamespaceFilter(event.target.value)}
            >
              <option value="">{t('filter.all')}</option>
              {namespaces.map(namespace => (
                <option key={namespace} value={namespace}>
                  {namespace}
                </option>
              ))}
            </FormSelect>
          </FormField>
          <div className="flex flex-col justify-end gap-2">
            {appliedFilters > 0 ? (
              <Button type="button" variant="outline" onClick={clearFilters}>
                {t('filter.clear')}
              </Button>
            ) : null}
            <p className="text-sm text-muted-foreground">
              {t('developer.translations.resultCount')}: {filteredRows.length.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
          {t('developer.translations.loading')}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          <DataTable columns={columns} data={paginatedRows} responsive />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={filteredRows.length}
            perPage={PER_PAGE}
          />
        </div>
      )}

      {editItem ? (
        <TranslationForm
          item={editItem === 'new' ? null : editItem}
          existingKeys={existingKeys}
          saving={saveMutation.isPending}
          onClose={() => setEditItem(null)}
          onSave={async (payload, currentKey) => {
            try {
              await saveMutation.mutateAsync({ payload, currentKey });
              setEditItem(null);
            } catch (error) {
              toast({
                title: t('notifications.sendFailed'),
                description: error instanceof Error ? error.message : t('notifications.sendFailed'),
                variant: 'destructive',
              });
            }
          }}
        />
      ) : null}

      <DeleteDialog
        open={Boolean(deleteItem)}
        onClose={() => setDeleteItem(null)}
        loading={deleteMutation.isPending}
        title={t('developer.translations.deleteTitle')}
        description={t('developer.translations.deleteDesc')}
        onConfirm={() => {
          if (!deleteItem) return;
          void deleteMutation.mutateAsync(deleteItem.key)
            .then(() => setDeleteItem(null))
            .catch(error => {
              toast({
                title: t('notifications.sendFailed'),
                description: error instanceof Error ? error.message : t('notifications.sendFailed'),
                variant: 'destructive',
              });
            });
        }}
      />
    </div>
  );
}

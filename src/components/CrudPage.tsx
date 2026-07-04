import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import Pagination from '@/components/Pagination';
import DeleteDialog from '@/components/DeleteDialog';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { useAppFontClasses } from '@/hooks/use-app-font';

export interface CrudColumn<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  /** Shown as the card title on small screens. */
  primary?: boolean;
  /** Omit from mobile card details (e.g. id columns). */
  hideOnMobile?: boolean;
}

interface CrudPageProps<T extends { id: number | string }> {
  title: string;
  description: string;
  columns: CrudColumn<T>[];
  data: T[];
  perPage?: number;
  searchKeys?: string[];
  renderForm?: (item: T | null, onClose: () => void) => React.ReactNode;
  onDelete?: (item: T) => void | Promise<void>;
  renderExtraActions?: (item: T) => React.ReactNode;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  actions?: React.ReactNode;
  topContent?: React.ReactNode;
  readOnly?: boolean;
  rowKey?: (item: T) => string | number;
  /** Card layout on small screens; table from md breakpoint up. */
  responsive?: boolean;
}

function renderCell<T>(item: T, col: CrudColumn<T>) {
  return col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '—');
}

function resolvePrimaryColumn<T>(columns: CrudColumn<T>[]) {
  return (
    columns.find(c => c.primary) ??
    columns.find(c => c.key === 'student' || c.key === 'student_name') ??
    columns.find(c => ['name', 'title', 'topic'].includes(c.key)) ??
    columns.find(c => c.sortable && c.key !== 'id') ??
    columns.find(c => c.key !== 'id' && !c.key.startsWith('_')) ??
    columns[0]
  );
}

export default function CrudPage<T extends { id: number | string }>({
  title,
  description,
  columns,
  data,
  perPage = 10,
  searchKeys,
  renderForm,
  onDelete,
  renderExtraActions,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  actions,
  topContent,
  readOnly = false,
  rowKey,
  responsive = true,
}: CrudPageProps<T>) {
  const { t } = useLocale();
  const fonts = useAppFontClasses();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editItem, setEditItem] = useState<T | null | 'new'>(null);
  const [deleteItem, setDeleteItem] = useState<T | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const primaryCol = useMemo(() => resolvePrimaryColumn(columns), [columns]);
  const detailCols = useMemo(
    () => columns.filter(c => c.key !== primaryCol.key && !c.hideOnMobile),
    [columns, primaryCol.key],
  );
  const showActions = !readOnly && (canEdit || canDelete || renderExtraActions);

  const filtered = useMemo(() => {
    let result = [...data];
    if (search && searchKeys?.length) {
      const q = search.toLowerCase();
      result = result.filter(item =>
        searchKeys.some(k => {
          const val = (item as Record<string, unknown>)[k];
          return val != null && String(val).toLowerCase().includes(q);
        }),
      );
    }
    if (sortKey) {
      result.sort((a, b) => {
        const av = String((a as Record<string, unknown>)[sortKey] ?? '');
        const bv = String((b as Record<string, unknown>)[sortKey] ?? '');
        return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return result;
  }, [data, search, searchKeys, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice((page - 1) * perPage, page * perPage);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleDelete = () => {
    if (!deleteItem || !onDelete) {
      setDeleteItem(null);
      return;
    }
    const item = deleteItem;
    setDeleteItem(null);
    void (async () => {
      try {
        await Promise.resolve(onDelete(item));
        toast({ title: t('crud.deleted'), description: t('crud.deletedDesc') });
      } catch {
        toast({ title: t('crud.deleteFailed'), description: t('crud.deleteFailedDesc'), variant: 'destructive' });
      }
    })();
  };

  const renderRowActions = (item: T) => (
    <div className="flex shrink-0 items-center gap-1">
      {canEdit && renderForm && (
        <button
          onClick={() => setEditItem(item)}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={t('crud.edit')}
        >
          <Edit className="h-4 w-4" />
        </button>
      )}
      {canDelete && onDelete && (
        <button
          onClick={() => setDeleteItem(item)}
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={t('crud.delete')}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      )}
      {renderExtraActions?.(item)}
    </div>
  );

  return (
    <DashboardLayout>
      <div className={cn('min-w-0 max-w-full overflow-x-hidden', fonts.body)}>
        <div className="page-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className={cn('text-xl font-bold tracking-tight sm:text-2xl lg:text-3xl', fonts.display)}>{title}</h1>
            <p className="page-description text-sm leading-relaxed sm:text-base">{description}</p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
            {!readOnly && canCreate && renderForm && (
              <Button onClick={() => setEditItem('new')} className="w-full gap-2 sm:w-auto">
                <Plus className="h-4 w-4" /> {t('crud.addNew')}
              </Button>
            )}
          </div>
        </div>

        {topContent}

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
          {searchKeys && searchKeys.length > 0 && (
            <div className="flex flex-col gap-2 border-b border-border p-3 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative w-full flex-1 sm:max-w-sm">
                <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
                <input
                  type="text"
                  placeholder={t('crud.search')}
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-lg border border-input bg-background py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3 sm:text-base"
                />
              </div>
              <span className="shrink-0 text-sm text-muted-foreground">
                {filtered.length} {t('crud.results')}
              </span>
            </div>
          )}

          {responsive ? (
            <div className="divide-y divide-border md:hidden">
              {paged.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t('crud.noData')}</p>
              ) : (
                paged.map(item => (
                  <div key={String(rowKey ? rowKey(item) : item.id)} className="space-y-2.5 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{renderCell(item, primaryCol)}</p>
                      {showActions ? renderRowActions(item) : null}
                    </div>
                    {detailCols.length > 0 ? (
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs sm:grid-cols-2">
                        {detailCols.map(col => (
                          <div key={col.key} className="min-w-0">
                            {col.label ? (
                              <p className="text-muted-foreground">{col.label}</p>
                            ) : null}
                            <div className={cn('break-words font-medium text-foreground', col.label && 'mt-0.5')}>
                              {renderCell(item, col)}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          ) : null}

          <div className={cn('overflow-x-auto', responsive ? 'hidden md:block' : '')}>
            <table className="w-full min-w-[640px] app-table-text">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {columns.map(col => (
                    <th
                      key={col.key}
                      className={cn(
                        'whitespace-nowrap px-4 py-3 font-medium text-muted-foreground ltr:text-left rtl:text-right',
                        col.sortable && 'cursor-pointer select-none hover:text-foreground',
                      )}
                      onClick={() => col.sortable && handleSort(col.key)}
                    >
                      <span className="flex items-center gap-1">
                        {col.label}
                        {col.sortable && sortKey === col.key && (
                          <span className="text-sm">{sortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </span>
                    </th>
                  ))}
                  {showActions && (
                    <th className="w-32 whitespace-nowrap px-4 py-3 font-medium text-muted-foreground ltr:text-left rtl:text-right">
                      {t('crud.actions')}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + (showActions ? 1 : 0)} className="px-4 py-12 text-center text-muted-foreground">
                      {t('crud.noData')}
                    </td>
                  </tr>
                ) : (
                  paged.map(item => (
                    <tr
                      key={String(rowKey ? rowKey(item) : item.id)}
                      className="border-b border-border/50 transition-colors hover:bg-muted/30"
                    >
                      {columns.map(col => (
                        <td key={col.key} className="px-4 py-3">
                          {renderCell(item, col)}
                        </td>
                      ))}
                      {showActions && (
                        <td className="px-4 py-3 ltr:text-right rtl:text-left">{renderRowActions(item)}</td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            perPage={perPage}
            onPageChange={setPage}
          />
        </div>
      </div>

      {editItem !== null && renderForm && renderForm(editItem === 'new' ? null : editItem, () => setEditItem(null))}

      <DeleteDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title={`${t('crud.delete')} ${title.replace(/s$/, '')}`}
      />
    </DashboardLayout>
  );
}

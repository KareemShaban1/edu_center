import React, { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/components/DashboardLayout';
import Pagination from '@/components/Pagination';
import DeleteDialog from '@/components/DeleteDialog';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';

export interface CrudColumn<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
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
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  actions?: React.ReactNode;
  readOnly?: boolean;
  rowKey?: (item: T) => string | number;
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
  canCreate = true,
  canEdit = true,
  canDelete = true,
  actions,
  readOnly = false,
  rowKey,
}: CrudPageProps<T>) {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editItem, setEditItem] = useState<T | null | 'new'>(null);
  const [deleteItem, setDeleteItem] = useState<T | null>(null);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let result = [...data];
    if (search && searchKeys?.length) {
      const q = search.toLowerCase();
      result = result.filter(item =>
        searchKeys.some(k => {
          const val = (item as Record<string, unknown>)[k];
          return val != null && String(val).toLowerCase().includes(q);
        })
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
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
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

  return (
    <DashboardLayout>
      <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {!readOnly && canCreate && renderForm && (
            <Button onClick={() => setEditItem('new')} className="gap-2">
              <Plus className="h-4 w-4" /> {t('crud.addNew')}
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        {/* Search bar */}
        {searchKeys && searchKeys.length > 0 && (
          <div className="border-b border-border p-3 flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ltr:left-3 rtl:right-3" />
              <input
                type="text"
                placeholder={t('crud.search')}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full rounded-lg border border-input bg-background py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ltr:pl-9 ltr:pr-3 rtl:pr-9 rtl:pl-3"
              />
            </div>
            <span className="text-sm text-muted-foreground">{filtered.length} {t('crud.results')}</span>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 font-medium text-muted-foreground ltr:text-left rtl:text-right',
                      col.sortable && 'cursor-pointer select-none hover:text-foreground'
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        <span className="text-xs">{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </span>
                  </th>
                ))}
                {!readOnly && (canEdit || canDelete) && (
                  <th className="px-4 py-3 font-medium text-muted-foreground w-24 ltr:text-right rtl:text-left">{t('crud.actions')}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (!readOnly ? 1 : 0)} className="px-4 py-12 text-center text-muted-foreground">
                    {t('crud.noData')}
                  </td>
                </tr>
              ) : (
                paged.map(item => (
                  <tr key={String(rowKey ? rowKey(item) : item.id)} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                    {columns.map(col => (
                      <td key={col.key} className="px-4 py-3">
                        {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '—')}
                      </td>
                    ))}
                    {!readOnly && (canEdit || canDelete) && (
                      <td className="px-4 py-3 ltr:text-right rtl:text-left">
                        <div className="flex items-center gap-1 ltr:justify-end rtl:justify-start">
                          {canEdit && renderForm && (
                            <button
                              onClick={() => setEditItem(item)}
                              className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              aria-label={t('crud.edit')}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && onDelete && (
                            <button
                              onClick={() => setDeleteItem(item)}
                              className="rounded-lg p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                              aria-label={t('crud.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={filtered.length}
          perPage={perPage}
          onPageChange={setPage}
        />
      </div>

      {/* Form Dialog */}
      {editItem !== null && renderForm && (
        renderForm(editItem === 'new' ? null : editItem, () => setEditItem(null))
      )}

      {/* Delete Dialog */}
      <DeleteDialog
        open={!!deleteItem}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title={`${t('crud.delete')} ${title.replace(/s$/, '')}`}
      />
    </DashboardLayout>
  );
}

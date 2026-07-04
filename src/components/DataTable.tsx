import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  /** When true, shown as the card title on small screens (defaults to first column). */
  primary?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  className?: string;
  /** Card layout on small screens; table from md breakpoint up. */
  responsive?: boolean;
}

function cellValue<T extends Record<string, unknown>>(item: T, col: Column<T>) {
  if (col.render) return col.render(item);
  const val = item[col.key];
  return val != null && val !== '' ? String(val) : '—';
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable,
  className,
  responsive = true,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const { t } = useLocale();
  const filtered = searchable
    ? data.filter(item =>
        columns.some(col => {
          const val = item[col.key];
          return val != null && String(val).toLowerCase().includes(search.toLowerCase());
        }),
      )
    : data;

  const primaryCol = columns.find(c => c.primary) ?? columns[0];
  const detailCols = columns.filter(c => c.key !== primaryCol?.key);

  return (
    <div className={cn('rounded-xl border border-border bg-card shadow-card overflow-hidden', className)}>
      {searchable ? (
        <div className="border-b border-border p-3">
          <input
            type="text"
            placeholder={t('crud.search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring md:max-w-sm"
          />
        </div>
      ) : null}

      {responsive ? (
        <div className="divide-y divide-border md:hidden">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t('crud.noData')}</p>
          ) : (
            filtered.map((item, idx) => (
              <div key={idx} className="space-y-2 p-3">
                {primaryCol ? (
                  <p className="font-medium leading-snug">{cellValue(item, primaryCol)}</p>
                ) : null}
                <dl className="grid grid-cols-1 gap-y-2 text-xs sm:grid-cols-2 sm:gap-x-3 sm:gap-y-1.5">
                  {detailCols.map(col => (
                    <div key={col.key} className="min-w-0">
                      <dt className="text-muted-foreground">{col.label}</dt>
                      <dd className="mt-0.5 font-medium text-foreground break-words">
                        {cellValue(item, col)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))
          )}
        </div>
      ) : null}

      <div className={cn('overflow-x-auto', responsive ? 'hidden md:block' : '')}>
        <table className="w-full min-w-[480px] app-table-text">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-start font-medium text-muted-foreground">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  {t('crud.noData')}
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr key={idx} className="border-b border-border/50 transition-colors hover:bg-muted/30">
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render ? col.render(item) : String(item[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type { Column };

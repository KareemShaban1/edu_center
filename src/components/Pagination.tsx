import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  perPage?: number;
}

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, perPage = 10 }: PaginationProps) {
  const { t, dir } = useLocale();

  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage > 3) pages.push('...');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const start = (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalItems || totalPages * perPage);

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="text-center text-xs text-muted-foreground sm:text-start sm:text-sm">
        {totalItems ? `${t('crud.showing')} ${start}–${end} ${t('crud.of')} ${totalItems}` : `${t('crud.page')} ${currentPage} ${t('crud.of')} ${totalPages}`}
      </p>
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="rounded-lg p-2 hover:bg-muted disabled:opacity-40"
          aria-label={t('misc.previousPage')}
        >
          <PrevIcon className="h-4 w-4" />
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'h-9 min-w-[2.25rem] rounded-lg app-table-text font-medium transition-colors',
                p === currentPage ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="rounded-lg p-2 hover:bg-muted disabled:opacity-40"
          aria-label={t('misc.nextPage')}
        >
          <NextIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

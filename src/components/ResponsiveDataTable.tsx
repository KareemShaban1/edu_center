import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveDataTableProps {
  children: ReactNode;
  minWidth?: number;
  className?: string;
}

/** Horizontally scrollable table shell with touch-friendly overflow on small screens. */
export default function ResponsiveDataTable({
  children,
  minWidth = 480,
  className,
}: ResponsiveDataTableProps) {
  return (
    <div className={cn('relative -mx-3 sm:mx-0', className)}>
      <div className="overflow-x-auto rounded-lg border border-border [-webkit-overflow-scrolling:touch]">
        <table className="w-full caption-bottom text-xs sm:text-sm" style={{ minWidth }}>
          {children}
        </table>
      </div>
    </div>
  );
}

export const stickyHeadCell =
  'sticky z-20 bg-muted/95 px-2 py-2 font-medium backdrop-blur-sm sm:px-3 sm:py-2.5';

export const stickyBodyCell =
  'sticky z-10 bg-card px-2 py-2 sm:px-3 sm:py-2.5';

export const tableHeadCell = 'px-2 py-2 font-medium sm:px-3 sm:py-2.5';

export const tableBodyCell = 'px-2 py-2 sm:px-3 sm:py-2.5';

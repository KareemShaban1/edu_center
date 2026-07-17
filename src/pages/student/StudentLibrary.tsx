import { useMemo, useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import { Download } from 'lucide-react';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import StudentPageFilterBar, { uniqueSorted } from '@/components/student/StudentPageFilterBar';
import StudentFilterField from '@/components/student/StudentFilterField';
import StudentCenterTabsBar from '@/components/student/StudentCenterTabsBar';
import { FormSelect } from '@/components/FormFields';
import { useLocale } from '@/contexts/LocaleContext';
import { useStudentBootstrap } from '@/hooks/use-student-bootstrap';
import { useStudentCenterTabs } from '@/hooks/use-student-center-tabs';
import { studentSelfApi } from '@/services/endpoints/student-self';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { CenterScopedRow } from '@/types/models';

interface LibRow extends CenterScopedRow {
  id: number;
  title: string;
  type: string;
  notes?: string;
  url?: string | null;
}

function LibraryShowDialog({ item, onClose }: { item: LibRow; onClose: () => void }) {
  const { t } = useLocale();
  return (
    <Dialog open onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{t('crud.view')} {t('nav.library')}</DialogTitle></DialogHeader>
        <div className="space-y-2 text-sm">
          <p><strong>{t('col.title')}:</strong> {item.title}</p>
          <p><strong>{t('col.type')}:</strong> {item.type}</p>
          <p><strong>{t('col.notes')}:</strong> {item.notes || '—'}</p>
          <p><strong>URL:</strong> {item.url ? <a className="text-primary underline" href={item.url} target="_blank" rel="noreferrer">Open</a> : '—'}</p>
        </div>
        <div className="flex justify-end"><Button variant="outline" onClick={onClose}>{t('misc.close')}</Button></div>
      </DialogContent>
    </Dialog>
  );
}

export default function StudentLibrary() {
  const { t } = useLocale();
  const queryClient = useQueryClient();
  const { data } = useStudentBootstrap();
  const rows = (data?.library || []) as LibRow[];
  const {
    centerOptions,
    selectedCenterId,
    setSelectedCenterId,
    showCenterTabs,
    scopedRows,
  } = useStudentCenterTabs(data?.centers, rows);

  const [showItem, setShowItem] = useState<LibRow | null>(null);
  const [typeFilter, setTypeFilter] = useState('');

  const types = useMemo(() => uniqueSorted(scopedRows.map(r => r.type)), [scopedRows]);

  const filteredRows = useMemo(() => {
    return scopedRows.filter(row => {
      if (typeFilter && row.type !== typeFilter) return false;
      return true;
    });
  }, [scopedRows, typeFilter]);

  const appliedFilters = typeFilter ? 1 : 0;

  const clearFilters = () => setTypeFilter('');

  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentSelfApi.deleteLibrary(id),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-bootstrap'] }); },
  });

  const columns: CrudColumn<LibRow>[] = useMemo(() => [
    ...(showCenterTabs
      ? [{ key: 'center_name', label: t('col.center'), render: (l: LibRow) => <CenterLabel name={l.center_name} />, hideOnMobile: true } as CrudColumn<LibRow>]
      : []),
    { key: 'title', label: t('col.title'), sortable: true, primary: true },
    { key: 'type', label: t('col.type'), hideOnMobile: Boolean(typeFilter) },
    { key: 'notes', label: t('col.notes'), render: l => l.notes || '—', hideOnMobile: true },
    {
      key: 'download',
      label: '',
      render: l => (
        l.url ? (
          <a
            href={l.url}
            target="_blank"
            rel="noreferrer"
            aria-label={t('homework.openFile')}
            className="inline-flex rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Download className="h-4 w-4" aria-hidden />
          </a>
        ) : '—'
      ),
    },
    {
      key: '_show',
      label: t('crud.view'),
      render: l => (
        <button type="button" onClick={() => setShowItem(l)} className="rounded-lg border px-2.5 py-1.5 text-xs font-medium">
          {t('crud.view')}
        </button>
      ),
    },
  ], [showCenterTabs, t, typeFilter]);

  return (
    <>
      <CrudPage<LibRow>
        title={t('nav.library')}
        description={t('page.library.desc')}
        columns={columns}
        data={filteredRows}
        searchKeys={['title', 'type', 'notes', 'center_name']}
        rowKey={l => portalRowKey(l.center_id, l.id)}
        onDelete={item => { void deleteMutation.mutateAsync(item.id); }}
        topContent={(
          <>
            <StudentCenterTabsBar
              centers={centerOptions}
              value={selectedCenterId}
              onValueChange={setSelectedCenterId}
            />
            <StudentPageFilterBar
              appliedCount={appliedFilters}
              onClear={clearFilters}
              resultCount={filteredRows.length}
              renderFilters={idPrefix => (
                <StudentFilterField id={`${idPrefix}-type`} label={t('col.type')}>
                  <FormSelect
                    id={`${idPrefix}-type`}
                    title={t('col.type')}
                    value={typeFilter}
                    onChange={e => setTypeFilter(e.target.value)}
                  >
                    <option value="">{t('filter.all')}</option>
                    {types.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </FormSelect>
                </StudentFilterField>
              )}
            />
          </>
        )}
      />
      {showItem && <LibraryShowDialog item={showItem} onClose={() => setShowItem(null)} />}
    </>
  );
}

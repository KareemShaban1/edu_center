import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocale } from '@/contexts/LocaleContext';
import { platformApi } from '@/services/endpoints/platform';
import type { PlatformParent } from '@/types/models';

export default function PlatformParents() {
  const { t } = useLocale();
  const [viewId, setViewId] = useState<number | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['platform-parents'],
    queryFn: () => platformApi.listParents(),
  });

  const { data: viewItem, isLoading: viewLoading } = useQuery({
    queryKey: ['platform-parent', viewId],
    queryFn: () => platformApi.getParent(viewId!),
    enabled: viewId != null,
  });

  const columns: CrudColumn<PlatformParent>[] = [
    { key: 'id', label: t('col.id'), hideOnMobile: true },
    { key: 'name', label: t('col.name'), sortable: true, primary: true },
    { key: 'email', label: t('col.email') },
    { key: 'phone', label: t('col.phone'), render: p => p.phone || '—' },
    { key: 'job', label: t('col.job'), render: p => p.job || '—' },
    { key: 'children_count', label: t('nav.students'), sortable: true },
    { key: 'centers_label', label: t('nav.tenants'), render: p => p.centers_label || '—' },
    { key: 'status', label: t('col.status'), render: p => <StatusBadge status={p.status} /> },
    { key: 'created_at', label: t('col.date'), sortable: true },
  ];

  const detailRows = viewItem
    ? [
        { label: t('col.id'), value: viewItem.id },
        { label: t('col.name'), value: viewItem.name },
        { label: t('col.email'), value: viewItem.email },
        { label: t('col.phone'), value: viewItem.phone || '—' },
        { label: t('col.job'), value: viewItem.job || '—' },
        { label: t('col.address'), value: viewItem.address || '—' },
        { label: t('col.notes'), value: viewItem.notes || '—' },
        { label: t('col.status'), value: <StatusBadge status={viewItem.status} /> },
        {
          label: t('nav.tenants'),
          value: viewItem.centers.length
            ? viewItem.centers.map(c => `${c.name}${c.status ? ` (${c.status})` : ''}`).join(', ')
            : '—',
        },
        {
          label: t('nav.students'),
          value: viewItem.children?.length
            ? viewItem.children.map(c => `${c.name}${c.code ? ` (${c.code})` : ''}`).join(', ')
            : String(viewItem.children_count ?? 0),
        },
        { label: t('col.date'), value: viewItem.created_at || '—' },
        { label: t('platform.tenant.updatedAt'), value: viewItem.updated_at || '—' },
      ]
    : [];

  return (
    <>
      <CrudPage<PlatformParent>
        title={t('nav.parents')}
        description={t('page.platform.parents.desc')}
        columns={columns}
        data={isLoading ? [] : data}
        searchKeys={['name', 'email', 'phone', 'job', 'centers_label']}
        readOnly
        canCreate={false}
        canEdit={false}
        canDelete={false}
        renderExtraActions={item => (
          <button
            type="button"
            onClick={() => setViewId(item.id)}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={t('crud.show')}
            title={t('crud.show')}
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
      />
      <Dialog open={viewId != null} onOpenChange={open => !open && setViewId(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{viewItem?.name || t('platform.parent.details')}</DialogTitle>
          </DialogHeader>
          {viewLoading || !viewItem ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : (
            <dl className="grid gap-3 text-sm">
              {detailRows.map(row => (
                <div key={row.label} className="grid gap-2 border-b border-border/60 pb-2 last:border-0 sm:grid-cols-[9rem_1fr]">
                  <dt className="font-medium text-muted-foreground">{row.label}</dt>
                  <dd className="min-w-0 break-words">{row.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

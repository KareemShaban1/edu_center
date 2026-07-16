import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocale } from '@/contexts/LocaleContext';
import { platformApi } from '@/services/endpoints/platform';
import type { PlatformStudent } from '@/types/models';

export default function PlatformStudents() {
  const { t } = useLocale();
  const [viewId, setViewId] = useState<number | null>(null);

  const { data = [], isLoading } = useQuery({
    queryKey: ['platform-students'],
    queryFn: () => platformApi.listStudents(),
  });

  const { data: viewItem, isLoading: viewLoading } = useQuery({
    queryKey: ['platform-student', viewId],
    queryFn: () => platformApi.getStudent(viewId!),
    enabled: viewId != null,
  });

  const columns: CrudColumn<PlatformStudent>[] = [
    { key: 'id', label: t('col.id'), hideOnMobile: true },
    { key: 'name', label: t('col.name'), sortable: true, primary: true },
    { key: 'code', label: t('col.code'), render: s => s.code || '—' },
    { key: 'email', label: t('col.email') },
    { key: 'phone', label: t('col.phone'), render: s => s.phone || '—' },
    { key: 'gender', label: t('col.gender'), render: s => s.gender ? t(`gender.${s.gender}`) : '—' },
    { key: 'parent_name', label: t('nav.parents'), render: s => s.parent_name || '—' },
    { key: 'centers_label', label: t('nav.tenants'), render: s => s.centers_label || '—' },
    { key: 'status', label: t('col.status'), render: s => <StatusBadge status={s.status} /> },
    { key: 'created_at', label: t('col.date'), sortable: true },
  ];

  const detailRows = viewItem
    ? [
        { label: t('col.id'), value: viewItem.id },
        { label: t('col.name'), value: viewItem.name },
        { label: t('col.code'), value: viewItem.code || '—' },
        { label: t('col.email'), value: viewItem.email },
        { label: t('col.phone'), value: viewItem.phone || '—' },
        { label: t('col.gender'), value: viewItem.gender ? t(`gender.${viewItem.gender}`) : '—' },
        { label: t('col.year'), value: viewItem.academic_year || '—' },
        { label: t('col.grade'), value: viewItem.grade_id ?? '—' },
        { label: t('col.class'), value: viewItem.class_id ?? '—' },
        { label: t('col.section'), value: viewItem.section_id ?? '—' },
        {
          label: t('nav.parents'),
          value: viewItem.parent
            ? `${viewItem.parent.name} (${viewItem.parent.email}${viewItem.parent.phone ? ` · ${viewItem.parent.phone}` : ''})`
            : (viewItem.parent_name || '—'),
        },
        { label: t('col.notes'), value: viewItem.notes || '—' },
        { label: t('col.status'), value: <StatusBadge status={viewItem.status} /> },
        {
          label: t('nav.tenants'),
          value: viewItem.centers.length
            ? viewItem.centers.map(c => `${c.name}${c.status ? ` (${c.status})` : ''}`).join(', ')
            : '—',
        },
        { label: t('col.date'), value: viewItem.created_at || '—' },
        { label: t('platform.tenant.updatedAt'), value: viewItem.updated_at || '—' },
      ]
    : [];

  return (
    <>
      <CrudPage<PlatformStudent>
        title={t('nav.students')}
        description={t('page.platform.students.desc')}
        columns={columns}
        data={isLoading ? [] : data}
        searchKeys={['name', 'code', 'email', 'phone', 'parent_name', 'centers_label']}
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
            <DialogTitle>{viewItem?.name || t('platform.student.details')}</DialogTitle>
          </DialogHeader>
          {viewLoading || !viewItem ? (
            <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
          ) : (
            <dl className="grid gap-3 text-sm">
              {detailRows.map(row => (
                <div key={row.label} className="grid grid-cols-[9rem_1fr] gap-2 border-b border-border/60 pb-2 last:border-0">
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

import { useMemo, useState } from 'react';
import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import type { Parent, Student } from '@/types/models';
import { useLocale } from '@/contexts/LocaleContext';
import { Eye } from 'lucide-react';
import { useAdminBootstrap } from '@/hooks/use-admin-bootstrap';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function ParentDetailsModal({
  parent,
  children,
  onClose,
}: {
  parent: Parent;
  children: Student[];
  onClose: () => void;
}) {
  const { t } = useLocale();

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">{parent.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <p><span className="font-medium text-muted-foreground">{t('col.id')}:</span> {parent.id}</p>
            <p><span className="font-medium text-muted-foreground">{t('col.status')}:</span> <StatusBadge status={parent.status} label={t(`status.${parent.status}`)} /></p>
            <p className="sm:col-span-2"><span className="font-medium text-muted-foreground">{t('col.name')}:</span> {parent.name}</p>
            <p className="sm:col-span-2"><span className="font-medium text-muted-foreground">{t('col.email')}:</span> {parent.email || '—'}</p>
            <p><span className="font-medium text-muted-foreground">{t('col.phone')}:</span> {parent.phone || '—'}</p>
            <p><span className="font-medium text-muted-foreground">{t('col.jobTitle')}:</span> {parent.job_title || '—'}</p>
            <p className="sm:col-span-2"><span className="font-medium text-muted-foreground">{t('col.address')}:</span> {parent.address || '—'}</p>
          </div>

          <div className="border-t pt-3">
            <p className="mb-2 font-medium">{t('nav.children')}</p>
            {children.length > 0 ? (
              <ul className="space-y-2">
                {children.map(child => (
                  <li key={child.id} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                    <p className="font-medium">{child.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {child.code ? `${child.code} · ` : ''}{child.email || '—'}
                    </p>
                    {(child.grade_name || child.class_name || child.section_name) && (
                      <p className="text-xs text-muted-foreground">
                        {[child.grade_name, child.class_name, child.section_name].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{t('misc.noDataAvailable')}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminParents() {
  const { t } = useLocale();
  const { data: bootstrap } = useAdminBootstrap();
  const parents = (bootstrap?.parents || []) as Parent[];
  const students = (bootstrap?.students || []) as Student[];
  const [viewItem, setViewItem] = useState<Parent | null>(null);

  const childrenByParentId = useMemo(() => {
    const map = new Map<number, Student[]>();
    for (const student of students) {
      if (!student.parent_id) continue;
      const list = map.get(student.parent_id) ?? [];
      list.push(student);
      map.set(student.parent_id, list);
    }
    return map;
  }, [students]);

  const columns: CrudColumn<Parent>[] = [
    { key: 'id', label: t('col.id'), sortable: true },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'email', label: t('col.email') },
    { key: 'phone', label: t('col.phone') },
    { key: 'job_title', label: t('col.jobTitle') },
    { key: 'status', label: t('col.status'), render: (val) => <StatusBadge status={val.status} label={t(`status.${val.status}`)} /> },
  ];

  return (
    <>
      <CrudPage<Parent>
        title={t('nav.parents')}
        description={t('page.parents.desc')}
        columns={columns}
        data={parents}
        searchKeys={['name', 'email', 'phone', 'job_title']}
        canCreate={false}
        canEdit={false}
        canDelete={false}
        renderExtraActions={parent => (
          <button
            type="button"
            onClick={() => setViewItem(parent)}
            className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            aria-label={t('crud.view')}
            title={t('crud.view')}
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
      />

      {viewItem && (
        <ParentDetailsModal
          parent={viewItem}
          children={childrenByParentId.get(viewItem.id) ?? []}
          onClose={() => setViewItem(null)}
        />
      )}
    </>
  );
}

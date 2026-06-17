import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import { useLocale } from '@/contexts/LocaleContext';
import { useParentBootstrap } from '@/hooks/use-parent-bootstrap';
import type { CenterScopedRow } from '@/types/models';

interface FeeRow extends CenterScopedRow {
  id: number;
  student_name: string;
  item: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'pending';
  due_date: string;
}

export default function ParentFees() {
  const { t } = useLocale();
  const { data } = useParentBootstrap();
  const rows = (data?.fees || []) as FeeRow[];
  const columns: CrudColumn<FeeRow>[] = [
    { key: 'center_name', label: t('col.center'), render: f => <CenterLabel name={f.center_name} /> },
    { key: 'student_name', label: t('col.child'), sortable: true },
    { key: 'item', label: t('col.title') },
    { key: 'amount', label: t('col.amount'), render: f => `$${f.amount.toLocaleString()}` },
    { key: 'due_date', label: t('col.dueDate'), sortable: true },
    { key: 'status', label: t('col.status'), render: f => <StatusBadge status={f.status} /> },
  ];
  return (
    <CrudPage<FeeRow>
      title={t('nav.fees_short')}
      description={t('page.fees.desc')}
      columns={columns}
      data={rows}
      searchKeys={['student_name', 'item', 'center_name']}
      rowKey={f => portalRowKey(f.center_id, f.id)}
      readOnly
    />
  );
}

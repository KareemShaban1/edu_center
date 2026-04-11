import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import { useLocale } from '@/contexts/LocaleContext';
import { useParentBootstrap } from '@/hooks/use-parent-bootstrap';

interface AttRow {
  id: number;
  student_name: string;
  date: string;
  status: 'present' | 'absent' | 'late';
}

export default function ParentAttendance() {
  const { t } = useLocale();
  const { data } = useParentBootstrap();
  const rows = (data?.attendance || []) as AttRow[];
  const columns: CrudColumn<AttRow>[] = [
    { key: 'student_name', label: t('col.child'), sortable: true },
    { key: 'date', label: t('col.date'), sortable: true },
    { key: 'status', label: t('col.status'), render: a => <StatusBadge status={a.status} /> },
  ];
  return <CrudPage<AttRow> title={t('nav.attendance')} description={t('page.attendance.desc')} columns={columns} data={rows} searchKeys={['student_name', 'date']} readOnly />;
}

import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import { useLocale } from '@/contexts/LocaleContext';
import { useParentBootstrap } from '@/hooks/use-parent-bootstrap';
import type { CenterScopedRow } from '@/types/models';

interface ParentExamRow extends CenterScopedRow {
  id: number;
  student_name: string;
  grade?: string;
  date: string;
  degree?: number | null;
  attendance_status?: 'present' | 'absent' | 'late';
  notes?: string;
}

export default function ParentExams() {
  const { t } = useLocale();
  const { data } = useParentBootstrap();
  const exams = (data?.exams || []) as ParentExamRow[];
  const columns: CrudColumn<ParentExamRow>[] = [
    { key: 'center_name', label: t('col.center'), render: e => <CenterLabel name={e.center_name} /> },
    { key: 'student_name', label: t('col.child'), sortable: true },
    { key: 'grade', label: t('col.grade') },
    { key: 'date', label: t('col.date'), sortable: true },
    { key: 'degree', label: t('col.score'), render: e => (e.degree ?? '—') },
    { key: 'attendance_status', label: t('col.status'), render: e => <StatusBadge status={e.attendance_status || 'present'} /> },
    { key: 'notes', label: t('col.notes'), render: e => e.notes || '—' },
  ];

  return (
    <CrudPage<ParentExamRow>
      title={t('nav.exams')}
      description={t('page.exams.desc')}
      columns={columns}
      data={exams}
      searchKeys={['student_name', 'date', 'center_name']}
      rowKey={e => portalRowKey(e.center_id, e.id)}
      readOnly
    />
  );
}

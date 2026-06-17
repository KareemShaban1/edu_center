import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import CenterLabel, { portalRowKey } from '@/components/CenterLabel';
import { useLocale } from '@/contexts/LocaleContext';
import { useParentBootstrap } from '@/hooks/use-parent-bootstrap';
import type { CenterScopedRow } from '@/types/models';

interface ParentQuizRow extends CenterScopedRow {
  id: number;
  student_name: string;
  grade?: string;
  date: string;
  degree?: number | null;
  attendance_status?: 'present' | 'absent' | 'late';
  notes?: string;
}

export default function ParentQuizzes() {
  const { t } = useLocale();
  const { data } = useParentBootstrap();
  const quizzes = (data?.quizzes || []) as ParentQuizRow[];
  const columns: CrudColumn<ParentQuizRow>[] = [
    { key: 'center_name', label: t('col.center'), render: q => <CenterLabel name={q.center_name} /> },
    { key: 'student_name', label: t('col.child'), sortable: true },
    { key: 'grade', label: t('col.grade') },
    { key: 'date', label: t('col.date'), sortable: true },
    { key: 'degree', label: t('col.score'), render: q => (q.degree ?? '—') },
    { key: 'attendance_status', label: t('col.status'), render: q => <StatusBadge status={q.attendance_status || 'present'} /> },
    { key: 'notes', label: t('col.notes'), render: q => q.notes || '—' },
  ];

  return (
    <CrudPage<ParentQuizRow>
      title={t('nav.quizzes')}
      description={t('page.quizzes.desc')}
      columns={columns}
      data={quizzes}
      searchKeys={['student_name', 'date', 'center_name']}
      rowKey={q => portalRowKey(q.center_id, q.id)}
      readOnly
    />
  );
}

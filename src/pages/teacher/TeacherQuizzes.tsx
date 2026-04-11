import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import { useLocale } from '@/contexts/LocaleContext';
import { useTeacherBootstrap } from '@/hooks/use-teacher-bootstrap';

interface QuizRow {
  id: number;
  name: string;
  subject: string;
  grade: string;
  date: string;
  student_name?: string;
  degree?: number | null;
  attendance_status?: 'present' | 'absent' | 'late';
  notes?: string;
  status: string;
}

export default function TeacherQuizzes() {
  const { t } = useLocale();
  const { data } = useTeacherBootstrap();
  const quizzes = (data?.quizzes || []) as QuizRow[];
  const columns: CrudColumn<QuizRow>[] = [
    { key: 'id', label: t('col.id') },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'student_name', label: t('col.student'), render: q => q.student_name || '—' },
    { key: 'subject', label: t('col.subject') },
    { key: 'grade', label: t('col.grade') },
    { key: 'date', label: t('col.date'), sortable: true },
    { key: 'degree', label: t('col.score'), render: q => (q.degree ?? '—') },
    { key: 'attendance_status', label: t('col.status'), render: q => <StatusBadge status={q.attendance_status || 'present'} /> },
    { key: 'notes', label: t('col.notes'), render: q => q.notes || '—' },
    { key: 'status', label: t('col.status'), render: q => <StatusBadge status={q.status} /> },
  ];
  return (
    <CrudPage<QuizRow>
      title={t('nav.quizzes')}
      description={t('page.quizzes.desc')}
      columns={columns}
      data={quizzes}
      searchKeys={['name', 'subject']}
      readOnly
    />
  );
}

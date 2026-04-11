import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import { useLocale } from '@/contexts/LocaleContext';
import { useTeacherBootstrap } from '@/hooks/use-teacher-bootstrap';

interface ExamRow {
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

export default function TeacherExams() {
  const { t } = useLocale();
  const { data } = useTeacherBootstrap();
  const exams = (data?.exams || []) as ExamRow[];
  const columns: CrudColumn<ExamRow>[] = [
    { key: 'id', label: t('col.id') },
    { key: 'name', label: t('col.name'), sortable: true },
    { key: 'student_name', label: t('col.student'), render: e => e.student_name || '—' },
    { key: 'subject', label: t('col.subject') },
    { key: 'grade', label: t('col.grade') },
    { key: 'date', label: t('col.date'), sortable: true },
    { key: 'degree', label: t('col.score'), render: e => (e.degree ?? '—') },
    { key: 'attendance_status', label: t('col.status'), render: e => <StatusBadge status={e.attendance_status || 'present'} /> },
    { key: 'notes', label: t('col.notes'), render: e => e.notes || '—' },
    { key: 'status', label: t('col.status'), render: e => <StatusBadge status={e.status} /> },
  ];
  return (
    <CrudPage<ExamRow>
      title={t('nav.exams')}
      description={t('page.exams.desc')}
      columns={columns}
      data={exams}
      searchKeys={['name', 'subject', 'student_name']}
      readOnly
    />
  );
}


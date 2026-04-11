import CrudPage, { CrudColumn } from '@/components/CrudPage';
import StatusBadge from '@/components/StatusBadge';
import type { Attendance } from '@/types/models';
import { useLocale } from '@/contexts/LocaleContext';
import { useTeacherBootstrap } from '@/hooks/use-teacher-bootstrap';

export default function TeacherAttendance() {
  const { t } = useLocale();
  const { data } = useTeacherBootstrap();
  const rows = (data?.attendance || []) as Attendance[];
  const columns: CrudColumn<Attendance>[] = [
    { key: 'id', label: t('col.id') },
    { key: 'student', label: t('col.student'), render: a => a.student?.name || `Student ${a.student_id}` },
    { key: 'date', label: t('col.date'), sortable: true },
    { key: 'status', label: t('col.status'), render: a => <StatusBadge status={a.status} /> },
  ];
  return (
    <CrudPage<Attendance>
      title={t('nav.attendance')}
      description={t('page.attendance.desc')}
      columns={columns}
      data={rows}
      searchKeys={['date']}
      readOnly
    />
  );
}

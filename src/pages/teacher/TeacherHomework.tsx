import CrudPage, { CrudColumn } from '@/components/CrudPage';
import { useLocale } from '@/contexts/LocaleContext';
import { useTeacherBootstrap } from '@/hooks/use-teacher-bootstrap';

interface HWRow { id: number; title: string; subject: string; grade: string; due_date: string; submissions: number; }

export default function TeacherHomework() {
  const { t } = useLocale();
  const { data } = useTeacherBootstrap();
  const homework = (data?.homework || []) as HWRow[];
  const columns: CrudColumn<HWRow>[] = [
    { key: 'id', label: t('col.id') },
    { key: 'title', label: t('col.title'), sortable: true },
    { key: 'subject', label: t('col.subject') },
    { key: 'grade', label: t('col.grade') },
    { key: 'due_date', label: t('col.dueDate'), sortable: true },
    { key: 'submissions', label: t('col.total'), render: h => <span className="font-medium">{h.submissions}</span> },
  ];
  return (
    <CrudPage<HWRow>
      title={t('nav.homework')}
      description={t('page.homework.desc')}
      columns={columns}
      data={homework}
      searchKeys={['title', 'subject']}
      readOnly
    />
  );
}

import AdminSectionTreePage from '@/components/admin/AdminSectionTreePage';

export default function AdminExams() {
  return (
    <AdminSectionTreePage
      basePath="exams"
      titleKey="nav.exams"
      descKey="page.exams.desc"
      todayKey="page.exams.today"
      historyKey="page.exams.history"
    />
  );
}

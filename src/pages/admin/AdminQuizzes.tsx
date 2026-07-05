import AdminSectionTreePage from '@/components/admin/AdminSectionTreePage';

export default function AdminQuizzes() {
  return (
    <AdminSectionTreePage
      basePath="quizzes"
      titleKey="nav.quizzes"
      descKey="page.quizzes.desc"
      todayKey="page.quizzes.today"
      historyKey="page.quizzes.history"
    />
  );
}

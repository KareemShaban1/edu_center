import AdminSectionTreePage from '@/components/admin/AdminSectionTreePage';

export default function AdminPayments() {
  return (
    <AdminSectionTreePage
      basePath="payments"
      titleKey="nav.payments"
      descKey="page.payments.desc"
      todayKey="payments.today"
      historyKey="payments.history"
    />
  );
}

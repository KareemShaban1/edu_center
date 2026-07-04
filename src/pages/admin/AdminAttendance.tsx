import AdminSectionTreePage from '@/components/admin/AdminSectionTreePage';

export default function AdminAttendance() {
  return (
    <AdminSectionTreePage
      basePath="attendance"
      titleKey="nav.attendance"
      descKey="page.attendance.desc"
    />
  );
}

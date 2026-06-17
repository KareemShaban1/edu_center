import PortalLoginPage from '@/pages/PortalLoginPage';
import { GraduationCap } from 'lucide-react';

export default function StudentLoginPage() {
  return (
    <PortalLoginPage
      guard="student"
      role="student"
      loginPath="/student/login"
      titleKey="role.student"
      descKey="auth.studentPortalDesc"
      icon={GraduationCap}
    />
  );
}

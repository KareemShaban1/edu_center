import PortalRegisterPage from '@/pages/PortalRegisterPage';
import { GraduationCap } from 'lucide-react';

export default function StudentRegisterPage() {
  return (
    <PortalRegisterPage
      guard="student"
      role="student"
      loginPath="/student/login"
      registerPath="/student/register"
      titleKey="auth.studentRegisterTitle"
      descKey="auth.studentRegisterDesc"
      icon={GraduationCap}
    />
  );
}

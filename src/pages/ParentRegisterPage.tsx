import PortalRegisterPage from '@/pages/PortalRegisterPage';
import { Users } from 'lucide-react';

export default function ParentRegisterPage() {
  return (
    <PortalRegisterPage
      guard="parent"
      role="parent"
      loginPath="/parent/login"
      registerPath="/parent/register"
      titleKey="auth.parentRegisterTitle"
      descKey="auth.parentRegisterDesc"
      icon={Users}
    />
  );
}

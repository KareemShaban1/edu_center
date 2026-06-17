import PortalLoginPage from '@/pages/PortalLoginPage';
import { Users } from 'lucide-react';

export default function ParentLoginPage() {
  return (
    <PortalLoginPage
      guard="parent"
      role="parent"
      loginPath="/parent/login"
      titleKey="role.parent"
      descKey="auth.parentPortalDesc"
      icon={Users}
    />
  );
}

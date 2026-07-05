import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { hasDeveloperAccess } from '@/config/developer-access';
import type { UserRole } from '@/types/models';

interface DeveloperProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function DeveloperProtectedRoute({
  children,
  allowedRoles = ['super_admin', 'platform_admin'],
}: DeveloperProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasDeveloperAccess()) {
    return <Navigate to="/developer/login" replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/developer/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/developer/login" replace />;
  }

  return <>{children}</>;
}

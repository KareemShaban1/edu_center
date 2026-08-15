import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/models';
import { getDashboardPath } from '@/lib/routes';
import { getTenantLoginPath } from '@/lib/tenant-routes';
import { canAccessAdminPath } from '@/lib/admin-permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  /** Where unauthenticated users are sent (default tenant login from session). */
  loginPath?: string;
}

export default function ProtectedRoute({ children, allowedRoles, loginPath }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const resolvedLoginPath = loginPath ?? getTenantLoginPath(user?.tenant_slug);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to={resolvedLoginPath} replace />;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  if (user?.role === 'admin' && location.pathname.startsWith('/admin') && !canAccessAdminPath(location.pathname, user)) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

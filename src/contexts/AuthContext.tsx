import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '@/types/models';
import { authApi } from '@/services/endpoints/auth';
import { apiClient, setSessionExpiredHandler } from '@/services/api-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, guard?: string, tenantSlug?: string, membershipId?: number) => Promise<User>;
  loginPortal: (email: string, password: string, guard: 'parent' | 'student') => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      apiClient.setToken(null);
      apiClient.setTenantContext(null);
      localStorage.removeItem('auth_user');
      setUser(null);
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    const token = apiClient.getToken();
    if (token === 'session-auth') {
      apiClient.setToken(null);
      localStorage.removeItem('auth_user');
      setIsLoading(false);
      return;
    }

    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User);
      } catch {
        localStorage.removeItem('auth_user');
      }
    }

    if (token) {
      authApi.getUser()
        .then(u => {
          setUser(u);
          localStorage.setItem('auth_user', JSON.stringify(u));
          apiClient.setTenantContext({
            tenantId: u.tenant_id ?? undefined,
            tenantSlug: u.tenant_slug ?? undefined,
          });
        })
        .catch((err: unknown) => {
          const status = typeof err === 'object' && err !== null && 'status' in err
            ? (err as { status?: number }).status
            : undefined;
          if (status === 401) {
            apiClient.setToken(null);
            apiClient.setTenantContext(null);
            setUser(null);
            localStorage.removeItem('auth_user');
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string, guard?: string, tenantSlug?: string, membershipId?: number) => {
    const result = await authApi.login({ email, password, guard, tenantSlug, membershipId });
    if (result.type === 'tenant_selection') {
      const err = new Error('TENANT_SELECTION_REQUIRED') as Error & {
        memberships: typeof result.memberships;
        user: typeof result.user;
      };
      err.memberships = result.memberships;
      err.user = result.user;
      throw err;
    }
    const res = result.response;
    apiClient.setToken(res.token);
    apiClient.setTenantContext({
      tenantId: res.user.tenant_id ?? undefined,
      tenantSlug: res.user.tenant_slug ?? tenantSlug,
    });
    const verified = await authApi.getUser();
    localStorage.setItem('auth_user', JSON.stringify(verified));
    setUser(verified);
    return verified;
  }, []);

  const loginPortal = useCallback(async (email: string, password: string, guard: 'parent' | 'student') => {
    const res = await authApi.loginPortal({ email, password, guard });
    apiClient.setToken(res.token);
    apiClient.setTenantContext(null);
    const verified = await authApi.getUser();
    localStorage.setItem('auth_user', JSON.stringify(verified));
    setUser(verified);
    return verified;
  }, []);

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    apiClient.setToken(null);
    apiClient.setTenantContext(null);
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      loginPortal,
      logout,
      isAuthenticated: !!user,
      hasRole: (role: UserRole) => user?.role === role,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

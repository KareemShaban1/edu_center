import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, UserRole } from '@/types/models';
import { authApi } from '@/services/endpoints/auth';
import { apiClient, setSessionExpiredHandler } from '@/services/api-client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, guard?: string, tenantSlug?: string) => Promise<User>;
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
    if (token) {
      authApi.getUser()
        .then(u => {
          setUser(u);
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

  const login = useCallback(async (email: string, password: string, guard?: string, tenantSlug?: string) => {
    const res = await authApi.login({ email, password, guard, tenantSlug });
    apiClient.setToken(res.token);
    apiClient.setTenantContext({
      tenantId: res.user.tenant_id ?? undefined,
      tenantSlug: res.user.tenant_slug ?? tenantSlug,
    });
    // Confirm session cookie works (login JSON alone is not enough for API auth).
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

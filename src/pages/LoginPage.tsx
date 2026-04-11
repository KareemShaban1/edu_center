import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { GraduationCap, Shield, BookOpen, Users, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/models';
import { getDashboardPath } from '@/lib/routes';
import { authApi } from '@/services/endpoints/auth';
import {
  getTenantDefaultsForGuard,
  isPlatformGuard,
} from '@/config/login-defaults';

const guardToRoleMap: Record<string, UserRole> = {
  users: 'admin',
  teacher: 'teacher',
  parent: 'parent',
  student: 'student',
  super_admin: 'super_admin',
  platform_admin: 'super_admin',
  admin: 'admin',
};

const guardMeta: Record<string, { labelKey: string; icon: React.ElementType; color: string }> = {
  users: { labelKey: 'role.admin', icon: Shield, color: 'bg-primary/10 text-primary border-primary/20' },
  teacher: { labelKey: 'role.teacher', icon: BookOpen, color: 'bg-success/10 text-success border-success/20' },
  student: { labelKey: 'role.student', icon: GraduationCap, color: 'bg-info/10 text-info border-info/20' },
  parent: { labelKey: 'role.parent', icon: Users, color: 'bg-warning/10 text-warning border-warning/20' },
};

export default function LoginPage() {
  const { login } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const navigate = useNavigate();
  const initialDefaults = getTenantDefaultsForGuard('users');
  const [selectedGuard, setSelectedGuard] = useState<string>('users');
  const [email, setEmail] = useState(initialDefaults.email);
  const [password, setPassword] = useState(initialDefaults.password);
  const [tenantSlug, setTenantSlug] = useState(initialDefaults.tenantSlug);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: guards = ['users', 'teacher', 'parent', 'student'] } = useQuery({
    queryKey: ['auth-guards'],
    queryFn: () => authApi.getGuards(),
  });

  const tenantGuards = useMemo(() => {
    const filtered = guards.filter(g => !isPlatformGuard(g));
    return filtered.length > 0 ? filtered : ['users', 'teacher', 'parent', 'student'];
  }, [guards]);

  useEffect(() => {
    if (tenantGuards.length > 0 && !tenantGuards.includes(selectedGuard)) {
      setSelectedGuard(tenantGuards[0]);
    }
  }, [tenantGuards, selectedGuard]);

  useEffect(() => {
    const d = getTenantDefaultsForGuard(selectedGuard);
    setEmail(d.email);
    setPassword(d.password);
    setTenantSlug(d.tenantSlug);
  }, [selectedGuard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, selectedGuard, tenantSlug);
      const normalizedRole = guardToRoleMap[user.role] || user.role;
      navigate(getDashboardPath(normalizedRole));
    } catch {
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      {/* Language toggle */}
      <button
        type="button"
        onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
        className="fixed top-4 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium shadow-card hover:bg-muted transition-colors ltr:right-4 rtl:left-4"
        aria-label={t('misc.language')}
      >
        <Languages className="h-4 w-4 text-muted-foreground" />
        {locale === 'en' ? 'العربية' : 'English'}
      </button>

      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <GraduationCap className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold">{t('app.welcome')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('app.signIn')}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
          {/* Role selection */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium">{t('auth.signInAs')}</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {tenantGuards.map(guard => {
                const meta = guardMeta[guard] || guardMeta.users;
                return (
                  <button
                    key={guard}
                    type="button"
                    onClick={() => setSelectedGuard(guard)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-medium transition-all',
                      selectedGuard === guard
                        ? cn(meta.color, 'ring-2 ring-offset-1 ring-ring')
                        : 'border-border text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <meta.icon className="h-4 w-4" />
                    <span className="truncate">{t(meta.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="tenant" className="mb-1.5 block text-sm font-medium">
                {t('auth.tenantCode')}
              </label>
              <input
                id="tenant"
                type="text"
                value={tenantSlug}
                onChange={e => setTenantSlug(e.target.value)}
                required
                autoComplete="organization"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="school-a"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">{t('auth.email')}</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">{t('auth.password')}</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>

          {/* <p className="mt-4 text-center">
            <Link
              to="/platform/login"
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('auth.linkPlatformLogin')}
            </Link>
          </p> */}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t('app.demoMode')}
        </p>
      </div>
    </div>
  );
}

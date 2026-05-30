import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { Globe, Shield, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/models';
import { getDashboardPath } from '@/lib/routes';
import { authApi } from '@/services/endpoints/auth';
import {
  getPlatformDefaultsForGuard,
  isPlatformGuard,
} from '@/config/login-defaults';
import { getTenantLoginPath } from '@/lib/tenant-routes';

const guardToRoleMap: Record<string, UserRole> = {
  super_admin: 'super_admin',
  platform_admin: 'super_admin',
};

const platformGuardMeta: Record<string, { labelKey: string; icon: React.ElementType; color: string }> = {
  super_admin: { labelKey: 'role.super_admin', icon: Globe, color: 'bg-exams/10 text-exams border-exams/20' },
  platform_admin: { labelKey: 'role.platform_admin', icon: Shield, color: 'bg-primary/10 text-primary border-primary/20' },
};

export default function PlatformLoginPage() {
  const { login } = useAuth();
  const { t, locale, setLocale } = useLocale();
  const navigate = useNavigate();
  const [selectedGuard, setSelectedGuard] = useState('super_admin');
  const [email, setEmail] = useState(() => getPlatformDefaultsForGuard('super_admin').email);
  const [password, setPassword] = useState(() => getPlatformDefaultsForGuard('super_admin').password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: guards = ['super_admin', 'platform_admin'] } = useQuery({
    queryKey: ['auth-guards'],
    queryFn: () => authApi.getGuards(),
  });

  const platformGuards = useMemo(() => {
    const p = guards.filter(g => isPlatformGuard(g));
    return p.length > 0 ? p : ['super_admin', 'platform_admin'];
  }, [guards]);

  useEffect(() => {
    if (platformGuards.length === 0) return;
    if (!platformGuards.includes(selectedGuard)) {
      setSelectedGuard(platformGuards[0]);
    }
  }, [platformGuards, selectedGuard]);

  useEffect(() => {
    const d = getPlatformDefaultsForGuard(selectedGuard);
    setEmail(d.email);
    setPassword(d.password);
  }, [selectedGuard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, selectedGuard, undefined);
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
      <button
        type="button"
        onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
        className="fixed top-4 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium shadow-card transition-colors hover:bg-muted ltr:right-4 rtl:left-4"
        aria-label={t('misc.language')}
      >
        <Languages className="h-4 w-4 text-muted-foreground" />
        {locale === 'en' ? 'العربية' : 'English'}
      </button>

      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-exams">
            <Globe className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold">{t('auth.platformPortalTitle')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('auth.platformPortalSubtitle')}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-elevated">
          {platformGuards.length > 1 && (
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium">{t('auth.signInAs')}</label>
              <div className="grid grid-cols-2 gap-2">
                {platformGuards.map(guard => {
                  const meta = platformGuardMeta[guard] || platformGuardMeta.super_admin;
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
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="platform-email" className="mb-1.5 block text-sm font-medium">
                {t('auth.email')}
              </label>
              <input
                id="platform-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="username"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label htmlFor="platform-password" className="mb-1.5 block text-sm font-medium">
                {t('auth.password')}
              </label>
              <input
                id="platform-password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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

          <p className="mt-4 text-center">
            <Link
              to={getTenantLoginPath()}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              {t('auth.linkSchoolLogin')}
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">{t('app.demoMode')}</p>
      </div>
    </div>
  );
}

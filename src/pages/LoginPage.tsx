import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { TenantMembershipOption } from '@/types/models';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { GraduationCap, Shield, BookOpen, Building2, UserCircle, Headphones } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/models';
import { getDashboardPath } from '@/lib/routes';
import { getTenantLoginPath, getParentLoginPath, getStudentLoginPath, normalizeTenantSlug } from '@/lib/tenant-routes';
import { authApi } from '@/services/endpoints/auth';
import { apiClient } from '@/services/api-client';
import { getTenantDefaultsForGuard, isPlatformGuard } from '@/config/login-defaults';
import { brand } from '@/components/auth/login-theme';
import { LANDING_WHATSAPP } from '@/components/landing/platform-landing/constants';

const C = brand;
const TENANT_LOGIN_BG = '/images/tenant-login-egypt-bg.png';

const portalButtonStyle = {
  borderColor: `${C.crimsonBright}22`,
  backgroundColor: C.bg,
  color: C.crimson,
};

function buildCustomerServiceHref(isAr: boolean): string {
  const message = isAr
    ? 'مرحباً، أحتاج مساعدة في تسجيل الدخول.'
    : 'Hello, I need help with login.';
  const phone = LANDING_WHATSAPP.phone.replace(/\D/g, '');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

const guardToRoleMap: Record<string, UserRole> = {
  users: 'admin',
  teacher: 'teacher',
  parent: 'parent',
  student: 'student',
  super_admin: 'super_admin',
  platform_admin: 'super_admin',
  admin: 'admin',
};

const guardMeta: Record<string, { labelKey: string; icon: React.ElementType }> = {
  users: { labelKey: 'role.admin', icon: Shield },
  teacher: { labelKey: 'role.teacher', icon: BookOpen },
};

export default function LoginPage() {
  const { tenantSlug: tenantSlugParam } = useParams<{ tenantSlug: string }>();
  const tenantSlug = normalizeTenantSlug(tenantSlugParam);

  const { login } = useAuth();
  const { t, locale, dir } = useLocale();
  const isAr = locale === 'ar';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const guardFromUrl = searchParams.get('guard');

  const initialDefaults = getTenantDefaultsForGuard('users', tenantSlug ?? undefined);
  const [selectedGuard, setSelectedGuard] = useState<string>('users');
  const [email, setEmail] = useState(initialDefaults.email);
  const [password, setPassword] = useState(initialDefaults.password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingMemberships, setPendingMemberships] = useState<TenantMembershipOption[] | null>(null);

  const { data: guards = ['users', 'teacher'] } = useQuery({
    queryKey: ['auth-guards'],
    queryFn: () => authApi.getGuards(),
  });

  const tenantGuards = useMemo(() => {
    const filtered = guards.filter(g => !isPlatformGuard(g) && g !== 'parent' && g !== 'student');
    return filtered.length > 0 ? filtered : ['users', 'teacher'];
  }, [guards]);

  useEffect(() => {
    if (!tenantSlug) return;
    apiClient.setTenantContext({ tenantSlug });
  }, [tenantSlug]);

  useEffect(() => {
    if (tenantGuards.length > 0 && !tenantGuards.includes(selectedGuard)) {
      setSelectedGuard(tenantGuards[0]);
    }
  }, [tenantGuards, selectedGuard]);

  useEffect(() => {
    if (!guardFromUrl || !tenantGuards.includes(guardFromUrl)) return;
    setSelectedGuard(guardFromUrl);
  }, [guardFromUrl, tenantGuards]);

  useEffect(() => {
    if (!tenantSlug) return;
    const d = getTenantDefaultsForGuard(selectedGuard, tenantSlug);
    setEmail(d.email);
    setPassword(d.password);
  }, [selectedGuard, tenantSlug]);

  if (!tenantSlug) {
    return <Navigate to={getTenantLoginPath()} replace />;
  }

  const completeLogin = async (membershipId?: number) => {
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password, selectedGuard, tenantSlug, membershipId);
      setPendingMemberships(null);
      const normalizedRole = guardToRoleMap[user.role] || user.role;
      navigate(getDashboardPath(normalizedRole));
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'TENANT_SELECTION_REQUIRED') {
        const extended = err as Error & { memberships?: TenantMembershipOption[] };
        setPendingMemberships(extended.memberships ?? []);
        return;
      }
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await completeLogin();
  };

  return (
    <div
      dir={dir}
      lang={locale}
      className={cn('relative min-h-screen overflow-hidden', isAr && 'font-arabic')}
      style={{ color: C.charcoal, backgroundColor: C.bg }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage: `url('${TENANT_LOGIN_BG}')`,
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
        }}
      />

      {/* Layout stays LTR so the form remains on the visual left; content keeps locale direction */}
      <div dir="ltr" className="relative flex min-h-screen items-center justify-start px-4 py-12 sm:px-8 lg:px-32 lg:py-16">
        <div dir={dir} className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md"
              style={{ background: `linear-gradient(135deg, ${C.crimsonBright}, ${C.crimsonDark})` }}
            >
              <GraduationCap className="h-5 w-5 text-white" aria-hidden />
            </div>
            <span className="font-display text-lg font-bold">{t('app.name')}</span>
          </div>

          <div className="mb-6 text-start">
            <div
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide"
              style={{
                borderColor: `${C.crimsonBright}33`,
                backgroundColor: `${C.crimsonBright}0d`,
                color: C.crimson,
              }}
            >
              <Building2 className="h-3.5 w-3.5" aria-hidden />
              {isAr ? `مركز: ${tenantSlug}` : `Center: ${tenantSlug}`}
            </div>
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{t('app.welcome')}</h1>
            <p className="mt-1 text-sm" style={{ color: C.textMuted }}>
              {t('app.signIn')}
            </p>
          </div>

          <div
            className="rounded-2xl border p-6 shadow-lg sm:p-7"
            style={{
              borderColor: `${C.crimsonBright}22`,
              backgroundColor: C.surface,
              boxShadow: `0 8px 32px ${C.charcoal}0d`,
            }}
          >
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium">{t('auth.signInAs')}</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {tenantGuards.map(guard => {
                  const meta = guardMeta[guard] || guardMeta.users;
                  const active = selectedGuard === guard;
                  return (
                    <button
                      key={guard}
                      type="button"
                      onClick={() => setSelectedGuard(guard)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-xl border p-2.5 text-xs font-medium transition-all',
                        !active && 'hover:bg-black/[0.02]',
                      )}
                      style={
                        active
                          ? {
                              borderColor: C.crimsonBright,
                              backgroundColor: `${C.crimsonBright}12`,
                              color: C.crimsonDark,
                              boxShadow: `0 0 0 2px ${C.crimsonBright}33`,
                            }
                          : {
                              borderColor: `${C.crimsonBright}22`,
                              color: C.textMuted,
                            }
                      }
                    >
                      <meta.icon className="h-4 w-4" style={{ color: active ? C.crimsonBright : C.textSoft }} />
                      <span className="truncate">{t(meta.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
                  {t('auth.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2"
                  style={{
                    borderColor: `${C.crimsonBright}28`,
                    backgroundColor: C.bg,
                    ['--tw-ring-color' as string]: `${C.crimsonBright}55`,
                  }}
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium">
                  {t('auth.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm transition focus:outline-none focus:ring-2"
                  style={{
                    borderColor: `${C.crimsonBright}28`,
                    backgroundColor: C.bg,
                    ['--tw-ring-color' as string]: `${C.crimsonBright}55`,
                  }}
                />
              </div>

              {pendingMemberships && pendingMemberships.length > 0 && (
                <div className="space-y-2 rounded-xl border p-3" style={{ borderColor: `${C.crimsonBright}33`, backgroundColor: C.bg }}>
                  <p className="text-sm font-medium">
                    {isAr ? 'اختر المركز التعليمي' : 'Select your education center'}
                  </p>
                  {pendingMemberships.map(m => (
                    <button
                      key={m.membership_id}
                      type="button"
                      disabled={loading}
                      onClick={() => completeLogin(m.membership_id)}
                      className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition hover:opacity-90 disabled:opacity-50"
                      style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: C.surface }}
                    >
                      <span className="font-medium">{m.tenant_name || m.tenant_slug || m.tenant_id}</span>
                      <Building2 className="h-4 w-4 opacity-60" />
                    </button>
                  ))}
                </div>
              )}

              {error && (
                <p className="text-sm font-medium" style={{ color: C.crimsonBright }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${C.crimsonBright}, ${C.crimsonDark})`,
                  boxShadow: `0 4px 16px ${C.crimsonBright}33`,
                }}
              >
                {loading ? t('auth.signingIn') : t('auth.signIn')}
              </button>
            </form>

            <p className="mt-4 text-start">
              <Link
                to="/"
                className="text-sm text-black font-medium underline-offset-4 hover:underline"
              >
                {isAr ? 'العودة للرئيسية' : 'Back to home'}
              </Link>
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                to={getStudentLoginPath()}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all hover:opacity-90"
                style={portalButtonStyle}
              >
                <GraduationCap className="h-4 w-4" aria-hidden />
                <span className="text-center leading-tight">
                  {isAr ? 'تسجيل الطالب' : 'Student login'}
                </span>
              </Link>
              <Link
                to={getParentLoginPath()}
                className="flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all hover:opacity-90"
                style={portalButtonStyle}
              >
                <UserCircle className="h-4 w-4" aria-hidden />
                <span className="text-center leading-tight">
                  {isAr ? 'تسجيل ولي الأمر' : 'Parent login'}
                </span>
              </Link>
            </div>
            <a
              href={buildCustomerServiceHref(isAr)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all hover:opacity-90"
              style={portalButtonStyle}
            >
              <Headphones className="h-4 w-4 shrink-0" aria-hidden />
              <span>{isAr ? 'خدمة العملاء' : 'Customer service'}</span>
            </a>
          </div>

          {/* <p className="mt-4 text-center text-xs" style={{ color: C.textSoft }}>
            {t('app.demoMode')}
          </p> */}
        </div>
      </div>
    </div>
  );
}

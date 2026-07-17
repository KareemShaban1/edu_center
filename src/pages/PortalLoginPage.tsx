import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/models';
import { getDashboardPath } from '@/lib/routes';
import { getTenantDefaultsForGuard } from '@/config/login-defaults';
import { brand } from '@/components/auth/login-theme';

const C = brand;
const TENANT_LOGIN_BG = '/images/tenant-login-egypt-bg.png';

interface PortalLoginPageProps {
  guard: 'parent' | 'student';
  role: UserRole;
  loginPath: string;
  titleKey: string;
  descKey: string;
  icon: React.ElementType;
}

export default function PortalLoginPage({
  guard,
  role,
  titleKey,
  descKey,
}: PortalLoginPageProps) {
  const defaults = getTenantDefaultsForGuard(guard);
  const { loginPortal } = useAuth();
  const { t, locale, dir } = useLocale();
  const isAr = locale === 'ar';
  const navigate = useNavigate();

  const [email, setEmail] = useState(defaults.email);
  const [password, setPassword] = useState(defaults.password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginPortal(email, password, guard);
      navigate(getDashboardPath(role));
    } catch {
      setError(t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={dir}
      lang={locale}
      className={cn('relative min-h-[100dvh] w-full overflow-hidden', isAr && 'font-arabic')}
      style={{
        color: C.charcoal,
        backgroundColor: C.bg,
        backgroundImage: `url('${TENANT_LOGIN_BG}')`,
        backgroundPosition: 'top right',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% 100%',
      }}
    >
      <div
        className="relative flex min-h-[100dvh] w-full items-center justify-start px-4 py-12 sm:px-8 lg:px-32 lg:py-16"
        dir="ltr"
      >
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
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{t(titleKey)}</h1>
            <p className="mt-2 text-sm" style={{ color: C.textMuted }}>
              {t(descKey)}
            </p>
          </div>

          <div
            className="rounded-2xl border p-6 shadow-lg"
            style={{ borderColor: `${C.crimsonBright}22`, backgroundColor: C.surface }}
          >
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
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: C.bg }}
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
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: C.bg }}
                />
              </div>

              {error && (
                <p className="text-sm font-medium" style={{ color: C.crimsonBright }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${C.crimsonBright}, ${C.crimsonDark})` }}
              >
                {loading ? t('auth.signingIn') : t('auth.signIn')}
              </button>
            </form>

            <div className="mt-4 flex flex-col gap-2 text-start text-sm">
              <Link to={guard === 'parent' ? '/parent/register' : '/student/register'} style={{ color: C.crimson }}>
                {t('auth.createAccountLink')}
              </Link>
              {guard === 'parent' && (
                <Link to="/student/login" style={{ color: C.crimson }}>
                  {isAr ? 'تسجيل دخول الطالب' : 'Student login'}
                </Link>
              )}
              {guard === 'student' && (
                <Link to="/parent/login" style={{ color: C.crimson }}>
                  {isAr ? 'تسجيل دخول ولي الأمر' : 'Parent login'}
                </Link>
              )}
              <Link to="/" style={{ color: C.textMuted }}>
                {isAr ? 'العودة للرئيسية' : 'Back to home'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

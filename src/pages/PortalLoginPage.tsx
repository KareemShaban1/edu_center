import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Languages } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/models';
import { getDashboardPath } from '@/lib/routes';
import { getTenantDefaultsForGuard } from '@/config/login-defaults';
import { brand } from '@/components/auth/login-theme';
import { LoginDashboardPreview } from '@/components/auth/LoginDashboardPreview';
import { EgyptEducationScene } from '@/components/illustrations/EgyptEducationArt';

const C = brand;

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
  icon: Icon,
}: PortalLoginPageProps) {
  const defaults = getTenantDefaultsForGuard(guard);
  const { loginPortal } = useAuth();
  const { t, locale, setLocale, dir } = useLocale();
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
      className={cn('min-h-screen', isAr && 'font-arabic')}
      style={{
        color: C.charcoal,
        background: `linear-gradient(160deg, ${C.bg} 0%, ${C.surface} 50%, ${C.bgAlt} 100%)`,
      }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -top-24 start-0 h-96 w-96 rounded-full blur-3xl"
          style={{ background: `${C.crimsonBright}14` }}
        />
        <div
          className="absolute bottom-0 end-0 h-80 w-80 rounded-full blur-3xl"
          style={{ background: `${C.crimson}10` }}
        />
      </div>

      <button
        type="button"
        onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
        className="fixed top-4 z-50 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium shadow-sm transition-colors ltr:right-4 rtl:left-4"
        style={{ borderColor: `${C.crimsonBright}33`, backgroundColor: C.surface, color: C.charcoal }}
        aria-label={t('misc.language')}
      >
        <Languages className="h-4 w-4 opacity-60" />
        {locale === 'en' ? 'العربية' : 'English'}
      </button>

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-12">
        <div className="hidden lg:block">
          <div className="mb-8 flex items-center gap-2.5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md"
              style={{ background: `linear-gradient(135deg, ${C.crimsonBright}, ${C.crimsonDark})` }}
            >
              <GraduationCap className="h-5 w-5 text-white" aria-hidden />
            </div>
            <span className="font-display text-lg font-bold">{t('app.name')}</span>
          </div>
          <EgyptEducationScene variant={guard} className="mb-8" />
          <LoginDashboardPreview guard={guard} isAr={isAr} />
        </div>

        <div className="w-full max-w-md justify-self-center lg:max-w-none lg:justify-self-end">
          <div className="mb-6 text-center lg:text-start">
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-md lg:mx-0"
              style={{ background: `linear-gradient(135deg, ${C.crimsonBright}, ${C.crimsonDark})` }}
            >
              <Icon className="h-7 w-7 text-white" />
            </div>
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

            <div className="mt-4 flex flex-col gap-2 text-center text-sm lg:text-start">
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

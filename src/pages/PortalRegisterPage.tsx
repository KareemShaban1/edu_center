import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/models';
import { getDashboardPath } from '@/lib/routes';
import { brand } from '@/components/auth/login-theme';
import { authApi } from '@/services/endpoints/auth';
import { apiClient } from '@/services/api-client';
import type { ApiError } from '@/types/models';

const C = brand;

interface PublicCenter {
  id: number;
  slug: string;
  name: string;
}

interface PortalRegisterPageProps {
  guard: 'parent' | 'student';
  role: UserRole;
  loginPath: string;
  registerPath: string;
  titleKey: string;
  descKey: string;
  icon: React.ElementType;
}

export default function PortalRegisterPage({
  guard,
  role,
  loginPath,
  titleKey,
  descKey,
  icon: Icon,
}: PortalRegisterPageProps) {
  const { loginPortal } = useAuth();
  const { t, locale, dir } = useLocale();
  const isAr = locale === 'ar';
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [centerSlug, setCenterSlug] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: centers = [] } = useQuery({
    queryKey: ['public-centers'],
    queryFn: async () => apiClient.get<PublicCenter[]>('/public/centers', undefined, false),
    staleTime: 60_000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload = {
      name,
      email,
      phone,
      password,
      password_confirmation: passwordConfirmation,
      center_slug: centerSlug || undefined,
    };

    try {
      const result = guard === 'parent'
        ? await authApi.registerParent(payload)
        : await authApi.registerStudent({ ...payload, gender });

      setSuccess(result.message);

      if (result.user.center_slug) {
        try {
          await loginPortal(email, password, guard);
          navigate(getDashboardPath(role));
          return;
        } catch {
          // Account created but login deferred
        }
      }

      setTimeout(() => navigate(loginPath), 1800);
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const fieldErrors = apiErr.errors;
      if (fieldErrors?.phone?.[0]) {
        setError(fieldErrors.phone[0]);
      } else if (fieldErrors?.email?.[0]) {
        setError(fieldErrors.email[0]);
      } else {
        setError(apiErr.message || t('auth.registerFailed'));
      }
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
          <img src="/images/student_login.png" alt="" className="mb-8" />
        </div>

        <div className="w-full max-w-md justify-self-center lg:max-w-none lg:justify-self-end">
          <div className="mb-6 text-center lg:text-start">
            {/* <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-md lg:mx-0"
              style={{ background: `linear-gradient(135deg, ${C.crimsonBright}, ${C.crimsonDark})` }}
            >
              <Icon className="h-7 w-7 text-white" />
            </div> */}
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
                <label htmlFor="name" className="mb-1.5 block text-[18px] font-medium">
                  {t('auth.fullName')}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: C.bg }}
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-1.5 block text-[18px] font-medium">
                  {t('auth.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: C.bg }}
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-1.5 block text-[18px] font-medium">
                  {t('auth.phone')}
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: C.bg }}
                />
              </div>

              {guard === 'student' && (
                <div>
                  <label htmlFor="gender" className="mb-1.5 block text-[18px] font-medium">
                    {t('auth.gender')}
                  </label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={e => setGender(e.target.value as 'male' | 'female')}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                    style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: C.bg }}
                  >
                    <option value="male">{t('auth.genderMale')}</option>
                    <option value="female">{t('auth.genderFemale')}</option>
                  </select>
                </div>
              )}

              {centers.length > 0 && (
                <div>
                  <label htmlFor="center" className="mb-1.5 block text-[18px] font-medium">
                    {t('auth.centerOptional')}
                  </label>
                  <select
                    id="center"
                    value={centerSlug}
                    onChange={e => setCenterSlug(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                    style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: C.bg }}
                  >
                    <option value="">{t('auth.centerSelectPlaceholder')}</option>
                    {centers.map(center => (
                      <option key={center.id} value={center.slug}>
                        {center.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="password" className="mb-1.5 block text-[18px] font-medium">
                  {t('auth.password')}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: C.bg }}
                />
              </div>

              <div>
                <label htmlFor="password_confirmation" className="mb-1.5 block text-[18px] font-medium">
                  {t('auth.confirmPassword')}
                </label>
                <input
                  id="password_confirmation"
                  type="password"
                  value={passwordConfirmation}
                  onChange={e => setPasswordConfirmation(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: C.bg }}
                />
              </div>

              {error && (
                <p className="text-[16px] font-medium" style={{ color: C.crimsonBright }}>
                  {error}
                </p>
              )}

              {success && (
                <p className="text-[16px] font-medium" style={{ color: '#15803d' }}>
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-[16px] font-semibold text-white disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${C.crimsonBright}, ${C.crimsonDark})` }}
              >
                {loading ? t('auth.registering') : t('auth.createAccount')}
              </button>
            </form>

            <div className="mt-4 flex flex-col gap-2 text-center text-[16px] lg:text-start">
              <Link to={loginPath} style={{ color: C.crimson }}>
                {t('auth.alreadyHaveAccount')}
              </Link>
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

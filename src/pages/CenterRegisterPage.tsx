import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import { getDashboardPath } from '@/lib/routes';
import { getTenantLoginPath } from '@/lib/tenant-routes';
import { brand } from '@/components/auth/login-theme';
import { authApi } from '@/services/endpoints/auth';
import type { ApiError } from '@/types/models';

const C = brand;
const TENANT_LOGIN_BG = '/images/tenant-login-egypt-bg.png';

function slugPreview(name: string, slug: string): string {
  const raw = (slug || name).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  return raw || 'center';
}

export default function CenterRegisterPage() {
  const { login } = useAuth();
  const { t, locale, dir } = useLocale();
  const isAr = locale === 'ar';
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [slug, setSlug] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const preview = useMemo(() => slugPreview(name, slug), [name, slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== passwordConfirmation) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.registerCenter({
        name: name.trim(),
        admin_name: adminName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        slug: slug.trim() || undefined,
        password,
        password_confirmation: passwordConfirmation,
      });

      setSuccess(result.message);
      const centerSlug = result.center.slug;
      try {
        await login(email.trim(), password, 'users', centerSlug);
        navigate(getDashboardPath('admin'));
        return;
      } catch {
        navigate(getTenantLoginPath(centerSlug));
      }
    } catch (err: unknown) {
      const apiErr = err as ApiError;
      const fieldErrors = apiErr.errors;
      const firstFieldError = fieldErrors
        ? Object.values(fieldErrors).flat()[0]
        : undefined;
      setError(firstFieldError || apiErr.message || t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  const selectStyle = {
    borderColor: `${C.crimsonBright}28`,
    backgroundColor: C.bg,
  } as const;

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

      <div dir="ltr" className="relative flex min-h-screen items-center justify-start px-4 py-12 sm:px-8 lg:px-32 lg:py-16">
        <div dir={dir} className="w-full max-w-xl">
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
            <h1 className="font-display text-2xl font-bold sm:text-3xl">{t('auth.centerRegisterTitle')}</h1>
            <p className="mt-2 text-sm" style={{ color: C.textMuted }}>
              {t('auth.centerRegisterDesc')}
            </p>
          </div>

          <div
            className="rounded-2xl border p-6 shadow-lg"
            style={{ borderColor: `${C.crimsonBright}22`, backgroundColor: C.surface }}
          >
            <form onSubmit={handleSubmit}>

		<div className="grid grid-cols-2 gap-2 gap-y-4 mb-4">
              <div>
                <label htmlFor="center-name" className="mb-1.5 block text-[18px] font-medium">
                  {t('auth.centerName')}
                </label>
                <input
                  id="center-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  maxLength={255}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  style={selectStyle}
                />
              </div>

              <div>
                <label htmlFor="admin-name" className="mb-1.5 block text-[18px] font-medium">
                  {t('auth.adminName')}
                </label>
                <input
                  id="admin-name"
                  type="text"
                  value={adminName}
                  onChange={e => setAdminName(e.target.value)}
                  required
                  maxLength={255}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  style={selectStyle}
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
                  style={selectStyle}
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
                  style={selectStyle}
                />
              </div>

              <div className="col-span-2">
                <label htmlFor="slug" className="mb-1.5 block text-[18px] font-medium">
                  {t('auth.centerSlug')}
                </label>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  placeholder={preview}
                  autoComplete="off"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  style={selectStyle}
                />
                <p className="mt-1 text-xs" style={{ color: C.textMuted }}>
                  {t('auth.centerSlugHint')}
                </p>
              </div>

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
                  style={selectStyle}
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
                  style={selectStyle}
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

		</div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-[16px] font-semibold text-white disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${C.crimsonBright}, ${C.crimsonDark})` }}
              >
                {loading ? t('auth.registering') : t('auth.registerCenter')}
              </button>
            </form>

            <div className="mt-4 flex flex-col gap-2 text-start text-[16px]">
              <Link to={getTenantLoginPath()} style={{ color: C.crimson }}>
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

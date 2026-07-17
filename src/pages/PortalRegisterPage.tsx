import React, { useEffect, useMemo, useState } from 'react';
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
const TENANT_LOGIN_BG = '/images/tenant-login-egypt-bg.png';

interface PublicCenter {
  id: number;
  slug: string;
  name: string;
}

interface AcademicOption {
  id: number;
  name: string;
  grade_id?: number;
  class_id?: number;
}

interface CenterAcademicPayload {
  grades: AcademicOption[];
  classes: AcademicOption[];
  sections: AcademicOption[];
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
  const [centerSearch, setCenterSearch] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: centers = [] } = useQuery({
    queryKey: ['public-centers'],
    queryFn: async () => apiClient.get<PublicCenter[]>('/public/centers', undefined, false),
    staleTime: 60_000,
  });

  const { data: academic, isLoading: academicLoading } = useQuery({
    queryKey: ['public-center-academic', centerSlug],
    queryFn: async () => apiClient.get<CenterAcademicPayload>(
      `/public/centers/${encodeURIComponent(centerSlug)}/academic`,
      undefined,
      false,
    ),
    enabled: guard === 'student' && !!centerSlug,
    staleTime: 60_000,
  });

  const grades = academic?.grades || [];
  const classes = useMemo(
    () => (academic?.classes || []).filter(c => !gradeId || c.grade_id === Number(gradeId)),
    [academic?.classes, gradeId],
  );
  const sections = useMemo(
    () => (academic?.sections || []).filter(s => !classId || s.class_id === Number(classId)),
    [academic?.sections, classId],
  );

  useEffect(() => {
    setGradeId('');
    setClassId('');
    setSectionId('');
  }, [centerSlug]);

  useEffect(() => {
    setClassId('');
    setSectionId('');
  }, [gradeId]);

  useEffect(() => {
    setSectionId('');
  }, [classId]);

  const filteredCenters = useMemo(() => {
    const query = centerSearch.trim().toLowerCase();
    if (!query) return [];
    return centers.filter(center => center.name.toLowerCase().includes(query));
  }, [centers, centerSearch]);

  const showCenterResults = centerSearch.trim().length > 0 && !centerSlug;

  const handleCenterSearchChange = (value: string) => {
    setCenterSearch(value);
    if (centerSlug) {
      const selected = centers.find(center => center.slug === centerSlug);
      if (selected?.name !== value) {
        setCenterSlug('');
      }
    }
  };

  const handleSelectCenter = (center: PublicCenter) => {
    setCenterSlug(center.slug);
    setCenterSearch(center.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (guard === 'student') {
      if (!centerSlug) {
        setError(t('auth.centerRequired'));
        return;
      }
      if (!gradeId || !classId || !sectionId) {
        setError(t('auth.academicRequired'));
        return;
      }
    }

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
        : await authApi.registerStudent({
            ...payload,
            gender,
            center_slug: centerSlug,
            grade_id: Number(gradeId),
            class_id: Number(classId),
            section_id: Number(sectionId),
          });

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
      } else if (fieldErrors?.section_id?.[0]) {
        setError(fieldErrors.section_id[0]);
      } else if (fieldErrors?.center_slug?.[0]) {
        setError(fieldErrors.center_slug[0]);
      } else {
        setError(apiErr.message || t('auth.registerFailed'));
      }
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
                    style={selectStyle}
                  >
                    <option value="male">{t('auth.genderMale')}</option>
                    <option value="female">{t('auth.genderFemale')}</option>
                  </select>
                </div>
              )}

              {centers.length > 0 && (
                <div className="relative">
                  <label htmlFor="center-search" className="mb-1.5 block text-[18px] font-medium">
                    {guard === 'student' ? t('auth.centerRequiredLabel') : t('auth.centerOptional')}
                  </label>
                  <input
                    id="center-search"
                    type="search"
                    value={centerSearch}
                    onChange={e => handleCenterSearchChange(e.target.value)}
                    placeholder={t('auth.centerSearchPlaceholder')}
                    autoComplete="off"
                    required={guard === 'student'}
                    className="w-full rounded-lg border px-3 py-2.5 text-sm"
                    style={selectStyle}
                  />
                  {showCenterResults && (
                    <ul
                      className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border py-1 shadow-lg"
                      style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: C.surface }}
                    >
                      {filteredCenters.length === 0 ? (
                        <li className="px-3 py-2 text-sm" style={{ color: C.textMuted }}>
                          {t('auth.centerNoResults')}
                        </li>
                      ) : (
                        filteredCenters.map(center => (
                          <li key={center.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectCenter(center)}
                              className="w-full px-3 py-2 text-start text-sm transition-colors hover:bg-black/5"
                            >
                              {center.name}
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  )}
                </div>
              )}

              {guard === 'student' && centerSlug && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="grade" className="mb-1.5 block text-[18px] font-medium">
                      {t('col.grade')}
                    </label>
                    <select
                      id="grade"
                      value={gradeId}
                      onChange={e => setGradeId(e.target.value)}
                      required
                      disabled={academicLoading || grades.length === 0}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm"
                      style={selectStyle}
                    >
                      <option value="">{academicLoading ? t('common.loading') : t('auth.selectGrade')}</option>
                      {grades.map(grade => (
                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="class" className="mb-1.5 block text-[18px] font-medium">
                      {t('col.class')}
                    </label>
                    <select
                      id="class"
                      value={classId}
                      onChange={e => setClassId(e.target.value)}
                      required
                      disabled={!gradeId || classes.length === 0}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm"
                      style={selectStyle}
                    >
                      <option value="">{gradeId ? t('auth.selectClass') : t('auth.selectGradeFirst')}</option>
                      {classes.map(classroom => (
                        <option key={classroom.id} value={classroom.id}>{classroom.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="section" className="mb-1.5 block text-[18px] font-medium">
                      {t('col.section')}
                    </label>
                    <select
                      id="section"
                      value={sectionId}
                      onChange={e => setSectionId(e.target.value)}
                      required
                      disabled={!classId || sections.length === 0}
                      className="w-full rounded-lg border px-3 py-2.5 text-sm"
                      style={selectStyle}
                    >
                      <option value="">{classId ? t('auth.selectSection') : t('auth.selectClassFirst')}</option>
                      {sections.map(section => (
                        <option key={section.id} value={section.id}>{section.name}</option>
                      ))}
                    </select>
                  </div>
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

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl py-2.5 text-[16px] font-semibold text-white disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${C.crimsonBright}, ${C.crimsonDark})` }}
              >
                {loading ? t('auth.registering') : t('auth.createAccount')}
              </button>
            </form>

            <div className="mt-4 flex flex-col gap-2 text-start text-[16px]">
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

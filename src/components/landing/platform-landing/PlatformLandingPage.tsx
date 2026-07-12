import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowLeft, Check, Languages } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import { getTenantLoginPath, getRoleLoginPath } from '@/lib/tenant-routes';
import { dashboardPreviews } from '@/components/landing/LandingDashboardPreviews';
import { navLinks, heroBadges, features, roles, whyUs, footerTrust } from './constants';
import { PlatformLandingHeroIllustration } from './PlatformLandingHeroIllustration';
import PlatformLandingStats from './PlatformLandingStats';
import PlatformLandingWhatsAppFloat from './PlatformLandingWhatsAppFloat';
import { FeatureIconCircle } from './EgyptLandmarkIllustration';
import { usePlatformLandingFonts } from './usePlatformLandingFonts';
import { useLandingBrand } from './useLandingBrand';
import {
  heroTextReveal,
  heroTextRevealRtl,
  heroIllustration,
  heroFloat,
  sectionHeading,
  staggerContainer,
  featureCard,
  roleCard,
  rolePreview,
  whyUsItem,
  whyUsIllustration,
  whyUsIllustrationRtl,
  rocketFloat,
  ctaSection,
  ctaItem,
  headerSlide,
  badgePop,
  getCtaButtonPulse,
} from './animations';

export function PlatformLandingPage() {
  const navigate = useNavigate();
  const { locale, setLocale, dir, t } = useLocale();
  const { fonts } = usePlatformLandingFonts();
  const brand = useLandingBrand();
  const ctaButtonPulse = useMemo(() => getCtaButtonPulse(brand.red), [brand.red]);
  const isAr = locale === 'ar';
  const [scrolled, setScrolled] = useState(false);

  const textReveal = dir === 'rtl' ? heroTextRevealRtl : heroTextReveal;
  const illustrationSlide = dir === 'rtl' ? whyUsIllustrationRtl : whyUsIllustration;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const brandName = isAr ? 'منصتي التعليمية' : t('app.name');

  return (
    <div
      dir={dir}
      lang={locale}
      className={cn('min-h-screen overflow-x-hidden bg-white', isAr && 'font-arabic')}
      style={{ color: brand.text, fontSize: fonts.body }}
    >
      {/* ── Header ── */}
      <motion.header
        initial="hidden"
        animate="visible"
        variants={headerSlide}
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b transition-all duration-300',
          scrolled ? 'border-gray-200 bg-white/95 shadow-sm backdrop-blur-md' : 'border-transparent bg-white',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <motion.a
            href="#home"
            className="flex shrink-0 items-center gap-2.5"
            whileHover={{ scale: 1.03 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md"
              style={{ backgroundColor: brand.red }}
            >
              <GraduationCap className="h-5 w-5" aria-hidden />
            </div>
            <span className="font-bold tracking-tight" style={{ fontSize: fonts.brand }}>
              {brandName}
            </span>
          </motion.a>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link, i) => {
              const isInternal = link.href.startsWith('/');
              const label = isAr ? link.labelAr : link.labelEn;
              const className = cn(
                'rounded-lg px-3.5 py-2 font-medium text-[20px] transition-colors',
                'active' in link && link.active ? 'font-semibold' : 'text-gray-600 hover:text-gray-900',
              );
              const style = { fontSize: fonts.nav, ...('active' in link && link.active ? { color: brand.red } : {}) };

              if (isInternal) {
                return (
                  <motion.span
                    key={link.id}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                    whileHover={{ y: -2 }}
                  >
                    <Link to={link.href} className={className} style={style}>
                      {label}
                    </Link>
                  </motion.span>
                );
              }

              return (
                <motion.a
                  key={link.id}
                  href={link.href}
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.4 }}
                  whileHover={{ y: -2 }}
                  className={className}
                  style={style}
                >
                  {label}
                </motion.a>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            {/* <button
              type="button"
              onClick={() => setLocale(isAr ? 'en' : 'ar')}
              className="hidden rounded-lg border border-gray-200 p-2 text-gray-600 transition hover:bg-gray-50 sm:flex"
              aria-label={isAr ? 'Switch to English' : 'التبديل للعربية'}
            >
              <Languages className="h-4 w-4" />
            </button> */}
            <motion.button
              type="button"
              onClick={() => navigate(getTenantLoginPath())}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-full px-4 py-2 font-semibold text-white shadow-md transition sm:px-5"
              style={{ backgroundColor: brand.red, fontSize: fonts.button }}
            >
              {isAr ? 'جرب الأن' : 'Try now'}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* ── Hero ── */}
      <section id="home" className="relative scroll-mt-16 overflow-hidden bg-white pt-32 pb-16 sm:pt-40 sm:pb-20">
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-32 end-0 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: `radial-gradient(circle, ${brand.red}33, transparent 70%)` }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute bottom-0 start-0 h-72 w-72 rounded-full opacity-20 blur-3xl"
          style={{ background: `radial-gradient(circle, ${brand.red}22, transparent 70%)` }}
          animate={{ scale: [1, 1.2, 1], x: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <motion.div initial="hidden" animate="visible" className="min-w-0">
            <motion.h1
              custom={0}
              variants={textReveal}
              className="text-balance font-extrabold leading-tight lg:leading-[1.2]"
              style={{ color: brand.red, fontSize: fonts.heroTitle }}
            >
              {isAr
                ? 'منصة تعليمية متكاملة للمراكز التعليمية في مصر'
                : 'An integrated educational platform for centers in Egypt'}
            </motion.h1>

            <motion.p
              custom={1}
              variants={textReveal}
              className="mt-5 max-w-xl text-pretty leading-relaxed"
              style={{ color: brand.textMuted, fontSize: fonts.heroSubtitle }}
            >
              {isAr
                ? 'منصة سهلة الاستخدام لإدارة المراكز التعليمية بذكاء، تربط الإدارة والمعلمين والطلاب وأولياء الأمور في مكان واحد.'
                : 'An easy-to-use platform to smartly manage your center — connecting admins, teachers, students, and parents in one place.'}
            </motion.p>

            <motion.ul initial="hidden" animate="visible" className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
              {heroBadges.map((badge, i) => (
                <motion.li
                  key={badge.icon}
                  custom={i}
                  variants={badgePop}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="flex items-center gap-2 font-medium text-gray-700"
                  style={{ fontSize: fonts.heroBadge }}
                >
                  <FeatureIconCircle icon={badge.icon} className="!h-9 !w-9 [&_svg]:!h-4 [&_svg]:!w-4" />
                  {isAr ? badge.labelAr : badge.labelEn}
                </motion.li>
              ))}
            </motion.ul>

            <motion.div custom={3} variants={textReveal} initial="hidden" animate="visible" className="mt-10">
              <motion.button
                type="button"
                onClick={() => navigate(getTenantLoginPath())}
                animate={ctaButtonPulse}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.96 }}
                className="group inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-bold text-white shadow-lg"
                style={{ backgroundColor: brand.red, fontSize: fonts.heroCta }}
              >
                {isAr ? 'ابدأ منصتك الآن' : 'Start your platform now'}
                <ArrowLeft
                  className={cn(
                    'h-4 w-4 transition-transform',
                    dir === 'rtl' ? 'group-hover:translate-x-[-4px]' : 'rotate-180 group-hover:translate-x-1',
                  )}
                  aria-hidden
                />
              </motion.button>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-4"
                style={{ color: brand.textMuted, fontSize: fonts.heroCtaSub }}
              >
                {isAr ? 'انضم إلى مئات المراكز التعليمية في مصر' : 'Join hundreds of educational centers in Egypt'}
              </motion.p>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={heroIllustration} className="relative">
            <motion.div animate={heroFloat}>
              <PlatformLandingHeroIllustration />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <PlatformLandingStats />

      {/* ── Features ── */}
      <section id="features" className="scroll-mt-16 bg-[#FAFAFA] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={sectionHeading}
            className="mx-auto mb-12 max-w-2xl text-center"
          >
            <h2 className="font-bold" style={{ fontSize: fonts.sectionTitle }}>
              {isAr ? 'كل ما تحتاجه لإدارة مركزك التعليمي بكفاءة' : 'Everything you need to run your center efficiently'}
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5"
          >
            {features.map((f, i) => (
              <motion.article
                key={f.titleAr}
                custom={i}
                variants={featureCard}
                whileHover={{ y: -8, scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
              >
                <motion.div  whileHover={{ rotate: [0, -8, 8, 0], scale: 1.1 }} transition={{ duration: 0.5 }}>
                  <FeatureIconCircle icon={f.icon} className="mb-4" />
                </motion.div>
                <h3 className="mb-2 font-bold" style={{ fontSize: fonts.cardTitle }}>
                  {isAr ? f.titleAr : f.titleEn}
                </h3>
                <p className="leading-[20px] text-center" style={{ color: brand.textMuted, fontSize: fonts.cardBody }}>
                  {isAr ? f.descAr : f.descEn}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── User roles ── */}
      <section id="pricing" className="scroll-mt-16 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={sectionHeading}
            className="mb-12 text-center font-bold"
            style={{ fontSize: fonts.sectionTitle }}
          >
            {isAr ? 'حسابات مخصصة لكل مستخدم' : 'Dedicated accounts for every user'}
          </motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4"
          >
            {roles.map((role, i) => {
              const Preview = dashboardPreviews[role.key];
              const previewImage = 'previewImage' in role ? role.previewImage : undefined;
              return (
                <motion.div
                  key={role.key}
                  custom={i}
                  variants={roleCard}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                >
                  <h3 className="mb-4 text-center font-bold" style={{ fontSize: fonts.roleTitle }}>
                    {isAr ? role.titleAr : role.titleEn}
                  </h3>
                  <motion.div
                    variants={rolePreview}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    className="mb-4 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 p-2"
                  >
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt={isAr ? role.titleAr : role.titleEn}
                        className="h-auto w-full rounded-lg object-cover object-top"
                        loading="lazy"
                      />
                    ) : (
                      <Preview idPrefix={`landing-${role.key}`} />
                    )}
                  </motion.div>
                  <ul className="mt-auto space-y-2.5">
                    {(isAr ? role.itemsAr : role.itemsEn).map((item, j) => (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, x: dir === 'rtl' ? 16 : -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + j * 0.08 }}
                        className="flex items-start gap-2 text-gray-700"
                        style={{ fontSize: fonts.roleItem }}
                      >
                        <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: brand.red }} aria-hidden />
                        {item}
                      </motion.li>
                    ))}
                  </ul>

			    <motion.button
				    type="button"
				    onClick={() => navigate(getRoleLoginPath(role.key))}
				    whileHover={{ scale: 1.03 }}
				    whileTap={{ scale: 0.97 }}
				    className="mt-4 w-full rounded-full px-4 py-2.5 font-semibold text-white shadow-md transition"
				    style={{ backgroundColor: brand.red, fontSize: fonts.button }}
			    >
				    {isAr ? `تسجيل دخول ${role.titleAr}` : `Login — ${role.titleEn}`}
			    </motion.button>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Why us ── */}
      <section id="about" className="scroll-mt-16 bg-[#FAFAFA] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={sectionHeading}
            className="mb-12 text-center font-bold"
            style={{ fontSize: fonts.sectionTitle }}
          >
            {isAr ? 'لماذا تختار منصتنا؟' : 'Why choose our platform?'}
          </motion.h2>

          <div className="flex flex-col items-center gap-10 lg:flex-row lg:justify-between">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid w-full flex-1 grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-3"
            >
              {whyUs.map((item, i) => (
                <motion.div
                  key={item.titleAr}
                  custom={i}
                  variants={whyUsItem}
                  whileHover={{ y: -6, scale: 1.05 }}
                  className="flex flex-col items-center text-center"
                >
                  <motion.div
                    animate={item.icon === 'rocket' ? rocketFloat : undefined}
                    whileHover={{ scale: 1.15, rotate: 5 }}
                  >
                    <FeatureIconCircle icon={item.icon} className="mb-3" />
                  </motion.div>
                  <h3 className="mb-1 font-bold" style={{ fontSize: fonts.whyUsTitle }}>
                    {isAr ? item.titleAr : item.titleEn}
                  </h3>
                  <p className="leading-relaxed" style={{ color: brand.textMuted, fontSize: fonts.whyUsBody }}>
                    {isAr ? item.descAr : item.descEn}
                  </p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={illustrationSlide}
              className="hidden shrink-0 lg:block"
            >
              <motion.div animate={heroFloat}>
                <img src="/images/image_1.png" alt="Egypt Landmark" width={500} height={500} />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section id="contact" className="scroll-mt-16 py-0">
        <div className="px-0">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={ctaSection}
            className="relative overflow-hidden px-6 py-16 text-center sm:px-12 sm:py-20"
            style={{ backgroundColor: brand.red }}
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {[1, 2, 3].map(ring => (
                <motion.div
                  key={ring}
                  className="absolute rounded-full border border-white/10"
                  style={{ width: `${ring * 200}px`, height: `${ring * 200}px` }}
                  animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.05, 0.15] }}
                  transition={{ duration: 4 + ring, repeat: Infinity, ease: 'easeInOut', delay: ring * 0.5 }}
                />
              ))}
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative mx-auto max-w-3xl"
            >
              <motion.h2
                custom={0}
                variants={ctaItem}
                className="font-bold text-white"
                style={{ fontSize: fonts.ctaTitle }}
              >
                {isAr ? 'ابدأ منصتك التعليمية الآن' : 'Start your educational platform now'}
              </motion.h2>
              <motion.p
                custom={1}
                variants={ctaItem}
                className="mx-auto mt-4 max-w-xl text-pretty text-white/90"
                style={{ fontSize: fonts.ctaBody }}
              >
                {isAr
                  ? 'انضم إلى مئات المراكز التعليمية وارتقِ بتجربة التعليم في مركزك.'
                  : 'Join hundreds of centers and elevate the learning experience at your institution.'}
              </motion.p>
              <motion.div custom={2} variants={ctaItem}>
                <motion.button
                  type="button"
                  onClick={() => navigate(getTenantLoginPath())}
                  whileHover={{ scale: 1.08, boxShadow: '0 12px 32px rgba(0,0,0,0.2)' }}
                  whileTap={{ scale: 0.95 }}
                  className="group mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 font-bold shadow-lg"
                  style={{ color: brand.red, fontSize: fonts.button }}
                >
                  {isAr ? 'جرب الأن' : 'Try now'}
                  <ArrowLeft
                    className={cn(
                      'h-4 w-4 transition-transform',
                      dir === 'rtl' ? 'group-hover:translate-x-[-4px]' : 'rotate-180 group-hover:translate-x-1',
                    )}
                    aria-hidden
                  />
                </motion.button>
              </motion.div>
              <motion.p
                custom={3}
                variants={ctaItem}
                className="mt-6 text-white/80"
                style={{ fontSize: fonts.ctaTrial }}
              >
                {isAr ? 'تجربة مجانية 14 يوم' : '14-day free trial'}
              </motion.p>
              <motion.ul
                custom={4}
                variants={ctaItem}
                className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/75"
              >
                {footerTrust.map((item, i) => (
                  <motion.li
                    key={item.labelAr}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    whileHover={{ scale: 1.08 }}
                    className="flex items-center gap-1.5"
                    style={{ fontSize: fonts.trustItem }}
                  >
                    <FeatureIconCircle
                      icon={item.icon}
                      className="!h-6 !w-6 bg-white/15 !text-white [&_svg]:!h-3 [&_svg]:!w-3"
                    />
                    {isAr ? item.labelAr : item.labelEn}
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Simple footer ── */}
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-t border-gray-100 bg-white py-8"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
              style={{ backgroundColor: brand.red }}
            >
              <GraduationCap className="h-4 w-4" aria-hidden />
            </div>
            <span className="font-semibold" style={{ fontSize: fonts.footerBrand }}>
              {brandName}
            </span>
          </div>
          <p className="text-gray-500" style={{ fontSize: fonts.footerCopy }}>
            © {new Date().getFullYear()} {brandName}. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            {' · '}
            <Link to="/guide" className="text-gray-600 underline-offset-4 hover:text-gray-900 hover:underline">
              {isAr ? 'دليل المستخدم' : 'User Guide'}
            </Link>
          </p>
        </div>
      </motion.footer>

      <PlatformLandingWhatsAppFloat />
    </div>
  );
}

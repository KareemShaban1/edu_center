import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/contexts/LocaleContext';
import { motion, AnimatePresence, useInView, useMotionValue, useSpring } from 'framer-motion';
import type { Easing } from 'framer-motion';
import {
  GraduationCap,
  Shield,
  BookOpen,
  Users,
  BarChart3,
  ClipboardCheck,
  CreditCard,
  Bell,
  ArrowRight,
  Languages,
  Sparkles,
  BookMarked,
  Building2,
  Activity,
  Headphones,
  CheckCircle2,
  LogIn,
  ShieldCheck,
  Video,
  LayoutDashboard,
  MapPin,
  Zap,
  Clock,
  Star,
} from 'lucide-react';
import {
  LandingDotPattern,
  LandingGeometricPattern,
  LandingHeroIllustration,
} from '@/components/landing/LandingHeroIllustration';
import {
  dashboardPreviews,
  type DashboardRoleKey,
} from '@/components/landing/LandingDashboardPreviews';
import {
  featureIllustrations,
  type FeatureIllustrationKey,
} from '@/components/landing/LandingFeatureIllustrations';
import { cn } from '@/lib/utils';
import { getTenantLoginPath } from '@/lib/tenant-routes';
import { PwaInstallButton } from '@/components/PwaInstallButton';

/* Brand palette */
const C = {
  crimsonDark: '#660708',
  crimson: '#a4161a',
  crimsonBright: '#ba181b',
  charcoal: '#161a1d',
  black: '#0b090a',
  /* Light theme surfaces */
  bg: '#faf9f9',
  bgAlt: '#f3f1f1',
  surface: '#ffffff',
  textMuted: '#161a1db3',
  textSoft: '#161a1d80',
} as const;

const easeOut: Easing = [0, 0, 0.2, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.09, duration: 0.55, ease: easeOut },
  }),
};

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: 1800, bounce: 0 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, motionVal, value]);

  useEffect(() => {
    const unsub = spring.on('change', v => setDisplay(Math.round(v).toLocaleString()));
    return unsub;
  }, [spring]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

const features: {
  key: FeatureIllustrationKey;
  icon: React.ElementType;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  detailEn: string;
  detailAr: string;
  highlightsEn: string[];
  highlightsAr: string[];
}[] = [
  {
    key: 'students',
    icon: Users,
    titleEn: 'Student Management',
    titleAr: 'إدارة الطلاب',
    descEn: 'Complete profiles, enrollment, and academic records — built for Egyptian centers.',
    descAr: 'ملفات كاملة للطلاب والتسجيل والسجلات الأكاديمية — مصممة للمراكز التعليمية في مصر.',
    detailEn:
      'Register students by grade and section, attach parent contacts, and keep every academic record in one searchable profile — from enrollment to graduation.',
    detailAr:
      'سجّل الطلاب حسب الصف والفصل، اربط بيانات أولياء الأمور، واحتفظ بكل السجل الأكademي في ملف واحد — من التسجيل حتى التخرج.',
    highlightsEn: ['Bulk import & enrollment', 'Grade & section assignment', 'Full student history'],
    highlightsAr: ['استيراد وتسجيل جماعي', 'تعيين الصف والفصل', 'سجل أكاديمي كامل'],
  },
  {
    key: 'attendance',
    icon: ClipboardCheck,
    titleEn: 'Smart Attendance',
    titleAr: 'الحضور الذكي',
    descEn: 'Digital attendance with instant parent notifications via SMS-ready workflows.',
    descAr: 'حضور رقمي مع إشعارات فورية لأولياء الأمور — شفافية تبني الثقة.',
    detailEn:
      'Mark attendance per class in seconds, view history by date or student, and notify parents automatically when a child is absent.',
    detailAr:
      'سجّل الحضور لكل فصل في ثوانٍ، اعرض السجل حسب التاريخ أو الطالب، وأبلغ أولياء الأمور تلقائياً عند الغياب.',
    highlightsEn: ['Daily class roll call', 'Absence alerts to parents', 'Attendance reports'],
    highlightsAr: ['حضور يومي للفصول', 'تنبيه الغياب لولي الأمر', 'تقارير الحضور'],
  },
  {
    key: 'exams',
    icon: BarChart3,
    titleEn: 'Exams & Quizzes',
    titleAr: 'الامتحانات والاختبارات',
    descEn: 'Create, grade, and analyze exams with detailed performance reports.',
    descAr: 'إنشاء وتصحيح وتحليل الامتحانات مع تقارير أداء مفصلة.',
    detailEn:
      'Build exam schedules, enter grades by section, and compare performance across classes with charts that help directors make faster decisions.',
    detailAr:
      'أنشئ جداول الامتحانات، أدخل الدرجات لكل فصل، وقارن الأداء بين الفصول برسوم بيانية تساعد المدير على قرارات أسرع.',
    highlightsEn: ['Exam & quiz builder', 'Section-grade entry', 'Performance analytics'],
    highlightsAr: ['إنشاء امتحانات واختبارات', 'إدخال درجات الفصول', 'تحليلات الأداء'],
  },
  {
    key: 'fees',
    icon: CreditCard,
    titleEn: 'Fee Management',
    titleAr: 'إدارة الرسوم',
    descEn: 'Automated billing, installment tracking, and financial reporting in EGP.',
    descAr: 'فوترة تلقائية وتقسيط وتقارير مالية — بالجنيه المصري.',
    detailEn:
      'Define fee plans, track installments in EGP, record payments per student, and export financial summaries for your center’s accounting.',
    detailAr:
      'عرّف خطط الرسوم، تتبع الأقساط بالجنيه المصري، سجّل المدفوعات لكل طالب، وصدّر ملخصات مالية لمحاسبة المركز.',
    highlightsEn: ['Installment plans', 'Payment tracking', 'Revenue reports'],
    highlightsAr: ['خطط تقسيط', 'تتبع المدفوعات', 'تقارير الإيرادات'],
  },
  {
    key: 'library',
    icon: BookMarked,
    titleEn: 'Digital Library',
    titleAr: 'المكتبة الرقمية',
    descEn: 'Manage resources, track borrowing, and build a digital knowledge base.',
    descAr: 'إدارة الموارد وتتبع الإعارة وبناء قاعدة معرفية رقمية.',
    detailEn:
      'Catalog books and digital resources, manage borrow/return cycles, and give teachers and students one place to discover learning materials.',
    detailAr:
      'أدرج الكتب والموارد الرقمية، أدِر دورات الإعارة والإرجاع، ووفّر للمعلمين والطلاب مكاناً واحداً لاكتشاف مواد التعلم.',
    highlightsEn: ['Resource catalog', 'Borrow & return tracking', 'Shared knowledge base'],
    highlightsAr: ['فهرس الموارد', 'تتبع الإعارة والإرجاع', 'قاعدة معرفية مشتركة'],
  },
  {
    key: 'live',
    icon: Video,
    titleEn: 'Live Classes',
    titleAr: 'الحصص المباشرة',
    descEn: 'Schedule and run online sessions — ready for hybrid learning centers.',
    descAr: 'جدولة وتشغيل الحصص أونلاين — جاهز للتعليم المختلط.',
    detailEn:
      'Schedule recurring meeting series, launch live sessions from the dashboard, and let students join securely — ideal for centers offering online or blended learning.',
    detailAr:
      'جدول سلاسل الحصص المتكررة، شغّل الجلسات المباشرة من اللوحة، ودع الطلاب ينضمون بأمان — مثالي للمراكز التي تقدم تعليماً أونلاين أو مختلطاً.',
    highlightsEn: ['Meeting series scheduling', 'One-click live join', 'Hybrid-ready'],
    highlightsAr: ['جدولة سلسلة الحصص', 'انضمام مباشر بنقرة', 'جاهز للتعليم المختلط'],
  },
];

const stats = [
  { value: 10000, suffix: '+', labelEn: 'Students Managed', labelAr: 'طالب مسجّل', icon: Users },
  { value: 500, suffix: '+', labelEn: 'Centers Trust Us', labelAr: 'مركز تعليمي', icon: Building2 },
  { value: 99, suffix: '.9%', labelEn: 'Uptime', labelAr: 'وقت التشغيل', icon: Activity },
  { value: 24, suffix: '/7', labelEn: 'Support', labelAr: 'الدعم الفني', icon: Headphones },
];

const roles: {
  key: DashboardRoleKey;
  icon: React.ElementType;
  labelEn: string;
  labelAr: string;
  descEn: string;
  descAr: string;
  detailEn: string;
  detailAr: string;
  highlightsEn: string[];
  highlightsAr: string[];
}[] = [
  {
    key: 'admin',
    icon: Shield,
    labelEn: 'Center Director',
    labelAr: 'مدير المركز',
    descEn: 'Full control over operations, staff, fees, and reporting.',
    descAr: 'تحكم كامل في عمليات المركز والموظفين والرسوم والتقارير.',
    detailEn:
      'The admin dashboard is your command center: enrollment, staff, finances, exams, announcements, and center-wide reports — everything a director needs to run the center confidently.',
    detailAr:
      'لوحة المدير هي مركز القيادة: التسجيل، الموظفون، المالية، الامتحانات، الإعلانات، وتقارير المركز — كل ما يحتاجه المدير لإدارة المركز بثقة.',
    highlightsEn: ['Center-wide KPIs & stats', 'Staff & structure management', 'Financial & academic reports'],
    highlightsAr: ['مؤشرات وإحصائيات المركز', 'إدارة الموظفين والهيكل', 'تقارير مالية وأكاديمية'],
  },
  {
    key: 'teacher',
    icon: BookOpen,
    labelEn: 'Teacher',
    labelAr: 'المعلم',
    descEn: 'Manage classes, attendance, homework, and student grades.',
    descAr: 'إدارة الفصول والحضور والواجبات ودرجات الطلاب.',
    detailEn:
      'Teachers see today’s schedule first, then take attendance, assign homework, enter grades, and launch live classes — without switching between tools.',
    detailAr:
      'يرى المعلم جدول اليوم أولاً، ثم يسجّل الحضور، يوزّع الواجبات، يدخل الدرجات، ويشغّل الحصص المباشرة — دون التنقل بين أدوات متعددة.',
    highlightsEn: ['Today’s class schedule', 'Attendance & homework', 'Live class launch'],
    highlightsAr: ['جدول حصص اليوم', 'الحضور والواجبات', 'تشغيل الحصص المباشرة'],
  },
  {
    key: 'student',
    icon: GraduationCap,
    labelEn: 'Student',
    labelAr: 'الطالب',
    descEn: 'Access courses, view grades, submit homework, and track progress.',
    descAr: 'الوصول للمقررات وعرض الدرجات وتقديم الواجبات.',
    detailEn:
      'Students get a clear view of upcoming assignments, recent grades, course progress, and live sessions — designed to keep learners focused and organized.',
    detailAr:
      'يحصل الطالب على عرض واضح للواجبات القادمة، الدرجات الأخيرة، تقدم المقررات، والحصص المباشرة — مصمم ليبقي المتعلم مركزاً ومنظماً.',
    highlightsEn: ['Upcoming assignments', 'Grades & progress ring', 'Join live classes'],
    highlightsAr: ['الواجبات القادمة', 'الدرجات وحلقة التقدم', 'الانضمام للحصص المباشرة'],
  },
  {
    key: 'parent',
    icon: Users,
    labelEn: 'Parent',
    labelAr: 'ولي الأمر',
    descEn: "Monitor children's attendance, grades, and fee payments.",
    descAr: 'تابع ابنك… حضورًا ودرجاتً ورسومًا — بشفافية.',
    detailEn:
      'Parents follow each child’s attendance trends, latest grades, and fee status in one trusted portal — building transparency between the center and families.',
    detailAr:
      'يتابع ولي الأمر اتجاهات حضور كل ابن، آخر الدرجات، وحالة الرسوم في بوابة موثوقة واحدة — لبناء الشفافية بين المركز والأسرة.',
    highlightsEn: ['Per-child overview', 'Attendance & grade trends', 'Fee payment status'],
    highlightsAr: ['نظرة لكل ابن', 'اتجاهات الحضور والدرجات', 'حالة مدفوعات الرسوم'],
  },
];

const steps = [
  {
    num: '01',
    titleEn: 'Register Your Center',
    titleAr: 'سجّل مركزك',
    descEn: 'Create your account in minutes — no technical setup required.',
    descAr: 'أنشئ حسابك في دقائق — بدون إعداد تقني معقد.',
    icon: Building2,
  },
  {
    num: '02',
    titleEn: 'Import Your Data',
    titleAr: 'استورد بياناتك',
    descEn: 'Add students, teachers, and classes — or start fresh.',
    descAr: 'أضف الطلاب والمعلمين والفصول — أو ابدأ من الصفر.',
    icon: Zap,
  },
  {
    num: '03',
    titleEn: 'Run Smarter',
    titleAr: 'أدِر بذكاء',
    descEn: 'Attendance, fees, exams, and reports — all from one dashboard.',
    descAr: 'الحضور والرسوم والامتحانات والتقارير — من لوحة واحدة.',
    icon: LayoutDashboard,
  },
];

const trustPoints = [
  { key: 'secure', icon: ShieldCheck, en: 'Role-based security', ar: 'أمان يعتمد على الأدوار' },
  { key: 'live', icon: Video, en: 'Live classes ready', ar: 'جاهز للحصص المباشرة' },
  { key: 'dash', icon: LayoutDashboard, en: 'Unified dashboards', ar: 'لوحات موحّدة' },
  { key: 'rtl', icon: Languages, en: 'Full Arabic RTL', ar: 'واجهة عربية كاملة' },
];

const governorates = ['القاهرة', 'الإسكندرية', 'الجيزة', 'المنصورة', 'طنطا', 'أسيوط'];

export default function LandingPage() {
  const navigate = useNavigate();
  const { locale, setLocale, dir, t } = useLocale();
  const isAr = locale === 'ar';
  const [scrolled, setScrolled] = useState(false);
  const [activeRole, setActiveRole] = useState<DashboardRoleKey>('admin');
  const activeRoleData = roles.find(r => r.key === activeRole) ?? roles[0];
  const ActiveDashboardPreview = dashboardPreviews[activeRole];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      dir={dir}
      lang={locale}
      className={cn('min-h-screen overflow-x-hidden', isAr && 'font-arabic')}
      style={{
        color: C.charcoal,
        background: `${C.bg}`,
      }}
    >
      {/* Floating ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 start-[8%] h-[520px] w-[520px] rounded-full blur-3xl"
          style={{ background: `${C.crimsonBright}18` }}
        />
        <motion.div
          animate={{ x: [0, -25, 0], y: [0, 25, 0], scale: [1, 1.05, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute top-[40%] end-[-8%] h-[440px] w-[440px] rounded-full blur-3xl"
          style={{ background: `${C.crimson}14` }}
        />
        <motion.div
          animate={{ x: [0, 15, 0], y: [0, -15, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute bottom-[10%] start-[20%] h-[320px] w-[320px] rounded-full blur-3xl"
          style={{ background: `${C.crimsonBright}10` }}
        />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easeOut }}
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled
            ? 'border-b shadow-lg backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
        style={{
          borderColor: scrolled ? `${C.crimsonBright}22` : 'transparent',
          backgroundColor: scrolled ? `${C.surface}ee` : 'transparent',
          boxShadow: scrolled ? `0 4px 24px ${C.charcoal}12` : undefined,
        }}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex min-w-0 items-center gap-2.5 rounded-xl outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{ ['--tw-ring-color' as string]: C.crimsonBright }}
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-lg"
              style={{ background: `${C.crimsonBright}` }}
            >
              <GraduationCap className="h-5 w-5 text-white" aria-hidden />
            </div>
            <span className="truncate font-display text-lg font-bold tracking-tight sm:text-xl">{t('app.name')}</span>
          </button>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <a
              href="#features"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-[#161a1d] md:inline-block"
              style={{ color: C.textMuted }}
            >
              {isAr ? 'المزايا' : 'Features'}
            </a>
            <a
              href="#how-it-works"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-[#161a1d] md:inline-block"
              style={{ color: C.textMuted }}
            >
              {isAr ? 'كيف يعمل' : 'How It Works'}
            </a>
            <button
              type="button"
              onClick={() => setLocale(isAr ? 'en' : 'ar')}
              className="flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-colors"
              style={{ borderColor: `${C.crimsonBright}33`, backgroundColor: C.surface, color: C.charcoal }}
            >
              <Languages className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              <span className="hidden sm:inline">{isAr ? 'English' : 'العربية'}</span>
            </button>
            <PwaInstallButton
              className="rounded-xl border px-2.5 py-2 transition-colors hover:opacity-90"
              iconClassName="h-4 w-4 opacity-70"
              style={{ borderColor: `${C.crimsonBright}33`, backgroundColor: C.surface, color: C.charcoal }}
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(getTenantLoginPath())}
              className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg sm:px-5"
              style={{
                background: `${C.crimsonBright}`,
                boxShadow: `0 4px 20px ${C.crimsonBright}44`,
              }}
            >
              <LogIn className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="relative pt-28 pb-16 sm:pt-36 sm:pb-24">
        <LandingGeometricPattern className="opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        <LandingDotPattern className="opacity-50 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,440px)] lg:gap-16 lg:px-8">
          <motion.div initial="hidden" animate="visible" className="min-w-0">
            <motion.div
              custom={0}
              variants={fadeUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm"
              style={{
                borderColor: `${C.crimsonBright}33`,
                backgroundColor: `${C.crimsonBright}0d`,
                color: C.crimson,
              }}
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
              </motion.span>
              {isAr ? 'منصة إدارة المراكز التعليمية في مصر' : 'School & Center Management for Egypt'}
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              className="font-display text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-[3.35rem] lg:leading-[1.1]"
            >
              {isAr ? (
                <>
                  منصة واحدة…{' '}
                  <span
                    className="bg-clip-text"
                    style={{ backgroundImage: `${C.crimsonBright}` }}
                  >
                    لكل فصول مركزك
                  </span>
                </>
              ) : (
                <>
                  One Platform for{' '}
                  <span
                    className="bg-clip-text text-transparent"
                    style={{ backgroundImage: `${C.crimsonBright}` }}
                  >
                    Every Egyptian Center
                  </span>
                </>
              )}
            </motion.h1>

            <motion.p custom={2} variants={fadeUp} className="mt-6 max-w-xl text-pretty text-lg leading-relaxed" style={{ color: C.textMuted }}>
              {isAr
                ? 'إدارة الطلاب والحضور والامتحانات والرسوم والمكتبة والحصص المباشرة — من لوحة واحدة موثوقة للمراكز في القاهرة والإسكندرية وجميع المحافظات.'
                : 'Manage students, attendance, exams, fees, library, and live classes — one trusted dashboard for centers across Cairo, Alexandria, and every governorate.'}
            </motion.p>

            <motion.ul custom={3} variants={fadeUp} className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm" style={{ color: C.textMuted }}>
              {trustPoints.map(tp => (
                <li key={tp.key} className="flex items-center gap-2">
                  <tp.icon className="h-4 w-4 shrink-0" style={{ color: C.crimsonBright }} aria-hidden />
                  <span>{isAr ? tp.ar : tp.en}</span>
                </li>
              ))}
            </motion.ul>

            <motion.div custom={4} variants={fadeUp} className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
              <motion.button
                type="button"
                whileHover={{ scale: 1.03, boxShadow: `0 8px 32px ${C.crimsonBright}55` }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(getTenantLoginPath())}
                className="group inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold text-white shadow-lg"
                style={{
                  background: `${C.crimsonBright}`,
                  boxShadow: `0 4px 24px ${C.crimsonBright}44`,
                }}
              >
                {isAr ? 'ابدأ تجربتك المجانية' : 'Start Free Trial'}
                <ArrowRight
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform',
                    dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1',
                  )}
                  aria-hidden
                />
              </motion.button>
              <motion.button
                type="button"
                whileHover={{ scale: 1.02, borderColor: `${C.crimsonBright}88` }}
                whileTap={{ scale: 0.98 }}
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-8 py-3.5 text-sm font-semibold backdrop-blur-sm transition"
                style={{ borderColor: `${C.crimsonBright}44`, backgroundColor: C.surface, color: C.charcoal }}
              >
                <BookOpen className="h-4 w-4 shrink-0" style={{ color: C.crimsonBright }} aria-hidden />
                {isAr ? 'اكتشف المزايا' : 'Explore Features'}
              </motion.button>
            </motion.div>

            {/* Governorates strip */}
            <motion.div custom={5} variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 opacity-60" style={{ color: C.crimsonBright }} aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wider opacity-50">
                {isAr ? 'موثوق في' : 'Trusted in'}
              </span>
              {governorates.map((gov, i) => (
                <motion.span
                  key={gov}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.06 }}
                  className="rounded-full border px-2.5 py-1 text-xs font-medium"
                  style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: `${C.crimsonBright}0a`, color: C.crimson }}
                >
                  {gov}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.65, ease: easeOut, delay: 0.15 }}
            className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative rounded-[2rem] border p-6 shadow-2xl backdrop-blur-md"
              style={{
                borderColor: `${C.crimsonBright}22`,
                backgroundColor: C.surface,
                boxShadow: `0 24px 64px ${C.charcoal}14, 0 0 0 1px ${C.crimsonBright}0d inset`,
              }}
            >
              <div
                className="absolute -top-3 inset-inline-end-8 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-md backdrop-blur-sm"
                style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: C.surface, color: C.charcoal }}
              >
                <span className="relative flex h-2 w-2">
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                    style={{ backgroundColor: `${C.crimsonBright}99` }}
                  />
                  <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: C.crimsonBright }} />
                </span>
                {isAr ? 'متصل ومستقر' : 'Live & stable'}
              </div>
              <LandingHeroIllustration />
            </motion.div>

            {/* Floating stat chips */}
            <motion.div
              initial={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="absolute -bottom-4 inset-inline-start-4 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-md sm:-bottom-6 sm:px-4 sm:py-2.5 sm:text-sm"
              style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: C.surface, color: C.charcoal }}
            >
              <Clock className="h-4 w-4" style={{ color: C.crimsonBright }} aria-hidden />
              {isAr ? 'إعداد في دقائق' : 'Setup in minutes'}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.85, duration: 0.5 }}
              className="absolute -top-2 inset-inline-end-0 flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur-md sm:-top-4 sm:px-4 sm:py-2.5"
              style={{ borderColor: `${C.crimsonBright}28`, backgroundColor: C.surface, color: C.charcoal }}
            >
              <Star className="h-4 w-4 fill-current" style={{ color: C.crimsonBright }} aria-hidden />
              4.9/5
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section
        className="relative border-y py-14 backdrop-blur-sm"
        style={{ borderColor: `${C.crimsonBright}18`, backgroundColor: `${C.crimsonBright}08` }}
      >
        <LandingDotPattern className="opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-4 md:gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.labelEn}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: '-40px' }}
                variants={fadeUp}
                className="flex flex-col items-center text-center"
              >
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 3 }}
                  className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner"
                  style={{ backgroundColor: `${C.crimsonBright}14`, color: C.crimson }}
                >
                  <s.icon className="h-6 w-6" aria-hidden />
                </motion.div>
                <p className="font-display text-3xl font-extrabold tabular-nums" style={{ color: C.crimsonBright }}>
                  {s.value === 99 ? (
                    <>
                      <AnimatedCounter value={99} />
                      .9%
                    </>
                  ) : s.value === 24 ? (
                    <>
                      <AnimatedCounter value={24} />
                      /7
                    </>
                  ) : (
                    <>
                      <AnimatedCounter value={s.value} />
                      {s.suffix}
                    </>
                  )}
                </p>
                <p className="mt-1.5 text-sm font-medium" style={{ color: C.textMuted }}>
                  {isAr ? s.labelAr : s.labelEn}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative scroll-mt-24 py-20 sm:py-28">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40"
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <motion.div
              custom={0}
              variants={fadeUp}
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider"
              style={{ borderColor: `${C.crimsonBright}44`, color: C.crimsonBright }}
            >
              <Bell className="h-3.5 w-3.5" aria-hidden />
              {isAr ? 'المزايا' : 'Features'}
            </motion.div>
            <motion.h2 custom={1} variants={fadeUp} className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {isAr ? 'كل ما يحتاجه مركزك التعليمي' : 'Everything Your Center Needs'}
            </motion.h2>
            <motion.p custom={2} variants={fadeUp} className="mt-4" style={{ color: C.textMuted }}>
              {isAr
                ? 'أدوات متكاملة صُممت خصيصاً للمراكز التعليمية والمدارس في مصر.'
                : 'Integrated tools designed specifically for educational centers and schools in Egypt.'}
            </motion.p>
          </motion.div>

          <div className="space-y-16 sm:space-y-24">
            {features.map((f, i) => {
              const Illustration = featureIllustrations[f.key];
              const reversed = i % 2 === 1;
              return (
                <motion.article
                  key={f.key}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-80px' }}
                  variants={fadeUp}
                  className={cn(
                    'grid items-center gap-8 lg:grid-cols-2 lg:gap-12',
                    reversed && 'lg:[direction:rtl]',
                  )}
                >
                  <div className={cn('min-w-0', reversed && 'lg:[direction:ltr]')}>
                    <div
                      className="overflow-hidden rounded-2xl border p-4 shadow-lg sm:p-5"
                      style={{
                        borderColor: `${C.crimsonBright}22`,
                        backgroundColor: C.surface,
                        boxShadow: `0 8px 32px ${C.charcoal}0a`,
                      }}
                    >
                      <Illustration />
                    </div>
                  </div>

                  <div className={cn('min-w-0', reversed && 'lg:[direction:ltr]')}>
                    <div
                      className="mb-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white"
                      style={{ background: C.crimsonBright }}
                    >
                      <f.icon className="h-4 w-4" aria-hidden />
                      {isAr ? f.titleAr : f.titleEn}
                    </div>
                    <h3 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                      {isAr ? f.titleAr : f.titleEn}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed" style={{ color: C.textMuted }}>
                      {isAr ? f.detailAr : f.detailEn}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {(isAr ? f.highlightsAr : f.highlightsEn).map((line, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm font-medium" style={{ color: C.charcoal }}>
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.crimsonBright }} aria-hidden />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 border-y py-20 sm:py-24"
        style={{ borderColor: `${C.crimsonBright}18`, backgroundColor: C.bgAlt }}
      >
        <LandingGeometricPattern className="opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {isAr ? 'ابدأ في ثلاث خطوات' : 'Get Started in Three Steps'}
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mt-4" style={{ color: C.textMuted }}>
              {isAr ? 'دقائق وليس أيامًا — بدون تعقيد تقني.' : 'Minutes, not days — no technical complexity.'}
            </motion.p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="relative text-center"
              >
                {i < steps.length - 1 && (
                  <div
                    className="pointer-events-none absolute top-10 hidden h-px md:block"
                    style={{
                      insetInlineStart: '60%',
                      width: '80%',
                      background: `linear-gradient(${dir === 'rtl' ? '270deg' : '90deg'}, ${C.crimsonBright}66, transparent)`,
                    }}
                    aria-hidden
                  />
                )}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border text-xl font-bold"
                  style={{
                    borderColor: `${C.crimsonBright}33`,
                    backgroundColor: C.surface,
                    color: C.crimson,
                  }}
                >
                  <step.icon className="h-7 w-7" aria-hidden />
                </motion.div>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: C.crimson }}>
                  {step.num}
                </span>
                <h3 className="mt-2 font-display text-lg font-semibold">{isAr ? step.titleAr : step.titleEn}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: C.textMuted }}>
                  {isAr ? step.descAr : step.descEn}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="scroll-mt-24 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto mb-16 max-w-2xl text-center"
          >
            <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {isAr ? 'لوحة مخصصة لكل دور' : 'A Dashboard for Every Role'}
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mt-4" style={{ color: C.textMuted }}>
              {isAr
                ? 'تجربة مخصصة — من مدير المركز إلى ولي الأمر.'
                : 'Tailored experience — from center directors to parents.'}
            </motion.p>
          </motion.div>

          <div
            className="overflow-hidden rounded-[2rem] border"
            style={{
              borderColor: `${C.crimsonBright}22`,
              backgroundColor: C.surface,
              boxShadow: `0 8px 40px ${C.charcoal}0c`,
            }}
          >
            <div
              className="flex flex-wrap gap-2 border-b p-4 sm:p-5"
              style={{ borderColor: `${C.crimsonBright}18`, backgroundColor: C.bgAlt }}
            >
              {roles.map(r => {
                const active = activeRole === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setActiveRole(r.key)}
                    className={cn(
                      'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all',
                      !active && 'hover:bg-white/80',
                    )}
                    style={
                      active
                        ? {
                            borderColor: C.crimsonBright,
                            backgroundColor: C.surface,
                            color: C.crimsonDark,
                            boxShadow: `0 0 0 2px ${C.crimsonBright}33`,
                          }
                        : {
                            borderColor: `${C.crimsonBright}22`,
                            color: C.textMuted,
                          }
                    }
                  >
                    <r.icon className="h-4 w-4" style={{ color: active ? C.crimsonBright : C.textSoft }} aria-hidden />
                    {isAr ? r.labelAr : r.labelEn}
                  </button>
                );
              })}
            </div>

            <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:items-center lg:gap-12 lg:p-10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeRole}
                  initial={{ opacity: 0, x: dir === 'rtl' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir === 'rtl' ? -20 : 20 }}
                  transition={{ duration: 0.35, ease: easeOut }}
                  className="min-w-0"
                >
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: C.crimson }}>
                    {isAr ? 'لوحة التحكم' : 'Dashboard'}
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
                    {isAr ? activeRoleData.labelAr : activeRoleData.labelEn}
                  </h3>
                  <p className="mt-2 text-sm font-medium" style={{ color: C.crimson }}>
                    {isAr ? activeRoleData.descAr : activeRoleData.descEn}
                  </p>
                  <p className="mt-4 text-base leading-relaxed" style={{ color: C.textMuted }}>
                    {isAr ? activeRoleData.detailAr : activeRoleData.detailEn}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {(isAr ? activeRoleData.highlightsAr : activeRoleData.highlightsEn).map((line, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-sm font-medium">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: C.crimsonBright }} aria-hidden />
                        {line}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeRole}-preview`}
                  initial={{ opacity: 0, scale: 0.97, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -8 }}
                  transition={{ duration: 0.4, ease: easeOut }}
                  className="min-w-0 overflow-hidden rounded-2xl border p-4 sm:p-5"
                  style={{
                    borderColor: `${C.crimsonBright}22`,
                    backgroundColor: C.bg,
                  }}
                >
                  <ActiveDashboardPreview idPrefix={`landing-${activeRole}`} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <motion.ul
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mx-auto mt-12 flex max-w-2xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-6"
          >
            {[
              isAr ? 'تصميم متجاوب بالكامل' : 'Fully responsive',
              isAr ? 'واجهة عربية كاملة (RTL)' : 'Full RTL Arabic UI',
              isAr ? 'دعم متعدد الأدوار' : 'Multi-role support',
            ].map((line, idx) => (
              <li key={idx} className="flex items-center justify-center gap-2 text-sm font-medium" style={{ color: C.textMuted }}>
                <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: C.crimsonBright }} aria-hidden />
                {line}
              </li>
            ))}
          </motion.ul>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-[2rem] border px-8 py-16 text-center sm:px-16"
            style={{
              borderColor: `${C.crimsonBright}44`,
              background: `${C.crimsonBright}`,
              boxShadow: `0 32px 64px ${C.crimsonDark}66`,
            }}
          >
            <div className="pointer-events-none absolute inset-0">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.12, 0.2, 0.12] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-24 start-10 h-64 w-64 rounded-full blur-3xl"
                style={{ backgroundColor: '#ffffff22' }}
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.08, 0.15, 0.08] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute -bottom-28 end-10 h-72 w-72 rounded-full blur-3xl"
                style={{ backgroundColor: '#ffffff18' }}
              />
              <LandingDotPattern className="opacity-20 [&_circle]:fill-white" />
            </div>

            <div className="relative">
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-white sm:text-4xl">
                {isAr ? 'مستعد لتحويل مركزك التعليمي؟' : 'Ready to Transform Your Center?'}
              </motion.h2>
              <motion.p custom={1} variants={fadeUp} className="mx-auto mt-4 max-w-xl text-pretty text-white/85">
                {isAr
                  ? `انضم إلى مئات المراكز التي تستخدم ${t('app.name')} لإدارة عملياتها بكفاءة وثقة.`
                  : `Join hundreds of centers using ${t('app.name')} to run operations with confidence.`}
              </motion.p>
              <motion.div custom={2} variants={fadeUp} className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(getTenantLoginPath())}
                  className="group inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-sm font-semibold shadow-lg transition"
                  style={{ backgroundColor: '#fff', color: C.crimsonDark }}
                >
                  {isAr ? 'ابدأ مجاناً اليوم' : 'Start Free Today'}
                  <ArrowRight
                    className={cn(
                      'h-4 w-4 shrink-0 transition-transform',
                      dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1',
                    )}
                    aria-hidden
                  />
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12" style={{ borderColor: `${C.crimsonBright}18`, backgroundColor: C.surface }}>
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center lg:gap-10">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl shadow-md"
                style={{ background: `${C.crimsonBright}` }}
              >
                <GraduationCap className="h-5 w-5 text-white" aria-hidden />
              </div>
              <span className="font-display text-lg font-bold">{t('app.name')}</span>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <a
                href="#features"
                className="inline-flex items-center gap-1.5 transition hover:text-[#161a1d]"
                style={{ color: C.textMuted }}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                {isAr ? 'المزايا' : 'Features'}
              </a>
              <button
                type="button"
                onClick={() => navigate(getTenantLoginPath())}
                className="inline-flex items-center gap-1.5 transition hover:text-[#161a1d]"
                style={{ color: C.textMuted }}
              >
                <LogIn className="h-3.5 w-3.5" aria-hidden />
                {isAr ? 'دخول المركز' : 'Center login'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/platform/login')}
                className="inline-flex items-center gap-1.5 transition hover:text-[#161a1d]"
                style={{ color: C.textMuted }}
              >
                <Shield className="h-3.5 w-3.5" aria-hidden />
                {isAr ? 'بوابة المنصة' : 'Platform portal'}
              </button>
            </nav>
          </div>
          <p className="text-center text-sm lg:text-end" style={{ color: C.textSoft }}>
            © {new Date().getFullYear()} {t('app.name')}. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocale } from '@/contexts/LocaleContext';
import { motion } from 'framer-motion';
import type { Easing } from 'framer-motion';
import {
  GraduationCap, Shield, BookOpen, Users, BarChart3, ClipboardCheck,
  CreditCard, Bell, ArrowRight, Languages, Sparkles, BookMarked
} from 'lucide-react';

const easeOut: Easing = [0, 0, 0.2, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: easeOut } }),
};

const features = [
  { icon: Users, titleEn: 'Student Management', titleAr: 'إدارة الطلاب', descEn: 'Complete student profiles, enrollment tracking, and academic records in one place.', descAr: 'ملفات الطلاب الكاملة وتتبع التسجيل والسجلات الأكاديمية في مكان واحد.' },
  { icon: ClipboardCheck, titleEn: 'Smart Attendance', titleAr: 'الحضور الذكي', descEn: 'Digital attendance tracking with real-time notifications to parents.', descAr: 'تتبع الحضور الرقمي مع إشعارات فورية لأولياء الأمور.' },
  { icon: BarChart3, titleEn: 'Exams & Quizzes', titleAr: 'الامتحانات والاختبارات', descEn: 'Create, grade, and analyze exams with detailed performance reports.', descAr: 'إنشاء وتصحيح وتحليل الامتحانات مع تقارير أداء مفصلة.' },
  { icon: CreditCard, titleEn: 'Fee Management', titleAr: 'إدارة الرسوم', descEn: 'Automated billing, payment tracking, and financial reporting.', descAr: 'الفوترة التلقائية وتتبع المدفوعات والتقارير المالية.' },
  { icon: BookMarked, titleEn: 'Digital Library', titleAr: 'المكتبة الرقمية', descEn: 'Manage resources, track borrowing, and build a digital knowledge base.', descAr: 'إدارة الموارد وتتبع الإعارة وبناء قاعدة معرفية رقمية.' },
  { icon: Bell, titleEn: 'Announcements', titleAr: 'الإعلانات', descEn: 'Broadcast updates to students, parents, and staff instantly.', descAr: 'بث التحديثات للطلاب وأولياء الأمور والموظفين فوراً.' },
];

const stats = [
  { value: '10K+', labelEn: 'Students Managed', labelAr: 'طالب مسجّل' },
  { value: '500+', labelEn: 'Schools Trust Us', labelAr: 'مدرسة تثق بنا' },
  { value: '99.9%', labelEn: 'Uptime', labelAr: 'وقت التشغيل' },
  { value: '24/7', labelEn: 'Support', labelAr: 'الدعم الفني' },
];

const roles = [
  { icon: Shield, labelEn: 'Administrator', labelAr: 'المدير', descEn: 'Full control over school operations, staff, and reporting.', descAr: 'تحكم كامل في عمليات المدرسة والموظفين والتقارير.' },
  { icon: BookOpen, labelEn: 'Teacher', labelAr: 'المعلم', descEn: 'Manage classes, attendance, homework, and student grades.', descAr: 'إدارة الفصول والحضور والواجبات ودرجات الطلاب.' },
  { icon: GraduationCap, labelEn: 'Student', labelAr: 'الطالب', descEn: 'Access courses, view grades, submit homework, and track progress.', descAr: 'الوصول للمقررات وعرض الدرجات وتقديم الواجبات وتتبع التقدم.' },
  { icon: Users, labelEn: 'Parent', labelAr: 'ولي الأمر', descEn: 'Monitor children\'s attendance, grades, and fee payments.', descAr: 'متابعة حضور الأبناء ودرجاتهم ومدفوعاتهم.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { locale, setLocale } = useLocale();
  const isAr = locale === 'ar';

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">EduCenter</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocale(isAr ? 'en' : 'ar')}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <Languages className="h-4 w-4 text-muted-foreground" />
              {isAr ? 'English' : 'العربية'}
            </button>
            <button
              onClick={() => navigate('/login')}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 start-1/4 h-[500px] w-[500px] rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute top-20 end-0 h-[400px] w-[400px] rounded-full bg-accent/6 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial="hidden"
            animate="visible"
          >
            <motion.div
              custom={0}
              variants={fadeUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary"
            >
              <Sparkles className="h-4 w-4" />
              {isAr ? 'منصة إدارة المدارس الحديثة' : 'Modern School Management Platform'}
            </motion.div>

            <motion.h1
              custom={1}
              variants={fadeUp}
              className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
            >
              {isAr ? (
                <>إدارة مدرستك <span className="text-primary">بذكاء</span> وكفاءة</>
              ) : (
                <>Manage Your School <span className="text-primary">Smarter</span>, Not Harder</>
              )}
            </motion.h1>

            <motion.p
              custom={2}
              variants={fadeUp}
              className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground leading-relaxed"
            >
              {isAr
                ? 'منصة متكاملة لإدارة الطلاب والحضور والامتحانات والرسوم والمكتبة وأكثر — كل ذلك من مكان واحد.'
                : 'An all-in-one platform for managing students, attendance, exams, fees, library, and more — all from a single dashboard.'}
            </motion.p>

            <motion.div custom={3} variants={fadeUp} className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={() => navigate('/login')}
                className="group flex items-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                {isAr ? 'ابدأ الآن مجاناً' : 'Get Started Free'}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-2 rounded-xl border border-border px-7 py-3.5 text-sm font-semibold hover:bg-muted transition-colors"
              >
                {isAr ? 'اكتشف المزايا' : 'Explore Features'}
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/50 bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center"
              >
                <p className="font-display text-3xl font-extrabold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{isAr ? s.labelAr : s.labelEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center mb-16"
          >
            <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold sm:text-4xl">
              {isAr ? 'كل ما تحتاجه لإدارة مدرستك' : 'Everything You Need to Run Your School'}
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mt-4 text-muted-foreground">
              {isAr
                ? 'أدوات قوية ومتكاملة صممت خصيصاً للمؤسسات التعليمية.'
                : 'Powerful, integrated tools designed specifically for educational institutions.'}
            </motion.p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="group rounded-2xl border border-border/60 bg-card p-6 shadow-card transition-all hover:shadow-elevated hover:border-primary/20 hover:-translate-y-1"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{isAr ? f.titleAr : f.titleEn}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? f.descAr : f.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="py-20 bg-muted/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center mb-16"
          >
            <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold sm:text-4xl">
              {isAr ? 'لوحة تحكم مخصصة لكل دور' : 'A Dashboard for Every Role'}
            </motion.h2>
            <motion.p custom={1} variants={fadeUp} className="mt-4 text-muted-foreground">
              {isAr
                ? 'تجربة مخصصة لكل مستخدم — من المدير إلى ولي الأمر.'
                : 'Tailored experience for every user — from administrators to parents.'}
            </motion.p>
          </motion.div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((r, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="relative rounded-2xl border border-border/60 bg-card p-6 shadow-card text-center"
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <r.icon className="h-7 w-7" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">{isAr ? r.labelAr : r.labelEn}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{isAr ? r.descAr : r.descEn}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 text-center shadow-xl shadow-primary/20 sm:px-16"
          >
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -top-20 start-10 h-60 w-60 rounded-full bg-primary-foreground/10 blur-3xl" />
              <div className="absolute -bottom-20 end-10 h-60 w-60 rounded-full bg-primary-foreground/5 blur-3xl" />
            </div>

            <div className="relative">
              <motion.h2 custom={0} variants={fadeUp} className="font-display text-3xl font-bold text-primary-foreground sm:text-4xl">
                {isAr ? 'مستعد لتحويل إدارة مدرستك؟' : 'Ready to Transform Your School?'}
              </motion.h2>
              <motion.p custom={1} variants={fadeUp} className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
                {isAr
                  ? 'انضم إلى مئات المدارس التي تستخدم EduCenter لإدارة عملياتها بكفاءة.'
                  : 'Join hundreds of schools using EduCenter to streamline their operations.'}
              </motion.p>
              <motion.div custom={2} variants={fadeUp} className="mt-8">
                <button
                  onClick={() => navigate('/login')}
                  className="group inline-flex items-center gap-2 rounded-xl bg-primary-foreground px-8 py-3.5 text-sm font-semibold text-primary hover:bg-primary-foreground/90 transition-colors"
                >
                  {isAr ? 'ابدأ مجاناً اليوم' : 'Start Free Today'}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-muted/20 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-display text-lg font-bold">EduCenter</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} EduCenter. {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

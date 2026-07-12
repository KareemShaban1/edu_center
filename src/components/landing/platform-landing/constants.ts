export const BRAND = {
  red: '#C82333',
  redDark: '#A01C29',
  redLight: '#FDF2F3',
  text: '#1F2937',
  textMuted: '#6B7280',
  surface: '#FFFFFF',
  bg: '#FAFAFA',
  border: '#E5E7EB',
} as const;

export const navLinks = [
  { id: 'home', href: '#home', labelAr: 'الرئيسية', labelEn: 'Home', active: true },
  { id: 'features', href: '#features', labelAr: 'المميزات', labelEn: 'Features' },
  { id: 'guide', href: '/guide', labelAr: 'دليل المستخدم', labelEn: 'User Guide' },
  { id: 'pricing', href: '#pricing', labelAr: 'الأسعار', labelEn: 'Pricing' },
  { id: 'about', href: '#about', labelAr: 'من نحن', labelEn: 'About' },
  { id: 'contact', href: '#contact', labelAr: 'تواصل معنا', labelEn: 'Contact' },
] as const;

export const heroBadges = [
  { icon: 'sparkles', labelAr: 'سهل الاستخدام', labelEn: 'Easy to use' },
  { icon: 'shield', labelAr: 'آمن وموثوق', labelEn: 'Secure & reliable' },
  { icon: 'devices', labelAr: 'يدعم جميع الأجهزة', labelEn: 'All devices' },
] as const;

export const features = [
  {
    icon: 'users',
    titleAr: 'إدارة الفروع والمراكز',
    titleEn: 'Branch & center management',
    descAr: 'إدارة كافة فروع المركز من مكان واحد بسهولة ومرونة.',
    descEn: 'Manage all your center branches from one unified dashboard.',
  },
  {
    icon: 'credit',
    titleAr: 'إدارة مالية متكاملة',
    titleEn: 'Integrated finance',
    descAr: 'متابعة الأقساط والمدفوعات والتقارير المالية بدقة.',
    descEn: 'Track installments, payments, and financial reports with ease.',
  },
  {
    icon: 'book',
    titleAr: 'إدارة المناهج والدروس',
    titleEn: 'Curriculum management',
    descAr: 'تنظيم المحتوى التعليمي والوحدات والدروس بشكل احترافي.',
    descEn: 'Organize educational content, units, and lessons professionally.',
  },
  {
    icon: 'clipboard',
    titleAr: 'إنشاء وإدارة الاختبارات',
    titleEn: 'Exams & assessments',
    descAr: 'امتحانات ورقية وإلكترونية مع تصحيح وتقارير فورية.',
    descEn: 'Paper and online exams with instant grading and reports.',
  },
//   {
//     icon: 'message',
//     titleAr: 'نظام تواصل فعّال',
//     titleEn: 'Effective communication',
//     descAr: 'تواصل سلس بين الإدارة والمعلمين والطلاب وأولياء الأمور.',
//     descEn: 'Seamless communication between staff, teachers, students, and parents.',
//   },
  {
    icon: 'chart',
    titleAr: 'تقارير وتحليلات',
    titleEn: 'Reports & analytics',
    descAr: 'تقارير أداء ذكية تساعدك على اتخاذ قرارات أفضل.',
    descEn: 'Smart performance reports to help you make better decisions.',
  },
] as const;

export const roles = [
  {
    key: 'admin' as const,
    titleAr: 'حساب الإدارة / المساعد',
    titleEn: 'Admin / Assistant',
    previewImage: '/images/admin_dashboard.png',
    itemsAr: ['متابعة الحضور والغياب', 'إدارة البيانات والشؤون المالية', 'تقارير شاملة'],
    itemsEn: ['Track attendance & absences', 'Manage data & finances', 'Comprehensive reports'],
  },
  {
    key: 'teacher' as const,
    titleAr: 'حساب المعلم',
    titleEn: 'Teacher account',
    previewImage: '/images/teacher_dashboard.png',
    itemsAr: ['جدول الحصص اليومي', 'تسجيل الحضور ودرجات الطلاب', 'رفع الواجبات والمحتوى'],
    itemsEn: ['Daily class schedule', 'Attendance & grade entry', 'Upload homework & content'],
  },
  {
    key: 'student' as const,
    titleAr: 'حساب الطالب',
    titleEn: 'Student account',
    previewImage: '/images/student_dashboard.png',
    itemsAr: ['عرض الجدول والمحاضرات', 'تسليم الواجبات', 'متابعة الدرجات والنتائج'],
    itemsEn: ['View schedule & lectures', 'Submit homework', 'Track grades & results'],
  },
  {
    key: 'parent' as const,
    titleAr: 'حساب ولي الأمر',
    titleEn: 'Parent account',
    previewImage: '/images/parent_dashboard.png',
    itemsAr: ['متابعة حضور الأبناء', 'الاطلاع على الدرجات', 'متابعة الرسوم والمدفوعات'],
    itemsEn: ["Monitor children's attendance", 'View grades', 'Track fees & payments'],
  },
] as const;

export const whyUs = [
  { icon: 'rocket', titleAr: 'تطوير مستمر', titleEn: 'Continuous development', descAr: 'تحديثات دورية وميزات جديدة', descEn: 'Regular updates & new features' },
  { icon: 'cloud', titleAr: 'نسخ احتياطي يومي', titleEn: 'Daily backups', descAr: 'حماية بياناتك على مدار الساعة', descEn: 'Your data protected around the clock' },
  { icon: 'headset', titleAr: 'دعم فني متميز', titleEn: 'Premium support', descAr: 'فريق دعم متخصص لمساعدتك', descEn: 'Dedicated support team' },
  { icon: 'shield', titleAr: 'أمان عالي', titleEn: 'High security', descAr: 'حماية متقدمة لبيانات المركز', descEn: 'Advanced protection for center data' },
//   { icon: 'map', titleAr: 'مناسب لمصر', titleEn: 'Built for Egypt', descAr: 'مصمم خصيصاً للمراكز المصرية', descEn: 'Designed for Egyptian centers' },
] as const;

export const footerTrust = [
  { icon: 'card', labelAr: 'بدون بطاقة ائتمان', labelEn: 'No credit card' },
  { icon: 'zap', labelAr: 'إعداد سريع', labelEn: 'Fast setup' },
  { icon: 'headset', labelAr: 'دعم فني', labelEn: 'Technical support' },
] as const;

/** Platform landing WhatsApp contact (override via VITE_LANDING_WHATSAPP_PHONE). */
export const LANDING_WHATSAPP = {
  phone: (import.meta.env.VITE_LANDING_WHATSAPP_PHONE as string | undefined) || '201000000000',
  defaultMessageEn: 'Hello, I would like to book a demo for the educational platform.',
  defaultMessageAr: 'مرحباً، أود حجز عرض تجريبي للمنصة التعليمية.',
} as const;

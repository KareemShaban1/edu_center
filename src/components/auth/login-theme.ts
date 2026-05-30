/** Shared crimson palette — landing + auth */
export const brand = {
  crimsonDark: '#660708',
  crimson: '#a4161a',
  crimsonBright: '#ba181b',
  charcoal: '#161a1d',
  black: '#0b090a',
  bg: '#faf9f9',
  bgAlt: '#f3f1f1',
  surface: '#ffffff',
  textMuted: '#161a1db3',
  textSoft: '#161a1d80',
} as const;

export const guardPreviewCopy: Record<
  string,
  { titleEn: string; titleAr: string; descEn: string; descAr: string }
> = {
  users: {
    titleEn: 'Admin Dashboard',
    titleAr: 'لوحة المدير',
    descEn: 'Students, staff, fees, exams, and reports — full center control.',
    descAr: 'الطلاب والموظفون والرسوم والامتحانات والتقارير — تحكم كامل في المركز.',
  },
  admin: {
    titleEn: 'Admin Dashboard',
    titleAr: 'لوحة المدير',
    descEn: 'Students, staff, fees, exams, and reports — full center control.',
    descAr: 'الطلاب والموظفون والرسوم والامتحانات والتقارير — تحكم كامل في المركز.',
  },
  teacher: {
    titleEn: 'Teacher Dashboard',
    titleAr: 'لوحة المعلم',
    descEn: 'Classes, attendance, homework, and grades at your fingertips.',
    descAr: 'الفصول والحضور والواجبات والدرجات — بين يديك.',
  },
  student: {
    titleEn: 'Student Dashboard',
    titleAr: 'لوحة الطالب',
    descEn: 'Courses, schedule, assignments, and progress in one place.',
    descAr: 'المقررات والجدول والواجبات والتقدم — في مكان واحد.',
  },
  parent: {
    titleEn: 'Parent Dashboard',
    titleAr: 'لوحة ولي الأمر',
    descEn: "Track your children's attendance, grades, and fee payments.",
    descAr: 'تابع حضور أبنائك ودرجاتهم ومدفوعاتهم بشفافية.',
  },
};

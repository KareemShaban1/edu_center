import {
  guideRoleIconKey,
  landingIconKey,
  landingStatIconKey,
  navGroupIconKey,
  navPathIconKey,
} from '@/lib/lucide-icons';

export type UiIconCategory =
  | 'Landing page'
  | 'User guide'
  | 'Platform navigation'
  | 'Admin navigation'
  | 'Teacher navigation'
  | 'Student navigation'
  | 'Parent navigation';

export interface UiIconDefinition {
  key: string;
  defaultIcon: string;
  category: UiIconCategory;
  labelEn: string;
  labelAr: string;
  pages: string[];
}

function nav(
  path: string,
  defaultIcon: string,
  category: UiIconCategory,
  labelEn: string,
  labelAr: string,
  pages: string[],
): UiIconDefinition {
  return {
    key: navPathIconKey(path),
    defaultIcon,
    category,
    labelEn,
    labelAr,
    pages,
  };
}

function group(
  id: string,
  defaultIcon: string,
  category: UiIconCategory,
  labelEn: string,
  labelAr: string,
  pages: string[],
): UiIconDefinition {
  return {
    key: navGroupIconKey(id),
    defaultIcon,
    category,
    labelEn,
    labelAr,
    pages,
  };
}

export const UI_ICONS: UiIconDefinition[] = [
  // Landing semantic icons
  { key: landingIconKey('sparkles'), defaultIcon: 'Sparkles', category: 'Landing page', labelEn: 'Hero badge — Easy to use', labelAr: 'شارة البطل — سهل الاستخدام', pages: ['Platform landing'] },
  { key: landingIconKey('shield'), defaultIcon: 'ShieldCheck', category: 'Landing page', labelEn: 'Hero / why us — Secure', labelAr: 'الأمان', pages: ['Platform landing'] },
  { key: landingIconKey('devices'), defaultIcon: 'Smartphone', category: 'Landing page', labelEn: 'Hero badge — Devices', labelAr: 'شارة البطل — الأجهزة', pages: ['Platform landing'] },
  { key: landingIconKey('users'), defaultIcon: 'Users', category: 'Landing page', labelEn: 'Feature — Centers', labelAr: 'ميزة — المراكز', pages: ['Platform landing'] },
  { key: landingIconKey('credit'), defaultIcon: 'CreditCard', category: 'Landing page', labelEn: 'Feature — Finance', labelAr: 'ميزة — المالية', pages: ['Platform landing'] },
  { key: landingIconKey('book'), defaultIcon: 'BookOpen', category: 'Landing page', labelEn: 'Feature — Curriculum', labelAr: 'ميزة — المناهج', pages: ['Platform landing'] },
  { key: landingIconKey('clipboard'), defaultIcon: 'ClipboardList', category: 'Landing page', labelEn: 'Feature — Exams', labelAr: 'ميزة — الاختبارات', pages: ['Platform landing'] },
  { key: landingIconKey('chart'), defaultIcon: 'BarChart3', category: 'Landing page', labelEn: 'Feature — Reports', labelAr: 'ميزة — التقارير', pages: ['Platform landing'] },
  { key: landingIconKey('rocket'), defaultIcon: 'Rocket', category: 'Landing page', labelEn: 'Why us — Development', labelAr: 'لماذا نحن — التطوير', pages: ['Platform landing'] },
  { key: landingIconKey('cloud'), defaultIcon: 'Cloud', category: 'Landing page', labelEn: 'Why us — Backups', labelAr: 'لماذا نحن — النسخ الاحتياطي', pages: ['Platform landing'] },
  { key: landingIconKey('headset'), defaultIcon: 'Headset', category: 'Landing page', labelEn: 'Why us / footer — Support', labelAr: 'الدعم الفني', pages: ['Platform landing'] },
  { key: landingIconKey('card'), defaultIcon: 'WalletCards', category: 'Landing page', labelEn: 'Footer — No credit card', labelAr: 'التذييل — بدون بطاقة', pages: ['Platform landing'] },
  { key: landingIconKey('zap'), defaultIcon: 'Zap', category: 'Landing page', labelEn: 'Footer — Fast setup', labelAr: 'التذييل — إعداد سريع', pages: ['Platform landing'] },
  { key: landingStatIconKey('centers'), defaultIcon: 'School2', category: 'Landing page', labelEn: 'Stat — Centers', labelAr: 'إحصائية — المراكز', pages: ['Platform landing'] },
  { key: landingStatIconKey('students'), defaultIcon: 'GraduationCap', category: 'Landing page', labelEn: 'Stat — Students', labelAr: 'إحصائية — الطلاب', pages: ['Platform landing'] },
  { key: landingStatIconKey('teachers'), defaultIcon: 'BookOpenCheck', category: 'Landing page', labelEn: 'Stat — Teachers', labelAr: 'إحصائية — المعلمون', pages: ['Platform landing'] },

  // Guide
  { key: guideRoleIconKey('admin'), defaultIcon: 'Shield', category: 'User guide', labelEn: 'Guide — Admin', labelAr: 'الدليل — الإدارة', pages: ['User guide'] },
  { key: guideRoleIconKey('teacher'), defaultIcon: 'BookOpen', category: 'User guide', labelEn: 'Guide — Teacher', labelAr: 'الدليل — المعلم', pages: ['User guide'] },
  { key: guideRoleIconKey('student'), defaultIcon: 'User', category: 'User guide', labelEn: 'Guide — Student', labelAr: 'الدليل — الطالب', pages: ['User guide'] },
  { key: guideRoleIconKey('parent'), defaultIcon: 'Users', category: 'User guide', labelEn: 'Guide — Parent', labelAr: 'الدليل — ولي الأمر', pages: ['User guide'] },

  // Platform nav
  nav('/platform', 'LayoutDashboard', 'Platform navigation', 'Platform dashboard', 'لوحة المنصة', ['Platform dashboard', 'Sidebar']),
  group('platform-tenant', 'Globe', 'Platform navigation', 'Group — Platform', 'مجموعة — المنصة', ['Sidebar']),
  nav('/platform/tenants', 'Globe', 'Platform navigation', 'Tenants', 'المستأجرون', ['Platform dashboard', 'Sidebar']),
  nav('/platform/subscriptions', 'DollarSign', 'Platform navigation', 'Subscriptions', 'الاشتراكات', ['Platform dashboard', 'Sidebar']),
  nav('/platform/students', 'GraduationCap', 'Platform navigation', 'Platform students', 'طلاب المنصة', ['Platform dashboard', 'Sidebar']),
  nav('/platform/parents', 'UserCircle', 'Platform navigation', 'Platform parents', 'أولياء المنصة', ['Platform dashboard', 'Sidebar']),
  group('platform-locations', 'MapPin', 'Platform navigation', 'Group — Locations', 'مجموعة — المواقع', ['Sidebar']),
  nav('/platform/governorates', 'MapPin', 'Platform navigation', 'Governorates', 'المحافظات', ['Sidebar']),
  nav('/platform/cities', 'MapPin', 'Platform navigation', 'Cities', 'المدن', ['Sidebar']),
  nav('/platform/areas', 'MapPin', 'Platform navigation', 'Areas', 'المناطق', ['Sidebar']),
  group('platform-access', 'Shield', 'Platform navigation', 'Group — Access', 'مجموعة — الوصول', ['Sidebar']),
  nav('/platform/users', 'Users', 'Platform navigation', 'Platform users', 'مستخدمو المنصة', ['Sidebar']),
  nav('/platform/roles', 'Settings', 'Platform navigation', 'Platform roles', 'أدوار المنصة', ['Sidebar']),
  nav('/platform/logs', 'Activity', 'Platform navigation', 'Activity logs', 'سجل النشاط', ['Sidebar']),
  nav('/developer/settings', 'Palette', 'Developer navigation', 'Appearance', 'المظهر', ['Developer sidebar']),
  nav('/developer/icons', 'Shapes', 'Developer navigation', 'Icons', 'الأيقونات', ['Developer sidebar']),
  nav('/developer/testing', 'TestTube2', 'Developer navigation', 'Testing', 'الاختبار', ['Developer sidebar']),
  nav('/developer/documentation', 'BookOpen', 'Developer navigation', 'Documentation', 'التوثيق', ['Developer sidebar']),

  // Admin nav
  nav('/admin', 'LayoutDashboard', 'Admin navigation', 'Admin dashboard', 'لوحة الإدارة', ['Admin dashboard', 'Sidebar']),
  nav('/admin/todos', 'ListTodo', 'Admin navigation', 'To-do list', 'قائمة المهام', ['Admin dashboard', 'Sidebar']),
  nav('/admin/notes', 'NotebookPen', 'Admin navigation', 'Notes', 'الملاحظات', ['Admin dashboard', 'Sidebar']),
  group('admin-people', 'Users', 'Admin navigation', 'Group — People', 'مجموعة — مستخدمين النظام', ['Sidebar']),
  nav('/admin/students', 'GraduationCap', 'Admin navigation', 'Students', 'الطلاب', ['Admin dashboard', 'Sidebar']),
  nav('/admin/teachers', 'Users', 'Admin navigation', 'Teachers', 'المعلمون', ['Admin dashboard', 'Sidebar']),
  nav('/admin/parents', 'UserCircle', 'Admin navigation', 'Parents', 'أولياء الأمور', ['Admin dashboard', 'Sidebar']),
  group('admin-structure', 'Layers', 'Admin navigation', 'Group — Structure', 'مجموعة — المراحل والفصول', ['Sidebar']),
  nav('/admin/grades', 'BookOpen', 'Admin navigation', 'Grades', 'المراحل', ['Admin dashboard', 'Sidebar']),
  nav('/admin/classes', 'BookOpen', 'Admin navigation', 'Classes', 'الفصول', ['Admin dashboard', 'Sidebar']),
  nav('/admin/sections', 'Users', 'Admin navigation', 'Sections', 'المجموعات', ['Admin dashboard', 'Sidebar']),
  group('admin-curriculum', 'BookMarked', 'Admin navigation', 'Group — Curriculum', 'مجموعة — المناهج والواجبات', ['Sidebar']),
  nav('/admin/units', 'BookOpen', 'Admin navigation', 'Units', 'الوحدات', ['Admin dashboard', 'Sidebar']),
  nav('/admin/lessons', 'FileText', 'Admin navigation', 'Lessons', 'الدروس', ['Admin dashboard', 'Sidebar']),
  nav('/admin/questions', 'HelpCircle', 'Admin navigation', 'Questions', 'الأسئلة', ['Admin dashboard', 'Sidebar']),
  nav('/admin/exam-bank', 'ClipboardList', 'Admin navigation', 'Exam bank', 'الاختبارات', ['Admin dashboard', 'Sidebar']),
  nav('/admin/homework', 'ClipboardList', 'Admin navigation', 'Homework', 'الواجبات', ['Admin dashboard', 'Sidebar']),
  nav('/admin/library', 'Library', 'Admin navigation', 'Library', 'المكتبة', ['Admin dashboard', 'Sidebar']),
  group('admin-sessions', 'CalendarCheck', 'Admin navigation', 'Group — Sessions', 'مجموعة — الحصص', ['Sidebar']),
  nav('/admin/sessions', 'Video', 'Admin navigation', 'Scheduled sessions', 'جميع الحصص', ['Admin dashboard', 'Sidebar']),
  group('admin-classroom', 'ClipboardCheck', 'Admin navigation', 'Group — Classroom', 'مجموعة — الحضور والاختبارات', ['Sidebar']),
  nav('/admin/attendance', 'CalendarCheck', 'Admin navigation', 'Attendance', 'الحضور', ['Admin dashboard', 'Sidebar']),
  nav('/admin/exams', 'ClipboardList', 'Admin navigation', 'Exam degrees', 'درجات الامتحانات', ['Admin dashboard', 'Sidebar']),
  nav('/admin/quizzes', 'ClipboardList', 'Admin navigation', 'Quiz degrees', 'درجات الاختبارات', ['Admin dashboard', 'Sidebar']),
  group('admin-finance', 'CircleDollarSign', 'Admin navigation', 'Group — Finance', 'مجموعة — الحسابات', ['Sidebar']),
  nav('/admin/fees', 'DollarSign', 'Admin navigation', 'Fees', 'المصاريف', ['Admin dashboard', 'Sidebar']),
  nav('/admin/payments', 'DollarSign', 'Admin navigation', 'Payments', 'دفع المصاريف', ['Admin dashboard', 'Sidebar']),
  group('admin-content', 'FolderOpen', 'Admin navigation', 'Group — Content', 'مجموعة — المحتوى والتواصل', ['Sidebar']),
  nav('/admin/announcements', 'MessageSquare', 'Admin navigation', 'Announcements', 'الإعلانات', ['Admin dashboard', 'Sidebar']),
  nav('/admin/chat', 'MessageCircle', 'Admin navigation', 'Chat', 'المحادثات', ['Admin dashboard', 'Sidebar']),
  nav('/admin/notifications', 'Bell', 'Admin navigation', 'Notifications', 'الإشعارات', ['Admin dashboard', 'Sidebar']),
  nav('/admin/whatsapp', 'MessageCircle', 'Admin navigation', 'WhatsApp', 'واتساب', ['Admin dashboard', 'Sidebar']),
  nav('/admin/certifications', 'Award', 'Admin navigation', 'Certifications', 'الشهادات', ['Admin dashboard', 'Sidebar']),
  nav('/admin/landing', 'Layout', 'Admin navigation', 'Landing pages', 'صفحات الهبوط', ['Admin dashboard', 'Sidebar']),
  group('admin-insights', 'PieChart', 'Admin navigation', 'Group — Reports', 'مجموعة — التقارير', ['Sidebar']),
  nav('/admin/reports', 'FileText', 'Admin navigation', 'Reports summary', 'ملخص التقارير', ['Admin dashboard', 'Sidebar']),
  nav('/admin/reports/attendance', 'CalendarCheck', 'Admin navigation', 'Attendance reports', 'تقارير الحضور', ['Admin dashboard', 'Sidebar']),
  nav('/admin/reports/exams', 'ClipboardList', 'Admin navigation', 'Exam reports', 'تقارير الامتحانات', ['Admin dashboard', 'Sidebar']),
  nav('/admin/reports/quizzes', 'ClipboardCheck', 'Admin navigation', 'Quiz reports', 'تقارير الاختبارات', ['Admin dashboard', 'Sidebar']),
  nav('/admin/reports/payments', 'DollarSign', 'Admin navigation', 'Payment reports', 'تقارير المدفوعات', ['Admin dashboard', 'Sidebar']),
  group('admin-system', 'SlidersHorizontal', 'Admin navigation', 'Group — Administration', 'مجموعة — الإدارة', ['Sidebar']),
  nav('/admin/users', 'Users', 'Admin navigation', 'Admin users', 'المستخدمون', ['Admin dashboard', 'Sidebar']),
  nav('/admin/roles', 'Shield', 'Admin navigation', 'Roles & permissions', 'الأدوار والصلاحيات', ['Admin dashboard', 'Sidebar']),
  nav('/admin/settings', 'Settings', 'Admin navigation', 'Settings', 'الإعدادات', ['Admin dashboard', 'Sidebar']),

  // Teacher
  nav('/teacher', 'LayoutDashboard', 'Teacher navigation', 'Teacher dashboard', 'لوحة المعلم', ['Teacher dashboard', 'Sidebar']),
  nav('/teacher/todos', 'ListTodo', 'Teacher navigation', 'To-do list', 'قائمة المهام', ['Teacher dashboard', 'Sidebar']),
  nav('/teacher/notes', 'NotebookPen', 'Teacher navigation', 'Notes', 'الملاحظات', ['Teacher dashboard', 'Sidebar']),
  group('teacher-teaching', 'BookOpen', 'Teacher navigation', 'Group — Teaching', 'مجموعة — التدريس', ['Sidebar']),
  nav('/teacher/classes', 'BookOpen', 'Teacher navigation', 'My classes', 'صفوفي', ['Teacher dashboard', 'Sidebar']),
  nav('/teacher/sessions', 'Video', 'Teacher navigation', 'Sessions', 'الحصص', ['Teacher dashboard', 'Sidebar']),
  nav('/teacher/attendance', 'CalendarCheck', 'Teacher navigation', 'Attendance', 'الحضور', ['Teacher dashboard', 'Sidebar']),
  nav('/teacher/homework', 'FileText', 'Teacher navigation', 'Homework', 'الواجبات', ['Teacher dashboard', 'Sidebar']),
  group('teacher-assessment', 'ClipboardList', 'Teacher navigation', 'Group — Assessment', 'مجموعة — التقييم', ['Sidebar']),
  nav('/teacher/exams', 'ClipboardList', 'Teacher navigation', 'Exams', 'الاختبارات', ['Teacher dashboard', 'Sidebar']),
  nav('/teacher/quizzes', 'ClipboardList', 'Teacher navigation', 'Quizzes', 'الاختبارات القصيرة', ['Teacher dashboard', 'Sidebar']),
  group('teacher-resources', 'Library', 'Teacher navigation', 'Group — Resources', 'مجموعة — الموارد', ['Sidebar']),
  nav('/teacher/library', 'Library', 'Teacher navigation', 'Library', 'المكتبة', ['Teacher dashboard', 'Sidebar']),
  nav('/teacher/chat', 'MessageCircle', 'Teacher navigation', 'Chat', 'المحادثات', ['Teacher dashboard', 'Sidebar']),

  // Student
  nav('/student', 'LayoutDashboard', 'Student navigation', 'Student dashboard', 'لوحة الطالب', ['Student dashboard', 'Sidebar']),
  nav('/student/todos', 'ListTodo', 'Student navigation', 'To-do list', 'قائمة المهام', ['Student dashboard', 'Sidebar']),
  nav('/student/notes', 'NotebookPen', 'Student navigation', 'Notes', 'الملاحظات', ['Student dashboard', 'Sidebar']),
  nav('/student/sessions', 'BookOpen', 'Student navigation', 'Sessions', 'الحصص', ['Student dashboard', 'Sidebar']),
  nav('/student/attendance', 'CalendarCheck', 'Student navigation', 'Attendance', 'الحضور', ['Student dashboard', 'Sidebar']),
  nav('/student/attendance/check-in', 'ScanLine', 'Student navigation', 'QR check-in', 'تسجيل حضور QR', ['Student dashboard', 'Sidebar']),
  nav('/student/exams', 'GraduationCap', 'Student navigation', 'Exams', 'الاختبارات', ['Student dashboard', 'Sidebar']),
  nav('/student/quizzes', 'ClipboardList', 'Student navigation', 'Quizzes', 'الاختبارات القصيرة', ['Student dashboard', 'Sidebar']),
  nav('/student/homework', 'FileText', 'Student navigation', 'Homework', 'الواجبات', ['Student dashboard', 'Sidebar']),
  nav('/student/library', 'Library', 'Student navigation', 'Library', 'المكتبة', ['Student dashboard', 'Sidebar']),
  nav('/student/certifications', 'Award', 'Student navigation', 'Certifications', 'الشهادات', ['Student dashboard', 'Sidebar']),
  nav('/student/chat', 'MessageCircle', 'Student navigation', 'Chat', 'المحادثات', ['Student dashboard', 'Sidebar']),

  // Parent
  nav('/parent', 'LayoutDashboard', 'Parent navigation', 'Parent dashboard', 'لوحة ولي الأمر', ['Parent dashboard', 'Sidebar']),
  nav('/parent/children', 'Users', 'Parent navigation', 'Children', 'الأبناء', ['Parent dashboard', 'Sidebar']),
  nav('/parent/attendance', 'CalendarCheck', 'Parent navigation', 'Attendance', 'الحضور', ['Parent dashboard', 'Sidebar']),
  nav('/parent/fees', 'DollarSign', 'Parent navigation', 'Fees', 'الرسوم', ['Parent dashboard', 'Sidebar']),
  nav('/parent/exams', 'ClipboardList', 'Parent navigation', 'Exams', 'الاختبارات', ['Parent dashboard', 'Sidebar']),
  nav('/parent/quizzes', 'ClipboardList', 'Parent navigation', 'Quizzes', 'الاختبارات القصيرة', ['Parent dashboard', 'Sidebar']),
  nav('/parent/reports', 'FileText', 'Parent navigation', 'Reports', 'التقارير', ['Parent dashboard', 'Sidebar']),
  nav('/parent/chat', 'MessageCircle', 'Parent navigation', 'Chat', 'المحادثات', ['Parent dashboard', 'Sidebar']),
];

export const UI_ICON_BY_KEY = new Map(UI_ICONS.map(icon => [icon.key, icon]));

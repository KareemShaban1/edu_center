export type ManualTestRole =
  | 'public'
  | 'auth'
  | 'admin'
  | 'teacher'
  | 'student'
  | 'parent'
  | 'platform'
  | 'developer'
  | 'cross-cutting';

export interface ManualTestCase {
  id: string;
  titleEn: string;
  titleAr: string;
  stepsEn: string;
  stepsAr: string;
  expectedEn: string;
  expectedAr: string;
}

export interface ManualTestSection {
  id: string;
  role: ManualTestRole;
  titleEn: string;
  titleAr: string;
  cases: ManualTestCase[];
}

function c(
  id: string,
  titleEn: string,
  titleAr: string,
  stepsEn: string,
  stepsAr: string,
  expectedEn: string,
  expectedAr: string,
): ManualTestCase {
  return { id, titleEn, titleAr, stepsEn, stepsAr, expectedEn, expectedAr };
}

export const MANUAL_TEST_PLAN: ManualTestSection[] = [
  {
    id: 'public',
    role: 'public',
    titleEn: 'Public & marketing',
    titleAr: 'الصفحات العامة',
    cases: [
      c('PUB-01', 'Landing page loads', 'تحميل الصفحة الرئيسية', 'Open /', 'افتح /', 'Hero, features, stats, and CTAs render', 'تظهر المقدمة والميزات والإحصائيات وأزرار الإجراء'),
      c('PUB-02', 'Landing language switch', 'تبديل لغة الصفحة الرئيسية', 'Switch EN/AR on landing', 'بدّل بين الإنجليزية والعربية', 'English LTR and Arabic RTL with no overlap', 'الإنجليزية LTR والعربية RTL بدون تداخل'),
      c('PUB-03', 'User guide', 'دليل المستخدم', 'Open /guide', 'افتح /guide', 'Guide loads; role sections readable', 'يظهر الدليل وأقسام الأدوار بشكل واضح'),
      c('PUB-04', 'Center registration', 'تسجيل مركز', 'Open /center/register and submit empty then valid', 'افتح /center/register', 'Required fields validate; success creates a center', 'التحقق من الحقول المطلوبة'),
      c('PUB-05', 'Student and parent register', 'تسجيل طالب وولي أمر', 'Open /student/register and /parent/register', 'افتح صفحتي التسجيل', 'Forms and academic selectors work', 'النماذج ومحددات المرحلة تعمل'),
      c('PUB-06', 'Public landing URL', 'رابط الصفحة العامة', 'Open published /p/{slug}', 'افتح رابط صفحة منشورة', 'Published page renders; unpublished is hidden', 'الصفحة المنشورة تظهر وغير المنشورة لا تظهر'),
      c('PUB-07', 'Tenant login CTA', 'رابط دخول المستأجر', 'Click tenant login from landing', 'اضغط دخول المركز', 'Lands on /{tenantSlug}/login', 'ينتقل إلى صفحة دخول المركز'),
      c('PUB-08', 'Landing mobile layout', 'تخطيط الجوال', 'Resize to mobile width', 'صغّر العرض للجوال', 'Layout stacks; menus usable', 'التخطيط يتراص والقوائم قابلة للاستخدام'),
    ],
  },
  {
    id: 'auth',
    role: 'auth',
    titleEn: 'Authentication',
    titleAr: 'المصادقة',
    cases: [
      c('AUTH-01', 'Admin login', 'دخول المدير', 'Sign in at /{tenant}/login as admin', 'سجّل كمدير', 'Lands on /admin', 'ينتقل إلى /admin'),
      c('AUTH-02', 'Teacher login', 'دخول المعلم', 'Sign in as teacher', 'سجّل كمعلم', 'Lands on /teacher', 'ينتقل إلى /teacher'),
      c('AUTH-03', 'Student login', 'دخول الطالب', 'Sign in at /student/login', 'سجّل من /student/login', 'Lands on /student', 'ينتقل إلى /student'),
      c('AUTH-04', 'Parent login', 'دخول ولي الأمر', 'Sign in at /parent/login', 'سجّل من /parent/login', 'Lands on /parent', 'ينتقل إلى /parent'),
      c('AUTH-05', 'Platform login', 'دخول المنصة', 'Access password + platform account', 'كلمة مرور البوابة ثم الحساب', 'Lands on /platform', 'ينتقل إلى /platform'),
      c('AUTH-06', 'Developer login', 'دخول المطور', 'Open /developer/login', 'افتح /developer/login', 'Lands on /developer', 'ينتقل إلى /developer'),
      c('AUTH-07', 'Wrong password', 'كلمة مرور خاطئة', 'Submit invalid password', 'أدخل كلمة مرور خاطئة', 'Error; stay on login', 'رسالة خطأ والبقاء في الدخول'),
      c('AUTH-08', 'Empty login fields', 'حقول فارغة', 'Submit empty form', 'أرسل النموذج فارغاً', 'Validation; no crash', 'تحقق دون توقف'),
      c('AUTH-09', 'Multi-center membership pick', 'اختيار عضوية متعددة', 'Student/parent with several centers picks one', 'اختر مركزاً من عدة مراكز', 'Selected center data loads', 'بيانات المركز المختار تظهر'),
      c('AUTH-10', 'Switch center', 'تبديل المركز', 'Switch center after login', 'بدّل المركز بعد الدخول', 'Data refreshes for the new center', 'تتحدث البيانات للمركز الجديد'),
      c('AUTH-11', 'Logout', 'تسجيل الخروج', 'Logout from each portal', 'اخرج من كل بوابة', 'Matching login; /api/user is 401', 'يعود للدخول و/api/user يعطي 401'),
      c('AUTH-12', 'Logged-out admin URL', 'رابط الإدارة بدون جلسة', 'Visit /admin logged out', 'افتح /admin بدون دخول', 'Redirect to tenant login', 'تحويل لصفحة دخول المركز'),
      c('AUTH-13', 'Center admin on platform', 'مدير مركز في المنصة', 'Visit /platform as center admin', 'افتح /platform كمدير مركز', 'Blocked or redirected', 'يُمنع أو يُحوَّل'),
      c('AUTH-14', 'Platform gate password', 'كلمة مرور بوابة المنصة', 'Enter incorrect access password', 'أدخل كلمة مرور وصول خاطئة', 'Access denied', 'يُرفض الوصول'),
    ],
  },
  {
    id: 'admin-people',
    role: 'admin',
    titleEn: 'Admin — people',
    titleAr: 'الإدارة — المستخدمون',
    cases: [
      c('ADM-STU-01', 'Students list', 'قائمة الطلاب', 'Open /admin/students', 'افتح /admin/students', 'List loads; search works', 'القائمة تظهر والبحث يعمل'),
      c('ADM-STU-02', 'Create student', 'إنشاء طالب', 'Create a student with required fields', 'أنشئ طالباً', 'Student appears in the list', 'يظهر في القائمة'),
      c('ADM-STU-03', 'Student detail', 'تفاصيل الطالب', 'Open /admin/students/:id', 'افتح صفحة الطالب', 'Profile and related data show', 'الملف والبيانات المرتبطة تظهر'),
      c('ADM-STU-04', 'Edit / assign center', 'تعديل وتعيين مركز', 'Edit student; assign/unassign center', 'عدّل وعيّن/ألغِ المركز', 'Changes persist; other centers unchanged', 'الحفظ يتم دون تسريب لمراكز أخرى'),
      c('ADM-TCH-01', 'Create teacher', 'إنشاء معلم', 'Open /admin/teachers and create', 'أنشئ معلماً', 'Teacher listed', 'يظهر المعلم'),
      c('ADM-TCH-02', 'Edit teacher', 'تعديل معلم', 'Edit teacher', 'عدّل المعلم', 'Updates save', 'يُحفظ التعديل'),
      c('ADM-PAR-01', 'Create parent', 'إنشاء ولي أمر', 'Open /admin/parents and create', 'أنشئ ولي أمر', 'Parent listed and linked if provided', 'يظهر ويُربط بالأبناء إن وُجد'),
      c('ADM-PAR-02', 'Edit parent', 'تعديل ولي أمر', 'Edit parent', 'عدّل ولي الأمر', 'Updates save', 'يُحفظ التعديل'),
    ],
  },
  {
    id: 'admin-structure',
    role: 'admin',
    titleEn: 'Admin — academic structure',
    titleAr: 'الإدارة — الهيكل الأكاديمي',
    cases: [
      c('ADM-GRD-01', 'Grades CRUD', 'المراحل', 'Create / edit / delete a grade', 'أنشئ وعدّل واحذف مرحلة', 'CRUD works; in-use delete is blocked or warned', 'العملية تتم مع حماية الحذف'),
      c('ADM-CLS-01', 'Classes CRUD', 'الفصول', 'Create / edit / delete a class', 'أنشئ فصلاً', 'Class belongs to a grade', 'الفصل يرتبط بمرحلة'),
      c('ADM-SEC-01', 'Sections CRUD', 'المجموعات', 'Create / edit / delete a section', 'أنشئ مجموعة', 'Section belongs to class; teachers assignable', 'المجموعة ترتبط بفصل ويمكن تعيين معلمين'),
      c('ADM-SEC-02', 'Section sessions', 'حصص المجموعة', 'Open /admin/sections/:id/sessions', 'افتح حصص المجموعة', 'Sessions list; generate/create works', 'القائمة والإنشاء يعملان'),
    ],
  },
  {
    id: 'admin-curriculum',
    role: 'admin',
    titleEn: 'Admin — curriculum & homework',
    titleAr: 'الإدارة — المناهج والواجبات',
    cases: [
      c('ADM-UNT-01', 'Units', 'الوحدات', 'Create / edit a unit with media', 'أنشئ وحدة', 'Unit saved', 'تُحفظ الوحدة'),
      c('ADM-LSN-01', 'Lessons', 'الدروس', 'Create / edit a lesson', 'أنشئ درساً', 'Lesson saved', 'يُحفظ الدرس'),
      c('ADM-QST-01', 'Questions', 'الأسئلة', 'Create a question with answers', 'أنشئ سؤالاً', 'Question saved', 'يُحفظ السؤال'),
      c('ADM-QST-02', 'Bulk questions', 'أسئلة مجمعة', 'Use /admin/questions/bulk', 'استخدم الإدخال المجمّع', 'Items appear in the bank', 'تظهر في بنك الأسئلة'),
      c('ADM-EXB-01', 'Exam bank create', 'إنشاء اختبار', 'Create an exam in /admin/exam-bank', 'أنشئ اختباراً', 'Exam listed', 'يظهر الاختبار'),
      c('ADM-EXB-02', 'Exam builder', 'منشئ الاختبار', 'Open builder; add/reorder questions', 'افتح المنشئ', 'Order and layout save', 'يُحفظ الترتيب'),
      c('ADM-EXB-03', 'Exam export', 'تصدير الاختبار', 'Export PDF/Word', 'صدّر PDF أو ورد', 'File downloads', 'يتم التنزيل'),
      c('ADM-EXB-04', 'Generate exam', 'توليد اختبار', 'Generate from the bank', 'ولّد من البنك', 'Generated exam appears', 'يظهر الاختبار المولَّد'),
      c('ADM-HW-01', 'Create homework', 'إنشاء واجب', 'Create homework', 'أنشئ واجباً', 'Listed for the section', 'يظهر للمجموعة'),
      c('ADM-HW-02', 'Review submissions', 'مراجعة التسليمات', 'Open review page', 'افتح المراجعة', 'Submissions list', 'تظهر التسليمات'),
      c('ADM-HW-03', 'Homework remarks', 'ملاحظات الواجب', 'Open remarks for a submission', 'افتح الملاحظات', 'Correction saves', 'تُحفظ التصحيحات'),
      c('ADM-LIB-01', 'Library CRUD', 'المكتبة', 'Add / update / delete a library item', 'أضف عنصراً', 'Item listed; file/link opens', 'يظهر ويفتح الرابط'),
    ],
  },
  {
    id: 'admin-sessions',
    role: 'admin',
    titleEn: 'Admin — sessions',
    titleAr: 'الإدارة — الحصص',
    cases: [
      c('ADM-SES-01', 'Sessions list', 'قائمة الحصص', 'Open /admin/sessions', 'افتح الحصص', 'Date, section, teacher show', 'التاريخ والمجموعة والمعلم تظهر'),
      c('ADM-SES-02', 'Create/generate sessions', 'إنشاء حصص', 'Create or generate sessions', 'أنشئ أو ولّد', 'New rows appear', 'تظهر صفوف جديدة'),
      c('ADM-SES-03', 'Edit/delete session', 'تعديل/حذف حصة', 'Edit or delete a session', 'عدّل أو احذف', 'Changes persist', 'يُحفظ التغيير'),
      c('ADM-SES-04', 'Attendance QR / venue', 'QR الحضور', 'Open QR and set venue', 'افتح QR وعيّن المكان', 'QR shows; venue saves', 'يظهر الرمز ويُحفظ المكان'),
    ],
  },
  {
    id: 'admin-classroom',
    role: 'admin',
    titleEn: 'Admin — attendance, exams, quizzes',
    titleAr: 'الإدارة — الحضور والاختبارات',
    cases: [
      c('ADM-ATT-01', 'Attendance hub', 'صفحة الحضور', 'Open /admin/attendance', 'افتح الحضور', 'Today/history links work', 'روابط اليوم والسجل تعمل'),
      c('ADM-ATT-02', 'Record attendance', 'تسجيل حضور', 'Record attendance for a date', 'سجّل حضوراً', 'Saves; history shows the date', 'يُحفظ ويظهر في السجل'),
      c('ADM-ATT-03', 'Reload attendance date', 'إعادة فتح التاريخ', 'Re-open the same date', 'أعد فتح نفس اليوم', 'Previous marks load', 'العلامات السابقة تظهر'),
      c('ADM-EXM-01', 'Exam degrees', 'درجات الامتحان', 'Record exam degrees', 'سجّل درجات', 'Scores save; history lists the date', 'تُحفظ وتظهر في السجل'),
      c('ADM-QZ-01', 'Quiz degrees', 'درجات الاختبار القصير', 'Record quiz degrees', 'سجّل درجات قصيرة', 'Scores save; history lists the date', 'تُحفظ وتظهر في السجل'),
    ],
  },
  {
    id: 'admin-finance',
    role: 'admin',
    titleEn: 'Admin — finance',
    titleAr: 'الإدارة — المالية',
    cases: [
      c('ADM-FEE-01', 'Fee types', 'أنواع الرسوم', 'Create / edit / delete a fee', 'أنشئ رسماً', 'Fee listed', 'يظهر الرسم'),
      c('ADM-PAY-01', 'Payments today', 'مدفوعات اليوم', 'Open section payments for today', 'افتح مدفوعات اليوم', 'Payment grid loads', 'تظهر شبكة الدفع'),
      c('ADM-PAY-02', 'Record payment', 'تسجيل دفعة', 'Record a payment', 'سجّل دفعة', 'Saved; reports include it', 'تُحفظ وتظهر في التقارير'),
      c('ADM-PAY-03', 'Payment history', 'سجل المدفوعات', 'Open section payment history', 'افتح السجل', 'Past dates listed', 'التواريخ السابقة تظهر'),
    ],
  },
  {
    id: 'admin-comms',
    role: 'admin',
    titleEn: 'Admin — communications & certifications',
    titleAr: 'الإدارة — التواصل والشهادات',
    cases: [
      c('ADM-ANN-01', 'Announcements', 'الإعلانات', 'Create / edit / delete an announcement', 'أنشئ إعلاناً', 'Listed; media optional', 'يظهر في القائمة'),
      c('ADM-CHAT-01', 'Chat', 'المحادثات', 'Open /admin/chat, start a DM or group, send text/emoji/image/voice', 'افتح المحادثات وأرسل رسالة', 'Message appears for the recipient', 'تظهر الرسالة للمستلم'),
      c('ADM-NTF-01', 'Send notification', 'إرسال إشعار', 'Send from /admin/notifications', 'أرسل إشعاراً', 'Admin list or recipients update', 'يظهر للمستلمين'),
      c('ADM-WA-01', 'WhatsApp templates', 'قوالب واتساب', 'CRUD templates', 'أنشئ قالباً', 'Template saved', 'يُحفظ القالب'),
      c('ADM-WA-02', 'WhatsApp send/status', 'إرسال واتساب', 'Prepare/send or check status', 'جهّز أو أرسل', 'No 500; clear error if unconfigured', 'لا خطأ 500'),
      c('ADM-CER-01', 'Certificate templates', 'قوالب الشهادات', 'Create/edit in the builder', 'أنشئ قالباً', 'Template saved', 'يُحفظ القالب'),
      c('ADM-CER-02', 'Issue certificate', 'إصدار شهادة', 'Prepare and issue', 'أصدر شهادة', 'Issued list updates', 'تظهر في الصادرة'),
      c('ADM-CER-03', 'Delete issued certificate', 'حذف شهادة صادرة', 'Delete an issued certificate', 'احذف شهادة', 'Removed from the list', 'تُحذف من القائمة'),
    ],
  },
  {
    id: 'admin-landing',
    role: 'admin',
    titleEn: 'Admin — landing pages',
    titleAr: 'الإدارة — صفحات الهبوط',
    cases: [
      c('ADM-LND-01', 'Create landing page', 'إنشاء صفحة', 'Create from blank/template/teacher', 'أنشئ صفحة', 'Page listed', 'تظهر في القائمة'),
      c('ADM-LND-02', 'Landing builder', 'محرر الصفحة', 'Edit sections and save', 'عدّل واحفظ', 'Preview matches builder', 'المعاينة تطابق المحرر'),
      c('ADM-LND-03', 'Publish/unpublish', 'نشر/إلغاء نشر', 'Publish then unpublish', 'انشر ثم ألغِ', 'Public URL only when published', 'الرابط العام يعمل عند النشر فقط'),
      c('ADM-LND-04', 'Duplicate page', 'تكرار الصفحة', 'Duplicate a page', 'كرّر صفحة', 'Copy appears', 'تظهر نسخة'),
      c('ADM-LND-05', 'Restore revision', 'استعادة نسخة', 'Restore a revision', 'استعد نسخة سابقة', 'Content rolls back', 'يعود المحتوى'),
      c('ADM-LND-06', 'Landing analytics', 'تحليلات الصفحة', 'Open analytics', 'افتح التحليلات', 'Page loads (empty is OK)', 'الصفحة تفتح'),
      c('ADM-LND-07', 'Landing media', 'وسائط الصفحة', 'Upload / delete media', 'ارفع أو احذف', 'Library updates', 'تتحدث المكتبة'),
    ],
  },
  {
    id: 'admin-ops',
    role: 'admin',
    titleEn: 'Admin — reports, access, settings',
    titleAr: 'الإدارة — التقارير والصلاحيات',
    cases: [
      c('ADM-RPT-01', 'Reports index', 'فهرس التقارير', 'Open /admin/reports', 'افتح التقارير', 'Index loads', 'تظهر القائمة'),
      c('ADM-RPT-02', 'Attendance report', 'تقرير الحضور', 'Open attendance report and a section', 'افتح تقرير الحضور', 'Figures match recorded attendance', 'الأرقام تطابق التسجيل'),
      c('ADM-RPT-03', 'Payments report', 'تقرير المدفوعات', 'Open payments report', 'افتح تقرير المدفوعات', 'Figures match recorded payments', 'الأرقام تطابق الدفع'),
      c('ADM-RPT-04', 'Other report types', 'أنواع تقارير أخرى', 'Open /admin/reports/:type', 'افتح تقريراً آخر', 'Page loads without error', 'الصفحة تفتح دون خطأ'),
      c('ADM-USR-01', 'Admin users', 'مستخدمو الإدارة', 'CRUD a center user', 'أنشئ مستخدماً', 'New user can sign in', 'يمكنه تسجيل الدخول'),
      c('ADM-ROL-01', 'Roles & permissions', 'الأدوار والصلاحيات', 'Create a limited role', 'أنشئ دوراً محدوداً', 'Forbidden pages are 403/hidden', 'الصفحات الممنوعة تُحجب'),
      c('ADM-SET-01', 'Center settings', 'إعدادات المركز', 'Save settings', 'احفظ الإعدادات', 'Values persist after reload', 'القيم تبقى بعد التحديث'),
      c('ADM-TODO-01', 'Admin todos', 'مهام المدير', 'Create / complete / delete', 'أنشئ وأكمل واحذف', 'List updates', 'تتحدث القائمة'),
      c('ADM-NOTE-01', 'Admin notes', 'ملاحظات المدير', 'Create / edit / delete', 'أنشئ وعدّل واحذف', 'Notes persist', 'تُحفظ الملاحظات'),
    ],
  },
  {
    id: 'teacher',
    role: 'teacher',
    titleEn: 'Teacher portal',
    titleAr: 'بوابة المعلم',
    cases: [
      c('TCH-01', 'Teacher dashboard', 'لوحة المعلم', 'Open /teacher', 'افتح /teacher', 'Only assigned sections', 'المجموعات المعيَّنة فقط'),
      c('TCH-02', 'Teacher classes', 'فصول المعلم', 'Open /teacher/classes', 'افتح الفصول', 'Only this teacher’s classes', 'فصول هذا المعلم فقط'),
      c('TCH-03', 'Teacher sessions', 'حصص المعلم', 'List and edit allowed fields', 'اعرض وعدّل', 'No other teachers’ private data', 'بدون بيانات معلمين آخرين'),
      c('TCH-04', 'Teacher LiveKit', 'بث المعلم', 'Open a session LiveKit page', 'افتح البث', 'Token works or a clear error', 'الرمز يعمل أو خطأ واضح'),
      c('TCH-05', 'Teacher QR / venue', 'QR المعلم', 'Open QR and set venue', 'افتح QR', 'QR shows; venue saves', 'يظهر الرمز ويُحفظ المكان'),
      c('TCH-06', 'Teacher attendance', 'حضور المعلم', 'Record attendance', 'سجّل حضوراً', 'Own sections only', 'مجموعاته فقط'),
      c('TCH-07', 'Teacher exams/quizzes', 'درجات المعلم', 'Enter degrees', 'أدخل درجات', 'Own sections only', 'مجموعاته فقط'),
      c('TCH-08', 'Teacher homework', 'واجبات المعلم', 'Open homework', 'افتح الواجبات', 'Assigned homework visible', 'الواجبات المعيَّنة تظهر'),
      c('TCH-09', 'Teacher library', 'مكتبة المعلم', 'Open library', 'افتح المكتبة', 'Items visible', 'العناصر تظهر'),
      c('TCH-10', 'Teacher personal items', 'مهام وملاحظات المعلم', 'Todos and notes', 'المهام والملاحظات', 'Not shared with other users', 'غير مشتركة مع الآخرين'),
      c('TCH-11', 'Teacher chat', 'محادثات المعلم', 'Open /teacher/chat and message admin/student/parent', 'افتح المحادثات', 'Only center contacts', 'جهات المركز فقط'),
    ],
  },
  {
    id: 'student',
    role: 'student',
    titleEn: 'Student portal',
    titleAr: 'بوابة الطالب',
    cases: [
      c('STU-01', 'Student dashboard', 'لوحة الطالب', 'Open /student', 'افتح /student', 'Enrolled sections only', 'المجموعات المسجَّل بها فقط'),
      c('STU-02', 'Student sessions', 'حصص الطالب', 'Open /student/sessions', 'افتح الحصص', 'Courses URL redirects here', 'رابط المقررات يحوّل إلى هنا'),
      c('STU-03', 'Student LiveKit', 'بث الطالب', 'Join a live session', 'انضم لبث', 'Join works when configured', 'الانضمام يعمل عند الإعداد'),
      c('STU-04', 'Student attendance history', 'سجل حضور الطالب', 'Open attendance', 'افتح الحضور', 'Own records only', 'سجلّه فقط'),
      c('STU-05', 'Attendance check-in', 'تسجيل حضور بالطالب', 'Use /student/attendance/check-in', 'استخدم تسجيل الحضور', 'Accepted for a live session', 'يُقبل في حصة قائمة'),
      c('STU-06', 'Student grades', 'درجات الطالب', 'Open grades', 'افتح الدرجات', 'Scores visible', 'الدرجات تظهر'),
      c('STU-07', 'Student exams/quizzes', 'اختبارات الطالب', 'Open exams and quizzes', 'افتح الاختبارات', 'Own degrees only', 'درجاته فقط'),
      c('STU-08', 'Submit homework', 'تسليم واجب', 'Submit homework', 'سلّم واجباً', 'Submission appears', 'يظهر التسليم'),
      c('STU-09', 'Student library', 'مكتبة الطالب', 'Open library', 'افتح المكتبة', 'Allowed items open', 'العناصر المسموحة تفتح'),
      c('STU-10', 'Student certificates', 'شهادات الطالب', 'Open certifications', 'افتح الشهادات', 'Issued certificates listed', 'الشهادات الصادرة تظهر'),
      c('STU-11', 'Student personal items', 'مهام وملاحظات الطالب', 'Todos and notes', 'المهام والملاحظات', 'Personal only', 'شخصية فقط'),
      c('STU-12', 'Student chat', 'محادثات الطالب', 'Open /student/chat and message admin/teacher', 'افتح المحادثات', 'Cannot message students or parents', 'لا يمكن مراسلة الطلاب أو أولياء الأمور'),
    ],
  },
  {
    id: 'parent',
    role: 'parent',
    titleEn: 'Parent portal',
    titleAr: 'بوابة ولي الأمر',
    cases: [
      c('PAR-01', 'Parent dashboard', 'لوحة ولي الأمر', 'Open /parent', 'افتح /parent', 'Summarises linked children', 'ملخص الأبناء المرتبطين'),
      c('PAR-02', 'Children list', 'قائمة الأبناء', 'Open /parent/children', 'افتح الأبناء', 'No unrelated students', 'بدون طلاب غير مرتبطين'),
      c('PAR-03', 'Parent attendance', 'حضور الأبناء', 'Open attendance', 'افتح الحضور', 'Attendance per child', 'حضور كل ابن'),
      c('PAR-04', 'Parent exams/quizzes', 'درجات الأبناء', 'Open exams and quizzes', 'افتح الاختبارات', 'Degrees per child', 'درجات كل ابن'),
      c('PAR-05', 'Parent fees', 'رسوم الأبناء', 'Open fees', 'افتح الرسوم', 'Fees/payments for linked children', 'رسوم الأبناء المرتبطين'),
      c('PAR-06', 'Parent reports', 'تقارير ولي الأمر', 'Open reports', 'افتح التقارير', 'Views load', 'الصفحات تفتح'),
      c('PAR-07', 'Parent chat', 'محادثات ولي الأمر', 'Open /parent/chat and message admin/teacher', 'افتح المحادثات', 'Cannot create groups', 'لا يمكن إنشاء مجموعات'),
    ],
  },
  {
    id: 'platform',
    role: 'platform',
    titleEn: 'Platform operator',
    titleAr: 'مشغّل المنصة',
    cases: [
      c('PLT-01', 'Platform dashboard', 'لوحة المنصة', 'Open /platform', 'افتح /platform', 'Stats, tenants, activity, links', 'إحصائيات وروابط'),
      c('PLT-02', 'Create tenant', 'إنشاء مركز', 'Create a center', 'أنشئ مركزاً', 'Admin can log in at its slug', 'يمكن دخول المدير عبر الرمز'),
      c('PLT-03', 'Edit tenant', 'تعديل مركز', 'Edit or deactivate a tenant', 'عدّل مركزاً', 'List updates; isolation holds', 'التحديث يتم مع بقاء العزل'),
      c('PLT-04', 'Subscriptions', 'الاشتراكات', 'CRUD subscriptions', 'أضف اشتراكاً', 'Rows save', 'تُحفظ الصفوف'),
      c('PLT-05', 'Platform students', 'طلاب المنصة', 'Open directory and a detail', 'افتح الدليل', 'Student detail opens', 'تفاصيل الطالب تفتح'),
      c('PLT-06', 'Platform parents', 'أولياء المنصة', 'Open directory and a detail', 'افتح الدليل', 'Parent detail opens', 'تفاصيل ولي الأمر تفتح'),
      c('PLT-07', 'Governorates', 'المحافظات', 'CRUD governorates', 'أضف محافظة', 'Used by city forms', 'تُستخدم في المدن'),
      c('PLT-08', 'Cities', 'المدن', 'CRUD cities', 'أضف مدينة', 'City belongs to a governorate', 'المدينة تتبع محافظة'),
      c('PLT-09', 'Areas', 'المناطق', 'CRUD areas', 'أضف منطقة', 'Area belongs to a city', 'المنطقة تتبع مدينة'),
      c('PLT-10', 'Platform users', 'مستخدمو المنصة', 'CRUD a platform user', 'أنشئ مستخدماً', 'User can sign in', 'يمكنه الدخول'),
      c('PLT-11', 'Platform roles', 'أدوار المنصة', 'Open /platform/roles', 'افتح الأدوار', 'Roles listed', 'تظهر الأدوار'),
      c('PLT-12', 'Activity logs', 'سجل النشاط', 'Open /platform/logs', 'افتح السجل', 'Log loads', 'السجل يظهر'),
    ],
  },
  {
    id: 'developer',
    role: 'developer',
    titleEn: 'Developer portal',
    titleAr: 'بوابة المطور',
    cases: [
      c('DEV-01', 'Developer overview', 'نظرة المطور', 'Open /developer', 'افتح /developer', 'Manifest stats load', 'الإحصائيات تظهر'),
      c('DEV-02', 'API explorer', 'مستكشف API', 'Send a live request', 'أرسل طلباً', 'Response and logs update', 'الاستجابة والسجل يتحدثان'),
      c('DEV-03', 'Database catalog', 'فهرس قاعدة البيانات', 'Open /developer/database', 'افتح قاعدة البيانات', 'Schema catalog loads', 'المخطط يظهر'),
      c('DEV-04', 'Translations', 'الترجمات', 'Add/edit/delete a key', 'أضف مفتاحاً', 'UI string updates', 'النص يتحدث'),
      c('DEV-05', 'Website images', 'صور الموقع', 'Upload or reset an image', 'ارفع صورة', 'Image updates', 'الصورة تتحدث'),
      c('DEV-06', 'Appearance', 'المظهر', 'Open /developer/settings and save branding', 'افتح المظهر واحفظ', 'Public branding API updates', 'واجهة المظهر العامة تتحدث'),
      c('DEV-07', 'Icons', 'الأيقونات', 'Open /developer/icons; change and reset', 'افتح الأيقونات وغيّر ثم استعد', 'UI updates; reset restores default', 'الواجهة تتحدث'),
      c('DEV-08', 'Documentation', 'التوثيق', 'Open /developer/documentation', 'افتح التوثيق', 'Markdown renders', 'المحتوى يظهر'),
      c('DEV-09', 'Testing module', 'وحدة الاختبار', 'Open /developer/testing', 'افتح الاختبار', 'Manual, API, and automated tabs work', 'التبويبات الثلاثة تعمل'),
    ],
  },
  {
    id: 'cross-cutting',
    role: 'cross-cutting',
    titleEn: 'Cross-cutting',
    titleAr: 'اختبارات عامة',
    cases: [
      c('X-ISO-01', 'Center isolation (UI)', 'عزل المراكز', 'Create a student in center A', 'أنشئ طالباً في مركز أ', 'Not visible in center B', 'لا يظهر في مركز ب'),
      c('X-ISO-02', 'Center isolation (API)', 'عزل المراكز عبر API', 'Call admin API with wrong tenant slug', 'استدعِ API بمركز خاطئ', 'Error or empty scoped data', 'خطأ أو بيانات فارغة'),
      c('X-RBAC-01', 'RBAC delete guard', 'حماية الحذف', 'Use a limited admin', 'استخدم مديراً محدوداً', 'Delete hidden or 403', 'الحذف محجوب أو 403'),
      c('X-I18N-01', 'Dashboard locale', 'لغة اللوحات', 'Switch locale in each dashboard', 'بدّل اللغة', 'Arabic RTL / English LTR', 'عربية RTL وإنجليزية LTR'),
      c('X-PWA-01', 'PWA install', 'تثبيت التطبيق', 'Install in Chrome', 'ثبّت من كروم', 'Standalone; session survives reload', 'يفتح مستقلاً والجلسة تبقى'),
      c('X-NOTIF-01', 'Web push key', 'مفتاح الإشعارات', 'Check VAPID endpoint', 'افحص مفتاح VAPID', '200 or a clear disabled state', '200 أو حالة تعطيل واضحة'),
      c('X-404-01', 'Unknown route', 'مسار غير موجود', 'Open a bogus URL', 'افتح رابطاً خاطئاً', 'Not-found page', 'صفحة غير موجود'),
      c('X-PERS-01', 'Personal data isolation', 'عزل البيانات الشخصية', 'Compare todos/notes across users', 'قارن المهام بين مستخدمين', 'Isolated per user', 'معزولة لكل مستخدم'),
    ],
  },
];

export function listManualTestCases(): ManualTestCase[] {
  return MANUAL_TEST_PLAN.flatMap(section => section.cases);
}

export function countManualTestCases(): number {
  return listManualTestCases().length;
}

# برومبت Stitch AI — تصميم تطبيق EduCenter للموبايل

> **طريقة الاستخدام:** انسخ النص الموجود داخل قسم **البرومبت الجاهز للنسخ** والصقه في Stitch AI.  
> الهدف هو إنشاء تصميمات موبايل عالية الدقة لحسابات **الإدارة، المعلم، الطالب، وولي الأمر** مع نظام تصميم موحد وتجربة عربية RTL أولاً.

---

## البرومبت الجاهز للنسخ

```text
Act as a senior mobile product designer and UX architect specialized in Arabic education platforms.

Design a complete high-fidelity mobile application experience for “EduCenter”, a multi-tenant education-center management platform used in Egypt.

Create four connected role-based mobile experiences:
1. Admin / Assistant account
2. Teacher account
3. Student account
4. Parent account

The final designs must feel like one product with a shared design system, while each role has a distinct dashboard hierarchy and accent color.

==================================================
1. PRODUCT AND USER CONTEXT
==================================================

EduCenter manages:
- Students, teachers, parents, grades, classes, and sections
- Sessions and live online classes
- Attendance
- Exams and quizzes
- Homework and submissions
- Fees and payments
- Educational library
- Announcements and notifications
- Reports and certificates
- Personal to-do lists and private notes for admins, teachers, and students

Target users are Arabic-speaking educational centers in Egypt. Users range from experienced administrators to young students and parents with limited technical experience.

Primary goals:
- Make daily actions reachable in one or two taps
- Reduce cognitive load and typing
- Make important status, alerts, dates, and pending work immediately visible
- Preserve privacy between tenants and authenticated users
- Work well on low-to-mid-range Android devices

==================================================
2. MOBILE DESIGN REQUIREMENTS
==================================================

- Design mobile-first at 390 × 844 px, with responsive behavior for widths from 360 to 430 px.
- Arabic is the primary language.
- Use true RTL layout: navigation order, cards, icons, arrows, forms, tabs, and alignment must flow right-to-left.
- Include an English language switch, but show all mockups in Arabic.
- Respect Android and iOS safe areas.
- Use a sticky top app bar and role-specific bottom navigation.
- Bottom navigation should contain no more than five items; place remaining modules inside a clearly organized “المزيد” screen.
- Minimum touch target: 44 × 44 px.
- Minimum body text size: 14 px.
- Meet WCAG AA color contrast.
- Never depend on color alone to communicate status.
- Use skeleton loading, empty, offline, error, success, validation, and disabled states.
- Use confirmation dialogs for destructive actions.
- Design forms for thumb reach and one-handed use.
- Avoid desktop tables. Convert data into mobile cards, grouped lists, accordions, or focused row editors.
- Use sticky save/action bars for long forms.

==================================================
3. VISUAL DIRECTION
==================================================

Create a modern Egyptian education identity without tourist clichés.

Shared brand:
- Primary crimson: #BA181B
- Dark crimson: #660708
- Charcoal: #161A1D
- Warm off-white background: #FAF9F9
- White cards: #FFFFFF
- Success: #15803D
- Warning: #D97706
- Error: #DC2626
- Info: #2563EB

Role accents:
- Admin: crimson + charcoal — authoritative and operational
- Teacher: violet or indigo accent — focused and productive
- Student: turquoise or emerald accent — energetic and encouraging
- Parent: warm blue accent — calm, transparent, and trustworthy

Typography:
- Arabic: IBM Plex Sans Arabic, Noto Sans Arabic, or Cairo
- English: Inter
- Strong hierarchy with compact dashboard typography
- Use Arabic numerals consistently and format currency as “ج.م”

Style:
- Clean rounded cards, 14–18 px radius
- Subtle elevation and borders
- Light geometric education-inspired background motifs
- Clear icons with text labels
- Friendly illustrations only in empty states and onboarding
- Do not overuse gradients, glassmorphism, or decorative animation

==================================================
4. SHARED MOBILE APP SHELL
==================================================

Design these shared components:

1. Splash screen
   - EduCenter logo
   - Center name
   - Lightweight loading state

2. Authentication
   - Center login for admin and teacher
   - Student login
   - Parent login
   - Student and parent registration
   - Role selector
   - Email and password fields
   - Show/hide password
   - “تواصل مع خدمة العملاء”
   - Invalid credentials, loading, and success states

3. Top app bar
   - Page title
   - Notification bell with unread count
   - Profile avatar
   - Center switcher when the account belongs to multiple centers

4. Bottom navigation
   - Role-specific primary destinations
   - Active, inactive, and notification-badge states

5. “المزيد” menu
   - Group modules by clear categories
   - Search modules
   - Language, install app, help, and sign out

6. Shared UI patterns
   - Search
   - Filter bottom sheet
   - Date picker
   - Segmented tabs
   - Status chips
   - Empty states
   - Pull to refresh
   - Toast messages
   - Confirmation bottom sheets
   - File upload and preview
   - Notification center

==================================================
5. ADMIN / ASSISTANT MOBILE EXPERIENCE
==================================================

Admin objective: run the center quickly, identify issues, and complete high-volume operational tasks.

Recommended bottom navigation:
- الرئيسية
- الطلاب
- الحضور
- المدفوعات
- المزيد

Design these admin screens:

A. Admin dashboard
- Personalized greeting and center name
- KPI cards: total students, teachers, attendance rate, unpaid students, unpaid amount
- “إجراءات سريعة”: add student, record attendance, record payment, send announcement
- Today’s sessions timeline
- Unpaid fees alert card
- Recent students
- Latest announcements
- Compact links to personal tasks and notes

B. Students
- Search by name, phone, or student code
- Filters for grade, class, section, and status
- Student cards with avatar, code, section, parent phone, and payment status
- Student details with tabs: overview, attendance, grades, fees, homework
- Add/edit student as a step-based mobile form

C. Teachers and parents
- Searchable cards
- Assignment/status indicators
- Add and edit flows

D. Academic structure
- Drill-down flow: grades → classes → sections
- Section card shows teacher, student count, schedule, and quick actions

E. Attendance
- Select section and date
- Large attendance controls per student: حاضر، غائب، متأخر
- Bulk actions
- Unsaved-changes warning
- Sticky save bar
- Attendance history and summary

F. Exams and quizzes
- Select section and date
- Compact grade-entry cards
- Numeric keyboard optimization
- Progress indicator: entered / total
- Validation for maximum score

G. Fees and payments
- Student balance summary
- Paid, partial, and unpaid states
- Record payment bottom sheet
- Monthly summary
- Payment history and receipt action

H. Content and communication
- Announcements list and create flow
- Notification composer
- WhatsApp templates and recipient preview
- Library file list with upload progress

I. Reports
- Mobile report cards
- Date and section filters
- Simple charts with accessible labels
- Export/share actions

J. Personal productivity
- To-do list with active/completed tabs, priorities, due dates, and complete toggle
- Private notes with colors, pinning, search, edit, and delete

Admin states to show:
- No students yet
- Attendance saved successfully
- Payment validation error
- Offline while saving
- Permission denied for an assistant

==================================================
6. TEACHER MOBILE EXPERIENCE
==================================================

Teacher objective: see today’s work immediately and complete classroom actions with minimal taps.

Recommended bottom navigation:
- الرئيسية
- حصصي
- الحضور
- الواجبات
- المزيد

Design these teacher screens:

A. Teacher dashboard
- Greeting and current date
- Next session card with countdown and “دخول الحصة”
- Today’s schedule
- Assigned classes and total students
- Pending homework reviews
- Attendance average
- Recent exams and quizzes
- Personal task summary

B. My classes
- Class cards grouped by day
- Section details
- Student list
- Quick actions: attendance, homework, exam, message

C. Sessions and live class
- Upcoming, live, and completed tabs
- Join-live-class state
- Connection/loading/error states
- Minimal live-class controls suitable for mobile

D. Attendance
- Fast student status controls
- Remember last selection
- Bulk “تحديد الكل حاضر”
- Sticky save

E. Homework
- Create homework
- Title, instructions, due date, section, attachments
- Submission progress
- Student submission review
- Grade, feedback, approved/rejected state

F. Exams and quizzes
- Assessment list
- Mobile score entry
- Student result summary

G. Library
- Browse files
- Filter by type
- Preview and download

H. Personal productivity
- Teacher to-do list
- Private notes with pinning and colors

Teacher states to show:
- No classes assigned
- Live session starts soon
- Student has not submitted homework
- File upload progress
- Saved while connection is slow

==================================================
7. STUDENT MOBILE EXPERIENCE
==================================================

Student objective: understand what to do next, join classes, submit homework, and track progress.

Recommended bottom navigation:
- الرئيسية
- الحصص
- الواجبات
- الدرجات
- المزيد

Design these student screens:

A. Student dashboard
- Friendly greeting
- Next class card with join button
- Attendance percentage
- GPA / recent score
- Pending homework count
- Upcoming deadlines
- Achievement or progress card
- Center switcher for multi-center students

B. Sessions
- Today, upcoming, and completed tabs
- Session topic, teacher, time, and mode
- Join button only when available
- Calendar/list toggle

C. Homework
- Pending, submitted, and graded tabs
- Assignment details
- Due-date urgency
- Add note and upload files
- Upload progress
- Submitted confirmation
- Teacher feedback and grade

D. Attendance
- Monthly calendar
- Present, absent, and late legend
- Attendance trend and summary

E. Grades
- Subject cards
- Exams and quizzes tabs
- Score, total, percentage, date
- Progress chart with clear text alternative

F. Library and certificates
- Searchable learning resources
- File preview and download
- Certificate cards with preview and download

G. Personal productivity
- Student to-do list for study planning
- Private colored notes

Student states to show:
- No upcoming classes
- Homework overdue
- Upload failed and retry
- New grade available
- Certificate earned celebration

Use encouraging microcopy without making the interface childish.

==================================================
8. PARENT MOBILE EXPERIENCE
==================================================

Parent objective: monitor children transparently, switch between children easily, and understand attendance, grades, and fees.

Recommended bottom navigation:
- الرئيسية
- الأبناء
- الحضور
- الرسوم
- المزيد

Design these parent screens:

A. Parent dashboard
- Greeting
- Prominent child selector
- Each child’s attendance, outstanding fees, recent grades, and alerts
- Upcoming sessions or exams
- Important center announcements
- Multi-center switcher if children belong to different centers

B. Children
- Child profile cards
- Profile details
- Grade, class, and section
- Quick links to attendance, grades, and fees

C. Attendance
- Child selector fixed near the top
- Monthly calendar
- Present, absent, and late summary
- Clear absence alert

D. Exams and quizzes
- Subject results
- Score and percentage
- Comparison with previous result without ranking or shaming

E. Fees
- Total due, paid, and remaining
- Payment breakdown by child
- Due dates
- Payment history
- Receipt preview/download

F. Reports
- Combined attendance, academic, and financial overview
- Date range filter
- Download/share report

G. Announcements and notifications
- Read/unread states
- Center and child context
- Actionable alerts

Parent states to show:
- Parent has one child
- Parent has multiple children
- Children in multiple centers
- No outstanding fees
- Urgent absence notification

Use calm, transparent language. Avoid alarming parents unnecessarily.

==================================================
9. PROTOTYPE INTERACTIONS
==================================================

Show prototype connections for:
- Login → role dashboard
- Dashboard quick action → task form
- Search → filter bottom sheet → results
- Attendance edit → save → success
- Homework upload → progress → confirmation
- Parent child switcher → refreshed dashboard
- Notification tap → relevant detail screen
- Center switcher → loading → new center context
- Offline action → queued/retry state

Use subtle motion:
- 180–250 ms transitions
- Bottom sheets slide upward
- Cards use light pressed feedback
- Completion checkbox gives a small success animation
- Avoid long or distracting animation

==================================================
10. CONTENT AND SAMPLE DATA
==================================================

Use realistic Arabic sample data:
- Center: “مركز النور التعليمي”
- Admin: “أ. محمد حسن”
- Teacher: “أ. منى أحمد”
- Student: “كريم شعبان”
- Parent: “أحمد محمود”
- Sections: “الصف الأول الثانوي — مجموعة السبت والثلاثاء”
- Subjects: الرياضيات، اللغة العربية، اللغة الإنجليزية، الفيزياء
- Currency: ١٬٢٠٠ ج.م
- Dates: السبت، ١٨ يوليو ٢٠٢٦
- Times: ٤:٣٠ م

Do not use lorem ipsum.

==================================================
11. STITCH AI DELIVERABLES
==================================================

Generate:
1. A shared mobile design system page with colors, typography, spacing, icons, buttons, fields, cards, chips, tabs, bottom navigation, dialogs, and states.
2. Four clearly separated role flows: Admin, Teacher, Student, Parent.
3. High-fidelity mobile screens for every screen listed above.
4. Reusable components rather than disconnected one-off screens.
5. Light mode first.
6. Key empty, loading, error, offline, and success states.
7. Clickable prototype connections for the primary daily flows.
8. Developer-ready annotations for spacing, font sizes, component states, and responsive behavior.

Start with the shared design system, then generate the Admin flow, Teacher flow, Student flow, and Parent flow in that order.

Do not generate desktop layouts. Do not use left-to-right layouts for Arabic. Do not hide essential actions behind unlabeled icons. Do not use dense desktop tables inside a phone frame.
```

---

## تقسيم اختياري عند محدودية حجم البرومبت

إذا لم يستطع Stitch AI إنشاء كل الحسابات دفعة واحدة:

1. انسخ الأقسام **1–4 و9–11** كأساس مشترك.
2. أضف قسم الحساب المطلوب فقط:
   - الإدارة: القسم 5
   - المعلم: القسم 6
   - الطالب: القسم 7
   - ولي الأمر: القسم 8
3. اطلب منه الحفاظ على نفس مكتبة المكونات والتوكنز في جميع الملفات.

---

## ملاحظات تسليم التصميم للمطور

- يجب أن تكون المكونات قابلة للتنفيذ باستخدام React وTailwind CSS وshadcn/ui.
- استخدم أسماء المكونات والحالات بوضوح، مثل:
  - `MobileAppBar`
  - `RoleBottomNavigation`
  - `CenterSwitcher`
  - `StudentCard`
  - `AttendanceStatusControl`
  - `TodoCard`
  - `NoteCard`
- وفّر المقاسات والتباعد وحالات التفاعل، وليس صوراً ثابتة فقط.
- افصل بين بيانات كل مركز وكل مستخدم في التدفقات المعروضة.

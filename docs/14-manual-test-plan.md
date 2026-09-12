# Manual Test Plan

> **Document metadata**  
> Last reviewed: 2026-09-12  
> Source of truth: this file + interactive checklist at `/developer/testing`  
> Related: [12-testing.md](./12-testing.md), [generated/frontend-routes.md](./generated/frontend-routes.md)

Use this plan before a release. Mark each case Pass / Fail / Blocked. The platform Testing module stores the same cases as an on-screen checklist.

**Roles covered:** public visitor, admin, teacher, student, parent, platform operator, developer.  
**Rule:** a case fails if the UI errors, data is missing, the wrong tenant is shown, or Arabic/RTL breaks the layout.

---

## How to run

1. Sign in to `/platform` and open **Testing**.
2. Work through the **Manual plan** tab (or this file).
3. Run the **API tests** tab (unauthenticated suite, then authenticated GET suite).
4. Run automated tests from a terminal (`npm test` and `cd backend && php artisan test`).
5. File bugs with case ID (for example `ADM-ATT-02`).

Demo credentials belong in the internal runbook, not in this document.

---

## 1. Public & marketing

| ID | Steps | Expected |
|----|-------|----------|
| PUB-01 | Open `/` | Landing loads; hero, features, stats, and CTAs render |
| PUB-02 | Switch language on landing | English LTR and Arabic RTL; no overlapping text |
| PUB-03 | Open `/guide` | User guide loads; role sections are readable |
| PUB-04 | Open `/center/register` | Center registration form validates required fields |
| PUB-05 | Open `/student/register` and `/parent/register` | Forms load; center/academic selectors work |
| PUB-06 | Open a published public landing URL `/p/{slug}` or `/{tenant}/p/{slug}` | Public page renders; unpublished slug is not public |
| PUB-07 | Click tenant login CTA | Lands on `/{tenantSlug}/login` |
| PUB-08 | Resize landing to mobile width | Layout stacks; menus remain usable |

---

## 2. Authentication

| ID | Steps | Expected |
|----|-------|----------|
| AUTH-01 | Admin login at `/{tenant}/login` with valid credentials | Lands on `/admin` |
| AUTH-02 | Teacher login at the same tenant URL | Lands on `/teacher` |
| AUTH-03 | Student login at `/student/login` | Lands on `/student` (portal if multi-center) |
| AUTH-04 | Parent login at `/parent/login` | Lands on `/parent` |
| AUTH-05 | Platform login at `/platform/login` (access password + account) | Lands on `/platform` |
| AUTH-06 | Developer login at `/developer/login` | Lands on `/developer` |
| AUTH-07 | Submit login with wrong password | Error message; stay on login |
| AUTH-08 | Submit login with empty fields | Validation; no request crash |
| AUTH-09 | Student/parent with several centers: pick a membership | Selected center data loads |
| AUTH-10 | Switch center after login | Bootstrap/data refresh for the new center |
| AUTH-11 | Logout from each portal | Returns to the matching login; `/api/user` is 401 |
| AUTH-12 | Visit `/admin` while logged out | Redirect to tenant login |
| AUTH-13 | Visit `/platform` as a center admin | Blocked / redirected |
| AUTH-14 | Platform gate password incorrect | Access denied; login form not shown |

---

## 3. Admin — people

| ID | Steps | Expected |
|----|-------|----------|
| ADM-STU-01 | Open `/admin/students` | List loads; search works |
| ADM-STU-02 | Create a student with required fields | Student appears in the list |
| ADM-STU-03 | Open student detail `/admin/students/:id` | Profile, sections, and related data show |
| ADM-STU-04 | Edit student; assign/unassign center | Changes persist; other centers unchanged |
| ADM-TCH-01 | Open `/admin/teachers` and create a teacher | Teacher listed; can attach photo if offered |
| ADM-TCH-02 | Edit teacher | Updates save |
| ADM-PAR-01 | Open `/admin/parents` and create a parent | Parent listed and linked to children if provided |
| ADM-PAR-02 | Edit parent | Updates save |

---

## 4. Admin — academic structure

| ID | Steps | Expected |
|----|-------|----------|
| ADM-GRD-01 | `/admin/grades` create / edit / delete | Grade CRUD works; delete blocked if in use (or warned) |
| ADM-CLS-01 | `/admin/classes` create / edit / delete | Class belongs to a grade |
| ADM-SEC-01 | `/admin/sections` create / edit / delete | Section belongs to class; teachers can be assigned |
| ADM-SEC-02 | Open `/admin/sections/:id/sessions` | Section sessions list; generate/create session |

---

## 5. Admin — curriculum & homework

| ID | Steps | Expected |
|----|-------|----------|
| ADM-UNT-01 | `/admin/units` create / edit with media | Unit saved |
| ADM-LSN-01 | `/admin/lessons` create / edit with media | Lesson saved and listed |
| ADM-QST-01 | `/admin/questions` create a question | Question saved with answers |
| ADM-QST-02 | `/admin/questions/bulk` import/bulk create | Bulk items appear in the bank |
| ADM-EXB-01 | `/admin/exam-bank` create an exam | Exam listed |
| ADM-EXB-02 | Open builder `/admin/exam-bank/:id/builder` | Add/reorder questions; layout saves |
| ADM-EXB-03 | Export exam PDF/Word | File downloads |
| ADM-EXB-04 | Generate exam from bank | Generated exam appears |
| ADM-HW-01 | `/admin/homework` create homework | Homework listed for the section |
| ADM-HW-02 | Open `/admin/homework/:id/review` | Submissions list |
| ADM-HW-03 | Open remarks `/admin/homework/:id/submissions/:sid/remarks` | Correction/remarks save |
| ADM-LIB-01 | `/admin/library` add / update / delete item | Item listed; file/link opens |

---

## 6. Admin — sessions

| ID | Steps | Expected |
|----|-------|----------|
| ADM-SES-01 | `/admin/sessions` list | Sessions show date, section, teacher |
| ADM-SES-02 | Create or generate sessions | New rows appear |
| ADM-SES-03 | Edit / delete a session | Changes persist |
| ADM-SES-04 | Open attendance QR / set venue | QR dialog; venue saves |

---

## 7. Admin — classroom (attendance, exams, quizzes)

| ID | Steps | Expected |
|----|-------|----------|
| ADM-ATT-01 | `/admin/attendance` pick a section | Today / history links work |
| ADM-ATT-02 | Record attendance for a date | Saves; history shows the date |
| ADM-ATT-03 | Re-open the same date | Previous marks load |
| ADM-EXM-01 | `/admin/exams` record degrees for a date | Scores save; history lists the date |
| ADM-QZ-01 | `/admin/quizzes` record quiz degrees | Scores save; history lists the date |

---

## 8. Admin — finance

| ID | Steps | Expected |
|----|-------|----------|
| ADM-FEE-01 | `/admin/fees` create / edit / delete fee type | Fee listed |
| ADM-PAY-01 | `/admin/payments` open section today | Student payment grid loads |
| ADM-PAY-02 | Record a payment | Saved; history and reports include it |
| ADM-PAY-03 | Open payment history for a section | Past dates listed |

---

## 9. Admin — communications & certifications

| ID | Steps | Expected |
|----|-------|----------|
| ADM-ANN-01 | `/admin/announcements` create / edit / delete | Announcement listed; media optional |
| ADM-NTF-01 | `/admin/notifications` send a notification | Recipients can see it (or admin list updates) |
| ADM-WA-01 | `/admin/whatsapp/templates` CRUD | Template saved |
| ADM-WA-02 | `/admin/whatsapp` prepare/send (or dry-run) | Status endpoint does not 500; send requires valid config |
| ADM-CER-01 | `/admin/certifications/templates` create/edit in builder | Template saved |
| ADM-CER-02 | `/admin/certifications` prepare and issue | Issued list shows the certificate |
| ADM-CER-03 | Delete an issued certificate | Removed from the list |

---

## 10. Admin — landing pages

| ID | Steps | Expected |
|----|-------|----------|
| ADM-LND-01 | `/admin/landing` create from blank/template/teacher | Page listed |
| ADM-LND-02 | `/admin/landing/:id/edit` edit sections and save | Preview matches builder |
| ADM-LND-03 | Publish / unpublish | Public URL works only when published |
| ADM-LND-04 | Duplicate page | Copy appears |
| ADM-LND-05 | Restore a revision | Content rolls back |
| ADM-LND-06 | `/admin/landing/:id/analytics` | Analytics page loads (empty is OK) |
| ADM-LND-07 | Upload / delete landing media | Media library updates |

---

## 11. Admin — reports, access, settings, personal

| ID | Steps | Expected |
|----|-------|----------|
| ADM-RPT-01 | `/admin/reports` | Report index loads |
| ADM-RPT-02 | Attendance report + section drill-down | Figures match recorded attendance |
| ADM-RPT-03 | Payments report | Figures match recorded payments |
| ADM-RPT-04 | Open `/admin/reports/:type` for other types | Page loads without error |
| ADM-USR-01 | `/admin/users` CRUD | User can sign in with the new role |
| ADM-ROL-01 | `/admin/roles` create role and permissions | Limited user cannot open forbidden pages |
| ADM-SET-01 | `/admin/settings` save center settings | Values persist after reload |
| ADM-TODO-01 | `/admin/todos` create / complete / delete | List updates |
| ADM-NOTE-01 | `/admin/notes` create / edit / delete | Notes persist |

---

## 12. Teacher portal

| ID | Steps | Expected |
|----|-------|----------|
| TCH-01 | Open `/teacher` | Dashboard stats/links for assigned sections only |
| TCH-02 | `/teacher/classes` | Only this teacher’s classes |
| TCH-03 | `/teacher/sessions` list; edit allowed fields | Cannot see other teachers’ private data |
| TCH-04 | Open LiveKit `/teacher/sessions/:id/livekit` | Token endpoint succeeds when LiveKit is configured; otherwise a clear error |
| TCH-05 | Attendance QR / venue from teacher session | QR shows; venue saves |
| TCH-06 | `/teacher/attendance` | Can record for own sections |
| TCH-07 | `/teacher/exams` and `/teacher/quizzes` | Can enter degrees for own sections |
| TCH-08 | `/teacher/homework` | Assigned homework visible |
| TCH-09 | `/teacher/library` | Library items visible |
| TCH-10 | `/teacher/todos` and `/teacher/notes` | Personal items are not shared with other users |

---

## 13. Student portal

| ID | Steps | Expected |
|----|-------|----------|
| STU-01 | Open `/student` | Dashboard for enrolled sections |
| STU-02 | `/student/sessions` | Upcoming/past sessions; `/student/courses` redirects here |
| STU-03 | LiveKit `/student/sessions/:id/livekit` | Join works when configured |
| STU-04 | `/student/attendance` history | Own records only |
| STU-05 | `/student/attendance/check-in` scan/QR | Check-in accepted for a live session; rejected otherwise |
| STU-06 | `/student/grades` | Exam/quiz/homework scores visible |
| STU-07 | `/student/exams` and `/student/quizzes` | Own degrees only |
| STU-08 | `/student/homework` submit a file/answer | Submission appears; cannot edit after lock if applicable |
| STU-09 | `/student/library` | Allowed items open |
| STU-10 | `/student/certifications` | Issued certificates listed / downloadable |
| STU-11 | `/student/todos` and `/student/notes` | Personal only |

---

## 14. Parent portal

| ID | Steps | Expected |
|----|-------|----------|
| PAR-01 | Open `/parent` | Dashboard summarises linked children |
| PAR-02 | `/parent/children` | All linked children; no unrelated students |
| PAR-03 | `/parent/attendance` | Attendance per child |
| PAR-04 | `/parent/exams` and `/parent/quizzes` | Degrees per child |
| PAR-05 | `/parent/fees` | Fees/payments for linked children |
| PAR-06 | `/parent/reports` | Report views load |

---

## 15. Platform operator

| ID | Steps | Expected |
|----|-------|----------|
| PLT-01 | `/platform` dashboard | Stats, recent tenants, activity, home links |
| PLT-02 | `/platform/tenants` create a center | Center appears; admin can log in at its slug |
| PLT-03 | Edit / deactivate / delete tenant (if allowed) | List updates; isolation still holds |
| PLT-04 | `/platform/subscriptions` CRUD | Subscription rows save |
| PLT-05 | `/platform/students` and detail | Cross-center directory; opening a row shows the student |
| PLT-06 | `/platform/parents` and detail | Cross-center directory |
| PLT-07 | `/platform/governorates` CRUD | Used by city/area forms |
| PLT-08 | `/platform/cities` CRUD | City belongs to a governorate |
| PLT-09 | `/platform/areas` CRUD | Area belongs to a city |
| PLT-10 | `/platform/users` CRUD | Platform user can sign in |
| PLT-11 | `/platform/roles` | Roles listed |
| PLT-12 | `/platform/logs` | Activity log loads |

---

## 16. Developer portal

| ID | Steps | Expected |
|----|-------|----------|
| DEV-01 | `/developer` overview | Manifest stats load |
| DEV-02 | `/developer/apis` pick a route and send | Live response; logs append |
| DEV-03 | `/developer/database` | Schema catalog loads |
| DEV-04 | `/developer/translations` add/edit/delete a key | UI string updates |
| DEV-05 | `/developer/images` upload/reset | Website image updates |
| DEV-06 | `/developer/settings` branding | Logo/colors persist; public branding API updates |
| DEV-07 | `/developer/icons` change and reset an icon | Sidebar/landing icon updates; reset restores default |
| DEV-08 | `/developer/documentation` open each doc | Markdown renders; generated API/routes docs present |
| DEV-09 | `/developer/testing` | Manual, API, and automated tabs work |

---

## 17. Cross-cutting

| ID | Steps | Expected |
|----|-------|----------|
| X-ISO-01 | Create a student in center A | Not visible in center B admin bootstrap |
| X-ISO-02 | Call an admin API with the wrong `X-Tenant-Slug` | Error or empty scoped data — never center A rows |
| X-RBAC-01 | Limited admin without delete permission | Delete actions hidden or 403 |
| X-I18N-01 | Switch locale in each dashboard | Arabic RTL; English LTR; no missing critical keys |
| X-PWA-01 | Install PWA (Chrome) | Opens standalone; login survives reload with token |
| X-NOTIF-01 | Subscribe to web push if VAPID configured | Key endpoint 200; otherwise a clear disabled state |
| X-404-01 | Open `/this-route-does-not-exist` | Not-found page |
| X-PERS-01 | Personal todos/notes as teacher vs admin | Isolated per user |

---

## Sign-off

| Field | Value |
|-------|--------|
| Build / commit | |
| Environment | |
| Tester | |
| Date | |
| Result | Pass / Fail |
| Blockers | |

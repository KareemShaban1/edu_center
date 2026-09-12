# Product Requirements Document (PRD)

> **Document metadata**  
> Product: EduCenter  
> Last reviewed: 2026-09-12  
> Frontend routes: run `npm run docs:sync` → `generated/frontend-routes.md`

---

## Priority legend

| Priority | Meaning |
|----------|---------|
| **P0** | Must have — blocks launch or daily operations |
| **P1** | Should have — core value, planned release |
| **P2** | Nice to have — enhances experience |
| **P3** | Future — backlog |

---

## Feature catalog

### F1 — Center authentication & multi-center portal

**Description:** Center staff log in with email/password at `/{centerSlug}/login`. Students and parents use dedicated portal logins; they may also **self-register**. System resolves memberships across centers. A new school can **self-register a center** at `/center/register`.

| User story | Priority |
|------------|----------|
| As an admin, I log in to my center so I can manage operations | P0 |
| As a parent enrolled in two centers, I pick which center to enter after login | P0 |
| As a student, I use one portal login for all my centers | P0 |
| As a new center owner, I register my center without a platform operator | P0 |
| As a student/parent, I create my own account and join a center | P1 |

**Acceptance criteria:**
- [ ] Invalid credentials return 401 with clear message
- [ ] Admin/teacher without `center_slug` returns center required error
- [ ] Multi-membership returns center selection payload
- [ ] Session persists across SPA navigation until logout or expiry
- [ ] Wrong role cannot access another role's routes (redirect to own dashboard)

---

### F2 — Academic structure management

**Description:** Grades → classes → sections hierarchy with teacher assignment.

| User story | Priority |
|------------|----------|
| As an admin, I create grades and classes to mirror our curriculum | P0 |
| As an admin, I create sections and assign teachers | P0 |
| As an admin, I enroll students with grade/class/section/parent | P0 |

**Acceptance criteria:**
- [ ] CRUD via admin SPA with validation
- [ ] Bootstrap reflects changes without full page reload
- [ ] Section status (active/inactive) respected in dropdowns
- [ ] Teacher-section pivot updated on section save

---

### F3 — Daily attendance

**Description:** Section/date attendance sheets with history.

| User story | Priority |
|------------|----------|
| As an admin/teacher, I mark attendance for a section on a given date | P0 |
| As an admin, I review attendance history for a section | P0 |
| As a student, I check in to a session with QR (and location when required) | P0 |
| As a parent, I see my child's attendance | P0 |

**Acceptance criteria:**
- [ ] Status values: present, absent, late (0/1/2)
- [ ] History lists past dates with edit capability for authorized roles
- [ ] Parent/student views are read-only
- [ ] Optional notification on record (configurable)

---

### F4 — Exams & quizzes

**Description:** Score entry by section and date; history; parent/student visibility.

| User story | Priority |
|------------|----------|
| As an admin, I enter exam scores for a section on a date | P0 |
| As an admin, I enter quiz scores similarly | P0 |
| As a student, I view my grades | P0 |
| As a parent, I view each child's exam/quiz results | P0 |

**Acceptance criteria:**
- [ ] Form workflow: pick section → pick date → enter scores
- [ ] History accessible from admin UI
- [ ] Student API write on grades returns 403

---

### F5 — Fees & payments

**Description:** Fee definitions and payment recording with financial reports.

| User story | Priority |
|------------|----------|
| As an admin, I define monthly fees per section | P0 |
| As an admin, I record who paid on a given day | P0 |
| As an admin, I see unpaid students on the dashboard | P1 |
| As a parent, I view fee status for my children | P1 |

**Acceptance criteria:**
- [ ] Fee types: monthly, half-monthly, book, other
- [ ] Payment links to student, fee, section, month
- [ ] Reports show collected vs outstanding amounts
- [ ] `MonthlyUnpaidStudentsService` surfaces on admin dashboard

---

### F6 — Homework & curriculum

**Description:** Units, lessons, homework assignments, student submissions.

| User story | Priority |
|------------|----------|
| As an admin, I organize curriculum into units and lessons | P1 |
| As an admin/teacher, I assign homework to a section | P1 |
| As a student, I submit homework | P1 |

**Acceptance criteria:**
- [ ] Homework CRUD with section scope
- [ ] Student submission create/update/delete own records only
- [ ] Teacher sees assigned homework in portal

---

### F7 — Scheduled sessions (hybrid / LiveKit)

**Description:** In-person and online sessions with QR attendance and in-browser video.

| User story | Priority |
|------------|----------|
| As an admin, I schedule or auto-generate sessions for a section | P0 |
| As a teacher, I start/join a LiveKit (or Jitsi) room | P1 |
| As a student, I join scheduled online sessions | P1 |

**Acceptance criteria:**
- [ ] LiveKit token endpoint returns valid join credentials when configured
- [ ] Session list filtered by role and section
- [ ] Student cannot mutate other users’ sessions via API
- [ ] In-person sessions can show attendance QR

---

### F8 — Library & announcements

**Description:** File library and center announcements.

| User story | Priority |
|------------|----------|
| As an admin, I upload library resources by grade/class/section | P1 |
| As an admin, I publish announcements with attachments | P1 |
| As a student, I browse library and announcements | P2 |

**Acceptance criteria:**
- [ ] File upload with media handling
- [ ] Scoped visibility by academic structure
- [ ] Student library CRUD restricted appropriately

---

### F9 — Landing page builder

**Description:** Marketing pages per center with builder, publish, analytics.

| User story | Priority |
|------------|----------|
| As an admin, I build a landing page without code | P2 |
| As a visitor, I view public page at `/{center}/p/{slug}` | P2 |
| As an admin, I see page view analytics | P3 |

**Acceptance criteria:**
- [ ] WYSIWYG builder with preview
- [ ] Publish/unpublish/duplicate flows
- [ ] Public endpoint without auth
- [ ] Revision history stored

---

### F10 — RBAC & admin users

**Description:** Spatie roles and permissions within a center.

| User story | Priority |
|------------|----------|
| As an admin, I create staff users with limited permissions | P1 |
| As an admin, I define roles (admin vs user default roles) | P1 |

**Acceptance criteria:**
- [ ] Permissions seeded per center (`RolesAndPermissionsSeeder`)
- [ ] UI for roles/permissions management
- [ ] API enforces guard `web` for admin mutations

---

### F11 — Platform operations

**Description:** Super-admin manages centers, subscriptions, platform staff.

| User story | Priority |
|------------|----------|
| As a platform admin, I create a new center | P0 |
| As a platform admin, I assign subscription plan to center | P1 |
| As a platform admin, I manage Egypt locations (governorate/city/area) | P1 |
| As a platform admin, I override branding and sidebar/landing icons | P1 |
| As a platform admin, I run the Testing module and read project docs | P1 |
| As a platform admin, I audit activity across centers | P2 |

**Acceptance criteria:**
- [ ] Center CRUD triggers `SetupCenter` / `DeleteCenterData` jobs
- [ ] Legacy `/platform/tenants` aliases work
- [ ] Platform login separate from center login

---

### F12 — Localization & PWA

**Description:** EN/AR toggle, RTL, installable PWA.

| User story | Priority |
|------------|----------|
| As an Arabic-speaking user, I switch language and see RTL layout | P0 |
| As a mobile user, I install the app to home screen | P2 |

**Acceptance criteria:**
- [ ] Locale persisted in context; `dir` and `lang` on document
- [ ] PWA manifest and service worker registered
- [ ] Install prompt on landing and dashboard

---

### F13 — Exam bank & certifications

**Description:** Question bank, exam builder/export, and issued certificates.

| User story | Priority |
|------------|----------|
| As an admin, I build exams from a question bank and export PDF/Word | P1 |
| As an admin, I issue a certificate a student can download | P1 |

---

### F14 — Personal productivity

**Description:** Private todos and notes for admin, teacher, and student accounts.

| User story | Priority |
|------------|----------|
| As staff or a student, I keep a private to-do list and notes | P2 |

---

## Release status (2026-09)

The catalog above is **implemented in the current SPA**. Remaining work is polish, load testing, and optional payment-gateway integration — not missing P0 modules.

| Phase | Features | Status |
|-------|----------|--------|
| **MVP** | F1–F5, F11, F12 | Shipped |
| **v1.1** | F6, F7, F8, F10, F13 | Shipped |
| **v1.2** | F9, F14, PWA, Testing module, demo scripts | Shipped |

---

## Related documents

- [User Stories & Use Cases](./04-user-stories-and-use-cases.md)
- [UI/UX](./08-ui-ux.md)
- [SRS](./02-software-requirements.md)

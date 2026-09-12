# Business Requirements Document (BRD)

> **Document metadata**  
> Product: EduCenter  
> Last reviewed: 2026-09-12  
> Source of truth: product routes in `src/App.tsx`, domain models in `backend/app/Models/`

---

## 1. Project overview

**EduCenter** is a multi-center education management platform for tutoring centers, schools, and training institutes. Each **center** operates as an isolated tenant within a shared database, with its own staff, students, curriculum, fees, and communications.

The product delivers:

- A modern **React SPA** (PWA) for day-to-day operations (admin, teacher, student, parent, platform)
- A **Laravel 9 JSON API** (`backend/routes/api.php` + `backend/routes/api/*.php`) — ~235 endpoints
- **Bilingual support** (Arabic default / English) with RTL layout
- **Hybrid classes** via scheduled sessions (in-person QR check-in or LiveKit / Jitsi / external link)
- **Public onboarding:** a center can self-register; students and parents can self-register into a center
- **Platform tier** for operators who provision centers, locations, branding, icons, docs, and QA

---

## 2. Business objectives

| Objective | Description |
|-----------|-------------|
| **Centralize center operations** | Replace spreadsheets and disconnected tools with one system for people, classes, attendance, grades, and fees |
| **Improve parent engagement** | Give parents real-time visibility into attendance, exams, quizzes, and payments |
| **Scale as SaaS** | Allow platform operators to onboard many centers from a single control plane |
| **Support hybrid learning** | Schedule sessions (in-person QR or live video) and run them from teacher/student portals |
| **Localize for MENA markets** | Arabic UI, RTL, WhatsApp templates, and culturally appropriate UX |
| **Monetize centers** | Subscription/plan metadata per center for platform billing |

---

## 3. Problems being solved

| Problem | EduCenter solution |
|---------|-------------------|
| Manual attendance and grade tracking | Section/date workflows with history and notifications |
| Fee collection chaos | Structured fees by grade/class/section; payment recording and unpaid reports |
| Poor parent communication | Parent portal, push notifications, WhatsApp templates |
| Fragmented online classes | Scheduled `sessions` with LiveKit, Jitsi, or an external join URL |
| No marketing presence per center | Landing page builder with public URLs and analytics |
| Multi-branch student/parent identity | Global user + center memberships (one login, multiple centers) |
| Lack of auditability | Activity logs, role-based permissions (Spatie) |

---

## 4. Target audience

| Segment | Needs |
|---------|-------|
| **Center owners / admins** | Full operational control, reports, staff management, settings |
| **Teachers** | Class lists, attendance, assessments, homework, live sessions |
| **Students** | Schedule, QR check-in, grades, homework, library, certificates, online classes |
| **Parents** | Multi-child dashboard, attendance/grades/fees visibility |
| **Platform operators** | Center provisioning, subscriptions, locations, branding/icons, documentation, testing |
| **Geography** | Primary: Egypt and broader Arabic-speaking education market |

---

## 5. Stakeholders

| Stakeholder | Interest |
|-------------|----------|
| Center management | ROI, efficiency, compliance with local practices |
| Teachers | Easy daily workflows, minimal training |
| Students & parents | Mobile-friendly portal, timely notifications |
| Platform owner | Multi-tenant growth, uptime, subscription revenue |
| Development team | Maintainable architecture (center scoping, SPA + API) |
| IT / hosting | Deployable on VPS (e.g. Contabo + aaPanel) with MySQL |

---

## 6. Success metrics (KPIs)

| KPI | Measurement | Target direction |
|-----|-------------|------------------|
| Center adoption | Active centers on platform | Increase |
| Daily active users | Logins per role per day | Increase |
| Attendance capture rate | Sessions recorded / scheduled sessions | > 90% |
| Fee collection visibility | Unpaid student reports acted on | Decrease overdue |
| Parent portal usage | Parent logins / enrolled families | Increase |
| Session attendance | QR check-ins and LiveKit/online joins vs scheduled sessions | Increase |
| System availability | Uptime of API + SPA | ≥ 99.5% |
| Support tickets | Issues per center per month | Decrease |
| Time to onboard center | Center created → first student enrolled | < 1 day |

---

## 7. Scope

### In scope

- Academic hierarchy: grades → classes → sections
- People: students, teachers, parents, admin users
- Operations: attendance (incl. session QR), exams, quizzes, exam bank, homework, fees, payments
- Content: library, announcements, units, lessons, questions (incl. bulk)
- Communications: in-app notifications, web push, WhatsApp templates, certifications
- Online / hybrid learning: scheduled sessions, LiveKit (or Jitsi / external URL), student check-in
- Marketing: per-center landing pages (builder, publish, analytics)
- Platform: center CRUD, subscriptions, governorates/cities/areas, branding, UI icons, documentation, Testing module, activity logs
- Public self-registration for centers, students, and parents
- Personal todos/notes (admin, teacher, student)
- RBAC within center (Spatie permissions)
- EN/AR localization and RTL

### Out of scope (current release)

- Full accounting / ERP integration
- Native iOS/Android apps (PWA is supported)
- Automated payment gateways (recording is manual; gateway integration is future)
- LMS content authoring beyond units/lessons/homework/exam bank
- Government exam certification workflows (templates exist; external validation is manual)

---

## 8. Limitations and assumptions

| Item | Detail |
|------|--------|
| **Architecture** | Shared MySQL database with `center_id` scoping (migrated from database-per-tenant) |
| **Auth** | Session + encrypted bearer token for SPA; not OAuth-first |
| **Legacy UI** | Blade/Livewire views may still exist in `backend/resources/views`; **new work targets the SPA only** |
| **Integrations** | Zoom config exists; LiveKit is primary for in-app video; sessions also support Jitsi and external links |
| **Assumption** | Each center has reliable internet for web app and video |
| **Assumption** | Admins configure academic structure (grade → class → section) before operational use |

---

## Related documents

- [SRS](./02-software-requirements.md) — detailed system requirements
- [PRD](./03-product-requirements.md) — feature priorities
- [System Architecture](./05-system-architecture.md) — technical design

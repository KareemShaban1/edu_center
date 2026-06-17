# Business Requirements Document (BRD)

> **Document metadata**  
> Product: EduCenter  
> Last reviewed: 2026-06-16  
> Source of truth: product routes in `src/App.tsx`, domain models in `backend/app/Models/`

---

## 1. Project overview

**EduCenter** is a multi-center education management platform for tutoring centers, schools, and training institutes. Each **center** operates as an isolated tenant within a shared database, with its own staff, students, curriculum, fees, and communications.

The product delivers:

- A modern **React SPA** for day-to-day operations (admin, teacher, student, parent, platform)
- A **Laravel API** with legacy Blade dashboards for backward compatibility
- **Bilingual support** (English / Arabic) with RTL layout
- **Online classes** via LiveKit video meetings
- **Platform tier** for operators who provision and manage multiple centers

---

## 2. Business objectives

| Objective | Description |
|-----------|-------------|
| **Centralize center operations** | Replace spreadsheets and disconnected tools with one system for people, classes, attendance, grades, and fees |
| **Improve parent engagement** | Give parents real-time visibility into attendance, exams, quizzes, and payments |
| **Scale as SaaS** | Allow platform operators to onboard many centers from a single control plane |
| **Support hybrid learning** | Schedule recurring meeting series and run live video sessions |
| **Localize for MENA markets** | Arabic UI, RTL, WhatsApp templates, and culturally appropriate UX |
| **Monetize centers** | Subscription/plan metadata per center for platform billing |

---

## 3. Problems being solved

| Problem | EduCenter solution |
|---------|-------------------|
| Manual attendance and grade tracking | Section/date workflows with history and notifications |
| Fee collection chaos | Structured fees by grade/class/section; payment recording and unpaid reports |
| Poor parent communication | Parent portal, push notifications, WhatsApp templates |
| Fragmented online classes | Meeting series + LiveKit integration in teacher/student portals |
| No marketing presence per center | Landing page builder with public URLs and analytics |
| Multi-branch student/parent identity | Global user + center memberships (one login, multiple centers) |
| Lack of auditability | Activity logs, role-based permissions (Spatie) |

---

## 4. Target audience

| Segment | Needs |
|---------|-------|
| **Center owners / admins** | Full operational control, reports, staff management, settings |
| **Teachers** | Class lists, attendance, assessments, homework, live meetings |
| **Students** | Schedule, grades, homework submissions, library, online classes |
| **Parents** | Multi-child dashboard, attendance/grades/fees visibility |
| **Platform operators** | Center provisioning, subscriptions, global users, audit |
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
| Meeting attendance | LiveKit joins / scheduled meetings | Increase |
| System availability | Uptime of API + SPA | ≥ 99.5% |
| Support tickets | Issues per center per month | Decrease |
| Time to onboard center | Center created → first student enrolled | < 1 day |

---

## 7. Scope

### In scope

- Academic hierarchy: grades → classes → sections
- People: students, teachers, parents, admin users
- Operations: attendance, exams, quizzes, homework, fees, payments
- Content: library, announcements, units, lessons, questions
- Communications: in-app notifications, web push, WhatsApp templates
- Online learning: meeting series, meetings, LiveKit rooms
- Marketing: per-center landing pages (builder, publish, analytics)
- Platform: center CRUD, subscriptions, platform users/roles, activity logs
- RBAC within center (Spatie permissions)
- EN/AR localization and RTL

### Out of scope (current release)

- Full accounting / ERP integration
- Native iOS/Android apps (PWA is supported)
- Automated payment gateways (recording is manual; gateway integration is future)
- LMS content authoring beyond units/lessons/homework
- Government exam certification workflows (templates exist; external validation is manual)

---

## 8. Limitations and assumptions

| Item | Detail |
|------|--------|
| **Architecture** | Shared MySQL database with `center_id` scoping (migrated from database-per-tenant) |
| **Auth** | Session + encrypted bearer token for SPA; not OAuth-first |
| **Legacy UI** | Blade dashboards remain; SPA is primary for new features |
| **Integrations** | Zoom config exists; LiveKit is primary for video |
| **Assumption** | Each center has reliable internet for web app and video |
| **Assumption** | Admins configure academic structure before operational use |

---

## Related documents

- [SRS](./02-software-requirements.md) — detailed system requirements
- [PRD](./03-product-requirements.md) — feature priorities
- [System Architecture](./05-system-architecture.md) — technical design

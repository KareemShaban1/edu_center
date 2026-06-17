# EduCenter — Project Description

> **Full documentation:** see [`docs/README.md`](./README.md) for BRD, SRS, PRD, architecture, API, security, deployment, and testing docs.  
> Run `npm run docs:sync` after route or migration changes to refresh auto-generated sections.

## Overview

**EduCenter** is a multi-center **education management platform** for schools and training centers. Each **center** is isolated via `center_id` scoping (and `center_memberships` for students/parents) in a shared MySQL database, with subdomain/slug-aware routing. The product supports **English** and **Arabic** with **RTL** layout switching via `LocaleContext`.

The system targets **administrators, teachers, students, parents**, and a separate **platform** tier for **super admins / platform operators** who manage centers, subscriptions, and global access.

---

## Architecture

### Frontend (`/` root)

| Layer | Technology |
|--------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite 7 |
| Routing | React Router v6 |
| Server state | TanStack React Query |
| UI | Tailwind CSS + shadcn/ui (Radix primitives) |
| Motion | Framer Motion (marketing landing) |
| Realtime / classes | LiveKit client (teacher/student meetings) |

- **API client** talks to Laravel under `/api` (proxied in dev; production nginx must forward `/api` to `public/index.php`).
- **Auth**: Session + encrypted bearer token via `apiClient`; guards (`users`, `teacher`, `parent`, `student`, `super_admin`, `platform_admin`) drive login and role normalization.
- **Center context**: `tenantSlug` / `centerSlug` on login for non-platform guards; platform logins omit center.

### Backend (`backend/`)

| Layer | Technology |
|--------|------------|
| Framework | Laravel 9 (PHP 8.1+) |
| Multi-center | Custom `Centers/` module — shared DB + `center_id` |
| Central tables | `centers`, `global_users`, `center_memberships`, platform admins |
| Center data | Students, teachers, parents, grades, classes, sections, attendance, fees, exams, quizzes, homework, library, announcements, meeting series, etc. |

- **API** routes exposed for SPA (`/api/...`) with center resolution from host/slug/header per deployment.
- **Bootstrap** endpoint aggregates reference data for admin UI (grades, classes, sections, teachers, students, …).

---

## User Roles & Surfaces

| Role | Base path | Purpose |
|------|-----------|---------|
| **Admin** | `/admin/*` | Full school ops: people, structure (grades/classes/sections), curriculum (units/lessons/homework), meeting series, attendance, exams/quizzes, fees/payments, library, announcements, reports, users/roles, settings |
| **Teacher** | `/teacher/*` | Classes, meeting series, attendance, exams/quizzes, homework, library; LiveKit meetings |
| **Student** | `/student/*` | Meetings, attendance, grades, homework, library; LiveKit |
| **Parent** | `/parent/*` | Children, attendance, exams/quizzes, fees, reports |
| **Platform** | `/platform/*` | Tenants, subscriptions, users, roles, activity logs (roles `super_admin` / `platform_admin`) |

**Auth entry points**

- `/login` — tenant/school login (guard tabs + tenant code).
- `/platform/login` — central platform login (no tenant).

Default demo credentials and per-guard defaults are configurable in `src/config/login-defaults.ts`.

---

## Key Product Features (from routes & modules)

- **Academic structure**: Grades → classes → sections; teacher assignment to sections.
- **Attendance** with per-section day sheets and history.
- **Exams & quizzes** with section/date workflows and history.
- **Fees & payments** with section-scoped day views.
- **Homework**, **units**, **lessons**.
- **Digital library** and **announcements** (often with file uploads).
- **Meeting series** (recurring / weekly patterns) integrated with LiveKit for online sessions.
- **Reports** for admins/parents.
- **Admin users & roles/permissions** for tenant RBAC.

---

## UX Conventions (frontend)

- **DashboardLayout**: grouped sidebar (collapsible sections) per role; mobile bottom bar; locale toggle; sign-out routes to `/login` or `/platform/login` based on session tenant presence.
- **Forms**: Many screens use `FormDialog`, tables, shadcn `Card`/`Badge`/`Dialog`, and TanStack Query mutations with cache invalidation (`admin-bootstrap`, etc.).
- **i18n**: Keys in `LocaleContext.tsx` (`en` / `ar`); `dir` drives RTL on root layout.

---

## Repository Layout (high level)

```
src/
  App.tsx                 # Routes
  components/             # Shared UI (DashboardLayout, shadcn/ui, …)
  contexts/               # Auth, Locale
  config/                 # login-defaults.ts
  hooks/                  # useAdminBootstrap, …
  pages/                  # Landing, Login, PlatformLogin, admin/*, teacher/*, …
  services/endpoints/     # API modules per domain
  types/models.ts         # Shared TS models
backend/                  # Laravel tenant + central app
docs/                     # Deployment (e.g. Contabo + aaPanel), this file
```

---

## Deployment Notes

- SPA static assets from `dist/`; **API** must not be swallowed by SPA `try_files` — see [`11-deployment.md`](./11-deployment.md) and [`DEPLOYMENT_CONTABO_AAPANEL.md`](./DEPLOYMENT_CONTABO_AAPANEL.md).
- Current architecture uses a **single shared database** with center scoping (legacy guides may mention database-per-tenant).

---

## Name & Branding

The marketing shell uses the name **EduCenter** (`app.name`). Replace in `LocaleContext` and `LandingPage` if the product is rebranded.

---

*This document reflects the repository as of the last update; routes and features may grow over time.*

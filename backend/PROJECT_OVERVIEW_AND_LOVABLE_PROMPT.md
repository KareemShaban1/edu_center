# Educational Center - Project Overview and Lovable Prompt

## 1) Project Overview

This project is a multi-role educational management system built with Laravel (PHP 8.1+, Laravel 9).  
It supports centralized and tenant-aware usage with role-based dashboards for:

- Admin
- Teacher
- Student
- Parent
- Platform Admin (tenant management)

Core architecture and stack:

- Backend: Laravel MVC + Eloquent ORM
- Authentication: Multiple guards (`web`, `teacher`, `student`, `parent`, `platform_admin`, `api`)
- Authorization: Spatie Permission (roles and permissions)
- Localization: `mcamara/laravel-localization` (localized URL prefixes)
- Multi-tenancy: `stancl/tenancy`
- File/media management: Spatie Media Library
- Data grids: Yajra DataTables
- Realtime/notifications: Pusher + Laravel Echo + Web Push + Firebase libs
- Online classes: Zoom integration (`macsidigital/laravel-zoom`)
- Imports/exports: Laravel Excel
- PDF generation: mPDF package

---

## 2) Main Functional Features (By Module)

## 2.1 Admin Dashboard

Academic structure and setup:

- Grades management (CRUD)
- Classes management (CRUD, filter, bulk delete)
- Sections management (CRUD + details)
- Months setup
- School settings management
- Notes management

Users and access control:

- Users management (CRUD + DataTables JSON)
- Roles management (CRUD + DataTables JSON)
- Activity logs management (listing + DataTables JSON)
- Admin profile update

People management:

- Students management (CRUD)
- Students import (Excel)
- Student attachments upload/download/delete
- Parents management (CRUD)
- Parents import (Excel)
- Teachers management (CRUD)

Assessment and learning:

- Questions management (CRUD, class/lesson update helpers)
- Units management (CRUD + details)
- Lessons management (CRUD + details + words modal)
- Words management (CRUD + bulk insert + details)

Attendance, fees, payments, and reports:

- Attendance: groups, day selection, mark attendance, reports
- Attendance degree views
- Fee plans management
- Payment workflows by section/fee/month
- Section fees reporting endpoint

Exams, quizzes, and homework:

- Quiz degree workflows + notifications/WhatsApp
- Exam degree workflows + notifications/WhatsApp
- Homework workflows + degree updates + notifications/WhatsApp

Communication and resources:

- Announcements management
- Library resources management + attachment download
- WhatsApp templates management (including JSON list endpoint)
- Certification templates management + PDF generation

Online classes:

- Direct/indirect online class session creation and management

Other:

- Rooms module routes
- Dashboard calendar route

## 2.2 Teacher Dashboard

- Teacher dashboard overview
- Teacher groups view
- Attendance, exam, quiz, payment reports
- Student attendance taking and search
- Online Zoom classes management
- Indirect session creation
- Teacher profile management

## 2.3 Student Dashboard

- Personal dashboard
- Student profile
- Attendance, payment, quiz, exam views
- Student library and filtering
- Student online classes
- Announcements and filtering
- Homework list, view, upload, submit
- Notifications feed, mark one read, mark all read
- File downloads

## 2.4 Parent Dashboard

- Parent dashboard
- Children list
- Child attendance/payment/quiz/exam details
- Attendance search/reporting
- Aggregated children reports (attendance/exam/quiz/payment)
- Parent profile management
- Notifications feed, mark one read, mark all read
- Web push subscription endpoints

## 2.5 Platform Admin (Tenant Control)

- Platform login/logout
- Platform dashboard
- Tenant CRUD
- Tenant status toggle

---

## 3) Current API and JSON-Ready Endpoints

Important note:

- `routes/api.php` currently contains only the default `/api/user` endpoint.
- Most "API-like" behavior currently exists under web routes and returns JSON for AJAX/DataTables.
- Localized routes are generally prefixed with `/{locale}`.

Existing JSON/AJAX endpoints include:

- Dynamic lookup:
  - `GET /{locale}/Get_Classes/{id}`
  - `GET /{locale}/Get_Sections/{class_id}/{grade_id}`
  - `GET /{locale}/Get_amount/{id}`

- Admin JSON endpoints:
  - `GET /{locale}/users/data`
  - `GET /{locale}/roles/data`
  - `GET /{locale}/activity-logs/data`
  - `GET /{locale}/whatsapp_templates/list_json`
  - Homework JSON fetch/update responses
  - Several report/filter endpoints return JSON

- Student/Parent notifications:
  - `GET /{locale}/notifications`
  - `POST /{locale}/notifications/{id}/read`
  - `POST /{locale}/notifications/mark-all-read`

- Parent web push:
  - `GET /{locale}/vapid-key`
  - `POST /{locale}/subscribe`

- Default Laravel API:
  - `GET /api/user` (requires `auth:api`)

Recommendation for frontend integration:

- Create a dedicated versioned API layer (`/api/v1/...`) that maps the existing dashboard workflows.
- Use token-based auth for SPA/mobile frontend and keep session web auth for legacy blade pages.

---

## 4) Suggested Frontend and Dashboard Scope

The new frontend should provide:

- Multi-role login selection flow (admin, teacher, student, parent, platform admin)
- Role-based route protection and layouts
- Dashboard widgets and KPI cards per role
- Data tables with search/filter/pagination
- Forms for CRUD workflows
- Notifications center
- File upload/download handling
- Localized UI (Arabic/English-ready)
- Tenant-aware behavior (when deployed in multi-tenant mode)

---

## 5) Professional Prompt for Lovable

Copy and paste this into Lovable:

```text
Build a production-ready, responsive frontend application for an "Educational Center Management System" using a modern stack (React + TypeScript + Tailwind + component library). The frontend must consume an existing Laravel backend and support multiple role dashboards.

Project context:
- Backend is Laravel 9 with role-based guards: admin, teacher, student, parent, platform_admin.
- The platform has localized routes (locale prefix like /en or /ar) and multi-tenant support for some parent-facing workflows.
- Existing backend modules include:
  1) Academic setup: grades, classes, sections, months, settings
  2) People: students, parents, teachers, users, roles
  3) Academic operations: attendance, fees, payments, quizzes, exams, homework
  4) Learning content: units, lessons, words, questions, answers, library
  5) Communication: announcements, notifications, WhatsApp templates
  6) Online classes and certification template PDF generation
  7) Activity logs and platform tenant management

What I need you to generate:
1) Full frontend architecture with clean folder structure, reusable services, API client layer, and role-based routing.
2) Authentication flow with login-type selection and protected pages by role.
3) Separate dashboard UI for:
   - Admin Dashboard
   - Teacher Dashboard
   - Student Dashboard
   - Parent Dashboard
   - Platform Admin Dashboard
4) Core pages/components for each role:
   - Tables + CRUD forms
   - Filters and report views
   - Notifications center
   - File upload/download UI
   - Profile pages
5) API integration layer that supports:
   - Locale-aware URL building (example: /{locale}/...)
   - Token/session compatible auth handling
   - Standardized error handling and loading states
   - Pagination and DataTables-style server responses
6) UI quality requirements:
   - Professional education SaaS style
   - Responsive for desktop/tablet/mobile
   - Accessible components (labels, keyboard support)
   - Dark mode ready (optional toggle)

Backend integration requirements:
- Create a central API service module where base URL, locale, and auth mode are configurable.
- Add typed interfaces for each resource: Student, Parent, Teacher, Attendance, ExamDegree, QuizDegree, Homework, Fee, Payment, Announcement, LibraryItem, Role, User, Tenant.
- Implement endpoint modules grouped by domain (auth, students, teachers, attendance, exams, quizzes, homework, payments, reports, notifications, platform-tenants).
- Include mock adapters to allow frontend development before all API endpoints are finalized.

Important existing JSON-ready endpoints to support immediately:
- /{locale}/Get_Classes/{id}
- /{locale}/Get_Sections/{class_id}/{grade_id}
- /{locale}/Get_amount/{id}
- /{locale}/users/data
- /{locale}/roles/data
- /{locale}/activity-logs/data
- /{locale}/whatsapp_templates/list_json
- /{locale}/notifications
- /{locale}/notifications/{id}/read
- /{locale}/notifications/mark-all-read
- /{locale}/vapid-key
- /{locale}/subscribe
- /api/user

Expected output:
- Complete frontend codebase structure
- Ready-to-run pages and reusable components
- API service and endpoint files
- Role-based route map
- Example environment configuration (.env.example) for backend URL, locale, and auth strategy
- Developer README with setup, scripts, and deployment notes

Design direction:
- Keep it modern, minimal, and professional
- Use clear dashboard information hierarchy (KPIs, recent activity, actionable cards)
- Use consistent color semantics for attendance, finance, exams, and alerts
- Avoid overcomplicated animations; prioritize speed and clarity
```

---

## 6) Next Backend Step (Recommended)

To make frontend integration cleaner and faster, add a proper `api/v1` contract for all dashboard data (instead of mixing web + AJAX endpoints), then use the same business logic services currently used by controllers.

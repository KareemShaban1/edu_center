# Software Requirements Specification (SRS)

> **Document metadata**  
> Product: EduCenter  
> Last reviewed: 2026-06-16  
> Regenerate API/table lists: `npm run docs:sync`

---

## 1. Introduction

This document defines **what the EduCenter system shall do** from a software perspective. It complements the [BRD](./01-business-requirements.md) with testable functional and non-functional requirements.

**System context:** React SPA (Vite) + Laravel 9 API + MySQL, multi-center isolation via `center_id` and `center_memberships`.

---

## 2. Functional requirements

### 2.1 User registration & identity

| ID | Requirement | Implementation |
|----|-------------|----------------|
| FR-AUTH-01 | System shall support login for guards: admin (`users`), teacher, student, parent, platform admin | `POST /api/login`, `AuthLoginHandler` |
| FR-AUTH-02 | Admin and teacher login shall require center context (`center_slug` / subdomain) | `CenterContextManager`, `InitializeCenterFromSubdomain` |
| FR-AUTH-03 | Student and parent shall authenticate via global identity across centers | `global_users`, `center_memberships`, portal login |
| FR-AUTH-04 | User with multiple center memberships shall select center after login | `TENANT_SELECTION_REQUIRED`, `POST /api/auth/switch-center` |
| FR-AUTH-05 | System shall expose current user and guard via API | `GET /api/user`, `GET /api/auth/guards` |
| FR-AUTH-06 | System shall support logout and session invalidation | `POST /api/logout` |
| FR-AUTH-07 | Center staff (admin users) shall be created by center admin with roles | `POST /api/admin/users`, Spatie roles |

*Registration is admin-driven (students/teachers/parents created by staff), not public self-signup.*

### 2.2 Academic structure

| ID | Requirement |
|----|-------------|
| FR-ACAD-01 | CRUD grades, classes, sections per center |
| FR-ACAD-02 | Assign teachers to sections (many-to-many) |
| FR-ACAD-03 | Enroll students in grade/class/section with parent linkage |
| FR-ACAD-04 | Bootstrap endpoint loads reference data for SPA admin UI |

### 2.3 Attendance

| ID | Requirement |
|----|-------------|
| FR-ATT-01 | Record attendance per section and date (present/absent/late) |
| FR-ATT-02 | View and edit attendance history by section |
| FR-ATT-03 | Notify parents/students on attendance events (database + optional push/WhatsApp) |

### 2.4 Assessments (exams & quizzes)

| ID | Requirement |
|----|-------------|
| FR-ASM-01 | Record exam and quiz scores per student, section, date |
| FR-ASM-02 | History views by section and date |
| FR-ASM-03 | Student and parent portals read grades; students do not create grades via API (403 on write) |

### 2.5 Homework & curriculum

| ID | Requirement |
|----|-------------|
| FR-HW-01 | CRUD units and lessons |
| FR-HW-02 | Assign homework to sections; students submit work |
| FR-HW-03 | Admin/teacher manage homework; student CRUD on own submissions |

### 2.6 Payments & fees

| ID | Requirement |
|----|-------------|
| FR-PAY-01 | Define fees by grade/class/section (monthly, half-monthly, book, other) |
| FR-PAY-02 | Record payments per student with status and date |
| FR-PAY-03 | Section/date payment views and history |
| FR-PAY-04 | Reports: revenue, collected vs unpaid, monthly unpaid students |

### 2.7 Notifications

| ID | Requirement |
|----|-------------|
| FR-NOT-01 | Laravel database notifications for student/parent |
| FR-NOT-02 | Web Push (VAPID) subscription for parent/student |
| FR-NOT-03 | FCM push support (`FcmController`) |
| FR-NOT-04 | WhatsApp message templates and send hooks on attendance/grades/homework |

### 2.8 Reports

| ID | Requirement |
|----|-------------|
| FR-RPT-01 | Admin dashboard stats (counts, attendance rate, revenue) |
| FR-RPT-02 | `GET /api/admin/reports` aggregated metrics |
| FR-RPT-03 | Parent reports across children |
| FR-RPT-04 | Teacher section reports (attendance, exam, quiz, payment) |
| FR-RPT-05 | Section fee report (paid/unpaid in date range) |

### 2.9 Online meetings

| ID | Requirement |
|----|-------------|
| FR-MTG-01 | CRUD meeting series (recurrence) |
| FR-MTG-02 | CRUD meetings linked to sections |
| FR-MTG-03 | Issue LiveKit tokens for teacher and student join |
| FR-MTG-04 | Students cannot create/update/delete meetings (403) |

### 2.10 Content & communications

| ID | Requirement |
|----|-------------|
| FR-CNT-01 | Digital library with file uploads by scope |
| FR-CNT-02 | Announcements with media |
| FR-CNT-03 | Landing page builder: CRUD, publish, duplicate, revisions, analytics |

### 2.11 Platform administration

| ID | Requirement |
|----|-------------|
| FR-PLT-01 | CRUD centers (provision via `SetupCenter` job) |
| FR-PLT-02 | Manage subscriptions metadata |
| FR-PLT-03 | Platform users and roles |
| FR-PLT-04 | Activity log viewing |

### 2.12 Localization

| ID | Requirement |
|----|-------------|
| FR-I18N-01 | UI strings in English and Arabic |
| FR-I18N-02 | RTL layout when locale is `ar` |
| FR-I18N-03 | Backend localized routes for legacy Blade dashboards |

---

## 3. Non-functional requirements

### 3.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-PERF-01 | Admin bootstrap API response | < 3s for typical center (< 2000 students) |
| NFR-PERF-02 | SPA initial load (gzip) | < 5s on 4G |
| NFR-PERF-03 | List/table pages | Paginated or bootstrap-cached via TanStack Query |
| NFR-PERF-04 | LiveKit token issuance | < 500ms |

### 3.2 Security

| ID | Requirement |
|----|-------------|
| NFR-SEC-01 | All center data queries scoped by `center_id` or membership |
| NFR-SEC-02 | Passwords hashed (bcrypt) |
| NFR-SEC-03 | API bearer tokens encrypted with expiry |
| NFR-SEC-04 | Role/guard checks on every protected route |
| NFR-SEC-05 | CSRF/session cookies for SPA API (SameSite) |
| NFR-SEC-06 | Platform routes isolated to `platform_admin` guard |

See [Security Documentation](./10-security.md).

### 3.3 Scalability

| ID | Requirement |
|----|-------------|
| NFR-SCL-01 | Shared DB multi-center model supports hundreds of centers |
| NFR-SCL-02 | Center provisioning async via queue jobs |
| NFR-SCL-03 | File/media storage via Spatie Media Library (S3-compatible configurable) |
| NFR-SCL-04 | Horizontal scaling: stateless API + shared MySQL + Redis queue (optional) |

### 3.4 Availability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-AVL-01 | Production uptime | ≥ 99.5% |
| NFR-AVL-02 | Health checks | `/api/config` reachable |
| NFR-AVL-03 | Queue worker for center setup jobs | Required in production |

### 3.5 Backup strategy

| ID | Requirement |
|----|-------------|
| NFR-BAK-01 | Daily MySQL full backup retained ≥ 7 days |
| NFR-BAK-02 | Storage backup for `storage/` and uploaded media |
| NFR-BAK-03 | Documented restore procedure (see [Deployment](./11-deployment.md)) |
| NFR-BAK-04 | Pre-migration backup before `php artisan migrate` |

### 3.6 Maintainability

| ID | Requirement |
|----|-------------|
| NFR-MNT-01 | TypeScript frontend with ESLint |
| NFR-MNT-02 | PHP 8.1+ strict types in new center module |
| NFR-MNT-03 | Auto-generated route/table docs via `npm run docs:sync` |

### 3.7 Compatibility

| ID | Requirement |
|----|-------------|
| NFR-CMP-01 | Modern browsers (Chrome, Firefox, Safari, Edge last 2 versions) |
| NFR-CMP-02 | PWA install on mobile (Android Chrome, iOS Add to Home Screen) |
| NFR-CMP-03 | Responsive layouts down to 320px width |

---

## 4. External interfaces

| Interface | Protocol | Purpose |
|-----------|----------|---------|
| SPA ↔ Laravel API | HTTPS JSON `/api/*` | Primary UI |
| LiveKit | WebRTC + REST token | Video meetings |
| Web Push / FCM | VAPID / FCM HTTP | Push notifications |
| WhatsApp | Template + provider API | Parent messaging |
| Pusher (optional) | WebSocket | Realtime (legacy) |
| Zoom (optional) | OAuth API | Legacy online classes |

---

## 5. Traceability

| BRD section | SRS sections |
|-------------|--------------|
| Business objectives | FR-* modules |
| KPIs | NFR-PERF, NFR-AVL, FR-RPT |
| Scope | All FR sections |
| Limitations | NFR-SCL, architecture notes in [05-system-architecture.md](./05-system-architecture.md) |

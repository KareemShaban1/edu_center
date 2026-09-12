# API Documentation

> **Document metadata**  
> Last reviewed: 2026-09-12  
> **Full route list:** `npm run docs:sync` → [`generated/api-routes.md`](./generated/api-routes.md)  
> Implementation: `backend/routes/api.php`, `backend/routes/api/*.php`, `src/services/endpoints/`

---

## 1. Base URL

| Environment | Base URL |
|-------------|----------|
| Development | `http://127.0.0.1:8080/api` (Vite proxy → Laravel `:8000`) |
| Production | `https://{domain}/api` |

All paths below are relative to `/api`.

---

## 2. Authentication

### 2.1 Login

**`POST /login`**

Request:

```json
{
  "email": "admin@example.com",
  "password": "secret",
  "guard": "users",
  "center_slug": "demo"
}
```

Portal login (student/parent, no center slug):

```json
{
  "email": "parent@example.com",
  "password": "secret",
  "guard": "parent",
  "portal": true
}
```

Response (success):

```json
{
  "user": {
    "id": 1,
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "admin"
  },
  "token": "encrypted-bearer-payload",
  "guard": "users",
  "center": { "id": "uuid", "slug": "demo", "name": "Demo Center" }
}
```

Multi-center selection response:

```json
{
  "code": "TENANT_SELECTION_REQUIRED",
  "memberships": [
    { "id": 1, "center_slug": "center-a", "center_name": "Center A", "role": "parent" }
  ]
}
```

### 2.2 Session & bearer token

- API uses **Laravel session** (cookies) plus **encrypted bearer token** in `Authorization` header
- Token restored by `ApiBearerAuth` on `GET /user`
- SPA stores token via `apiClient` (`src/services/api-client.ts`; default locale `ar`)

Headers for center context:

```
Authorization: Bearer {token}
X-Center-Slug: demo
Accept: application/json
```

### 2.3 Switch center

**`POST /auth/switch-center`**

```json
{
  "membership_id": 1,
  "guard": "parent"
}
```

### 2.4 Logout

**`POST /logout`** — invalidates session.

### 2.5 Current user

**`GET /user`** — returns authenticated user for active guard.

### 2.6 Guards

**`GET /auth/guards`** — lists available login guards for UI tabs.

Public registration (no session):

| Method | Path | Role |
|--------|------|------|
| POST | `/register/center` | Creates a center + admin |
| POST | `/register/student` | Student self-signup into a center |
| POST | `/register/parent` | Parent self-signup |

| Guard key | Laravel guard | Role |
|-----------|---------------|------|
| `users` | `web` | Center admin/staff |
| `teacher` | `teacher` | Teacher |
| `student` | `student` | Student |
| `parent` | `parent` | Parent |
| `platform_admin` | `platform_admin` | Platform operator |

---

## 3. Config & bootstrap

| Method | Path | Description |
|--------|------|-------------|
| GET | `/config` | Storage/tenancy mode metadata |
| GET | `/dashboard` | Role-aware dashboard stats |
| GET | `/admin/bootstrap` | Full admin reference payload |
| GET | `/teacher/bootstrap` | Teacher sections, sessions, etc. |
| GET | `/parent/bootstrap` | Parent children and summaries |
| GET | `/student/bootstrap` | Student profile and data |
| GET | `/parent/portal` | Portal center list |
| GET | `/student/portal` | Portal center list |

---

## 4. Admin endpoints (center-scoped)

Requires guard `users` (admin/staff). Pass `X-Center-Slug` or initialize via session.

### People & structure

| Method | Path | Action |
|--------|------|--------|
| POST | `/admin/students` | Create student |
| PUT | `/admin/students/{id}` | Update student |
| POST | `/admin/teachers` | Create teacher |
| PUT | `/admin/teachers/{id}` | Update teacher |
| POST | `/admin/parents` | Create parent |
| PUT | `/admin/parents/{id}` | Update parent |
| POST | `/admin/students/{id}/assign-center` | Assign existing student by membership |
| GET | `/admin/students/search-by-code` | Lookup student code |
| POST/PUT/DELETE | `/admin/grades`, `/admin/classes`, `/admin/sections` | Academic CRUD |
| GET | `/admin/governorates`, `/admin/cities`, `/admin/areas` | Location lookups |

### Curriculum & content

| Method | Path | Action |
|--------|------|--------|
| POST/PUT | `/admin/units`, `/admin/lessons` | Curriculum |
| POST/PUT | `/admin/questions`, `/admin/questions/bulk` | Question bank |
| POST/PUT/GET/DELETE | `/admin/exam-bank` | Exam builder, generate, export |
| POST/PUT | `/admin/homework` | Homework + submissions review |
| POST/PUT/DELETE | `/admin/fees`, `/admin/fees/{id}` | Fees |
| POST/PUT | `/admin/library`, `/admin/announcements` | Content |

### Operations (section + date)

| Method | Path | Action |
|--------|------|--------|
| GET/POST | `/admin/attendance/section/{sectionId}/date/{date}` | Attendance sheet |
| GET | `/admin/attendance/section/{sectionId}/history` | History |
| GET/POST | `/admin/exams/section/{sectionId}/date/{date}` | Exam scores |
| GET/POST | `/admin/quizzes/section/{sectionId}/date/{date}` | Quiz scores |
| GET/POST | `/admin/payments/section/{sectionId}/date/{date}` | Payments |
| GET | `/admin/reports` | Aggregated reports |

### Sessions

| Method | Path | Action |
|--------|------|--------|
| GET/POST/PUT/DELETE | `/admin/sessions` | Session CRUD |
| POST | `/admin/sessions/generate` | Generate from working days |
| GET | `/admin/sessions/{id}/attendance-qr` | QR payload |
| PUT | `/admin/sessions/{id}/attendance-venue` | In-person venue |

### RBAC, settings, landing, WhatsApp, certificates

| Method | Path | Action |
|--------|------|--------|
| GET/POST/PUT/DELETE | `/admin/users`, `/admin/roles` | Staff + Spatie roles |
| GET/PUT | `/admin/settings` | Center settings |
| * | `/admin/landing-pages/*` | Landing builder |
| * | `/admin/whatsapp/*` | Templates + send |
| * | `/admin/certifications/*` | Templates + issue |

---

## 5. Teacher endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/bootstrap` | Initial data |
| GET | `/teacher/sessions` | Assigned sessions |
| GET | `/teacher/sessions/{id}/livekit-token` | Video join token |
| GET | `/teacher/sessions/{id}/attendance-qr` | Session QR |
| PUT | `/teacher/sessions/{id}/attendance-venue` | Venue |

---

## 6. Student endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/student/bootstrap` | Read profile/data |
| GET | `/student/sessions/{id}/livekit-token` | Join online session |
| POST | `/student/attendance/check-in` | QR check-in |
| POST/PUT/DELETE | `/student/homework/submissions` | Own submissions |
| POST/PUT/DELETE | `/student/library` | Scoped library CRUD |
| POST/PUT/DELETE | `/student/sessions` | Mutating another teacher's session is rejected |

---

## 7. Platform endpoints

Requires `platform_admin` guard. No center header.

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PUT/DELETE | `/platform/centers` | Center CRUD |
| GET/POST/PUT/DELETE | `/platform/tenants` | Alias of centers |
| GET/POST/PUT/DELETE | `/platform/subscriptions` | Plans |
| GET/POST/PUT/DELETE | `/platform/users` | Platform staff |
| GET | `/platform/roles` | Platform roles |
| GET | `/platform/activity-logs` | Audit log |
| GET | `/platform/students`, `/platform/parents` | Cross-center directories |
| GET/POST/PUT/DELETE | `/platform/governorates`, `/cities`, `/areas` | Locations |
| GET/PUT | `/platform/branding` | Appearance |
| GET/PUT/DELETE | `/ui-icons`, `/platform/ui-icons` | Icon catalog + overrides |
| GET/POST/PUT | `/personal/todos`, `/personal/notes` | Personal productivity |

---

## 8. Public endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/public/landing/{slug}` | None |
| GET | `/public/centers` | None — register/login pickers |
| GET | `/public/centers/{slug}/academic` | None — grade/class/section for signup |
| GET | `/public/stats` | None — landing stats |
| GET | `/config`, `/branding`, `/ui-translations`, `/ui-icons`, `/website-images` | None |

---

## 9. Response conventions

### Success

- JSON body with resource or `{ data: ... }`
- HTTP 200/201

### Errors

```json
{
  "message": "Human-readable error"
}
```

| Code | Meaning |
|------|---------|
| 401 | Unauthenticated |
| 403 | Wrong guard or insufficient permission |
| 404 | Resource or center not found |
| 422 | Validation errors |
| 500 | Server error |

### Validation (422)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."]
  }
}
```

---

## 10. Frontend API modules

TypeScript wrappers in `src/services/endpoints/`:

| Module | Domain |
|--------|--------|
| `auth.ts` | Login, logout, user, register |
| `admin*.ts` | Split admin modules (students, sessions, homework, …) |
| `teacher.ts` / `teacher-sessions.ts` | Teacher portal |
| `student-self.ts` | Student portal |
| `parent.ts` | Parent portal |
| `platform.ts` | Platform admin |
| `dashboard.ts` | Dashboard stats |
| `ui-icons.ts` / `ui-translations.ts` / `website-images.ts` | Appearance |
| `attendance-qr.ts` | Session QR check-in |

List synced in `generated/MANIFEST.json` → `endpointModules`.

---

## 11. Keeping this document current

1. Run `npm run docs:sync` after changing `backend/routes/api.php` or `backend/routes/api/*.php`
2. Update request/response examples here when payload shapes change
3. Add new endpoint groups to section 4–7 following the same table format

**Complete route inventory:** [`generated/api-routes.md`](./generated/api-routes.md)

---

## Related documents

- [System Architecture](./05-system-architecture.md)
- [Security](./10-security.md)
- [Development](./09-development.md)

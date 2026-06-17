# API Documentation

> **Document metadata**  
> Last reviewed: 2026-06-16  
> **Full route list:** `npm run docs:sync` → [`generated/api-routes.md`](./generated/api-routes.md)  
> Implementation: `backend/routes/api.php`, `src/services/endpoints/`

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
- SPA stores token via `apiClient`

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
| GET | `/teacher/bootstrap` | Teacher sections, meetings, etc. |
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
| POST/PUT | `/admin/grades`, `/admin/classes`, `/admin/sections` | Academic CRUD |

### Curriculum & content

| Method | Path | Action |
|--------|------|--------|
| POST/PUT | `/admin/units`, `/admin/lessons` | Curriculum |
| POST/PUT | `/admin/homework` | Homework |
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

### Meetings

| Method | Path | Action |
|--------|------|--------|
| GET/POST/DELETE | `/admin/meeting-series` | Series CRUD |
| GET/POST/PUT/DELETE | `/admin/meetings` | Meetings CRUD |

### RBAC & landing

| Method | Path | Action |
|--------|------|--------|
| GET/POST/PUT | `/admin/users` | Staff users |
| GET/POST/PUT | `/admin/roles` | Roles (Spatie) |
| * | `/admin/landing-pages/*` | Landing builder API |

---

## 5. Teacher endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/teacher/bootstrap` | Initial data |
| GET/POST/DELETE | `/teacher/meeting-series` | Series |
| GET/PUT/DELETE | `/teacher/meetings` | Meetings |
| GET | `/teacher/meetings/{id}/livekit-token` | Video join token |

---

## 6. Student endpoints

| Method | Path | Notes |
|--------|------|-------|
| GET | `/student/bootstrap` | Read profile/data |
| GET | `/student/meetings/{id}/livekit-token` | Join meeting |
| POST/PUT/DELETE | `/student/homework/submissions` | Own submissions |
| POST/PUT/DELETE | `/student/library` | Scoped library CRUD |
| POST/PUT/DELETE | `/student/meetings` | **403** — not allowed |
| POST/PUT/DELETE | `/student/grades` | **403** — not allowed |

---

## 7. Platform endpoints

Requires `platform_admin` guard. No center header.

| Method | Path | Description |
|--------|------|-------------|
| GET/POST/PUT/DELETE | `/platform/centers` | Center CRUD |
| GET/POST/PUT/DELETE | `/platform/tenants` | Legacy alias |
| GET/POST/PUT/DELETE | `/platform/subscriptions` | Plans |
| GET/POST/PUT/DELETE | `/platform/users` | Platform staff |
| GET | `/platform/roles` | Platform roles |
| GET | `/platform/activity-logs` | Audit log |

---

## 8. Public endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/public/landing/{slug}` | None |

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
| `auth.ts` | Login, logout, user |
| `admin.ts` | Admin CRUD |
| `teacher.ts` | Teacher operations |
| `student.ts` | Student portal |
| `parent.ts` | Parent portal |
| `platform.ts` | Platform admin |
| `dashboard.ts` | Dashboard stats |

List synced in `generated/MANIFEST.json` → `endpointModules`.

---

## 11. Keeping this document current

1. Run `npm run docs:sync` after changing `backend/routes/api.php`
2. Update request/response examples here when payload shapes change
3. Add new endpoint groups to section 4–7 following the same table format

**Complete route inventory:** [`generated/api-routes.md`](./generated/api-routes.md)

---

## Related documents

- [System Architecture](./05-system-architecture.md)
- [Security](./10-security.md)
- [Development](./09-development.md)

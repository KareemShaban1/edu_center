# Backend API guide

This document explains how the Laravel API behind EduCenter works: tenancy, authentication, request flow, and how routes are organized.

The SPA (Vite, port `8080` in development) talks to Laravel through `/api`. Vite proxies `/api` to `http://127.0.0.1:8000`.

---

## Stack


| Piece                | Role                                                                 |
| -------------------- | -------------------------------------------------------------------- |
| Laravel (PHP)        | HTTP API, validation, persistence                                    |
| MySQL                | Central + center-scoped data (same database, `center_id` scoping)    |
| Session cookies      | Primary auth for the SPA (`credentials: 'include'`)                  |
| Bearer token         | Optional; restored into the session by `RestoreApiSessionFromBearer` |
| Spatie Media Library | File attachments (library, units, lessons, teachers, announcements)  |
| Spatie Permission    | Admin roles and permission names                                     |


---



## Request path

```
Browser  →  Vite :8080/api/...  →  Laravel :8000/api/...
                cookie rewrite
```

1. Routes are registered on **central domains** (`127.0.0.1`, `localhost`, `APP_DOMAIN`) with prefix `api` (`RouteServiceProvider`).
2. Extra middleware on `routes/api.php` starts a **session**, syncs legacy center session, and can restore a session from `Authorization: Bearer`.
3. The controller resolves the **center** (tenant), then a **service** does the work.
4. Responses are JSON. Form requests return `422` with `message` + `errors` on validation failure.

Typical URL in the browser:

```
http://127.0.0.1:8080/api/admin/bootstrap?tenant_slug=demo
```

---



## Multi-tenancy (centers)

A **center** is a school/tenant stored in the platform `centers` table (`App\Models\Platform\Center`), identified by numeric `id` and `slug` (for example `demo`).

The frontend sends the active center as:

- Query: `?tenant_slug=demo` (always appended by `src/services/api-client.ts`)
- Headers: `X-Tenant-Slug`, `X-Tenant-Id` (and legacy `X-Center-*`)

The backend also stores the same values in the session after login (`api_tenant_id`, `api_tenant_slug`).

`CenterContextManager`:

1. Resolves the center from session, headers, or query.
2. Calls `initialize()`, which sets the Laravel `center` database connection (currently the **same** MySQL database as `mysql`).
3. Eloquent models use `protected $connection = 'center'` plus `BelongsToCenter` so rows are filtered by `center_id`.

Admin controllers typically start with:

```php
['error' => $error, 'tenant' => $tenant] = $this->resolveAdminWebContext($request);
if ($error) {
    return $error;
}
```

That trait (`ResolvesAdminApiContext`) requires:

- Session guard `web` (center admin)
- A resolved center
- An authenticated web user

Teacher / student / parent portals use similar traits (`ResolvesTeacherApiContext`, and so on) with their own guards.

---



## Authentication



### Guards

Frontend `guard` values map to Laravel guards (`ApiGuardMaps`):


| Client `guard`                   | Laravel guard    | Portal role |
| -------------------------------- | ---------------- | ----------- |
| `users` / `admin`                | `web`            | admin       |
| `teacher`                        | `teacher`        | teacher     |
| `student`                        | `student`        | student     |
| `parent`                         | `parent`         | parent      |
| `super_admin` / `platform_admin` | `platform_admin` | super_admin |




### Endpoints (`routes/api/auth.php`)


| Method | Path                      | Purpose                                                  |
| ------ | ------------------------- | -------------------------------------------------------- |
| GET    | `/api/auth/guards`        | List guard names                                         |
| POST   | `/api/login`              | Login (email, password, optional `guard`, `tenant_slug`) |
| POST   | `/api/register/parent`    | Public parent registration                               |
| POST   | `/api/register/student`   | Public student registration                              |
| POST   | `/api/register/center`    | Public center registration (name, admin, email, phone, password) |
| GET    | `/api/auth/memberships`   | Centers the user belongs to                              |
| POST   | `/api/auth/switch-tenant` | Switch active center                                     |
| POST   | `/api/logout`             | Logout                                                   |
| GET    | `/api/user`               | Current user + ACL (`roles`, `permissions`)              |


Login may return `requires_tenant_selection` and a `memberships` list if the account exists in more than one center.

Admin UI access is further limited by Spatie permissions (sidebar/routes). The Spatie role named `admin` sees all admin links.

---



## Code layout

```
backend/app/
  Http/Controllers/Api/     # Thin HTTP layer
  Http/Requests/            # Validation (Store*/Update*)
  Http/Resources/           # JSON shape for models
  Http/Support/             # Tenancy, uploads, auth helpers
  Services/                 # Business logic
  Models/                   # Eloquent (connection = center)
  Centers/                  # CenterContextManager, provisioner
routes/
  api.php                   # Bootstraps session + includes groups
  api/admin.php
  api/teacher.php
  api/student.php
  api/parent.php
  api/platform.php
  api/auth.php
  api/public.php
  api/locale.php
```

**Flow for a write:**

`FormRequest` (rules) → controller (auth + tenancy) → `*Service` (DB / media) → `*Resource` (JSON).

**Bootstrap pattern:** after login, each portal loads a large snapshot instead of many list endpoints:

- `GET /api/admin/bootstrap`
- `GET /api/teacher/bootstrap`
- `GET /api/student/bootstrap`
- `GET /api/parent/bootstrap`

The React admin pages mostly mutate via POST/PUT/DELETE, then `invalidateQueries({ queryKey: ['admin-bootstrap'] })`.

---



## Media uploads

PHP does not parse files on `PUT` multipart reliably, so file-bearing updates use **POST** to the same id:


| Create                          | Update with files                    |
| ------------------------------- | ------------------------------------ |
| `POST /api/admin/library`       | `POST /api/admin/library/{id}`       |
| `POST /api/admin/units`         | `POST /api/admin/units/{id}`         |
| `POST /api/admin/lessons`       | `POST /api/admin/lessons/{id}`       |
| `POST /api/admin/announcements` | `POST /api/admin/announcements/{id}` |
| `POST /api/admin/teachers`      | `POST /api/admin/teachers/{id}`      |


The SPA sends `FormData` with `files[0]`, `files[1]`, … and optional `remove_media_ids[]`.  
`AdminUploadHelper` validates files; `MediaService` syncs Spatie collections (`config/media.php`).

---



## Locale

`StripApiLocalePrefix` allows optional `/api/en/...` or `/api/ar/...`.  
The SPA often calls admin JSON with `useLocale = false` (no prefix). Some notification / WhatsApp / certification routes are also registered under `{locale}` in `routes/api/locale.php`.

Send `X-Locale: ar|en` as well.

---



## API groups

Base URL: `/api`. All admin/teacher/student/parent center routes need a resolved tenant.

### Public


| Method | Path                                                                  |
| ------ | --------------------------------------------------------------------- |
| GET    | `/config`, `/branding`, `/ui-translations`, `/website-images`         |
| GET    | `/public/centers`, `/public/centers/{slug}/academic`, `/public/stats` |
| GET    | `/public/landing/{slug}`                                              |




### Platform (super admin)

Centers/tenants, branding, subscriptions, platform users, global students/parents lookup, roles, activity logs.  
Guarded by the `platform_admin` session, not the center `web` guard.

### Admin (center)


| Area                                                            | Notes                                                 |
| --------------------------------------------------------------- | ----------------------------------------------------- |
| `/admin/bootstrap`                                              | Grades, classes, sections, people, units, homework, … |
| `/admin/settings`                                               | Center settings                                       |
| Students / teachers / parents                                   | CRUD; teachers support media POST                     |
| Grades / classes / sections                                     | CRUD; delete blocked if children/related rows exist   |
| Units / lessons                                                 | JSON PUT or POST with media                           |
| Homework                                                        | Plus submissions and corrections                      |
| Fees, library, announcements                                    | Library/announcements: POST for media updates         |
| Users / roles                                                   | Spatie ACL for the center                             |
| Sessions                                                        | CRUD + generate                                       |
| Attendance / exams / quizzes / payments                         | By `section/{id}/date/{date}` and history             |
| Reports, WhatsApp, certifications, landing pages, notifications | See `routes/api.php` and `routes/api/admin.php`       |




### Teacher

`GET /teacher/bootstrap`, session list/update/delete, LiveKit token.

### Student

Portal + bootstrap, sessions, attendance, grades, homework submissions, library.

### Parent

`GET /parent/portal`, `GET /parent/bootstrap`.

### Personal

Todos and notes under `/personal/*` (authenticated user).

---



## HTTP conventions


| Status    | Meaning                          |
| --------- | -------------------------------- |
| 200 / 201 | Success (201 on create)          |
| 401       | Not logged in                    |
| 403       | Wrong guard for this portal      |
| 404       | Record missing                   |
| 409       | Delete refused (related records) |
| 422       | Validation or tenant not found   |


Delete rules used by the admin UI:

- Grade: no delete if it still has classes  
- Class: no delete if it still has sections  
- Section: no delete if students/sessions/fees/etc. exist  
- Unit: UI hides delete if the unit has lessons

---



## Calling from the SPA

`src/services/api-client.ts`:

- `credentials: 'include'` so the Laravel session cookie is sent
- JSON: `post` / `put` / `delete`
- Files: `upload(path, FormData)` (POST)
- Admin list/mutate helpers live in `src/services/endpoints/`

Example:

```http
POST /api/admin/classes?tenant_slug=demo
Cookie: laravel_session=...
X-Tenant-Slug: demo
Content-Type: application/json

{ "name": "A", "grade_id": 1, "notes": "optional" }
```

---



## Related files


| File                                                   | Why                                  |
| ------------------------------------------------------ | ------------------------------------ |
| `backend/routes/api.php`                               | Session wrapper and includes         |
| `backend/app/Providers/RouteServiceProvider.php`       | `/api` prefix + domains              |
| `backend/app/Centers/CenterContextManager.php`         | Resolve and bind `center` connection |
| `backend/app/Http/Support/ResolvesAdminApiContext.php` | Admin auth + tenant                  |
| `backend/app/Http/Support/AuthLoginHandler.php`        | Login / switch center                |
| `backend/app/Services/AdminBootstrapService.php`       | Admin snapshot payload               |
| `src/services/api-client.ts`                           | Browser HTTP client                  |



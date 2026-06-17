# Testing Documentation

> **Document metadata**  
> Last reviewed: 2026-06-16  
> Test locations: `src/**/*.test.ts`, `backend/tests/`

---

## 1. Testing strategy

EduCenter uses a **pragmatic test pyramid**:

| Layer | Tool | Focus |
|-------|------|-------|
| Unit | Vitest (FE), PHPUnit (BE) | Pure functions, helpers |
| Integration | PHPUnit Feature tests | API routes, auth, scoping |
| E2E | Manual / future Playwright | Critical user flows |
| Load | Manual / k6 (future) | Bootstrap and login under load |

**Current state:** Minimal automated coverage — example tests only. This document defines target strategy and sample cases to implement.

---

## 2. Frontend testing

### 2.1 Setup

```bash
npm test              # vitest run
npm run test:watch    # watch mode
```

Config: `vitest.config.ts`  
Environment: jsdom (if configured in vitest setup)

### 2.2 Unit tests (target)

| Area | Examples to test |
|------|------------------|
| `src/lib/routes.ts` | `getDashboardPath()` per role |
| API client | Token header injection, tenant slug |
| Form validators | Zod schemas for CRUD forms |
| Locale | Key fallback en → ar |

### 2.3 Component tests (target)

| Component | Cases |
|-----------|-------|
| `ProtectedRoute` | Redirect when unauthenticated; wrong role |
| `PwaInstallButton` | Hidden when standalone |
| `DataTable` | Sort, empty state |

### 2.4 Running with mock API

Set `VITE_USE_MOCK=true` for UI development without backend — not for automated CI unless mock handlers are deterministic.

---

## 3. Backend testing

### 3.1 Setup

```bash
cd backend
cp .example.env .env.testing   # create if missing
php artisan test
```

Config: `backend/phpunit.xml`

### 3.2 Unit tests (target)

| Class | Cases |
|-------|-------|
| `ApiBearerAuth` | Valid token restores session; expired rejects |
| `CenterContextManager` | Resolves center by slug; fails unknown |
| `GlobalMembershipService` | Lists memberships; switch center |

### 3.3 Feature / integration tests (priority)

| ID | Test case | Assert |
|----|-----------|--------|
| IT-AUTH-01 | POST `/api/login` admin with valid center | 200, user + token |
| IT-AUTH-02 | POST `/api/login` admin without center_slug | 422/400 |
| IT-AUTH-03 | GET `/api/admin/bootstrap` without auth | 401 |
| IT-AUTH-04 | Parent portal login multi-membership | selection payload |
| IT-SCOPE-01 | Admin A cannot read center B students | Empty or 403 |
| IT-SCOPE-02 | Student POST meeting | 403 |
| IT-PLT-01 | Platform center CRUD as platform_admin | 200 |
| IT-PLT-02 | Platform route as center admin | 403 |

### 3.4 Database testing

- Use SQLite in-memory or dedicated `edu_center_test` database
- Run migrations before test suite
- Seed minimal center + user fixtures per test class

---

## 4. Load testing (planned)

| Scenario | Target | Tool |
|----------|--------|------|
| 50 concurrent logins | p95 < 2s | k6 |
| Admin bootstrap 100 req/min | p95 < 3s | k6 |
| LiveKit token endpoint | p95 < 500ms | k6 |

Script location (future): `tests/load/login.js`

---

## 5. Manual test cases (smoke)

Run before each release:

### Authentication

| # | Steps | Expected |
|---|-------|----------|
| M-01 | Admin login at `/demo/login` | Lands on `/admin` |
| M-02 | Teacher login same center | Lands on `/teacher` |
| M-03 | Student portal login | Lands on `/student` |
| M-04 | Parent portal login | Lands on `/parent` |
| M-05 | Platform login | Lands on `/platform` |
| M-06 | Logout | Returns to login; `/api/user` 401 |

### Center isolation

| # | Steps | Expected |
|---|-------|----------|
| M-10 | Create student in center A | Not visible in center B bootstrap |
| M-11 | API with wrong `X-Center-Slug` | Error or empty data |

### Operations

| # | Steps | Expected |
|---|-------|----------|
| M-20 | Record attendance section/date | Saves; history shows date |
| M-21 | Record payment | Appears in reports |
| M-22 | Create meeting + LiveKit join | Token works; room connects |

### i18n & PWA

| # | Steps | Expected |
|---|-------|----------|
| M-30 | Switch to Arabic | RTL layout, Arabic strings |
| M-31 | Install PWA (Chrome) | App opens standalone |

---

## 6. Regression checklist by module

| Module | Key regression |
|--------|----------------|
| Academic structure | Section-teacher pivot |
| Fees | Fee type calculations in reports |
| Global identity | Switch center mid-session |
| Landing pages | Publish/unpublish public URL |
| RBAC | Limited user cannot delete students |

---

## 7. CI integration (recommended)

```yaml
# .github/workflows/test.yml (future)
jobs:
  frontend:
    steps:
      - run: npm ci
      - run: npm run lint
      - run: npm test
  backend:
    steps:
      - run: composer install
      - run: php artisan test
```

---

## 8. Test data

| Command | Purpose |
|---------|---------|
| `php artisan centers:create-test` | Demo center with sample data |
| `PlatformAdminSeeder` | Platform admin account |
| `RolesAndPermissionsSeeder` | Per-center RBAC |

Document demo credentials in internal runbook only — not in public docs.

---

## Related documents

- [SRS — functional requirements](./02-software-requirements.md)
- [Development — setup](./09-development.md)
- [PRD — acceptance criteria](./03-product-requirements.md)

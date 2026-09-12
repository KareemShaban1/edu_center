# Testing Documentation

> **Document metadata**  
> Last reviewed: 2026-09-12  
> Test locations: `src/**/*.test.ts`, `backend/tests/`  
> Manual plan: [14-manual-test-plan.md](./14-manual-test-plan.md)  
> In-app module: `/developer/testing`

---

## 1. Testing strategy

EduCenter uses a **pragmatic test pyramid**:

| Layer | Tool | Focus |
|-------|------|-------|
| Unit | Vitest (FE), PHPUnit (BE) | Pure functions, helpers, catalogs |
| Integration | PHPUnit Feature tests | All `/api` routes: catalog, public, auth, unauthenticated smoke |
| Live suite | Platform Testing module | Hits the running API with the signed-in session |
| Manual | Checklist in docs + `/developer/testing` | Every screen and role flow |
| E2E | Manual / future Playwright | Critical user flows |
| Load | Manual / k6 (future) | Bootstrap and login under load |

---

## 2. Commands

From the repository root:

```bash
npm test                 # Vitest once
npm run test:watch       # Vitest watch
npm run test:backend     # PHPUnit via Laravel
npm run test:all         # Frontend then backend
```

Backend only:

```bash
cd backend
php artisan test
php artisan test --filter=Api
```

After adding routes, regenerate the API catalog used by the Testing module:

```bash
npm run docs:sync
```

---

## 3. Frontend testing

Config: `vitest.config.ts` (jsdom).

```bash
npm test
```

### 3.1 Automated cases (current)

| File | Asserts |
|------|---------|
| `src/lib/routes.test.ts` | Dashboard and login paths per role |
| `src/lib/api-test-suite.test.ts` | Public route detection, dummy params, verdicts |
| `src/config/manual-test-plan.test.ts` | Plan IDs are unique and cover every role |

### 3.2 Target unit tests (still useful)

| Area | Examples |
|------|----------|
| API client | Token header injection, tenant slug |
| Form validators | Zod schemas for CRUD forms |
| Locale | Key fallback en → ar |

### 3.3 Running with mock API

Set `VITE_USE_MOCK=true` for UI development without backend — not for automated CI unless mock handlers are deterministic.

---

## 4. Backend API tests

Config: `backend/phpunit.xml`. Tests send requests to `http://127.0.0.1/api/...` so they match domain-bound routes in `config/centers.php`.

| File | What it covers |
|------|----------------|
| `tests/Feature/Api/ApiRouteCatalogTest.php` | Every split `routes/api*.php` file is registered under the `api` prefix |
| `tests/Feature/Api/PublicApiTest.php` | Public GETs (`/config`, `/branding`, `/auth/guards`, `/public/centers`, `/public/stats`, icons, translations, images) |
| `tests/Feature/Api/AuthApiTest.php` | Login validation, `/user` unauthenticated, logout |
| `tests/Feature/Api/ProtectedApiUnauthenticatedTest.php` | Every registered API route without a session: never 500; protected routes 401/403 (or 404/405) |

These tests do **not** mutate tenant data. Authenticated CRUD is exercised live from `/developer/testing` (GET suite) and by the manual plan.

If MySQL is unavailable, Feature tests that touch the database will fail — keep `.env` pointed at a working local database when running `php artisan test`.

---

## 5. Platform Testing module

Route: `/developer/testing` (developer portal; platform / super admin).

| Tab | Purpose |
|-----|---------|
| **Manual plan** | Interactive checklist (same cases as [14-manual-test-plan.md](./14-manual-test-plan.md)); progress stored in the browser |
| **API tests** | Live suite against all catalogued endpoints. Unauthenticated: public 2xx / protected 401. Authenticated GET: current bearer token, mutating methods skipped |
| **Automated** | Commands and file list for Vitest + PHPUnit |

A 5xx from the live suite is always a failure.

---

## 6. Load testing (planned)

| Scenario | Target | Tool |
|----------|--------|------|
| 50 concurrent logins | p95 < 2s | k6 |
| Admin bootstrap 100 req/min | p95 < 3s | k6 |
| LiveKit token endpoint | p95 < 500ms | k6 |

Script location (future): `tests/load/login.js`

---

## 7. Regression checklist by module

Use the full plan in [14-manual-test-plan.md](./14-manual-test-plan.md). High-risk regressions:

| Module | Key regression |
|--------|----------------|
| Academic structure | Section-teacher pivot |
| Fees | Fee type calculations in reports |
| Global identity | Switch center mid-session |
| Landing pages | Publish/unpublish public URL |
| RBAC | Limited user cannot delete students |
| Center isolation | Admin A cannot read center B students |

---

## 8. CI integration (recommended)

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

## 9. Test data

| Command | Purpose |
|---------|---------|
| `php artisan centers:create-test` | Demo center with sample data |
| `PlatformAdminSeeder` | Platform admin account |
| `RolesAndPermissionsSeeder` | Per-center RBAC |

Document demo credentials in internal runbook only — not in public docs.

---

## Related documents

- [Manual test plan](./14-manual-test-plan.md)
- [Demo flows](./15-demo-flows.md)
- [SRS — functional requirements](./02-software-requirements.md)
- [Development — setup](./09-development.md)
- [PRD — acceptance criteria](./03-product-requirements.md)
- [API](./07-api.md)

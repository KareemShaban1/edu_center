# EduCenter Documentation

Living documentation for the EduCenter education management platform. Keep it current by running **`npm run docs:sync`** after route, migration, or schema changes — this also copies files to `public/docs/` for the Developer viewer at `/developer/documentation`.

## Current system snapshot

> Last synced with the codebase: **2026-09-12** (via `npm run docs:sync`)

| Item | Current value |
|------|----------------|
| Product UI | React SPA (Vite) + Laravel 9 JSON API — Blade is legacy only |
| Isolation | Shared MySQL, `center_id` + `center_memberships` |
| Roles | `admin`, `teacher`, `student`, `parent`, `super_admin`, `platform_admin` |
| API routes | **235** — see [`generated/api-routes.md`](./generated/api-routes.md) |
| Frontend routes | **131** — see [`generated/frontend-routes.md`](./generated/frontend-routes.md) |
| Database tables | **60** schema / **49** migrations — see [`generated/database-tables.md`](./generated/database-tables.md) |
| Locales | English + Arabic (RTL); default locale **`ar`** |
| Platform extras | Locations, subscriptions, users/roles, activity logs |
| Developer extras | Branding, icons, documentation, **Testing** (`/developer/testing`), images, translations, API explorer |
| Public onboarding | `/center/register`, `/student/register`, `/parent/register` |

**Shipped since the June 2026 draft docs:** scheduled **sessions** (not “meetings”), attendance **QR check-in**, exam **bank / builder**, bulk questions, certifications, personal todos/notes, Egypt location hierarchy, UI icon overrides, live API test suite, demo filming scripts.

## Quick sync

```bash
npm run docs:sync
```

This regenerates machine-readable sections in [`generated/`](./generated/) from:

| Source | Generated file |
|--------|----------------|
| `backend/routes/api.php` | `generated/api-routes.md` |
| `src/App.tsx` | `generated/frontend-routes.md` |
| `backend/database/migrations/`, `config/centers.php` | `generated/database-tables.md` |
| Manifest | `generated/MANIFEST.json` |

Manual sections (business goals, user stories, security policies) are edited directly in the numbered docs below.

---

## Documentation index

| # | Document | Purpose |
|---|----------|---------|
| 1 | [Business Requirements (BRD)](./01-business-requirements.md) | Vision, objectives, stakeholders, KPIs, scope |
| 2 | [Software Requirements (SRS)](./02-software-requirements.md) | Functional & non-functional requirements |
| 3 | [Product Requirements (PRD)](./03-product-requirements.md) | Features, priorities, acceptance criteria |
| 4 | [User Stories & Use Cases](./04-user-stories-and-use-cases.md) | Role-based interactions and flows |
| 5 | [System Architecture](./05-system-architecture.md) | Services, databases, APIs, infrastructure |
| 6 | [Database](./06-database.md) | ERD, tables, relationships, scoping |
| 7 | [API](./07-api.md) | Endpoints, auth, request/response patterns |
| 8 | [UI/UX](./08-ui-ux.md) | Screens, flows, design system, responsive behavior |
| 9 | [Development](./09-development.md) | Setup, env, standards, folder structure, Git |
| 10 | [Security](./10-security.md) | Auth, authorization, encryption, incident response |
| 11 | [Deployment](./11-deployment.md) | Servers, CI/CD, env vars, rollback |
| 12 | [Testing](./12-testing.md) | Strategy, automated suites, platform Testing module |
| 13 | [User Guide](./13-user-guide.md) | Arabic end-user guide (no technical details) — public at `/guide` |
| 14 | [Manual Test Plan](./14-manual-test-plan.md) | Screen-by-screen manual cases; also at `/developer/testing` |
| 15 | [Demo flows](./15-demo-flows.md) | A-to-Z filming scripts for center, student, and parent |

## Legacy / supplementary

| Document | Notes |
|----------|-------|
| [PROJECT_DESCRIPTION.md](./PROJECT_DESCRIPTION.md) | High-level overview (some tenancy wording is legacy) |
| [PROJECT_DESCRIPTION_AR.md](./PROJECT_DESCRIPTION_AR.md) | وصف عربي مبسّط للمستخدمين غير التقنيين |
| [DEPLOYMENT_CONTABO_AAPANEL.md](./DEPLOYMENT_CONTABO_AAPANEL.md) | Contabo + aaPanel nginx guide |
| [UI_UX_PROMPT_EGYPT_AR.md](./UI_UX_PROMPT_EGYPT_AR.md) | Arabic/Egypt UX prompt reference |
| [STITCH_MOBILE_DASHBOARDS_PROMPT_AR.md](./STITCH_MOBILE_DASHBOARDS_PROMPT_AR.md) | Ready-to-paste Stitch AI prompt for the four mobile account experiences |

---

## Maintenance workflow

1. **Code change** (routes, migrations, roles, pages) → run `npm run docs:sync`
2. **Product/business change** → edit BRD, PRD, or user stories manually
3. **Deployment change** → update `11-deployment.md` and env references in `09-development.md`
4. **Security policy change** → update `10-security.md`

Each doc includes a **Document metadata** block at the top with last-reviewed date and source-of-truth paths.

# Development Documentation

> **Document metadata**  
> Last reviewed: 2026-09-12  
> Frontend client: `src/services/api-client.ts`  
> API routes: `backend/routes/api.php` + `backend/routes/api/*.php`

---

## 1. Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| PHP | 8.1+ |
| Composer | 2.x |
| MySQL | 8.0+ |
| Git | 2.x |

Optional: Redis (cache/queue), LiveKit server, queue worker (`php artisan queue:work`)

---

## 2. Project setup

### 2.1 Clone and install

```bash
git clone <repository-url> edu-center
cd edu-center
npm install
cd backend
composer install
```

### 2.2 Backend environment

```bash
cd backend
cp .example.env .env
php artisan key:generate
```

Edit `.env`:

```env
APP_NAME=EduCenter
APP_URL=http://127.0.0.1:8000
APP_DOMAIN=localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=edu_center
DB_USERNAME=root
DB_PASSWORD=

GLOBAL_IDENTITY_ENABLED=true
```

### 2.3 Database

```bash
php artisan migrate
php artisan db:seed --class=Database\\Seeders\\Platform\\PlatformAdminSeeder
php artisan centers:install
php artisan centers:create-test   # optional demo center
```

### 2.4 Frontend environment

Create `.env.local` at repo root (optional):

```env
VITE_API_BASE_URL=/api
VITE_DEFAULT_LOCALE=ar
VITE_USE_MOCK=false
# Optional: gate /platform/login (dev default is "platform")
# VITE_PLATFORM_ACCESS_PASSWORD=platform
```

### 2.5 Run development servers

One command (API + frontend):

```bash
npm start
```

Or separately:

```bash
# Terminal 1 — Laravel
cd backend
php artisan serve

# Terminal 2 — Vite
npm run dev
```

Open `http://127.0.0.1:8080` (API on `http://127.0.0.1:8000`).

---

## 3. Environment variables

### Frontend (`VITE_*`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `/api` (dev proxy) | API base URL in production |
| `VITE_DEFAULT_LOCALE` | `ar` | Default UI locale (`src/services/api-client.ts`) |
| `VITE_USE_MOCK` | `false` | Use mock API instead of backend |
| `VITE_PLATFORM_ACCESS_PASSWORD` | `platform` | Extra gate on `/platform/login` |
| `VITE_AUTH_LOGIN_ENDPOINT` | `/login` | Override login path |
| `VITE_AUTH_LOGOUT_ENDPOINT` | `/logout` | Override logout path |
| `VITE_AUTH_USER_ENDPOINT` | `/user` | Override user path |

### Backend (key variables)

| Variable | Purpose |
|----------|---------|
| `APP_DOMAIN` | Center subdomain base |
| `GLOBAL_IDENTITY_ENABLED` | Parent/student global login |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Video sessions |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Web push |
| `FCM_SERVER_KEY` | Firebase push |
| `ZOOM_CLIENT_KEY`, `ZOOM_CLIENT_SECRET` | Legacy Zoom |

Full template: `backend/.example.env`

---

## 4. Folder structure

```
edu-center/
├── src/                          # React SPA
│   ├── App.tsx                   # Routes (~128)
│   ├── components/               # Shared UI + shadcn
│   ├── contexts/                 # Auth, Locale, UiIcons, Branding
│   ├── hooks/                    # Custom hooks
│   ├── pages/                    # Route pages by role
│   ├── services/api-client.ts    # HTTP client (default locale ar)
│   ├── services/endpoints/       # API modules
│   ├── types/                    # TypeScript models
│   └── lib/                      # Utilities, routes helper
├── public/                       # Static assets, PWA icons, copied docs/
├── scripts/                      # sync-documentation, PWA icons
├── docs/                         # Project documentation (viewer source)
├── backend/
│   ├── app/
│   │   ├── Centers/              # Multi-center module
│   │   ├── Http/Controllers/     # Web + API controllers
│   │   ├── Models/               # Eloquent models
│   │   └── Repository/           # Data access layer
│   ├── config/centers.php        # Scoping config
│   ├── database/migrations/      # Schema
│   ├── routes/api.php            # SPA API entry
│   ├── routes/api/*.php          # Split route files
│   └── resources/views/          # Legacy Blade (do not extend)
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

---

## 5. Coding standards

### Frontend

| Rule | Detail |
|------|--------|
| Language | TypeScript strict mode |
| Lint | `npm run lint` (ESLint) |
| Components | Functional components + hooks |
| State | TanStack Query for server state; React Context for auth, locale, UiIcons, branding |
| Styling | Tailwind utility classes; shadcn variants |
| Paths | `@/` alias → `src/` |
| Forms | react-hook-form + Zod schemas |

### Backend

| Rule | Detail |
|------|--------|
| PHP | 8.1+, `declare(strict_types=1)` in new center module |
| Style | PSR-12, Laravel conventions |
| Models | Use `BelongsToCenter` / membership traits |
| API | Validate in route closures or Form Requests |
| Permissions | Spatie — check in controllers for sensitive actions |

### Documentation

After route or migration changes:

```bash
npm run docs:sync
```

---

## 6. Git workflow

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready |
| `develop` | Integration (if used) |
| `feature/*` | New features |
| `fix/*` | Bug fixes |

**Recommended flow:**
1. Branch from `main`
2. Implement + run `npm run lint`, `npm run test:all`
3. Run `npm run docs:sync` if API/schema/docs changed
4. Pull request with description and test plan
5. Merge after review

**Do not commit:** `.env`, credentials, `vendor/`, `node_modules/`

---

## 7. Common tasks

| Task | Command |
|------|---------|
| Run API + frontend | `npm start` |
| Build SPA | `npm run build` |
| Preview build | `npm run preview` |
| Run frontend tests | `npm test` |
| Run backend tests | `npm run test:backend` |
| Run all automated tests | `npm run test:all` |
| Create center | `php artisan centers:create-test` or platform UI |
| Sync docs (and copy to `public/docs`) | `npm run docs:sync` |
| Generate PWA icons | `npm run icons:generate` |

---

## 8. API client usage

```typescript
import { apiClient } from '@/services/api-client';

// Center context set after login
apiClient.setTenantSlug('demo');

// TanStack Query example
const { data } = useQuery({
  queryKey: ['admin-bootstrap'],
  queryFn: () => adminApi.getBootstrap(),
});
```

---

## 9. Troubleshooting

| Issue | Check |
|-------|-------|
| API 404 on dev | Laravel running on `:8000`; Vite proxy in `vite.config.ts` |
| CORS/session | Same-site cookies; use proxy not cross-origin in dev |
| Center not found | `center_slug` header or subdomain; center exists in DB |
| Empty bootstrap | User guard is `users`; center initialized |
| Mock data showing | `VITE_USE_MOCK=true` |

---

## Related documents

- [API](./07-api.md)
- [Deployment](./11-deployment.md)
- [Testing](./12-testing.md)

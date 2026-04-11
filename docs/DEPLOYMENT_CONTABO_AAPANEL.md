# Deploying Edu-Center on Contabo with aaPanel

This guide covers running **edu-center** on a **Contabo** VPS using **aaPanel**: Laravel in `backend/` with **Stancl Tenancy** (one MySQL database per tenant, domain/subdomain routing), plus the optional **Vite/React** app at the repo root (API base URL via `VITE_API_BASE_URL`).

---

## 1. Server and aaPanel baseline

1. **OS**: Ubuntu 22.04 or 24.04 on Contabo is typical.
2. In **aaPanel**, install **Nginx**, **MySQL 8**, **PHP 8.2+** (match `backend/composer.json`), and PHP extensions Laravel needs: `openssl`, `pdo_mysql`, `mbstring`, `tokenizer`, `xml`, `ctype`, `json`, `bcmath`, `fileinfo`, `curl`. Add **Redis** and `php-redis` if you use queues or Redis cache in production.
3. **Firewall**: open **80**, **443**, and **22** (SSH). If Contabo provides a cloud firewall, mirror the same rules.

---

## 2. Deploy the Laravel app (`backend/`)

**Recommended layout:** one site whose **document root** is `backend/public` (not the repository root).

1. Upload code (git clone or SFTP) to e.g. `/www/wwwroot/edu-center`.
2. In aaPanel, set the website **root** to:
   - `/www/wwwroot/edu-center/backend/public`
3. From `backend/`, install dependencies:

   ```bash
   cd /www/wwwroot/edu-center/backend
   composer install --no-dev --optimize-autoloader
   ```

4. **Environment** (`backend/.env`):
   - `APP_ENV=production`, `APP_DEBUG=false`, strong `APP_KEY` (`php artisan key:generate`)
   - `APP_URL=https://your-apex-domain.com`
   - `DB_*` for the **central** database (tenants, domains, platform admin, etc.)
   - `SESSION_DOMAIN`, Sanctum/cookie settings if the SPA runs on another subdomain
   - Mail, `QUEUE_CONNECTION` (`database` or `redis` in production), etc.

5. **Permissions** (typical):

   ```bash
   chown -R www:www storage bootstrap/cache
   chmod -R ug+rwx storage bootstrap/cache
   ```

6. **Migrate the central database**:

   ```bash
   php artisan migrate --force
   ```

   Optional seed (demo data): see `backend/MULTI_TENANT_LOGIN_GUIDE.md` (`php artisan db:seed --force`).

7. **Optimize**:

   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

8. **Nginx**: use the standard Laravel rule `try_files $uri $uri/ /index.php?$query_string;` with PHP-FPM. aaPanel’s Laravel template is usually sufficient. Set `client_max_body_size` for uploads if needed.

---

## 3. Multi-tenant behavior in this project

Relevant files: `backend/config/tenancy.php`, `backend/routes/tenant.php`.

- **Tenant context** uses **`InitializeTenancyByDomainOrSubdomain`**: the request **Host** must match a **domain** record for that tenant (Stancl), not only a path slug.
- **Central** (platform) traffic must use hostnames listed in **`central_domains`** in `config/tenancy.php`. For production, add your real apex (and `www` if used), e.g. `yourdomain.com`, `www.yourdomain.com`, or a dedicated host like `platform.yourdomain.com`.
- **Each tenant** gets its own MySQL database (`tenant_*` naming). The MySQL user in `.env` must be allowed to **`CREATE DATABASE`** (and drop, if you delete tenants), or automatic provisioning fails when `TenantCreated` runs `CreateDatabase` (see `TenancyServiceProvider`).

### DNS

- Point **`A`** for `@` and **`*.yourdomain.com`** (wildcard) to the server IP so hosts like `school1.yourdomain.com` resolve.

### SSL

- Issue certificates for the apex and, if possible, **wildcard** `*.yourdomain.com` (often DNS validation in aaPanel). Without wildcard, add each tenant hostname or use whatever pattern your panel supports.

### Queues

- For production, run a queue worker (aaPanel **Supervisor** or systemd):

  ```bash
  php artisan queue:work --sleep=3 --tries=3
  ```

  If tenant-creation jobs stay synchronous, long-running requests may time out under load.

---

## 4. Handling configuration

| Concern | Where it lives |
|--------|----------------|
| Secrets, DB, mail | `backend/.env` on the server only (do not commit) |
| Central vs tenant DB | Same MySQL server; central DB in `DB_DATABASE`; tenant DBs created by the app |
| Hosts treated as “central” | `backend/config/tenancy.php` → `central_domains` |
| Per-tenant cache/session | Stancl bootstrappers; use **Redis** or file cache consistently in production |

After changing `config/` or `.env`:

```bash
php artisan config:cache
```

---

## 5. Optional: Vite/React app (repo root)

`src/services/api-client.ts` defaults to `http://localhost:8000`. For production:

1. Build (on server or CI):

   ```bash
   cd /www/wwwroot/edu-center
   npm ci
   VITE_API_BASE_URL=https://your-apex-domain.com npm run build
   ```

2. Serve the `dist/` output with Nginx either as the main site (with `/api` proxied to Laravel) or on a subdomain (e.g. `app.yourdomain.com`).

3. If the SPA and API use **different subdomains**, align **CORS**, **Sanctum**, and **`SESSION_DOMAIN`** (often a shared parent like `.yourdomain.com`).

The Blade landing in `backend/resources/views/frontend/` is separate from the Vite app—decide which is the production entry point to avoid conflicting UX.

---

## 6. aaPanel-specific tips

- **One site** for Laravel with `public` as root; optional second site for the static SPA.
- **PHP-FPM** user should match file ownership (`www` or your panel default).
- **MySQL**: create the central database/user in aaPanel; grant **`CREATE`** (or full create DB rights) if tenants are provisioned automatically.
- **Backups**: include the central database and all `tenant_%` databases (or dump the whole MySQL instance).

---

## 7. Pre-launch checklist

1. `central_domains` lists every hostname used for platform access without tenancy.
2. Wildcard (or per-tenant) DNS and SSL for tenant hosts.
3. Tenant records have **domains** matching real FQDNs users open in the browser.
4. MySQL user can create databases for new tenants.
5. `APP_URL` correct, `APP_DEBUG=false`, `APP_KEY` set.
6. Queue worker running if tenant jobs are queued.
7. React build uses `VITE_API_BASE_URL` pointing at the live API if you ship the SPA.

---

## See also

- `backend/MULTI_TENANT_LOGIN_GUIDE.md` — local domains, seeding, and login URLs

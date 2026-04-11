# Multi-Tenant Seeding and Login Guide

## 1) Seed the data

Run from project root:

```bash
php artisan migrate --force
php artisan db:seed --force
```

This seeds:

- Central DB:
  - Platform admin account
  - Tenants: `test` and `demo`
- Each tenant DB:
  - Roles and permissions
  - Tenant admin user
  - Teachers, parents, students
  - Academic setup (grades/classes/sections/months/settings)

---

## 2) Local domain setup for tenants

In local environment, tenant domains are seeded as subdomain keys:

- `test`
- `demo`

Then you access them as:

- `test.localhost`
- `demo.localhost`

If those domains do not resolve on your machine, add this in `C:\Windows\System32\drivers\etc\hosts`:

```text
127.0.0.1 test.localhost
127.0.0.1 demo.localhost
```

---

## 3) How to log in

## 3.1 Platform Admin (central app)

- URL: `http://localhost:8000/platform/login`
- Email: `admin@platform.com`
- Password: `password`

This account manages tenants from platform dashboard.

## 3.2 Tenant dashboards (admin/teacher/student/parent)

Open tenant selection page (example test tenant):

- `http://test.localhost:8000/selection`

Then choose login type and use:

- Admin: `admin@educenter.com` / `password`
- Teacher: `teacher@educenter.com` / `password`
- Parent: `parent@educenter.com` / `password`
- Student: `student@educenter.com` / `password`

You can do the same on demo tenant:

- `http://demo.localhost:8000/selection`

---

## 4) Notes

- Tenant users are isolated per tenant database.
- Same email can exist in different tenants because each tenant has its own DB.
- If credentials fail after old data exists, run fresh migrations + seed:

```bash
php artisan migrate:fresh --force
php artisan db:seed --force
```

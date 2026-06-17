#!/usr/bin/env node
/**
 * Regenerates machine-readable documentation from the codebase.
 * Run: npm run docs:sync
 *
 * Outputs to docs/generated/ — safe to commit after review.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "docs", "generated");

mkdirSync(OUT, { recursive: true });

const now = new Date().toISOString();

function extractApiRoutes() {
  const apiPath = join(ROOT, "backend", "routes", "api.php");
  const content = readFileSync(apiPath, "utf8");
  const routes = [];
  const re =
    /Route::(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/gi;
  let m;
  while ((m = re.exec(content)) !== null) {
    routes.push({ method: m[1].toUpperCase(), path: m[2] });
  }
  const controllerRe =
    /Route::(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]\s*,\s*\[([^\]]+)\]/gi;
  while ((m = controllerRe.exec(content)) !== null) {
    routes.push({
      method: m[1].toUpperCase(),
      path: m[2],
      handler: m[3].trim(),
    });
  }
  const seen = new Set();
  const unique = routes.filter((r) => {
    const key = `${r.method} ${r.path}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  unique.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
  return unique;
}

function extractFrontendRoutes() {
  const appPath = join(ROOT, "src", "App.tsx");
  const content = readFileSync(appPath, "utf8");
  const routes = [];
  const re = /<Route\s+path=["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    routes.push(m[1]);
  }
  return [...new Set(routes)].sort();
}

function extractMigrations() {
  const migDir = join(ROOT, "backend", "database", "migrations");
  const files = readdirSync(migDir)
    .filter((f) => f.endsWith(".php"))
    .sort();
  const tables = [];
  for (const file of files) {
    const content = readFileSync(join(migDir, file), "utf8");
    const createMatch = content.match(
      /Schema::create\s*\(\s*['"]([^'"]+)['"]/
    );
    if (createMatch) {
      tables.push({ table: createMatch[1], migration: file });
    }
  }
  return tables;
}

function extractScopedTables() {
  const configPath = join(ROOT, "backend", "config", "centers.php");
  const content = readFileSync(configPath, "utf8");
  const scoped = [];
  const membership = {};
  const scopedBlock = content.match(/'scoped_tables'\s*=>\s*\[([\s\S]*?)\]/);
  if (scopedBlock) {
    const items = scopedBlock[1].match(/'([^']+)'/g) || [];
    scoped.push(...items.map((s) => s.replace(/'/g, "")));
  }
  const memBlock = content.match(
    /'membership_scoped_tables'\s*=>\s*\[([\s\S]*?)\]/
  );
  if (memBlock) {
    const pairs = memBlock[1].match(/'([^']+)'\s*=>\s*'([^']+)'/g) || [];
    for (const p of pairs) {
      const [, table, role] = p.match(/'([^']+)'\s*=>\s*'([^']+)'/) || [];
      if (table) membership[table] = role;
    }
  }
  return { scoped, membership };
}

function extractUserRoles() {
  const modelsPath = join(ROOT, "src", "types", "models.ts");
  const content = readFileSync(modelsPath, "utf8");
  const match = content.match(/export type UserRole\s*=\s*([^;]+);/);
  if (!match) return [];
  return match[1]
    .split("|")
    .map((s) => s.trim().replace(/'/g, ""))
    .filter(Boolean);
}

function extractEndpointModules() {
  const epDir = join(ROOT, "src", "services", "endpoints");
  try {
    return readdirSync(epDir)
      .filter((f) => f.endsWith(".ts"))
      .map((f) => f.replace(/\.ts$/, ""))
      .sort();
  } catch {
    return [];
  }
}

function writeGeneratedApiRoutes(routes) {
  const lines = [
    "# API Routes (auto-generated)",
    "",
    `> Last synced: ${now}`,
    "> Source: `backend/routes/api.php`",
    "> Regenerate: `npm run docs:sync`",
    "",
    "| Method | Path | Handler |",
    "|--------|------|---------|",
  ];
  for (const r of routes) {
    lines.push(`| ${r.method} | \`/api${r.path.startsWith("/") ? r.path : "/" + r.path}\` | ${r.handler || "closure"} |`);
  }
  writeFileSync(join(OUT, "api-routes.md"), lines.join("\n") + "\n");
}

function writeGeneratedFrontendRoutes(routes) {
  const lines = [
    "# Frontend Routes (auto-generated)",
    "",
    `> Last synced: ${now}`,
    "> Source: `src/App.tsx`",
    "> Regenerate: `npm run docs:sync`",
    "",
    "| Path |",
    "|------|",
  ];
  for (const r of routes) {
    lines.push(`| \`${r}\` |`);
  }
  writeFileSync(join(OUT, "frontend-routes.md"), lines.join("\n") + "\n");
}

function writeGeneratedDatabase(tables, scoped) {
  const lines = [
    "# Database Tables (auto-generated)",
    "",
    `> Last synced: ${now}`,
    "> Sources: `backend/database/migrations/`, `backend/config/centers.php`",
    "> Regenerate: `npm run docs:sync`",
    "",
    "## Migrations → Tables",
    "",
    "| Table | Migration file |",
    "|-------|----------------|",
  ];
  for (const t of tables) {
    lines.push(`| \`${t.table}\` | \`${t.migration}\` |`);
  }
  lines.push("", "## Center-scoped tables (`center_id`)", "");
  for (const t of scoped.scoped) {
    lines.push(`- \`${t}\``);
  }
  lines.push("", "## Membership-scoped tables", "");
  for (const [table, role] of Object.entries(scoped.membership)) {
    lines.push(`- \`${table}\` → role \`${role}\` (via \`center_memberships.profile_id\`)`);
  }
  writeFileSync(join(OUT, "database-tables.md"), lines.join("\n") + "\n");
}

function writeManifest(data) {
  writeFileSync(
    join(OUT, "MANIFEST.json"),
    JSON.stringify({ syncedAt: now, ...data }, null, 2) + "\n"
  );
}

const apiRoutes = extractApiRoutes();
const frontendRoutes = extractFrontendRoutes();
const migrations = extractMigrations();
const scoped = extractScopedTables();
const roles = extractUserRoles();
const endpointModules = extractEndpointModules();

function copyDocsToPublic() {
  const source = join(ROOT, "docs");
  const target = join(ROOT, "public", "docs");
  rmSync(target, { recursive: true, force: true });
  cpSync(source, target, { recursive: true });
}

writeGeneratedApiRoutes(apiRoutes);
writeGeneratedFrontendRoutes(frontendRoutes);
writeGeneratedDatabase(migrations, scoped);
writeManifest({
  apiRouteCount: apiRoutes.length,
  frontendRouteCount: frontendRoutes.length,
  migrationTableCount: migrations.length,
  scopedTableCount: scoped.scoped.length,
  userRoles: roles,
  endpointModules,
});

copyDocsToPublic();

console.log(`Documentation synced at ${now}`);
console.log(`  API routes: ${apiRoutes.length}`);
console.log(`  Frontend routes: ${frontendRoutes.length}`);
console.log(`  DB tables: ${migrations.length}`);
console.log(`  Output: docs/generated/`);
console.log(`  Public copy: public/docs/`);

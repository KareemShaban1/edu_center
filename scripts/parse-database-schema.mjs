import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const COLUMN_METHODS = {
  id: { type: "bigint unsigned", primary: true, autoIncrement: true },
  bigIncrements: { type: "bigint unsigned", primary: true, autoIncrement: true },
  increments: { type: "int unsigned", primary: true, autoIncrement: true },
  unsignedBigInteger: { type: "bigint unsigned" },
  unsignedInteger: { type: "int unsigned" },
  bigInteger: { type: "bigint" },
  integer: { type: "int" },
  tinyInteger: { type: "tinyint" },
  smallInteger: { type: "smallint" },
  boolean: { type: "boolean" },
  string: { type: "varchar" },
  text: { type: "text" },
  mediumText: { type: "mediumtext" },
  longText: { type: "longtext" },
  json: { type: "json" },
  jsonb: { type: "jsonb" },
  uuid: { type: "char(36)" },
  timestamp: { type: "timestamp" },
  date: { type: "date" },
  dateTime: { type: "datetime" },
  time: { type: "time" },
  float: { type: "float" },
  double: { type: "double" },
  decimal: { type: "decimal" },
  foreignId: { type: "bigint unsigned" },
  morphs: { type: "morph" },
  nullableMorphs: { type: "morph" },
  rememberToken: { type: "varchar(100)" },
  softDeletes: { type: "timestamp" },
  timestamps: { type: "timestamps" },
  nullableTimestamps: { type: "timestamps" },
};

function loadPermissionTableNames(configPath) {
  try {
    const content = readFileSync(configPath, "utf8");
    const block = content.match(/'table_names'\s*=>\s*\[([\s\S]*?)\],/);
    if (!block) return {};
    const tables = {};
    const pairs = block[1].matchAll(/'([^']+)'\s*=>\s*'([^']+)'/g);
    for (const [, key, value] of pairs) tables[key] = value;
    return tables;
  } catch {
    return {};
  }
}

function resolveTableName(raw, permissionTables) {
  const expr = raw.trim();
  const quoted = expr.match(/^['"]([^'"]+)['"]$/);
  if (quoted) return quoted[1];
  const permission = expr.match(/\$tableNames\['([^']+)'\]/);
  if (permission) return permissionTables[permission[1]] || permission[1];
  return expr.replace(/^\$/, "");
}

function extractBalancedBlock(content, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < content.length; i += 1) {
    const ch = content[i];
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return content.slice(openBraceIndex + 1, i);
    }
  }
  return "";
}

function expandPermissionVars(content, permissionTables) {
  let expanded = content;
  for (const [key, value] of Object.entries(permissionTables)) {
    expanded = expanded.replaceAll(`$tableNames['${key}']`, `'${value}'`);
    expanded = expanded.replaceAll(`$tableNames["${key}"]`, `'${value}'`);
  }
  return expanded;
}

function splitStatements(body) {
  const cleaned = body
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  const parts = cleaned.split("$table->").slice(1);
  return parts.map((part) => part.trim().replace(/;\s*$/, ""));
}

function firstStringArg(stmt) {
  const match = stmt.match(/\(\s*['"]([^'"]+)['"]/);
  return match ? match[1] : null;
}

function stringArgs(stmt) {
  return [...stmt.matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
}

function parseModifiers(stmt) {
  return {
    nullable: /\->nullable\(\)/.test(stmt),
    unique: /\->unique\(\)/.test(stmt),
    index: /\->index\(\)/.test(stmt),
    primary: /\->primary\(\)/.test(stmt),
    default: (() => {
      const m = stmt.match(/\->default\(([^)]+)\)/);
      if (!m) return undefined;
      return m[1].trim().replace(/^['"]|['"]$/g, "");
    })(),
  };
}

function parseColumnFromMethod(method, stmt) {
  const meta = COLUMN_METHODS[method];
  if (!meta) return null;

  if (method === "timestamps" || method === "nullableTimestamps") {
    const nullable = method === "nullableTimestamps";
    return [
      { name: "created_at", type: "timestamp", nullable },
      { name: "updated_at", type: "timestamp", nullable },
    ];
  }

  if (method === "rememberToken") {
    return [{ name: "remember_token", type: "varchar(100)", nullable: true }];
  }

  if (method === "softDeletes") {
    return [{ name: "deleted_at", type: "timestamp", nullable: true }];
  }

  if (method === "morphs" || method === "nullableMorphs") {
    const prefix = firstStringArg(stmt);
    if (!prefix) return null;
    const nullable = method === "nullableMorphs" || /\->nullable\(\)/.test(stmt);
    return [
      { name: `${prefix}_type`, type: "varchar(255)", nullable },
      { name: `${prefix}_id`, type: "bigint unsigned", nullable, indexed: true },
    ];
  }

  if (method === "id") {
    const mods = parseModifiers(stmt);
    return [{ name: "id", type: "bigint unsigned", primary: true, autoIncrement: true, ...mods }];
  }

  const name = firstStringArg(stmt);
  if (!name) return null;
  const mods = parseModifiers(stmt);

  let type = meta.type;
  if (method === "string") {
    const len = stmt.match(/string\(\s*['"][^'"]+['"]\s*,\s*(\d+)\s*\)/);
    type = len ? `varchar(${len[1]})` : "varchar(255)";
  }
  if (method === "decimal") {
    const dec = stmt.match(/decimal\(\s*['"][^'"]+['"]\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
    type = dec ? `decimal(${dec[1]},${dec[2]})` : "decimal(8,2)";
  }

  return [{ name, type, ...mods }];
}

function parseForeignKey(stmt, permissionTables) {
  const foreignId = stmt.match(/^foreignId\(\s*['"]([^'"]+)['"]\s*\)/);
  if (foreignId) {
    const column = foreignId[1];
    let referencesTable = null;
    let referencesColumn = "id";
    const constrained = stmt.match(/\->constrained\(\s*['"]([^'"]+)['"]\s*\)/);
    const constrainedBare = stmt.match(/\->constrained\(\s*\)/);
    const references = stmt.match(/\->references\(\s*['"]([^'"]+)['"]\s*\)\->on\(\s*['"]([^'"]+)['"]\s*\)/);
    if (constrained) referencesTable = constrained[1];
    else if (constrainedBare) referencesTable = column.replace(/_id$/, "s");
    else if (references) {
      referencesColumn = references[1];
      referencesTable = references[2];
    }
    if (!referencesTable) return null;
    return {
      column,
      referencesTable,
      referencesColumn,
      onDelete: stmt.match(/cascadeOnDelete|onDelete\(\s*['"]cascade['"]\s*\)/) ? "cascade" : undefined,
      onUpdate: stmt.match(/cascadeOnUpdate|onUpdate\(\s*['"]([^'"]+)['"]\s*\)/)?.[1],
    };
  }

  const foreign = stmt.match(/^foreign\(\s*([^)]+)\s*\)/);
  if (foreign) {
    const colRaw = foreign[1].trim();
    const column = colRaw.replace(/['"]/g, "").split(",")[0].trim();
    const references = stmt.match(/\->references\(\s*['"]([^'"]+)['"]\s*\)\->on\(\s*([^)]+)\s*\)/);
    if (!references) return null;
    const referencesColumn = references[1];
    const referencesTable = resolveTableName(references[2], permissionTables);
    return {
      column,
      referencesTable,
      referencesColumn,
      onDelete: stmt.match(/onDelete\(\s*['"]([^'"]+)['"]\s*\)/)?.[1],
      onUpdate: stmt.match(/onUpdate\(\s*['"]([^'"]+)['"]\s*\)/)?.[1],
    };
  }

  return null;
}

function parseIndex(stmt) {
  const uniqueSingle = stmt.match(/^unique\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"]\s*)?\)/);
  if (uniqueSingle) {
    return {
      columns: [uniqueSingle[1]],
      unique: true,
      name: uniqueSingle[2],
    };
  }

  const indexSingle = stmt.match(/^index\(\s*['"]([^'"]+)['"]\s*(?:,\s*['"]([^'"]+)['"]\s*)?\)/);
  if (indexSingle) {
    return {
      columns: [indexSingle[1]],
      unique: false,
      name: indexSingle[2],
    };
  }

  const arrayUnique = stmt.match(/^unique\(\s*\[([^\]]+)\]\s*(?:,\s*['"]([^'"]+)['"]\s*)?\)/);
  if (arrayUnique) {
    const columns = [...arrayUnique[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
    return { columns, unique: true, name: arrayUnique[2] };
  }

  const arrayIndex = stmt.match(/^index\(\s*\[([^\]]+)\]\s*(?:,\s*['"]([^'"]+)['"]\s*)?\)/);
  if (arrayIndex) {
    const columns = [...arrayIndex[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
    return { columns, unique: false, name: arrayIndex[2] };
  }

  const primary = stmt.match(/^primary\(\s*\[([^\]]+)\]\s*(?:,\s*['"]([^'"]+)['"]\s*)?\)/);
  if (primary) {
    const columns = [...primary[1].matchAll(/['"]([^'"]+)['"]/g)].map((m) => m[1]);
    return { columns, unique: true, primary: true, name: primary[2] };
  }

  return null;
}

function ensureTable(schema, tableName, migrationFile) {
  if (!schema.has(tableName)) {
    schema.set(tableName, {
      name: tableName,
      createMigration: migrationFile,
      migrations: [],
      columns: [],
      indexes: [],
      foreignKeys: [],
    });
  }
  const table = schema.get(tableName);
  if (!table.migrations.includes(migrationFile)) table.migrations.push(migrationFile);
  return table;
}

function upsertColumn(table, column) {
  const idx = table.columns.findIndex((c) => c.name === column.name);
  const normalized = {
    name: column.name,
    type: column.type,
    nullable: column.nullable ?? false,
    default: column.default,
    primary: column.primary ?? false,
    unique: column.unique ?? false,
    indexed: column.indexed ?? false,
    autoIncrement: column.autoIncrement ?? false,
  };
  if (idx >= 0) table.columns[idx] = { ...table.columns[idx], ...normalized };
  else table.columns.push(normalized);
}

function applyStatement(table, stmt, permissionTables) {
  const methodMatch = stmt.match(/^([a-zA-Z]+)\(/);
  if (!methodMatch) return;
  const method = methodMatch[1];

  if (method === "dropColumn") {
    const cols = stringArgs(stmt);
    table.columns = table.columns.filter((c) => !cols.includes(c.name));
    return;
  }

  if (method === "dropForeign") return;

  const fk = parseForeignKey(stmt, permissionTables);
  if (fk) {
    upsertColumn(table, {
      name: fk.column,
      type: "bigint unsigned",
      nullable: /\->nullable\(\)/.test(stmt),
      indexed: true,
    });
    if (!table.foreignKeys.some((f) => f.column === fk.column && f.referencesTable === fk.referencesTable)) {
      table.foreignKeys.push(fk);
    }
    return;
  }

  const index = parseIndex(stmt);
  if (index) {
    if (!table.indexes.some((i) => JSON.stringify(i.columns) === JSON.stringify(index.columns) && i.unique === index.unique)) {
      table.indexes.push(index);
    }
    for (const col of index.columns) {
      const existing = table.columns.find((c) => c.name === col);
      if (existing) existing.indexed = true;
      if (index.unique) {
        if (existing) existing.unique = true;
      }
    }
    return;
  }

  const columns = parseColumnFromMethod(method, stmt);
  if (columns) {
    for (const col of columns) {
      const mods = parseModifiers(stmt);
      upsertColumn(table, { ...col, ...mods, indexed: col.indexed || mods.index });
    }
  }
}

function extractSchemaBlocks(content) {
  const blocks = [];
  const re = /Schema(?:::connection\(['"][^'"]+['"]\)->)?::(create|table)\(\s*([^,]+),/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const operation = match[1];
    const tableExpr = match[2];
    const braceIndex = content.indexOf("{", match.index + match[0].length);
    if (braceIndex < 0) continue;
    const body = extractBalancedBlock(content, braceIndex);
    blocks.push({ operation, tableExpr, body });
  }
  return blocks;
}

function enrichScoping(tables, scoped) {
  for (const table of tables) {
    if (scoped.membership[table.name]) {
      table.scoping = "membership";
      table.membershipModel = scoped.membership[table.name];
    } else if (scoped.scoped.includes(table.name)) {
      table.scoping = "center";
    } else {
      table.scoping = "platform";
    }
    const hasCenterId = table.columns.some((c) => c.name === "center_id");
    if (hasCenterId && table.scoping === "platform") table.scoping = "center";
  }
}

function addIncomingRelationships(tables) {
  const byName = new Map(tables.map((t) => [t.name, t]));
  for (const table of tables) {
    table.referencedBy = [];
  }
  for (const table of tables) {
    for (const fk of table.foreignKeys) {
      const target = byName.get(fk.referencesTable);
      if (!target) continue;
      target.referencedBy.push({
        fromTable: table.name,
        column: fk.column,
        referencesColumn: fk.referencesColumn,
        onDelete: fk.onDelete,
      });
    }
  }
}

export function extractDatabaseSchema(rootDir, scoped) {
  const migDir = join(rootDir, "backend", "database", "migrations");
  const permissionPath = join(rootDir, "backend", "config", "permission.php");
  const permissionTables = loadPermissionTableNames(permissionPath);
  const schema = new Map();

  const files = readdirSync(migDir)
    .filter((f) => f.endsWith(".php"))
    .sort();

  for (const file of files) {
    const raw = readFileSync(join(migDir, file), "utf8");
    const content = expandPermissionVars(raw, permissionTables);
    const blocks = extractSchemaBlocks(content);
    for (const block of blocks) {
      const tableName = resolveTableName(block.tableExpr, permissionTables);
      if (!tableName || tableName.includes("$")) continue;
      const table = ensureTable(schema, tableName, file);
      for (const stmt of splitStatements(block.body)) {
        if (!stmt) continue;
        applyStatement(table, stmt, permissionTables);
      }
    }
  }

  const tables = [...schema.values()].sort((a, b) => a.name.localeCompare(b.name));
  enrichScoping(tables, scoped);
  addIncomingRelationships(tables);

  return tables.map((table) => ({
    ...table,
    columnCount: table.columns.length,
    indexCount: table.indexes.length,
    foreignKeyCount: table.foreignKeys.length,
    incomingCount: table.referencedBy.length,
  }));
}

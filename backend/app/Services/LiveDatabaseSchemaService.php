<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Throwable;

final class LiveDatabaseSchemaService
{
    /**
     * Build a catalog matching docs/generated/database-schema.json from the live DB.
     *
     * @return array<string, mixed>
     */
    public function catalog(): array
    {
        $schema = $this->databaseName();
        $scoped = array_fill_keys(config('centers.scoped_tables', []), true);
        $membership = config('centers.membership_scoped_tables', []);
        $membershipNames = array_fill_keys(array_keys($membership), true);

        $tableNames = $this->tableNames($schema);
        $columnsByTable = $this->columnsByTable($schema);
        $indexesByTable = $this->indexesByTable($schema);
        $foreignKeysByTable = $this->foreignKeysByTable($schema);
        $incomingByTable = $this->incomingByTable($foreignKeysByTable);

        $tables = [];
        foreach ($tableNames as $tableName) {
            $columns = $columnsByTable[$tableName] ?? [];
            $indexes = $indexesByTable[$tableName] ?? [];
            $foreignKeys = $foreignKeysByTable[$tableName] ?? [];
            $referencedBy = $incomingByTable[$tableName] ?? [];

            $scoping = 'platform';
            $membershipModel = null;
            if (isset($membershipNames[$tableName])) {
                $scoping = 'membership';
                $class = $membership[$tableName] ?? null;
                $membershipModel = is_string($class) ? class_basename($class) : null;
            } elseif (isset($scoped[$tableName])) {
                $scoping = 'center';
            }

            $tables[] = [
                'name' => $tableName,
                'createMigration' => 'live-database',
                'migrations' => ['(synced from live database)'],
                'columns' => $columns,
                'indexes' => $indexes,
                'foreignKeys' => $foreignKeys,
                'referencedBy' => $referencedBy,
                'scoping' => $scoping,
                'membershipModel' => $membershipModel,
                'columnCount' => count($columns),
                'indexCount' => count($indexes),
                'foreignKeyCount' => count($foreignKeys),
                'incomingCount' => count($referencedBy),
            ];
        }

        usort($tables, static fn (array $a, array $b): int => strcmp($a['name'], $b['name']));

        $centerScopedCount = count(array_filter($tables, static fn (array $t): bool => $t['scoping'] === 'center'));
        $membershipScopedCount = count(array_filter($tables, static fn (array $t): bool => $t['scoping'] === 'membership'));

        return [
            'syncedAt' => now()->utc()->toIso8601String(),
            'source' => 'live-database',
            'tableCount' => count($tables),
            'centerScopedCount' => $centerScopedCount,
            'membershipScopedCount' => $membershipScopedCount,
            'tables' => $tables,
        ];
    }

    /**
     * Introspect DB and write catalog JSON used by the developer UI.
     *
     * @return array{catalog: array<string, mixed>, written: list<string>}
     */
    public function syncToDocs(): array
    {
        $catalog = $this->catalog();
        $payload = json_encode($catalog, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n";
        $written = [];

        foreach ($this->catalogTargets() as $path) {
            $dir = dirname($path);
            if (! File::isDirectory($dir)) {
                File::makeDirectory($dir, 0755, true);
            }
            File::put($path, $payload);
            $written[] = $path;
        }

        $this->patchManifest($catalog);

        return [
            'catalog' => $catalog,
            'written' => $written,
        ];
    }

    private function databaseName(): string
    {
        $name = DB::connection()->getDatabaseName();
        if (! is_string($name) || $name === '') {
            throw new \RuntimeException('Database name could not be resolved.');
        }

        return $name;
    }

    /**
     * @return list<string>
     */
    private function tableNames(string $schema): array
    {
        $rows = DB::select(
            'SELECT TABLE_NAME AS name
             FROM information_schema.TABLES
             WHERE TABLE_SCHEMA = ?
               AND TABLE_TYPE = \'BASE TABLE\'
             ORDER BY TABLE_NAME',
            [$schema],
        );

        return array_values(array_map(
            static fn ($row): string => (string) $row->name,
            $rows,
        ));
    }

    /**
     * @return array<string, list<array<string, mixed>>>
     */
    private function columnsByTable(string $schema): array
    {
        $rows = DB::select(
            'SELECT TABLE_NAME AS table_name,
                    COLUMN_NAME AS name,
                    COLUMN_TYPE AS type,
                    IS_NULLABLE AS is_nullable,
                    COLUMN_DEFAULT AS column_default,
                    COLUMN_KEY AS column_key,
                    EXTRA AS extra
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ?
             ORDER BY TABLE_NAME, ORDINAL_POSITION',
            [$schema],
        );

        $byTable = [];
        foreach ($rows as $row) {
            $table = (string) $row->table_name;
            $key = (string) $row->column_key;
            $extra = (string) ($row->extra ?? '');
            $default = $row->column_default;
            $column = [
                'name' => (string) $row->name,
                'type' => (string) $row->type,
                'nullable' => strtoupper((string) $row->is_nullable) === 'YES',
                'primary' => $key === 'PRI',
                'unique' => $key === 'UNI',
                'indexed' => in_array($key, ['PRI', 'UNI', 'MUL'], true),
                'autoIncrement' => str_contains(strtolower($extra), 'auto_increment'),
            ];
            if ($default !== null) {
                $column['default'] = (string) $default;
            }
            $byTable[$table][] = $column;
        }

        return $byTable;
    }

    /**
     * @return array<string, list<array<string, mixed>>>
     */
    private function indexesByTable(string $schema): array
    {
        $rows = DB::select(
            'SELECT TABLE_NAME AS table_name,
                    INDEX_NAME AS index_name,
                    NON_UNIQUE AS non_unique,
                    SEQ_IN_INDEX AS seq,
                    COLUMN_NAME AS column_name
             FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = ?
             ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX',
            [$schema],
        );

        $grouped = [];
        foreach ($rows as $row) {
            $table = (string) $row->table_name;
            $indexName = (string) $row->index_name;
            $key = $table.'|'.$indexName;
            if (! isset($grouped[$key])) {
                $grouped[$key] = [
                    'table' => $table,
                    'name' => $indexName,
                    'unique' => (int) $row->non_unique === 0,
                    'primary' => $indexName === 'PRIMARY',
                    'columns' => [],
                ];
            }
            $grouped[$key]['columns'][] = (string) $row->column_name;
        }

        $byTable = [];
        foreach ($grouped as $index) {
            $table = $index['table'];
            unset($index['table']);
            $byTable[$table][] = $index;
        }

        return $byTable;
    }

    /**
     * @return array<string, list<array<string, mixed>>>
     */
    private function foreignKeysByTable(string $schema): array
    {
        $rows = DB::select(
            'SELECT kcu.TABLE_NAME AS table_name,
                    kcu.COLUMN_NAME AS column_name,
                    kcu.REFERENCED_TABLE_NAME AS referenced_table,
                    kcu.REFERENCED_COLUMN_NAME AS referenced_column,
                    rc.DELETE_RULE AS delete_rule,
                    rc.UPDATE_RULE AS update_rule
             FROM information_schema.KEY_COLUMN_USAGE kcu
             INNER JOIN information_schema.REFERENTIAL_CONSTRAINTS rc
                     ON rc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
                    AND rc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
                    AND rc.TABLE_NAME = kcu.TABLE_NAME
             WHERE kcu.TABLE_SCHEMA = ?
               AND kcu.REFERENCED_TABLE_NAME IS NOT NULL
             ORDER BY kcu.TABLE_NAME, kcu.ORDINAL_POSITION',
            [$schema],
        );

        $byTable = [];
        foreach ($rows as $row) {
            $table = (string) $row->table_name;
            $fk = [
                'column' => (string) $row->column_name,
                'referencesTable' => (string) $row->referenced_table,
                'referencesColumn' => (string) $row->referenced_column,
            ];
            $delete = strtolower((string) ($row->delete_rule ?? ''));
            $update = strtolower((string) ($row->update_rule ?? ''));
            if ($delete !== '' && $delete !== 'no action' && $delete !== 'restrict') {
                $fk['onDelete'] = $delete === 'set null' ? 'setNull' : str_replace(' ', '', ucwords($delete));
            }
            if ($update !== '' && $update !== 'no action' && $update !== 'restrict') {
                $fk['onUpdate'] = $update === 'set null' ? 'setNull' : str_replace(' ', '', ucwords($update));
            }
            $byTable[$table][] = $fk;
        }

        return $byTable;
    }

    /**
     * @param  array<string, list<array<string, mixed>>>  $foreignKeysByTable
     * @return array<string, list<array<string, mixed>>>
     */
    private function incomingByTable(array $foreignKeysByTable): array
    {
        $incoming = [];
        foreach ($foreignKeysByTable as $fromTable => $fks) {
            foreach ($fks as $fk) {
                $to = (string) ($fk['referencesTable'] ?? '');
                if ($to === '') {
                    continue;
                }
                $item = [
                    'fromTable' => $fromTable,
                    'column' => (string) $fk['column'],
                    'referencesColumn' => (string) $fk['referencesColumn'],
                ];
                if (isset($fk['onDelete'])) {
                    $item['onDelete'] = $fk['onDelete'];
                }
                $incoming[$to][] = $item;
            }
        }

        return $incoming;
    }

    /**
     * @return list<string>
     */
    private function catalogTargets(): array
    {
        $repoRoot = realpath(base_path('..')) ?: dirname(base_path());
        return [
            $repoRoot.DIRECTORY_SEPARATOR.'docs'.DIRECTORY_SEPARATOR.'generated'.DIRECTORY_SEPARATOR.'database-schema.json',
            $repoRoot.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'docs'.DIRECTORY_SEPARATOR.'generated'.DIRECTORY_SEPARATOR.'database-schema.json',
        ];
    }

    /**
     * @param  array<string, mixed>  $catalog
     */
    private function patchManifest(array $catalog): void
    {
        $repoRoot = realpath(base_path('..')) ?: dirname(base_path());
        $paths = [
            $repoRoot.DIRECTORY_SEPARATOR.'docs'.DIRECTORY_SEPARATOR.'generated'.DIRECTORY_SEPARATOR.'MANIFEST.json',
            $repoRoot.DIRECTORY_SEPARATOR.'public'.DIRECTORY_SEPARATOR.'docs'.DIRECTORY_SEPARATOR.'generated'.DIRECTORY_SEPARATOR.'MANIFEST.json',
        ];

        foreach ($paths as $path) {
            if (! is_file($path)) {
                continue;
            }
            try {
                $decoded = json_decode((string) File::get($path), true);
                if (! is_array($decoded)) {
                    continue;
                }
                $decoded['syncedAt'] = $catalog['syncedAt'] ?? now()->utc()->toIso8601String();
                $decoded['databaseTableCount'] = $catalog['tableCount'] ?? ($decoded['databaseTableCount'] ?? null);
                $decoded['scopedTableCount'] = $catalog['centerScopedCount'] ?? ($decoded['scopedTableCount'] ?? null);
                File::put(
                    $path,
                    json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)."\n",
                );
            } catch (Throwable) {
                // Manifest patch is best-effort; catalog JSON is the source of truth for this page.
            }
        }
    }
}

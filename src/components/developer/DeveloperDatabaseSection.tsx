import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/contexts/LocaleContext';
import { fetchDatabaseSchemaCatalog } from '@/lib/developer-api-catalog';
import type { DbTableDefinition, DbTableScoping } from '@/types/developer-database';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { ChevronRight, Database, Key, Link2, Search, Table2 } from 'lucide-react';

const scopingStyles: Record<DbTableScoping, string> = {
  platform: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  center: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  membership: 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
};

function ScopingBadge({ scoping }: { scoping: DbTableScoping }) {
  const { t } = useLocale();
  return (
    <Badge variant="outline" className={cn('text-[10px] uppercase', scopingStyles[scoping])}>
      {t(`developer.db.scoping.${scoping}`)}
    </Badge>
  );
}

function FlagBadges({ col }: { col: DbTableDefinition['columns'][number] }) {
  const { t } = useLocale();
  const flags: string[] = [];
  if (col.primary) flags.push(t('developer.db.flag.primary'));
  if (col.autoIncrement) flags.push(t('developer.db.flag.autoIncrement'));
  if (col.unique) flags.push(t('developer.db.flag.unique'));
  if (col.indexed) flags.push(t('developer.db.flag.indexed'));
  if (col.nullable) flags.push(t('developer.db.flag.nullable'));
  if (flags.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {flags.map(flag => (
        <Badge key={flag} variant="secondary" className="text-[10px] font-normal">
          {flag}
        </Badge>
      ))}
    </div>
  );
}

function TableDetail({ table }: { table: DbTableDefinition }) {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <code className="rounded-md bg-muted px-2 py-1 text-sm font-semibold">{table.name}</code>
        <ScopingBadge scoping={table.scoping} />
        {table.membershipModel && (
          <Badge variant="outline" className="font-mono text-[10px]">
            {table.membershipModel}
          </Badge>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill label={t('developer.db.columns')} value={table.columnCount} />
        <StatPill label={t('developer.db.indexes')} value={table.indexCount} />
        <StatPill label={t('developer.db.outgoingFks')} value={table.foreignKeyCount} />
        <StatPill label={t('developer.db.incomingFks')} value={table.incomingCount} />
      </div>

      <div>
        <p className="mb-1 text-xs font-medium text-muted-foreground">{t('developer.db.migrations')}</p>
        <div className="flex flex-wrap gap-2">
          {table.migrations.map(file => (
            <Badge key={file} variant="outline" className="font-mono text-[10px] font-normal">
              {file}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs defaultValue="columns">
        <TabsList>
          <TabsTrigger value="columns">{t('developer.db.tab.columns')}</TabsTrigger>
          <TabsTrigger value="indexes">{t('developer.db.tab.indexes')}</TabsTrigger>
          <TabsTrigger value="relationships">{t('developer.db.tab.relationships')}</TabsTrigger>
        </TabsList>

        <TabsContent value="columns">
          <ScrollArea className="h-[min(420px,50vh)] rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr className="border-b border-border text-start">
                  <th className="px-3 py-2 font-medium">{t('developer.db.col.name')}</th>
                  <th className="px-3 py-2 font-medium">{t('developer.db.col.type')}</th>
                  <th className="px-3 py-2 font-medium">{t('developer.db.col.default')}</th>
                  <th className="px-3 py-2 font-medium">{t('developer.db.col.flags')}</th>
                </tr>
              </thead>
              <tbody>
                {table.columns.map(col => (
                  <tr key={col.name} className="border-b border-border/60 hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono text-xs">{col.name}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{col.type}</td>
                    <td className="px-3 py-2 font-mono text-xs">{col.default ?? '—'}</td>
                    <td className="px-3 py-2"><FlagBadges col={col} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="indexes">
          {table.indexes.length === 0 ? (
            <EmptyHint text={t('developer.db.noIndexes')} />
          ) : (
            <div className="space-y-2">
              {table.indexes.map((index, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Key className="h-4 w-4 text-muted-foreground" />
                    <code className="text-xs">{index.columns.join(', ')}</code>
                    {index.primary && <Badge>{t('developer.db.flag.primary')}</Badge>}
                    {index.unique && !index.primary && <Badge variant="secondary">{t('developer.db.flag.unique')}</Badge>}
                    {!index.unique && <Badge variant="outline">{t('developer.db.index')}</Badge>}
                    {index.name && (
                      <span className="text-xs text-muted-foreground">{index.name}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="relationships">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Link2 className="h-4 w-4" />
                  {t('developer.db.outgoing')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {table.foreignKeys.length === 0 ? (
                  <EmptyHint text={t('developer.db.noOutgoing')} />
                ) : (
                  table.foreignKeys.map(fk => (
                    <div key={`${fk.column}-${fk.referencesTable}`} className="rounded-lg border border-border p-3 text-sm">
                      <code className="text-xs">
                        {fk.column} → {fk.referencesTable}.{fk.referencesColumn}
                      </code>
                      {fk.onDelete && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          ON DELETE {fk.onDelete.toUpperCase()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Link2 className="h-4 w-4 rotate-180" />
                  {t('developer.db.incoming')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {table.referencedBy.length === 0 ? (
                  <EmptyHint text={t('developer.db.noIncoming')} />
                ) : (
                  table.referencedBy.map(ref => (
                    <div key={`${ref.fromTable}-${ref.column}`} className="rounded-lg border border-border p-3 text-sm">
                      <code className="text-xs">
                        {ref.fromTable}.{ref.column} → {table.name}.{ref.referencesColumn}
                      </code>
                      {ref.onDelete && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          ON DELETE {ref.onDelete.toUpperCase()}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{text}</p>;
}

export default function DeveloperDatabaseSection() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [scopingFilter, setScopingFilter] = useState<'all' | DbTableScoping>('all');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['developer-database-schema'],
    queryFn: fetchDatabaseSchemaCatalog,
    staleTime: 5 * 60 * 1000,
  });

  const tables = data?.tables ?? [];

  const filteredTables = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tables.filter(table => {
      if (scopingFilter !== 'all' && table.scoping !== scopingFilter) return false;
      if (!q) return true;
      return (
        table.name.toLowerCase().includes(q)
        || table.columns.some(c => c.name.toLowerCase().includes(q))
        || table.foreignKeys.some(fk => fk.referencesTable.toLowerCase().includes(q))
      );
    });
  }, [tables, search, scopingFilter]);

  const activeTable = tables.find(t => t.name === selectedTable) ?? null;

  return (
    <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <Card className="h-fit xl:sticky xl:top-4">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-primary" />
            {t('developer.db.catalog')}
          </CardTitle>
          <CardDescription>
            {isLoading
              ? '…'
              : t('developer.db.tableCount').replace('{count}', String(filteredTables.length))}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder={t('developer.db.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <Select value={scopingFilter} onValueChange={v => setScopingFilter(v as typeof scopingFilter)}>
            <SelectTrigger>
              <SelectValue placeholder={t('developer.db.scopingFilter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('developer.db.allScoping')}</SelectItem>
              <SelectItem value="platform">{t('developer.db.scoping.platform')}</SelectItem>
              <SelectItem value="center">{t('developer.db.scoping.center')}</SelectItem>
              <SelectItem value="membership">{t('developer.db.scoping.membership')}</SelectItem>
            </SelectContent>
          </Select>

          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-lg" />
              ))}
            </div>
          )}

          {isError && (
            <p className="text-sm text-destructive">{t('developer.db.loadError')}</p>
          )}

          {!isLoading && !isError && (
            <ScrollArea className="h-[min(560px,60vh)]">
              <div className="space-y-1 pe-2">
                {filteredTables.map(table => {
                  const isActive = table.name === selectedTable;
                  return (
                    <button
                      key={table.name}
                      type="button"
                      onClick={() => setSelectedTable(table.name)}
                      className={cn(
                        'flex w-full items-start gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Table2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-mono text-xs">{table.name}</span>
                        <span className="mt-0.5 block text-[10px] opacity-70">
                          {table.columnCount} {t('developer.db.columns').toLowerCase()}
                        </span>
                      </span>
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 opacity-50" />
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('developer.db.details')}</CardTitle>
          <CardDescription>{t('developer.db.detailsDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          {!activeTable ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {t('developer.db.selectTable')}
            </p>
          ) : (
            <TableDetail table={activeTable} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

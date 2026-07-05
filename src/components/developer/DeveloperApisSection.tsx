import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/contexts/LocaleContext';
import { fetchApiRoutesCatalog } from '@/lib/developer-api-catalog';
import { runApiTest } from '@/lib/developer-api-runner';
import {
  appendApiTestLog,
  clearApiTestLogs,
  listApiTestLogs,
} from '@/lib/developer-api-test-log';
import type { ApiRouteDefinition, ApiTestLogEntry, ApiTestRequest } from '@/types/developer-api';
import ApiMethodBadge from '@/components/developer/ApiMethodBadge';
import DeveloperApiAuthPanel from '@/components/developer/DeveloperApiAuthPanel';
import { getApiTestToken } from '@/lib/developer-api-auth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  Clock,
  Loader2,
  Play,
  Search,
  Trash2,
} from 'lucide-react';

function getRouteGroupKey(path: string): string {
  const base = path.replace(/\{[^}]+\}/g, '').replace(/\/+/g, '/').replace(/\/$/, '');
  const segments = base.split('/').filter(Boolean);
  if (segments.length === 0) return 'root';
  if (segments.length === 1) return segments[0];
  return `${segments[0]}/${segments[1]}`;
}

function formatGroupLabel(key: string): string {
  const parts = key.split('/');
  const resource = parts[parts.length - 1].replace(/-/g, ' ');
  const formatted = resource.replace(/\b\w/g, char => char.toUpperCase());
  if (parts.length > 1) {
    return `${parts[0]} · ${formatted}`;
  }
  return formatted;
}

function emptyPathParams(route: ApiRouteDefinition): Record<string, string> {
  return Object.fromEntries(route.pathParams.map(key => [key, '']));
}

function buildInitialRequest(route: ApiRouteDefinition): ApiTestRequest {
  return {
    routeId: route.id,
    method: route.method,
    path: route.path,
    pathParamValues: emptyPathParams(route),
    queryParams: {},
    body: '{}',
    useLocale: true,
  };
}

function QueryParamsEditor({
  value,
  onChange,
}: {
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}) {
  const entries = Object.entries(value);
  const rows = entries.length > 0 ? entries : [['', '']];

  return (
    <div className="space-y-2">
      {rows.map(([key, val], index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            placeholder="key"
            value={key}
            onChange={e => {
              const next = { ...value };
              delete next[key];
              next[e.target.value] = val;
              onChange(next);
            }}
          />
          <Input
            placeholder="value"
            value={val}
            onChange={e => onChange({ ...value, [key]: e.target.value })}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              const next = { ...value };
              delete next[key];
              onChange(next);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange({ ...value, '': '' })}
      >
        + Query param
      </Button>
    </div>
  );
}

function ApiRouteDetail({
  route,
  request,
  onRequestChange,
  onRunTest,
  isRunning,
  lastResult,
  hasAuthToken,
}: {
  route: ApiRouteDefinition;
  request: ApiTestRequest;
  onRequestChange: (next: ApiTestRequest) => void;
  onRunTest: () => void;
  isRunning: boolean;
  lastResult: ApiTestLogEntry | null;
  hasAuthToken: boolean;
}) {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <ApiMethodBadge method={route.method} />
          <code className="rounded-md bg-muted px-2 py-1 text-sm">{route.fullPath}</code>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{route.path}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <DetailItem label={t('developer.api.module')} value={route.module} />
        <DetailItem label={t('developer.api.handler')} value={route.handler} />
        <DetailItem
          label={t('developer.api.auth')}
          value={route.authRequired ? t('developer.api.authRequired') : t('developer.api.public')}
        />
        <DetailItem
          label={t('developer.api.body')}
          value={route.acceptsBody ? t('developer.api.acceptsBody') : t('developer.api.noBody')}
        />
      </div>

      {route.authRequired && !hasAuthToken && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">
          {t('developer.api.authTokenMissing')}
        </div>
      )}

      {route.pathParams.length > 0 && (
        <div className="space-y-3">
          <Label>{t('developer.api.pathParams')}</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {route.pathParams.map(param => (
              <div key={param} className="space-y-1.5">
                <Label htmlFor={`param-${param}`} className="text-xs text-muted-foreground">
                  {param}
                </Label>
                <Input
                  id={`param-${param}`}
                  value={request.pathParamValues[param] ?? ''}
                  placeholder={`{${param}}`}
                  onChange={e =>
                    onRequestChange({
                      ...request,
                      pathParamValues: {
                        ...request.pathParamValues,
                        [param]: e.target.value,
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <Label>{t('developer.api.queryParams')}</Label>
        <QueryParamsEditor
          value={request.queryParams}
          onChange={queryParams => onRequestChange({ ...request, queryParams })}
        />
      </div>

      {route.acceptsBody && (
        <div className="space-y-2">
          <Label htmlFor="api-body">{t('developer.api.requestBody')}</Label>
          <Textarea
            id="api-body"
            className="min-h-[140px] font-mono text-xs"
            value={request.body}
            onChange={e => onRequestChange({ ...request, body: e.target.value })}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
        <div className="flex items-center gap-2">
          <Switch
            id="use-locale"
            checked={request.useLocale}
            onCheckedChange={useLocale => onRequestChange({ ...request, useLocale })}
          />
          <Label htmlFor="use-locale" className="text-sm">
            {t('developer.api.useLocalePrefix')}
          </Label>
        </div>
        <Button onClick={onRunTest} disabled={isRunning}>
          {isRunning ? (
            <Loader2 className="h-4 w-4 me-2 animate-spin" />
          ) : (
            <Play className="h-4 w-4 me-2" />
          )}
          {t('developer.api.sendRequest')}
        </Button>
      </div>

      {lastResult && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('developer.api.lastResponse')}</CardTitle>
            <CardDescription className="flex flex-wrap items-center gap-2">
              <Badge variant={lastResult.result.ok ? 'default' : 'destructive'}>
                {lastResult.result.status} {lastResult.result.statusText}
              </Badge>
              <span className="inline-flex items-center gap-1 text-xs">
                <Clock className="h-3.5 w-3.5" />
                {lastResult.result.durationMs}ms
              </span>
              <span className="text-xs">{lastResult.timestamp}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">{t('developer.api.requestUrl')}</p>
              <code className="block overflow-x-auto rounded-md bg-muted p-2 text-xs">
                {lastResult.result.requestUrl}
              </code>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">{t('developer.api.responseBody')}</p>
              <ScrollArea className="h-[220px] rounded-md border border-border">
                <pre className="p-3 text-xs whitespace-pre-wrap break-all">
                  {lastResult.result.error || lastResult.result.responseBody || t('developer.api.emptyResponse')}
                </pre>
              </ScrollArea>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function TestLogList({
  logs,
  selectedRouteId,
  onSelectLog,
}: {
  logs: ApiTestLogEntry[];
  selectedRouteId: string | null;
  onSelectLog: (log: ApiTestLogEntry) => void;
}) {
  const { t } = useLocale();
  const filtered = selectedRouteId
    ? logs.filter(log => log.routeId === selectedRouteId)
    : logs;

  if (filtered.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('developer.logs.empty')}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map(log => (
        <button
          key={log.id}
          type="button"
          onClick={() => onSelectLog(log)}
          className="w-full rounded-lg border border-border bg-card p-3 text-start transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ApiMethodBadge method={log.method} />
              <span className="truncate text-sm font-medium">{log.path}</span>
            </div>
            <Badge variant={log.result.ok ? 'outline' : 'destructive'}>
              {log.result.status || 'ERR'}
            </Badge>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>{new Date(log.timestamp).toLocaleString()}</span>
            <span>{log.result.durationMs}ms</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function DeveloperApisSection() {
  const { t } = useLocale();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [requestDraft, setRequestDraft] = useState<ApiTestRequest | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<ApiTestLogEntry[]>(() => listApiTestLogs());
  const [selectedLog, setSelectedLog] = useState<ApiTestLogEntry | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [hasAuthToken, setHasAuthToken] = useState(() => Boolean(getApiTestToken()));

  const { data, isLoading, isError } = useQuery({
    queryKey: ['developer-api-routes'],
    queryFn: fetchApiRoutesCatalog,
    staleTime: 5 * 60 * 1000,
  });

  const routes = data?.routes ?? [];

  const modules = useMemo(
    () => [...new Set(routes.map(route => route.module))].sort(),
    [routes],
  );

  const filteredRoutes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return routes.filter(route => {
      if (moduleFilter !== 'all' && route.module !== moduleFilter) return false;
      if (methodFilter !== 'all' && route.method !== methodFilter) return false;
      if (!q) return true;
      return (
        route.path.toLowerCase().includes(q)
        || route.fullPath.toLowerCase().includes(q)
        || route.module.toLowerCase().includes(q)
        || route.method.toLowerCase().includes(q)
      );
    });
  }, [routes, search, moduleFilter, methodFilter]);

  const groupedRoutes = useMemo(() => {
    const groups = new Map<string, ApiRouteDefinition[]>();
    for (const route of filteredRoutes) {
      const key = getRouteGroupKey(route.path);
      const list = groups.get(key) ?? [];
      list.push(route);
      groups.set(key, list);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, groupRoutes]) => ({
        key,
        label: formatGroupLabel(key),
        routes: groupRoutes.sort(
          (a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method),
        ),
      }));
  }, [filteredRoutes]);

  useEffect(() => {
    if (!selectedRouteId) return;
    const route = routes.find(item => item.id === selectedRouteId);
    if (!route) return;
    const key = getRouteGroupKey(route.path);
    setOpenGroups(prev => ({ ...prev, [key]: true }));
  }, [selectedRouteId, routes]);

  useEffect(() => {
    if (!search.trim()) return;
    setOpenGroups(prev => {
      const next = { ...prev };
      for (const { key } of groupedRoutes) {
        next[key] = true;
      }
      return next;
    });
  }, [search, groupedRoutes]);

  const selectedRoute = routes.find(route => route.id === selectedRouteId) ?? null;

  const selectRoute = (route: ApiRouteDefinition) => {
    setSelectedRouteId(route.id);
    setRequestDraft(buildInitialRequest(route));
    setSelectedLog(null);
  };

  const handleRunTest = async () => {
    if (!selectedRoute || !requestDraft) return;
    setIsRunning(true);
    try {
      const result = await runApiTest(requestDraft);
      const entry = appendApiTestLog(
        selectedRoute.id,
        selectedRoute.method,
        selectedRoute.path,
        requestDraft,
        result,
      );
      setLogs(listApiTestLogs());
      setSelectedLog(entry);
    } finally {
      setIsRunning(false);
    }
  };

  const lastResultForRoute = selectedLog?.routeId === selectedRouteId
    ? selectedLog
    : logs.find(log => log.routeId === selectedRouteId) ?? null;

  return (
    <div className="space-y-6">
      <DeveloperApiAuthPanel onAuthChange={() => setHasAuthToken(Boolean(getApiTestToken()))} />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">{t('developer.api.catalog')}</CardTitle>
              <CardDescription>
                {isLoading ? '…' : t('developer.api.routeCount').replace('{count}', String(filteredRoutes.length))}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full min-w-[200px] sm:w-56">
                <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="ps-9"
                  placeholder={t('developer.api.search')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t('developer.api.moduleFilter')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('developer.api.allModules')}</SelectItem>
                  {modules.map(mod => (
                    <SelectItem key={mod} value={mod}>{mod}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder={t('developer.api.methodFilter')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('developer.api.allMethods')}</SelectItem>
                  {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(method => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          )}

          {isError && (
            <p className="text-sm text-destructive">{t('developer.api.loadError')}</p>
          )}

          {!isLoading && !isError && groupedRoutes.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {t('developer.api.noResults')}
            </p>
          )}

          {!isLoading && !isError && groupedRoutes.length > 0 && (
            <ScrollArea className="h-[min(420px,55vh)]">
              <div className="space-y-2 pe-2">
                {groupedRoutes.map(group => {
                  const isOpen = openGroups[group.key] ?? false;
                  const hasActiveRoute = group.routes.some(route => route.id === selectedRouteId);

                  return (
                    <Collapsible
                      key={group.key}
                      open={isOpen}
                      onOpenChange={open => setOpenGroups(prev => ({ ...prev, [group.key]: open }))}
                    >
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-start transition-colors',
                            hasActiveRoute
                              ? 'border-primary/40 bg-primary/5'
                              : 'border-border hover:bg-muted/50',
                          )}
                        >
                          <span className="text-sm font-medium">{group.label}</span>
                          <span className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {group.routes.length}
                            </Badge>
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                                isOpen && 'rotate-180',
                              )}
                            />
                          </span>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="flex flex-wrap gap-2 pt-2">
                          {group.routes.map(route => {
                            const isActive = route.id === selectedRouteId;
                            return (
                              <button
                                key={route.id}
                                type="button"
                                onClick={() => selectRoute(route)}
                                className={cn(
                                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-start text-sm transition-colors',
                                  isActive
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                              >
                                <ApiMethodBadge method={route.method} className="shrink-0" />
                                <span className="max-w-[280px] truncate">{route.path}</span>
                              </button>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('developer.api.details')}</CardTitle>
            <CardDescription>{t('developer.api.detailsDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedRoute || !requestDraft ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {t('developer.api.selectRoute')}
              </p>
            ) : (
              <ApiRouteDetail
                route={selectedRoute}
                request={requestDraft}
                onRequestChange={setRequestDraft}
                onRunTest={handleRunTest}
                isRunning={isRunning}
                lastResult={lastResultForRoute}
                hasAuthToken={hasAuthToken}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{t('developer.logs.title')}</CardTitle>
              <CardDescription>{t('developer.logs.desc')}</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                clearApiTestLogs();
                setLogs([]);
                setSelectedLog(null);
              }}
            >
              <Trash2 className="h-4 w-4 me-2" />
              {t('developer.logs.clear')}
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="list">
              <TabsList>
                <TabsTrigger value="list">{t('developer.logs.history')}</TabsTrigger>
                <TabsTrigger value="detail">{t('developer.logs.detail')}</TabsTrigger>
              </TabsList>
              <TabsContent value="list">
                <TestLogList
                  logs={logs}
                  selectedRouteId={selectedRouteId}
                  onSelectLog={setSelectedLog}
                />
              </TabsContent>
              <TabsContent value="detail">
                {!selectedLog ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {t('developer.logs.selectLog')}
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <ApiMethodBadge method={selectedLog.method} />
                      <code className="text-sm">{selectedLog.path}</code>
                      <Badge variant={selectedLog.result.ok ? 'outline' : 'destructive'}>
                        {selectedLog.result.status} {selectedLog.result.statusText}
                      </Badge>
                    </div>
                    <DetailItem
                      label={t('developer.api.requestUrl')}
                      value={selectedLog.result.requestUrl}
                    />
                    {selectedLog.result.requestBody && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-muted-foreground">
                          {t('developer.api.requestBody')}
                        </p>
                        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                          {selectedLog.result.requestBody}
                        </pre>
                      </div>
                    )}
                    <div>
                      <p className="mb-1 text-xs font-medium text-muted-foreground">
                        {t('developer.api.responseBody')}
                      </p>
                      <ScrollArea className="h-[280px] rounded-md border border-border">
                        <pre className="p-3 text-xs whitespace-pre-wrap break-all">
                          {selectedLog.result.error || selectedLog.result.responseBody || t('developer.api.emptyResponse')}
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

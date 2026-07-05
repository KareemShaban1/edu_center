import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocale } from '@/contexts/LocaleContext';
import { authApi } from '@/services/endpoints/auth';
import {
  clearDeveloperApiAuth,
  getDeveloperApiAuthMeta,
  getDeveloperApiToken,
  loginDeveloperApiAuth,
  maskToken,
} from '@/lib/developer-api-auth';
import {
  defaultTenantSlug,
  getPlatformDefaultsForGuard,
  getTenantDefaultsForGuard,
  isPlatformGuard,
} from '@/config/login-defaults';
import type { TenantMembershipOption } from '@/types/models';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KeyRound, Loader2, LogOut, ShieldCheck } from 'lucide-react';

export default function DeveloperApiAuthPanel({ onAuthChange }: { onAuthChange?: () => void }) {
  const { t } = useLocale();
  const [token, setToken] = useState(() => getDeveloperApiToken());
  const [meta, setMeta] = useState(() => getDeveloperApiAuthMeta());
  const [selectedGuard, setSelectedGuard] = useState('users');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState(defaultTenantSlug);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingMemberships, setPendingMemberships] = useState<TenantMembershipOption[] | null>(null);

  const { data: guards = [] } = useQuery({
    queryKey: ['auth-guards'],
    queryFn: () => authApi.getGuards(),
    staleTime: 5 * 60 * 1000,
  });

  const availableGuards = useMemo(() => {
    if (guards.length > 0) return guards;
    return ['users', 'teacher', 'parent', 'student', 'super_admin', 'platform_admin'];
  }, [guards]);

  useEffect(() => {
    if (!availableGuards.includes(selectedGuard)) {
      setSelectedGuard(availableGuards[0]);
    }
  }, [availableGuards, selectedGuard]);

  useEffect(() => {
    if (isPlatformGuard(selectedGuard)) {
      const d = getPlatformDefaultsForGuard(selectedGuard);
      setEmail(d.email);
      setPassword(d.password);
    } else {
      const d = getTenantDefaultsForGuard(selectedGuard, defaultTenantSlug);
      setEmail(d.email);
      setPassword(d.password);
      setTenantSlug(d.tenantSlug);
    }
  }, [selectedGuard]);

  const refreshAuthState = () => {
    setToken(getDeveloperApiToken());
    setMeta(getDeveloperApiAuthMeta());
    onAuthChange?.();
  };

  const completeLogin = async (membershipId?: number) => {
    setError('');
    setLoading(true);
    try {
      const result = await loginDeveloperApiAuth({
        email,
        password,
        guard: selectedGuard,
        tenantSlug: isPlatformGuard(selectedGuard) ? undefined : tenantSlug,
        membershipId,
      });
      if (result.type === 'tenant_selection') {
        setPendingMemberships(result.memberships);
        return;
      }
      setPendingMemberships(null);
      refreshAuthState();
    } catch {
      setError(t('developer.api.authLoginFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await completeLogin();
  };

  const handleClear = () => {
    clearDeveloperApiAuth();
    setPendingMemberships(null);
    setError('');
    refreshAuthState();
  };

  const isAuthenticated = Boolean(token);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4" />
              {t('developer.api.authPanelTitle')}
            </CardTitle>
            <CardDescription>{t('developer.api.authPanelDesc')}</CardDescription>
          </div>
          {isAuthenticated && (
            <Badge variant="outline" className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('developer.api.authActive')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isAuthenticated && meta ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{t('developer.api.authUser')}</p>
                <p className="mt-1 text-sm font-medium">{meta.name}</p>
                <p className="text-xs text-muted-foreground">{meta.email}</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">{t('developer.api.authRole')}</p>
                <p className="mt-1 text-sm font-medium">{meta.role}</p>
                {meta.tenantSlug && (
                  <p className="text-xs text-muted-foreground">{meta.tenantSlug}</p>
                )}
              </div>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">{t('developer.api.bearerToken')}</p>
              <code className="mt-1 block text-sm">{maskToken(token!)}</code>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleClear}>
              <LogOut className="h-4 w-4 me-2" />
              {t('developer.api.clearToken')}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="api-auth-guard">{t('developer.api.authGuard')}</Label>
                <Select value={selectedGuard} onValueChange={setSelectedGuard}>
                  <SelectTrigger id="api-auth-guard">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGuards.map(guard => (
                      <SelectItem key={guard} value={guard}>{guard}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!isPlatformGuard(selectedGuard) && (
                <div className="space-y-2">
                  <Label htmlFor="api-auth-tenant">{t('developer.api.authTenant')}</Label>
                  <Input
                    id="api-auth-tenant"
                    value={tenantSlug}
                    onChange={e => setTenantSlug(e.target.value)}
                    placeholder="demo"
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="api-auth-email">{t('auth.email')}</Label>
                <Input
                  id="api-auth-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="api-auth-password">{t('auth.password')}</Label>
                <Input
                  id="api-auth-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {pendingMemberships && pendingMemberships.length > 0 && (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-sm font-medium">{t('developer.api.selectMembership')}</p>
                <div className="space-y-2">
                  {pendingMemberships.map(m => (
                    <Button
                      key={m.membership_id}
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      disabled={loading}
                      onClick={() => completeLogin(m.membership_id)}
                    >
                      <span>{m.tenant_name}</span>
                      <span className="text-xs text-muted-foreground">{m.tenant_slug}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
              ) : (
                <KeyRound className="h-4 w-4 me-2" />
              )}
              {t('developer.api.getBearerToken')}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

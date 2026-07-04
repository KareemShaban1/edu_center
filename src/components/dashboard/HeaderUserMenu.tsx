import { useEffect, useState } from 'react';
import { ChevronDown, LogOut, UserCog } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FormDialog from '@/components/FormDialog';
import { FormField, FormInput, FormSelect } from '@/components/FormFields';
import { toast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { adminAccessApi } from '@/services/endpoints/admin-access';
import { platformApi } from '@/services/endpoints/platform';
import type { User } from '@/types/models';
import { cn } from '@/lib/utils';

function ProfileDialog({
  user,
  open,
  onClose,
  onSaved,
}: {
  user: User;
  open: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { t } = useLocale();
  const isAdmin = user.role === 'admin';
  const isPlatform = user.role === 'platform_admin' || user.role === 'super_admin';

  const { data: adminUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminAccessApi.listUsers(),
    enabled: open && isAdmin,
  });
  const adminRow = adminUsers?.find(u => u.id === user.id);

  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: '',
    password: '',
    status: 'active' as 'active' | 'inactive',
    role: user.role,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: user.name,
      email: user.email,
      phone: adminRow?.phone && adminRow.phone !== '-' ? adminRow.phone : '',
      password: '',
      status: adminRow?.status || 'active',
      role: user.role,
    });
  }, [open, user.name, user.email, user.role, adminRow]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isAdmin) {
        await adminAccessApi.updateUser(user.id, {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone,
          password: form.password || undefined,
          role: form.role,
          status: form.status,
        });
        return;
      }
      if (isPlatform) {
        await platformApi.saveUser({
          id: user.id,
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          password: form.password || undefined,
        });
      }
    },
    onSuccess: async () => {
      await onSaved();
      toast({ title: t('crud.save') });
      onClose();
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast({ title: 'Save failed', description: message, variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: 'Validation error', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }
    void saveMutation.mutateAsync();
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={t('auth.updateProfile')}
      onSubmit={handleSubmit}
      loading={saveMutation.isPending}
    >
      <FormField label={t('col.name')} id="profile-name" required>
        <FormInput
          id="profile-name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          required
          maxLength={100}
        />
      </FormField>
      <FormField label={t('col.email')} id="profile-email" required>
        <FormInput
          id="profile-email"
          type="email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
          maxLength={255}
        />
      </FormField>
      {isAdmin && (
        <FormField label={t('col.phone')} id="profile-phone">
          <FormInput
            id="profile-phone"
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            maxLength={20}
          />
        </FormField>
      )}
      {isPlatform && (
        <FormField label={t('col.role')} id="profile-role">
          <FormSelect
            id="profile-role"
            value={form.role}
            onChange={e => setForm(f => ({ ...f, role: e.target.value as User['role'] }))}
          >
            <option value="platform_admin">{t('role.platform_admin')}</option>
            <option value="super_admin">{t('role.super_admin')}</option>
          </FormSelect>
        </FormField>
      )}
      {isAdmin && (
        <FormField label={t('col.status')} id="profile-status">
          <FormSelect
            id="profile-status"
            value={form.status}
            onChange={e => setForm(f => ({ ...f, status: e.target.value as 'active' | 'inactive' }))}
          >
            <option value="active">{t('status.active')}</option>
            <option value="inactive">{t('status.inactive')}</option>
          </FormSelect>
        </FormField>
      )}
      <FormField label={t('col.password')} id="profile-password">
        <FormInput
          id="profile-password"
          type="password"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          placeholder={t('form.leaveBlank')}
          minLength={6}
          maxLength={128}
        />
      </FormField>
    </FormDialog>
  );
}

interface HeaderUserMenuProps {
  user: User;
  displayClass?: string;
  onLogout: () => void;
}

export default function HeaderUserMenu({ user, displayClass, onLogout }: HeaderUserMenuProps) {
  const { t } = useLocale();
  const { refreshUser } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const canEditProfile = user.role === 'admin' || user.role === 'platform_admin' || user.role === 'super_admin';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={
              'flex items-center gap-1 rounded-lg border border-border/60 bg-muted/20 px-2 py-1.5 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring sm:gap-2'}
          >
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {user.name.charAt(0)}
              </div>
              <div className="hidden min-w-0 text-start sm:block">
                <p className="truncate text-xs font-medium leading-none">{user.name}</p>
                <p className="truncate text-xs capitalize text-muted-foreground">{t(`role.${user.role}`)}</p>
                {/* {user.tenant_name && user.role !== 'platform_admin' && user.role !== 'super_admin' && (
                  <p className="truncate text-xs text-muted-foreground">{user.tenant_name}</p>
                )} */}
              </div>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="font-normal sm:hidden text-end">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-xs capitalize text-muted-foreground">{t(`role.${user.role}`)}</p>
            {user.tenant_name && user.role !== 'platform_admin' && user.role !== 'super_admin' && (
              <p className="truncate text-xs text-muted-foreground">{user.tenant_name}</p>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="sm:hidden" />

          {canEditProfile && (
            <DropdownMenuItem onClick={() => setProfileOpen(true)}>
              <UserCog className="h-4 w-4" />
              {t('auth.updateProfile')}
            </DropdownMenuItem>
          )}

          {canEditProfile && <DropdownMenuSeparator />}

          <DropdownMenuItem
            onClick={onLogout}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            {t('auth.signOut')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {canEditProfile && (
        <ProfileDialog
          user={user}
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          onSaved={refreshUser}
        />
      )}
    </>
  );
}

import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { useNotifications } from '@/hooks/use-notifications';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function notificationBody(data: { title?: string; body?: string; message?: string }): string {
  return data.body || data.message || '';
}

export function NotificationBell() {
  const { user } = useAuth();
  const { t } = useLocale();
  const navigate = useNavigate();
  const notificationsEnabled = !!user && (user.portal_mode || user.id !== 0);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(notificationsEnabled);
  const { enablePush, isPushSupported } = usePushNotifications();

  if (!notificationsEnabled) return null;

  const handleClick = (id: string, url?: string, readAt?: string | null) => {
    if (!readAt) markRead(id);
    if (url) navigate(url);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative rounded-lg p-2 hover:bg-muted"
          aria-label={t('notifications.title')}
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ltr:right-1 rtl:left-1">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{t('notifications.title')}</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={() => markAllRead()}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {t('notifications.empty')}
            </p>
          ) : (
            notifications.map(n => {
              const isUnread = !n.read_at;
              const body = notificationBody(n.data);
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleClick(n.id, n.data.url, n.read_at)}
                  className={cn(
                    'flex w-full flex-col gap-0.5 border-b px-4 py-3 text-start transition-colors hover:bg-muted/50 last:border-0',
                    isUnread && 'bg-primary/5',
                  )}
                >
                  <span className="text-sm font-medium leading-snug">{n.data.title}</span>
                  {body && (
                    <span className="line-clamp-2 text-xs text-muted-foreground">{body}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelativeTime(n.created_at)}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {isPushSupported && Notification.permission === 'default' && (
          <div className="border-t px-4 py-3">
            <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => enablePush()}>
              {t('notifications.enablePush')}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

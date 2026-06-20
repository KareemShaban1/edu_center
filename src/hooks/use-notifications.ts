import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { notificationsApi } from '@/services/endpoints/notifications';
import { syncAppBadge } from '@/lib/pwa-app-badge';
import type { Notification } from '@/types/models';

export function useNotifications(enabled = true) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.list(),
    refetchInterval: 60_000,
    enabled,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: Notification[] = query.data?.notifications ?? [];
  const unreadCount = query.data?.unread_count ?? 0;

  useEffect(() => {
    if (!enabled) {
      void syncAppBadge(0);
      return;
    }
    void syncAppBadge(unreadCount);
  }, [enabled, unreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
    refetch: query.refetch,
  };
}

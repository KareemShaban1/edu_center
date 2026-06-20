import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { notificationsApi } from '@/services/endpoints/notifications';
import { isPushSupported, subscribeToPushNotifications } from '@/lib/push-notifications';
import { useQueryClient } from '@tanstack/react-query';

const PUSH_ROLES = new Set(['student', 'parent', 'admin', 'teacher']);

export function usePushNotifications() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const subscribedRef = useRef(false);
  const canSubscribe = isAuthenticated && user && PUSH_ROLES.has(user.role);

  const enablePush = useCallback(async () => {
    if (!isPushSupported()) return false;
    const result = await subscribeToPushNotifications(
      () => notificationsApi.getVapidKey(),
      sub => notificationsApi.subscribe(sub),
    );
    return result === 'granted';
  }, []);

  useEffect(() => {
    if (!canSubscribe) return;

    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_RECEIVED' || event.data?.type === 'NOTIFICATION_CLICK') {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    };

    navigator.serviceWorker?.addEventListener('message', onMessage);

    if (!subscribedRef.current && isPushSupported() && Notification.permission === 'default') {
      subscribedRef.current = true;
      enablePush().catch(() => {});
    } else if (!subscribedRef.current && Notification.permission === 'granted') {
      subscribedRef.current = true;
      enablePush().catch(() => {});
    }

    return () => {
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, [canSubscribe, enablePush, queryClient]);

  return { enablePush, isPushSupported: isPushSupported() };
}

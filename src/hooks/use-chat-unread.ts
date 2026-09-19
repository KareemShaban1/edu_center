import { useQuery } from '@tanstack/react-query';
import { chatApi } from '@/services/endpoints/chat';

export function useChatUnread(enabled = true) {
  const query = useQuery({
    queryKey: ['chat', 'unread'],
    queryFn: () => chatApi.unreadCount(),
    refetchInterval: 30_000,
    enabled,
  });

  return {
    unreadCount: query.data ?? 0,
    refetch: query.refetch,
  };
}

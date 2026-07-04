import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { parentApi } from '@/services/endpoints/parent';

export function useParentBootstrap() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['parent-bootstrap', user?.id, user?.tenant_slug],
    queryFn: () => parentApi.bootstrap(),
    enabled: !!user,
    staleTime: 0,
  });
}


import { useQuery } from '@tanstack/react-query';
import { parentApi } from '@/services/endpoints/parent';

export function useParentBootstrap() {
  return useQuery({
    queryKey: ['parent-bootstrap'],
    queryFn: () => parentApi.bootstrap(),
  });
}


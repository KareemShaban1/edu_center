import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/services/endpoints/admin';

export function useAdminBootstrap() {
  return useQuery({
    queryKey: ['admin-bootstrap'],
    queryFn: () => adminApi.bootstrap(),
  });
}

import { useQuery } from '@tanstack/react-query';
import { studentSelfApi } from '@/services/endpoints/student-self';

export function useStudentBootstrap() {
  return useQuery({
    queryKey: ['student-bootstrap'],
    queryFn: () => studentSelfApi.bootstrap(),
  });
}


import { useQuery } from '@tanstack/react-query';
import { teacherApi } from '@/services/endpoints/teacher';

export function useTeacherBootstrap() {
  return useQuery({
    queryKey: ['teacher-bootstrap'],
    queryFn: () => teacherApi.bootstrap(),
  });
}


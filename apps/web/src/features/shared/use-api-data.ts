'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/auth-context';
import { apiRequest } from '@/lib/api';

export function useAuthenticatedData<T>(queryKey: string, path: string, fallback: T, enabled = true) {
  const { token } = useAuth();

  return useQuery({
    queryKey: [queryKey, token],
    queryFn: () => apiRequest<T>(path, { token }),
    enabled: Boolean(token) && enabled,
    retry: 1,
    initialData: fallback
  });
}

export function usePublicData<T>(queryKey: string, path: string, fallback: T, enabled = true) {
  return useQuery({
    queryKey: [queryKey],
    queryFn: () => apiRequest<T>(path),
    enabled,
    retry: 1,
    initialData: fallback
  });
}

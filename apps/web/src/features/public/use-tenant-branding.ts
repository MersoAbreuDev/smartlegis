'use client';

import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/api';
import { PublicBranding, publicApiPath } from './public-api';

export function useTenantBranding() {
  return useQuery({
    queryKey: ['tenant', 'branding'],
    queryFn: () => apiRequest<PublicBranding | null>(publicApiPath('/branding'))
  });
}

import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';

/** The PG tenant (with bills and deposit) of a screen opened with ?memberId=. */
export function useTenant() {
  const { account } = useBusiness();
  const memberId = Number(useLocalSearchParams<{ memberId: string }>().memberId);
  const fetchTenant = useCallback(() => api.pgTenant(account.id, memberId), [account.id, memberId]);
  return useResource(fetchTenant);
}

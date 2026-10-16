import { router } from 'expo-router';

import { isMemberFilterKey } from '@/lib/member-filters';

/** Opens what a notification is about: a member, or a filtered member list. */
export function openNotificationTarget(
  businessAccountId: number,
  target: { member_id?: number | null; member_filter?: string | null },
) {
  const id = businessAccountId;
  if (target.member_id) {
    router.push({ pathname: '/business/[id]/members/[memberId]', params: { id, memberId: target.member_id } });
  } else if (isMemberFilterKey(target.member_filter)) {
    router.navigate({ pathname: '/business/[id]/members', params: { id, filter: target.member_filter } });
  } else {
    router.navigate({ pathname: '/business/[id]', params: { id } });
  }
}

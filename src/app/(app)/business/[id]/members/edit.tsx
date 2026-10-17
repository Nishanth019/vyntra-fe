import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { MemberForm } from '@/components/member-form';
import { LoadingState } from '@/components/ui/states';
import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';

/** Edits a member's personal details; plans are managed from their profile. */
export default function EditMemberScreen() {
  const { account } = useBusiness();
  const memberId = Number(useLocalSearchParams<{ memberId: string }>().memberId);

  const fetchMember = useCallback(() => api.member(account.id, memberId), [account.id, memberId]);
  const { data: member, error, retry } = useResource(fetchMember);

  if (!member) return <LoadingState error={error} onRetry={retry} />;

  return (
    <MemberForm
      member={member}
      plans={[]}
      onSubmit={async (input) => {
        await api.updateMember(account.id, member.id, input);
        router.back();
      }}
    />
  );
}

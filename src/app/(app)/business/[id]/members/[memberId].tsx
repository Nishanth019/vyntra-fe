import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { MemberForm } from '@/components/member-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { memberName } from '@/lib/format';

export default function EditMemberScreen() {
  const { account } = useBusiness();
  const memberId = Number(useLocalSearchParams<{ memberId: string }>().memberId);

  const fetchFormData = useCallback(async () => {
    const [member, plans] = await Promise.all([api.member(account.id, memberId), api.plans(account.id)]);
    return { member, plans: plans.results.filter((plan) => plan.is_active) };
  }, [account.id, memberId]);
  const { data, setData, error, retry } = useResource(fetchFormData);

  if (!data) return <LoadingState error={error} onRetry={retry} />;
  const { member } = data;
  const memberParams = { id: account.id, memberId: member.id };

  return (
    <>
      <Stack.Screen options={{ title: memberName(member) }} />
      <MemberForm
        // Remount with fresh values after reactivating.
        key={String(member.is_active)}
        member={member}
        plans={data.plans}
        onSubmit={async (input) => {
          await api.updateMember(account.id, member.id, input);
          router.back();
        }}
        footer={
          <>
            <Card icon="money" title="Payments">
              <View style={styles.row}>
                {member.is_active ? (
                  <Button
                    title="Record Payment"
                    icon="money"
                    variant="secondary"
                    style={styles.flex}
                    onPress={() =>
                      router.push({ pathname: '/business/[id]/members/payment', params: memberParams })
                    }
                  />
                ) : null}
                <Button
                  title="History"
                  icon="report"
                  variant="secondary"
                  style={styles.flex}
                  onPress={() =>
                    router.push({ pathname: '/business/[id]/members/history', params: memberParams })
                  }
                />
              </View>
            </Card>
            <Card icon="checkIn" title="Attendance">
              <View style={styles.row}>
                {member.is_active ? (
                  <Button
                    title="Mark"
                    icon="check"
                    variant="secondary"
                    style={styles.flex}
                    onPress={() => router.push({ pathname: '/business/[id]/attendance/mark', params: memberParams })}
                  />
                ) : null}
                <Button
                  title="History"
                  icon="report"
                  variant="secondary"
                  style={styles.flex}
                  onPress={() => router.push({ pathname: '/business/[id]/attendance/report', params: memberParams })}
                />
              </View>
            </Card>
          </>
        }
        onToggleActive={async () => {
          if (member.is_active) {
            await api.deactivateMember(account.id, member.id);
            router.back();
          } else {
            setData({ ...data, member: await api.updateMember(account.id, member.id, { is_active: true }) });
          }
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
});

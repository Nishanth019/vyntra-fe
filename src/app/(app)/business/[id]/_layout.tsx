import { Stack, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { LoadingState } from '@/components/ui/states';
import { useResource } from '@/hooks/use-resource';
import { useStackOptions } from '@/hooks/use-stack-options';
import { api } from '@/lib/api';
import { BusinessContext } from '@/lib/business';

/** Loads the business account once and shares it with every screen inside it. */
export default function BusinessLayout() {
  const stackOptions = useStackOptions();
  const id = Number(useLocalSearchParams<{ id: string }>().id);

  const fetchAccount = useCallback(() => api.businessAccount(id), [id]);
  const { data: account, setData: setAccount, error, retry } = useResource(fetchAccount);

  if (!account) return <LoadingState error={error} onRetry={retry} />;

  return (
    <BusinessContext value={{ account, setAccount }}>
      <Stack screenOptions={stackOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false, title: account.name }} />
        <Stack.Screen name="settings" options={{ title: 'Organisation Settings' }} />
        <Stack.Screen name="members/new" options={{ title: 'Add Member' }} />
        <Stack.Screen name="members/[memberId]" options={{ title: 'Member' }} />
        <Stack.Screen name="members/payment" options={{ title: 'Record Payment' }} />
        <Stack.Screen name="members/history" options={{ title: 'Member History' }} />
        <Stack.Screen name="members/plan" options={{ title: 'Membership' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="notification-settings" options={{ title: 'Notification Settings' }} />
        <Stack.Screen name="plans/index" options={{ title: 'Membership Plans' }} />
        <Stack.Screen name="plans/new" options={{ title: 'Add Plan' }} />
        <Stack.Screen name="plans/[planId]" options={{ title: 'Edit Plan' }} />
        <Stack.Screen name="attendance/index" options={{ title: 'Attendance' }} />
        <Stack.Screen name="attendance/mark" options={{ title: 'Mark Attendance' }} />
        <Stack.Screen name="attendance/report" options={{ title: 'Attendance Report' }} />
        <Stack.Screen name="staff/index" options={{ title: 'Manage Staff' }} />
        <Stack.Screen name="staff/new" options={{ title: 'Add Staff' }} />
        <Stack.Screen name="staff/[staffId]" options={{ title: 'Staff' }} />
        <Stack.Screen name="admins/index" options={{ title: 'Manage Users' }} />
        <Stack.Screen name="admins/new" options={{ title: 'Add User' }} />
        <Stack.Screen name="admins/[adminId]" options={{ title: 'Edit User' }} />
      </Stack>
    </BusinessContext>
  );
}

import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Sidebar } from '@/components/side-menu';
import { LoadingState } from '@/components/ui/states';
import { useResource } from '@/hooks/use-resource';
import { useStackOptions } from '@/hooks/use-stack-options';
import { useWideLayout } from '@/hooks/use-wide-layout';
import { api, ApiError } from '@/lib/api';
import { BusinessContext } from '@/lib/business';
import { defaultBusiness } from '@/lib/default-business';
import { isPg } from '@/lib/pg';
import { useSession } from '@/lib/session';

/** Loads the business account once and shares it with every screen inside it. */
export default function BusinessLayout() {
  const stackOptions = useStackOptions();
  const wide = useWideLayout();
  const id = Number(useLocalSearchParams<{ id: string }>().id);

  const { admin } = useSession();

  // The business opened last becomes the default; one the admin lost access to is forgotten.
  const fetchAccount = useCallback(async () => {
    try {
      const account = await api.businessAccount(id);
      if (admin) defaultBusiness.set(admin.id, account.id);
      return account;
    } catch (e) {
      if (e instanceof ApiError && (e.status === 403 || e.status === 404) && admin) {
        await defaultBusiness.clear(admin.id);
        router.replace({ pathname: '/', params: { switch: '1' } });
      }
      throw e;
    }
  }, [id, admin]);
  const { data: account, setData: setAccount, error, retry } = useResource(fetchAccount);

  if (!account) return <LoadingState error={error} onRetry={retry} />;

  return (
    <BusinessContext value={{ account, setAccount }}>
      {/* Desktop browsers keep the menu open on the left; phones use the slide-out menu. */}
      <View style={styles.row}>
        {wide ? <Sidebar /> : null}
        <View style={styles.flex}>
          <Stack screenOptions={stackOptions}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false, title: account.name }} />
            <Stack.Screen name="settings" options={{ title: 'Organisation Settings' }} />
            <Stack.Screen name="members/new" options={{ title: 'Add Member' }} />
            <Stack.Screen name="members/import" options={{ title: 'Import Members' }} />
            <Stack.Screen name="members/[memberId]" options={{ title: 'Member Profile' }} />
            <Stack.Screen name="members/edit" options={{ title: 'Edit Member' }} />
            <Stack.Screen name="members/payment" options={{ title: 'Record Payment' }} />
            <Stack.Screen name="members/history" options={{ title: isPg(account) ? 'History' : 'Member History' }} />
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
            <Stack.Screen name="admins/index" options={{ title: 'Manage Admins' }} />
            <Stack.Screen name="admins/new" options={{ title: 'Add Admin' }} />
            <Stack.Screen name="admins/[adminId]" options={{ title: 'Edit Admin' }} />
            <Stack.Screen name="staff/salaries" options={{ title: 'Staff Salaries' }} />
            <Stack.Screen name="expenses/index" options={{ title: 'Expenses' }} />
            <Stack.Screen name="expenses/new" options={{ title: 'Add Expense' }} />
            <Stack.Screen name="expenses/[expenseId]" options={{ title: 'Expense' }} />
            <Stack.Screen name="pg/settings" options={{ title: 'PG Settings' }} />
            <Stack.Screen name="pg/rooms/new" options={{ title: 'Add Room' }} />
            <Stack.Screen name="pg/rooms/[roomId]" options={{ title: 'Edit Room' }} />
            <Stack.Screen name="pg/tenants/new" options={{ title: 'Add Tenant' }} />
            <Stack.Screen name="pg/tenants/[memberId]" options={{ title: 'Tenant' }} />
            <Stack.Screen name="pg/tenants/edit" options={{ title: 'Edit Tenant' }} />
            <Stack.Screen name="pg/tenants/rent" options={{ title: 'Record Rent' }} />
            <Stack.Screen name="pg/tenants/charge" options={{ title: 'Add Charge' }} />
            <Stack.Screen name="pg/tenants/discount" options={{ title: 'Discount' }} />
            <Stack.Screen name="pg/tenants/deposit" options={{ title: 'Security Deposit' }} />
            <Stack.Screen name="pg/tenants/shift" options={{ title: 'Shift Bed' }} />
            <Stack.Screen name="pg/tenants/notice" options={{ title: 'Give Notice' }} />
            <Stack.Screen name="pg/tenants/checkout" options={{ title: 'Check Out' }} />
            <Stack.Screen name="pg/tenants/move-in" options={{ title: 'Move Back In' }} />
          </Stack>
        </View>
      </View>
    </BusinessContext>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  flex: {
    flex: 1,
  },
});

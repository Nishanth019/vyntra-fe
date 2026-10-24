import { router, Stack } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { HeaderButton } from '@/components/ui/header-button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, type AccountAdmin } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { useSession } from '@/lib/session';

/** Everyone who can log in and manage this business. */
export default function AdminsScreen() {
  const { account } = useBusiness();
  const params = { id: account.id };

  const fetchAdmins = useCallback(() => api.admins(account.id).then(({ results }) => results), [account.id]);
  const { data: admins, error, refreshing, refresh, retry } = useResource(fetchAdmins);

  const addAdmin = () => router.push({ pathname: '/business/[id]/admins/new', params });

  return (
    <>
      <Stack.Screen options={{ headerRight: () => <HeaderButton icon="add" label="Add admin" filled onPress={addAdmin} /> }} />
      {!admins ? (
        <LoadingState error={error} onRetry={retry} />
      ) : (
        <Screen onRefresh={refresh} refreshing={refreshing}>
          {error ? <ErrorBanner message={error} /> : null}
          {admins.map((item) => (
            <AdminCard
              key={item.admin.id}
              accountAdmin={item}
              onEdit={() =>
                router.push({ pathname: '/business/[id]/admins/[adminId]', params: { ...params, adminId: item.admin.id } })
              }
            />
          ))}
        </Screen>
      )}
    </>
  );
}

function AdminCard({ accountAdmin, onEdit }: { accountAdmin: AccountAdmin; onEdit: () => void }) {
  const theme = useTheme();
  const { admin: me } = useSession();
  const { admin, role, is_active } = accountAdmin;
  const isSelf = admin.id === me?.id;

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.top, { backgroundColor: theme.primary }]}>
        <View style={styles.avatar}>
          <Icon name="person" color={theme.onPrimary} size={28} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.name, { color: theme.onPrimary }]} numberOfLines={2}>
            {admin.full_name}
            {isSelf ? ' (You)' : ''}
          </Text>
          <Text style={[styles.role, { color: theme.onPrimary }]}>{role.toLowerCase()}</Text>
        </View>
        <View style={[styles.userId, { backgroundColor: theme.surface }]}>
          <Text style={[styles.userIdLabel, { color: theme.primary }]}>USER ID</Text>
          <Text style={[styles.userIdValue, { color: theme.primary }]}>{admin.id}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.tiles}>
          <InfoTile icon="mail" label="Email" value={admin.email} />
          <InfoTile icon="phone" label="Mobile No." value={admin.mobile_no} />
        </View>
        <View style={[styles.access, { borderColor: theme.border }]}>
          <Icon name={is_active ? 'login' : 'block'} color={is_active ? theme.success : theme.danger} size={18} />
          <Text style={[styles.accessText, { color: is_active ? theme.success : theme.danger }]}>
            Login Access: {is_active ? 'Allowed' : 'Blocked'}
          </Text>
        </View>
        <Button title="Edit" icon="edit" variant="secondary" onPress={onEdit} />
      </View>
    </View>
  );
}

function InfoTile({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  const theme = useTheme();

  return (
    <View style={[styles.tile, { borderColor: theme.border }]}>
      <View style={styles.tileLabelRow}>
        <Icon name={icon} color={theme.textSecondary} size={16} />
        <Text style={[styles.tileLabel, { color: theme.textSecondary }]}>{label}</Text>
      </View>
      <Text
        style={[styles.tileValue, { color: theme.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        selectable>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  card: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  role: {
    fontSize: 14,
    opacity: 0.85,
    marginTop: 2,
  },
  userId: {
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  userIdLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  userIdValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  tiles: {
    gap: Spacing.two + 2,
  },
  tile: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.two + 4,
    gap: Spacing.one,
  },
  tileLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  tileLabel: {
    fontSize: 13,
  },
  tileValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  access: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.two + 4,
  },
  accessText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

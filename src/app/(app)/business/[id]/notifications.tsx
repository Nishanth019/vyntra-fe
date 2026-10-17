import { Stack } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { HeaderButton } from '@/components/ui/header-button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { type IconName } from '@/components/ui/icon';
import { IconBadge, type Tone } from '@/components/ui/icon-badge';
import { EmptyState } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useTheme } from '@/hooks/use-theme';
import { api, type AppNotification } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatDate, formatTime, toISODate } from '@/lib/dates';
import { openNotificationTarget } from '@/lib/notification-target';

const TYPE_STYLES: Record<string, { icon: IconName; tone: Tone }> = {
  MORNING_SUMMARY: { icon: 'sun', tone: 'primary' },
  EVENING_SUMMARY: { icon: 'moon', tone: 'accent' },
  EXPIRING: { icon: 'hourglass', tone: 'warning' },
  EXPIRED: { icon: 'personOff', tone: 'danger' },
  AUTO_INACTIVE: { icon: 'personOff', tone: 'neutral' },
  DUES: { icon: 'money', tone: 'danger' },
  NO_SHOW: { icon: 'checkIn', tone: 'warning' },
  BIRTHDAY: { icon: 'person', tone: 'accent' },
  ACTIVITY: { icon: 'bell', tone: 'success' },
};

export default function NotificationsScreen() {
  const theme = useTheme();
  const { account } = useBusiness();

  const fetchPage = useCallback((page: number) => api.notifications(account.id, page), [account.id]);
  const list = usePaginatedList(fetchPage);

  async function markAllRead() {
    await api.markNotificationsRead(account.id);
    await list.refresh();
  }

  function open(notification: AppNotification) {
    if (!notification.is_read) api.markNotificationsRead(account.id, notification.id).catch(() => {});
    openNotificationTarget(account.id, notification);
  }

  return (
    <>
      <Stack.Screen
        options={{ headerRight: () => <HeaderButton icon="check" label="Mark all as read" onPress={markAllRead} /> }}
      />
      {list.error ? (
        <View style={styles.error}>
          <ErrorBanner message={list.error} />
        </View>
      ) : null}
      {!list.items ? (
        list.error ? null : <ActivityIndicator color={theme.primary} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <NotificationRow notification={item} onPress={() => open(item)} />}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={theme.primary} />}
          ListFooterComponent={list.loadingMore ? <ActivityIndicator color={theme.primary} /> : null}
          ListEmptyComponent={
            <EmptyState
              icon="bell"
              title="No notifications yet"
              message="Plan expiries, dues, birthdays and daily summaries will show up here."
            />
          }
        />
      )}
    </>
  );
}

function NotificationRow({ notification, onPress }: { notification: AppNotification; onPress: () => void }) {
  const theme = useTheme();
  const style = TYPE_STYLES[notification.notification_type] ?? { icon: 'bell', tone: 'primary' };
  const when = `${formatDate(toISODate(new Date(notification.created_at)))}, ${formatTime(notification.created_at)}`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: notification.is_read ? theme.surface : theme.primarySoft,
          borderColor: notification.is_read ? theme.border : theme.primary,
        },
        pressed && styles.pressed,
      ]}>
      <IconBadge name={style.icon} tone={style.tone} size={40} />
      <View style={styles.body}>
        <Text style={[styles.title, { color: theme.text }]}>{notification.title}</Text>
        <Text style={[styles.message, { color: theme.text }]}>{notification.message}</Text>
        <Text style={[styles.when, { color: theme.textSecondary }]}>{when}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  error: {
    padding: Spacing.three,
    paddingBottom: 0,
  },
  loader: {
    marginTop: Spacing.six,
  },
  list: {
    flexGrow: 1,
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  when: {
    fontSize: 12,
  },
});

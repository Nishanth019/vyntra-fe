import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { PersonRow } from '@/components/member-row';
import { StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { HeaderButton } from '@/components/ui/header-button';
import { Icon } from '@/components/ui/icon';
import { IconBadge, type Tone } from '@/components/ui/icon-badge';
import { EmptyState } from '@/components/ui/states';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type Attendance } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { addDays, formatLongDate, parseISODate, toISODate } from '@/lib/dates';
import { attendanceTimes, memberName } from '@/lib/format';

/** Who attended on a given day, with check-out for anyone still in. */
export default function AttendanceScreen() {
  const theme = useTheme();
  const { account } = useBusiness();
  const today = toISODate(new Date());
  const [date, setDate] = useState(today);
  const [checkingOut, setCheckingOut] = useState<number | null>(null);
  const [actionError, setActionError] = useState('');

  const fetchPage = useCallback(
    (page: number) => api.attendance({ business_account_id: account.id, attendance_date: date, page }),
    [account.id, date],
  );
  const list = usePaginatedList(fetchPage);
  // Today's "not in yet" needs the number of active members.
  const fetchDashboard = useCallback(() => api.dashboard(account.id), [account.id]);
  const { data: dashboard } = useResource(fetchDashboard);
  const active = dashboard?.members.live;

  function changeDate(days: number) {
    list.reset();
    setDate(toISODate(addDays(parseISODate(date), days)));
  }

  async function checkOut(record: Attendance) {
    setActionError('');
    setCheckingOut(record.id);
    try {
      const updated = await api.updateAttendance(account.id, record.id, { check_out_time: new Date().toISOString() });
      list.updateItem((item) => item.id === record.id, updated);
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setActionError(e.message);
    } finally {
      setCheckingOut(null);
    }
  }

  const params = { id: account.id };
  const markAttendance = () => router.push({ pathname: '/business/[id]/attendance/mark', params });

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <HeaderButton
                icon="report"
                label="Attendance report"
                onPress={() => router.push({ pathname: '/business/[id]/attendance/report', params })}
              />
              <HeaderButton icon="add" label="Mark attendance" filled onPress={markAttendance} />
            </View>
          ),
        }}
      />

      <View style={[styles.dateBar, { backgroundColor: theme.surface, borderColor: theme.border }, shadow(theme.shadow)]}>
        <DateArrow icon="chevronLeft" label="Previous day" onPress={() => changeDate(-1)} />
        <View style={styles.dateText}>
          <Text style={[styles.date, { color: theme.text }]}>{formatLongDate(date)}</Text>
          {date === today ? (
            <Text style={[styles.dateHint, { color: theme.primary }]}>Today</Text>
          ) : (
            <Pressable
              hitSlop={8}
              onPress={() => {
                list.reset();
                setDate(today);
              }}>
              <Text style={[styles.dateHint, { color: theme.primary }]}>Jump to today</Text>
            </Pressable>
          )}
        </View>
        <DateArrow icon="chevronRight" label="Next day" disabled={date >= today} onPress={() => changeDate(1)} />
      </View>

      {list.items ? (
        <View style={[styles.stats, { backgroundColor: theme.surface, borderColor: theme.border }, shadow(theme.shadow)]}>
          <Stat label="Present" value={list.count} icon="userGroup" tone="success" />
          {date === today && active !== undefined ? (
            <>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <Stat label="Not in yet" value={Math.max(0, active - list.count)} icon="personOff" tone="danger" />
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <Stat label="Active" value={active} icon="people" tone="neutral" />
            </>
          ) : null}
        </View>
      ) : null}

      {list.error || actionError ? (
        <View style={styles.error}>
          <ErrorBanner message={list.error || actionError} />
        </View>
      ) : null}

      {!list.items ? (
        list.error ? null : <ActivityIndicator color={theme.primary} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={list.items}
          keyExtractor={(record) => String(record.id)}
          contentContainerStyle={styles.list}
          onEndReached={list.loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={theme.primary} />
          }
          ListFooterComponent={list.loadingMore ? <ActivityIndicator color={theme.primary} /> : null}
          renderItem={({ item }) => (
            <PersonRow
              name={memberName(item.member)}
              details={[`#${item.member.member_code}`, attendanceTimes(item)]}
              onPress={() =>
                router.push({
                  pathname: '/business/[id]/attendance/report',
                  params: { ...params, memberId: item.member.id },
                })
              }
              trailing={
                item.check_out_time || date !== today ? (
                  <StatusPill label={item.check_out_time ? 'Checked out' : 'Present'} tone="success" />
                ) : (
                  <Button
                    title="Check out"
                    variant="secondary"
                    style={styles.checkOut}
                    loading={checkingOut === item.id}
                    onPress={() => checkOut(item)}
                  />
                )
              }
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="checkIn"
              title="No attendance marked"
              message={date === today ? 'Nobody has checked in yet today.' : 'Nobody was marked present on this day.'}
              action={<Button title="Mark Attendance" icon="check" onPress={markAttendance} />}
            />
          }
        />
      )}
    </>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: number; icon: 'userGroup' | 'personOff' | 'people'; tone: Tone }) {
  const theme = useTheme();

  return (
    <View style={styles.stat}>
      <IconBadge name={icon} tone={tone} size={36} />
      <View>
        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
        <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      </View>
    </View>
  );
}

function DateArrow({
  icon,
  label,
  disabled = false,
  onPress,
}: {
  icon: 'chevronLeft' | 'chevronRight';
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.arrow,
        { backgroundColor: theme.primarySoft },
        (pressed || disabled) && styles.dimmed,
      ]}>
      <Icon name={icon} color={theme.primary} size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginHorizontal: Spacing.three + 4,
    marginTop: Spacing.three,
    padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three + 4,
    marginTop: Spacing.three - 4,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  statDivider: {
    width: 1,
    height: 36,
  },
  statLabel: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  dateText: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  date: {
    fontSize: 17,
    fontWeight: '700',
  },
  dateHint: {
    fontSize: 13,
    fontWeight: '600',
  },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: {
    opacity: 0.4,
  },
  error: {
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.three,
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
  checkOut: {
    height: 38,
    paddingHorizontal: Spacing.three,
  },
});

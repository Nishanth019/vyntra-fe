import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { MemberPicker } from '@/components/member-picker';
import { membershipStatus, StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { IconBadge } from '@/components/ui/icon-badge';
import { SelectField } from '@/components/ui/select-field';
import { EmptyState } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useTheme } from '@/hooks/use-theme';
import { api, type Attendance, type Member, type Paginated } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatLongDate } from '@/lib/dates';
import { attendanceTimes, memberName } from '@/lib/format';

const NO_RECORDS: Paginated<Attendance> = { count: 0, next: null, previous: null, results: [] };

/** One member's attendance history. */
export default function AttendanceReportScreen() {
  const theme = useTheme();
  const { account } = useBusiness();
  const params = useLocalSearchParams<{ memberId?: string }>();

  const [member, setMember] = useState<Member | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Pre-select the member when opened from their profile or the daily register.
  useEffect(() => {
    if (!params.memberId) return;
    api.member(account.id, Number(params.memberId)).then(setMember, () => {});
  }, [account.id, params.memberId]);

  const memberId = member?.id;
  const fetchPage = useCallback(
    (page: number) =>
      memberId
        ? api.attendance({ business_account_id: account.id, member_id: memberId, page })
        : Promise.resolve(NO_RECORDS),
    [account.id, memberId],
  );
  const list = usePaginatedList(fetchPage);

  const filters = (
    <Card icon="report" title="Report filters">
      <SelectField
        label="Member name"
        icon="search"
        placeholder="Select member"
        value={member ? `${memberName(member)} (#${member.member_code})` : undefined}
        onPress={() => setPickerOpen(true)}
      />
    </Card>
  );

  const summary = member ? (
    <View style={[styles.summary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <IconBadge name="checkIn" tone="success" />
      <View style={styles.flex}>
        <Text style={[styles.summaryValue, { color: theme.text }]}>
          {list.count} {list.count === 1 ? 'day' : 'days'} attended
        </Text>
        <Text style={[styles.summaryHint, { color: theme.textSecondary }]}>
          {list.items?.[0] ? `Last visit ${formatLongDate(list.items[0].attendance_date)}` : 'No visits yet'}
        </Text>
      </View>
      <StatusPill {...membershipStatus(member)} />
    </View>
  ) : null;

  return (
    <>
      <FlatList
        data={member ? (list.items ?? []) : []}
        keyExtractor={(record) => String(record.id)}
        contentContainerStyle={styles.list}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={
          member ? (
            <RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={theme.primary} />
          ) : undefined
        }
        ListHeaderComponent={
          <View style={styles.header}>
            {filters}
            {list.error ? <ErrorBanner message={list.error} /> : null}
            {summary}
          </View>
        }
        renderItem={({ item }) => (
          <View style={[styles.record, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.recordDate, { color: theme.text }]}>{formatLongDate(item.attendance_date)}</Text>
            <Text style={[styles.recordTimes, { color: theme.textSecondary }]}>{attendanceTimes(item)}</Text>
          </View>
        )}
        ListFooterComponent={list.loadingMore ? <ActivityIndicator color={theme.primary} /> : null}
        ListEmptyComponent={
          !member ? (
            <EmptyState
              icon="search"
              title="No person selected"
              message="Select a member above to generate the report."
            />
          ) : list.items === null ? (
            <ActivityIndicator color={theme.primary} style={styles.loader} />
          ) : (
            <EmptyState
              icon="checkIn"
              title="No attendance yet"
              message={`${memberName(member)} hasn't been marked present.`}
              action={
                <Button
                  title="Mark Attendance"
                  icon="check"
                  onPress={() =>
                    router.push({
                      pathname: '/business/[id]/attendance/mark',
                      params: { id: account.id, memberId: member.id },
                    })
                  }
                />
              }
            />
          )
        }
      />

      <MemberPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(selected) => {
          list.reset();
          setMember(selected);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    gap: Spacing.two + 2,
    padding: Spacing.three,
    paddingBottom: Spacing.six,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: '700',
  },
  summaryHint: {
    fontSize: 13,
    marginTop: 2,
  },
  loader: {
    marginTop: Spacing.five,
  },
  record: {
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    gap: 2,
  },
  recordDate: {
    fontSize: 15,
    fontWeight: '600',
  },
  recordTimes: {
    fontSize: 13,
  },
});

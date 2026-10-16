import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/components/status-pill';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Icon, type IconName } from '@/components/ui/icon';
import { type Tone, useToneColors } from '@/components/ui/icon-badge';
import { EmptyState } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useTheme } from '@/hooks/use-theme';
import { api, type MemberActivity, type Membership, type Payment } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { daysUntil, formatDate, formatTime, toISODate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { paymentMethodLabel } from '@/lib/payments';

type HistoryView = 'timeline' | 'plans';

const ACTIVITY_STYLES: Record<string, { icon: IconName; tone: Tone }> = {
  MEMBER_CREATED: { icon: 'personAdd', tone: 'primary' },
  MEMBER_UPDATED: { icon: 'edit', tone: 'neutral' },
  MEMBERSHIP_RENEWED: { icon: 'renew', tone: 'success' },
  PLAN_CHANGED: { icon: 'swap', tone: 'accent' },
  MEMBERSHIP_EXTENDED: { icon: 'pause', tone: 'accent' },
  MEMBERSHIP_UPDATED: { icon: 'edit', tone: 'accent' },
  PAYMENT_ADDED: { icon: 'money', tone: 'success' },
  PAYMENT_DELETED: { icon: 'money', tone: 'danger' },
  MEMBER_DEACTIVATED: { icon: 'personOff', tone: 'danger' },
  MEMBER_REACTIVATED: { icon: 'check', tone: 'success' },
};

function membershipPill(membership: Membership): { label: string; tone: Tone } {
  if (daysUntil(membership.end_date) < 0) return { label: 'Ended', tone: 'neutral' };
  if (daysUntil(membership.start_date) > 0) return { label: 'Upcoming', tone: 'accent' };
  return { label: 'Current', tone: 'success' };
}

/** Everything that happened to a member (timeline), or their plans with payments and dues. */
export default function MemberHistoryScreen() {
  const memberId = Number(useLocalSearchParams<{ memberId: string }>().memberId);
  const [view, setView] = useState<HistoryView>('timeline');

  return (
    <>
      <View style={styles.toggle}>
        <View style={styles.flex}>
          <Chip label="Timeline" selected={view === 'timeline'} onPress={() => setView('timeline')} />
        </View>
        <View style={styles.flex}>
          <Chip label="Plans & Payments" selected={view === 'plans'} onPress={() => setView('plans')} />
        </View>
      </View>
      {view === 'timeline' ? <Timeline memberId={memberId} /> : <Plans memberId={memberId} />}
    </>
  );
}

function Timeline({ memberId }: { memberId: number }) {
  const { account } = useBusiness();
  const fetchPage = useCallback(
    (page: number) => api.memberActivity(account.id, memberId, page),
    [account.id, memberId],
  );
  const list = usePaginatedList(fetchPage);

  if (list.items === null) return list.error ? <ErrorBanner message={list.error} /> : <Loading />;
  return (
    <FlatList
      data={list.items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.timeline}
      renderItem={({ item, index }) => <ActivityRow activity={item} last={index === list.items!.length - 1} />}
      refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} />}
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={
        <EmptyState
          icon="history"
          title="No history yet"
          message="Changes are recorded from now on: renewals, plan changes, payments and edits."
        />
      }
      ListFooterComponent={list.loadingMore ? <Loading /> : null}
    />
  );
}

function ActivityRow({ activity, last }: { activity: MemberActivity; last: boolean }) {
  const theme = useTheme();
  const style = ACTIVITY_STYLES[activity.activity_type] ?? { icon: 'info', tone: 'neutral' };
  const colors = useToneColors(style.tone);
  const when = `${formatDate(toISODate(new Date(activity.created_at)))}, ${formatTime(activity.created_at)}`;

  return (
    <View style={styles.activity}>
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: colors.background }]}>
          <Icon name={style.icon} color={colors.color} size={16} />
        </View>
        {last ? null : <View style={[styles.line, { backgroundColor: theme.border }]} />}
      </View>
      <View style={[styles.activityBody, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.activityText, { color: theme.text }]}>{activity.description}</Text>
        <Text style={[styles.activityMeta, { color: theme.textSecondary }]}>
          {when} · {activity.created_by ?? 'Automatic'}
        </Text>
      </View>
    </View>
  );
}

function Plans({ memberId }: { memberId: number }) {
  const { account } = useBusiness();
  const fetchPage = useCallback(
    (page: number) => api.memberships(account.id, memberId, page),
    [account.id, memberId],
  );
  const list = usePaginatedList(fetchPage);

  if (list.items === null) return list.error ? <ErrorBanner message={list.error} /> : <Loading />;
  return (
    <FlatList
      data={list.items}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => <MembershipCard membership={item} />}
      refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} />}
      onEndReached={list.loadMore}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={
        <EmptyState icon="plans" title="No memberships yet" message="This member has no membership history." />
      }
      ListFooterComponent={list.loadingMore ? <Loading /> : null}
    />
  );
}

function MembershipCard({ membership }: { membership: Membership }) {
  const theme = useTheme();
  const balance = Number(membership.balance);

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text style={[styles.plan, { color: theme.text }]}>{membership.membership_plan.name}</Text>
          <Text style={[styles.dates, { color: theme.textSecondary }]}>
            {formatDate(membership.start_date)} – {formatDate(membership.end_date)}
          </Text>
        </View>
        <StatusPill {...membershipPill(membership)} />
      </View>

      <View style={[styles.duesRow, { borderColor: theme.border }]}>
        <Stat label="Payable" value={formatMoney(membership.net_payable)} color={theme.text} />
        <Stat label="Paid" value={formatMoney(membership.amount_paid)} color={theme.success} />
        <Stat
          label="Balance"
          value={formatMoney(membership.balance)}
          color={balance > 0 ? theme.danger : theme.textSecondary}
        />
      </View>

      {Number(membership.discount) > 0 ? (
        <Text style={[styles.note, { color: theme.textSecondary }]}>
          {formatMoney(membership.discount)} discount on {formatMoney(membership.amount)}.
        </Text>
      ) : null}

      {membership.payments.length > 0 ? (
        <View style={styles.payments}>
          {membership.payments.map((payment) => (
            <PaymentRow key={payment.id} payment={payment} />
          ))}
        </View>
      ) : (
        <Text style={[styles.note, { color: theme.textSecondary }]}>No payments recorded.</Text>
      )}
    </Card>
  );
}

function PaymentRow({ payment }: { payment: Payment }) {
  const theme = useTheme();
  return (
    <View style={[styles.paymentRow, { borderColor: theme.border }]}>
      <Text style={[styles.paymentAmount, { color: theme.text }]}>{formatMoney(payment.amount)}</Text>
      <Text style={[styles.paymentMeta, { color: theme.textSecondary }]}>
        {formatDate(toISODate(new Date(payment.payment_date)))} ·{' '}
        {paymentMethodLabel(payment.payment_method)}
        {payment.transaction_reference ? ` · ${payment.transaction_reference}` : ''}
      </Text>
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={styles.flex}>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function Loading() {
  const theme = useTheme();
  return <ActivityIndicator style={styles.loading} color={theme.primary} />;
}

const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
  },
  timeline: {
    padding: Spacing.three,
  },
  activity: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  rail: {
    alignItems: 'center',
  },
  dot: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: 2,
  },
  activityBody: {
    flex: 1,
    gap: 4,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
    marginBottom: Spacing.two,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  activityMeta: {
    fontSize: 12,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  plan: {
    fontSize: 16,
    fontWeight: '700',
  },
  dates: {
    fontSize: 13,
    marginTop: 2,
  },
  duesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two + 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  note: {
    fontSize: 13,
  },
  payments: {
    gap: Spacing.two,
  },
  paymentRow: {
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  paymentAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  paymentMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  loading: {
    margin: Spacing.four,
  },
});

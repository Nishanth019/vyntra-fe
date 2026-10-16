import { useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/components/status-pill';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { type Tone } from '@/components/ui/icon-badge';
import { EmptyState } from '@/components/ui/states';
import { Spacing } from '@/constants/theme';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useTheme } from '@/hooks/use-theme';
import { api, type Membership, type Payment } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { daysUntil, formatDate, toISODate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  UPI: 'UPI',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank',
};

function membershipPill(membership: Membership): { label: string; tone: Tone } {
  if (!membership.is_active) return { label: 'Ended', tone: 'neutral' };
  if (daysUntil(membership.end_date) < 0) return { label: 'Expired', tone: 'danger' };
  return { label: 'Active', tone: 'success' };
}

export default function MembershipHistoryScreen() {
  const { account } = useBusiness();
  const memberId = Number(useLocalSearchParams<{ memberId: string }>().memberId);

  const fetchPage = useCallback(
    (page: number) => api.memberships(account.id, memberId, page),
    [account.id, memberId],
  );
  const list = usePaginatedList(fetchPage);

  if (list.items === null) {
    return list.error ? <ErrorBanner message={list.error} /> : <Loading />;
  }

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
        {PAYMENT_METHOD_LABELS[payment.payment_method] ?? payment.payment_method}
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

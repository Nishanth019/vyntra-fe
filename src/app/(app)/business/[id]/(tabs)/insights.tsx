import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BarChart, ShareBars } from '@/components/charts';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, type Insights } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { getPeriods, type PeriodKey } from '@/lib/periods';

const METHOD_LABELS: Record<string, string> = { CASH: 'Cash', UPI: 'UPI', CARD: 'Card', BANK_TRANSFER: 'Bank' };

export default function InsightsScreen() {
  const theme = useTheme();
  const { account } = useBusiness();
  const periods = useMemo(() => getPeriods(), []);
  const [periodKey, setPeriodKey] = useState<PeriodKey>('thisMonth');
  const period = periods.find((item) => item.key === periodKey)!;

  const fetchInsights = useCallback(
    () => api.insights(account.id, period.from, period.to),
    [account.id, period.from, period.to],
  );
  const { data, error, refreshing, refresh, retry } = useResource(fetchInsights);

  return (
    <>
      <View style={[styles.toolbar, { borderColor: theme.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.periods}>
          {periods.map((item) => (
            <View key={item.key} style={styles.period}>
              <Chip label={item.label} selected={item.key === periodKey} onPress={() => setPeriodKey(item.key)} />
            </View>
          ))}
        </ScrollView>
      </View>

      {!data ? (
        <LoadingState error={error} onRetry={retry} />
      ) : (
        <Screen onRefresh={refresh} refreshing={refreshing} maxWidth={720}>
          {error ? <ErrorBanner message={error} /> : null}
          <Text style={[styles.range, { color: theme.textSecondary }]}>
            {formatDate(data.date_from)} – {formatDate(data.date_to)} · compared with the previous period
          </Text>
          <Report data={data} />
        </Screen>
      )}
    </>
  );
}

function Report({ data }: { data: Insights }) {
  const theme = useTheme();
  const { account } = useBusiness();
  const { summary } = data;

  return (
    <>
      <View style={styles.grid}>
        <View style={styles.row}>
          <Kpi
            label="Collections"
            value={formatMoney(summary.collections.value)}
            change={change(Number(summary.collections.value), Number(summary.collections.previous))}
          />
          <Kpi
            label="New Members"
            value={summary.new_members.value}
            change={change(summary.new_members.value, summary.new_members.previous)}
          />
        </View>
        <View style={styles.row}>
          <Kpi
            label="Renewals"
            value={summary.renewals.value}
            change={change(summary.renewals.value, summary.renewals.previous)}
          />
          <Kpi
            label="Expired (not renewed)"
            value={summary.expired.value}
            change={change(summary.expired.value, summary.expired.previous)}
            lowerIsBetter
          />
        </View>
        <View style={styles.row}>
          <Kpi
            label="Renewal Rate"
            value={data.renewal_rate === null ? '—' : `${data.renewal_rate}%`}
            hint="of plans that ended"
          />
          <Kpi
            label="Check-ins"
            value={summary.attendance.value}
            change={change(summary.attendance.value, summary.attendance.previous)}
          />
        </View>
        <View style={styles.row}>
          <Kpi label="Live Members" value={data.live_members} hint="right now" />
          <Kpi label="Outstanding Dues" value={formatMoney(data.outstanding_dues)} hint="right now" />
        </View>
      </View>

      <Card icon="money" title="Collections">
        <BarChart
          data={data.series.map((bucket) => ({ label: bucket.label, values: [Number(bucket.collections)] }))}
          series={[{ name: 'Collections', color: theme.success }]}
          formatValue={formatMoney}
        />
      </Card>

      <Card icon="people" title="Members">
        <BarChart
          data={data.series.map((bucket) => ({
            label: bucket.label,
            values: [bucket.new_members, bucket.renewals, bucket.expired],
          }))}
          series={[
            { name: 'New', color: theme.primary },
            { name: 'Renewed', color: theme.success },
            { name: 'Expired', color: theme.danger },
          ]}
        />
      </Card>

      <Card icon="checkIn" title="Check-ins">
        <BarChart
          data={data.series.map((bucket) => ({ label: bucket.label, values: [bucket.attendance] }))}
          series={[{ name: 'Check-ins', color: theme.accent }]}
        />
      </Card>

      <Card icon="money" title="Payment Methods">
        <ShareBars
          color={theme.success}
          rows={data.payment_methods.map((row) => ({
            label: METHOD_LABELS[row.method] ?? row.method,
            value: Number(row.total),
            detail: formatMoney(row.total),
          }))}
        />
      </Card>

      <Card icon="plans" title="Plans Sold" subtitle="New joins and renewals that started in this period.">
        <ShareBars
          color={theme.primary}
          rows={data.plans.map((row) => ({
            label: row.name,
            value: row.count,
            detail: `${row.count} · ${formatMoney(row.revenue)}`,
          }))}
        />
      </Card>

      <Card icon="warning" title="Top Dues">
        {data.top_dues.length === 0 ? (
          <Text style={[styles.empty, { color: theme.textSecondary }]}>No pending dues 🎉</Text>
        ) : (
          data.top_dues.map((row) => (
            <Pressable
              key={row.member_id}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/business/[id]/members/[memberId]',
                  params: { id: account.id, memberId: row.member_id },
                })
              }
              style={({ pressed }) => [styles.dueRow, { borderColor: theme.border }, pressed && styles.pressed]}>
              <Text style={[styles.dueName, { color: theme.text }]} numberOfLines={1}>
                {row.name}
              </Text>
              <Text style={[styles.dueAmount, { color: theme.danger }]}>{formatMoney(row.amount)}</Text>
              <Icon name="chevronRight" color={theme.textSecondary} size={16} />
            </Pressable>
          ))
        )}
      </Card>
    </>
  );
}

/** % change vs the previous period; null when there's nothing to compare against. */
function change(value: number, previous: number) {
  if (previous === 0) return value === 0 ? 0 : null;
  return Math.round(((value - previous) / previous) * 100);
}

type KpiProps = {
  label: string;
  value: string | number;
  change?: number | null;
  /** For counts where going down is good, e.g. expired members. */
  lowerIsBetter?: boolean;
  hint?: string;
};

function Kpi({ label, value, change, lowerIsBetter = false, hint }: KpiProps) {
  const theme = useTheme();
  const good = change !== undefined && change !== null && (lowerIsBetter ? change < 0 : change > 0);
  const bad = change !== undefined && change !== null && (lowerIsBetter ? change > 0 : change < 0);
  const changeText =
    change === undefined
      ? hint
      : change === null
        ? 'up from 0'
        : change === 0
          ? 'no change'
          : `${change > 0 ? '▲' : '▼'} ${Math.abs(change)}%`;

  return (
    <View style={[styles.kpi, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.kpiLabel, { color: theme.textSecondary }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.kpiValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {changeText ? (
        <Text
          style={[
            styles.kpiChange,
            { color: good ? theme.success : bad ? theme.danger : theme.textSecondary },
          ]}>
          {changeText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  periods: {
    gap: Spacing.two,
    padding: Spacing.three,
  },
  period: {
    width: 116,
  },
  range: {
    fontSize: 13,
  },
  grid: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  kpi: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: 2,
  },
  kpiLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '700',
  },
  kpiChange: {
    fontSize: 12,
    fontWeight: '600',
  },
  empty: {
    fontSize: 14,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.7,
  },
  dueName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  dueAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
});

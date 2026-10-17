import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ShareBars, TrendChart, type ChartType } from '@/components/charts';
import { PeriodPicker } from '@/components/period-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { DateField } from '@/components/ui/date-field';
import { Radius, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, type Insights } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { isValidISODate, parseISODate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { getPeriods, type PeriodKey } from '@/lib/periods';

const METHOD_LABELS: Record<string, string> = { CASH: 'Cash', UPI: 'UPI', CARD: 'Card', BANK_TRANSFER: 'Bank' };

const CHART_TYPES: { key: ChartType; label: string }[] = [
  { key: 'bar', label: 'Bar' },
  { key: 'line', label: 'Line' },
  { key: 'table', label: 'Table' },
];

/** e.g. "Oct 01, 2026". */
function rangeDate(value: string) {
  return parseISODate(value).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

export default function InsightsScreen() {
  const theme = useTheme();
  const { account } = useBusiness();
  const periods = useMemo(() => getPeriods(), []);
  const [periodKey, setPeriodKey] = useState<PeriodKey>('thisMonth');
  const preset = periods.find((item) => item.key === periodKey)!;
  // Custom range: what's typed, and what's applied.
  const [customInput, setCustomInput] = useState({ from: preset.from, to: preset.to });
  const [custom, setCustom] = useState({ from: preset.from, to: preset.to });
  const [customError, setCustomError] = useState('');
  const range = periodKey === 'custom' ? custom : preset;
  const [chartType, setChartType] = useState<ChartType>('bar');

  const fetchInsights = useCallback(
    () => api.insights(account.id, range.from, range.to),
    [account.id, range.from, range.to],
  );
  const { data, error, refreshing, refresh, retry } = useResource(fetchInsights);

  function applyCustom() {
    const { from, to } = customInput;
    if (!isValidISODate(from) || !isValidISODate(to)) return setCustomError('Choose both dates.');
    if (to < from) return setCustomError("End date can't be before the start date.");
    setCustomError('');
    setCustom({ from, to });
  }

  return (
    <>
      <View style={[styles.toolbar, { borderColor: theme.border }]}>
        <View style={styles.toolbarRow}>
          <PeriodPicker periods={periods} value={periodKey} onChange={setPeriodKey} />
          <Text style={[styles.range, { color: theme.textSecondary }]} numberOfLines={2}>
            {rangeDate(range.from)} – {rangeDate(range.to)}
          </Text>
        </View>
        {periodKey === 'custom' ? (
          <View style={styles.customRow}>
            {(['from', 'to'] as const).map((field) => (
              <View key={field} style={styles.flex}>
                <DateField
                  compact
                  label={field === 'from' ? 'From' : 'To'}
                  value={customInput[field]}
                  onChange={(value) => setCustomInput((current) => ({ ...current, [field]: value }))}
                  maximumDate={new Date()}
                />
              </View>
            ))}
            <Button title="Apply" style={styles.apply} onPress={applyCustom} />
          </View>
        ) : null}
        {customError ? <Text style={[styles.customError, { color: theme.danger }]}>{customError}</Text> : null}
      </View>

      {!data ? (
        <LoadingState error={error} onRetry={retry} />
      ) : (
        <Screen onRefresh={refresh} refreshing={refreshing} maxWidth={720}>
          {error ? <ErrorBanner message={error} /> : null}
          <Report data={data} chartType={chartType} onChartType={setChartType} />
        </Screen>
      )}
    </>
  );
}

function Report({
  data,
  chartType,
  onChartType,
}: {
  data: Insights;
  chartType: ChartType;
  onChartType: (type: ChartType) => void;
}) {
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
          <Kpi label="Active Members" value={data.live_members} hint="right now" />
          <Kpi label="Outstanding Dues" value={formatMoney(data.outstanding_dues)} hint="right now" />
        </View>
      </View>

      <View style={styles.chartTypes}>
        <Text style={[styles.chartTypesLabel, { color: theme.textSecondary }]}>Graphs</Text>
        {CHART_TYPES.map((item) => (
          <View key={item.key} style={styles.flex}>
            <Chip label={item.label} selected={chartType === item.key} onPress={() => onChartType(item.key)} />
          </View>
        ))}
      </View>

      <Card icon="money" title="Collections">
        <TrendChart
          type={chartType}
          data={data.series.map((bucket) => ({ label: bucket.label, values: [Number(bucket.collections)] }))}
          series={[{ name: 'Collections', color: theme.success }]}
          formatValue={formatMoney}
        />
      </Card>

      <Card icon="people" title="Members">
        <TrendChart
          type={chartType}
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
        <TrendChart
          type={chartType}
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
    gap: Spacing.two,
    padding: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  range: {
    flexShrink: 1,
    fontSize: 14,
    textAlign: 'right',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  apply: {
    height: 48,
    paddingHorizontal: Spacing.three,
  },
  customError: {
    fontSize: 13,
  },
  chartTypes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  chartTypesLabel: {
    fontSize: 14,
    fontWeight: '600',
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

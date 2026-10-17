import { router } from 'expo-router';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Change, ShareBars, TrendChart, type ChartType } from '@/components/charts';
import { PeriodPicker } from '@/components/period-picker';
import { TabHeader } from '@/components/tab-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateField } from '@/components/ui/date-field';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Icon, type IconName } from '@/components/ui/icon';
import { IconBadge, type Tone } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { LoadingState } from '@/components/ui/states';
import { PageWidth, Radius, shadow, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { useWideLayout } from '@/hooks/use-wide-layout';
import { api, type Insights } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { isValidISODate, parseISODate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { getPeriods, type PeriodKey } from '@/lib/periods';

const METHODS: Record<string, { label: string; icon: IconName }> = {
  CASH: { label: 'Cash', icon: 'money' },
  UPI: { label: 'UPI', icon: 'qr' },
  CARD: { label: 'Card', icon: 'card' },
  BANK_TRANSFER: { label: 'Bank', icon: 'bank' },
};

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
  const wide = useWideLayout();
  const periods = useMemo(() => getPeriods(), []);
  const [periodKey, setPeriodKey] = useState<PeriodKey>('thisMonth');
  const preset = periods.find((item) => item.key === periodKey)!;
  // Custom range: what's chosen, and what's applied.
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
      <TabHeader
        title="Insights"
        subtitle="Track your performance"
        action={
          <View style={styles.period}>
            <PeriodPicker periods={periods} value={periodKey} onChange={setPeriodKey} />
            <Text style={[styles.range, { color: theme.textSecondary }]} numberOfLines={1}>
              {rangeDate(range.from)} – {rangeDate(range.to)}
            </Text>
          </View>
        }
      />
      {periodKey === 'custom' ? (
        <View style={styles.custom}>
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
          {customError ? <Text style={[styles.customError, { color: theme.danger }]}>{customError}</Text> : null}
        </View>
      ) : null}

      {!data ? (
        <LoadingState error={error} onRetry={retry} />
      ) : (
        <Screen onRefresh={refresh} refreshing={refreshing} maxWidth={wide ? PageWidth.desktop : PageWidth.phone}>
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
  const collections = Number(summary.collections.value);

  return (
    <>
      <View style={styles.grid}>
        <View style={styles.row}>
          <Kpi
            label="Collections"
            value={formatMoney(collections)}
            icon="rupee"
            tone="primary"
            footer={<Change value={change(collections, Number(summary.collections.previous))} />}
          />
          <Kpi
            label="New Members"
            value={summary.new_members.value}
            icon="personAdd"
            tone="primary"
            footer={<Change value={change(summary.new_members.value, summary.new_members.previous)} />}
          />
        </View>
        <View style={styles.row}>
          <Kpi
            label="Renewals"
            value={summary.renewals.value}
            icon="renew"
            tone="success"
            footer={<Change value={change(summary.renewals.value, summary.renewals.previous)} />}
          />
          <Kpi
            label="Expired"
            value={summary.expired.value}
            icon="clock"
            tone="danger"
            footer={<Change value={change(summary.expired.value, summary.expired.previous)} lowerIsBetter />}
          />
        </View>
        <View style={styles.row}>
          <Kpi
            label="Check-ins"
            value={summary.attendance.value}
            icon="checkIn"
            tone="accent"
            footer={<Change value={change(summary.attendance.value, summary.attendance.previous)} />}
          />
          <Kpi label="Active Members" value={data.live_members} icon="userGroup" tone="primary" footer={<Hint text="Right now" />} />
        </View>
        <View style={styles.row}>
          <Kpi
            label="Renewal Rate"
            value={data.renewal_rate === null ? '—' : `${data.renewal_rate}%`}
            icon="pieChart"
            tone="success"
            footer={<Hint text="Of plans that ended" />}
          />
          <Kpi
            label="Outstanding Dues"
            value={formatMoney(data.outstanding_dues)}
            icon="card"
            tone="danger"
            footer={<Hint text="Right now" />}
          />
        </View>
      </View>

      <Segmented options={CHART_TYPES} value={chartType} onChange={onChartType} />

      <ChartCard
        title="Collections"
        total={formatMoney(collections)}
        change={change(collections, Number(summary.collections.previous))}>
        <TrendChart
          type={chartType}
          data={data.series.map((bucket) => ({ label: bucket.label, values: [Number(bucket.collections)] }))}
          series={[{ name: 'Collections', color: theme.primary }]}
          formatValue={formatMoney}
        />
      </ChartCard>

      <ChartCard title="Members">
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
      </ChartCard>

      <ChartCard
        title="Check-ins"
        total={String(summary.attendance.value)}
        change={change(summary.attendance.value, summary.attendance.previous)}>
        <TrendChart
          type={chartType}
          data={data.series.map((bucket) => ({ label: bucket.label, values: [bucket.attendance] }))}
          series={[{ name: 'Check-ins', color: theme.accent }]}
        />
      </ChartCard>

      <Card title="Payment Methods">
        <ShareBars
          color={theme.success}
          rows={data.payment_methods.map((row) => ({
            label: METHODS[row.method]?.label ?? row.method,
            icon: METHODS[row.method]?.icon ?? 'money',
            tone: 'success',
            value: Number(row.total),
            detail: formatMoney(row.total),
          }))}
        />
      </Card>

      <Card title="Plans Sold" subtitle="New joins and renewals that started in this period.">
        <ShareBars
          color={theme.primary}
          rows={data.plans.map((row) => ({
            label: `${row.name} · ${row.count}`,
            icon: 'dumbbell',
            tone: 'primary',
            value: Number(row.revenue),
            detail: formatMoney(row.revenue),
          }))}
        />
      </Card>

      <Card title="Top Dues">
        {data.top_dues.length === 0 ? (
          <View style={styles.noDues}>
            <IconBadge name="checkCircle" tone="success" size={60} />
            <Text style={[styles.noDuesTitle, { color: theme.text }]}>No pending dues 🎉</Text>
            <Text style={[styles.noDuesText, { color: theme.textSecondary }]}>All members are up to date!</Text>
          </View>
        ) : (
          data.top_dues.map((row, i) => (
            <Pressable
              key={row.member_id}
              accessibilityRole="button"
              onPress={() =>
                router.push({
                  pathname: '/business/[id]/members/[memberId]',
                  params: { id: account.id, memberId: row.member_id },
                })
              }
              style={({ pressed }) => [
                styles.dueRow,
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
                pressed && styles.pressed,
              ]}>
              <View style={[styles.dueAvatar, { backgroundColor: theme.dangerSoft }]}>
                <Text style={[styles.dueInitial, { color: theme.danger }]}>{row.name.charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={[styles.dueName, { color: theme.text }]} numberOfLines={2}>
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

/** % change vs the previous period; null when it went up from nothing. */
function change(value: number, previous: number) {
  if (previous === 0) return value === 0 ? 0 : null;
  return Math.round(((value - previous) / previous) * 100);
}

function Hint({ text }: { text: string }) {
  const theme = useTheme();
  return <Text style={[styles.hint, { color: theme.textSecondary }]}>{text}</Text>;
}

type KpiProps = { label: string; value: string | number; icon: IconName; tone: Tone; footer: ReactNode };

function Kpi({ label, value, icon, tone, footer }: KpiProps) {
  const theme = useTheme();

  return (
    <View style={[styles.kpi, { backgroundColor: theme.surface, borderColor: theme.border }, shadow(theme.shadow)]}>
      <IconBadge name={icon} tone={tone} size={42} />
      <View>
        <Text style={[styles.kpiLabel, { color: theme.textSecondary }]} numberOfLines={2}>
          {label}
        </Text>
        <Text style={[styles.kpiValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {value}
        </Text>
        {footer}
      </View>
    </View>
  );
}

function ChartCard({
  title,
  total,
  change: delta,
  children,
}: {
  title: string;
  total?: string;
  change?: number | null;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <Card>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>{title}</Text>
        {total ? <Text style={[styles.chartTotal, { color: theme.text }]}>{total}</Text> : null}
        {delta !== undefined ? <Change value={delta} /> : null}
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  period: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  range: {
    fontSize: 12,
  },
  custom: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three + 4,
    paddingBottom: Spacing.two,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  apply: {
    height: 54,
    paddingHorizontal: Spacing.three,
  },
  customError: {
    fontSize: 13,
  },
  grid: {
    gap: Spacing.three - 4,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
  },
  kpi: {
    flex: 1,
    gap: Spacing.two,
    padding: Spacing.three - 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
  },
  kpiLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 2,
  },
  hint: {
    fontSize: 12,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  chartTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  chartTotal: {
    fontSize: 17,
    fontWeight: '800',
  },
  noDues: {
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
  },
  noDuesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: Spacing.two,
  },
  noDuesText: {
    fontSize: 14,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingVertical: Spacing.two + 2,
  },
  pressed: {
    opacity: 0.7,
  },
  dueAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dueInitial: {
    fontSize: 15,
    fontWeight: '700',
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

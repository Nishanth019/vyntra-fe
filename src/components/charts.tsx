import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Series = { name: string; color: string };

type BarChartProps = {
  /** One entry per bar; `values` has one number per series (stacked bottom-up). */
  data: { label: string; values: number[] }[];
  series: Series[];
  formatValue?: (value: number) => string;
};

const CHART_HEIGHT = 150;
const BAR_GAP = 6;

/** A simple (stacked) bar chart drawn with views. Scrolls sideways when there are many bars. */
export function BarChart({ data, series, formatValue = String }: BarChartProps) {
  const theme = useTheme();
  const totals = data.map((bar) => bar.values.reduce((sum, value) => sum + value, 0));
  const max = Math.max(...totals, 0);
  const barWidth = data.length <= 8 ? 34 : 22;
  // One label per group of bars, so labels never overlap.
  const perLabel = Math.ceil(data.length / 8);
  const labels = data.filter((_, i) => i % perLabel === 0).map((bar, i) => {
    const bars = Math.min(perLabel, data.length - i * perLabel);
    return { text: bar.label, width: (barWidth + BAR_GAP) * bars - BAR_GAP };
  });

  return (
    <View style={styles.chart}>
      {series.length > 1 ? <Legend series={series} /> : null}
      <Text style={[styles.max, { color: theme.textSecondary }]}>
        {max > 0 ? `Max ${formatValue(max)}` : 'No data for this period'}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.plot}>
          <View style={styles.row}>
            {data.map((bar, i) => (
              <View key={`${bar.label}-${i}`} style={[styles.track, { width: barWidth, height: CHART_HEIGHT }]}>
                {bar.values.map((value, s) =>
                  value > 0 ? (
                    <View
                      key={series[s].name}
                      style={{ height: (value / max) * CHART_HEIGHT, backgroundColor: series[s].color }}
                    />
                  ) : null,
                )}
              </View>
            ))}
          </View>
          <View style={styles.row}>
            {labels.map((label, i) => (
              <Text
                key={`${label.text}-${i}`}
                style={[styles.label, { width: label.width, color: theme.textSecondary }]}
                numberOfLines={1}>
                {label.text}
              </Text>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Legend({ series }: { series: Series[] }) {
  const theme = useTheme();

  return (
    <View style={styles.legend}>
      {series.map((item) => (
        <View key={item.name} style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: item.color }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>{item.name}</Text>
        </View>
      ))}
    </View>
  );
}

/** Horizontal bars showing each row's share of the largest, e.g. collections per payment method. */
export function ShareBars({ rows, color }: { rows: { label: string; value: number; detail: string }[]; color: string }) {
  const theme = useTheme();
  const max = Math.max(...rows.map((row) => row.value), 0);

  if (rows.length === 0) {
    return <Text style={[styles.max, { color: theme.textSecondary }]}>No data for this period</Text>;
  }
  return (
    <View style={styles.shares}>
      {rows.map((row) => (
        <View key={row.label} style={styles.share}>
          <View style={styles.shareHeader}>
            <Text style={[styles.shareLabel, { color: theme.text }]} numberOfLines={1}>
              {row.label}
            </Text>
            <Text style={[styles.shareDetail, { color: theme.textSecondary }]}>{row.detail}</Text>
          </View>
          <View style={[styles.shareTrack, { backgroundColor: theme.border }]}>
            <View style={[styles.shareFill, { width: `${max ? (row.value / max) * 100 : 0}%`, backgroundColor: color }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    gap: Spacing.two,
  },
  max: {
    fontSize: 12,
  },
  plot: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: BAR_GAP,
  },
  track: {
    // Stack segments bottom-up.
    flexDirection: 'column-reverse',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    overflow: 'hidden',
  },
  label: {
    fontSize: 10,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  legendText: {
    fontSize: 12,
  },
  shares: {
    gap: Spacing.three,
  },
  share: {
    gap: 6,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  shareLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  shareDetail: {
    fontSize: 13,
  },
  shareTrack: {
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  shareFill: {
    height: 8,
    borderRadius: Radius.full,
  },
});

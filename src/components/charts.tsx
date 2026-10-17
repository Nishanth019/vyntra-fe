import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ChartType = 'bar' | 'line' | 'table';

type Series = { name: string; color: string };

type TrendChartProps = {
  type: ChartType;
  /** One entry per period bucket; `values` has one number per series. */
  data: { label: string; values: number[] }[];
  series: Series[];
  formatValue?: (value: number) => string;
};

const CHART_HEIGHT = 160;
const GRID_LINES = 4;
const MAX_LABELS = 6;

/** A period chart drawn as stacked bars, lines, or a table. */
export function TrendChart({ type, data, series, formatValue = String }: TrendChartProps) {
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const total = data.reduce((sum, bar) => sum + bar.values.reduce((a, b) => a + b, 0), 0);

  return (
    <View style={styles.chart}>
      {series.length > 1 ? <Legend series={series} /> : null}
      {total === 0 ? (
        <Text style={[styles.empty, { color: theme.textSecondary }]}>No data for this period</Text>
      ) : type === 'table' ? (
        <Table data={data} series={series} formatValue={formatValue} />
      ) : (
        <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
          {width > 0 ? (
            <Plot type={type} width={width} data={data} series={series} formatValue={formatValue} />
          ) : null}
        </View>
      )}
    </View>
  );
}

function Plot({ type, width, data, series, formatValue }: Required<TrendChartProps> & { width: number }) {
  const theme = useTheme();
  // Bars stack, so their scale is the largest total; lines use the largest single value.
  const peak = Math.max(
    ...data.map((bar) => (type === 'bar' ? bar.values.reduce((a, b) => a + b, 0) : Math.max(...bar.values))),
  );
  const max = niceMax(peak);
  const step = width / data.length;
  const y = (value: number) => CHART_HEIGHT - (value / max) * CHART_HEIGHT;
  const x = (i: number) => step * i + step / 2;
  const labelEvery = Math.ceil(data.length / MAX_LABELS);

  return (
    <View style={styles.plot}>
      <View style={{ height: CHART_HEIGHT }}>
        {/* Grid lines with their values. */}
        {Array.from({ length: GRID_LINES + 1 }, (_, i) => {
          const value = (max / GRID_LINES) * (GRID_LINES - i);
          return (
            <View key={i} style={[styles.gridLine, { top: (CHART_HEIGHT / GRID_LINES) * i, borderColor: theme.border }]}>
              <Text style={[styles.gridLabel, { color: theme.textSecondary }]}>{value ? formatValue(value) : ''}</Text>
            </View>
          );
        })}

        {type === 'bar' ? (
          <View style={[StyleSheet.absoluteFill, styles.bars]}>
            {data.map((bar, i) => (
              <View key={i} style={[styles.barSlot, { width: step }]}>
                <View style={[styles.bar, { width: Math.min(Math.max(step * 0.6, 4), 36) }]}>
                  {bar.values.map((value, s) =>
                    value > 0 ? (
                      <View
                        key={s}
                        style={{ height: (value / max) * CHART_HEIGHT, backgroundColor: series[s].color }}
                      />
                    ) : null,
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Svg width={width} height={CHART_HEIGHT} style={StyleSheet.absoluteFill}>
            <Line x1={0} y1={CHART_HEIGHT} x2={width} y2={CHART_HEIGHT} stroke={theme.border} strokeWidth={1} />
            {series.map((item, s) => (
              <Polyline
                key={item.name}
                points={data.map((bar, i) => `${x(i)},${y(bar.values[s])}`).join(' ')}
                fill="none"
                stroke={item.color}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
            {data.length <= 31
              ? series.map((item, s) =>
                  data.map((bar, i) => (
                    <Circle key={`${s}-${i}`} cx={x(i)} cy={y(bar.values[s])} r={3} fill={item.color} />
                  )),
                )
              : null}
          </Svg>
        )}
      </View>

      <View style={styles.labels}>
        {data.map((bar, i) => (
          <Text
            key={i}
            numberOfLines={1}
            style={[styles.label, { width: step * labelEvery, left: step * i, color: theme.textSecondary }]}>
            {i % labelEvery === 0 ? bar.label : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

function Table({ data, series, formatValue }: Omit<Required<TrendChartProps>, 'type'>) {
  const theme = useTheme();
  // Empty periods are left out.
  const rows = data.filter((row) => row.values.some(Boolean));
  const totals = series.map((_, s) => data.reduce((sum, row) => sum + row.values[s], 0));

  return (
    <View>
      <View style={[styles.tableRow, { borderColor: theme.border }]}>
        <Text style={[styles.cellLabel, styles.headerCell, { color: theme.textSecondary }]}>Period</Text>
        {series.map((item) => (
          <Text key={item.name} style={[styles.cell, styles.headerCell, { color: item.color }]} numberOfLines={1}>
            {item.name}
          </Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={i} style={[styles.tableRow, { borderColor: theme.border }]}>
          <Text style={[styles.cellLabel, { color: theme.text }]}>{row.label}</Text>
          {row.values.map((value, s) => (
            <Text key={s} style={[styles.cell, { color: value ? theme.text : theme.textSecondary }]}>
              {value ? formatValue(value) : '—'}
            </Text>
          ))}
        </View>
      ))}
      <View style={styles.tableRow}>
        <Text style={[styles.cellLabel, styles.headerCell, { color: theme.text }]}>Total</Text>
        {totals.map((value, s) => (
          <Text key={s} style={[styles.cell, styles.headerCell, { color: theme.text }]}>
            {formatValue(value)}
          </Text>
        ))}
      </View>
    </View>
  );
}

/** Rounds the axis top up to 1/2/5 × 10ⁿ so grid values are readable. */
function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const nice = [1, 2, 2.5, 5, 10].find((factor) => factor * magnitude >= value)!;
  return nice * magnitude;
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
    return <Text style={[styles.empty, { color: theme.textSecondary }]}>No data for this period</Text>;
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
  empty: {
    fontSize: 13,
    paddingVertical: Spacing.four,
    textAlign: 'center',
  },
  plot: {
    gap: 6,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  gridLabel: {
    fontSize: 9,
    marginTop: 1,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  barSlot: {
    alignItems: 'center',
  },
  bar: {
    // Stack segments bottom-up.
    flexDirection: 'column-reverse',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    overflow: 'hidden',
  },
  labels: {
    height: 14,
  },
  label: {
    position: 'absolute',
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
  tableRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cellLabel: {
    flex: 1.3,
    fontSize: 13,
  },
  cell: {
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
  },
  headerCell: {
    fontWeight: '700',
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

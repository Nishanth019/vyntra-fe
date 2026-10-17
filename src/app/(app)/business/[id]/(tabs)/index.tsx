import { router, type Href } from 'expo-router';
import { use, useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { TabHeader, TabsContext } from '@/components/tab-header';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Gradient } from '@/components/ui/gradient';
import { Icon, type IconName } from '@/components/ui/icon';
import { IconBadge, type Tone } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatMoney } from '@/lib/format';
import { type MemberFilterKey } from '@/lib/member-filters';
import { useSession } from '@/lib/session';

type Tile = {
  label: string;
  value: number | string;
  icon: IconName;
  tone: Tone;
  href: Href;
};

function pairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { admin } = useSession();
  const { account } = useBusiness();
  const { setUnread } = use(TabsContext);

  const fetchStats = useCallback(() => api.dashboard(account.id), [account.id]);
  const { data: stats, error, refreshing, refresh, retry } = useResource(fetchStats);
  useEffect(() => {
    if (stats) setUnread(stats.unread_notifications);
  }, [stats, setUnread]);

  const params = { id: account.id };
  const membersHref = (filter: MemberFilterKey): Href => ({
    pathname: '/business/[id]/members',
    params: { ...params, filter },
  });
  const insightsHref: Href = { pathname: '/business/[id]/insights', params };

  if (!stats) {
    return (
      <>
        <TabHeader brand />
        <LoadingState error={error} onRetry={retry} />
      </>
    );
  }

  const { members, collections } = stats;
  const overview: Tile[] = [
    { label: 'Active Members', value: members.live, icon: 'userGroup', tone: 'success', href: membersHref('live') },
    { label: 'Total Members', value: members.all, icon: 'person', tone: 'primary', href: membersHref('all') },
    { label: 'Expired', value: members.expired, icon: 'clock', tone: 'danger', href: membersHref('expired') },
    {
      label: 'Checked In Today',
      value: stats.checked_in_today,
      icon: 'checkCircle',
      tone: 'success',
      href: { pathname: '/business/[id]/attendance', params },
    },
    { label: 'Inactive', value: members.inactive, icon: 'close', tone: 'accent', href: membersHref('inactive') },
    {
      label: 'Membership Plans',
      value: stats.plans,
      icon: 'document',
      tone: 'accent',
      href: { pathname: '/business/[id]/plans', params },
    },
  ];
  const money: Tile[] = [
    { label: 'Today', value: formatMoney(collections.today_collection), icon: 'rupee', tone: 'success', href: insightsHref },
    { label: 'This Month', value: formatMoney(collections.month_collection), icon: 'report', tone: 'primary', href: insightsHref },
    {
      label: 'Outstanding Dues',
      value: formatMoney(collections.outstanding_dues),
      icon: 'card',
      tone: 'danger',
      href: membersHref('dues'),
    },
    { label: 'Dues Pending', value: members.dues, icon: 'pieChart', tone: 'accent', href: membersHref('dues') },
  ];
  const expiring: { label: string; value: number; filter: MemberFilterKey }[] = [
    { label: '0 – 3 days', value: members.expiring3, filter: 'expiring3' },
    { label: '4 – 7 days', value: members.expiring7, filter: 'expiring7' },
    { label: '8 – 15 days', value: members.expiring15, filter: 'expiring15' },
  ];

  return (
    <>
      <TabHeader brand />
      <Screen onRefresh={refresh} refreshing={refreshing} maxWidth={720}>
        <View>
          <Text style={[styles.greeting, { color: theme.text }]}>
            {greeting()}, {admin?.full_name.split(' ')[0]}
          </Text>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        <View style={styles.hero}>
          <Gradient from={theme.primary} to={theme.primaryEnd} />
          <View style={styles.heroArt}>
            <Icon name="dumbbell" color="rgba(255,255,255,0.28)" size={130} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.onPrimary }]}>Build a stronger community</Text>
          <Text style={[styles.heroText, { color: theme.onPrimary }]}>
            Add members, track attendance and grow together.
          </Text>
          <View style={styles.heroActions}>
            <HeroButton
              title="Add Member"
              icon="personAdd"
              solid
              onPress={() => router.push({ pathname: '/business/[id]/members/new', params })}
            />
            <HeroButton
              title="Attendance"
              icon="calendar"
              onPress={() => router.push({ pathname: '/business/[id]/attendance/mark', params })}
            />
          </View>
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        <SectionTitle title="Overview" href={membersHref('all')} />
        <TileGrid tiles={overview} />

        <SectionTitle title="Expiring soon" href={membersHref('expiring3')} />
        <View style={[styles.expiring, { backgroundColor: theme.warningSoft }]}>
          {expiring.map((item, i) => (
            <Pressable
              key={item.filter}
              accessibilityRole="button"
              accessibilityLabel={`Expiring in ${item.label}: ${item.value}`}
              onPress={() => router.navigate(membersHref(item.filter))}
              style={({ pressed }) => [
                styles.expiringItem,
                i > 0 && [styles.expiringDivider, { borderColor: theme.border }],
                pressed && styles.pressed,
              ]}>
              <IconBadge name="calendar" tone="warning" size={40} />
              <View>
                <Text style={[styles.expiringLabel, { color: theme.textSecondary }]} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={[styles.expiringValue, { color: theme.text }]}>{item.value}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <SectionTitle title="Collections" href={insightsHref} />
        <TileGrid tiles={money} />
      </Screen>
    </>
  );
}

function HeroButton({ title, icon, solid = false, onPress }: { title: string; icon: IconName; solid?: boolean; onPress: () => void }) {
  const theme = useTheme();
  const color = solid ? theme.primary : theme.onPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.heroButton,
        { backgroundColor: solid ? theme.onPrimary : 'rgba(255,255,255,0.18)' },
        pressed && styles.pressed,
      ]}>
      <Icon name={icon} color={color} size={20} />
      <Text style={[styles.heroButtonText, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {title}
      </Text>
    </Pressable>
  );
}

function SectionTitle({ title, href }: { title: string; href: Href }) {
  const theme = useTheme();

  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`See all ${title}`}
        hitSlop={8}
        onPress={() => router.navigate(href)}
        style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}>
        <Text style={[styles.seeAllText, { color: theme.primary }]}>See all</Text>
        <Icon name="chevronRight" color={theme.primary} size={16} />
      </Pressable>
    </View>
  );
}

function TileGrid({ tiles }: { tiles: Tile[] }) {
  return (
    <View style={styles.grid}>
      {pairs(tiles).map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((tile) => (
            <StatTile key={tile.label} tile={tile} />
          ))}
        </View>
      ))}
    </View>
  );
}

function StatTile({ tile }: { tile: Tile }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${tile.label}: ${tile.value}`}
      onPress={() => router.navigate(tile.href)}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: theme.surface, borderColor: theme.border },
        shadow(theme.shadow),
        pressed && styles.pressed,
      ]}>
      <View style={styles.tileTop}>
        <IconBadge name={tile.icon} tone={tile.tone} size={42} />
        <Icon name="chevronRight" color={theme.textSecondary} size={16} />
      </View>
      <Text style={[styles.tileLabel, { color: theme.textSecondary }]} numberOfLines={2}>
        {tile.label}
      </Text>
      <Text style={[styles.tileValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
        {tile.value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 15,
    marginTop: 2,
  },
  hero: {
    overflow: 'hidden',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  heroArt: {
    position: 'absolute',
    pointerEvents: 'none',
    right: -10,
    top: -6,
    transform: [{ rotate: '-30deg' }],
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 30,
    maxWidth: 260,
  },
  heroText: {
    fontSize: 15,
    lineHeight: 21,
    opacity: 0.9,
    maxWidth: 260,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
    marginTop: Spacing.three,
  },
  heroButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 48,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
  },
  heroButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    marginBottom: -Spacing.one,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '600',
  },
  grid: {
    gap: Spacing.three - 4,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
  },
  tile: {
    flex: 1,
    gap: Spacing.one,
    padding: Spacing.three - 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  tileValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  expiring: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.three,
  },
  expiringItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
  },
  expiringDivider: {
    borderLeftWidth: 1,
  },
  expiringLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  expiringValue: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
});

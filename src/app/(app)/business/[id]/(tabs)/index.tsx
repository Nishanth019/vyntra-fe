import { router, type Href } from 'expo-router';
import { use, useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { greeting, HeroButton, SectionTitle, TileGrid, type Tile } from '@/components/dashboard-parts';
import { PgHome } from '@/components/pg/pg-home';
import { SubscriptionBanner } from '@/components/subscription-banner';
import { TabHeader, TabsContext } from '@/components/tab-header';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Gradient } from '@/components/ui/gradient';
import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { PageWidth, Radius, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { useWideLayout } from '@/hooks/use-wide-layout';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatMoney } from '@/lib/format';
import { type MemberFilterKey } from '@/lib/member-filters';
import { isPg } from '@/lib/pg';
import { useSession } from '@/lib/session';

export default function DashboardScreen() {
  const { account } = useBusiness();
  return isPg(account) ? <PgHome /> : <GymDashboard />;
}

function GymDashboard() {
  const theme = useTheme();
  const { admin } = useSession();
  const { account } = useBusiness();
  const { setUnread } = use(TabsContext);
  const wide = useWideLayout();

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
      <Screen onRefresh={refresh} refreshing={refreshing} maxWidth={wide ? PageWidth.desktop : PageWidth.phone}>
        <View>
          <Text style={[styles.greeting, { color: theme.text }]}>
            {greeting()}, {admin?.full_name.split(' ')[0]}
          </Text>
          <Text style={[styles.date, { color: theme.textSecondary }]}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>
        </View>

        <SubscriptionBanner />

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
        <TileGrid tiles={overview} columns={wide ? 3 : 2} />

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
        <TileGrid tiles={money} columns={wide ? 4 : 2} />
      </Screen>
    </>
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
  pressed: {
    opacity: 0.7,
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

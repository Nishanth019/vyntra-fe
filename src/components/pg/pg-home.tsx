import { router, type Href } from 'expo-router';
import { use, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { greeting, HeroButton, SectionTitle, TileGrid, type Tile } from '@/components/dashboard-parts';
import { SubscriptionBanner } from '@/components/subscription-banner';
import { TabHeader, TabsContext } from '@/components/tab-header';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Gradient } from '@/components/ui/gradient';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { PageWidth, Radius, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { useWideLayout } from '@/hooks/use-wide-layout';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatMoney } from '@/lib/format';
import { type TenantFilterKey } from '@/components/pg/tenant-filters';
import { useSession } from '@/lib/session';

/** Home of a PG: beds, rent due and money this month. */
export function PgHome() {
  const theme = useTheme();
  const { admin } = useSession();
  const { account } = useBusiness();
  const { setUnread } = use(TabsContext);
  const wide = useWideLayout();

  const fetchStats = useCallback(() => api.pgDashboard(account.id), [account.id]);
  const { data: stats, error, refreshing, refresh, retry } = useResource(fetchStats);
  useEffect(() => {
    if (stats) setUnread(stats.unread_notifications);
  }, [stats, setUnread]);

  const params = { id: account.id };
  const tenantsHref = (filter: TenantFilterKey): Href => ({ pathname: '/business/[id]/members', params: { ...params, filter } });
  const roomsHref: Href = { pathname: '/business/[id]/rooms', params };
  const expensesHref: Href = { pathname: '/business/[id]/expenses', params };

  if (!stats) {
    return (
      <>
        <TabHeader brand />
        <LoadingState error={error} onRetry={retry} />
      </>
    );
  }

  const { beds, tenants, dues, collections } = stats;
  const occupancy = beds.total ? Math.round((100 * beds.occupied) / beds.total) : 0;
  const overview: Tile[] = [
    { label: 'Beds Filled', value: `${beds.occupied}/${beds.total}`, icon: 'bed', tone: 'success', href: roomsHref },
    { label: 'Vacant Beds', value: beds.vacant, icon: 'bed', tone: 'accent', href: roomsHref },
    { label: 'Tenants', value: tenants.living, icon: 'userGroup', tone: 'primary', href: tenantsHref('living') },
    { label: 'Leaving This Week', value: tenants.leaving_this_week, icon: 'logoutDoor', tone: 'warning', href: tenantsHref('notice') },
  ];
  const money: Tile[] = [
    { label: 'Collected Today', value: formatMoney(collections.today_collection), icon: 'rupee', tone: 'success', href: tenantsHref('living') },
    { label: 'This Month', value: formatMoney(collections.month_collection), icon: 'report', tone: 'primary', href: tenantsHref('living') },
    { label: 'Rent Pending', value: formatMoney(dues.total), icon: 'card', tone: 'danger', href: tenantsHref('dues') },
    { label: 'Overdue', value: formatMoney(dues.overdue), icon: 'clock', tone: 'danger', href: tenantsHref('dues') },
    { label: 'Deposits Held', value: formatMoney(stats.deposits_held), icon: 'savings', tone: 'accent', href: tenantsHref('living') },
    { label: 'Expenses This Month', value: formatMoney(stats.month_expenses), icon: 'wallet', tone: 'warning', href: expensesHref },
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
            <Icon name="bed" color="rgba(255,255,255,0.28)" size={130} />
          </View>
          <Text style={[styles.heroTitle, { color: theme.onPrimary }]}>
            {beds.total === 0 ? 'Set up your rooms' : `${occupancy}% beds filled`}
          </Text>
          <Text style={[styles.heroText, { color: theme.onPrimary }]}>
            {beds.total === 0
              ? 'Add rooms and beds, then move your tenants in.'
              : dues.tenants > 0
                ? `${dues.tenants} tenant${dues.tenants === 1 ? '' : 's'} with rent pending.`
                : 'Everyone is paid up. Nice!'}
          </Text>
          <View style={styles.heroActions}>
            {beds.total === 0 ? (
              <HeroButton
                title="Add Room"
                icon="add"
                solid
                onPress={() => router.push({ pathname: '/business/[id]/pg/rooms/new', params })}
              />
            ) : (
              <HeroButton
                title="Add Tenant"
                icon="personAdd"
                solid
                onPress={() => router.push({ pathname: '/business/[id]/pg/tenants/new', params })}
              />
            )}
            <HeroButton title="Rent Due" icon="card" onPress={() => router.navigate(tenantsHref('dues'))} />
          </View>
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        <SectionTitle title="Beds & tenants" href={roomsHref} />
        <TileGrid tiles={overview} columns={wide ? 4 : 2} />

        <SectionTitle title="Money" href={tenantsHref('dues')} />
        <TileGrid tiles={money} columns={wide ? 3 : 2} />
        <View style={[styles.profit, { backgroundColor: Number(stats.month_profit) >= 0 ? theme.successSoft : theme.dangerSoft }]}>
          <Text style={[styles.profitLabel, { color: theme.textSecondary }]}>This month after expenses</Text>
          <Text style={[styles.profitValue, { color: Number(stats.month_profit) >= 0 ? theme.success : theme.danger }]}>
            {formatMoney(stats.month_profit)}
          </Text>
        </View>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
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
    transform: [{ rotate: '-20deg' }],
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
  profit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three + 2,
    borderRadius: Radius.lg,
  },
  profitLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  profitValue: {
    fontSize: 22,
    fontWeight: '800',
  },
});

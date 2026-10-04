import { router, Stack, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SideMenu } from '@/components/side-menu';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/ui/error-banner';
import { HeaderButton } from '@/components/ui/header-button';
import type { IconName } from '@/components/ui/icon';
import { IconBadge, type Tone } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { toISODate } from '@/lib/dates';
import { fetchMemberCounts, type MemberFilterKey } from '@/lib/member-filters';
import { useSession } from '@/lib/session';

type Tile = {
  label: string;
  value: number;
  icon: IconName;
  tone: Tone;
  href?: Href;
};

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
}

export default function DashboardScreen() {
  const theme = useTheme();
  const { admin } = useSession();
  const { account } = useBusiness();
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    const [members, attendance, plans] = await Promise.all([
      fetchMemberCounts(account.id),
      api.attendance({ business_account_id: account.id, attendance_date: toISODate(new Date()) }),
      api.plans(account.id),
    ]);
    return { members, checkedInToday: attendance.count, plans: plans.count };
  }, [account.id]);
  const { data: stats, error, refreshing, refresh, retry } = useResource(fetchStats);

  const params = { id: account.id };
  const membersHref = (filter: MemberFilterKey): Href => ({
    pathname: '/business/[id]/members',
    params: { ...params, filter },
  });

  const header = (
    <Stack.Screen
      options={{
        headerLeft: () => <HeaderButton icon="menu" label="Open menu" onPress={() => setMenuOpen(true)} />,
        headerRight: () => (
          <HeaderButton
            icon="personAdd"
            label="Add member"
            onPress={() => router.push({ pathname: '/business/[id]/members/new', params })}
          />
        ),
      }}
    />
  );

  if (!stats) {
    return (
      <>
        {header}
        <LoadingState error={error} onRetry={retry} />
      </>
    );
  }

  const { members } = stats;
  const tiles: Tile[] = [
    { label: 'Live Memberships', value: members.live, icon: 'people', tone: 'success', href: membersHref('live') },
    { label: 'Total Members', value: members.all, icon: 'people', tone: 'primary', href: membersHref('all') },
    { label: 'Expired Memberships', value: members.expired, icon: 'personOff', tone: 'danger', href: membersHref('expired') },
    { label: 'Expiring (0–3 Days)', value: members.expiring3, icon: 'hourglass', tone: 'warning', href: membersHref('expiring3') },
    { label: 'Expiring (4–7 Days)', value: members.expiring7, icon: 'hourglass', tone: 'accent', href: membersHref('expiring7') },
    { label: 'Expiring (8–15 Days)', value: members.expiring15, icon: 'hourglass', tone: 'primary', href: membersHref('expiring15') },
    {
      label: 'Checked In Today',
      value: stats.checkedInToday,
      icon: 'checkIn',
      tone: 'success',
      href: { pathname: '/business/[id]/attendance', params },
    },
    { label: 'Inactive Members', value: members.inactive, icon: 'personOff', tone: 'neutral', href: membersHref('inactive') },
    {
      label: 'Membership Plans',
      value: stats.plans,
      icon: 'plans',
      tone: 'accent',
      href: { pathname: '/business/[id]/plans', params },
    },
  ];
  const rows = [tiles.slice(0, 3), tiles.slice(3, 6), tiles.slice(6, 9)];

  return (
    <>
      {header}
      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />

      <Screen onRefresh={refresh} refreshing={refreshing} maxWidth={720}>
        <View style={[styles.hero, { backgroundColor: theme.primary }]}>
          <Text style={[styles.heroGreeting, { color: theme.onPrimary }]}>
            {greeting()}, {admin?.full_name.split(' ')[0]}
          </Text>
          <Text style={[styles.heroDate, { color: theme.onPrimary }]}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          <View style={styles.heroActions}>
            <Button
              title="Add Member"
              icon="personAdd"
              variant="secondary"
              style={styles.heroButton}
              onPress={() => router.push({ pathname: '/business/[id]/members/new', params })}
            />
            <Button
              title="Attendance"
              icon="checkIn"
              variant="secondary"
              style={styles.heroButton}
              onPress={() => router.push({ pathname: '/business/[id]/attendance/mark', params })}
            />
          </View>
        </View>

        {error ? <ErrorBanner message={error} /> : null}

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Overview</Text>
        <View style={styles.grid}>
          {rows.map((row, i) => (
            <View key={i} style={styles.row}>
              {row.map((tile) => (
                <StatTile key={tile.label} tile={tile} />
              ))}
            </View>
          ))}
        </View>
      </Screen>
    </>
  );
}

function StatTile({ tile }: { tile: Tile }) {
  const theme = useTheme();
  const { href } = tile;

  return (
    <Pressable
      accessibilityRole={href ? 'button' : undefined}
      accessibilityLabel={`${tile.label}: ${tile.value}`}
      disabled={!href}
      onPress={() => href && router.push(href)}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.tileTop}>
        <IconBadge name={tile.icon} tone={tile.tone} size={38} />
        <Text style={[styles.tileValue, { color: theme.text }]} numberOfLines={1} adjustsFontSizeToFit>
          {tile.value}
        </Text>
      </View>
      <View style={[styles.tileDivider, { backgroundColor: theme.border }]} />
      <Text style={[styles.tileLabel, { color: theme.text }]} numberOfLines={2}>
        {tile.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: Radius.lg + 4,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  heroGreeting: {
    fontSize: 22,
    fontWeight: '700',
  },
  heroDate: {
    fontSize: 15,
    opacity: 0.85,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.three,
  },
  heroButton: {
    flex: 1,
    height: 46,
    paddingHorizontal: Spacing.two,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: -Spacing.two,
  },
  grid: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  tile: {
    flex: 1,
    minHeight: 132,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.three - 4,
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  tileTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.one,
  },
  tileValue: {
    flexShrink: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  tileDivider: {
    height: StyleSheet.hairlineWidth,
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
});

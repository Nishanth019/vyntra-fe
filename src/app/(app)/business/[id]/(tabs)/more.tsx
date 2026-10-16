import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { IconBadge, type Tone } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBusiness } from '@/lib/business';
import { initials } from '@/lib/format';
import { PRIVACY_POLICY_URL } from '@/lib/links';
import { useSession } from '@/lib/session';

export default function MoreScreen() {
  const theme = useTheme();
  const { admin, signOut } = useSession();
  const { account } = useBusiness();
  const params = { id: account.id };
  const go = (href: Href) => router.push(href);

  return (
    <Screen maxWidth={720}>
      <Pressable
        accessibilityRole="button"
        onPress={() => go('/profile')}
        style={({ pressed }) => [styles.profile, { backgroundColor: theme.primary }, pressed && styles.pressed]}>
        <View style={[styles.avatar, { backgroundColor: theme.onPrimary }]}>
          <Text style={[styles.avatarText, { color: theme.primary }]}>{initials(admin?.full_name ?? '')}</Text>
        </View>
        <View style={styles.profileText}>
          <Text style={[styles.name, { color: theme.onPrimary }]} numberOfLines={1}>
            {admin?.full_name}
          </Text>
          <Text style={[styles.email, { color: theme.onPrimary }]} numberOfLines={1}>
            {account.name} · ID {account.id}
          </Text>
        </View>
        <Icon name="chevronRight" color={theme.onPrimary} size={18} />
      </Pressable>

      <Section title="Manage">
        <MenuRow
          icon="store"
          title="Organisation Settings"
          subtitle={account.name}
          onPress={() => go({ pathname: '/business/[id]/settings', params })}
        />
        <MenuRow
          icon="swap"
          title="Switch Business"
          subtitle="Open another organisation"
          onPress={() => router.dismissTo('/')}
        />
      </Section>

      <Section title="Operations">
        <MenuRow
          icon="checkIn"
          title="Attendance"
          subtitle="Track member attendance"
          onPress={() => go({ pathname: '/business/[id]/attendance', params })}
        />
        <MenuRow
          icon="report"
          title="Attendance Report"
          subtitle="A member's visit history"
          onPress={() => go({ pathname: '/business/[id]/attendance/report', params })}
        />
        <MenuRow
          icon="plans"
          title="Membership Plans"
          subtitle="Prices and durations"
          onPress={() => go({ pathname: '/business/[id]/plans', params })}
        />
        <MenuRow
          icon="staff"
          title="Manage Staff"
          subtitle="Trainers, front desk & more"
          onPress={() => go({ pathname: '/business/[id]/staff', params })}
        />
        <MenuRow
          icon="admin"
          title="Manage Users"
          subtitle="Who can log in to this business"
          onPress={() => go({ pathname: '/business/[id]/admins', params })}
        />
      </Section>

      <Section title="Notifications">
        <MenuRow
          icon="bell"
          title="Notifications"
          subtitle="Reminders, summaries & alerts"
          onPress={() => go({ pathname: '/business/[id]/notifications', params })}
        />
        <MenuRow
          icon="settings"
          title="Notification Settings"
          subtitle="Choose what you're told about"
          onPress={() => go({ pathname: '/business/[id]/notification-settings', params })}
        />
      </Section>

      <Section title="App">
        <MenuRow icon="person" title="My Profile" subtitle="Details, password & account" onPress={() => go('/profile')} />
        <MenuRow icon="help" title="Need Help?" subtitle="FAQs" onPress={() => go('/help')} />
        <MenuRow icon="support" title="Contact Us" subtitle="Report your query or issue" onPress={() => go('/contact')} />
        <MenuRow
          icon="shield"
          title="Privacy Policy"
          subtitle="How your data is handled"
          onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
        />
        <MenuRow icon="palette" title="Theme" subtitle="Your app mode" onPress={() => go('/appearance')} />
        <MenuRow icon="logout" title="Logout" subtitle="Sign out safely" tone="danger" onPress={signOut} />
      </Section>

      <Text style={[styles.footer, { color: theme.textSecondary }]}>Vyntra · v{Constants.expoConfig?.version}</Text>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionBody, { backgroundColor: theme.surface, borderColor: theme.border }]}>{children}</View>
    </View>
  );
}

type MenuRowProps = {
  icon: IconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  tone?: Tone;
};

function MenuRow({ icon, title, subtitle, onPress, tone = 'primary' }: MenuRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: theme.primarySoft }]}>
      <IconBadge name={icon} tone={tone} size={40} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: tone === 'danger' ? theme.danger : theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Icon name="chevronRight" color={theme.textSecondary} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  pressed: {
    opacity: 0.8,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 19,
    fontWeight: '700',
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
  },
  email: {
    fontSize: 14,
    opacity: 0.85,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: Spacing.one,
  },
  sectionBody: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 13,
  },
  footer: {
    textAlign: 'center',
    fontSize: 13,
  },
});

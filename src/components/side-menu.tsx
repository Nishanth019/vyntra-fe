import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, type ReactNode } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/icon';
import { IconBadge, type Tone } from '@/components/ui/icon-badge';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBusiness } from '@/lib/business';
import { initials } from '@/lib/format';
import { PRIVACY_POLICY_URL } from '@/lib/links';
import { useSession } from '@/lib/session';

type SideMenuProps = {
  visible: boolean;
  onClose: () => void;
};

export function SideMenu({ visible, onClose }: SideMenuProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { admin, signOut } = useSession();
  const { account } = useBusiness();
  const params = { id: account.id };

  // Android back closes the menu.
  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);

  function go(href: Href) {
    onClose();
    router.push(href);
  }

  /** Switches to one of the bottom tabs. */
  function tab(href: Href) {
    onClose();
    router.navigate(href);
  }

  return (
    // Drawn over the whole screen (tab bar and system bars included) rather than in a Modal,
    // which on some Android phones stops short of the navigation bar.
    visible ? (
      <Animated.View entering={FadeIn.duration(150)} style={styles.overlay}>
        <Animated.View
          entering={SlideInLeft.duration(220)}
          style={[styles.panel, { backgroundColor: theme.background }]}>
          <View style={[styles.profile, { backgroundColor: theme.primary, paddingTop: insets.top + Spacing.four }]}>
            <View style={[styles.avatar, { backgroundColor: theme.onPrimary }]}>
              <Text style={[styles.avatarText, { color: theme.primary }]}>{initials(admin?.full_name ?? '')}</Text>
            </View>
            <View style={styles.profileText}>
              <Text style={[styles.name, { color: theme.onPrimary }]} numberOfLines={1}>
                {admin?.full_name}
              </Text>
              <Text style={[styles.email, { color: theme.onPrimary }]} numberOfLines={1}>
                {admin?.email}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => go('/profile')}
                style={({ pressed }) => [styles.viewProfile, pressed && styles.pressed]}>
                <Text style={[styles.viewProfileText, { color: theme.onPrimary }]}>View Profile</Text>
                <Icon name="chevronRight" color={theme.onPrimary} size={14} />
              </Pressable>
            </View>
          </View>

          <View style={[styles.businessStrip, { backgroundColor: theme.primarySoft }]}>
            <Text style={[styles.businessStripText, { color: theme.primary }]} numberOfLines={1}>
              {account.name} · ID {account.id}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.items}>
            <Section title="Manage">
              <MenuRow
                icon="store"
                title={account.name}
                subtitle="Organisation settings"
                onPress={() => go({ pathname: '/business/[id]/settings', params })}
              />
              <MenuRow
                icon="swap"
                title="Switch Business"
                subtitle="Open another organisation"
                onPress={() => {
                  onClose();
                  router.replace({ pathname: '/', params: { switch: '1' } });
                }}
              />
            </Section>

            <Section title="Operations">
              <MenuRow
                icon="dashboard"
                title="Dashboard"
                subtitle="Today at a glance"
                onPress={() => tab({ pathname: '/business/[id]', params })}
              />
              <MenuRow
                icon="plans"
                title="Membership Plans"
                subtitle="Prices and durations"
                onPress={() => go({ pathname: '/business/[id]/plans', params })}
              />
              <MenuRow
                icon="people"
                title="Add / Manage Members"
                subtitle="Add, edit & track members"
                onPress={() => tab({ pathname: '/business/[id]/members', params })}
              />
              <MenuRow
                icon="report"
                title="Insights"
                subtitle="Graphs & reports"
                onPress={() => tab({ pathname: '/business/[id]/insights', params })}
              />
              <MenuRow
                icon="checkIn"
                title="Attendance"
                subtitle="Track member attendance"
                onPress={() => go({ pathname: '/business/[id]/attendance', params })}
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

            <Section title="Reports">
              <MenuRow
                icon="report"
                title="Attendance Report"
                subtitle="A member's visit history"
                onPress={() => go({ pathname: '/business/[id]/attendance/report', params })}
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

            <Section title="More">
              <MenuRow icon="person" title="My Profile" subtitle="Details & password" onPress={() => go('/profile')} />
              <MenuRow icon="help" title="Need Help?" subtitle="FAQs" onPress={() => go('/help')} />
              <MenuRow icon="support" title="Contact Us" subtitle="Report your query or issue" onPress={() => go('/contact')} />
              <MenuRow
                icon="shield"
                title="Privacy Policy"
                subtitle="How your data is handled"
                onPress={() => {
                  onClose();
                  WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL);
                }}
              />
              <MenuRow icon="palette" title="Theme" subtitle="Your app mode" onPress={() => go('/appearance')} />
              <MenuRow icon="logout" title="Logout" subtitle="Sign out safely" tone="danger" onPress={signOut} />
            </Section>
          </ScrollView>

          <Text
            style={[
              styles.footer,
              { color: theme.textSecondary, borderColor: theme.border, paddingBottom: insets.bottom + Spacing.three },
            ]}>
            Vyntra · v{Constants.expoConfig?.version}
          </Text>
        </Animated.View>

        <Pressable accessibilityLabel="Close menu" style={styles.backdrop} onPress={onClose} />
      </Animated.View>
    ) : null
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title}</Text>
      {children}
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
      <IconBadge name={icon} tone={tone} />
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
  overlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    elevation: 100,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  panel: {
    width: '82%',
    maxWidth: 340,
  },
  backdrop: {
    flex: 1,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.four,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  profileText: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 2,
  },
  name: {
    fontSize: 19,
    fontWeight: '700',
  },
  email: {
    fontSize: 14,
    opacity: 0.85,
  },
  viewProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  viewProfileText: {
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
  businessStrip: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 4,
  },
  businessStripText: {
    fontSize: 15,
    fontWeight: '700',
  },
  items: {
    paddingVertical: Spacing.two,
  },
  section: {
    paddingTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
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
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});

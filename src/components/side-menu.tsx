import Constants from 'expo-constants';
import { router, usePathname, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Dimensions, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Gradient } from '@/components/ui/gradient';
import { Icon, type IconName } from '@/components/ui/icon';
import { IconBadge, type Tone } from '@/components/ui/icon-badge';
import { OrganisationSwitcher } from '@/components/organisation-switcher';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { SubscriptionInfo } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { initials } from '@/lib/format';
import { PRIVACY_POLICY_URL } from '@/lib/links';
import { useSession } from '@/lib/session';
import { useSubscription } from '@/lib/subscription';

const PANEL_WIDTH = Math.min(340, Dimensions.get('window').width * 0.84);

type SideMenuProps = {
  visible: boolean;
  onClose: () => void;
};

export function SideMenu({ visible, onClose }: SideMenuProps) {
  const theme = useTheme();

  // Slides in from the left each time it opens.
  const [slide] = useState(() => new Animated.Value(-PANEL_WIDTH));
  useEffect(() => {
    if (!visible) return;
    slide.setValue(-PANEL_WIDTH);
    Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [visible, slide]);
  // On Android the whole physical screen, navigation bar included (the window height stops above it).
  const height = Dimensions.get(Platform.OS === 'android' ? 'screen' : 'window').height;

  return (
    // Translucent system bars let the menu run from the very top to the very bottom of the screen.
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <View style={[styles.overlay, { height }]}>
        <Animated.View
          style={[styles.panel, { height, backgroundColor: theme.background, transform: [{ translateX: slide }] }]}>
          <MenuPanel onClose={onClose} />
        </Animated.View>
        <Pressable accessibilityLabel="Close menu" style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
}

/** The menu always shown on the left of wide (desktop) screens instead of the slide-out one. */
export function Sidebar() {
  const theme = useTheme();

  return (
    <View style={[styles.sidebar, { backgroundColor: theme.background, borderColor: theme.border }]}>
      <MenuPanel />
    </View>
  );
}

/** Profile, business and every menu item; `onClose` hides the slide-out menu after a tap. */
function MenuPanel({ onClose = () => {} }: { onClose?: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { admin, signOut } = useSession();
  const { account } = useBusiness();
  const { subscription } = useSubscription();
  const [switching, setSwitching] = useState(false);
  const params = { id: account.id };
  /** Whether the open screen is this item's, e.g. "/plans" under the business. */
  const at = (path: string) => pathname === `/business/${account.id}${path}`;

  function close() {
    setSwitching(false);
    onClose();
  }

  function go(href: Href) {
    close();
    router.push(href);
  }

  /** Switches to one of the bottom tabs. */
  function tab(href: Href) {
    close();
    router.navigate(href);
  }

  return (
    <>
    <View style={[styles.profile, { paddingTop: insets.top + Spacing.four }]}>
      <Gradient from={theme.primary} to={theme.primaryEnd} />
      <View style={[styles.avatar, { backgroundColor: theme.onPrimary }]}>
        <Text style={[styles.avatarText, { color: theme.primary }]}>{initials(admin?.full_name ?? '')}</Text>
      </View>
      <View style={styles.profileText}>
        <Text style={[styles.name, { color: theme.onPrimary }]} numberOfLines={2}>
          {admin?.full_name}
        </Text>
        <Text style={[styles.email, { color: theme.onPrimary }]} numberOfLines={2}>
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

    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Switch organisation"
      accessibilityState={{ expanded: switching }}
      onPress={() => setSwitching((open) => !open)}
      style={({ pressed }) => [
        styles.businessStrip,
        { backgroundColor: theme.primarySoft },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.businessStripText, { color: theme.primary }]} numberOfLines={2}>
        {account.name} · ID {account.id}
      </Text>
      <Icon name={switching ? 'chevronUp' : 'chevronDown'} color={theme.primary} size={20} />
    </Pressable>

    <ScrollView style={styles.flex} contentContainerStyle={styles.items}>
      <Section title="Manage">
        <MenuRow
          icon="store"
          title={account.name}
          subtitle="Organisation settings"
          active={at('/settings')}
                onPress={() => go({ pathname: '/business/[id]/settings', params })}
        />
        <MenuRow
          icon="swap"
          title="Switch Business"
          subtitle="Open or add an organisation"
          trailing={switching ? 'chevronUp' : 'chevronDown'}
          onPress={() => setSwitching((open) => !open)}
        />
        {switching ? <OrganisationSwitcher current={account} onDone={close} /> : null}
      </Section>

      <Section title="Operations">
        <MenuRow
          icon="dashboard"
          title="Dashboard"
          subtitle="Today at a glance"
          active={at('')}
                onPress={() => tab({ pathname: '/business/[id]', params })}
        />
        <MenuRow
          icon="plans"
          title="Membership Plans"
          subtitle="Prices and durations"
          active={at('/plans')}
                onPress={() => go({ pathname: '/business/[id]/plans', params })}
        />
        <MenuRow
          icon="people"
          title="Add / Manage Members"
          subtitle="Add, edit & track members"
          active={at('/members')}
                onPress={() => tab({ pathname: '/business/[id]/members', params })}
        />
        <MenuRow
          icon="report"
          title="Insights"
          subtitle="Graphs & reports"
          active={at('/insights')}
                onPress={() => tab({ pathname: '/business/[id]/insights', params })}
        />
        <MenuRow
          icon="checkIn"
          title="Attendance"
          subtitle="Track member attendance"
          active={at('/attendance')}
                onPress={() => go({ pathname: '/business/[id]/attendance', params })}
        />
        <MenuRow
          icon="staff"
          title="Manage Staff"
          subtitle="Trainers, front desk & more"
          active={at('/staff')}
                onPress={() => go({ pathname: '/business/[id]/staff', params })}
        />
        {/* Only the owner sees and manages who can log in. */}
        {account.access?.is_owner ? (
          <MenuRow
            icon="admin"
            title="Manage Admins"
            subtitle="Who can log in to this business"
            active={at('/admins')}
            onPress={() => go({ pathname: '/business/[id]/admins', params })}
          />
        ) : null}
      </Section>

      <Section title="Reports">
        <MenuRow
          icon="report"
          title="Attendance Report"
          subtitle="A member's visit history"
          active={at('/attendance/report')}
                onPress={() => go({ pathname: '/business/[id]/attendance/report', params })}
        />
      </Section>

      <Section title="Notifications">
        <MenuRow
          icon="bell"
          title="Notifications"
          subtitle="Reminders, summaries & alerts"
          active={at('/notifications')}
                onPress={() => go({ pathname: '/business/[id]/notifications', params })}
        />
        <MenuRow
          icon="settings"
          title="Notification Settings"
          subtitle="Choose what you're told about"
          active={at('/notification-settings')}
                onPress={() => go({ pathname: '/business/[id]/notification-settings', params })}
        />
      </Section>

      <Section title="More">
        <MenuRow icon="person" title="My Profile" subtitle="Details & password" onPress={() => go('/profile')} />
        <MenuRow
          icon="crown"
          title="Subscription"
          subtitle={subscriptionLabel(subscription)}
          active={pathname === '/subscription'}
          onPress={() => go('/subscription')}
        />
        <MenuRow icon="help" title="Need Help?" subtitle="FAQs" onPress={() => go('/help')} />
        <MenuRow icon="support" title="Contact Us" subtitle="Report your query or issue" onPress={() => go('/contact')} />
        <MenuRow
          icon="shield"
          title="Privacy Policy"
          subtitle="How your data is handled"
          onPress={() => {
            close();
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
    </>
  );
}

function subscriptionLabel(subscription: SubscriptionInfo | null) {
  if (!subscription) return 'Your plan';
  switch (subscription.state) {
    case 'TRIAL':
      return `Free trial · ${subscription.days_left} day${subscription.days_left === 1 ? '' : 's'} left`;
    case 'EXPIRED':
      return 'Ended · Renew to keep editing';
    case 'GRACE':
      return 'Payment pending';
    default:
      return `${subscription.plan?.name ?? 'Paid'} plan`;
  }
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
  /** Highlights the item of the screen that's open. */
  active?: boolean;
  /** The icon on the right; a chevron by default. */
  trailing?: IconName;
};

function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  tone = 'primary',
  active = false,
  trailing = 'chevronRight',
}: MenuRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, (pressed || active) && { backgroundColor: theme.primarySoft }]}>
      <IconBadge name={icon} tone={tone} />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: tone === 'danger' ? theme.danger : theme.text }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.rowSubtitle, { color: theme.textSecondary }]} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Icon name={trailing} color={theme.textSecondary} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sidebar: {
    width: 300,
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  panel: {
    width: PANEL_WIDTH,
    borderTopRightRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    overflow: 'hidden',
  },
  backdrop: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  profile: {
    overflow: 'hidden',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two + 4,
  },
  businessStripText: {
    flex: 1,
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

import { router } from 'expo-router';
import { createContext, use, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NotificationBell } from '@/components/notification-bell';
import { HeaderButton } from '@/components/ui/header-button';
import { Icon } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBusiness } from '@/lib/business';

type TabsContextValue = {
  openMenu: () => void;
  /** Unread notifications, refreshed by the tabs that load the dashboard. */
  unread: number;
  setUnread: (count: number) => void;
};

export const TabsContext = createContext<TabsContextValue>({ openMenu: () => {}, unread: 0, setUnread: () => {} });

type TabHeaderProps = {
  /** Home shows the business name large in the brand color instead of a page title. */
  brand?: boolean;
  title?: string;
  subtitle?: string;
  /** Shown to the right of the title, e.g. an add button or a period picker. */
  action?: ReactNode;
};

/** Top of a bottom-tab screen: the menu button, the business and the bell, then the page title. */
export function TabHeader({ brand = false, title, subtitle, action }: TabHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { account } = useBusiness();
  const { openMenu, unread } = use(TabsContext);
  const tagline = [account.business_type.name, account.city].filter(Boolean).join(' · ');

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.three }]}>
      <View style={styles.topRow}>
        <HeaderButton icon="menu" label="Open menu" onPress={openMenu} />
        {brand ? (
          <View style={styles.flex}>
            <Text style={[styles.brand, { color: theme.primary }]} numberOfLines={2}>
              {account.name}
            </Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]} numberOfLines={2}>
              {tagline}
            </Text>
          </View>
        ) : (
          <View style={[styles.flex, styles.business]}>
            <View style={[styles.logo, { backgroundColor: theme.primarySoft }]}>
              <Icon name="dumbbell" color={theme.primary} size={24} />
            </View>
            <View style={styles.flex}>
              <Text style={[styles.businessName, { color: theme.text }]} numberOfLines={2}>
                {account.name}
              </Text>
              <Text style={[styles.tagline, { color: theme.textSecondary }]} numberOfLines={2}>
                {tagline}
              </Text>
            </View>
          </View>
        )}
        <NotificationBell
          unread={unread}
          onPress={() => router.push({ pathname: '/business/[id]/notifications', params: { id: account.id } })}
        />
      </View>

      {title ? (
        <View style={styles.titleRow}>
          <View style={styles.flex}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text> : null}
          </View>
          {action}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.three + 4,
    paddingBottom: Spacing.two,
    gap: Spacing.three + 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
  },
  flex: {
    flex: 1,
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  business: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  businessName: {
    fontSize: 17,
    fontWeight: '700',
  },
  tagline: {
    fontSize: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 2,
  },
});

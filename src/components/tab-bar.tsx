import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0] & {
  tabs: { name: string; title: string; icon: IconName }[];
};

/** Floating white bar; the active tab is a solid brand pill. */
export function TabBar({ state, navigation, insets, tabs }: TabBarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, Spacing.three), backgroundColor: theme.background }]}>
      <View style={[styles.bar, { backgroundColor: theme.surface, borderColor: theme.border }, shadow(theme.shadow, 2)]}>
        {state.routes.map((route, index) => {
          const tab = tabs.find((item) => item.name === route.name);
          if (!tab) return null;
          const focused = state.index === index;
          const color = focused ? theme.onPrimary : theme.textSecondary;

          function onPress() {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.title}
              onPress={onPress}
              style={[styles.tab, focused && [{ backgroundColor: theme.primary }, shadow(theme.primary, 2)]]}>
              <Icon name={tab.icon} color={color} size={24} />
              <Text style={[styles.label, { color }]}>{tab.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 480,
    padding: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.xl + 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.two,
    borderRadius: Radius.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});

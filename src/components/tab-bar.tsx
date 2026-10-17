import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0] & {
  tabs: { name: string; title: string; icon: IconName }[];
};

/** Floating dark bar: icons only, the active tab is a light pill with its label. */
export function TabBar({ state, navigation, insets, tabs }: TabBarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, Spacing.three), backgroundColor: theme.background }]}>
      <View style={[styles.bar, { backgroundColor: theme.text }]}>
        {state.routes.map((route, index) => {
          const tab = tabs.find((item) => item.name === route.name);
          if (!tab) return null;
          const focused = state.index === index;

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
              style={[styles.tab, focused && { backgroundColor: theme.background }]}>
              <Icon name={tab.icon} color={focused ? theme.text : theme.textSecondary} size={22} />
              {focused ? <Text style={[styles.label, { color: theme.text }]}>{tab.title}</Text> : null}
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
    justifyContent: 'space-around',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 480,
    padding: Spacing.two,
    borderRadius: Radius.full,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three + 4,
    paddingVertical: Spacing.two + 4,
    borderRadius: Radius.full,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
});

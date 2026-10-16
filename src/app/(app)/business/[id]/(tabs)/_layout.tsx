import { Tabs } from 'expo-router';

import { Icon, type IconName } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { useBusiness } from '@/lib/business';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'dashboard' },
  { name: 'members', title: 'Members', icon: 'people' },
  { name: 'insights', title: 'Insights', icon: 'report' },
  { name: 'more', title: 'More', icon: 'menu' },
];

/** Bottom tabs of a business: Home, Members, Insights and More. */
export default function BusinessTabsLayout() {
  const theme = useTheme();
  const { account } = useBusiness();

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.primary },
        headerTintColor: theme.onPrimary,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        headerRightContainerStyle: { paddingRight: 16 },
        sceneStyle: { backgroundColor: theme.background },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
      }}>
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            headerTitle: tab.name === 'index' ? account.name : tab.title,
            tabBarIcon: ({ color }) => <Icon name={tab.icon} color={String(color)} size={24} />,
          }}
        />
      ))}
    </Tabs>
  );
}

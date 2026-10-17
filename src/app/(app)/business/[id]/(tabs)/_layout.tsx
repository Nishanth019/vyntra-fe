import { Tabs } from 'expo-router';
import { useCallback, useState } from 'react';

import { SideMenu } from '@/components/side-menu';
import { TabBar } from '@/components/tab-bar';
import { HeaderButton } from '@/components/ui/header-button';
import { type IconName } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { useBusiness } from '@/lib/business';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'dashboard' },
  { name: 'members', title: 'Members', icon: 'people' },
  { name: 'insights', title: 'Insights', icon: 'report' },
];

/** Bottom tabs of a business (Home, Members, Insights) with the side menu on every tab. */
export default function BusinessTabsLayout() {
  const theme = useTheme();
  const { account } = useBusiness();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  return (
    <>
      <Tabs
        tabBar={(props) => <TabBar {...props} tabs={TABS} />}
        screenOptions={{
          headerStyle: { backgroundColor: theme.primary },
          headerTintColor: theme.onPrimary,
          headerTitleStyle: { fontWeight: '600' },
          headerShadowVisible: false,
          headerLeftContainerStyle: { paddingLeft: 16 },
          headerRightContainerStyle: { paddingRight: 16 },
          headerLeft: () => <HeaderButton icon="menu" label="Open menu" onPress={() => setMenuOpen(true)} />,
          sceneStyle: { backgroundColor: theme.background },
        }}>
        {TABS.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{ title: tab.title, headerTitle: tab.name === 'index' ? account.name : tab.title }}
          />
        ))}
      </Tabs>
      <SideMenu visible={menuOpen} onClose={closeMenu} />
    </>
  );
}

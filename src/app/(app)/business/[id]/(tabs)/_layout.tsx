import { Tabs } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { SideMenu } from '@/components/side-menu';
import { TabBar } from '@/components/tab-bar';
import { TabsContext } from '@/components/tab-header';
import { type IconName } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { useWideLayout } from '@/hooks/use-wide-layout';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'members', title: 'Members', icon: 'people' },
  { name: 'insights', title: 'Insights', icon: 'report' },
];

/** Bottom tabs of a business (Home, Members, Insights); each draws its own header with the menu button. */
export default function BusinessTabsLayout() {
  const theme = useTheme();
  const wide = useWideLayout();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const tabs = useMemo(() => ({ openMenu: () => setMenuOpen(true), unread, setUnread }), [unread]);

  return (
    <TabsContext value={tabs}>
      <Tabs
        // On desktop the sidebar has these links, so there's no bottom bar.
        tabBar={(props) => (wide ? null : <TabBar {...props} tabs={TABS} />)}
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: theme.background } }}>
        {TABS.map((tab) => (
          <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.title }} />
        ))}
      </Tabs>
      <SideMenu visible={menuOpen} onClose={closeMenu} />
    </TabsContext>
  );
}

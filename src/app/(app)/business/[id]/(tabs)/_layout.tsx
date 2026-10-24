import { Tabs } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { SideMenu } from '@/components/side-menu';
import { TabBar } from '@/components/tab-bar';
import { TabsContext } from '@/components/tab-header';
import { type IconName } from '@/components/ui/icon';
import { useTheme } from '@/hooks/use-theme';
import { useWideLayout } from '@/hooks/use-wide-layout';
import { useBusiness } from '@/lib/business';
import { isPg } from '@/lib/pg';

const GYM_TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'members', title: 'Members', icon: 'people' },
  { name: 'insights', title: 'Insights', icon: 'report' },
];

// A PG's Members tab lists its tenants.
const PG_TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'members', title: 'Tenants', icon: 'people' },
  { name: 'rooms', title: 'Rooms', icon: 'bed' },
];

/** Bottom tabs of a business (gym: Home, Members, Insights · PG: Home, Tenants, Rooms). */
export default function BusinessTabsLayout() {
  const theme = useTheme();
  const wide = useWideLayout();
  const { account } = useBusiness();
  const TABS = isPg(account) ? PG_TABS : GYM_TABS;
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
        {[...GYM_TABS, PG_TABS[2]].map((tab) => (
          <Tabs.Screen key={tab.name} name={tab.name} options={{ title: TABS.find((t) => t.name === tab.name)?.title ?? tab.title }} />
        ))}
      </Tabs>
      <SideMenu visible={menuOpen} onClose={closeMenu} />
    </TabsContext>
  );
}

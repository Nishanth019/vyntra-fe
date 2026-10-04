import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

type SymbolName = Extract<ComponentProps<typeof SymbolView>['name'], object>;

// SF Symbols on iOS, Material Symbols on Android and web.
const ICONS = {
  add: { ios: 'plus', android: 'add', web: 'add' },
  admin: { ios: 'person.badge.key', android: 'admin_panel_settings', web: 'admin_panel_settings' },
  badge: { ios: 'person.text.rectangle', android: 'badge', web: 'badge' },
  block: { ios: 'nosign', android: 'block', web: 'block' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  chat: { ios: 'message', android: 'chat', web: 'chat' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  checkIn: { ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  dashboard: { ios: 'square.grid.2x2', android: 'dashboard', web: 'dashboard' },
  document: { ios: 'doc.text', android: 'description', web: 'description' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  globe: { ios: 'globe', android: 'language', web: 'language' },
  help: { ios: 'questionmark.circle', android: 'help', web: 'help' },
  hourglass: { ios: 'hourglass', android: 'hourglass_bottom', web: 'hourglass_bottom' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  location: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  lock: { ios: 'lock', android: 'lock', web: 'lock' },
  login: { ios: 'arrow.right.square', android: 'login', web: 'login' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  mail: { ios: 'envelope', android: 'mail', web: 'mail' },
  map: { ios: 'map', android: 'map', web: 'map' },
  menu: { ios: 'line.3.horizontal', android: 'menu', web: 'menu' },
  money: { ios: 'banknote', android: 'payments', web: 'payments' },
  moon: { ios: 'moon', android: 'dark_mode', web: 'dark_mode' },
  palette: { ios: 'paintpalette', android: 'palette', web: 'palette' },
  people: { ios: 'person.2', android: 'group', web: 'group' },
  person: { ios: 'person', android: 'person', web: 'person' },
  personAdd: { ios: 'person.badge.plus', android: 'person_add', web: 'person_add' },
  personOff: { ios: 'person.slash', android: 'person_off', web: 'person_off' },
  phone: { ios: 'phone', android: 'call', web: 'call' },
  plans: { ios: 'list.bullet.rectangle', android: 'receipt_long', web: 'receipt_long' },
  report: { ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  shield: { ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' },
  staff: { ios: 'person.crop.rectangle', android: 'badge', web: 'badge' },
  store: { ios: 'storefront', android: 'storefront', web: 'storefront' },
  sun: { ios: 'sun.max', android: 'light_mode', web: 'light_mode' },
  support: { ios: 'bubble.left.and.bubble.right', android: 'support_agent', web: 'support_agent' },
  swap: { ios: 'arrow.left.arrow.right', android: 'swap_horiz', web: 'swap_horiz' },
  system: { ios: 'iphone', android: 'smartphone', web: 'smartphone' },
  verified: { ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
} satisfies Record<string, SymbolName>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  color: string;
  size?: number;
};

export function Icon({ name, color, size = 22 }: IconProps) {
  return <SymbolView name={ICONS[name]} tintColor={color} size={size} />;
}

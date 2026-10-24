import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

type SymbolName = Extract<ComponentProps<typeof SymbolView>['name'], object>;

// SF Symbols on iOS, Material Symbols on Android and web.
const ICONS = {
  add: { ios: 'plus', android: 'add', web: 'add' },
  admin: { ios: 'person.badge.key', android: 'admin_panel_settings', web: 'admin_panel_settings' },
  arrowRight: { ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' },
  badge: { ios: 'person.text.rectangle', android: 'badge', web: 'badge' },
  bank: { ios: 'building.columns', android: 'account_balance', web: 'account_balance' },
  bell: { ios: 'bell', android: 'notifications', web: 'notifications' },
  block: { ios: 'nosign', android: 'block', web: 'block' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  card: { ios: 'creditcard', android: 'credit_card', web: 'credit_card' },
  chat: { ios: 'message', android: 'chat', web: 'chat' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  checkCircle: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  checkIn: { ios: 'figure.walk', android: 'directions_walk', web: 'directions_walk' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronUp: { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  crown: { ios: 'crown', android: 'workspace_premium', web: 'workspace_premium' },
  dashboard: { ios: 'square.grid.2x2', android: 'dashboard', web: 'dashboard' },
  document: { ios: 'doc.text', android: 'description', web: 'description' },
  download: { ios: 'square.and.arrow.down', android: 'download', web: 'download' },
  dumbbell: { ios: 'dumbbell', android: 'fitness_center', web: 'fitness_center' },
  edit: { ios: 'pencil', android: 'edit', web: 'edit' },
  female: { ios: 'figure.stand.dress', android: 'female', web: 'female' },
  globe: { ios: 'globe', android: 'language', web: 'language' },
  help: { ios: 'questionmark.circle', android: 'help', web: 'help' },
  history: { ios: 'clock.arrow.circlepath', android: 'history', web: 'history' },
  home: { ios: 'house', android: 'home', web: 'home' },
  hourglass: { ios: 'hourglass', android: 'hourglass_bottom', web: 'hourglass_bottom' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  location: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  lock: { ios: 'lock', android: 'lock', web: 'lock' },
  login: { ios: 'arrow.right.square', android: 'login', web: 'login' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  mail: { ios: 'envelope', android: 'mail', web: 'mail' },
  male: { ios: 'figure.stand', android: 'male', web: 'male' },
  map: { ios: 'map', android: 'map', web: 'map' },
  menu: { ios: 'line.3.horizontal', android: 'menu', web: 'menu' },
  money: { ios: 'banknote', android: 'payments', web: 'payments' },
  moon: { ios: 'moon', android: 'dark_mode', web: 'dark_mode' },
  more: { ios: 'ellipsis', android: 'more_vert', web: 'more_vert' },
  palette: { ios: 'paintpalette', android: 'palette', web: 'palette' },
  pause: { ios: 'pause.circle', android: 'pause_circle', web: 'pause_circle' },
  people: { ios: 'person.2', android: 'group', web: 'group' },
  person: { ios: 'person', android: 'person', web: 'person' },
  personAdd: { ios: 'person.badge.plus', android: 'person_add', web: 'person_add' },
  personOff: { ios: 'person.slash', android: 'person_off', web: 'person_off' },
  phone: { ios: 'phone', android: 'call', web: 'call' },
  pieChart: { ios: 'chart.pie', android: 'pie_chart', web: 'pie_chart' },
  plans: { ios: 'list.bullet.rectangle', android: 'receipt_long', web: 'receipt_long' },
  qr: { ios: 'qrcode', android: 'qr_code_2', web: 'qr_code_2' },
  renew: { ios: 'arrow.clockwise', android: 'autorenew', web: 'autorenew' },
  report: { ios: 'chart.bar', android: 'bar_chart', web: 'bar_chart' },
  rupee: { ios: 'indianrupeesign', android: 'currency_rupee', web: 'currency_rupee' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  shield: { ios: 'checkmark.shield', android: 'verified_user', web: 'verified_user' },
  staff: { ios: 'person.crop.rectangle', android: 'badge', web: 'badge' },
  store: { ios: 'storefront', android: 'storefront', web: 'storefront' },
  sun: { ios: 'sun.max', android: 'light_mode', web: 'light_mode' },
  support: { ios: 'bubble.left.and.bubble.right', android: 'support_agent', web: 'support_agent' },
  swap: { ios: 'arrow.left.arrow.right', android: 'swap_horiz', web: 'swap_horiz' },
  system: { ios: 'iphone', android: 'smartphone', web: 'smartphone' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  trendDown: { ios: 'arrow.down.right', android: 'trending_down', web: 'trending_down' },
  trendUp: { ios: 'arrow.up.right', android: 'trending_up', web: 'trending_up' },
  trophy: { ios: 'trophy', android: 'emoji_events', web: 'emoji_events' },
  upload: { ios: 'square.and.arrow.up', android: 'upload', web: 'upload' },
  userGroup: { ios: 'person.3', android: 'groups', web: 'groups' },
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

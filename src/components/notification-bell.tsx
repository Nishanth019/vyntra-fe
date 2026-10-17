import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Radius, shadow } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Round bell button with an unread count badge. */
export function NotificationBell({ unread, onPress }: { unread: number; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={unread ? `Notifications, ${unread} unread` : 'Notifications'}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: theme.surface },
        shadow(theme.shadow),
        pressed && styles.pressed,
      ]}>
      <Icon name="bell" color={theme.text} size={22} />
      {unread > 0 ? (
        <View style={[styles.badge, { backgroundColor: theme.danger, borderColor: theme.surface }]}>
          <Text style={[styles.badgeText, { color: theme.onPrimary }]}>{unread > 99 ? '99+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { useToneColors, type Tone } from '@/components/ui/icon-badge';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useBusiness } from '@/lib/business';
import { isReadOnly, useSubscription } from '@/lib/subscription';

/** Trial days left show from this many days before the end. */
const TRIAL_NOTICE_DAYS = 15;

/**
 * Tells the business's admins when it is read-only, and the owner how much of their trial or paid
 * plan is left. Renders nothing when there's nothing to say.
 */
export function SubscriptionBanner() {
  const { account } = useBusiness();
  const { subscription } = useSubscription();
  const access = account.access;

  if (isReadOnly(access, subscription)) {
    return access?.is_owner ? (
      <Banner
        tone="danger"
        icon="lock"
        title="Read-only: your subscription has ended"
        text="Your data is safe. Renew to add and edit again."
        action="Renew"
      />
    ) : (
      <Banner
        tone="danger"
        icon="lock"
        title="Read-only"
        text={`${access?.owner_name ?? 'The owner'}'s subscription has ended. Ask them to renew it.`}
      />
    );
  }

  if (!access?.is_owner || !subscription) return null;
  if (subscription.state === 'GRACE') {
    return (
      <Banner
        tone="warning"
        icon="warning"
        title="Renewal payment failed"
        text={`We're retrying the payment. Everything keeps working for ${subscription.days_left} more day(s).`}
        action="View"
      />
    );
  }
  if (subscription.state === 'TRIAL' && subscription.days_left <= TRIAL_NOTICE_DAYS) {
    const days = subscription.days_left;
    return (
      <Banner
        tone={days <= 3 ? 'warning' : 'primary'}
        icon="hourglass"
        title={
          days === 0 ? 'Your free trial ends today' : `${days} day${days === 1 ? '' : 's'} left in your free trial`
        }
        text="Choose a plan to keep everything running."
        action="Subscribe"
      />
    );
  }
  return null;
}

function Banner({
  tone,
  icon,
  title,
  text,
  action,
}: {
  tone: Tone;
  icon: IconName;
  title: string;
  text: string;
  /** Opens the subscription page; omitted for admins who can't pay for the owner. */
  action?: string;
}) {
  const theme = useTheme();
  const colors = useToneColors(tone);

  return (
    <Pressable
      accessibilityRole={action ? 'button' : 'text'}
      disabled={!action}
      onPress={() => router.push('/subscription')}
      style={({ pressed }) => [styles.banner, { backgroundColor: colors.background }, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: theme.surface }]}>
        <Icon name={icon} color={colors.color} size={20} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>{text}</Text>
      </View>
      {action ? (
        <View style={[styles.action, { backgroundColor: colors.color }]}>
          <Text style={[styles.actionText, { color: theme.onPrimary }]}>{action}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    borderRadius: Radius.lg,
    padding: Spacing.three - 2,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  action: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.three - 2,
    paddingVertical: Spacing.two - 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Icon, type IconName } from '@/components/ui/icon';
import { IconBadge, type Tone } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { EmptyState } from '@/components/ui/states';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Channel = { icon: IconName; tone: Tone; title: string; detail: string; url: string };

// Configured in .env; a channel without a value is hidden.
const EMAIL = process.env.EXPO_PUBLIC_SUPPORT_EMAIL;
const PHONE = process.env.EXPO_PUBLIC_SUPPORT_PHONE;
const WHATSAPP = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP;

const CHANNELS: Channel[] = [
  EMAIL && { icon: 'mail', tone: 'primary', title: 'Email us', detail: EMAIL, url: `mailto:${EMAIL}` },
  PHONE && { icon: 'phone', tone: 'success', title: 'Call us', detail: PHONE, url: `tel:${PHONE}` },
  WHATSAPP && {
    icon: 'chat',
    tone: 'success',
    title: 'WhatsApp',
    detail: `+${WHATSAPP}`,
    url: `https://wa.me/${WHATSAPP}`,
  },
].filter((channel): channel is Channel => Boolean(channel));

export default function ContactScreen() {
  return (
    <Screen title="Contact us" subtitle="Questions, issues or feedback? We're happy to help.">
      {CHANNELS.length === 0 ? (
        <Card>
          <EmptyState
            icon="support"
            title="Support isn't set up yet"
            message="Contact details will appear here once they're configured."
          />
        </Card>
      ) : (
        CHANNELS.map((channel) => <ChannelRow key={channel.title} channel={channel} />)
      )}
    </Screen>
  );
}

function ChannelRow({ channel }: { channel: Channel }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => Linking.openURL(channel.url)}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <IconBadge name={channel.icon} tone={channel.tone} />
      <View style={styles.flex}>
        <Text style={[styles.title, { color: theme.text }]}>{channel.title}</Text>
        <Text style={[styles.detail, { color: theme.textSecondary }]}>{channel.detail}</Text>
      </View>
      <Icon name="chevronRight" color={theme.textSecondary} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  detail: {
    fontSize: 14,
    marginTop: 2,
  },
});

import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { membershipStatus, StatusPill } from '@/components/status-pill';
import { Icon } from '@/components/ui/icon';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Member } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatMoney, initials, memberName } from '@/lib/format';
import { memberMessage, needsReminder, openWhatsApp } from '@/lib/whatsapp';

type PersonRowProps = {
  name: string;
  /** Secondary lines under the name; empty ones are skipped. */
  details: (string | null | undefined)[];
  /** A line in red under the details, e.g. an amount due. */
  alert?: string;
  /** Shown under the name, e.g. a status pill (so long names keep the full width). */
  badge?: ReactNode;
  /** Shown on the right, e.g. a Check out button. */
  trailing?: ReactNode;
  /** Greys out the avatar, e.g. for inactive people. */
  muted?: boolean;
  onPress?: () => void;
};

/** A tappable card for a person (member, staff, admin) with an initials avatar. */
export function PersonRow({ name, details, alert, badge, trailing, muted = false, onPress }: PersonRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border },
        shadow(theme.shadow),
        pressed && styles.pressed,
      ]}>
      <View style={[styles.avatar, { backgroundColor: muted ? theme.border : theme.primary }]}>
        <Text style={[styles.avatarText, { color: muted ? theme.textSecondary : theme.onPrimary }]}>
          {initials(name)}
        </Text>
      </View>
      <View style={styles.body}>
        <Text style={[styles.name, { color: theme.text }]}>{name}</Text>
        {details.filter(Boolean).map((line, i) => (
          <Text key={i} style={[styles.detail, { color: theme.textSecondary }]}>
            {line}
          </Text>
        ))}
        {alert ? <Text style={[styles.alert, { color: theme.danger }]}>{alert}</Text> : null}
        {badge ? <View style={styles.badge}>{badge}</View> : null}
      </View>
      {trailing}
      {onPress ? <Icon name="chevronRight" color={theme.textSecondary} size={18} /> : null}
    </Pressable>
  );
}

const WHATSAPP_GREEN = '#25D366';

/** `whatsapp` adds a one-tap WhatsApp reminder for members who owe money or whose plan is ending or ended. */
export function MemberRow({ member, onPress, whatsapp = false }: { member: Member; onPress?: () => void; whatsapp?: boolean }) {
  const status = membershipStatus(member);
  const { account } = useBusiness();

  return (
    <PersonRow
      name={memberName(member)}
      details={[
        [`#${member.member_code}`, member.membership?.membership_plan.name].filter(Boolean).join(' · '),
        member.phone,
      ]}
      alert={Number(member.total_due) > 0 ? `Due ${formatMoney(member.total_due)}` : undefined}
      badge={<StatusPill {...status} />}
      muted={status.tone === 'neutral'}
      trailing={
        whatsapp && needsReminder(member) ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`WhatsApp ${memberName(member)}`}
            hitSlop={8}
            onPress={() => openWhatsApp(member.phone!, memberMessage(member, account.name))}
            style={({ pressed }) => [styles.whatsapp, pressed && styles.pressed]}>
            <Icon name="chat" color="#FFFFFF" size={20} />
          </Pressable>
        ) : undefined
      }
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  whatsapp: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: WHATSAPP_GREEN,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
  },
  detail: {
    fontSize: 13,
  },
  badge: {
    flexDirection: 'row',
    marginTop: Spacing.one + 2,
  },
  alert: {
    fontSize: 13,
    fontWeight: '700',
  },
});

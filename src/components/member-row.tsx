import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { membershipStatus, StatusPill } from '@/components/status-pill';
import { Icon } from '@/components/ui/icon';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Member } from '@/lib/api';
import { formatMoney, initials, memberName } from '@/lib/format';

type PersonRowProps = {
  name: string;
  /** Secondary lines under the name; empty ones are skipped. */
  details: (string | null | undefined)[];
  /** A line in red under the details, e.g. an amount due. */
  alert?: string;
  /** Shown on the right, e.g. a status pill. */
  trailing?: ReactNode;
  /** Greys out the avatar, e.g. for inactive people. */
  muted?: boolean;
  onPress?: () => void;
};

/** A tappable card for a person (member, staff, admin) with an initials avatar. */
export function PersonRow({ name, details, alert, trailing, muted = false, onPress }: PersonRowProps) {
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
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {name}
        </Text>
        {details.filter(Boolean).map((line, i) => (
          <Text key={i} style={[styles.detail, { color: theme.textSecondary }]} numberOfLines={1}>
            {line}
          </Text>
        ))}
        {alert ? (
          <Text style={[styles.alert, { color: theme.danger }]} numberOfLines={1}>
            {alert}
          </Text>
        ) : null}
      </View>
      {trailing}
      {onPress ? <Icon name="chevronRight" color={theme.textSecondary} size={18} /> : null}
    </Pressable>
  );
}

export function MemberRow({ member, onPress }: { member: Member; onPress?: () => void }) {
  const status = membershipStatus(member);

  return (
    <PersonRow
      name={memberName(member)}
      details={[
        [`#${member.member_code}`, member.membership?.membership_plan.name].filter(Boolean).join(' · '),
        member.phone,
      ]}
      alert={Number(member.total_due) > 0 ? `Due ${formatMoney(member.total_due)}` : undefined}
      trailing={<StatusPill {...status} />}
      muted={status.tone === 'neutral'}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
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
  alert: {
    fontSize: 13,
    fontWeight: '700',
  },
});

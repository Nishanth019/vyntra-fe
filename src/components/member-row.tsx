import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { membershipStatus, StatusPill } from '@/components/status-pill';
import { useToneColors } from '@/components/ui/icon-badge';
import { Radius, Spacing } from '@/constants/theme';
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
  const avatar = useToneColors(muted ? 'neutral' : 'primary');

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border },
        pressed && styles.pressed,
      ]}>
      <View style={[styles.avatar, { backgroundColor: avatar.background }]}>
        <Text style={[styles.avatarText, { color: avatar.color }]}>{initials(name)}</Text>
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
    </Pressable>
  );
}

export function MemberRow({ member, onPress }: { member: Member; onPress?: () => void }) {
  const status = membershipStatus(member);

  return (
    <PersonRow
      name={memberName(member)}
      details={[
        `#${member.member_code}${member.phone ? ` · ${member.phone}` : ''}`,
        member.membership?.membership_plan.name,
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
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  detail: {
    fontSize: 13,
  },
  alert: {
    fontSize: 13,
    fontWeight: '700',
  },
});

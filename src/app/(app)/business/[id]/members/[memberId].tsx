import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { MembershipCard } from '@/components/membership-card';
import { membershipStatus, StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { HeaderButton } from '@/components/ui/header-button';
import { Icon, type IconName } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { useResource } from '@/hooks/use-resource';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { memberMessage, needsReminder, openWhatsApp } from '@/lib/whatsapp';
import { confirm } from '@/lib/confirm';
import { formatDate } from '@/lib/dates';
import { initials, memberName } from '@/lib/format';

export default function MemberProfileScreen() {
  const theme = useTheme();
  const { account } = useBusiness();
  const memberId = Number(useLocalSearchParams<{ memberId: string }>().memberId);
  const [toggling, setToggling] = useState(false);
  const [toggleError, setToggleError] = useState('');

  const fetchMember = useCallback(() => api.member(account.id, memberId), [account.id, memberId]);
  const { data: member, setData: setMember, error, refreshing, refresh, retry } = useResource(fetchMember);

  if (!member) return <LoadingState error={error} onRetry={retry} />;
  const params = { id: account.id, memberId: member.id };
  const status = membershipStatus(member);
  const editHref: Href = { pathname: '/business/[id]/members/edit', params };

  async function toggleActive() {
    if (!member) return;
    if (member.is_active) {
      const ok = await confirm(
        'Deactivate member?',
        `${memberName(member)} will be moved to Inactive. Their history is kept and you can reactivate them anytime.`,
        'Deactivate',
      );
      if (!ok) return;
    }
    setToggling(true);
    setToggleError('');
    try {
      if (member.is_active) {
        await api.deactivateMember(account.id, member.id);
        router.back();
      } else {
        setMember(await api.updateMember(account.id, member.id, { is_active: true }));
      }
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setToggleError(e.message);
    } finally {
      setToggling(false);
    }
  }

  const quickActions: { title: string; icon: IconName; href: Href }[] = [
    ...(member.is_active
      ? [{ title: 'Record Payment', icon: 'card' as const, href: { pathname: '/business/[id]/members/payment', params } as Href }]
      : []),
    { title: 'Payment History', icon: 'document', href: { pathname: '/business/[id]/members/history', params } },
    ...(member.is_active
      ? [{ title: 'Mark Attendance', icon: 'checkIn' as const, href: { pathname: '/business/[id]/attendance/mark', params } as Href }]
      : []),
    { title: 'Attendance History', icon: 'report', href: { pathname: '/business/[id]/attendance/report', params } },
  ];

  const emergency = [member.gym_details?.emergency_contact_name, member.gym_details?.emergency_contact_phone]
    .filter(Boolean)
    .join(' · ');
  const contacts: { label: string; value: string; icon: IconName; onPress?: () => void }[] = [
    ...(member.phone
      ? [
          { label: 'Mobile Number', value: member.phone, icon: 'phone' as const, onPress: () => Linking.openURL(`tel:${member.phone}`) },
          {
            label: 'WhatsApp',
            value: needsReminder(member) ? 'Send a renewal or dues reminder' : 'Open chat',
            icon: 'chat' as const,
            onPress: () => openWhatsApp(member.phone!, memberMessage(member, account.name)),
          },
        ]
      : []),
    ...(member.email
      ? [{ label: 'Email Address', value: member.email, icon: 'mail' as const, onPress: () => Linking.openURL(`mailto:${member.email}`) }]
      : []),
    ...(member.date_of_birth ? [{ label: 'Date of Birth', value: formatDate(member.date_of_birth), icon: 'calendar' as const }] : []),
    ...(member.gender ? [{ label: 'Gender', value: member.gender, icon: 'person' as const }] : []),
    ...(emergency ? [{ label: 'Emergency Contact', value: emergency, icon: 'support' as const }] : []),
    ...(member.gym_details?.emergency_contact_address
      ? [{ label: 'Address', value: member.gym_details.emergency_contact_address, icon: 'location' as const }]
      : []),
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Member Profile',
          headerRight: () => <HeaderButton icon="edit" label="Edit details" onPress={() => router.push(editHref)} />,
        }}
      />
      <Screen onRefresh={refresh} refreshing={refreshing}>
        {error ? <ErrorBanner message={error} /> : null}

        <View style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: status.tone === 'neutral' ? theme.textSecondary : theme.primary }]}>
            <Text style={[styles.avatarText, { color: theme.onPrimary }]}>{initials(memberName(member))}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
              {memberName(member)}
            </Text>
            <Text style={[styles.code, { color: theme.textSecondary }]}>Member #{member.member_code}</Text>
            <View style={styles.pill}>
              <StatusPill {...status} dot />
            </View>
          </View>
        </View>

        <MembershipCard member={member} onChange={setMember} />

        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Actions</Text>
        <View style={styles.quickRow}>
          {quickActions.map((action) => (
            <Pressable
              key={action.title}
              accessibilityRole="button"
              onPress={() => router.push(action.href)}
              style={({ pressed }) => [
                styles.quick,
                { backgroundColor: theme.surface, borderColor: theme.border },
                shadow(theme.shadow),
                pressed && styles.pressed,
              ]}>
              <View style={[styles.quickIcon, { backgroundColor: theme.primarySoft }]}>
                <Icon name={action.icon} color={theme.primary} size={24} />
              </View>
              <Text style={[styles.quickText, { color: theme.text }]} numberOfLines={2}>
                {action.title}
              </Text>
            </Pressable>
          ))}
        </View>

        <Card
          title="Contact Information"
          action={
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push(editHref)}>
              <Text style={[styles.link, { color: theme.primary }]}>Edit</Text>
            </Pressable>
          }>
          {contacts.length === 0 ? (
            <Text style={[styles.empty, { color: theme.textSecondary }]}>No contact details yet.</Text>
          ) : (
            contacts.map((item) => (
              <Pressable
                key={item.label}
                accessibilityRole={item.onPress ? 'button' : undefined}
                disabled={!item.onPress}
                onPress={item.onPress}
                style={({ pressed }) => [styles.contact, pressed && styles.pressed]}>
                <IconBadge name={item.icon} tone="primary" size={46} />
                <View style={styles.flex}>
                  <Text style={[styles.contactLabel, { color: theme.text }]}>{item.label}</Text>
                  <Text style={[styles.contactValue, { color: theme.textSecondary }]}>{item.value}</Text>
                </View>
                {item.onPress ? <Icon name="chevronRight" color={theme.textSecondary} size={18} /> : null}
              </Pressable>
            ))
          )}
        </Card>

        {toggleError ? <ErrorBanner message={toggleError} /> : null}
        {member.is_active ? (
          <Button
            title="Deactivate Member"
            icon="trash"
            variant="danger"
            loading={toggling}
            style={{ backgroundColor: theme.dangerSoft }}
            onPress={toggleActive}
          />
        ) : (
          <Button title="Reactivate Member" icon="check" variant="secondary" loading={toggling} onPress={toggleActive} />
        )}
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three + 4,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '800',
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  code: {
    fontSize: 15,
    marginTop: 2,
  },
  pill: {
    flexDirection: 'row',
    marginTop: Spacing.two,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    marginTop: Spacing.two,
    marginBottom: -Spacing.one,
  },
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  quick: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
  },
  quickIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.7,
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
  },
  empty: {
    fontSize: 14,
  },
  contact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  contactLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  contactValue: {
    fontSize: 14,
    marginTop: 2,
  },
});

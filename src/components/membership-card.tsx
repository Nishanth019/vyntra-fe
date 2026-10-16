import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { membershipStatus, StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Member } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { AUTO_INACTIVE_NOTE } from '@/lib/member-filters';
import { openWhatsApp, whatsappText, type WhatsAppMessage } from '@/lib/whatsapp';

export type PlanMode = 'renew' | 'change' | 'extend' | 'edit';

const WHATSAPP_BUTTONS: { kind: WhatsAppMessage; title: string }[] = [
  { kind: 'reminder', title: 'Reminder' },
  { kind: 'dues', title: 'Dues' },
  { kind: 'receipt', title: 'Receipt' },
];

/** The member's current plan with dues, plan actions and WhatsApp shortcuts. */
export function MembershipCard({ member }: { member: Member }) {
  const theme = useTheme();
  const { account } = useBusiness();
  const membership = member.membership;
  const open = (mode: PlanMode) =>
    router.push({ pathname: '/business/[id]/members/plan', params: { id: account.id, memberId: member.id, mode } });

  const balance = Number(membership?.balance ?? 0);
  const olderDues = Number(member.total_due) - Math.max(balance, 0);
  const whatsapp = member.phone
    ? WHATSAPP_BUTTONS.map((button) => ({ ...button, text: whatsappText(button.kind, member, account) })).filter(
        (button) => button.text,
      )
    : [];

  return (
    <Card icon="plans" title="Membership" action={<StatusPill {...membershipStatus(member)} />}>
      {membership ? (
        <View style={[styles.current, { backgroundColor: theme.background, borderColor: theme.border }]}>
          <Text style={[styles.plan, { color: theme.text }]}>{membership.membership_plan.name}</Text>
          <Text style={[styles.dates, { color: theme.textSecondary }]}>
            {formatDate(membership.start_date)} – {formatDate(membership.end_date)}
          </Text>
          <View style={[styles.duesRow, { borderColor: theme.border }]}>
            <Amount label="Payable" value={formatMoney(membership.net_payable)} color={theme.text} />
            <Amount label="Paid" value={formatMoney(membership.amount_paid)} color={theme.success} />
            <Amount
              label="Balance"
              value={formatMoney(membership.balance)}
              color={balance > 0 ? theme.danger : theme.textSecondary}
            />
          </View>
          {Number(membership.discount) > 0 ? (
            <Text style={[styles.note, { color: theme.textSecondary }]}>
              Includes {formatMoney(membership.discount)} discount on {formatMoney(membership.amount)}.
            </Text>
          ) : null}
          {olderDues > 0 ? (
            <Text style={[styles.note, { color: theme.danger }]}>
              + {formatMoney(olderDues)} still due from earlier plans (total due {formatMoney(member.total_due)}).
            </Text>
          ) : null}
        </View>
      ) : (
        <Text style={[styles.note, { color: theme.textSecondary }]}>No plan yet.</Text>
      )}

      {member.status === 'expired' || member.status === 'inactive' ? (
        <Text style={[styles.note, { color: theme.textSecondary }]}>{AUTO_INACTIVE_NOTE}</Text>
      ) : null}

      <View style={styles.row}>
        <Button
          title={member.status === 'inactive' ? 'Renew & Reactivate' : 'Renew'}
          icon="renew"
          style={styles.flex}
          onPress={() => open('renew')}
        />
        {membership && member.status === 'live' ? (
          <Button title="Change Plan" icon="swap" variant="secondary" style={styles.flex} onPress={() => open('change')} />
        ) : null}
      </View>
      {membership ? (
        <View style={styles.row}>
          <Button title="Extend" icon="pause" variant="secondary" style={styles.flex} onPress={() => open('extend')} />
          <Button title="Edit" icon="edit" variant="secondary" style={styles.flex} onPress={() => open('edit')} />
        </View>
      ) : null}

      {whatsapp.length > 0 ? (
        <View style={styles.whatsapp}>
          <Text style={[styles.whatsappTitle, { color: theme.textSecondary }]}>Send on WhatsApp</Text>
          <View style={styles.row}>
            {whatsapp.map((button) => (
              <Button
                key={button.kind}
                title={button.title}
                icon="chat"
                variant="secondary"
                style={styles.flex}
                onPress={() => openWhatsApp(member.phone!, button.text!)}
              />
            ))}
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function Amount({ label, value, color }: { label: string; value: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={styles.flex}>
      <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.amountValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  current: {
    gap: 2,
    padding: Spacing.three,
    borderWidth: 1,
    borderRadius: Radius.md,
  },
  plan: {
    fontSize: 17,
    fontWeight: '700',
  },
  dates: {
    fontSize: 13,
  },
  duesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two + 2,
    marginTop: Spacing.two,
  },
  amountLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: Spacing.one,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  whatsapp: {
    gap: Spacing.two,
  },
  whatsappTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
});

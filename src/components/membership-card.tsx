import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { membershipStatus, StatusPill } from '@/components/status-pill';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type Member, type Membership } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { confirm } from '@/lib/confirm';
import { daysUntil, formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { AUTO_INACTIVE_NOTE } from '@/lib/member-filters';

export type PlanMode = 'renew' | 'change' | 'early' | 'extend' | 'edit';

// Renew Early (adding the next plan) opens this many days before the current plan ends.
const RENEW_EARLY_DAYS = 7;

/**
 * The member's current plan with its dues and actions. Running plans can be changed or extended, and
 * renewed early in their last week; expired / inactive members (or ones without a plan) are renewed.
 */
export function MembershipCard({ member, onChange }: { member: Member; onChange: (member: Member) => void }) {
  const theme = useTheme();
  const { account } = useBusiness();
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');
  const membership = member.membership;
  const next = member.next_membership;
  const open = (mode: PlanMode, target?: 'next') =>
    router.push({
      pathname: '/business/[id]/members/plan',
      params: { id: account.id, memberId: member.id, mode, ...(target ? { target } : {}) },
    });

  const running = member.status === 'live' || member.status === 'upcoming';
  const daysLeft = membership ? daysUntil(membership.end_date) : -1;
  const canRenewEarly = member.status === 'live' && !next && daysLeft <= RENEW_EARLY_DAYS;

  async function cancelNext() {
    if (!next) return;
    const ok = await confirm(
      'Cancel next plan?',
      `${next.membership_plan.name} from ${formatDate(next.start_date)} will be removed.`,
      'Cancel Plan',
    );
    if (!ok) return;
    setCancelling(true);
    setError('');
    try {
      onChange(await api.cancelNextPlan(account.id, next.id));
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setError(e.message);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <Card icon="plans" title="Membership" action={<StatusPill {...membershipStatus(member)} />}>
      {membership ? <PlanBox membership={membership} /> : (
        <Text style={[styles.note, { color: theme.textSecondary }]}>No plan yet.</Text>
      )}

      {next ? (
        <View style={styles.next}>
          <Text style={[styles.nextLabel, { color: theme.success }]}>NEXT PLAN</Text>
          <PlanBox membership={next} />
          <View style={styles.row}>
            <Button
              title="Edit"
              icon="edit"
              variant="secondary"
              style={styles.flex}
              onPress={() => open('edit', 'next')}
            />
            <Button
              title="Cancel"
              icon="close"
              variant="danger"
              style={styles.flex}
              loading={cancelling}
              onPress={cancelNext}
            />
          </View>
        </View>
      ) : null}
      {error ? <Text style={[styles.note, { color: theme.danger }]}>{error}</Text> : null}

      {member.status === 'expired' || member.status === 'inactive' ? (
        <Text style={[styles.note, { color: theme.textSecondary }]}>{AUTO_INACTIVE_NOTE}</Text>
      ) : null}

      {canRenewEarly ? (
        <>
          <Text style={[styles.note, { color: theme.textSecondary }]}>
            {daysLeft === 0 ? 'Plan ends today.' : `Plan ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`} Add
            their next plan now.
          </Text>
          <Button title="Renew Early" icon="renew" onPress={() => open('early')} />
        </>
      ) : null}
      {running ? (
        <View style={styles.row}>
          {next ? null : (
            <Button
              title="Change Plan"
              icon="swap"
              variant={canRenewEarly ? 'secondary' : 'primary'}
              style={styles.flex}
              onPress={() => open('change')}
            />
          )}
          <Button title="Extend" icon="pause" variant="secondary" style={styles.flex} onPress={() => open('extend')} />
        </View>
      ) : (
        <Button
          title={member.status === 'inactive' ? 'Renew & Reactivate' : 'Renew'}
          icon="renew"
          onPress={() => open('renew')}
        />
      )}
      {membership ? (
        <Button title="Edit Dates / Discount" icon="edit" variant="secondary" onPress={() => open('edit')} />
      ) : null}
    </Card>
  );
}

function PlanBox({ membership }: { membership: Membership }) {
  const theme = useTheme();
  const balance = Number(membership.balance);

  return (
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
    </View>
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
  next: {
    gap: Spacing.two,
  },
  nextLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
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
});

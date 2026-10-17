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

// A future plan can be added this many days before the current plan ends.
const FUTURE_PLAN_DAYS = 7;

/**
 * The member's current plan with its dues and actions. Running plans can be changed (replaced) or
 * extended, and get a future plan in their last week; expired / inactive members are renewed.
 */
export function MembershipCard({ member, onChange }: { member: Member; onChange: (member: Member) => void }) {
  const theme = useTheme();
  const { account } = useBusiness();
  const [cancelling, setCancelling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
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
  const canAddFuture = member.status === 'live' && !next && daysLeft <= FUTURE_PLAN_DAYS;
  // Deactivated while the plan still runs: bring them back on the same plan.
  const planStillRuns = Boolean(membership && daysUntil(membership.start_date) <= 0 && daysLeft >= 0);
  const canReactivate = member.status === 'inactive' && planStillRuns;

  async function reactivate() {
    setReactivating(true);
    setError('');
    try {
      onChange(await api.updateMember(account.id, member.id, { is_active: true }));
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setError(e.message);
    } finally {
      setReactivating(false);
    }
  }

  async function cancelNext() {
    if (!next) return;
    const paid = Number(next.amount_paid);
    const ok = await confirm(
      'Cancel future plan?',
      `${next.membership_plan.name} from ${formatDate(next.start_date)} will be removed.` +
        (paid > 0 ? ` The ${formatMoney(paid)} paid for it will be deleted too (e.g. if you refunded it).` : ''),
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
    <Card icon="plans" title="Membership">
      <View style={styles.statusRow}>
        <StatusPill {...membershipStatus(member)} />
      </View>
      {membership ? <PlanBox membership={membership} /> : (
        <Text style={[styles.note, { color: theme.textSecondary }]}>No plan yet.</Text>
      )}

      {next ? (
        <View style={styles.next}>
          <Text style={[styles.nextLabel, { color: theme.success }]}>FUTURE PLAN</Text>
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

      {canAddFuture ? (
        <>
          <Text style={[styles.note, { color: theme.textSecondary }]}>
            {daysLeft === 0 ? 'Plan ends today.' : `Plan ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`} You can
            add their next plan now.
          </Text>
          <Button title="Add Future Plan" icon="renew" onPress={() => open('early')} />
        </>
      ) : null}
      {running ? (
        <View style={styles.row}>
          <Button
            title="Change Plan"
            icon="swap"
            variant={canAddFuture ? 'secondary' : 'primary'}
            style={styles.flex}
            onPress={() => open('change')}
          />
          <Button title="Extend" icon="pause" variant="secondary" style={styles.flex} onPress={() => open('extend')} />
        </View>
      ) : canReactivate ? (
        <Button title="Reactivate" icon="check" loading={reactivating} onPress={reactivate} />
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
  statusRow: {
    flexDirection: 'row',
    marginTop: -Spacing.two,
  },
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

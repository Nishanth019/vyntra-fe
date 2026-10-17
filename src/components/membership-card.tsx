import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { IconName } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type Member, type Membership } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { confirm } from '@/lib/confirm';
import { daysBetween, daysUntil, formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { AUTO_INACTIVE_NOTE } from '@/lib/member-filters';

export type PlanMode = 'renew' | 'change' | 'early' | 'extend' | 'edit';

// A future plan can be added this many days before the current plan ends.
const FUTURE_PLAN_DAYS = 7;

/**
 * The member's current plan (and any future plan) with its dues, then the plan actions. Running plans can be changed (replaced) or
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

  // The buttons for where the member stands; laid out two per row.
  const actions: ActionProps[] = [];
  if (canAddFuture) actions.push({ title: 'Add Future Plan', icon: 'renew', primary: true, onPress: () => open('early') });
  if (running) {
    actions.push(
      { title: 'Change Plan', icon: 'swap', primary: !canAddFuture, onPress: () => open('change') },
      { title: 'Extend', icon: 'calendar', onPress: () => open('extend') },
    );
  } else if (canReactivate) {
    actions.push({ title: 'Reactivate', icon: 'check', primary: true, loading: reactivating, onPress: reactivate });
  } else {
    actions.push({
      title: member.status === 'inactive' ? 'Renew & Reactivate' : 'Renew',
      icon: 'renew',
      primary: true,
      onPress: () => open('renew'),
    });
  }
  if (membership) actions.push({ title: 'Edit', icon: 'edit', onPress: () => open('edit') });

  return (
    <>
      <Card>
        {membership ? (
          <PlanSummary membership={membership} label="Membership Plan" status={member.status} />
        ) : (
          <Text style={[styles.note, { color: theme.textSecondary }]}>No plan yet.</Text>
        )}

        {next ? (
          <View style={[styles.next, { borderColor: theme.border }]}>
            <PlanSummary membership={next} label="Future Plan" />
            <View style={styles.row}>
              <Button title="Edit" icon="edit" variant="secondary" style={styles.flex} onPress={() => open('edit', 'next')} />
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
          <Text style={[styles.note, { color: theme.textSecondary }]}>
            {daysLeft === 0 ? 'Plan ends today.' : `Plan ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.`} You can
            add their next plan now.
          </Text>
        ) : null}
      </Card>

      <View style={styles.actions}>
        {pairs(actions).map((row) => (
          <View key={row[0].title} style={styles.row}>
            {row.map((action) => (
              <Button
                key={action.title}
                title={action.title}
                icon={action.icon}
                variant={action.primary ? 'primary' : 'secondary'}
                loading={action.loading}
                style={styles.flex}
                onPress={action.onPress}
              />
            ))}
          </View>
        ))}
      </View>
    </>
  );
}

type ActionProps = { title: string; icon: IconName; primary?: boolean; loading?: boolean; onPress: () => void };

function pairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

/** A plan's name, dates, dues and (while it runs) how much of it is left. */
function PlanSummary({ membership, label, status }: { membership: Membership; label: string; status?: Member['status'] }) {
  const theme = useTheme();
  const balance = Number(membership.balance);
  const total = daysBetween(membership.start_date, membership.end_date) + 1;
  const left = Math.min(total, daysUntil(membership.end_date));
  const started = daysUntil(membership.start_date) <= 0;
  const statusLabel = status === 'live' ? 'Active' : status === 'upcoming' ? 'Upcoming' : status === 'expired' ? 'Expired' : null;

  return (
    <View style={styles.plan}>
      <View style={styles.planHeader}>
        <IconBadge name="dumbbell" tone="primary" size={52} />
        <View style={styles.flex}>
          <Text style={[styles.planLabel, { color: theme.textSecondary }]}>{label}</Text>
          <Text style={[styles.planName, { color: theme.text }]}>{membership.membership_plan.name}</Text>
          <Text style={[styles.dates, { color: theme.textSecondary }]}>
            {formatDate(membership.start_date)} – {formatDate(membership.end_date)}
          </Text>
        </View>
        {statusLabel ? (
          <View style={[styles.tag, { backgroundColor: theme.primarySoft }]}>
            <Text style={[styles.tagText, { color: theme.primary }]}>{statusLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.duesRow, { borderColor: theme.border }]}>
        <Amount label="Payable" value={formatMoney(membership.net_payable)} color={theme.text} />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Amount label="Paid" value={formatMoney(membership.amount_paid)} color={theme.success} />
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <Amount label="Balance" value={formatMoney(membership.balance)} color={balance > 0 ? theme.danger : theme.text} />
      </View>
      {Number(membership.discount) > 0 ? (
        <Text style={[styles.note, { color: theme.textSecondary }]}>
          Includes {formatMoney(membership.discount)} discount on {formatMoney(membership.amount)}.
        </Text>
      ) : null}

      {status === 'live' && started && left >= 0 ? (
        <View style={styles.progress}>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressText, { color: theme.text }]}>
              {left === 0 ? 'Ends today' : `${left} day${left === 1 ? '' : 's'} remaining`}
            </Text>
            <Text style={[styles.progressPercent, { color: theme.textSecondary }]}>
              {Math.round((left / total) * 100)}%
            </Text>
          </View>
          <View style={[styles.track, { backgroundColor: theme.border }]}>
            <View style={[styles.fill, { width: `${(left / total) * 100}%`, backgroundColor: theme.primary }]} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Amount({ label, value, color }: { label: string; value: string; color: string }) {
  const theme = useTheme();
  return (
    <View style={styles.amount}>
      <Text style={[styles.amountLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.amountValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
  },
  actions: {
    gap: Spacing.three - 4,
  },
  next: {
    gap: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  plan: {
    gap: Spacing.three,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  planLabel: {
    fontSize: 13,
  },
  planName: {
    fontSize: 19,
    fontWeight: '800',
    marginVertical: 1,
  },
  dates: {
    fontSize: 13,
  },
  tag: {
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: 5,
    borderRadius: Radius.sm,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '700',
  },
  duesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  divider: {
    width: 1,
    height: 32,
  },
  amount: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.one,
  },
  amountLabel: {
    fontSize: 13,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  progress: {
    gap: Spacing.two,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 13,
  },
  track: {
    height: 8,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: Radius.full,
  },
  note: {
    fontSize: 13,
    lineHeight: 19,
  },
});

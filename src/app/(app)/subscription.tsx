import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Gradient } from '@/components/ui/gradient';
import { Icon, type IconName } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { Screen } from '@/components/ui/screen';
import { LoadingState } from '@/components/ui/states';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError, type SubscriptionInfo, type SubscriptionPayment, type SubscriptionPlan } from '@/lib/api';
import { useCheckout, type Checkout } from '@/lib/billing';
import { confirm } from '@/lib/confirm';
import { toISODate, formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { receiptUrl } from '@/lib/links';
import { useSession } from '@/lib/session';
import { useSubscription } from '@/lib/subscription';

const INCLUDED: { icon: IconName; text: string }[] = [
  { icon: 'people', text: 'Unlimited members, plans and payments' },
  { icon: 'store', text: 'All your organisations and branches' },
  { icon: 'admin', text: 'Every admin you add works under your plan' },
  { icon: 'report', text: 'Insights, reminders and daily summaries' },
];

const PROVIDER_LABELS: Record<string, string> = {
  RAZORPAY: 'Website',
  GOOGLE_PLAY: 'Google Play',
  APPLE: 'App Store',
  MANUAL: 'Free days',
};

export default function SubscriptionScreen() {
  const { admin } = useSession();
  const { subscription, refresh } = useSubscription();
  const checkout = useCheckout(subscription, admin?.id);
  const [refreshing, setRefreshing] = useState(false);

  async function pullToRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  if (!subscription) return <LoadingState error="" onRetry={refresh} />;

  return (
    <Screen onRefresh={pullToRefresh} refreshing={refreshing}>
      <StatusHero subscription={subscription} />
      {subscription.can_purchase ? <ChoosePlan subscription={subscription} checkout={checkout} /> : null}
      <ManagePlan subscription={subscription} checkout={checkout} />
      <Included />
      {subscription.payments.length ? <PaymentHistory payments={subscription.payments} /> : null}
    </Screen>
  );
}

function day(value: string | null) {
  return value ? formatDate(toISODate(new Date(value))) : '';
}

function StatusHero({ subscription: s }: { subscription: SubscriptionInfo }) {
  const theme = useTheme();
  const planName = s.plan ? `${s.plan.name} plan` : 'Vyntra';

  const content = {
    TRIAL: {
      icon: 'hourglass' as const,
      title: 'Free trial',
      big: `${s.days_left} day${s.days_left === 1 ? '' : 's'} left`,
      text: `Everything is unlocked until ${day(s.trial_ends_at)}.`,
    },
    ACTIVE: {
      icon: 'verified' as const,
      title: planName,
      big: 'Active',
      text: `Renews on ${day(s.current_period_end)}.`,
    },
    CANCELLED: {
      icon: 'verified' as const,
      title: planName,
      big: 'Active',
      text: `Works until ${day(s.current_period_end)}. It won't renew.`,
    },
    GRACE: {
      icon: 'warning' as const,
      title: 'Payment pending',
      big: 'Renewal failed',
      text: `We're retrying the payment. Everything works until ${day(s.access_until)}.`,
    },
    EXPIRED: {
      icon: 'lock' as const,
      title: 'Subscription ended',
      big: 'Read-only',
      text: 'Your data is safe. Choose a plan to add and edit again.',
    },
  }[s.state];

  return (
    <View style={[styles.hero, shadow(theme.primary, 2)]}>
      <Gradient from={s.state === 'EXPIRED' ? theme.danger : theme.primary} to={theme.primaryEnd} />
      <View style={styles.heroArt}>
        <Icon name="crown" color="rgba(255,255,255,0.22)" size={120} />
      </View>
      <View style={styles.heroLabel}>
        <Icon name={content.icon} color={theme.onPrimary} size={18} />
        <Text style={[styles.heroLabelText, { color: theme.onPrimary }]}>{content.title}</Text>
      </View>
      <Text style={[styles.heroBig, { color: theme.onPrimary }]}>{content.big}</Text>
      <Text style={[styles.heroText, { color: theme.onPrimary }]}>{content.text}</Text>
    </View>
  );
}

/** Per-month price and the saving against paying monthly, e.g. "₹399/month · Save 20%". */
function planDeal(plan: SubscriptionPlan, plans: SubscriptionPlan[]) {
  const monthly = plans.find((p) => p.months === 1);
  const perMonth = Number(plan.price) / plan.months;
  const saving = monthly && plan.months > 1 ? Math.round((1 - perMonth / Number(monthly.price)) * 100) : 0;
  return { perMonth, saving };
}

function periodLabel(months: number) {
  if (months === 1) return 'month';
  if (months === 12) return 'year';
  return `${months} months`;
}

function ChoosePlan({ subscription, checkout }: { subscription: SubscriptionInfo; checkout: Checkout }) {
  const theme = useTheme();
  const { setSubscription } = useSubscription();
  const plans = subscription.plans;

  const [selected, setSelected] = useState(plans[plans.length - 1]?.code ?? '');
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const plan = plans.find((p) => p.code === selected);

  async function subscribe() {
    if (!plan) return;
    setError('');
    setBuying(true);
    try {
      const updated = await checkout.buy(plan);
      if (updated) {
        setSubscription(updated);
        setDone(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The payment did not go through. Please try again.');
    } finally {
      setBuying(false);
    }
  }

  const title = subscription.state === 'TRIAL' ? 'Choose your plan' : 'Renew your plan';

  return (
    <Card title={title} subtitle="Billed automatically each period. Cancel anytime.">
      <View style={styles.plans}>
        {plans.map((item) => (
          <PlanCard
            key={item.code}
            plan={item}
            plans={plans}
            storePrice={checkout.prices[item.code]}
            selected={item.code === selected}
            best={item.code === plans[plans.length - 1]?.code && plans.length > 1}
            onPress={() => setSelected(item.code)}
          />
        ))}
      </View>
      {error ? <ErrorBanner message={error} /> : null}
      {done ? <SuccessNote /> : null}
      <PurchaseButton checkout={checkout} plan={plan} buying={buying} onPress={subscribe} />
      {subscription.state === 'TRIAL' && checkout.store ? (
        <Text style={[styles.footnote, { color: theme.textSecondary }]}>
          Your paid plan starts today. Free days left in the trial are not added.
        </Text>
      ) : null}
      {subscription.state === 'CANCELLED' && checkout.store ? (
        <Text style={[styles.footnote, { color: theme.textSecondary }]}>
          Your new plan starts on {day(subscription.current_period_end)}, when your current plan ends. You will not be
          charged until then.
        </Text>
      ) : null}
    </Card>
  );
}

function PurchaseButton({
  checkout,
  plan,
  buying,
  onPress,
}: {
  checkout: Checkout;
  plan: SubscriptionPlan | undefined;
  buying: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  if (!checkout.ready) return <Button title="Loading plans…" loading disabled />;
  if (!checkout.store || !plan) {
    return (
      <View style={[styles.notice, { backgroundColor: theme.warningSoft }]}>
        <Icon name="info" color={theme.warning} size={18} />
        <Text style={[styles.noticeText, { color: theme.text }]}>{checkout.unavailableReason}</Text>
      </View>
    );
  }
  const price = checkout.prices[plan.code] ?? formatMoney(plan.price);
  return <Button title={`Subscribe · ${price}`} icon="crown" loading={buying} onPress={onPress} />;
}

function SuccessNote() {
  const theme = useTheme();
  return (
    <View style={[styles.notice, { backgroundColor: theme.successSoft }]}>
      <Icon name="checkCircle" color={theme.success} size={18} />
      <Text style={[styles.noticeText, { color: theme.text }]}>Payment received. Thank you for subscribing!</Text>
    </View>
  );
}

function PlanCard({
  plan,
  plans,
  storePrice,
  selected,
  best,
  onPress,
}: {
  plan: SubscriptionPlan;
  plans: SubscriptionPlan[];
  storePrice?: string;
  selected: boolean;
  best: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { perMonth, saving } = planDeal(plan, plans);

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.plan,
        {
          backgroundColor: selected ? theme.primarySoft : theme.surface,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      <View style={[styles.radio, { borderColor: selected ? theme.primary : theme.border }]}>
        {selected ? <View style={[styles.radioDot, { backgroundColor: theme.primary }]} /> : null}
      </View>
      <View style={styles.flex}>
        <View style={styles.planTitleRow}>
          <Text style={[styles.planName, { color: theme.text }]}>{plan.name}</Text>
          {best ? (
            <View style={[styles.tag, { backgroundColor: theme.primary }]}>
              <Text style={[styles.tagText, { color: theme.onPrimary }]}>Best value</Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.planDetail, { color: theme.textSecondary }]}>
          {plan.months > 1 ? `${formatMoney(Math.round(perMonth))}/month` : 'Pay month by month'}
          {saving > 0 ? ` · Save ${saving}%` : ''}
        </Text>
      </View>
      <View style={styles.planPrice}>
        <Text style={[styles.price, { color: theme.text }]}>{storePrice ?? formatMoney(plan.price)}</Text>
        <Text style={[styles.planDetail, { color: theme.textSecondary }]}>/{periodLabel(plan.months)}</Text>
      </View>
    </Pressable>
  );
}

function ManagePlan({ subscription: s, checkout }: { subscription: SubscriptionInfo; checkout: Checkout }) {
  const theme = useTheme();
  const { setSubscription } = useSubscription();
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  if (!s.plan || s.state === 'EXPIRED') return null;

  async function cancel() {
    const ok = await confirm(
      'Turn off auto-renew?',
      `Your plan keeps working until ${day(s.current_period_end)}. After that your businesses become read-only until you subscribe again.`,
      'Turn Off',
    );
    if (!ok) return;
    setCancelling(true);
    setError('');
    try {
      setSubscription(await api.cancelSubscription());
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setError(e.message);
    } finally {
      setCancelling(false);
    }
  }

  const rows: { label: string; value: string }[] = [
    { label: 'Plan', value: `${s.plan.name} · ${formatMoney(s.plan.price)}/${periodLabel(s.plan.months)}` },
    { label: s.auto_renew ? 'Renews on' : 'Works until', value: day(s.current_period_end) },
    { label: 'Paid through', value: PROVIDER_LABELS[s.provider ?? ''] ?? '—' },
  ];

  return (
    <Card title="Your plan">
      {rows.map((row) => (
        <View key={row.label} style={styles.row}>
          <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>{row.label}</Text>
          <Text style={[styles.rowValue, { color: theme.text }]}>{row.value}</Text>
        </View>
      ))}
      {error ? <ErrorBanner message={error} /> : null}
      {s.auto_renew && s.provider === 'GOOGLE_PLAY' ? (
        Platform.OS === 'android' && checkout.manage ? (
          <Button title="Manage in Google Play" icon="settings" variant="secondary" onPress={checkout.manage} />
        ) : (
          <Text style={[styles.footnote, { color: theme.textSecondary }]}>
            Bought in Google Play. Manage or cancel it from the Play Store on your Android phone.
          </Text>
        )
      ) : null}
      {s.auto_renew && s.provider !== 'GOOGLE_PLAY' ? (
        <Button title="Turn Off Auto-Renew" variant="danger" loading={cancelling} onPress={cancel} />
      ) : null}
    </Card>
  );
}

function Included() {
  const theme = useTheme();
  return (
    <Card title="Everything included">
      {INCLUDED.map((item) => (
        <View key={item.text} style={styles.included}>
          <IconBadge name={item.icon} size={36} />
          <Text style={[styles.includedText, { color: theme.text }]}>{item.text}</Text>
        </View>
      ))}
    </Card>
  );
}

function PaymentHistory({ payments }: { payments: SubscriptionPayment[] }) {
  const theme = useTheme();
  return (
    <Card title="Payments">
      {payments.map((payment) => {
        const period =
          payment.period_start && payment.period_end ? `${day(payment.period_start)} – ${day(payment.period_end)}` : null;
        const paidWith = payment.method ?? PROVIDER_LABELS[payment.provider] ?? payment.provider;
        return (
          <View key={payment.id} style={styles.row}>
            <View style={styles.flex}>
              <Text style={[styles.rowValue, { color: theme.text, textAlign: 'left' }]}>
                {payment.plan_name ?? 'Plan'} · {paidWith}
              </Text>
              <Text style={[styles.rowLabel, { color: theme.textSecondary }]}>
                Paid {day(payment.paid_at)}
                {period ? ` · for ${period}` : ''}
              </Text>
            </View>
            <View style={styles.paymentEnd}>
              <Text style={[styles.price, { color: theme.text }]}>{formatMoney(payment.amount)}</Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`Receipt ${payment.receipt_number}`}
                onPress={() => WebBrowser.openBrowserAsync(receiptUrl(payment.receipt_token))}>
                <Text style={[styles.receiptLink, { color: theme.primary }]}>Receipt</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    minWidth: 0,
  },
  hero: {
    overflow: 'hidden',
    borderRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  heroArt: {
    position: 'absolute',
    pointerEvents: 'none',
    right: -14,
    top: -10,
    transform: [{ rotate: '-18deg' }],
  },
  heroLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroLabelText: {
    fontSize: 15,
    fontWeight: '700',
    opacity: 0.95,
  },
  heroBig: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: Spacing.one,
  },
  heroText: {
    fontSize: 15,
    lineHeight: 21,
    opacity: 0.92,
    maxWidth: 280,
  },
  plans: {
    gap: Spacing.two + 2,
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  planName: {
    fontSize: 17,
    fontWeight: '700',
  },
  planDetail: {
    fontSize: 13,
    marginTop: 2,
  },
  planPrice: {
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
  },
  tag: {
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Radius.md,
    padding: Spacing.three - 4,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  rowLabel: {
    fontSize: 14,
  },
  paymentEnd: {
    alignItems: 'flex-end',
    gap: 2,
  },
  receiptLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowValue: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
  included: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  includedText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
  },
});

import { router, Stack, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { StatusPill } from '@/components/status-pill';
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
import { api, ApiError, type PgBill, type PgTenantProfile } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { confirm } from '@/lib/confirm';
import { formatDate } from '@/lib/dates';
import { formatMoney, initials, memberName } from '@/lib/format';
import { paymentMethodLabel } from '@/lib/payments';
import { bedLabel, billStatus, billTitle, BILLING_CYCLES, DEPOSIT_ENTRY, ID_TYPES, ordinal, rentMessage, tenantStatus } from '@/lib/pg';
import { openWhatsApp } from '@/lib/whatsapp';

export default function TenantProfileScreen() {
  const theme = useTheme();
  const { account } = useBusiness();
  const memberId = Number(useLocalSearchParams<{ memberId: string }>().memberId);

  const fetchTenant = useCallback(
    () => Promise.all([api.pgTenant(account.id, memberId), api.pgSettings(account.id)]),
    [account.id, memberId],
  );
  const { data, setData, error, refreshing, refresh, retry } = useResource(fetchTenant);
  const [actionError, setActionError] = useState('');

  if (!data) return <LoadingState error={error} onRetry={retry} />;
  const [tenant, settings] = data;
  const tenancy = tenant.tenancy;
  const living = tenancy?.status === 'ACTIVE' || tenancy?.status === 'NOTICE';
  const status = tenantStatus(tenant);
  const due = Number(tenant.total_due);
  const params = { id: account.id, memberId: tenant.id };
  const to = (pathname: string, extra: Record<string, string | number> = {}): Href =>
    ({ pathname, params: { ...params, ...extra } }) as Href;

  async function withdrawNotice() {
    setActionError('');
    try {
      const updated = await api.pgTenantAction(account.id, { action: 'cancel_notice', member_id: tenant.id });
      setData([updated, settings]);
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setActionError(e.message);
    }
  }

  async function deletePayment(paymentId: number, amount: string) {
    const ok = await confirm('Delete payment?', `${formatMoney(amount)} will be taken off this bill and shown as due again.`, 'Delete');
    if (!ok) return;
    setActionError('');
    try {
      await api.voidPayment(account.id, paymentId);
      await refresh();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setActionError(e.message);
    }
  }

  const actions: { title: string; icon: IconName; onPress: () => void }[] = living
    ? [
        { title: 'Shift Bed', icon: 'swap', onPress: () => router.push(to('/business/[id]/pg/tenants/shift')) },
        tenancy?.status === 'NOTICE'
          ? { title: 'Withdraw Notice', icon: 'renew', onPress: withdrawNotice }
          : { title: 'Give Notice', icon: 'calendar', onPress: () => router.push(to('/business/[id]/pg/tenants/notice')) },
        { title: 'Check Out', icon: 'logoutDoor', onPress: () => router.push(to('/business/[id]/pg/tenants/checkout')) },
      ]
    : [{ title: 'Move Back In', icon: 'login', onPress: () => router.push(to('/business/[id]/pg/tenants/move-in')) }];

  const details = tenant.pg_details;
  const emergency = [details?.emergency_contact_name, details?.emergency_contact_relation, details?.emergency_contact_phone]
    .filter(Boolean)
    .join(' · ');
  const idType = ID_TYPES.find((type) => type.value === details?.id_type)?.label;
  const contacts: { label: string; value: string; icon: IconName; onPress?: () => void }[] = [
    ...(tenant.phone
      ? [
          { label: 'Mobile Number', value: tenant.phone, icon: 'phone' as const, onPress: () => Linking.openURL(`tel:${tenant.phone}`) },
          {
            label: 'WhatsApp',
            value: due > 0 ? 'Send a rent reminder' : 'Open chat',
            icon: 'chat' as const,
            onPress: () => openWhatsApp(tenant.phone!, rentMessage(tenant, account.name, settings.upi_id)),
          },
        ]
      : []),
    ...(tenant.email
      ? [{ label: 'Email Address', value: tenant.email, icon: 'mail' as const, onPress: () => Linking.openURL(`mailto:${tenant.email}`) }]
      : []),
    ...(details?.occupation ? [{ label: 'Work / College', value: details.occupation, icon: 'store' as const }] : []),
    ...(emergency
      ? [
          {
            label: 'Emergency Contact',
            value: emergency,
            icon: 'support' as const,
            onPress: details?.emergency_contact_phone
              ? () => Linking.openURL(`tel:${details.emergency_contact_phone}`)
              : undefined,
          },
        ]
      : []),
    ...(details?.permanent_address ? [{ label: 'Home Address', value: details.permanent_address, icon: 'location' as const }] : []),
    ...(idType || details?.id_last4
      ? [{ label: 'ID', value: [idType, details?.id_last4 && `ends ${details.id_last4}`].filter(Boolean).join(' · '), icon: 'badge' as const }]
      : []),
    ...(details?.vehicle_number ? [{ label: 'Vehicle', value: details.vehicle_number, icon: 'checkIn' as const }] : []),
  ];

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Tenant',
          headerRight: () => (
            <HeaderButton icon="edit" label="Edit details" onPress={() => router.push(to('/business/[id]/pg/tenants/edit'))} />
          ),
        }}
      />
      <Screen onRefresh={refresh} refreshing={refreshing}>
        {error ? <ErrorBanner message={error} /> : null}

        <View style={styles.profile}>
          <View style={[styles.avatar, { backgroundColor: living ? theme.primary : theme.textSecondary }]}>
            <Text style={[styles.avatarText, { color: theme.onPrimary }]}>{initials(memberName(tenant))}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>
              {memberName(tenant)}
            </Text>
            <Text style={[styles.code, { color: theme.textSecondary }]}>
              {tenancy ? bedLabel(tenancy) : `Tenant #${tenant.member_code}`}
            </Text>
            <View style={styles.pill}>
              <StatusPill {...status} dot />
            </View>
          </View>
        </View>

        <DueCard tenant={tenant} onRecord={() => router.push(to('/business/[id]/pg/tenants/rent'))}
          onCharge={() => router.push(to('/business/[id]/pg/tenants/charge'))} living={living} />

        {actionError ? <ErrorBanner message={actionError} /> : null}
        <View style={styles.quickRow}>
          {actions.map((action) => (
            <Pressable
              key={action.title}
              accessibilityRole="button"
              onPress={action.onPress}
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

        {tenancy ? (
          <Card title="Stay">
            <Line label="Rent" value={`${formatMoney(tenancy.rent)} a month`} />
            <Line
              label="Billed"
              value={`${BILLING_CYCLES.find((c) => c.months === tenancy.billing_cycle_months)?.label ?? `Every ${tenancy.billing_cycle_months} months`}, due on the ${ordinal(tenancy.due_day)}`}
            />
            <Line label="Joined" value={formatDate(tenancy.start_date)} />
            {tenancy.expected_end_date && tenancy.status === 'NOTICE' ? (
              <Line
                label="Leaving"
                value={`${formatDate(tenancy.expected_end_date)}${tenancy.notice_date ? ` (told on ${formatDate(tenancy.notice_date)})` : ''}`}
                tone="warning"
              />
            ) : null}
            {tenancy.end_date ? <Line label="Moved out" value={formatDate(tenancy.end_date)} /> : null}
            {tenancy.leave_reason ? <Line label="Reason" value={tenancy.leave_reason} /> : null}
          </Card>
        ) : null}

        {tenant.deposit ? (
          <Card
            title="Security Deposit"
            subtitle={
              Number(tenant.deposit.agreed) > 0
                ? `${formatMoney(tenant.deposit.held)} held of ${formatMoney(tenant.deposit.agreed)}`
                : 'No deposit taken'
            }>
            {Number(tenant.deposit.pending) > 0 ? (
              <Line label="Still to collect" value={formatMoney(tenant.deposit.pending)} tone="danger" />
            ) : null}
            {tenant.deposit_entries.map((entry) => {
              const kind = DEPOSIT_ENTRY[entry.entry_type];
              return (
                <View key={entry.id} style={styles.entry}>
                  <IconBadge name={kind.icon} tone={kind.tone} size={38} />
                  <View style={styles.flex}>
                    <Text style={[styles.entryTitle, { color: theme.text }]}>
                      {kind.label} {formatMoney(entry.amount)}
                    </Text>
                    <Text style={[styles.entryMeta, { color: theme.textSecondary }]}>
                      {[formatDate(entry.entry_date), entry.payment_method && paymentMethodLabel(entry.payment_method), entry.reason]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                </View>
              );
            })}
            {living ? (
              <View style={styles.buttonRow}>
                {Number(tenant.deposit.pending) > 0 ? (
                  <View style={styles.flex}>
                    <Button
                      title="Collect"
                      icon="savings"
                      variant="secondary"
                      onPress={() => router.push(to('/business/[id]/pg/tenants/deposit', { type: 'COLLECT' }))}
                    />
                  </View>
                ) : null}
                {Number(tenant.deposit.agreed) === 0 ? (
                  <View style={styles.flex}>
                    <Button title="Add Deposit" icon="add" variant="secondary" onPress={() => router.push(to('/business/[id]/pg/tenants/edit'))} />
                  </View>
                ) : null}
              </View>
            ) : null}
          </Card>
        ) : null}

        <Card title="Bills" subtitle={tenant.bills.length ? 'Newest first. Tap a bill for details.' : 'No bills yet.'}>
          {tenant.bills.map((bill) => (
            <BillRow
              key={bill.id}
              bill={bill}
              onDiscount={() => router.push(to('/business/[id]/pg/tenants/discount', { billId: bill.id }))}
              onDeletePayment={deletePayment}
            />
          ))}
        </Card>

        <Card
          title="Contact Information"
          action={
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => router.push(to('/business/[id]/pg/tenants/edit'))}>
              <Text style={[styles.link, { color: theme.primary }]}>Edit</Text>
            </Pressable>
          }>
          {contacts.length === 0 ? (
            <Text style={[styles.muted, { color: theme.textSecondary }]}>No contact details yet.</Text>
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

        {tenant.past_stays.length ? (
          <Card title="Earlier Stays">
            {tenant.past_stays.map((stay) => (
              <Line
                key={stay.id}
                label={bedLabel(stay)}
                value={`${formatDate(stay.start_date)} – ${stay.end_date ? formatDate(stay.end_date) : 'now'}`}
              />
            ))}
          </Card>
        ) : null}

        <Button
          title="History"
          icon="history"
          variant="secondary"
          onPress={() => router.push(to('/business/[id]/members/history'))}
        />
      </Screen>
    </>
  );
}

function DueCard({
  tenant,
  living,
  onRecord,
  onCharge,
}: {
  tenant: PgTenantProfile;
  living: boolean;
  onRecord: () => void;
  onCharge: () => void;
}) {
  const theme = useTheme();
  const due = Number(tenant.total_due);
  const advance = Number(tenant.tenancy?.advance_balance ?? 0);
  const color = due > 0 ? theme.danger : theme.success;

  return (
    <Card>
      <View style={styles.dueRow}>
        <View style={styles.flex}>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>{due > 0 ? 'Rent due' : 'Rent'}</Text>
          <Text style={[styles.dueValue, { color }]}>{due > 0 ? formatMoney(due) : 'All paid up'}</Text>
          {due > 0 && tenant.oldest_due_date ? (
            <Text style={[styles.muted, { color: theme.textSecondary }]}>Since {formatDate(tenant.oldest_due_date)}</Text>
          ) : null}
          {advance > 0 ? (
            <Text style={[styles.muted, { color: theme.success }]}>{formatMoney(advance)} paid ahead</Text>
          ) : null}
        </View>
        <IconBadge name="rupee" tone={due > 0 ? 'danger' : 'success'} size={52} />
      </View>
      {living || due > 0 ? (
        <View style={styles.buttonRow}>
          <View style={styles.flex2}>
            <Button title="Record Rent" icon="card" onPress={onRecord} />
          </View>
          {living ? (
            <View style={styles.flex}>
              <Button title="Charge" icon="add" variant="secondary" onPress={onCharge} />
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}

function BillRow({
  bill,
  onDiscount,
  onDeletePayment,
}: {
  bill: PgBill;
  onDiscount: () => void;
  onDeletePayment: (paymentId: number, amount: string) => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const status = billStatus(bill);

  return (
    <View style={[styles.bill, { borderColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={({ pressed }) => [styles.billHeader, pressed && styles.pressed]}>
        <View style={styles.flex}>
          <Text style={[styles.billTitle, { color: theme.text }]}>{billTitle(bill)}</Text>
          <Text style={[styles.muted, { color: theme.textSecondary }]}>
            {formatMoney(Number(bill.total) - Number(bill.discount))}
            {Number(bill.balance) > 0 && bill.status !== 'UNPAID' ? ` · ${formatMoney(bill.balance)} left` : ''}
          </Text>
        </View>
        <StatusPill {...status} />
        <Icon name={open ? 'chevronUp' : 'chevronDown'} color={theme.textSecondary} size={18} />
      </Pressable>
      {open ? (
        <View style={styles.billBody}>
          {bill.items.map((item) => (
            <Line key={item.id} label={item.description} value={formatMoney(item.amount)} />
          ))}
          {Number(bill.discount) > 0 ? <Line label="Discount" value={`− ${formatMoney(bill.discount)}`} tone="success" /> : null}
          {bill.payments.map((payment) => (
            <View key={payment.id} style={styles.payment}>
              <Icon name="checkCircle" color={theme.success} size={18} />
              <Text style={[styles.paymentText, { color: theme.text }]}>
                {formatMoney(payment.amount)} · {paymentMethodLabel(payment.payment_method)} ·{' '}
                {formatDate(payment.payment_date.slice(0, 10))}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete payment"
                hitSlop={8}
                onPress={() => onDeletePayment(payment.id, payment.amount)}>
                <Icon name="trash" color={theme.danger} size={18} />
              </Pressable>
            </View>
          ))}
          {Number(bill.paid) > bill.payments.reduce((sum, p) => sum + Number(p.amount), 0) ? (
            <Text style={[styles.muted, { color: theme.textSecondary }]}>Partly paid from the advance.</Text>
          ) : null}
          {bill.status !== 'PAID' || Number(bill.discount) > 0 ? (
            <Pressable accessibilityRole="button" hitSlop={8} onPress={onDiscount}>
              <Text style={[styles.link, { color: theme.primary }]}>
                {Number(bill.discount) > 0 ? 'Change discount' : 'Give a discount'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function Line({ label, value, tone }: { label: string; value: string; tone?: 'warning' | 'danger' | 'success' }) {
  const theme = useTheme();
  const color = tone ? theme[tone] : theme.text;

  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.lineValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three + 4,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
  },
  name: {
    fontSize: 25,
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
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  dueValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
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
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  lineLabel: {
    fontSize: 14,
    flexShrink: 1,
  },
  lineValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    flexShrink: 1,
  },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  entryTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  entryMeta: {
    fontSize: 13,
    marginTop: 2,
  },
  bill: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three - 4,
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  billTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  billBody: {
    gap: Spacing.two,
    marginTop: Spacing.three - 4,
  },
  payment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  paymentText: {
    flex: 1,
    fontSize: 14,
  },
  muted: {
    fontSize: 13,
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
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

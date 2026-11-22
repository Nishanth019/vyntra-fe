import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { BedPicker, findBed, type BedChoice } from '@/components/pg/bed-picker';
import { PaymentMethodPicker } from '@/components/payment-method-picker';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { DateField } from '@/components/ui/date-field';
import { useErrorAnchor } from '@/components/ui/error-scroll';
import { Icon } from '@/components/ui/icon';
import { SelectField } from '@/components/ui/select-field';
import { TextField } from '@/components/ui/text-field';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { PgRoom, PgSettings, PgStayInput } from '@/lib/api';
import { formatDate, isValidISODate, parseISODate, toISODate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { BILLING_CYCLES, ordinal } from '@/lib/pg';

export type StayValues = {
  bed: BedChoice | null;
  rent: string;
  start_date: string;
  due_day: string;
  cycle: number;
  prorate: boolean;
  deposit_amount: string;
  deposit_paid: string;
  paid_now: string;
  method: string;
  charges: { description: string; amount: string }[];
  /** Start of the last bill already paid before Manaze; 'none' = nothing paid, '' = not answered yet. */
  paid_until: string;
};

export type StayErrors = Partial<
  Record<'bed' | 'rent' | 'start_date' | 'due_day' | 'deposit_paid' | 'paid_now' | 'charges' | 'paid_until', string>
>;

/** Rent comes from the bed's room; rent is due on the joining day each month unless changed. */
export function initialStay(settings: PgSettings | null, rooms: PgRoom[], bedId?: number): StayValues {
  const bed = bedId ? findBed(rooms, bedId) : null;
  return {
    bed: bed && !bed.bed.occupant ? bed : null,
    rent: bed ? String(Number(bed.room.rent_per_bed)) : '',
    start_date: toISODate(new Date()),
    due_day: '',
    cycle: 1,
    prorate: settings?.prorate_first_bill ?? true,
    deposit_amount: '',
    deposit_paid: '',
    paid_now: '',
    method: 'CASH',
    charges: [],
    paid_until: '',
  };
}

const money = (text: string) => text.replace(/[^\d.]/g, '');

export function validateStay(values: StayValues): StayErrors {
  const errors: StayErrors = {};
  if (!values.bed) errors.bed = 'Choose a free bed.';
  if (!(Number(values.rent) >= 0) || !values.rent.trim()) errors.rent = 'Enter the monthly rent.';
  if (!isValidISODate(values.start_date)) errors.start_date = 'Choose the joining date.';
  const day = Number(values.due_day);
  if (values.due_day && !(Number.isInteger(day) && day >= 1 && day <= 28)) errors.due_day = 'Use a day from 1 to 28.';
  if (Number(values.deposit_paid || 0) > Number(values.deposit_amount || 0)) {
    errors.deposit_paid = "Can't be more than the deposit.";
  }
  if (values.charges.some((charge) => !charge.description.trim() || !(Number(charge.amount) > 0))) {
    errors.charges = 'Fill in each charge, or remove it.';
  }
  const cycles = billCycles(values);
  if (cycles.length > 1 && !values.paid_until) {
    errors.paid_until = 'Choose up to which month they have paid, or "Nothing paid".';
  }
  return errors;
}

export function stayInput(values: StayValues): PgStayInput {
  const paidUntil = paidUntilChoice(values);
  return {
    bed_id: values.bed!.bed.id,
    rent: Number(values.rent).toFixed(2),
    start_date: values.start_date,
    billing_cycle_months: values.cycle,
    prorate_first_bill: values.prorate,
    ...(values.due_day ? { due_day: Number(values.due_day) } : {}),
    ...(Number(values.deposit_amount) > 0 ? { deposit_amount: Number(values.deposit_amount).toFixed(2) } : {}),
    ...(Number(values.deposit_paid) > 0 ? { deposit_paid: Number(values.deposit_paid).toFixed(2) } : {}),
    ...(values.charges.length
      ? { charges: values.charges.map((c) => ({ description: c.description.trim(), amount: Number(c.amount).toFixed(2) })) }
      : {}),
    ...(Number(values.paid_now) > 0
      ? { payment: { amount: Number(values.paid_now).toFixed(2), payment_method: values.method } }
      : {}),
    ...(paidUntil ? { rent_paid_until: paidUntil.start } : {}),
  };
}

function addMonths(date: Date, months: number, onDay: number) {
  const first = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  return new Date(first.getFullYear(), first.getMonth(), Math.min(onDay, last));
}

/** The first bill, worked out the same way as the server (see vyntra/pg.py first_period). */
export function firstBill(values: StayValues) {
  if (!isValidISODate(values.start_date) || !values.rent) return null;
  const start = parseISODate(values.start_date);
  const dueDay = Number(values.due_day) || Math.min(start.getDate(), 28);
  const cycleRent = Number(values.rent) * values.cycle;
  let end: Date;
  let fullDays: number;
  if (start.getDate() === dueDay) {
    end = addMonths(start, values.cycle, dueDay);
    end.setDate(end.getDate() - 1);
    fullDays = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  } else {
    const nextDue = dueDay > start.getDate() ? new Date(start.getFullYear(), start.getMonth(), dueDay) : addMonths(start, 1, dueDay);
    const fullStart = addMonths(nextDue, -values.cycle, dueDay);
    end = new Date(nextDue);
    end.setDate(end.getDate() - 1);
    fullDays = Math.round((nextDue.getTime() - fullStart.getTime()) / 86_400_000);
  }
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  const partial = days < fullDays;
  const rent = partial && values.prorate ? Math.round((cycleRent * days) / fullDays) : cycleRent;
  const charges = values.charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  return { start, end: toISODate(end), days, partial, rent, total: rent + charges, dueDay };
}

type Cycle = { start: string; end: string; rent: number };

/** Every bill from joining up to today, like the server makes them (first_bill, then ensure_bills). */
export function billCycles(values: StayValues, today = new Date()): Cycle[] {
  const bill = firstBill(values);
  if (!bill) return [];
  const todayISO = toISODate(today);
  const cycleRent = Number(values.rent) * values.cycle;
  const cycles: Cycle[] = [{ start: values.start_date, end: bill.end, rent: bill.rent }];
  while (cycles.length < 240) {
    const start = parseISODate(cycles[cycles.length - 1].end);
    start.setDate(start.getDate() + 1);
    if (toISODate(start) > todayISO) break;
    const end = addMonths(start, values.cycle, bill.dueDay);
    end.setDate(end.getDate() - 1);
    cycles.push({ start: toISODate(start), end: toISODate(end), rent: cycleRent });
  }
  return cycles;
}

/** The last bill already paid before Manaze, or null. Only asked when they joined before this bill. */
export function paidUntilChoice(values: StayValues) {
  const cycles = billCycles(values);
  if (cycles.length < 2) return null;
  return cycles.find((c) => c.start === values.paid_until) ?? null;
}

const monthLabel = (iso: string) =>
  parseISODate(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

type StayFieldsProps = {
  values: StayValues;
  onChange: (values: StayValues) => void;
  errors: StayErrors;
  rooms: PgRoom[];
};

/** Bed, rent and dates, deposit and money received now: the stay part of adding a tenant. */
export function StayFields({ values, onChange, errors, rooms }: StayFieldsProps) {
  const theme = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);
  const set = (patch: Partial<StayValues>) => onChange({ ...values, ...patch });
  const bill = firstBill(values);
  const paidUntilAnchor = useErrorAnchor(errors.paid_until && !values.paid_until ? errors.paid_until : undefined);
  const chargesAnchor = useErrorAnchor(errors.charges);
  const cycles = billCycles(values);
  const paidUntil = paidUntilChoice(values);
  const charges = values.charges.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const dueNow = paidUntil
    ? cycles.filter((c) => c.start > paidUntil.start).reduce((sum, c) => sum + c.rent, 0) + charges
    : null;

  return (
    <>
      <Card title="Bed" subtitle="Which bed they take">
        <SelectField
          label="Room & Bed"
          icon="bed"
          placeholder="Choose a free bed"
          value={values.bed ? `Room ${values.bed.room.room_number} · Bed ${values.bed.bed.label}` : undefined}
          error={errors.bed}
          onPress={() => setPickerOpen(true)}
        />
      </Card>

      <Card title="Rent & Dates" subtitle="What they pay and when it falls due">
        <TextField
          label="Monthly Rent (₹)"
          required
          icon="rupee"
          keyboardType="decimal-pad"
          placeholder="0"
          value={values.rent}
          onChangeText={(text) => set({ rent: money(text) })}
          error={errors.rent}
        />
        <View style={styles.chips}>
          {BILLING_CYCLES.map((cycle) => (
            <View key={cycle.months} style={styles.chip}>
              <Chip label={cycle.label} selected={values.cycle === cycle.months} onPress={() => set({ cycle: cycle.months })} />
            </View>
          ))}
        </View>
        <DateField
          label="Joining Date"
          required
          value={values.start_date}
          onChange={(start_date) => set({ start_date })}
          error={errors.start_date}
        />
        <TextField
          label="Rent Due On (day of month)"
          icon="calendar"
          keyboardType="number-pad"
          maxLength={2}
          placeholder={bill ? String(bill.dueDay) : 'Same day as joining'}
          value={values.due_day}
          onChangeText={(text) => set({ due_day: text.replace(/\D/g, '') })}
          error={errors.due_day}
        />
        {bill?.partial ? (
          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <Text style={[styles.label, { color: theme.text }]}>Charge only the days they stay</Text>
              <Text style={[styles.hint, { color: theme.textSecondary }]}>
                They join part way through: {bill.days} days to the next due date.
              </Text>
            </View>
            <Switch
              value={values.prorate}
              onValueChange={(prorate) => set({ prorate })}
              trackColor={{ true: theme.primary, false: theme.border }}
              thumbColor={theme.onPrimary}
            />
          </View>
        ) : null}
        {bill ? (
          <View style={[styles.preview, { backgroundColor: theme.primarySoft }]}>
            <Text style={[styles.previewText, { color: theme.primary }]}>
              First bill {formatMoney(bill.total)} for {formatDate(values.start_date)} – {formatDate(bill.end)}, then{' '}
              {formatMoney(Number(values.rent) * values.cycle)} on the {ordinal(bill.dueDay)}
              {values.cycle === 1 ? ' of every month' : ` every ${values.cycle} months`}.
            </Text>
          </View>
        ) : null}
      </Card>

      {cycles.length > 1 ? (
        <Card title="Rent Already Paid" subtitle="They joined before you started using Manaze. Up to which month have they paid?">
          <View ref={paidUntilAnchor} style={styles.monthChips}>
            <Chip label="Nothing paid" selected={values.paid_until === 'none'} onPress={() => set({ paid_until: 'none' })} />
            {cycles.map((cycle, i) => (
              <Chip
                key={cycle.start}
                label={i === cycles.length - 1 ? `${monthLabel(cycle.start)} (current)` : monthLabel(cycle.start)}
                selected={paidUntil?.start === cycle.start}
                onPress={() => set({ paid_until: cycle.start })}
              />
            ))}
          </View>
          {errors.paid_until && !values.paid_until ? (
            <Text style={[styles.hint, { color: theme.danger }]}>{errors.paid_until}</Text>
          ) : values.paid_until ? (
            <View style={[styles.preview, { backgroundColor: theme.primarySoft }]}>
              <Text style={[styles.previewText, { color: theme.primary }]}>
                {paidUntil
                  ? `Rent up to ${formatDate(paidUntil.end)} is marked as paid before Manaze (not counted as money received). Due now: ${formatMoney(dueNow ?? 0)}.`
                  : `All ${cycles.length} bills since ${formatDate(values.start_date)} will be due.`}
              </Text>
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card title="Security Deposit" subtitle="Optional. Refunded when they leave.">
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField
              label="Deposit (₹)"
              keyboardType="decimal-pad"
              placeholder="0"
              value={values.deposit_amount}
              onChangeText={(text) => set({ deposit_amount: money(text) })}
            />
          </View>
          <View style={styles.flex}>
            <TextField
              label="Paid Now (₹)"
              keyboardType="decimal-pad"
              placeholder="0"
              value={values.deposit_paid}
              onChangeText={(text) => set({ deposit_paid: money(text) })}
              error={errors.deposit_paid}
            />
          </View>
        </View>
      </Card>

      <Card title="One-time Charges" subtitle="Optional, e.g. a key deposit. Added to the first bill.">
        {values.charges.map((charge, i) => (
          <View key={i} style={styles.chargeRow}>
            <View style={styles.flex2}>
              <TextField
                label="Charge"
                hideLabel
                placeholder="e.g. Key deposit"
                value={charge.description}
                onChangeText={(text) =>
                  set({ charges: values.charges.map((c, j) => (j === i ? { ...c, description: text } : c)) })
                }
              />
            </View>
            <View style={styles.flex}>
              <TextField
                label="Amount"
                hideLabel
                placeholder="₹"
                keyboardType="decimal-pad"
                value={charge.amount}
                onChangeText={(text) =>
                  set({ charges: values.charges.map((c, j) => (j === i ? { ...c, amount: money(text) } : c)) })
                }
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove charge"
              hitSlop={8}
              onPress={() => set({ charges: values.charges.filter((_, j) => j !== i) })}>
              <Icon name="close" color={theme.danger} size={22} />
            </Pressable>
          </View>
        ))}
        {errors.charges ? (
          <View ref={chargesAnchor}>
            <Text style={[styles.hint, { color: theme.danger }]}>{errors.charges}</Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => set({ charges: [...values.charges, { description: '', amount: '' }] })}
          style={({ pressed }) => [styles.addCharge, { borderColor: theme.primary }, pressed && styles.pressed]}>
          <Icon name="add" color={theme.primary} size={18} />
          <Text style={[styles.addChargeText, { color: theme.primary }]}>Add Charge</Text>
        </Pressable>
      </Card>

      <Card title="Rent Received Now" subtitle="Optional. Anything over the first bill is kept as advance.">
        <TextField
          label="Amount (₹)"
          icon="rupee"
          keyboardType="decimal-pad"
          placeholder={bill ? String(bill.total) : '0'}
          value={values.paid_now}
          onChangeText={(text) => set({ paid_now: money(text) })}
          error={errors.paid_now}
        />
        {bill && !values.paid_now && cycles.length < 2 ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => set({ paid_now: String(bill.total) })}>
            <Text style={[styles.link, { color: theme.primary }]}>Paid in full ({formatMoney(bill.total)})</Text>
          </Pressable>
        ) : null}
        {dueNow ? (
          <Pressable accessibilityRole="button" hitSlop={8} onPress={() => set({ paid_now: String(dueNow) })}>
            <Text style={[styles.link, { color: theme.primary }]}>{`Paid what's due now (${formatMoney(dueNow)})`}</Text>
          </Pressable>
        ) : null}
        {Number(values.paid_now) > 0 ? (
          <PaymentMethodPicker value={values.method} onChange={(method) => set({ method })} />
        ) : null}
      </Card>

      <BedPicker
        visible={pickerOpen}
        rooms={rooms}
        onClose={() => setPickerOpen(false)}
        onSelect={(bed) => set({ bed, rent: String(Number(bed.room.rent_per_bed)) })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  flex2: {
    flex: 2,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two + 2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  monthChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    fontSize: 13,
    marginTop: 2,
  },
  preview: {
    padding: Spacing.three,
    borderRadius: Radius.md,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  addCharge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    height: 46,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
  },
  addChargeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.7,
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
  },
});

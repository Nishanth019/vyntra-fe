import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { PaymentMethodPicker } from '@/components/payment-method-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { DateField } from '@/components/ui/date-field';
import { ErrorBanner } from '@/components/ui/error-banner';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { ApiError, type Expense, type ExpenseCategory, type ExpenseInput } from '@/lib/api';
import { isValidISODate, toISODate } from '@/lib/dates';
import { EXPENSE_CATEGORIES } from '@/lib/expenses';

type ExpenseFormProps = {
  expense?: Expense;
  onSubmit: (input: ExpenseInput) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function ExpenseForm({ expense, onSubmit, onDelete }: ExpenseFormProps) {
  const theme = useTheme();
  const [category, setCategory] = useState<ExpenseCategory | ''>(expense?.category ?? '');
  const [amount, setAmount] = useState(expense ? String(Number(expense.amount)) : '');
  const [date, setDate] = useState(expense?.expense_date ?? toISODate(new Date()));
  const [description, setDescription] = useState(expense?.description ?? '');
  const [vendor, setVendor] = useState(expense?.vendor ?? '');
  const [method, setMethod] = useState(expense?.payment_method ?? 'CASH');
  const [notes, setNotes] = useState(expense?.notes ?? '');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Salary payments live in Staff Salaries; they can only be looked at here.
  const locked = expense?.is_salary ?? false;
  const categories = EXPENSE_CATEGORIES.filter((c) => c.value !== 'SALARY' || expense?.category === 'SALARY');

  async function submit() {
    const next: Record<string, string> = {};
    if (!category) next.category = 'Choose a category.';
    if (!(Number(amount) > 0)) next.amount = 'Enter the amount.';
    if (!description.trim()) next.description = 'Say what it was for.';
    if (!isValidISODate(date)) next.expense_date = 'Choose the date.';
    setErrors(next);
    setFormError(next.category ?? '');
    if (Object.keys(next).length || !category) return;
    setSubmitting(true);
    try {
      await onSubmit({
        category,
        amount: Number(amount).toFixed(2),
        expense_date: date,
        description: description.trim(),
        vendor: vendor.trim(),
        payment_method: method,
        notes: notes.trim(),
      });
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setErrors(e.fieldErrors);
      setFormError(e.message || Object.values(e.fieldErrors)[0] || '');
      setSubmitting(false);
    }
  }

  async function remove() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
    } catch (e) {
      if (!(e instanceof ApiError)) throw e;
      setFormError(e.message);
      setDeleting(false);
    }
  }

  return (
    <Screen>
      {locked ? <ErrorBanner message="This is a staff salary. Change or undo it from Staff Salaries." /> : null}
      {formError ? <ErrorBanner message={formError} /> : null}
      <Card title="Category">
        <View style={styles.chips}>
          {categories.map((item) => (
            <View key={item.value} style={styles.chip}>
              <Chip label={item.label} icon={item.icon} selected={category === item.value} onPress={() => !locked && setCategory(item.value)} />
            </View>
          ))}
        </View>
      </Card>
      <Card title="Details">
        <TextField
          label="Amount (₹)"
          required
          icon="rupee"
          keyboardType="decimal-pad"
          placeholder="0"
          editable={!locked}
          value={amount}
          onChangeText={(text) => setAmount(text.replace(/[^\d.]/g, ''))}
          error={errors.amount}
        />
        <TextField
          label="For"
          required
          icon="document"
          placeholder="e.g. October electricity bill"
          editable={!locked}
          value={description}
          onChangeText={setDescription}
          error={errors.description}
        />
        <DateField label="Date" required value={date} onChange={setDate} maximumDate={new Date()} error={errors.expense_date} />
        <TextField label="Paid To (Optional)" icon="store" placeholder="e.g. TSSPDCL, plumber" editable={!locked} value={vendor} onChangeText={setVendor} />
        <PaymentMethodPicker value={method} onChange={(value) => !locked && setMethod(value)} />
        <TextField label="Notes (Optional)" multiline maxLength={1000} editable={!locked} value={notes} onChangeText={setNotes} />
      </Card>
      {locked ? null : (
        <Button title={expense ? 'Save Expense' : 'Add Expense'} icon="check" loading={submitting} onPress={submit} />
      )}
      {onDelete && !locked ? (
        <Button
          title="Delete Expense"
          icon="trash"
          variant="danger"
          loading={deleting}
          style={{ backgroundColor: theme.dangerSoft }}
          onPress={remove}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    flexBasis: '47%',
    flexGrow: 1,
  },
});

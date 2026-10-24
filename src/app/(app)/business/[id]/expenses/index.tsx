import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { MonthStepper } from '@/components/month-stepper';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ErrorBanner } from '@/components/ui/error-banner';
import { HeaderButton } from '@/components/ui/header-button';
import { Icon } from '@/components/ui/icon';
import { IconBadge } from '@/components/ui/icon-badge';
import { EmptyState } from '@/components/ui/states';
import { Radius, shadow, Spacing } from '@/constants/theme';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { useTheme } from '@/hooks/use-theme';
import { api, type Expense, type ExpenseCategory, type ExpenseList } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { formatDate } from '@/lib/dates';
import { expenseCategory, monthRange } from '@/lib/expenses';
import { formatMoney } from '@/lib/format';
import { paymentMethodLabel } from '@/lib/payments';

/** A month of expenses: the total, by category, and each one. */
export default function ExpensesScreen() {
  const theme = useTheme();
  const { account } = useBusiness();
  const [offset, setOffset] = useState(0);
  const [category, setCategory] = useState<ExpenseCategory | undefined>();
  const [summary, setSummary] = useState<Pick<ExpenseList, 'total' | 'by_category'> | null>(null);
  const range = monthRange(offset);

  const fetchPage = useCallback(
    async (page: number) => {
      const result = await api.expenses({
        business_account_id: account.id,
        date_from: range.from,
        date_to: range.to,
        category,
        page,
      });
      if (page === 1) setSummary({ total: result.total, by_category: result.by_category });
      return result;
    },
    [account.id, range.from, range.to, category],
  );
  const list = usePaginatedList(fetchPage);
  const params = { id: account.id };
  const addExpense = () => router.push({ pathname: '/business/[id]/expenses/new', params });

  function changeMonth(next: number) {
    list.reset();
    setCategory(undefined);
    setOffset(next);
  }

  return (
    <>
      <Stack.Screen options={{ headerRight: () => <HeaderButton icon="add" label="Add expense" filled onPress={addExpense} /> }} />
      <FlatList
        data={list.items ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        onEndReached={list.loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={list.refreshing} onRefresh={list.refresh} tintColor={theme.primary} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <MonthStepper label={range.label} offset={offset} onChange={changeMonth} />
            <View style={[styles.total, { backgroundColor: theme.warningSoft }]}>
              <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
                {category ? `${expenseCategory(category).label} in ${range.label}` : `Spent in ${range.label}`}
              </Text>
              <Text style={[styles.totalValue, { color: theme.text }]}>{formatMoney(summary?.total ?? 0)}</Text>
            </View>
            {summary?.by_category.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                <Chip pill label="All" selected={!category} onPress={() => { list.reset(); setCategory(undefined); }} />
                {summary.by_category.map((row) => (
                  <Chip
                    key={row.category}
                    pill
                    label={`${expenseCategory(row.category).label} ${formatMoney(row.total)}`}
                    selected={category === row.category}
                    onPress={() => {
                      list.reset();
                      setCategory(row.category);
                    }}
                  />
                ))}
              </ScrollView>
            ) : null}
            {list.error ? <ErrorBanner message={list.error} /> : null}
          </View>
        }
        renderItem={({ item }) => <ExpenseRow expense={item} />}
        ListFooterComponent={list.loadingMore ? <ActivityIndicator color={theme.primary} /> : null}
        ListEmptyComponent={
          !list.items ? (
            list.error ? null : <ActivityIndicator color={theme.primary} size="large" style={styles.loader} />
          ) : (
            <EmptyState
              icon="wallet"
              title="No expenses"
              message={`Nothing recorded for ${range.label} yet.`}
              action={offset === 0 ? <Button title="Add Expense" icon="add" onPress={addExpense} /> : null}
            />
          )
        }
      />
    </>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  const theme = useTheme();
  const { account } = useBusiness();
  const category = expenseCategory(expense.category);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: '/business/[id]/expenses/[expenseId]', params: { id: account.id, expenseId: expense.id } })
      }
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.surface, borderColor: theme.border },
        shadow(theme.shadow),
        pressed && styles.pressed,
      ]}>
      <IconBadge name={category.icon} tone="warning" size={44} />
      <View style={styles.flex}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
          {expense.description}
        </Text>
        <Text style={[styles.meta, { color: theme.textSecondary }]} numberOfLines={1}>
          {[category.label, formatDate(expense.expense_date), expense.payment_method && paymentMethodLabel(expense.payment_method), expense.vendor]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      </View>
      <Text style={[styles.amount, { color: theme.text }]}>{formatMoney(expense.amount)}</Text>
      <Icon name="chevronRight" color={theme.textSecondary} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    flexGrow: 1,
    gap: Spacing.three - 4,
    paddingHorizontal: Spacing.three + 4,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
  },
  header: {
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  total: {
    padding: Spacing.three + 2,
    borderRadius: Radius.lg,
    gap: 2,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  chips: {
    gap: Spacing.two,
  },
  loader: {
    marginTop: Spacing.six,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
  },
});

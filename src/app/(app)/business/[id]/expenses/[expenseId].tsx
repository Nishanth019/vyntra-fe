import { router, useLocalSearchParams } from 'expo-router';
import { useCallback } from 'react';

import { ExpenseForm } from '@/components/expense-form';
import { LoadingState } from '@/components/ui/states';
import { useResource } from '@/hooks/use-resource';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';
import { confirm } from '@/lib/confirm';

export default function EditExpenseScreen() {
  const { account } = useBusiness();
  const expenseId = Number(useLocalSearchParams<{ expenseId: string }>().expenseId);

  const fetchExpense = useCallback(() => api.expense(account.id, expenseId), [account.id, expenseId]);
  const { data: expense, error, retry } = useResource(fetchExpense);

  if (!expense) return <LoadingState error={error} onRetry={retry} />;

  return (
    <ExpenseForm
      expense={expense}
      onSubmit={async (input) => {
        await api.updateExpense(account.id, expense.id, input);
        router.back();
      }}
      onDelete={async () => {
        const ok = await confirm('Delete expense?', `${expense.description} will be removed.`, 'Delete');
        if (!ok) return;
        await api.deleteExpense(account.id, expense.id);
        router.back();
      }}
    />
  );
}

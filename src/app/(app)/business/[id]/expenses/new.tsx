import { router } from 'expo-router';

import { ExpenseForm } from '@/components/expense-form';
import { api } from '@/lib/api';
import { useBusiness } from '@/lib/business';

export default function NewExpenseScreen() {
  const { account } = useBusiness();
  return (
    <ExpenseForm
      onSubmit={async (input) => {
        await api.createExpense(account.id, input);
        router.back();
      }}
    />
  );
}

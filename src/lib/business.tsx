import { createContext, use } from 'react';

import type { BusinessAccount } from '@/lib/api';

type BusinessContextValue = {
  account: BusinessAccount;
  /** Replaces the account after it's edited, so every screen shows the new details. */
  setAccount: (account: BusinessAccount) => void;
};

export const BusinessContext = createContext<BusinessContextValue | null>(null);

/** The business account whose screens are open. Only available under business/[id]. */
export function useBusiness() {
  const value = use(BusinessContext);
  if (!value) throw new Error('useBusiness must be used inside the business/[id] layout');
  return value;
}

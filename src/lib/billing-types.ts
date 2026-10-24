import type { SubscriptionInfo, SubscriptionPlan } from '@/lib/api';

/** How this device pays for a Vyntra plan: Razorpay, in the app and on the website. */
export type Checkout = {
  /** The store this device pays through, or null when buying isn't possible here. */
  store: 'google_play' | 'razorpay' | null;
  /** False while the store is still loading its products. */
  ready: boolean;
  /** Prices shown by the store, by plan code (Google Play shows its own localized price). */
  prices: Record<string, string>;
  /** Resolves with the updated subscription, or null when the buyer closes the payment window. */
  buy: (plan: SubscriptionPlan) => Promise<SubscriptionInfo | null>;
  /** Opens the store's own subscription management, where there is one. */
  manage: (() => Promise<void>) | null;
  /** Shown instead of the buy buttons when `store` is null. */
  unavailableReason: string;
};

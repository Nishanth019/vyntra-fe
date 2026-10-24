/**
 * Buying a Vyntra plan in the app, on Razorpay's hosted payment page (UPI AutoPay, cards, net banking).
 * The page opens in an in-app browser; Razorpay's webhook activates the plan on the backend, and we check for it
 * when the buyer comes back. The website version, billing.web.ts, uses Razorpay Checkout instead.
 */
import * as WebBrowser from 'expo-web-browser';

import { api, type SubscriptionInfo, type SubscriptionPlan } from '@/lib/api';

import type { Checkout } from './billing-types';

export type { Checkout } from './billing-types';

// The webhook usually lands within a few seconds of paying; keep checking for a little while after that.
const CONFIRM_ATTEMPTS = 8;
const CONFIRM_DELAY_MS = 2500;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Waits for the backend to see the new paid plan, or gives up (the buyer probably closed the page). */
async function waitForActivation() {
  for (let attempt = 0; attempt < CONFIRM_ATTEMPTS; attempt++) {
    const info = await api.subscription();
    if (info.state === 'ACTIVE') return info;
    await wait(CONFIRM_DELAY_MS);
  }
  return null;
}

// The second argument (login id) is only needed by store billing; Razorpay gets it from the backend.
export function useCheckout(info: SubscriptionInfo | null, _adminId?: number): Checkout {
  const enabled = Boolean(info?.payment_options.razorpay);

  async function buy(plan: SubscriptionPlan) {
    const checkout = await api.startRazorpayCheckout(plan.code);
    if (!checkout.payment_url) throw new Error("Couldn't open the payment page. Please try again.");
    await WebBrowser.openBrowserAsync(checkout.payment_url);
    return waitForActivation();
  }

  return {
    store: enabled ? 'razorpay' : null,
    ready: true,
    prices: {},
    buy,
    manage: null,
    unavailableReason: 'Online payment is being set up. Please check back soon.',
  };
}

/**
 * Buying a Manaze plan on the website, with Razorpay Checkout (UPI AutoPay, cards, net banking).
 * The app opens Razorpay's hosted payment page instead (billing.ts).
 */
import { useEffect, useState } from 'react';

import { Colors } from '@/constants/theme';
import { api, type RazorpayResult, type SubscriptionInfo, type SubscriptionPlan } from '@/lib/api';

import type { Checkout } from './billing-types';

export type { Checkout } from './billing-types';

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (result: RazorpayResult) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

let scriptLoading: Promise<void> | null = null;

function loadCheckoutScript() {
  scriptLoading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptLoading = null;
      reject(new Error("Couldn't load the payment page. Check your internet connection."));
    };
    document.body.appendChild(script);
  });
  return scriptLoading;
}

// The second argument (login id) is only needed by Google Play; Razorpay gets it from the backend.
export function useCheckout(info: SubscriptionInfo | null, _adminId?: number): Checkout {
  const enabled = Boolean(info?.payment_options.razorpay);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    loadCheckoutScript()
      .catch(() => {})
      .finally(() => setReady(true));
  }, [enabled]);

  async function buy(plan: SubscriptionPlan) {
    await loadCheckoutScript();
    const checkout = await api.startRazorpayCheckout(plan.code);
    const Razorpay = window.Razorpay;
    if (!Razorpay) throw new Error("Couldn't load the payment page. Please refresh and try again.");

    return new Promise<SubscriptionInfo | null>((resolve, reject) => {
      new Razorpay({
        key: checkout.key_id,
        subscription_id: checkout.subscription_id,
        name: 'Manaze',
        description: `${plan.name} plan`,
        prefill: { name: checkout.name, email: checkout.email, contact: checkout.contact },
        theme: { color: Colors.light.primary },
        handler: (result) => api.confirmRazorpay(result).then(resolve, reject),
        modal: { ondismiss: () => resolve(null) },
      }).open();
    });
  }

  return {
    store: enabled ? 'razorpay' : null,
    ready: !enabled || ready,
    prices: {},
    buy,
    manage: null,
    unavailableReason: 'Online payment is being set up. Please check back soon.',
  };
}

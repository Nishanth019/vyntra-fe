/**
 * Buying a Vyntra plan in the Android app, through Google Play Billing (Google requires it for in-app
 * digital subscriptions). The website version, billing.web.ts, uses Razorpay instead.
 */
import {
  deepLinkToSubscriptions,
  endConnection,
  fetchProducts,
  finishTransaction,
  initConnection,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type ProductSubscriptionAndroid,
  type Purchase,
} from 'expo-iap';
import Constants from 'expo-constants';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { api, type SubscriptionInfo, type SubscriptionPlan } from '@/lib/api';

import type { Checkout } from './billing-types';

export type { Checkout } from './billing-types';

const PACKAGE_NAME = Constants.expoConfig?.android?.package ?? 'com.vyntra.app';

type Pending = { resolve: (info: SubscriptionInfo | null) => void; reject: (error: Error) => void };

export function useCheckout(info: SubscriptionInfo | null, adminId: number | undefined): Checkout {
  const productId = info?.payment_options.google_play_product_id;
  const enabled = Platform.OS === 'android' && Boolean(info?.payment_options.google_play && productId);

  const [product, setProduct] = useState<ProductSubscriptionAndroid | null>(null);
  const [ready, setReady] = useState(false);
  const pending = useRef<Pending | null>(null);

  useEffect(() => {
    if (!enabled || !productId) return;
    let active = true;

    // Purchases arrive here, including ones left unconfirmed when the app was closed mid-purchase.
    const updated = purchaseUpdatedListener(async (purchase: Purchase) => {
      try {
        if (!purchase.purchaseToken) return;
        const confirmed = await api.confirmGooglePlay(purchase.purchaseToken);
        await finishTransaction({ purchase, isConsumable: false });
        pending.current?.resolve(confirmed);
      } catch (error) {
        pending.current?.reject(error instanceof Error ? error : new Error(String(error)));
      } finally {
        pending.current = null;
      }
    });
    const failed = purchaseErrorListener((error) => {
      if (isUserCancelledError(error)) pending.current?.resolve(null);
      else pending.current?.reject(new Error(error.message || 'The purchase did not go through.'));
      pending.current = null;
    });

    (async () => {
      try {
        await initConnection();
        const products = await fetchProducts({ skus: [productId], type: 'subs' });
        const found = (products ?? []).find((item) => item.id === productId) as ProductSubscriptionAndroid | undefined;
        if (active) setProduct(found ?? null);
      } catch {
        if (active) setProduct(null);
      } finally {
        if (active) setReady(true);
      }
    })();

    return () => {
      active = false;
      updated.remove();
      failed.remove();
      endConnection().catch(() => {});
    };
  }, [enabled, productId]);

  function offerFor(plan: SubscriptionPlan) {
    return product?.subscriptionOffers.find((offer) => offer.basePlanIdAndroid === plan.google_base_plan_id);
  }

  const prices: Record<string, string> = {};
  for (const plan of info?.plans ?? []) {
    const offer = offerFor(plan);
    if (offer) prices[plan.code] = offer.displayPrice;
  }

  async function buy(plan: SubscriptionPlan) {
    const offerToken = offerFor(plan)?.offerTokenAndroid;
    if (!productId || !offerToken) throw new Error('This plan is not available in Google Play right now.');
    return new Promise<SubscriptionInfo | null>((resolve, reject) => {
      pending.current = { resolve, reject };
      requestPurchase({
        type: 'subs',
        request: {
          google: {
            skus: [productId],
            subscriptionOffers: [{ sku: productId, offerToken }],
            // Lets the backend match the purchase to this login.
            obfuscatedAccountId: adminId ? String(adminId) : undefined,
          },
        },
      }).catch((error: Error) => {
        pending.current = null;
        reject(error);
      });
    });
  }

  return {
    store: enabled && product ? 'google_play' : null,
    ready: !enabled || ready,
    prices,
    buy,
    manage: () => deepLinkToSubscriptions({ skuAndroid: productId, packageNameAndroid: PACKAGE_NAME }),
    unavailableReason:
      Platform.OS === 'ios'
        ? 'Subscriptions on iPhone are coming soon.'
        : 'Payments in the app are not available yet. Please try again later.',
  };
}

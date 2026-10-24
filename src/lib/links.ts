const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://vyntra-api-3ckz6.ondigitalocean.app/api/v1';
const SITE_URL = API_URL.replace(/\/api\/v1\/?$/, '');

/** Public pages served by the backend (needed for the Play Store listing too). */
export const PRIVACY_POLICY_URL = `${SITE_URL}/privacy/`;
export const ACCOUNT_DELETION_URL = `${SITE_URL}/account-deletion/`;

/** Policy pages Razorpay requires to be linked from the website. */
export const POLICY_LINKS = [
  { label: 'Terms', url: `${SITE_URL}/terms/` },
  { label: 'Privacy', url: PRIVACY_POLICY_URL },
  { label: 'Refunds', url: `${SITE_URL}/refunds/` },
  { label: 'Shipping', url: `${SITE_URL}/shipping/` },
  { label: 'Contact', url: `${SITE_URL}/contact/` },
];

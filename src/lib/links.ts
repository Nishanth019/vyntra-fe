const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://vyntra-api-3ckz6.ondigitalocean.app/api/v1';
const SITE_URL = API_URL.replace(/\/api\/v1\/?$/, '');

/** Public pages served by the backend (needed for the Play Store listing too). */
export const PRIVACY_POLICY_URL = `${SITE_URL}/privacy/`;
export const ACCOUNT_DELETION_URL = `${SITE_URL}/account-deletion/`;

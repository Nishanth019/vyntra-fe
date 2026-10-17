/** Same rule as the server: an Indian mobile, 10 digits starting with 6–9 (+91 / 0 and spaces allowed). */

export const MOBILE_ERROR = 'Enter a valid 10-digit mobile number.';

/** e.g. "+91 98765-43210" → "9876543210". */
export function normalizeMobile(text: string) {
  return text.replace(/[\s-]/g, '').replace(/^(\+91|91(?=\d{10}$)|0(?=\d{10}$))/, '');
}

export function isValidMobile(text: string) {
  return /^[6-9]\d{9}$/.test(normalizeMobile(text));
}

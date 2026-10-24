const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://vyntra-api-3ckz6.ondigitalocean.app/api/v1';

export type Admin = {
  id: number;
  full_name: string;
  mobile_no: string;
  email: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

export type AuthResponse = {
  admin: Admin;
  access_token: string;
};

export type BusinessType = {
  id: number;
  name: string;
  code: string;
  description: string | null;
};

export type BusinessAccount = {
  id: number;
  business_type: BusinessType;
  name: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  address_lat: string | null;
  address_lng: string | null;
  contact_no: string | null;
  email: string | null;
  website: string | null;
  terms_and_conditions: string | null;
  is_active: boolean;
  /** Who owns the business and whether it's read-only because the owner's subscription ended. */
  access: BusinessAccess | null;
  created_at: string;
  updated_at: string;
};

export type BusinessAccess = {
  is_owner: boolean;
  owner_name: string | null;
  read_only: boolean;
};

/** Create needs `business_type_id`; updates are partial and can't change the type. */
export type BusinessAccountInput = {
  business_type_id?: number;
  name?: string;
  contact_no?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  website?: string;
  terms_and_conditions?: string;
};

export type DurationType = {
  id: number;
  name: string;
  code: 'DAY' | 'MONTH' | 'YEAR' | (string & {});
};

export type MembershipPlan = {
  id: number;
  name: string;
  duration_type: DurationType;
  duration_value: number;
  amount: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type MembershipPlanInput = {
  name?: string;
  duration_type_id?: number;
  duration_value?: number;
  amount?: string;
  description?: string;
  is_active?: boolean;
};

export type Payment = {
  id: number;
  amount: string;
  payment_date: string;
  payment_method: string;
  transaction_reference: string | null;
  notes: string | null;
  created_at: string;
};

export type PaymentInput = {
  amount: string;
  payment_method: string;
  transaction_reference?: string;
  notes?: string;
};

/** A standalone payment row (from the /payments/ endpoint); carries its member/membership refs. */
export type PaymentRecord = Payment & {
  member_id: number;
  membership_id: number | null;
  is_active: boolean;
};

/** Record a recurring payment. `membership_id` defaults to the member's active membership. */
export type PaymentRecordInput = {
  member_id: number;
  amount: string;
  payment_method: string;
  membership_id?: number;
  payment_date?: string;
  transaction_reference?: string;
  notes?: string;
};

export type PaymentQuery = {
  business_account_id: number;
  member_id?: number;
  payment_date_from?: string;
  payment_date_to?: string;
  page?: number;
};

/**
 * A membership, with its dues breakdown and the payments recorded against it (newest first).
 * `net_payable = amount - discount`; `balance = net_payable - amount_paid` (the dues).
 */
export type Membership = {
  id: number;
  membership_plan: MembershipPlan;
  start_date: string;
  end_date: string;
  amount: string;
  discount: string;
  net_payable: string;
  amount_paid: string;
  balance: string;
  is_active: boolean;
  payments: Payment[];
};

/** Gym-specific profile: emergency contact and address (all optional). */
export type GymDetails = {
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_address: string | null;
};

/** Where a member stands today. `upcoming`: their only current plan starts later. */
export type MemberStatus = 'live' | 'upcoming' | 'expired' | 'no_plan' | 'inactive';

export type Member = {
  id: number;
  member_code: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  is_active: boolean;
  gym_details: GymDetails | null;
  /** The current plan (running, last expired, or not started yet). */
  membership: Membership | null;
  /** A renewed-early plan that starts after the current one. */
  next_membership: Membership | null;
  status: MemberStatus;
  /** Unpaid balance across all memberships, past ones included. */
  total_due: string;
  created_at: string;
  updated_at: string;
};

/** Create needs `membership_plan_id` (+ optional start date, discount and first payment). */
export type MemberInput = {
  member_code?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  date_of_birth?: string | null;
  gender?: string;
  is_active?: boolean;
  membership_plan_id?: number;
  start_date?: string;
  discount?: string;
  payment?: PaymentInput;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_address?: string;
};

/** Collection totals and outstanding dues for a business. */
export type CollectionsSummary = {
  today_collection: string;
  month_collection: string;
  outstanding_dues: string;
  period_collection?: string;
};

export type Staff = {
  id: number;
  employee_code: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  role: string | null;
  /** Monthly salary, used by Staff Salaries. */
  salary: string | null;
  joining_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type StaffInput = {
  employee_code?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  role?: string;
  salary?: string | null;
  is_active?: boolean;
};

export type StaffSalary = {
  id: number;
  salary_month: string;
  amount: string;
  paid_on: string | null;
  payment_method: string | null;
  expense_id: number | null;
};

/** One month of salaries: every active staff member with what was paid (null = not paid yet). */
export type SalaryMonth = {
  month: string;
  results: { staff: Staff; salary: StaffSalary | null }[];
  paid: string;
  pending: string;
};

export type ExpenseCategory =
  | 'RENT' | 'ELECTRICITY' | 'WATER' | 'INTERNET' | 'SALARY' | 'MAINTENANCE' | 'REPAIRS' | 'EQUIPMENT'
  | 'GROCERIES' | 'CLEANING' | 'SUPPLIES' | 'MARKETING' | 'TAXES' | 'OTHER';

export type Expense = {
  id: number;
  category: ExpenseCategory;
  amount: string;
  expense_date: string;
  description: string;
  vendor: string | null;
  payment_method: string | null;
  notes: string | null;
  /** Made by paying a staff salary; changed from Staff Salaries, not here. */
  is_salary: boolean;
  created_at: string;
};

export type ExpenseInput = {
  category?: ExpenseCategory;
  amount?: string;
  expense_date?: string;
  description?: string;
  vendor?: string;
  payment_method?: string | null;
  notes?: string;
};

export type ExpenseList = Paginated<Expense> & {
  /** Total of the period (and category, when filtered). */
  total: string;
  by_category: { category: ExpenseCategory; total: string }[];
};

export type ExpenseQuery = {
  business_account_id: number;
  date_from?: string;
  date_to?: string;
  category?: ExpenseCategory;
  page?: number;
};

// ----- PG businesses ------------------------------------------------------------------------------

export type PgSettings = {
  property_type: 'PG' | 'HOSTEL' | 'COLIVING';
  gender: 'MALE' | 'FEMALE' | 'COED';
  facilities: string[] | null;
  default_due_day: number;
  prorate_first_bill: boolean;
  notice_period_days: number;
  eb_unit_price: string | null;
  upi_id: string | null;
  house_rules: string | null;
};

export type PgOccupant = {
  member_id: number;
  name: string;
  phone: string | null;
  tenancy_status: 'ACTIVE' | 'NOTICE';
  expected_end_date: string | null;
  rent: string;
};

export type PgBed = { id: number; label: string; occupant: PgOccupant | null };

export type PgRoom = {
  id: number;
  room_number: string;
  floor: string | null;
  is_ac: boolean;
  rent_per_bed: string;
  amenities: string[] | null;
  notes: string | null;
  beds: PgBed[];
  created_at: string;
};

export type PgRoomInput = {
  room_number?: string;
  floor?: string;
  is_ac?: boolean;
  rent_per_bed?: string;
  amenities?: string[];
  notes?: string;
  bed_count?: number;
};

export type PgTenantDetails = {
  occupation: string | null;
  permanent_address: string | null;
  id_type: string | null;
  id_last4: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  vehicle_number: string | null;
};

/** ACTIVE: living here · NOTICE: leaving on expected_end_date · ENDED: moved out on end_date. */
export type PgTenancyStatus = 'ACTIVE' | 'NOTICE' | 'ENDED';

export type PgTenancy = {
  id: number;
  status: PgTenancyStatus;
  bed: { id: number; label: string; room: { id: number; room_number: string; floor: string | null; is_ac: boolean } };
  /** Monthly rent. */
  rent: string;
  billing_cycle_months: number;
  due_day: number;
  start_date: string;
  notice_date: string | null;
  expected_end_date: string | null;
  end_date: string | null;
  leave_reason: string | null;
  deposit_amount: string;
  /** Rent paid ahead, used up by the next bills. */
  advance_balance: string;
};

export type PgTenant = {
  id: number;
  member_code: string;
  first_name: string;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  gender: string | null;
  date_of_birth: string | null;
  is_active: boolean;
  pg_details: PgTenantDetails | null;
  tenancy: PgTenancy | null;
  total_due: string;
  /** Due date of the oldest unpaid bill. */
  oldest_due_date: string | null;
  created_at: string;
};

export type PgBill = {
  id: number;
  period_start: string;
  period_end: string;
  due_date: string;
  total: string;
  discount: string;
  paid: string;
  balance: string;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  is_overdue: boolean;
  items: { id: number; item_type: 'RENT' | 'CHARGE' | 'ADJUSTMENT'; description: string; amount: string }[];
  payments: Payment[];
};

export type PgDeposit = {
  agreed: string;
  collected: string;
  refunded: string;
  deducted: string;
  held: string;
  pending: string;
};

export type PgDepositEntry = {
  id: number;
  entry_type: 'COLLECT' | 'REFUND' | 'DEDUCT';
  amount: string;
  entry_date: string;
  payment_method: string | null;
  reason: string | null;
  created_at: string;
};

/** A tenant with everything their profile shows. */
export type PgTenantProfile = PgTenant & {
  bills: PgBill[];
  deposit: PgDeposit | null;
  deposit_entries: PgDepositEntry[];
  past_stays: PgTenancy[];
  /** Set right after a checkout. */
  checkout?: { deposit_refunded: string; advance_refunded: string; dues: string };
};

/** Rent and dates of a stay (moving in or back in). */
export type PgStayInput = {
  bed_id: number;
  rent?: string;
  billing_cycle_months?: number;
  due_day?: number;
  start_date?: string;
  prorate_first_bill?: boolean;
  deposit_amount?: string;
  deposit_paid?: string;
  charges?: { description: string; amount: string }[];
  payment?: PaymentInput;
};

export type PgTenantInput = Partial<PgStayInput> & {
  member_code?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  gender?: string;
  date_of_birth?: string | null;
} & Partial<{ [K in keyof PgTenantDetails]: string }>;

export type PgTenantQuery = {
  business_account_id: number;
  status?: 'living' | 'active' | 'notice' | 'past';
  search?: string;
  has_dues?: boolean;
  page?: number;
};

export type PgTenantAction =
  | { action: 'shift'; member_id: number; bed_id: number; rent?: string }
  | { action: 'notice'; member_id: number; leave_date: string; reason?: string }
  | { action: 'cancel_notice'; member_id: number }
  | {
      action: 'checkout';
      member_id: number;
      leave_date: string;
      reason?: string;
      prorate_last_bill?: boolean;
      dues_from_deposit?: boolean;
      deduction?: string;
      deduction_reason?: string;
      refund_method?: string;
    }
  | ({ action: 'move_in'; member_id: number } & PgStayInput);

export type PgCheckoutPreview = { leave_date: string; dues: string; advance: string; deposit_held: string };

export type PgDashboard = {
  beds: { total: number; occupied: number; vacant: number };
  rooms: number;
  tenants: { living: number; notice: number; leaving_this_week: number; joined_this_month: number };
  collections: CollectionsSummary;
  dues: { total: string; overdue: string; due_today: string; tenants: number };
  deposits_held: string;
  month_expenses: string;
  month_profit: string;
  checked_in_today: number;
  unread_notifications: number;
};

export type StaffQuery = {
  business_account_id: number;
  search?: string;
  employee_code?: string;
  is_active?: boolean;
  page?: number;
};

export type Attendance = {
  id: number;
  member: { id: number; member_code: string; first_name: string; last_name: string | null };
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  created_at: string;
  updated_at: string;
};

/** Check-in defaults to now on the server; send null for a past day without a time. */
export type AttendanceInput = {
  member_id: number;
  attendance_date: string;
  check_in_time?: string | null;
};

/** An admin's access to one business account. */
export type AccountAdmin = {
  admin: Admin;
  role: string;
  is_active: boolean;
  created_at: string;
};

/** `is_active` turns the admin's access to this business on or off. */
export type AccountAdminInput = {
  full_name?: string;
  mobile_no?: string;
  email?: string;
  is_active?: boolean;
};

export type ProfileInput = {
  full_name?: string;
  mobile_no?: string;
  email?: string;
};

/** Paginated list response: 20 per page, `count` is the total across all pages. */
export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type MemberQuery = {
  business_account_id: number;
  search?: string;
  member_code?: string;
  phone?: string;
  email?: string;
  is_active?: boolean;
  status?: 'live' | 'expired';
  end_date_from?: string;
  end_date_to?: string;
  has_dues?: boolean;
  page?: number;
};

export type AttendanceQuery = {
  business_account_id: number;
  attendance_date?: string;
  member_id?: number;
  page?: number;
};

/**
 * renew: rejoining (expired / inactive). change_plan: replaces the current plan from start_date.
 * renew_early: adds the next plan after the current one (last 7 days of an active plan).
 */
export type MembershipActionInput = {
  action: 'renew' | 'change_plan' | 'renew_early';
  member_id: number;
  membership_plan_id: number;
  start_date?: string;
  discount?: string;
  payment?: PaymentInput;
};

/** Correct the current membership, or extend it by some days (e.g. a freeze). */
export type MembershipUpdateInput = {
  start_date?: string;
  discount?: string;
  extend_days?: number;
  reason?: string;
};

/** One line of a member's history. `created_by` is null when the system did it. */
export type MemberActivity = {
  id: number;
  activity_type: string;
  description: string;
  membership_id: number | null;
  payment_id: number | null;
  created_by: string | null;
  created_at: string;
};

export type MemberCounts = Record<
  'all' | 'live' | 'expired' | 'expiring3' | 'expiring7' | 'expiring15' | 'dues' | 'inactive',
  number
>;

export type Dashboard = {
  members: MemberCounts;
  collections: CollectionsSummary;
  checked_in_today: number;
  plans: number;
  unread_notifications: number;
};

type Compared<T> = { value: T; previous: T };

export type Insights = {
  date_from: string;
  date_to: string;
  summary: {
    collections: Compared<string>;
    new_members: Compared<number>;
    renewals: Compared<number>;
    expired: Compared<number>;
    attendance: Compared<number>;
  };
  /** % of plans that ended in the period and were renewed; null when none ended. */
  renewal_rate: number | null;
  previous_renewal_rate: number | null;
  live_members: number;
  outstanding_dues: string;
  /** Days for up to a month, weeks up to ~4 months, months beyond. */
  series: {
    label: string;
    collections: string;
    new_members: number;
    renewals: number;
    expired: number;
    attendance: number;
  }[];
  payment_methods: { method: string; total: string }[];
  plans: { name: string; count: number; revenue: string }[];
  top_dues: { member_id: number; name: string; amount: string }[];
};

export type AppNotification = {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  /** What to open on tap: a member list filter or a member. */
  member_filter: string | null;
  member_id: number | null;
  notification_date: string;
  is_read: boolean;
  created_at: string;
};

export type NotificationSettings = {
  morning_summary: boolean;
  expiry_reminders: boolean;
  expired_followups: boolean;
  dues_reminders: boolean;
  no_show_alerts: boolean;
  birthday_alerts: boolean;
  activity_alerts: boolean;
  evening_summary: boolean;
};

export type SubscriptionPlan = {
  code: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | (string & {});
  name: string;
  months: number;
  price: string;
  currency: string;
  google_base_plan_id: string | null;
};

export type SubscriptionPayment = {
  id: number;
  provider: SubscriptionProvider;
  amount: string;
  currency: string;
  status: string;
  plan_name: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string;
  /** How it was paid, e.g. "UPI" or "Card" (null when the provider didn't say). */
  method: string | null;
  receipt_number: string;
  /** Opens the printable receipt; see receiptUrl() in links.ts. */
  receipt_token: string;
};

/** A picked file: `file` on web, `uri` on Android and iOS. */
export type UploadFile = { uri: string; name: string; mimeType?: string; file?: File };

/** One row of a member import file, as checked by the server. */
export type MemberImportRow = {
  row: number;
  ok: boolean;
  errors: string[];
  member_code: string;
  name: string;
  plan: string;
};

export type MemberImportResult = {
  dry_run: boolean;
  total: number;
  ok: number;
  created: number;
  rows: MemberImportRow[];
};

export type SubscriptionProvider = 'RAZORPAY' | 'GOOGLE_PLAY' | 'APPLE' | 'MANUAL';

/**
 * The logged-in login's own subscription. TRIAL → free days left; ACTIVE → paid and renewing;
 * CANCELLED → paid, won't renew; GRACE → renewal failed, retrying; EXPIRED → read-only.
 */
export type SubscriptionInfo = {
  state: 'TRIAL' | 'ACTIVE' | 'CANCELLED' | 'GRACE' | 'EXPIRED';
  has_access: boolean;
  can_purchase: boolean;
  trial_ends_at: string;
  current_period_end: string | null;
  access_until: string;
  days_left: number;
  auto_renew: boolean;
  provider: SubscriptionProvider | null;
  plan: SubscriptionPlan | null;
  owns_business: boolean;
  plans: SubscriptionPlan[];
  payments: SubscriptionPayment[];
  payment_options: { razorpay: boolean; google_play: boolean; google_play_product_id: string };
};

export type RazorpayCheckout = {
  key_id: string;
  subscription_id: string;
  /** Razorpay's hosted payment page for this subscription (used by the app). */
  payment_url: string;
  /** Set when the new plan starts (and is first charged) only once the current paid period ends. */
  starts_at: string | null;
  plan: SubscriptionPlan;
  name: string;
  email: string;
  contact: string;
};

export type RazorpayResult = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

export type SignupInput = {
  full_name: string;
  mobile_no: string;
  email: string;
  password: string;
};

/** A failed request. `fieldErrors` holds the backend's 400 `{field: [message]}` errors. */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;
let onPaymentRequired: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Called when the backend rejects the saved token (expired or admin deactivated). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

/** Called when a change is refused because the business owner's subscription has ended (HTTP 402). */
export function setPaymentRequiredHandler(handler: (() => void) | null) {
  onPaymentRequired = handler;
}

function withQuery(path: string, params: Record<string, string | number | boolean | undefined>) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `${path}?${query}` : path;
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  // Tells the server this build can run PG businesses (older builds only see gyms).
  const headers: Record<string, string> = { Accept: 'application/json', 'X-Vyntra-Features': 'pg' };
  // A FormData body (file upload) sets its own multipart Content-Type.
  const isForm = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (options.body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : isForm ? (options.body as FormData) : JSON.stringify(options.body),
      // Auth is the Bearer token only; don't let the platform cookie jar authenticate requests too.
      credentials: 'omit',
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your internet connection and try again.");
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (response.ok) return data as T;

  if (response.status === 401 && authToken) onUnauthorized?.();
  if (response.status === 402) onPaymentRequired?.();
  throw toApiError(response.status, data);
}

function toApiError(status: number, data: unknown): ApiError {
  const body = (data ?? {}) as Record<string, unknown>;
  const fieldErrors: Record<string, string> = {};
  let message = typeof body.detail === 'string' ? body.detail : '';

  for (const [key, value] of Object.entries(body)) {
    if (!Array.isArray(value) || typeof value[0] !== 'string') continue;
    if (key === 'non_field_errors') message ||= value[0];
    else fieldErrors[key] = value[0];
  }

  if (!message && Object.keys(fieldErrors).length === 0) {
    message = 'Something went wrong. Please try again.';
  }
  return new ApiError(status, message, fieldErrors);
}

export const api = {
  login: (login: string, password: string) =>
    request<AuthResponse>('/auth/login/', { method: 'POST', body: { login, password } }),
  signup: (input: SignupInput) => request<AuthResponse>('/auth/signup/', { method: 'POST', body: input }),
  logout: () => request<null>('/auth/logout/', { method: 'POST' }),
  me: () => request<Admin>('/me/'),
  subscription: () => request<SubscriptionInfo>('/subscription/'),
  cancelSubscription: () => request<SubscriptionInfo>('/subscription/cancel/', { method: 'POST' }),
  startRazorpayCheckout: (plan_code: string) =>
    request<RazorpayCheckout>('/subscription/razorpay/', { method: 'POST', body: { plan_code } }),
  syncRazorpay: (subscription_id: string) =>
    request<SubscriptionInfo>('/subscription/razorpay/sync/', { method: 'POST', body: { subscription_id } }),
  confirmRazorpay: (result: RazorpayResult) =>
    request<SubscriptionInfo>('/subscription/razorpay/confirm/', { method: 'POST', body: result }),
  confirmGooglePlay: (purchase_token: string) =>
    request<SubscriptionInfo>('/subscription/google-play/confirm/', { method: 'POST', body: { purchase_token } }),
  businessTypes: () => request<{ results: BusinessType[] }>('/business-types/'),
  businessAccounts: () => request<{ results: BusinessAccount[] }>('/business-accounts/'),
  businessAccount: (id: number) => request<BusinessAccount>(`/business-accounts/${id}/`),
  createBusinessAccount: (input: BusinessAccountInput) =>
    request<BusinessAccount>('/business-accounts/', { method: 'POST', body: input }),
  updateBusinessAccount: (id: number, input: BusinessAccountInput) =>
    request<BusinessAccount>(`/business-accounts/${id}/`, { method: 'PUT', body: input }),
  deleteBusinessAccount: (id: number) => request<null>(`/business-accounts/${id}/`, { method: 'DELETE' }),

  updateProfile: (input: ProfileInput) => request<Admin>('/me/', { method: 'PUT', body: input }),
  deleteAccount: () => request<null>('/me/', { method: 'DELETE' }),
  /** Returns a fresh token for this device; tokens on other devices stop working. */
  changePassword: (new_password: string) =>
    request<AuthResponse>('/me/password/', { method: 'PUT', body: { new_password } }),
  /** Sets another admin's password (e.g. they forgot it); they are signed out everywhere. */
  setAdminPassword: (business_account_id: number, admin_id: number, new_password: string) =>
    request<{ result: string }>(withQuery('/admins/password/', { business_account_id, admin_id }), {
      method: 'PUT',
      body: { new_password },
    }),

  durationTypes: () => request<{ results: DurationType[] }>('/duration-types/'),
  plans: (business_account_id: number, page?: number) =>
    request<Paginated<MembershipPlan>>(withQuery('/membership-plans/', { business_account_id, page })),
  plan: (business_account_id: number, plan_id: number) =>
    request<MembershipPlan>(withQuery('/membership-plans/', { business_account_id, plan_id })),
  createPlan: (business_account_id: number, input: MembershipPlanInput) =>
    request<MembershipPlan>(withQuery('/membership-plans/', { business_account_id }), { method: 'POST', body: input }),
  updatePlan: (business_account_id: number, plan_id: number, input: MembershipPlanInput) =>
    request<MembershipPlan>(withQuery('/membership-plans/', { business_account_id, plan_id }), {
      method: 'PUT',
      body: input,
    }),

  members: (query: MemberQuery) => request<Paginated<Member>>(withQuery('/members/', query)),
  member: (business_account_id: number, member_id: number) =>
    request<Member>(withQuery('/members/', { business_account_id, member_id })),
  createMember: (business_account_id: number, input: MemberInput) =>
    request<Member>(withQuery('/members/', { business_account_id }), { method: 'POST', body: input }),
  updateMember: (business_account_id: number, member_id: number, input: MemberInput) =>
    request<Member>(withQuery('/members/', { business_account_id, member_id }), { method: 'PUT', body: input }),
  deactivateMember: (business_account_id: number, member_id: number) =>
    request<null>(withQuery('/members/', { business_account_id, member_id }), { method: 'DELETE' }),

  // Full membership history (active + past) for a member, each with its payments and dues.
  memberships: (business_account_id: number, member_id: number, page?: number) =>
    request<Paginated<Membership>>(withQuery('/memberships/', { business_account_id, member_id, page })),
  membershipAction: (business_account_id: number, input: MembershipActionInput) =>
    request<Member>(withQuery('/memberships/', { business_account_id }), { method: 'POST', body: input }),
  /** Cancels a renewed-early next plan (only while it has no payments). */
  cancelNextPlan: (business_account_id: number, membership_id: number) =>
    request<Member>(withQuery('/memberships/', { business_account_id, membership_id }), { method: 'DELETE' }),
  updateMembership: (business_account_id: number, membership_id: number, input: MembershipUpdateInput) =>
    request<Member>(withQuery('/memberships/', { business_account_id, membership_id }), { method: 'PUT', body: input }),
  memberActivity: (business_account_id: number, member_id: number, page?: number) =>
    request<Paginated<MemberActivity>>(withQuery('/member-activity/', { business_account_id, member_id, page })),

  dashboard: (business_account_id: number) => request<Dashboard>(withQuery('/dashboard/', { business_account_id })),
  insights: (business_account_id: number, date_from: string, date_to: string) =>
    request<Insights>(withQuery('/insights/', { business_account_id, date_from, date_to })),

  notifications: (business_account_id: number, page?: number) =>
    request<Paginated<AppNotification>>(withQuery('/notifications/', { business_account_id, page })),
  /** Marks one notification read, or all of them when `notification_id` is omitted. */
  markNotificationsRead: (business_account_id: number, notification_id?: number) =>
    request<null>(withQuery('/notifications/', { business_account_id, notification_id }), { method: 'PUT' }),
  notificationSettings: (business_account_id: number) =>
    request<NotificationSettings>(withQuery('/notification-settings/', { business_account_id })),
  updateNotificationSettings: (business_account_id: number, input: Partial<NotificationSettings>) =>
    request<NotificationSettings>(withQuery('/notification-settings/', { business_account_id }), {
      method: 'PUT',
      body: input,
    }),
  registerDevice: (push_token: string, platform: string) =>
    request<null>('/devices/', { method: 'POST', body: { push_token, platform } }),
  sendTestPush: () => request<{ devices: number }>('/devices/test/', { method: 'POST' }),
  unregisterDevice: (push_token: string) => request<null>('/devices/', { method: 'DELETE', body: { push_token } }),

  // Standalone payments — record recurring payments and list a member's payment history.
  payments: (query: PaymentQuery) => request<Paginated<PaymentRecord>>(withQuery('/payments/', query)),
  recordPayment: (business_account_id: number, input: PaymentRecordInput) =>
    request<PaymentRecord>(withQuery('/payments/', { business_account_id }), { method: 'POST', body: input }),
  voidPayment: (business_account_id: number, payment_id: number) =>
    request<null>(withQuery('/payments/', { business_account_id, payment_id }), { method: 'DELETE' }),

  // Collection totals (today / this month / optional period) and outstanding dues.
  collections: (business_account_id: number, period_from?: string, period_to?: string) =>
    request<CollectionsSummary>(withQuery('/collections/', { business_account_id, period_from, period_to })),

  attendance: (query: AttendanceQuery) => request<Paginated<Attendance>>(withQuery('/member-attendance/', query)),
  markAttendance: (business_account_id: number, input: AttendanceInput) =>
    request<Attendance>(withQuery('/member-attendance/', { business_account_id }), { method: 'POST', body: input }),
  updateAttendance: (
    business_account_id: number,
    attendance_id: number,
    input: { check_in_time?: string | null; check_out_time?: string | null },
  ) =>
    request<Attendance>(withQuery('/member-attendance/', { business_account_id, attendance_id }), {
      method: 'PUT',
      body: input,
    }),

  staffList: (query: StaffQuery) => request<Paginated<Staff>>(withQuery('/staff/', query)),
  staff: (business_account_id: number, staff_id: number) =>
    request<Staff>(withQuery('/staff/', { business_account_id, staff_id })),
  createStaff: (business_account_id: number, input: StaffInput) =>
    request<Staff>(withQuery('/staff/', { business_account_id }), { method: 'POST', body: input }),
  updateStaff: (business_account_id: number, staff_id: number, input: StaffInput) =>
    request<Staff>(withQuery('/staff/', { business_account_id, staff_id }), { method: 'PUT', body: input }),

  admins: (business_account_id: number) =>
    request<{ results: AccountAdmin[] }>(withQuery('/admins/', { business_account_id })),
  admin: (business_account_id: number, admin_id: number) =>
    request<AccountAdmin>(withQuery('/admins/', { business_account_id, admin_id })),
  createAdmin: (business_account_id: number, input: SignupInput) =>
    request<AccountAdmin>(withQuery('/admins/', { business_account_id }), { method: 'POST', body: input }),
  /** With `dryRun`, only checks the file; otherwise imports the rows that pass. */
  importMembers: (business_account_id: number, upload: UploadFile, dryRun: boolean) => {
    const form = new FormData();
    if (upload.file) form.append('file', upload.file, upload.name);
    // React Native's FormData takes a { uri, name, type } object for files.
    else form.append('file', { uri: upload.uri, name: upload.name, type: upload.mimeType ?? 'application/octet-stream' } as unknown as Blob);
    return request<MemberImportResult>(
      withQuery('/members/import/', { business_account_id, dry_run: dryRun ? 'true' : undefined }),
      { method: 'POST', body: form },
    );
  },
  staffSalaries: (business_account_id: number, month: string) =>
    request<SalaryMonth>(withQuery('/staff-salaries/', { business_account_id, month })),
  paySalary: (
    business_account_id: number,
    input: { staff_id: number; salary_month: string; amount: string; paid_on?: string; payment_method?: string },
  ) => request<StaffSalary>(withQuery('/staff-salaries/', { business_account_id }), { method: 'POST', body: input }),
  undoSalary: (business_account_id: number, salary_id: number) =>
    request<null>(withQuery('/staff-salaries/', { business_account_id, salary_id }), { method: 'DELETE' }),

  expenses: (query: ExpenseQuery) => request<ExpenseList>(withQuery('/expenses/', query)),
  expense: (business_account_id: number, expense_id: number) =>
    request<Expense>(withQuery('/expenses/', { business_account_id, expense_id })),
  createExpense: (business_account_id: number, input: ExpenseInput) =>
    request<Expense>(withQuery('/expenses/', { business_account_id }), { method: 'POST', body: input }),
  updateExpense: (business_account_id: number, expense_id: number, input: ExpenseInput) =>
    request<Expense>(withQuery('/expenses/', { business_account_id, expense_id }), { method: 'PUT', body: input }),
  deleteExpense: (business_account_id: number, expense_id: number) =>
    request<null>(withQuery('/expenses/', { business_account_id, expense_id }), { method: 'DELETE' }),

  pgDashboard: (business_account_id: number) =>
    request<PgDashboard>(withQuery('/pg/dashboard/', { business_account_id })),
  pgSettings: (business_account_id: number) =>
    request<PgSettings>(withQuery('/pg/property/', { business_account_id })),
  updatePgSettings: (business_account_id: number, input: Partial<PgSettings>) =>
    request<PgSettings>(withQuery('/pg/property/', { business_account_id }), { method: 'PUT', body: input }),
  pgRooms: (business_account_id: number) =>
    request<{ results: PgRoom[] }>(withQuery('/pg/rooms/', { business_account_id })),
  createPgRoom: (business_account_id: number, input: PgRoomInput) =>
    request<PgRoom>(withQuery('/pg/rooms/', { business_account_id }), { method: 'POST', body: input }),
  updatePgRoom: (business_account_id: number, room_id: number, input: PgRoomInput) =>
    request<PgRoom>(withQuery('/pg/rooms/', { business_account_id, room_id }), { method: 'PUT', body: input }),
  deletePgRoom: (business_account_id: number, room_id: number) =>
    request<null>(withQuery('/pg/rooms/', { business_account_id, room_id }), { method: 'DELETE' }),
  pgTenants: (query: PgTenantQuery) => request<Paginated<PgTenant>>(withQuery('/pg/tenants/', query)),
  pgTenant: (business_account_id: number, member_id: number) =>
    request<PgTenantProfile>(withQuery('/pg/tenants/', { business_account_id, member_id })),
  createPgTenant: (business_account_id: number, input: PgTenantInput) =>
    request<PgTenantProfile>(withQuery('/pg/tenants/', { business_account_id }), { method: 'POST', body: input }),
  updatePgTenant: (business_account_id: number, member_id: number, input: PgTenantInput) =>
    request<PgTenantProfile>(withQuery('/pg/tenants/', { business_account_id, member_id }), {
      method: 'PUT',
      body: input,
    }),
  pgTenantAction: (business_account_id: number, input: PgTenantAction) =>
    request<PgTenantProfile>(withQuery('/pg/tenants/action/', { business_account_id }), { method: 'POST', body: input }),
  pgCheckoutPreview: (business_account_id: number, member_id: number, leave_date: string, prorate_last_bill: boolean) =>
    request<PgCheckoutPreview>(
      withQuery('/pg/checkout-preview/', { business_account_id, member_id, leave_date, prorate_last_bill }),
    ),
  pgBillDiscount: (business_account_id: number, bill_id: number, discount: string) =>
    request<PgTenantProfile>(withQuery('/pg/bills/', { business_account_id, bill_id }), {
      method: 'PUT',
      body: { discount },
    }),
  pgAddCharge: (business_account_id: number, input: { member_id: number; description: string; amount: string }) =>
    request<PgTenantProfile>(withQuery('/pg/charges/', { business_account_id }), { method: 'POST', body: input }),
  pgRecordRent: (
    business_account_id: number,
    input: PaymentInput & { member_id: number; bill_id?: number; payment_date?: string },
  ) => request<PgTenantProfile>(withQuery('/pg/payments/', { business_account_id }), { method: 'POST', body: input }),
  pgDeposit: (
    business_account_id: number,
    input: {
      member_id: number;
      entry_type: PgDepositEntry['entry_type'];
      amount: string;
      payment_method?: string;
      reason?: string;
      entry_date?: string;
    },
  ) => request<PgTenantProfile>(withQuery('/pg/deposits/', { business_account_id }), { method: 'POST', body: input }),

  removeAdmin: (business_account_id: number, admin_id: number) =>
    request<null>(withQuery('/admins/', { business_account_id, admin_id }), { method: 'DELETE' }),
  updateAdmin: (business_account_id: number, admin_id: number, input: AccountAdminInput) =>
    request<AccountAdmin>(withQuery('/admins/', { business_account_id, admin_id }), { method: 'PUT', body: input }),
};

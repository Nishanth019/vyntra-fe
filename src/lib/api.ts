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
  created_at: string;
  updated_at: string;
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
  /** The latest membership (current, upcoming or last expired). */
  membership: Membership | null;
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
  is_active?: boolean;
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

/** Renew (any plan; starts after the current one ends) or change plan mid-way (starts today). */
export type MembershipActionInput = {
  action: 'renew' | 'change_plan';
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

export function setAuthToken(token: string | null) {
  authToken = token;
}

/** Called when the backend rejects the saved token (expired or admin deactivated). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

function withQuery(path: string, params: Record<string, string | number | boolean | undefined>) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `${path}?${query}` : path;
}

async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      // Auth is the Bearer token only; don't let the platform cookie jar authenticate requests too.
      credentials: 'omit',
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your internet connection and try again.");
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (response.ok) return data as T;

  if (response.status === 401 && authToken) onUnauthorized?.();
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
  changePassword: (current_password: string, new_password: string) =>
    request<{ result: string }>('/me/password/', { method: 'PUT', body: { current_password, new_password } }),

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
  updateAdmin: (business_account_id: number, admin_id: number, input: AccountAdminInput) =>
    request<AccountAdmin>(withQuery('/admins/', { business_account_id, admin_id }), { method: 'PUT', body: input }),
};

/**
 * Typed API client. Access token is held in sessionStorage (cleared on tab close);
 * refresh would go through the session endpoints. All authorization is enforced
 * server-side — this client only reflects it (401/403 handling).
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

const TOKEN_KEY = 'nc_access_token';

export const getToken = () =>
  typeof window === 'undefined' ? null : sessionStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (typeof window === 'undefined') return;
  if (t) sessionStorage.setItem(TOKEN_KEY, t);
  else sessionStorage.removeItem(TOKEN_KEY);
};

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers: { ...headers, ...(init.headers as object) } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body.code ?? 'ERROR', body.message ?? res.statusText);
  return body as T;
}

export const api = {
  requestOtp: (phone: string) =>
    request<{ sent: boolean; devOtp?: string }>('/api/v1/auth/otp/request', {
      method: 'POST', body: JSON.stringify({ phone }),
    }),
  verifyOtp: (phone: string, code: string) =>
    request<{ accessToken: string; refreshToken: string }>('/api/v1/auth/otp/verify', {
      method: 'POST', body: JSON.stringify({ phone, code }),
    }),
  me: () => request<{ id: string; platformRole: string | null }>('/api/v1/auth/me'),
  myOrgs: () =>
    request<{ org: { id: string; name: string; status: string }; role: string; status: string }[]>(
      '/api/v1/organizations/me',
    ),
  pendingOrgs: () =>
    request<Paginated<OrgSummary>>('/api/v1/admin/organizations/pending'),
  adminOrgs: (status?: string) =>
    request<Paginated<OrgSummary>>(`/api/v1/admin/organizations${status ? `?status=${status}` : ''}`),
  decideOrg: (id: string, action: 'approve' | 'reject' | 'suspend' | 'reinstate', notes?: string) =>
    request(`/api/v1/admin/organizations/${id}/${action}`, {
      method: 'POST', body: JSON.stringify(notes ? { notes } : {}),
    }),
  orgMembers: (orgId: string, page = 1) =>
    request<Paginated<Membership>>(`/api/v1/organizations/${orgId}/memberships?page=${page}`),
  decideMembership: (orgId: string, membershipId: string, action: 'approve' | 'reject' | 'remove') =>
    request(`/api/v1/organizations/${orgId}/memberships/${membershipId}/${action}`, { method: 'POST', body: '{}' }),
  orgVehicles: (orgId: string) =>
    request<Paginated<Vehicle>>(`/api/v1/organizations/${orgId}/vehicles`),
  decideVehicle: (id: string, action: 'approve' | 'reject' | 'deactivate') =>
    request(`/api/v1/vehicles/${id}/${action}`, { method: 'POST', body: '{}' }),
  createInvitation: (orgId: string, role: string) =>
    request<{ code: string }>(`/api/v1/organizations/${orgId}/invitations`, {
      method: 'POST', body: JSON.stringify({ role }),
    }),
  auditLogs: () => request<Paginated<AuditLog>>('/api/v1/admin/audit-logs'),
  abuseReports: () => request<Paginated<AbuseReport>>('/api/v1/admin/abuse-reports'),
};

export interface Paginated<T> { items: T[]; total: number; page: number; pageSize: number }
export interface OrgSummary {
  id: string; name: string; type: string; status: string; city: string; state: string;
  createdAt: string; documents?: { id: string; type: string; status: string; fileName: string }[];
}
export interface Membership {
  id: string; role: string; status: string; createdAt: string;
  user: { id: string; phone: string; fullName: string | null };
}
export interface Vehicle {
  id: string; registrationNumber: string; vehicleType: string; status: string;
  memberships: { user: { fullName: string | null; phone: string } }[];
}
export interface AuditLog { id: string; action: string; resourceType: string; actorId: string | null; createdAt: string }
export interface AbuseReport { id: string; reason: string; status: string; createdAt: string }

import {
  Voucher,
  PublicVoucher,
  ValidationResult,
  RedemptionRequest,
  GenerateVoucherPayload,
  DashboardMetrics,
  AuditLog,
  AdminUser,
  AdminAccount,
} from '../types';

const AUTH_TOKEN_KEY = 'vf_admin_auth_token';
const ADMIN_USER_KEY = 'vf_admin_user_data';

export const api = {
  // Token management
  getAuthToken(): string | null {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  setAuthToken(token: string, user: AdminUser): void {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    } catch {}
  },

  clearAuthToken(): void {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(ADMIN_USER_KEY);
    } catch {}
  },

  getStoredAdmin(): AdminUser | null {
    try {
      const raw = localStorage.getItem(ADMIN_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  // Auth Endpoints
  async login(email: string, password: string): Promise<{ success: boolean; user: AdminUser; error?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Authentication failed');
    if (data.success && data.user) {
      this.setAuthToken(data.user.token, data.user);
    }
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });
    } finally {
      this.clearAuthToken();
    }
  },

  async checkAuth(): Promise<{ authenticated: boolean; user?: AdminUser }> {
    const token = this.getAuthToken();
    if (!token) return { authenticated: false };
    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders(),
      });
      const data = await res.json();
      return data;
    } catch {
      return { authenticated: false };
    }
  },

  // Customer / Public Endpoints (No account needed!)
  async publicValidate(code: string, orderSubtotal?: number): Promise<ValidationResult> {
    const res = await fetch('/api/vouchers/public-validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, orderSubtotal }),
    });
    return res.json();
  },

  async publicRedeem(code: string, staffName?: string, location?: string): Promise<{ success: boolean; publicVoucher?: PublicVoucher; error?: string; statusCode: number }> {
    const res = await fetch('/api/vouchers/public-redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, staffName, location }),
    });
    const data = await res.json();
    return { ...data, statusCode: res.status };
  },

  // Admin & POS Operations
  async getMetrics(): Promise<DashboardMetrics> {
    const res = await fetch('/api/metrics', {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch metrics');
    return res.json();
  },

  async listVouchers(params?: { status?: string; type?: string; search?: string }): Promise<{ vouchers: Voucher[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`/api/vouchers?${query.toString()}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch vouchers');
    return res.json();
  },

  async getVoucher(idOrCode: string): Promise<Voucher> {
    const res = await fetch(`/api/vouchers/${encodeURIComponent(idOrCode)}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Voucher not found');
    return res.json();
  },

  async generateVoucher(payload: GenerateVoucherPayload): Promise<{ success: boolean; voucher?: Voucher; vouchers?: Voucher[]; count?: number }> {
    const res = await fetch('/api/vouchers/generate', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate voucher');
    return data;
  },

  async validateVoucher(code: string, orderSubtotal?: number): Promise<ValidationResult> {
    const res = await fetch('/api/vouchers/validate', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ code, orderSubtotal }),
    });
    return res.json();
  },

  async redeemVoucher(req: RedemptionRequest): Promise<{ success: boolean; voucher?: Voucher; error?: string; statusCode: number }> {
    const res = await fetch('/api/vouchers/redeem', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(req),
    });
    const data = await res.json();
    if (!res.ok && !data.error) {
      throw new Error(`Redemption failed with status ${res.status}`);
    }
    return { ...data, statusCode: res.status };
  },

  async simulateConcurrency(code: string, concurrentRequests: number = 5): Promise<any> {
    const res = await fetch('/api/vouchers/simulate-concurrency', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ code, concurrentRequests }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Simulation failed');
    return data;
  },

  async revokeVoucher(id: string, reason: string): Promise<{ success: boolean; voucher?: Voucher }> {
    const res = await fetch(`/api/vouchers/${id}/revoke`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to revoke voucher');
    return data;
  },

  async deleteVoucher(id: string, reason?: string): Promise<{ success: boolean; message?: string }> {
    const res = await fetch(`/api/vouchers/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete voucher');
    return data;
  },

  async batchDeleteVouchers(params: {
    ids?: string[];
    filter?: {
      status?: string;
      type?: string;
      search?: string;
      inactiveOnly?: boolean;
    };
    reason?: string;
  }): Promise<{ success: boolean; deletedCount: number; deletedCodes?: string[] }> {
    const res = await fetch('/api/vouchers/batch-delete', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Batch delete failed');
    return data;
  },

  async getAuditLogs(limit: number = 100): Promise<{ logs: AuditLog[]; total: number }> {
    const res = await fetch(`/api/audit-logs?limit=${limit}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  // Admin Profile & Security
  async getAdminProfile(): Promise<AdminUser> {
    const res = await fetch('/api/admin/profile', {
      headers: this.getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin profile');
    return data;
  },

  async updateAdminProfile(profileData: {
    name: string;
    email: string;
    department?: string;
    phone?: string;
    jobTitle?: string;
    avatarUrl?: string;
  }): Promise<{ success: boolean; message: string; user: AdminUser }> {
    const res = await fetch('/api/admin/profile', {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    if (data.user) {
      const currentToken = this.getAuthToken() || '';
      this.setAuthToken(currentToken, { ...data.user, token: currentToken });
    }
    return data;
  },

  async changeAdminPassword(passwords: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    id?: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(passwords),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change password');
    return data;
  },

  // Admin Directory & Account Management
  async getAdminAccounts(): Promise<{ accounts: AdminAccount[]; count: number; firestoreSynced: boolean }> {
    const res = await fetch('/api/admin/accounts', {
      headers: this.getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch admin accounts');
    return data;
  },

  async createAdminAccount(accountData: {
    name: string;
    email: string;
    password: string;
    department?: string;
    jobTitle?: string;
    phone?: string;
    avatarUrl?: string;
  }): Promise<{ success: boolean; message: string; admin: AdminAccount }> {
    const res = await fetch('/api/admin/accounts', {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(accountData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create admin account');
    return data;
  },

  async deleteAdminAccount(id: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/admin/accounts/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete admin account');
    return data;
  },
};

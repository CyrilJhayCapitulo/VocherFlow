export type VoucherType = 'fixed_amount' | 'percentage' | 'gift_card' | 'free_item';

/**
 * Firestore Voucher Document Status
 * Supports: ACTIVE, REDEEMED, EXPIRED, CANCELLED
 */
export type VoucherStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED' | 'active' | 'redeemed' | 'expired' | 'revoked' | 'cancelled';

export type UserRole = 'admin' | 'customer';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  token: string;
  department?: string;
  phone?: string;
  avatarUrl?: string;
  jobTitle?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  department: string;
  jobTitle: string;
  phone: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface PublicVoucher {
  id?: string;
  code: string;
  type: VoucherType;
  voucherType?: VoucherType;
  value: number;
  currency: string;
  minSpend?: number;
  maxDiscount?: number;
  title: string;
  description?: string;
  expiresAt: string;
  status: VoucherStatus;
  redeemedAt?: string | null;
  maskedCustomerName?: string;
  customerReference?: string;
}

/**
 * Firestore Voucher Document Model
 * Fields:
 * - id: Document ID
 * - code: Unique alphanumeric voucher code
 * - status: ACTIVE | REDEEMED | EXPIRED | CANCELLED
 * - purchaseId: Associated purchase reference
 * - customerReference: Customer reference (name, ID, or email)
 * - voucherType: Classification
 * - value: Value amount
 * - currency: ISO currency (e.g. USD)
 * - createdAt: Timestamp of issuance
 * - expiresAt: Expiration timestamp
 * - redeemedAt: Timestamp of redemption
 * - redeemedBy: Cashier/staff or system info
 * - createdBy: Admin/user or system info
 * - redemptionLocation: Device & location details
 * - notes: Usage/audit notes
 */
export interface Voucher {
  id: string;
  code: string; // e.g. VF-9K2L-8P4X-1M7Q
  status: VoucherStatus;
  purchaseId: string; // Order / Purchase ID
  customerReference: string; // Customer reference
  voucherType: VoucherType; // e.g. fixed_amount, percentage
  value: number; // e.g. 50
  currency: string; // e.g. USD
  createdAt: string;
  expiresAt: string;
  redeemedAt?: string | null;
  redeemedBy?: {
    cashierName: string;
    terminalId: string;
    location?: string;
    orderReference?: string;
    notes?: string;
  } | string | null;
  createdBy: string;
  redemptionLocation?: {
    terminalId?: string;
    location?: string;
    deviceIp?: string;
    userAgent?: string;
    orderReference?: string;
  } | string | null;
  notes: string;

  // Additional UI & Integrity Properties
  type?: VoucherType; // Alias for voucherType
  hash?: string; // SHA-256 HMAC integrity signature
  minSpend?: number;
  maxDiscount?: number;
  title?: string;
  description?: string;
  customerName?: string;
  customerEmail?: string;
  orderId?: string; // Alias for purchaseId
  version?: number; // Concurrency lock
  metadata?: Record<string, any>;
}

export interface RedemptionRequest {
  code: string;
  cashierName?: string;
  terminalId?: string;
  location?: string;
  orderReference?: string;
  notes?: string;
  idempotencyKey?: string;
  isPublic?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  statusCode: 'VALID' | 'ALREADY_REDEEMED' | 'EXPIRED' | 'REVOKED' | 'CANCELLED' | 'NOT_FOUND' | 'LOCKED';
  voucher?: Voucher; // Full voucher for Admins
  publicVoucher?: PublicVoucher; // Sanitized voucher for Customers/Public
  discountCalculated?: number;
  message: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 'GENERATED' | 'VALIDATED' | 'REDEEMED' | 'REDEMPTION_COLLISION_BLOCKED' | 'REVOKED' | 'CANCELLED' | 'DELETED' | 'BATCH_DELETED' | 'BATCH_GENERATED' | 'LOGIN' | 'PROFILE_UPDATED' | 'PASSWORD_CHANGED' | 'ADMIN_CREATED' | 'ADMIN_DELETED';
  voucherCode: string;
  voucherId?: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  details: string;
  actor: string;
  terminalId?: string;
  ip?: string;
  metadata?: Record<string, any>;
}

export interface DashboardMetrics {
  totalIssued: number;
  totalActive: number;
  totalRedeemed: number;
  totalExpired: number;
  totalRevoked: number;
  totalCancelled?: number;
  totalIssuedValue: number;
  totalRedeemedValue: number;
  redemptionRate: number;
  recentAuditLogs: AuditLog[];
  collisionsBlocked: number;
}

export interface GenerateVoucherPayload {
  voucherType?: VoucherType;
  type?: VoucherType;
  value: number;
  currency?: string;
  minSpend?: number;
  maxDiscount?: number;
  title?: string;
  description?: string;
  customerReference?: string;
  customerName?: string;
  customerEmail?: string;
  purchaseId?: string;
  orderId?: string;
  validDays?: number;
  expiresAt?: string;
  notes?: string;
  createdBy?: string;
  count?: number; // for batch generation
}

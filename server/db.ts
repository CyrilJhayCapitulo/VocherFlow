import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Voucher, AuditLog, DashboardMetrics, VoucherStatus } from '../src/types.js';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  writeBatch,
  collection,
  getDocs,
  query,
  where,
  orderBy,
  runTransaction,
  limit as firestoreLimit
} from 'firebase/firestore';

// Load Firebase Config
let firestoreDb: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const app = !getApps().length ? initializeApp(config) : getApp();
    firestoreDb = getFirestore(app, config.firestoreDatabaseId || '(default)');
    console.log('[Firestore] Database connected successfully with ID:', config.firestoreDatabaseId || '(default)');
  }
} catch (e) {
  console.warn('[Firestore] Fallback to local storage:', e);
}

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('[Storage] Could not create data directory:', err);
  }
}
const VOUCHERS_FILE = path.join(DATA_DIR, 'vouchers.json');
const LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
const LEGACY_ADMIN_FILE = path.join(DATA_DIR, 'admin_profile.json');

export interface StoredAdminAccount {
  id: string;
  email: string;
  name: string;
  role: 'admin';
  department: string;
  phone: string;
  jobTitle: string;
  avatarUrl?: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export type StoredAdminProfile = StoredAdminAccount;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@voucherflow.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPass2026!';

const DEFAULT_ADMIN_PROFILE: StoredAdminAccount = {
  id: 'adm_001',
  email: ADMIN_EMAIL,
  name: 'Chief Administrator',
  role: 'admin',
  department: 'Operations & IT Infrastructure',
  phone: '+1 (555) 234-5678',
  jobTitle: 'Lead Voucher Security Director',
  avatarUrl: '',
  passwordHash: crypto.createHash('sha256').update(ADMIN_PASSWORD).digest('hex'),
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
  createdBy: 'System Root',
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory Mutex Map for concurrent redemption lock management
const voucherLocks = new Map<string, Promise<void>>();

// Initial vouchers formatted to the exact Firestore Voucher Data Model specification
const INITIAL_VOUCHERS: Voucher[] = [
  {
    id: 'vch_001',
    code: 'VF-7K9P-4MX2-9J7L',
    status: 'ACTIVE',
    purchaseId: 'ORD-2026-89412',
    customerReference: 'Sarah Jenkins (sarah.j@example.com)',
    voucherType: 'fixed_amount',
    value: 50,
    currency: 'USD',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedAt: null,
    redeemedBy: null,
    createdBy: 'admin_sys_01',
    redemptionLocation: null,
    notes: 'VIP Summer Privilege Pass. Valid for in-store and online purchases across all merchant locations.',
    
    // UI Helpers & Aliases
    type: 'fixed_amount',
    minSpend: 100,
    title: 'VIP Summer Privilege Pass',
    description: 'Valid for in-store and online purchases across all merchant locations.',
    customerName: 'Sarah Jenkins',
    customerEmail: 'sarah.j@example.com',
    orderId: 'ORD-2026-89412',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    version: 1,
  },
  {
    id: 'vch_002',
    code: 'VF-3B8Q-9W1Z-5E4R',
    status: 'ACTIVE',
    purchaseId: 'ORD-2026-90234',
    customerReference: 'Marcus Vance (marcus.v@acme-enterprises.com)',
    voucherType: 'percentage',
    value: 25,
    currency: 'USD',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedAt: null,
    redeemedBy: null,
    createdBy: 'admin_sys_01',
    redemptionLocation: null,
    notes: 'Seasonal Loyalty Reward 25% OFF. Exclusive 25% discount voucher for platinum tier members.',
    
    // UI Helpers & Aliases
    type: 'percentage',
    minSpend: 50,
    maxDiscount: 75,
    title: 'Seasonal Loyalty Reward 25% OFF',
    description: 'Exclusive 25% discount voucher for platinum tier members.',
    customerName: 'Marcus Vance',
    customerEmail: 'marcus.v@acme-enterprises.com',
    orderId: 'ORD-2026-90234',
    hash: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    version: 1,
  },
  {
    id: 'vch_003',
    code: 'VF-8N4M-2X6C-7V1K',
    status: 'EXPIRED',
    purchaseId: 'ORD-2026-91105',
    customerReference: 'Elena Rostova (elena.rostova@techglobal.io)',
    voucherType: 'gift_card',
    value: 100,
    currency: 'USD',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedAt: null,
    redeemedBy: null,
    createdBy: 'admin_sys_01',
    redemptionLocation: null,
    notes: 'Executive Store Gift Card. Full credit applicable towards any department item.',
    
    // UI Helpers & Aliases
    type: 'gift_card',
    minSpend: 0,
    title: 'Executive Store Gift Card',
    description: 'Full credit applicable towards any department item.',
    customerName: 'Elena Rostova',
    customerEmail: 'elena.rostova@techglobal.io',
    orderId: 'ORD-2026-91105',
    hash: 'b2c3d4e5f6a17890123456789abcdef0123456789abcdef0123456789abcdef1',
    version: 1,
  },
  {
    id: 'vch_004',
    code: 'VF-2T5Y-8U0I-3O7P',
    status: 'REDEEMED',
    purchaseId: 'ORD-2026-88001',
    customerReference: 'David Chen (d.chen@cloudworks.com)',
    voucherType: 'fixed_amount',
    value: 75,
    currency: 'USD',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    redeemedBy: {
      cashierName: 'Alex Rivera',
      terminalId: 'POS-TERM-01',
      location: 'Downtown Flagship Store',
      orderReference: 'RCPT-88902',
      notes: 'Customer presented digital pass on mobile.',
    },
    createdBy: 'admin_sys_01',
    redemptionLocation: {
      terminalId: 'POS-TERM-01',
      location: 'Downtown Flagship Store',
      orderReference: 'RCPT-88902',
      deviceIp: '192.168.1.104',
      userAgent: 'VoucherFlow-POS-Terminal/v2.4',
    },
    notes: 'TechStore Weekend Flash Voucher. Instant $75 discount redeemed at POS Terminal 1.',
    
    // UI Helpers & Aliases
    type: 'fixed_amount',
    minSpend: 150,
    title: 'TechStore Weekend Flash Voucher',
    description: 'Instant $75 discount redeemed at POS Terminal 1.',
    customerName: 'David Chen',
    customerEmail: 'd.chen@cloudworks.com',
    orderId: 'ORD-2026-88001',
    hash: 'c3d4e5f6a1b27890123456789abcdef0123456789abcdef0123456789abcdef2',
    version: 2,
  },
  {
    id: 'vch_005',
    code: 'VF-6X1W-9Q3E-4R8T',
    status: 'CANCELLED',
    purchaseId: 'ORD-2026-84300',
    customerReference: 'Jonathan Ray (j.ray@samplemail.org)',
    voucherType: 'fixed_amount',
    value: 30,
    currency: 'USD',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    redeemedAt: null,
    redeemedBy: null,
    createdBy: 'admin_sys_01',
    redemptionLocation: null,
    notes: 'Order cancelled and refunded upon customer request.',
    
    // UI Helpers & Aliases
    type: 'fixed_amount',
    minSpend: 60,
    title: 'Welcome Member Discount $30',
    description: 'Order refunded; voucher cancelled.',
    customerName: 'Jonathan Ray',
    customerEmail: 'j.ray@samplemail.org',
    orderId: 'ORD-2026-84300',
    hash: 'd4e5f6a1b2c37890123456789abcdef0123456789abcdef0123456789abcdef3',
    version: 2,
  }
];

const INITIAL_LOGS: AuditLog[] = [
  {
    id: 'log_001',
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    action: 'GENERATED',
    voucherCode: 'VF-2T5Y-8U0I-3O7P',
    voucherId: 'vch_004',
    status: 'SUCCESS',
    details: 'Generated $75 fixed amount voucher for David Chen (Order ORD-2026-88001)',
    actor: 'System / Automated Checkout',
    terminalId: 'API-SRV-01',
  },
  {
    id: 'log_002',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    action: 'REDEEMED',
    voucherCode: 'VF-2T5Y-8U0I-3O7P',
    voucherId: 'vch_004',
    status: 'SUCCESS',
    details: 'Single-use voucher redeemed successfully. Order reference: RCPT-88902',
    actor: 'Alex Rivera (Cashier)',
    terminalId: 'POS-TERM-01',
  },
  {
    id: 'log_003',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    action: 'CANCELLED',
    voucherCode: 'VF-6X1W-9Q3E-4R8T',
    voucherId: 'vch_005',
    status: 'WARNING',
    details: 'Voucher status set to CANCELLED due to customer order refund.',
    actor: 'Chief Administrator',
    terminalId: 'ADMIN-PORTAL',
  }
];

export class VoucherDatabase {
  private vouchers: Map<string, Voucher> = new Map();
  private codeIndex: Map<string, string> = new Map(); // Normalized code -> id
  private logs: AuditLog[] = [];
  private admins: Map<string, StoredAdminAccount> = new Map();

  constructor() {
    this.loadData();
  }

  /**
   * Normalizes voucher status to standard uppercase representation
   */
  public normalizeStatus(status?: string): 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED' {
    if (!status) return 'ACTIVE';
    const upper = status.toUpperCase().trim();
    if (upper === 'REDEEMED') return 'REDEEMED';
    if (upper === 'EXPIRED') return 'EXPIRED';
    if (upper === 'CANCELLED' || upper === 'REVOKED') return 'CANCELLED';
    return 'ACTIVE';
  }

  /**
   * Normalizes full voucher document ensuring all required fields are present
   */
  public formatVoucherDoc(v: Partial<Voucher> & { id: string; code: string }): Voucher {
    const status = this.normalizeStatus(v.status);
    const voucherType = v.voucherType || v.type || 'fixed_amount';
    const title = v.title || `${voucherType === 'percentage' ? v.value + '% OFF' : '$' + v.value} Voucher`;
    const customerRef = v.customerReference || (v.customerName ? `${v.customerName}${v.customerEmail ? ` (${v.customerEmail})` : ''}` : 'General Customer');
    const purchaseId = v.purchaseId || v.orderId || `ORD-${Date.now().toString(36).toUpperCase()}`;

    return {
      id: v.id,
      code: this.normalizeCode(v.code),
      status,
      purchaseId,
      customerReference: customerRef,
      voucherType,
      value: Number(v.value) || 0,
      currency: v.currency || 'USD',
      createdAt: v.createdAt || new Date().toISOString(),
      expiresAt: v.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      redeemedAt: v.redeemedAt || null,
      redeemedBy: v.redeemedBy || null,
      createdBy: v.createdBy || 'system',
      redemptionLocation: v.redemptionLocation || null,
      notes: v.notes || v.description || 'Single-use digital voucher document',

      // Compatibility Aliases & Helpers
      type: voucherType,
      title,
      description: v.description || v.notes || 'Valid for single-use redemption.',
      minSpend: v.minSpend ?? 0,
      maxDiscount: v.maxDiscount,
      customerName: v.customerName || (v.customerReference ? v.customerReference.split('(')[0].trim() : undefined),
      customerEmail: v.customerEmail,
      orderId: purchaseId,
      hash: v.hash || crypto.createHash('sha256').update(`${v.code}|${voucherType}|${v.value}`).digest('hex'),
      version: v.version || 1,
      metadata: v.metadata || {},
    };
  }

  private loadData(): void {
    try {
      if (fs.existsSync(VOUCHERS_FILE)) {
        const raw = fs.readFileSync(VOUCHERS_FILE, 'utf8');
        const list: Voucher[] = JSON.parse(raw);
        list.forEach(v => {
          const doc = this.formatVoucherDoc(v);
          this.vouchers.set(doc.id, doc);
          this.codeIndex.set(this.normalizeCode(doc.code), doc.id);
        });
      } else {
        INITIAL_VOUCHERS.forEach(v => {
          const doc = this.formatVoucherDoc(v);
          this.vouchers.set(doc.id, doc);
          this.codeIndex.set(this.normalizeCode(doc.code), doc.id);
        });
        this.saveVouchers();
      }

      if (fs.existsSync(LOGS_FILE)) {
        const raw = fs.readFileSync(LOGS_FILE, 'utf8');
        this.logs = JSON.parse(raw);
      } else {
        this.logs = [...INITIAL_LOGS];
        this.saveLogs();
      }

      if (fs.existsSync(ADMINS_FILE)) {
        const raw = fs.readFileSync(ADMINS_FILE, 'utf8');
        const list: StoredAdminAccount[] = JSON.parse(raw);
        list.forEach(a => this.admins.set(a.id, a));
      } else if (fs.existsSync(LEGACY_ADMIN_FILE)) {
        const raw = fs.readFileSync(LEGACY_ADMIN_FILE, 'utf8');
        const single: StoredAdminAccount = { ...DEFAULT_ADMIN_PROFILE, ...JSON.parse(raw) };
        this.admins.set(single.id, single);
        this.saveAdmins();
      } else {
        this.admins.set(DEFAULT_ADMIN_PROFILE.id, { ...DEFAULT_ADMIN_PROFILE });
        this.saveAdmins();
      }

      if (this.admins.size === 0) {
        this.admins.set(DEFAULT_ADMIN_PROFILE.id, { ...DEFAULT_ADMIN_PROFILE });
        this.saveAdmins();
      }

      // Sync initial vouchers and admins to Firestore asynchronously if connected
      this.syncInitialToFirestore();
    } catch (err) {
      console.error('Error loading database:', err);
      INITIAL_VOUCHERS.forEach(v => {
        const doc = this.formatVoucherDoc(v);
        this.vouchers.set(doc.id, doc);
        this.codeIndex.set(this.normalizeCode(doc.code), doc.id);
      });
      this.logs = [...INITIAL_LOGS];
      this.admins.set(DEFAULT_ADMIN_PROFILE.id, { ...DEFAULT_ADMIN_PROFILE });
    }
  }

  public getAdminAccounts(): Array<Omit<StoredAdminAccount, 'passwordHash'>> {
    return Array.from(this.admins.values()).map(a => {
      const { passwordHash, ...safe } = a;
      return safe;
    });
  }

  public getAdminAccount(id: string): StoredAdminAccount | undefined {
    return this.admins.get(id);
  }

  public getAdminProfile(id?: string): StoredAdminAccount {
    if (id && this.admins.has(id)) {
      return { ...this.admins.get(id)! };
    }
    const first = this.admins.values().next().value;
    return first ? { ...first } : { ...DEFAULT_ADMIN_PROFILE };
  }

  public saveAdmins(): void {
    try {
      const list = Array.from(this.admins.values());
      fs.writeFileSync(ADMINS_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write admins to disk:', err);
    }
  }

  public async createAdminAccount(
    data: {
      name: string;
      email: string;
      password: string;
      department?: string;
      jobTitle?: string;
      phone?: string;
      avatarUrl?: string;
    },
    creatorActor: string = 'Super Admin'
  ): Promise<Omit<StoredAdminAccount, 'passwordHash'>> {
    const cleanEmail = data.email.trim().toLowerCase();
    
    // Check for duplicate email
    for (const a of this.admins.values()) {
      if (a.email.toLowerCase() === cleanEmail) {
        throw new Error(`An administrator account with email "${cleanEmail}" already exists.`);
      }
    }

    if (!data.password || data.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const newId = `adm_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
    const passwordHash = crypto.createHash('sha256').update(data.password).digest('hex');
    const now = new Date().toISOString();

    const newAdmin: StoredAdminAccount = {
      id: newId,
      name: data.name.trim(),
      email: cleanEmail,
      role: 'admin',
      department: data.department?.trim() || 'Operations',
      jobTitle: data.jobTitle?.trim() || 'Administrator',
      phone: data.phone?.trim() || '',
      avatarUrl: data.avatarUrl?.trim() || '',
      passwordHash,
      createdAt: now,
      updatedAt: now,
      createdBy: creatorActor,
    };

    this.admins.set(newAdmin.id, newAdmin);
    this.saveAdmins();

    // Sync to Firestore `/admins/{newId}`
    if (firestoreDb) {
      try {
        const adminDocRef = doc(firestoreDb, 'admins', newAdmin.id);
        await setDoc(adminDocRef, this.adminToFirestoreDoc(newAdmin));
        console.log(`[Firestore] Admin document ${newAdmin.id} (${newAdmin.email}) synced successfully.`);
      } catch (err) {
        console.warn('[Firestore] Failed to write admin to Firestore:', err);
      }
    }

    await this.addLog({
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: now,
      action: 'ADMIN_CREATED',
      voucherCode: 'SYSTEM_ADMIN_AUTH',
      status: 'SUCCESS',
      details: `New administrator account created for "${newAdmin.name}" (${newAdmin.email}) with role: ${newAdmin.jobTitle}.`,
      actor: creatorActor,
    });

    const { passwordHash: _, ...safe } = newAdmin;
    return safe;
  }

  public async updateAdminProfile(id: string | undefined, data: Partial<StoredAdminAccount>, actor: string = 'Admin'): Promise<StoredAdminAccount> {
    const targetId = id || this.admins.keys().next().value || DEFAULT_ADMIN_PROFILE.id;
    const existing = this.admins.get(targetId) || { ...DEFAULT_ADMIN_PROFILE, id: targetId };

    const updated: StoredAdminAccount = {
      ...existing,
      ...data,
      id: targetId,
      role: 'admin',
      updatedAt: new Date().toISOString(),
    };

    this.admins.set(targetId, updated);
    this.saveAdmins();

    // Sync to Firestore
    if (firestoreDb) {
      try {
        const adminDocRef = doc(firestoreDb, 'admins', targetId);
        await setDoc(adminDocRef, this.adminToFirestoreDoc(updated), { merge: true });
      } catch (err) {
        console.warn('[Firestore] Failed to update admin in Firestore:', err);
      }
    }

    await this.addLog({
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      action: 'PROFILE_UPDATED',
      voucherCode: 'SYSTEM_ADMIN_PROFILE',
      status: 'SUCCESS',
      details: `Administrator profile updated for "${updated.name}" (${updated.email}). Dept: ${updated.department}, Title: ${updated.jobTitle}.`,
      actor,
    });

    return { ...updated };
  }

  public async changeAdminPassword(
    id: string | undefined,
    currentPassword: string,
    newPassword: string,
    actor: string = 'Admin'
  ): Promise<{ success: boolean; error?: string }> {
    const targetId = id || this.admins.keys().next().value || DEFAULT_ADMIN_PROFILE.id;
    const admin = this.admins.get(targetId);

    if (!admin) {
      return { success: false, error: 'Administrator account not found.' };
    }

    const currentHash = crypto.createHash('sha256').update(currentPassword).digest('hex');
    
    if (admin.passwordHash !== currentHash) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');
    admin.passwordHash = newHash;
    admin.updatedAt = new Date().toISOString();
    this.admins.set(targetId, admin);
    this.saveAdmins();

    // Sync to Firestore
    if (firestoreDb) {
      try {
        const adminDocRef = doc(firestoreDb, 'admins', targetId);
        await setDoc(adminDocRef, this.adminToFirestoreDoc(admin), { merge: true });
      } catch (err) {
        console.warn('[Firestore] Failed to update admin password in Firestore:', err);
      }
    }

    await this.addLog({
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      action: 'PASSWORD_CHANGED',
      voucherCode: 'SYSTEM_ADMIN_SECURITY',
      status: 'SUCCESS',
      details: `Password changed successfully for admin account "${admin.name}" (${admin.email}).`,
      actor,
    });

    return { success: true };
  }

  public verifyAdminCredentials(email: string, password: string): StoredAdminAccount | null {
    const cleanEmail = (email || '').trim().toLowerCase();
    const hash = crypto.createHash('sha256').update(password).digest('hex');

    // Match in stored admins
    for (const a of this.admins.values()) {
      if (a.email.toLowerCase() === cleanEmail) {
        if (a.passwordHash === hash) {
          return a;
        }
      }
    }

    return null;
  }

  public async deleteAdminAccount(id: string, actor: string = 'Super Admin'): Promise<{ success: boolean; error?: string }> {
    if (this.admins.size <= 1) {
      return { success: false, error: 'Cannot delete the only remaining administrator account.' };
    }

    const target = this.admins.get(id);
    if (!target) {
      return { success: false, error: 'Administrator account not found.' };
    }

    this.admins.delete(id);
    this.saveAdmins();

    // Remove from Firestore
    if (firestoreDb) {
      try {
        const adminDocRef = doc(firestoreDb, 'admins', id);
        await deleteDoc(adminDocRef);
      } catch (err) {
        console.warn('[Firestore] Failed to delete admin from Firestore:', err);
      }
    }

    await this.addLog({
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      action: 'ADMIN_DELETED',
      voucherCode: 'SYSTEM_ADMIN_AUTH',
      status: 'WARNING',
      details: `Administrator account "${target.name}" (${target.email}) was removed by ${actor}.`,
      actor,
    });

    return { success: true };
  }

  public adminToFirestoreDoc(admin: StoredAdminAccount): Record<string, any> {
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      department: admin.department,
      jobTitle: admin.jobTitle,
      phone: admin.phone || '',
      avatarUrl: admin.avatarUrl || '',
      passwordHash: admin.passwordHash,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      createdBy: admin.createdBy || 'System',
    };
  }

  private async syncInitialToFirestore(): Promise<void> {
    if (!firestoreDb) return;
    try {
      // Sync Vouchers
      for (const voucher of this.vouchers.values()) {
        const docRef = doc(firestoreDb, 'vouchers', voucher.id);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) {
          await setDoc(docRef, this.toFirestoreDoc(voucher));
        }
      }

      // Sync Admins
      for (const admin of this.admins.values()) {
        const docRef = doc(firestoreDb, 'admins', admin.id);
        const snapshot = await getDoc(docRef);
        if (!snapshot.exists()) {
          await setDoc(docRef, this.adminToFirestoreDoc(admin));
        }
      }
    } catch (e) {
      console.warn('[Firestore] Initial sync note:', e);
    }
  }

  /**
   * Strips undefined values for Firestore serialization
   */
  public toFirestoreDoc(v: Voucher): Record<string, any> {
    return {
      id: v.id,
      code: v.code,
      status: v.status,
      purchaseId: v.purchaseId,
      customerReference: v.customerReference,
      voucherType: v.voucherType,
      value: v.value,
      currency: v.currency,
      createdAt: v.createdAt,
      expiresAt: v.expiresAt,
      redeemedAt: v.redeemedAt || null,
      redeemedBy: v.redeemedBy || null,
      createdBy: v.createdBy,
      redemptionLocation: v.redemptionLocation || null,
      notes: v.notes,
      title: v.title || '',
      description: v.description || '',
      minSpend: v.minSpend ?? 0,
      maxDiscount: v.maxDiscount ?? null,
      customerName: v.customerName || null,
      customerEmail: v.customerEmail || null,
      orderId: v.purchaseId,
      hash: v.hash || '',
      version: v.version || 1,
    };
  }

  private saveVouchers(): void {
    try {
      const list = Array.from(this.vouchers.values());
      fs.writeFileSync(VOUCHERS_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write vouchers to disk:', err);
    }
  }

  private saveLogs(): void {
    try {
      fs.writeFileSync(LOGS_FILE, JSON.stringify(this.logs, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write logs to disk:', err);
    }
  }

  public normalizeCode(code: string): string {
    return (code || '').trim().toUpperCase().replace(/\s+/g, '');
  }

  public canonicalAlphanumeric(code: string): string {
    return (code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  private registerCodeIndex(code: string, id: string): void {
    const norm = this.normalizeCode(code);
    const canon = this.canonicalAlphanumeric(code);
    this.codeIndex.set(norm, id);
    if (canon) {
      this.codeIndex.set(canon, id);
    }
  }

  public getAllVouchers(): Voucher[] {
    const now = new Date().toISOString();
    let modified = false;
    
    this.vouchers.forEach(v => {
      if (this.normalizeStatus(v.status) === 'ACTIVE' && v.expiresAt && v.expiresAt < now) {
        v.status = 'EXPIRED';
        modified = true;
      }
    });

    if (modified) {
      this.saveVouchers();
    }

    return Array.from(this.vouchers.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getVoucherById(id: string): Voucher | undefined {
    const v = this.vouchers.get(id);
    if (v && this.normalizeStatus(v.status) === 'ACTIVE' && v.expiresAt && v.expiresAt < new Date().toISOString()) {
      v.status = 'EXPIRED';
      this.saveVouchers();
    }
    return v;
  }

  public getVoucherByCode(code: string): Voucher | undefined {
    const normalized = this.normalizeCode(code);
    const canonical = this.canonicalAlphanumeric(code);
    
    let id = this.codeIndex.get(normalized) || this.codeIndex.get(canonical);
    
    if (!id) {
      // Fallback search across map
      for (const v of this.vouchers.values()) {
        if (
          this.normalizeCode(v.code) === normalized ||
          this.canonicalAlphanumeric(v.code) === canonical
        ) {
          id = v.id;
          this.registerCodeIndex(v.code, v.id);
          break;
        }
      }
    }

    if (!id) return undefined;
    return this.getVoucherById(id);
  }

  public async addVoucher(rawVoucher: Voucher): Promise<Voucher> {
    const voucher = this.formatVoucherDoc(rawVoucher);
    this.vouchers.set(voucher.id, voucher);
    this.registerCodeIndex(voucher.code, voucher.id);
    this.saveVouchers();

    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'vouchers', voucher.id), this.toFirestoreDoc(voucher));
      } catch (err) {
        console.warn('[Firestore] async write note:', err);
      }
    }

    return voucher;
  }

  public async updateVoucher(rawVoucher: Voucher): Promise<Voucher> {
    const voucher = this.formatVoucherDoc(rawVoucher);
    this.vouchers.set(voucher.id, voucher);
    this.codeIndex.set(this.normalizeCode(voucher.code), voucher.id);
    this.saveVouchers();

    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'vouchers', voucher.id), this.toFirestoreDoc(voucher));
      } catch (err) {
        console.warn('[Firestore] async update note:', err);
      }
    }

    return voucher;
  }

  public async deleteVoucherById(id: string, actor: string = 'Admin', reason: string = 'Manual deletion'): Promise<boolean> {
    const voucher = this.vouchers.get(id);
    if (!voucher) return false;

    this.vouchers.delete(id);
    const norm = this.normalizeCode(voucher.code);
    const canon = this.canonicalAlphanumeric(voucher.code);
    if (this.codeIndex.get(norm) === id) this.codeIndex.delete(norm);
    if (this.codeIndex.get(canon) === id) this.codeIndex.delete(canon);
    this.saveVouchers();

    if (firestoreDb) {
      try {
        await deleteDoc(doc(firestoreDb, 'vouchers', id));
      } catch (err) {
        console.warn('[Firestore] async delete note:', err);
      }
    }

    await this.addLog({
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      action: 'DELETED',
      voucherCode: voucher.code,
      voucherId: voucher.id,
      status: 'WARNING',
      details: `Voucher permanently deleted from ledger. Reason: ${reason}`,
      actor,
    });

    return true;
  }

  public async deleteVouchers(
    ids: string[],
    actor: string = 'Admin',
    reason: string = 'Batch deletion'
  ): Promise<{ success: boolean; deletedCount: number; deletedCodes: string[] }> {
    const deletedCodes: string[] = [];
    const idsToDelete = Array.from(new Set(ids));

    for (const id of idsToDelete) {
      const voucher = this.vouchers.get(id);
      if (voucher) {
        deletedCodes.push(voucher.code);
        this.vouchers.delete(id);
        const norm = this.normalizeCode(voucher.code);
        const canon = this.canonicalAlphanumeric(voucher.code);
        if (this.codeIndex.get(norm) === id) this.codeIndex.delete(norm);
        if (this.codeIndex.get(canon) === id) this.codeIndex.delete(canon);
      }
    }

    if (deletedCodes.length > 0) {
      this.saveVouchers();

      if (firestoreDb) {
        try {
          const batchSize = 400;
          for (let i = 0; i < idsToDelete.length; i += batchSize) {
            const chunk = idsToDelete.slice(i, i + batchSize);
            const batch = writeBatch(firestoreDb);
            chunk.forEach(id => {
              batch.delete(doc(firestoreDb, 'vouchers', id));
            });
            await batch.commit();
          }
        } catch (err) {
          console.warn('[Firestore] async batch delete note:', err);
        }
      }

      await this.addLog({
        id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        timestamp: new Date().toISOString(),
        action: 'BATCH_DELETED',
        voucherCode: deletedCodes.length === 1 ? deletedCodes[0] : `${deletedCodes.length}_VOUCHERS`,
        status: 'WARNING',
        details: `Batch deleted ${deletedCodes.length} voucher(s) permanently. Reason: ${reason}. Codes: ${deletedCodes.slice(0, 5).join(', ')}${deletedCodes.length > 5 ? ` +${deletedCodes.length - 5} more` : ''}`,
        actor,
      });
    }

    return {
      success: true,
      deletedCount: deletedCodes.length,
      deletedCodes,
    };
  }

  public async deleteVouchersByFilter(
    filter: {
      status?: string;
      type?: string;
      search?: string;
      inactiveOnly?: boolean;
    },
    actor: string = 'Admin',
    reason: string = 'Filter-based batch deletion'
  ): Promise<{ success: boolean; deletedCount: number; deletedCodes: string[] }> {
    const all = this.getAllVouchers();
    const targetIds: string[] = [];

    all.forEach(v => {
      const vStatus = this.normalizeStatus(v.status);
      const vType = v.voucherType || v.type || 'fixed_amount';

      if (filter.inactiveOnly) {
        if (vStatus !== 'REDEEMED' && vStatus !== 'EXPIRED' && vStatus !== 'CANCELLED') {
          return;
        }
      } else if (filter.status && filter.status !== 'all') {
        if (vStatus !== filter.status.toUpperCase()) {
          return;
        }
      }

      if (filter.type && filter.type !== 'all') {
        if (vType !== filter.type) {
          return;
        }
      }

      if (filter.search && filter.search.trim()) {
        const query = filter.search.toLowerCase().trim();
        const matches =
          v.code.toLowerCase().includes(query) ||
          (v.title && v.title.toLowerCase().includes(query)) ||
          (v.customerReference && v.customerReference.toLowerCase().includes(query)) ||
          (v.customerName && v.customerName.toLowerCase().includes(query)) ||
          (v.customerEmail && v.customerEmail.toLowerCase().includes(query)) ||
          (v.purchaseId && v.purchaseId.toLowerCase().includes(query));
        if (!matches) return;
      }

      targetIds.push(v.id);
    });

    return this.deleteVouchers(targetIds, actor, reason);
  }

  public async addLog(log: AuditLog): Promise<void> {
    this.logs.unshift(log);
    if (this.logs.length > 2000) {
      this.logs = this.logs.slice(0, 2000);
    }
    this.saveLogs();

    if (firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'audit_logs', log.id), {
          id: log.id,
          timestamp: log.timestamp,
          action: log.action,
          voucherCode: log.voucherCode,
          voucherId: log.voucherId || null,
          status: log.status,
          details: log.details,
          actor: log.actor,
          terminalId: log.terminalId || null,
          ip: log.ip || null,
        });
      } catch (err) {
        console.warn('[Firestore] async log write note:', err);
      }
    }
  }

  public getLogs(limit: number = 200): AuditLog[] {
    return this.logs.slice(0, limit);
  }

  public getMetrics(): DashboardMetrics {
    const all = this.getAllVouchers();
    let totalIssued = all.length;
    let totalActive = 0;
    let totalRedeemed = 0;
    let totalExpired = 0;
    let totalRevoked = 0;
    let totalCancelled = 0;
    let totalIssuedValue = 0;
    let totalRedeemedValue = 0;

    all.forEach(v => {
      totalIssuedValue += v.value;
      const st = this.normalizeStatus(v.status);
      if (st === 'ACTIVE') totalActive++;
      else if (st === 'REDEEMED') {
        totalRedeemed++;
        totalRedeemedValue += v.value;
      }
      else if (st === 'EXPIRED') totalExpired++;
      else if (st === 'CANCELLED') {
        totalRevoked++;
        totalCancelled++;
      }
    });

    const redemptionRate = totalIssued > 0 ? (totalRedeemed / totalIssued) * 100 : 0;
    const collisionsBlocked = this.logs.filter(l => l.action === 'REDEMPTION_COLLISION_BLOCKED').length;

    return {
      totalIssued,
      totalActive,
      totalRedeemed,
      totalExpired,
      totalRevoked,
      totalCancelled,
      totalIssuedValue,
      totalRedeemedValue,
      redemptionRate: Math.round(redemptionRate * 10) / 10,
      recentAuditLogs: this.logs.slice(0, 15),
      collisionsBlocked,
    };
  }

  /**
   * Acquire a mutex lock for a specific voucher code
   * Ensures serial execution for concurrent redemption calls
   */
  public async withLock<T>(code: string, operation: () => Promise<T>): Promise<T> {
    const normalized = this.normalizeCode(code);
    const existingLock = voucherLocks.get(normalized) || Promise.resolve();

    let releaseLock: () => void;
    const newLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    // Queue lock
    voucherLocks.set(normalized, existingLock.then(() => newLock));

    try {
      await existingLock;
      return await operation();
    } finally {
      releaseLock!();
      if (voucherLocks.get(normalized) === newLock) {
        voucherLocks.delete(normalized);
      }
    }
  }
}

export const db = new VoucherDatabase();

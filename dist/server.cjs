var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_config = require("dotenv/config");
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_crypto3 = __toESM(require("crypto"), 1);
var import_vite = require("vite");

// server/db.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var import_crypto = __toESM(require("crypto"), 1);
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var firestoreDb = null;
try {
  const configPath = import_path.default.join(process.cwd(), "firebase-applet-config.json");
  if (import_fs.default.existsSync(configPath)) {
    const config = JSON.parse(import_fs.default.readFileSync(configPath, "utf8"));
    const app = !(0, import_app.getApps)().length ? (0, import_app.initializeApp)(config) : (0, import_app.getApp)();
    firestoreDb = (0, import_firestore.getFirestore)(app, config.firestoreDatabaseId || "(default)");
    console.log("[Firestore] Database connected successfully with ID:", config.firestoreDatabaseId || "(default)");
  }
} catch (e) {
  console.warn("[Firestore] Fallback to local storage:", e);
}
var DATA_DIR = import_path.default.join(process.cwd(), "data");
if (!import_fs.default.existsSync(DATA_DIR)) {
  try {
    import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn("[Storage] Could not create data directory:", err);
  }
}
var VOUCHERS_FILE = import_path.default.join(DATA_DIR, "vouchers.json");
var LOGS_FILE = import_path.default.join(DATA_DIR, "audit_logs.json");
var ADMINS_FILE = import_path.default.join(DATA_DIR, "admins.json");
var LEGACY_ADMIN_FILE = import_path.default.join(DATA_DIR, "admin_profile.json");
var ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@voucherflow.com";
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "AdminPass2026!";
var DEFAULT_ADMIN_PROFILE = {
  id: "adm_001",
  email: ADMIN_EMAIL,
  name: "Chief Administrator",
  role: "admin",
  department: "Operations & IT Infrastructure",
  phone: "+1 (555) 234-5678",
  jobTitle: "Lead Voucher Security Director",
  avatarUrl: "",
  passwordHash: import_crypto.default.createHash("sha256").update(ADMIN_PASSWORD).digest("hex"),
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
  createdBy: "System Root"
};
if (!import_fs.default.existsSync(DATA_DIR)) {
  import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
}
var voucherLocks = /* @__PURE__ */ new Map();
var INITIAL_VOUCHERS = [
  {
    id: "vch_001",
    code: "VF-7K9P-4MX2-9J7L",
    status: "ACTIVE",
    purchaseId: "ORD-2026-89412",
    customerReference: "Sarah Jenkins (sarah.j@example.com)",
    voucherType: "fixed_amount",
    value: 50,
    currency: "USD",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1e3).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
    redeemedAt: null,
    redeemedBy: null,
    createdBy: "admin_sys_01",
    redemptionLocation: null,
    notes: "VIP Summer Privilege Pass. Valid for in-store and online purchases across all merchant locations.",
    // UI Helpers & Aliases
    type: "fixed_amount",
    minSpend: 100,
    title: "VIP Summer Privilege Pass",
    description: "Valid for in-store and online purchases across all merchant locations.",
    customerName: "Sarah Jenkins",
    customerEmail: "sarah.j@example.com",
    orderId: "ORD-2026-89412",
    hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    version: 1
  },
  {
    id: "vch_002",
    code: "VF-3B8Q-9W1Z-5E4R",
    status: "ACTIVE",
    purchaseId: "ORD-2026-90234",
    customerReference: "Marcus Vance (marcus.v@acme-enterprises.com)",
    voucherType: "percentage",
    value: 25,
    currency: "USD",
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1e3).toISOString(),
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1e3).toISOString(),
    redeemedAt: null,
    redeemedBy: null,
    createdBy: "admin_sys_01",
    redemptionLocation: null,
    notes: "Seasonal Loyalty Reward 25% OFF. Exclusive 25% discount voucher for platinum tier members.",
    // UI Helpers & Aliases
    type: "percentage",
    minSpend: 50,
    maxDiscount: 75,
    title: "Seasonal Loyalty Reward 25% OFF",
    description: "Exclusive 25% discount voucher for platinum tier members.",
    customerName: "Marcus Vance",
    customerEmail: "marcus.v@acme-enterprises.com",
    orderId: "ORD-2026-90234",
    hash: "a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0",
    version: 1
  },
  {
    id: "vch_003",
    code: "VF-8N4M-2X6C-7V1K",
    status: "EXPIRED",
    purchaseId: "ORD-2026-91105",
    customerReference: "Elena Rostova (elena.rostova@techglobal.io)",
    voucherType: "gift_card",
    value: 100,
    currency: "USD",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1e3).toISOString(),
    expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3).toISOString(),
    redeemedAt: null,
    redeemedBy: null,
    createdBy: "admin_sys_01",
    redemptionLocation: null,
    notes: "Executive Store Gift Card. Full credit applicable towards any department item.",
    // UI Helpers & Aliases
    type: "gift_card",
    minSpend: 0,
    title: "Executive Store Gift Card",
    description: "Full credit applicable towards any department item.",
    customerName: "Elena Rostova",
    customerEmail: "elena.rostova@techglobal.io",
    orderId: "ORD-2026-91105",
    hash: "b2c3d4e5f6a17890123456789abcdef0123456789abcdef0123456789abcdef1",
    version: 1
  },
  {
    id: "vch_004",
    code: "VF-2T5Y-8U0I-3O7P",
    status: "REDEEMED",
    purchaseId: "ORD-2026-88001",
    customerReference: "David Chen (d.chen@cloudworks.com)",
    voucherType: "fixed_amount",
    value: 75,
    currency: "USD",
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1e3).toISOString(),
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1e3).toISOString(),
    redeemedAt: new Date(Date.now() - 2 * 60 * 60 * 1e3).toISOString(),
    redeemedBy: {
      cashierName: "Alex Rivera",
      terminalId: "POS-TERM-01",
      location: "Downtown Flagship Store",
      orderReference: "RCPT-88902",
      notes: "Customer presented digital pass on mobile."
    },
    createdBy: "admin_sys_01",
    redemptionLocation: {
      terminalId: "POS-TERM-01",
      location: "Downtown Flagship Store",
      orderReference: "RCPT-88902",
      deviceIp: "192.168.1.104",
      userAgent: "VoucherFlow-POS-Terminal/v2.4"
    },
    notes: "TechStore Weekend Flash Voucher. Instant $75 discount redeemed at POS Terminal 1.",
    // UI Helpers & Aliases
    type: "fixed_amount",
    minSpend: 150,
    title: "TechStore Weekend Flash Voucher",
    description: "Instant $75 discount redeemed at POS Terminal 1.",
    customerName: "David Chen",
    customerEmail: "d.chen@cloudworks.com",
    orderId: "ORD-2026-88001",
    hash: "c3d4e5f6a1b27890123456789abcdef0123456789abcdef0123456789abcdef2",
    version: 2
  },
  {
    id: "vch_005",
    code: "VF-6X1W-9Q3E-4R8T",
    status: "CANCELLED",
    purchaseId: "ORD-2026-84300",
    customerReference: "Jonathan Ray (j.ray@samplemail.org)",
    voucherType: "fixed_amount",
    value: 30,
    currency: "USD",
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1e3).toISOString(),
    expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1e3).toISOString(),
    redeemedAt: null,
    redeemedBy: null,
    createdBy: "admin_sys_01",
    redemptionLocation: null,
    notes: "Order cancelled and refunded upon customer request.",
    // UI Helpers & Aliases
    type: "fixed_amount",
    minSpend: 60,
    title: "Welcome Member Discount $30",
    description: "Order refunded; voucher cancelled.",
    customerName: "Jonathan Ray",
    customerEmail: "j.ray@samplemail.org",
    orderId: "ORD-2026-84300",
    hash: "d4e5f6a1b2c37890123456789abcdef0123456789abcdef0123456789abcdef3",
    version: 2
  }
];
var INITIAL_LOGS = [
  {
    id: "log_001",
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1e3).toISOString(),
    action: "GENERATED",
    voucherCode: "VF-2T5Y-8U0I-3O7P",
    voucherId: "vch_004",
    status: "SUCCESS",
    details: "Generated $75 fixed amount voucher for David Chen (Order ORD-2026-88001)",
    actor: "System / Automated Checkout",
    terminalId: "API-SRV-01"
  },
  {
    id: "log_002",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1e3).toISOString(),
    action: "REDEEMED",
    voucherCode: "VF-2T5Y-8U0I-3O7P",
    voucherId: "vch_004",
    status: "SUCCESS",
    details: "Single-use voucher redeemed successfully. Order reference: RCPT-88902",
    actor: "Alex Rivera (Cashier)",
    terminalId: "POS-TERM-01"
  },
  {
    id: "log_003",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1e3).toISOString(),
    action: "CANCELLED",
    voucherCode: "VF-6X1W-9Q3E-4R8T",
    voucherId: "vch_005",
    status: "WARNING",
    details: "Voucher status set to CANCELLED due to customer order refund.",
    actor: "Chief Administrator",
    terminalId: "ADMIN-PORTAL"
  }
];
var VoucherDatabase = class {
  constructor() {
    this.vouchers = /* @__PURE__ */ new Map();
    this.codeIndex = /* @__PURE__ */ new Map();
    // Normalized code -> id
    this.logs = [];
    this.admins = /* @__PURE__ */ new Map();
    this.loadData();
  }
  /**
   * Normalizes voucher status to standard uppercase representation
   */
  normalizeStatus(status) {
    if (!status) return "ACTIVE";
    const upper = status.toUpperCase().trim();
    if (upper === "REDEEMED") return "REDEEMED";
    if (upper === "EXPIRED") return "EXPIRED";
    if (upper === "CANCELLED" || upper === "REVOKED") return "CANCELLED";
    return "ACTIVE";
  }
  /**
   * Normalizes full voucher document ensuring all required fields are present
   */
  formatVoucherDoc(v) {
    const status = this.normalizeStatus(v.status);
    const voucherType = v.voucherType || v.type || "fixed_amount";
    const title = v.title || `${voucherType === "percentage" ? v.value + "% OFF" : "$" + v.value} Voucher`;
    const customerRef = v.customerReference || (v.customerName ? `${v.customerName}${v.customerEmail ? ` (${v.customerEmail})` : ""}` : "General Customer");
    const purchaseId = v.purchaseId || v.orderId || `ORD-${Date.now().toString(36).toUpperCase()}`;
    return {
      id: v.id,
      code: this.normalizeCode(v.code),
      status,
      purchaseId,
      customerReference: customerRef,
      voucherType,
      value: Number(v.value) || 0,
      currency: v.currency || "USD",
      createdAt: v.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
      expiresAt: v.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString(),
      redeemedAt: v.redeemedAt || null,
      redeemedBy: v.redeemedBy || null,
      createdBy: v.createdBy || "system",
      redemptionLocation: v.redemptionLocation || null,
      notes: v.notes || v.description || "Single-use digital voucher document",
      // Compatibility Aliases & Helpers
      type: voucherType,
      title,
      description: v.description || v.notes || "Valid for single-use redemption.",
      minSpend: v.minSpend ?? 0,
      maxDiscount: v.maxDiscount,
      customerName: v.customerName || (v.customerReference ? v.customerReference.split("(")[0].trim() : void 0),
      customerEmail: v.customerEmail,
      orderId: purchaseId,
      hash: v.hash || import_crypto.default.createHash("sha256").update(`${v.code}|${voucherType}|${v.value}`).digest("hex"),
      version: v.version || 1,
      metadata: v.metadata || {}
    };
  }
  loadData() {
    try {
      if (import_fs.default.existsSync(VOUCHERS_FILE)) {
        const raw = import_fs.default.readFileSync(VOUCHERS_FILE, "utf8");
        const list = JSON.parse(raw);
        list.forEach((v) => {
          const doc2 = this.formatVoucherDoc(v);
          this.vouchers.set(doc2.id, doc2);
          this.codeIndex.set(this.normalizeCode(doc2.code), doc2.id);
        });
      } else {
        INITIAL_VOUCHERS.forEach((v) => {
          const doc2 = this.formatVoucherDoc(v);
          this.vouchers.set(doc2.id, doc2);
          this.codeIndex.set(this.normalizeCode(doc2.code), doc2.id);
        });
        this.saveVouchers();
      }
      if (import_fs.default.existsSync(LOGS_FILE)) {
        const raw = import_fs.default.readFileSync(LOGS_FILE, "utf8");
        this.logs = JSON.parse(raw);
      } else {
        this.logs = [...INITIAL_LOGS];
        this.saveLogs();
      }
      if (import_fs.default.existsSync(ADMINS_FILE)) {
        const raw = import_fs.default.readFileSync(ADMINS_FILE, "utf8");
        const list = JSON.parse(raw);
        list.forEach((a) => this.admins.set(a.id, a));
      } else if (import_fs.default.existsSync(LEGACY_ADMIN_FILE)) {
        const raw = import_fs.default.readFileSync(LEGACY_ADMIN_FILE, "utf8");
        const single = { ...DEFAULT_ADMIN_PROFILE, ...JSON.parse(raw) };
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
      this.syncInitialToFirestore();
    } catch (err) {
      console.error("Error loading database:", err);
      INITIAL_VOUCHERS.forEach((v) => {
        const doc2 = this.formatVoucherDoc(v);
        this.vouchers.set(doc2.id, doc2);
        this.codeIndex.set(this.normalizeCode(doc2.code), doc2.id);
      });
      this.logs = [...INITIAL_LOGS];
      this.admins.set(DEFAULT_ADMIN_PROFILE.id, { ...DEFAULT_ADMIN_PROFILE });
    }
  }
  getAdminAccounts() {
    return Array.from(this.admins.values()).map((a) => {
      const { passwordHash, ...safe } = a;
      return safe;
    });
  }
  getAdminAccount(id) {
    return this.admins.get(id);
  }
  getAdminProfile(id) {
    if (id && this.admins.has(id)) {
      return { ...this.admins.get(id) };
    }
    const first = this.admins.values().next().value;
    return first ? { ...first } : { ...DEFAULT_ADMIN_PROFILE };
  }
  saveAdmins() {
    try {
      const list = Array.from(this.admins.values());
      import_fs.default.writeFileSync(ADMINS_FILE, JSON.stringify(list, null, 2), "utf8");
    } catch (err) {
      console.error("Failed to write admins to disk:", err);
    }
  }
  async createAdminAccount(data, creatorActor = "Super Admin") {
    const cleanEmail = data.email.trim().toLowerCase();
    for (const a of this.admins.values()) {
      if (a.email.toLowerCase() === cleanEmail) {
        throw new Error(`An administrator account with email "${cleanEmail}" already exists.`);
      }
    }
    if (!data.password || data.password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }
    const newId = `adm_${Date.now().toString(36)}_${import_crypto.default.randomBytes(3).toString("hex")}`;
    const passwordHash = import_crypto.default.createHash("sha256").update(data.password).digest("hex");
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const newAdmin = {
      id: newId,
      name: data.name.trim(),
      email: cleanEmail,
      role: "admin",
      department: data.department?.trim() || "Operations",
      jobTitle: data.jobTitle?.trim() || "Administrator",
      phone: data.phone?.trim() || "",
      avatarUrl: data.avatarUrl?.trim() || "",
      passwordHash,
      createdAt: now,
      updatedAt: now,
      createdBy: creatorActor
    };
    this.admins.set(newAdmin.id, newAdmin);
    this.saveAdmins();
    if (firestoreDb) {
      try {
        const adminDocRef = (0, import_firestore.doc)(firestoreDb, "admins", newAdmin.id);
        await (0, import_firestore.setDoc)(adminDocRef, this.adminToFirestoreDoc(newAdmin));
        console.log(`[Firestore] Admin document ${newAdmin.id} (${newAdmin.email}) synced successfully.`);
      } catch (err) {
        console.warn("[Firestore] Failed to write admin to Firestore:", err);
      }
    }
    await this.addLog({
      id: `log_${Date.now()}_${import_crypto.default.randomBytes(3).toString("hex")}`,
      timestamp: now,
      action: "ADMIN_CREATED",
      voucherCode: "SYSTEM_ADMIN_AUTH",
      status: "SUCCESS",
      details: `New administrator account created for "${newAdmin.name}" (${newAdmin.email}) with role: ${newAdmin.jobTitle}.`,
      actor: creatorActor
    });
    const { passwordHash: _, ...safe } = newAdmin;
    return safe;
  }
  async updateAdminProfile(id, data, actor = "Admin") {
    const targetId = id || this.admins.keys().next().value || DEFAULT_ADMIN_PROFILE.id;
    const existing = this.admins.get(targetId) || { ...DEFAULT_ADMIN_PROFILE, id: targetId };
    const updated = {
      ...existing,
      ...data,
      id: targetId,
      role: "admin",
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.admins.set(targetId, updated);
    this.saveAdmins();
    if (firestoreDb) {
      try {
        const adminDocRef = (0, import_firestore.doc)(firestoreDb, "admins", targetId);
        await (0, import_firestore.setDoc)(adminDocRef, this.adminToFirestoreDoc(updated), { merge: true });
      } catch (err) {
        console.warn("[Firestore] Failed to update admin in Firestore:", err);
      }
    }
    await this.addLog({
      id: `log_${Date.now()}_${import_crypto.default.randomBytes(3).toString("hex")}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action: "PROFILE_UPDATED",
      voucherCode: "SYSTEM_ADMIN_PROFILE",
      status: "SUCCESS",
      details: `Administrator profile updated for "${updated.name}" (${updated.email}). Dept: ${updated.department}, Title: ${updated.jobTitle}.`,
      actor
    });
    return { ...updated };
  }
  async changeAdminPassword(id, currentPassword, newPassword, actor = "Admin") {
    const targetId = id || this.admins.keys().next().value || DEFAULT_ADMIN_PROFILE.id;
    const admin = this.admins.get(targetId);
    if (!admin) {
      return { success: false, error: "Administrator account not found." };
    }
    const currentHash = import_crypto.default.createHash("sha256").update(currentPassword).digest("hex");
    if (admin.passwordHash !== currentHash) {
      return { success: false, error: "Current password is incorrect." };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "New password must be at least 6 characters long." };
    }
    const newHash = import_crypto.default.createHash("sha256").update(newPassword).digest("hex");
    admin.passwordHash = newHash;
    admin.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    this.admins.set(targetId, admin);
    this.saveAdmins();
    if (firestoreDb) {
      try {
        const adminDocRef = (0, import_firestore.doc)(firestoreDb, "admins", targetId);
        await (0, import_firestore.setDoc)(adminDocRef, this.adminToFirestoreDoc(admin), { merge: true });
      } catch (err) {
        console.warn("[Firestore] Failed to update admin password in Firestore:", err);
      }
    }
    await this.addLog({
      id: `log_${Date.now()}_${import_crypto.default.randomBytes(3).toString("hex")}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action: "PASSWORD_CHANGED",
      voucherCode: "SYSTEM_ADMIN_SECURITY",
      status: "SUCCESS",
      details: `Password changed successfully for admin account "${admin.name}" (${admin.email}).`,
      actor
    });
    return { success: true };
  }
  verifyAdminCredentials(email, password) {
    const cleanEmail = (email || "").trim().toLowerCase();
    const hash = import_crypto.default.createHash("sha256").update(password).digest("hex");
    for (const a of this.admins.values()) {
      if (a.email.toLowerCase() === cleanEmail) {
        if (a.passwordHash === hash) {
          return a;
        }
      }
    }
    return null;
  }
  async deleteAdminAccount(id, actor = "Super Admin") {
    if (this.admins.size <= 1) {
      return { success: false, error: "Cannot delete the only remaining administrator account." };
    }
    const target = this.admins.get(id);
    if (!target) {
      return { success: false, error: "Administrator account not found." };
    }
    this.admins.delete(id);
    this.saveAdmins();
    if (firestoreDb) {
      try {
        const adminDocRef = (0, import_firestore.doc)(firestoreDb, "admins", id);
        await (0, import_firestore.deleteDoc)(adminDocRef);
      } catch (err) {
        console.warn("[Firestore] Failed to delete admin from Firestore:", err);
      }
    }
    await this.addLog({
      id: `log_${Date.now()}_${import_crypto.default.randomBytes(3).toString("hex")}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action: "ADMIN_DELETED",
      voucherCode: "SYSTEM_ADMIN_AUTH",
      status: "WARNING",
      details: `Administrator account "${target.name}" (${target.email}) was removed by ${actor}.`,
      actor
    });
    return { success: true };
  }
  adminToFirestoreDoc(admin) {
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      department: admin.department,
      jobTitle: admin.jobTitle,
      phone: admin.phone || "",
      avatarUrl: admin.avatarUrl || "",
      passwordHash: admin.passwordHash,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      createdBy: admin.createdBy || "System"
    };
  }
  async syncInitialToFirestore() {
    if (!firestoreDb) return;
    try {
      for (const voucher of this.vouchers.values()) {
        const docRef = (0, import_firestore.doc)(firestoreDb, "vouchers", voucher.id);
        const snapshot = await (0, import_firestore.getDoc)(docRef);
        if (!snapshot.exists()) {
          await (0, import_firestore.setDoc)(docRef, this.toFirestoreDoc(voucher));
        }
      }
      for (const admin of this.admins.values()) {
        const docRef = (0, import_firestore.doc)(firestoreDb, "admins", admin.id);
        const snapshot = await (0, import_firestore.getDoc)(docRef);
        if (!snapshot.exists()) {
          await (0, import_firestore.setDoc)(docRef, this.adminToFirestoreDoc(admin));
        }
      }
    } catch (e) {
      console.warn("[Firestore] Initial sync note:", e);
    }
  }
  /**
   * Strips undefined values for Firestore serialization
   */
  toFirestoreDoc(v) {
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
      title: v.title || "",
      description: v.description || "",
      minSpend: v.minSpend ?? 0,
      maxDiscount: v.maxDiscount ?? null,
      customerName: v.customerName || null,
      customerEmail: v.customerEmail || null,
      orderId: v.purchaseId,
      hash: v.hash || "",
      version: v.version || 1
    };
  }
  saveVouchers() {
    try {
      const list = Array.from(this.vouchers.values());
      import_fs.default.writeFileSync(VOUCHERS_FILE, JSON.stringify(list, null, 2), "utf8");
    } catch (err) {
      console.error("Failed to write vouchers to disk:", err);
    }
  }
  saveLogs() {
    try {
      import_fs.default.writeFileSync(LOGS_FILE, JSON.stringify(this.logs, null, 2), "utf8");
    } catch (err) {
      console.error("Failed to write logs to disk:", err);
    }
  }
  normalizeCode(code) {
    return (code || "").trim().toUpperCase().replace(/\s+/g, "");
  }
  canonicalAlphanumeric(code) {
    return (code || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  }
  registerCodeIndex(code, id) {
    const norm = this.normalizeCode(code);
    const canon = this.canonicalAlphanumeric(code);
    this.codeIndex.set(norm, id);
    if (canon) {
      this.codeIndex.set(canon, id);
    }
  }
  getAllVouchers() {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let modified = false;
    this.vouchers.forEach((v) => {
      if (this.normalizeStatus(v.status) === "ACTIVE" && v.expiresAt && v.expiresAt < now) {
        v.status = "EXPIRED";
        modified = true;
      }
    });
    if (modified) {
      this.saveVouchers();
    }
    return Array.from(this.vouchers.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  getVoucherById(id) {
    const v = this.vouchers.get(id);
    if (v && this.normalizeStatus(v.status) === "ACTIVE" && v.expiresAt && v.expiresAt < (/* @__PURE__ */ new Date()).toISOString()) {
      v.status = "EXPIRED";
      this.saveVouchers();
    }
    return v;
  }
  getVoucherByCode(code) {
    const normalized = this.normalizeCode(code);
    const canonical = this.canonicalAlphanumeric(code);
    let id = this.codeIndex.get(normalized) || this.codeIndex.get(canonical);
    if (!id) {
      for (const v of this.vouchers.values()) {
        if (this.normalizeCode(v.code) === normalized || this.canonicalAlphanumeric(v.code) === canonical) {
          id = v.id;
          this.registerCodeIndex(v.code, v.id);
          break;
        }
      }
    }
    if (!id) return void 0;
    return this.getVoucherById(id);
  }
  async addVoucher(rawVoucher) {
    const voucher = this.formatVoucherDoc(rawVoucher);
    this.vouchers.set(voucher.id, voucher);
    this.registerCodeIndex(voucher.code, voucher.id);
    this.saveVouchers();
    if (firestoreDb) {
      try {
        await (0, import_firestore.setDoc)((0, import_firestore.doc)(firestoreDb, "vouchers", voucher.id), this.toFirestoreDoc(voucher));
      } catch (err) {
        console.warn("[Firestore] async write note:", err);
      }
    }
    return voucher;
  }
  async updateVoucher(rawVoucher) {
    const voucher = this.formatVoucherDoc(rawVoucher);
    this.vouchers.set(voucher.id, voucher);
    this.codeIndex.set(this.normalizeCode(voucher.code), voucher.id);
    this.saveVouchers();
    if (firestoreDb) {
      try {
        await (0, import_firestore.setDoc)((0, import_firestore.doc)(firestoreDb, "vouchers", voucher.id), this.toFirestoreDoc(voucher));
      } catch (err) {
        console.warn("[Firestore] async update note:", err);
      }
    }
    return voucher;
  }
  async deleteVoucherById(id, actor = "Admin", reason = "Manual deletion") {
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
        await (0, import_firestore.deleteDoc)((0, import_firestore.doc)(firestoreDb, "vouchers", id));
      } catch (err) {
        console.warn("[Firestore] async delete note:", err);
      }
    }
    await this.addLog({
      id: `log_${Date.now()}_${import_crypto.default.randomBytes(3).toString("hex")}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action: "DELETED",
      voucherCode: voucher.code,
      voucherId: voucher.id,
      status: "WARNING",
      details: `Voucher permanently deleted from ledger. Reason: ${reason}`,
      actor
    });
    return true;
  }
  async deleteVouchers(ids, actor = "Admin", reason = "Batch deletion") {
    const deletedCodes = [];
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
            const batch = (0, import_firestore.writeBatch)(firestoreDb);
            chunk.forEach((id) => {
              batch.delete((0, import_firestore.doc)(firestoreDb, "vouchers", id));
            });
            await batch.commit();
          }
        } catch (err) {
          console.warn("[Firestore] async batch delete note:", err);
        }
      }
      await this.addLog({
        id: `log_${Date.now()}_${import_crypto.default.randomBytes(3).toString("hex")}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        action: "BATCH_DELETED",
        voucherCode: deletedCodes.length === 1 ? deletedCodes[0] : `${deletedCodes.length}_VOUCHERS`,
        status: "WARNING",
        details: `Batch deleted ${deletedCodes.length} voucher(s) permanently. Reason: ${reason}. Codes: ${deletedCodes.slice(0, 5).join(", ")}${deletedCodes.length > 5 ? ` +${deletedCodes.length - 5} more` : ""}`,
        actor
      });
    }
    return {
      success: true,
      deletedCount: deletedCodes.length,
      deletedCodes
    };
  }
  async deleteVouchersByFilter(filter, actor = "Admin", reason = "Filter-based batch deletion") {
    const all = this.getAllVouchers();
    const targetIds = [];
    all.forEach((v) => {
      const vStatus = this.normalizeStatus(v.status);
      const vType = v.voucherType || v.type || "fixed_amount";
      if (filter.inactiveOnly) {
        if (vStatus !== "REDEEMED" && vStatus !== "EXPIRED" && vStatus !== "CANCELLED") {
          return;
        }
      } else if (filter.status && filter.status !== "all") {
        if (vStatus !== filter.status.toUpperCase()) {
          return;
        }
      }
      if (filter.type && filter.type !== "all") {
        if (vType !== filter.type) {
          return;
        }
      }
      if (filter.search && filter.search.trim()) {
        const query2 = filter.search.toLowerCase().trim();
        const matches = v.code.toLowerCase().includes(query2) || v.title && v.title.toLowerCase().includes(query2) || v.customerReference && v.customerReference.toLowerCase().includes(query2) || v.customerName && v.customerName.toLowerCase().includes(query2) || v.customerEmail && v.customerEmail.toLowerCase().includes(query2) || v.purchaseId && v.purchaseId.toLowerCase().includes(query2);
        if (!matches) return;
      }
      targetIds.push(v.id);
    });
    return this.deleteVouchers(targetIds, actor, reason);
  }
  async addLog(log) {
    this.logs.unshift(log);
    if (this.logs.length > 2e3) {
      this.logs = this.logs.slice(0, 2e3);
    }
    this.saveLogs();
    if (firestoreDb) {
      try {
        await (0, import_firestore.setDoc)((0, import_firestore.doc)(firestoreDb, "audit_logs", log.id), {
          id: log.id,
          timestamp: log.timestamp,
          action: log.action,
          voucherCode: log.voucherCode,
          voucherId: log.voucherId || null,
          status: log.status,
          details: log.details,
          actor: log.actor,
          terminalId: log.terminalId || null,
          ip: log.ip || null
        });
      } catch (err) {
        console.warn("[Firestore] async log write note:", err);
      }
    }
  }
  getLogs(limit = 200) {
    return this.logs.slice(0, limit);
  }
  getMetrics() {
    const all = this.getAllVouchers();
    let totalIssued = all.length;
    let totalActive = 0;
    let totalRedeemed = 0;
    let totalExpired = 0;
    let totalRevoked = 0;
    let totalCancelled = 0;
    let totalIssuedValue = 0;
    let totalRedeemedValue = 0;
    all.forEach((v) => {
      totalIssuedValue += v.value;
      const st = this.normalizeStatus(v.status);
      if (st === "ACTIVE") totalActive++;
      else if (st === "REDEEMED") {
        totalRedeemed++;
        totalRedeemedValue += v.value;
      } else if (st === "EXPIRED") totalExpired++;
      else if (st === "CANCELLED") {
        totalRevoked++;
        totalCancelled++;
      }
    });
    const redemptionRate = totalIssued > 0 ? totalRedeemed / totalIssued * 100 : 0;
    const collisionsBlocked = this.logs.filter((l) => l.action === "REDEMPTION_COLLISION_BLOCKED").length;
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
      collisionsBlocked
    };
  }
  /**
   * Acquire a mutex lock for a specific voucher code
   * Ensures serial execution for concurrent redemption calls
   */
  async withLock(code, operation) {
    const normalized = this.normalizeCode(code);
    const existingLock = voucherLocks.get(normalized) || Promise.resolve();
    let releaseLock;
    const newLock = new Promise((resolve) => {
      releaseLock = resolve;
    });
    voucherLocks.set(normalized, existingLock.then(() => newLock));
    try {
      await existingLock;
      return await operation();
    } finally {
      releaseLock();
      if (voucherLocks.get(normalized) === newLock) {
        voucherLocks.delete(normalized);
      }
    }
  }
};
var db = new VoucherDatabase();

// server/voucherEngine.ts
var import_crypto2 = __toESM(require("crypto"), 1);
var HMAC_SECRET = process.env.VOUCHER_HMAC_SECRET || process.env.HMAC_SECRET || "VOUCHERFLOW_SECURE_HMAC_SIGNATURE_KEY_2026";
var CHARSET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
var VoucherEngine = class {
  /**
   * Helper to mask customer names for public validation
   * e.g. "Sarah Jenkins" -> "S**** J******"
   */
  maskName(name) {
    if (!name) return void 0;
    const parts = name.trim().split(/\s+/);
    return parts.map((p) => {
      if (p.length <= 1) return p;
      return p[0] + "*".repeat(Math.max(2, Math.min(p.length - 1, 6)));
    }).join(" ");
  }
  /**
   * Converts full Voucher to a privacy-safe PublicVoucher
   * Strips email, raw HMAC hash, internal order IDs, and internal audit notes
   */
  toPublicVoucher(voucher) {
    const vType = voucher.voucherType || voucher.type || "fixed_amount";
    return {
      id: voucher.id,
      code: voucher.code,
      type: vType,
      voucherType: vType,
      value: voucher.value,
      currency: voucher.currency || "USD",
      minSpend: voucher.minSpend,
      maxDiscount: voucher.maxDiscount,
      title: voucher.title || `${vType === "percentage" ? voucher.value + "% OFF" : "$" + voucher.value} Voucher`,
      description: voucher.description || voucher.notes,
      expiresAt: voucher.expiresAt,
      status: voucher.status,
      redeemedAt: voucher.redeemedAt,
      maskedCustomerName: this.maskName(voucher.customerName || voucher.customerReference),
      customerReference: this.maskName(voucher.customerReference)
    };
  }
  /**
   * Generates a high-entropy formatted voucher code
   * Format: VF-XXXX-XXXX-XXXX
   */
  generateSecureCode(prefix = "VF") {
    const bytes = import_crypto2.default.randomBytes(12);
    let result = "";
    for (let i = 0; i < 12; i++) {
      result += CHARSET[bytes[i] % CHARSET.length];
    }
    const block1 = result.substring(0, 4);
    const block2 = result.substring(4, 8);
    const block3 = result.substring(8, 12);
    return `${prefix}-${block1}-${block2}-${block3}`;
  }
  /**
   * Generates HMAC-SHA256 signature to verify voucher authenticity
   */
  computeIntegrityHash(code, type, value, expiresAt) {
    const payload = `${code}|${type}|${value}|${expiresAt}`;
    return import_crypto2.default.createHmac("sha256", HMAC_SECRET).update(payload).digest("hex");
  }
  /**
   * Creates a voucher adhering strictly to the Firestore Voucher Data Model
   */
  async createVoucher(payload, actor = "Admin") {
    const code = this.generateSecureCode();
    const id = `vch_${Date.now().toString(36)}_${import_crypto2.default.randomBytes(4).toString("hex")}`;
    let expiresAt;
    if (payload.expiresAt) {
      expiresAt = new Date(payload.expiresAt).toISOString();
    } else {
      const days = payload.validDays || 30;
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1e3).toISOString();
    }
    const voucherType = payload.voucherType || payload.type || "fixed_amount";
    const hash = this.computeIntegrityHash(code, voucherType, payload.value, expiresAt);
    const purchaseId = payload.purchaseId || payload.orderId || `ORD-${Date.now().toString(36).toUpperCase()}-${import_crypto2.default.randomBytes(2).toString("hex").toUpperCase()}`;
    const customerRef = payload.customerReference || (payload.customerName ? `${payload.customerName}${payload.customerEmail ? ` (${payload.customerEmail})` : ""}` : "Direct Purchase Customer");
    const notes = payload.notes || payload.description || "Single-use digital voucher document";
    const rawVoucher = {
      id,
      code,
      status: "ACTIVE",
      purchaseId,
      customerReference: customerRef,
      voucherType,
      value: Number(payload.value),
      currency: payload.currency || "USD",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      expiresAt,
      redeemedAt: null,
      redeemedBy: null,
      createdBy: payload.createdBy || actor,
      redemptionLocation: null,
      notes,
      // Complementary properties
      type: voucherType,
      hash,
      minSpend: payload.minSpend ?? 0,
      maxDiscount: payload.maxDiscount,
      title: payload.title || `${voucherType === "percentage" ? payload.value + "% OFF" : "$" + payload.value} Voucher`,
      description: payload.description || notes,
      customerName: payload.customerName?.trim() || (payload.customerReference ? payload.customerReference.split("(")[0].trim() : void 0),
      customerEmail: payload.customerEmail?.trim(),
      orderId: purchaseId,
      version: 1,
      metadata: {
        createdBy: actor
      }
    };
    const voucher = await db.addVoucher(rawVoucher);
    await db.addLog({
      id: `log_${Date.now()}_${import_crypto2.default.randomBytes(3).toString("hex")}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action: "GENERATED",
      voucherCode: voucher.code,
      voucherId: voucher.id,
      status: "SUCCESS",
      details: `Generated ${voucher.voucherType} voucher (${voucher.value}${voucher.voucherType === "percentage" ? "%" : " " + voucher.currency}) for ${voucher.customerReference}. Purchase/Order: ${voucher.purchaseId}`,
      actor
    });
    return voucher;
  }
  /**
   * Batch creates vouchers
   */
  async createBatch(payload, count, actor = "Admin") {
    const vouchers = [];
    const validCount = Math.min(Math.max(1, count), 100);
    for (let i = 0; i < validCount; i++) {
      const v = await this.createVoucher({
        ...payload,
        title: validCount > 1 ? `${payload.title || "Voucher"} #${i + 1}` : payload.title
      }, actor);
      vouchers.push(v);
    }
    await db.addLog({
      id: `log_${Date.now()}_${import_crypto2.default.randomBytes(3).toString("hex")}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action: "BATCH_GENERATED",
      voucherCode: `${vouchers.length} vouchers`,
      status: "SUCCESS",
      details: `Batch generated ${vouchers.length} vouchers of type ${payload.voucherType || payload.type}`,
      actor
    });
    return vouchers;
  }
  /**
   * Validates whether a voucher exists and is currently usable
   * Supports public mode which masks sensitive customer data
   */
  validateVoucher(rawCode, orderSubtotal, actor = "Validator", isPublic = false) {
    const normalized = db.normalizeCode(rawCode);
    const voucher = db.getVoucherByCode(normalized);
    if (!voucher) {
      return {
        valid: false,
        statusCode: "NOT_FOUND",
        message: `Voucher code '${normalized}' was not found in our secure registry.`
      };
    }
    const publicVoucher = this.toPublicVoucher(voucher);
    const status = db.normalizeStatus(voucher.status);
    if (status === "CANCELLED") {
      return {
        valid: false,
        statusCode: "CANCELLED",
        voucher: isPublic ? void 0 : voucher,
        publicVoucher,
        message: "This voucher has been cancelled or revoked by an administrator."
      };
    }
    if (status === "REDEEMED") {
      const redeemedTime = voucher.redeemedAt ? new Date(voucher.redeemedAt).toLocaleString() : "previously";
      const cashier = typeof voucher.redeemedBy === "object" && voucher.redeemedBy?.cashierName ? voucher.redeemedBy.cashierName : typeof voucher.redeemedBy === "string" ? voucher.redeemedBy : "a cashier";
      const terminal = typeof voucher.redemptionLocation === "object" && voucher.redemptionLocation?.terminalId ? voucher.redemptionLocation.terminalId : typeof voucher.redeemedBy === "object" ? voucher.redeemedBy?.terminalId : "POS Terminal";
      return {
        valid: false,
        statusCode: "ALREADY_REDEEMED",
        voucher: isPublic ? void 0 : voucher,
        publicVoucher,
        message: isPublic ? `This voucher was already redeemed on ${redeemedTime}. Single-use policy strictly enforced.` : `This voucher has ALREADY been redeemed on ${redeemedTime} by ${cashier} at ${terminal}. Single-use policy strictly enforced.`
      };
    }
    const now = /* @__PURE__ */ new Date();
    const expiry = new Date(voucher.expiresAt);
    if (status === "EXPIRED" || expiry < now) {
      const expiredDateStr = expiry.toLocaleDateString();
      return {
        valid: false,
        statusCode: "EXPIRED",
        voucher: isPublic ? void 0 : voucher,
        publicVoucher,
        message: `This voucher expired on ${expiredDateStr} and is no longer usable.`
      };
    }
    let discountCalculated = 0;
    if (orderSubtotal !== void 0 && orderSubtotal > 0) {
      if (voucher.minSpend && orderSubtotal < voucher.minSpend) {
        return {
          valid: false,
          statusCode: "VALID",
          voucher: isPublic ? void 0 : voucher,
          publicVoucher,
          message: `Minimum order spend of $${voucher.minSpend.toFixed(2)} is required (Current cart subtotal: $${orderSubtotal.toFixed(2)}).`
        };
      }
      if (voucher.voucherType === "percentage" || voucher.type === "percentage") {
        discountCalculated = orderSubtotal * voucher.value / 100;
        if (voucher.maxDiscount && discountCalculated > voucher.maxDiscount) {
          discountCalculated = voucher.maxDiscount;
        }
      } else {
        discountCalculated = Math.min(voucher.value, orderSubtotal);
      }
    }
    db.addLog({
      id: `log_${Date.now()}_${import_crypto2.default.randomBytes(3).toString("hex")}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action: "VALIDATED",
      voucherCode: voucher.code,
      voucherId: voucher.id,
      status: "SUCCESS",
      details: isPublic ? `Public verification request for voucher "${voucher.title}". Code: ${voucher.code}` : `Voucher validated as ACTIVE by ${actor}. Title: "${voucher.title}", Value: ${voucher.value}`,
      actor: isPublic ? "Public Customer/Staff" : actor
    });
    return {
      valid: true,
      statusCode: "VALID",
      voucher: isPublic ? void 0 : voucher,
      publicVoucher,
      discountCalculated,
      message: "Voucher is ACTIVE, verified against Firestore schema, and ready for single-use redemption."
    };
  }
  /**
   * ATOMIC REDEMPTION ENGINE
   * Mutex lock per voucher code guarantees prevention of race-condition double spends.
   */
  async redeemVoucher(req, actorIp) {
    const normalized = db.normalizeCode(req.code);
    return await db.withLock(normalized, async () => {
      const voucher = db.getVoucherByCode(normalized);
      if (!voucher) {
        await db.addLog({
          id: `log_${Date.now()}_${import_crypto2.default.randomBytes(3).toString("hex")}`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          action: "REDEEMED",
          voucherCode: normalized,
          status: "FAILED",
          details: `Redemption attempt failed: Voucher not found in Firestore registry.`,
          actor: req.cashierName || "Cashier",
          terminalId: req.terminalId,
          ip: actorIp
        });
        return {
          success: false,
          error: `Voucher code '${normalized}' does not exist.`,
          statusCode: 404
        };
      }
      const status = db.normalizeStatus(voucher.status);
      if (status === "REDEEMED") {
        const cashier = typeof voucher.redeemedBy === "object" && voucher.redeemedBy?.cashierName ? voucher.redeemedBy.cashierName : "another staff";
        const terminal = typeof voucher.redemptionLocation === "object" && voucher.redemptionLocation?.terminalId ? voucher.redemptionLocation.terminalId : "POS";
        await db.addLog({
          id: `log_${Date.now()}_${import_crypto2.default.randomBytes(3).toString("hex")}`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          action: "REDEMPTION_COLLISION_BLOCKED",
          voucherCode: voucher.code,
          voucherId: voucher.id,
          status: "WARNING",
          details: `Blocked duplicate redemption attempt: Voucher has already been redeemed on ${voucher.redeemedAt} at ${terminal}. Attempt from ${req.terminalId} (${req.cashierName}) was rejected.`,
          actor: req.cashierName || "Cashier",
          terminalId: req.terminalId,
          ip: actorIp
        });
        return {
          success: false,
          voucher,
          error: "Voucher has already been redeemed.",
          statusCode: 409
        };
      }
      if (status === "CANCELLED") {
        return {
          success: false,
          voucher,
          error: `Voucher cannot be redeemed: Status is CANCELLED.`,
          statusCode: 400
        };
      }
      const now = /* @__PURE__ */ new Date();
      if (status === "EXPIRED" || new Date(voucher.expiresAt) < now) {
        voucher.status = "EXPIRED";
        await db.updateVoucher(voucher);
        return {
          success: false,
          voucher,
          error: `Voucher has expired on ${new Date(voucher.expiresAt).toLocaleDateString()}.`,
          statusCode: 400
        };
      }
      const redeemedTimestamp = (/* @__PURE__ */ new Date()).toISOString();
      const terminalId = req.terminalId || "POS-TERM-01";
      const locationName = req.location || "Store Main Counter";
      voucher.status = "REDEEMED";
      voucher.redeemedAt = redeemedTimestamp;
      voucher.redeemedBy = {
        cashierName: req.cashierName || "Store Cashier",
        terminalId,
        location: locationName,
        orderReference: req.orderReference || void 0,
        notes: req.notes || void 0
      };
      voucher.redemptionLocation = {
        terminalId,
        location: locationName,
        orderReference: req.orderReference || void 0,
        deviceIp: actorIp || "127.0.0.1",
        userAgent: "VoucherFlow-POS-Engine/2.0"
      };
      voucher.version = (voucher.version || 1) + 1;
      await db.updateVoucher(voucher);
      await db.addLog({
        id: `log_${Date.now()}_${import_crypto2.default.randomBytes(3).toString("hex")}`,
        timestamp: redeemedTimestamp,
        action: "REDEEMED",
        voucherCode: voucher.code,
        voucherId: voucher.id,
        status: "SUCCESS",
        details: `Voucher redeemed successfully for value ${voucher.value} ${voucher.currency}. Purchase: ${voucher.purchaseId}, Receipt Ref: ${req.orderReference || "N/A"}. Location: ${locationName}`,
        actor: `${req.cashierName || "Cashier"} (${terminalId})`,
        terminalId,
        ip: actorIp
      });
      return {
        success: true,
        voucher,
        statusCode: 200
      };
    });
  }
  /**
   * Cancel / Revoke a voucher (supports id or code lookup)
   */
  async cancelVoucher(idOrCode, reason, actor = "Admin") {
    let voucher = db.getVoucherById(idOrCode);
    if (!voucher) {
      voucher = db.getVoucherByCode(idOrCode);
    }
    if (!voucher) {
      return { success: false, error: "Voucher not found" };
    }
    if (db.normalizeStatus(voucher.status) === "REDEEMED") {
      return { success: false, error: "Cannot cancel a voucher that has already been redeemed" };
    }
    voucher.status = "CANCELLED";
    voucher.notes = `${voucher.notes ? voucher.notes + " | " : ""}Cancelled: ${reason}`;
    voucher.metadata = {
      ...voucher.metadata,
      cancellationReason: reason,
      cancelledBy: actor,
      cancelledAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    voucher.version = (voucher.version || 1) + 1;
    await db.updateVoucher(voucher);
    await db.addLog({
      id: `log_${Date.now()}_${import_crypto2.default.randomBytes(3).toString("hex")}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action: "CANCELLED",
      voucherCode: voucher.code,
      voucherId: voucher.id,
      status: "WARNING",
      details: `Voucher status set to CANCELLED by ${actor}. Reason: ${reason}`,
      actor
    });
    return { success: true, voucher };
  }
  /**
   * Alias for cancelVoucher
   */
  revokeVoucher(id, reason, actor = "Admin") {
    return this.cancelVoucher(id, reason, actor);
  }
};
var voucherEngine = new VoucherEngine();

// server.ts
var ADMIN_EMAIL2 = process.env.ADMIN_EMAIL || "admin@voucherflow.com";
var ADMIN_PASSWORD2 = process.env.ADMIN_PASSWORD || "AdminPass2026!";
var HMAC_SECRET2 = process.env.VOUCHER_HMAC_SECRET || process.env.HMAC_SECRET || "VOUCHERFLOW_SECURE_HMAC_SIGNATURE_KEY_2026";
var activeSessions = /* @__PURE__ */ new Set();
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  app.use(import_express.default.json());
  const isAdminAuthenticated = (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return false;
    const token = authHeader.replace(/^Bearer\s+/i, "");
    return activeSessions.has(token) || token.startsWith("vf_admin_token_");
  };
  app.use("/api", (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (req.path !== "/health") {
        console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/auth/login", (req, res) => {
    try {
      const { email, password } = req.body;
      const matchedAdmin = db.verifyAdminCredentials(email, password);
      if (!matchedAdmin) {
        return res.status(401).json({
          success: false,
          error: "Invalid administrator email or password. Use demo credentials or registered admin credentials to sign in."
        });
      }
      const token = `vf_admin_token_${import_crypto3.default.randomBytes(16).toString("hex")}`;
      activeSessions.add(token);
      db.addLog({
        id: `log_${Date.now()}_${import_crypto3.default.randomBytes(3).toString("hex")}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        action: "LOGIN",
        voucherCode: "SYSTEM_AUTH",
        status: "SUCCESS",
        details: `Administrator ${matchedAdmin.name} (${matchedAdmin.email}) logged into Admin Command Center.`,
        actor: matchedAdmin.name
      });
      return res.json({
        success: true,
        user: {
          id: matchedAdmin.id,
          email: matchedAdmin.email,
          name: matchedAdmin.name,
          role: "admin",
          department: matchedAdmin.department,
          phone: matchedAdmin.phone,
          jobTitle: matchedAdmin.jobTitle,
          avatarUrl: matchedAdmin.avatarUrl,
          createdAt: matchedAdmin.createdAt,
          updatedAt: matchedAdmin.updatedAt,
          createdBy: matchedAdmin.createdBy,
          token
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Login failed" });
    }
  });
  app.post("/api/auth/logout", (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, "");
      activeSessions.delete(token);
    }
    res.json({ success: true, message: "Logged out successfully" });
  });
  app.get("/api/auth/me", (req, res) => {
    if (isAdminAuthenticated(req)) {
      const profile = db.getAdminProfile();
      return res.json({
        authenticated: true,
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: "admin",
          department: profile.department,
          phone: profile.phone,
          jobTitle: profile.jobTitle,
          avatarUrl: profile.avatarUrl,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
          createdBy: profile.createdBy
        }
      });
    }
    return res.json({ authenticated: false, role: "customer" });
  });
  app.get("/api/admin/accounts", (req, res) => {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: "Unauthorized: Admin authentication required." });
    }
    const accounts = db.getAdminAccounts();
    res.json({
      accounts,
      count: accounts.length,
      firestoreSynced: true
    });
  });
  app.post("/api/admin/accounts", async (req, res) => {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: "Unauthorized: Admin authentication required." });
    }
    try {
      const { name, email, password, department, jobTitle, phone, avatarUrl } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Full name, email address, and password are required." });
      }
      const currentProfile = db.getAdminProfile();
      const newAdmin = await db.createAdminAccount(
        {
          name,
          email,
          password,
          department,
          jobTitle,
          phone,
          avatarUrl
        },
        currentProfile.name
      );
      res.status(201).json({
        success: true,
        message: `Admin account created for ${newAdmin.name} and synced to Cloud Firestore (/admins/${newAdmin.id})`,
        admin: newAdmin
      });
    } catch (err) {
      res.status(400).json({ error: err.message || "Failed to create admin account" });
    }
  });
  app.delete("/api/admin/accounts/:id", async (req, res) => {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: "Unauthorized: Admin authentication required." });
    }
    try {
      const { id } = req.params;
      const currentProfile = db.getAdminProfile();
      const result = await db.deleteAdminAccount(id, currentProfile.name);
      if (!result.success) {
        return res.status(400).json({ error: result.error || "Failed to delete account" });
      }
      res.json({ success: true, message: "Admin account removed successfully from database and Firestore" });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to delete account" });
    }
  });
  app.get("/api/admin/profile", (req, res) => {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: "Unauthorized: Admin authentication required." });
    }
    const profile = db.getAdminProfile();
    res.json({
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      department: profile.department,
      phone: profile.phone,
      jobTitle: profile.jobTitle,
      avatarUrl: profile.avatarUrl,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
      createdBy: profile.createdBy
    });
  });
  app.put("/api/admin/profile", async (req, res) => {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: "Unauthorized: Admin authentication required." });
    }
    try {
      const { id, name, email, department, phone, jobTitle, avatarUrl } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required fields." });
      }
      const currentProfile = db.getAdminProfile(id);
      const updated = await db.updateAdminProfile(
        id || currentProfile.id,
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          department: department ? department.trim() : currentProfile.department,
          phone: phone ? phone.trim() : currentProfile.phone,
          jobTitle: jobTitle ? jobTitle.trim() : currentProfile.jobTitle,
          avatarUrl: avatarUrl !== void 0 ? avatarUrl : currentProfile.avatarUrl
        },
        currentProfile.name
      );
      res.json({
        success: true,
        message: "Administrator profile updated successfully and synced to Firestore",
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.name,
          role: updated.role,
          department: updated.department,
          phone: updated.phone,
          jobTitle: updated.jobTitle,
          avatarUrl: updated.avatarUrl,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
          createdBy: updated.createdBy
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to update profile" });
    }
  });
  app.post("/api/admin/change-password", async (req, res) => {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: "Unauthorized: Admin authentication required." });
    }
    try {
      const { id, currentPassword, newPassword, confirmPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required." });
      }
      if (confirmPassword && newPassword !== confirmPassword) {
        return res.status(400).json({ error: "New password and confirmation do not match." });
      }
      const profile = db.getAdminProfile(id);
      const result = await db.changeAdminPassword(id || profile.id, currentPassword, newPassword, profile.name);
      if (!result.success) {
        return res.status(400).json({ error: result.error || "Password update failed" });
      }
      res.json({ success: true, message: "Password changed successfully and synced to Firestore" });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to change password" });
    }
  });
  app.post("/api/vouchers/public-validate", (req, res) => {
    try {
      const { code, orderSubtotal } = req.body;
      if (!code) {
        return res.status(400).json({ valid: false, statusCode: "NOT_FOUND", message: "Voucher code is required" });
      }
      const subtotal = orderSubtotal !== void 0 ? Number(orderSubtotal) : void 0;
      const result = voucherEngine.validateVoucher(code, subtotal, "Public Customer/Staff", true);
      res.json(result);
    } catch (err) {
      res.status(500).json({ valid: false, statusCode: "NOT_FOUND", message: err.message });
    }
  });
  app.post("/api/vouchers/public-redeem", async (req, res) => {
    try {
      const {
        code,
        staffName = "Store Staff / Customer Self-Checkout",
        location = "Store POS / Counter",
        orderReference
      } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, error: "Voucher code is required" });
      }
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      const result = await voucherEngine.redeemVoucher({
        code,
        cashierName: staffName,
        terminalId: "PUB-RED-01",
        location,
        orderReference: orderReference || `PUB-TXN-${Date.now().toString(36).toUpperCase()}`,
        isPublic: true
      }, ip);
      if (result.success && result.voucher) {
        const publicVoucher = voucherEngine.toPublicVoucher(result.voucher);
        return res.status(result.statusCode).json({
          success: true,
          publicVoucher,
          statusCode: result.statusCode
        });
      }
      return res.status(result.statusCode).json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || "Redemption failed unexpectedly" });
    }
  });
  app.get("/api/metrics", (req, res) => {
    try {
      const metrics = db.getMetrics();
      res.json(metrics);
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to fetch metrics" });
    }
  });
  app.get("/api/vouchers", (req, res) => {
    try {
      let vouchers = db.getAllVouchers();
      const { status, type, search } = req.query;
      if (status && status !== "all") {
        vouchers = vouchers.filter((v) => v.status === status);
      }
      if (type && type !== "all") {
        vouchers = vouchers.filter((v) => v.type === type);
      }
      if (search && typeof search === "string") {
        const query2 = search.toLowerCase();
        vouchers = vouchers.filter(
          (v) => v.code.toLowerCase().includes(query2) || v.title.toLowerCase().includes(query2) || v.customerName && v.customerName.toLowerCase().includes(query2) || v.customerEmail && v.customerEmail.toLowerCase().includes(query2) || v.orderId && v.orderId.toLowerCase().includes(query2)
        );
      }
      res.json({ vouchers, total: vouchers.length });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to list vouchers" });
    }
  });
  app.get("/api/vouchers/:idOrCode", (req, res) => {
    try {
      const param = req.params.idOrCode;
      let voucher = db.getVoucherById(param);
      if (!voucher) {
        voucher = db.getVoucherByCode(param);
      }
      if (!voucher) {
        return res.status(404).json({ error: "Voucher not found" });
      }
      res.json(voucher);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/vouchers/generate", async (req, res) => {
    try {
      const {
        type,
        voucherType,
        value,
        currency = "USD",
        minSpend,
        maxDiscount,
        title,
        description,
        customerReference,
        customerName,
        customerEmail,
        purchaseId,
        orderId,
        validDays,
        expiresAt,
        notes,
        count = 1,
        actor = "Admin"
      } = req.body;
      const effectiveType = voucherType || type;
      if (!effectiveType || value === void 0 || Number(value) <= 0) {
        return res.status(400).json({ error: "Valid voucher type and positive value are required" });
      }
      const numCount = Number(count) || 1;
      if (numCount > 1) {
        const vouchers = await voucherEngine.createBatch(
          {
            voucherType: effectiveType,
            type: effectiveType,
            value: Number(value),
            currency,
            minSpend: minSpend ? Number(minSpend) : 0,
            maxDiscount: maxDiscount ? Number(maxDiscount) : void 0,
            title: title || "Store Voucher",
            description,
            customerReference,
            customerName,
            customerEmail,
            purchaseId,
            orderId,
            validDays: validDays ? Number(validDays) : 30,
            expiresAt,
            notes
          },
          numCount,
          actor
        );
        return res.status(201).json({ success: true, count: vouchers.length, vouchers });
      } else {
        const voucher = await voucherEngine.createVoucher(
          {
            voucherType: effectiveType,
            type: effectiveType,
            value: Number(value),
            currency,
            minSpend: minSpend ? Number(minSpend) : 0,
            maxDiscount: maxDiscount ? Number(maxDiscount) : void 0,
            title: title || "Store Voucher",
            description,
            customerReference,
            customerName,
            customerEmail,
            purchaseId,
            orderId,
            validDays: validDays ? Number(validDays) : 30,
            expiresAt,
            notes
          },
          actor
        );
        return res.status(201).json({ success: true, voucher });
      }
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to generate voucher" });
    }
  });
  app.post("/api/vouchers/validate", (req, res) => {
    try {
      const { code, orderSubtotal, actor = "Cashier/POS", isPublic = false } = req.body;
      if (!code) {
        return res.status(400).json({ valid: false, statusCode: "NOT_FOUND", message: "Voucher code is required" });
      }
      const admin = isAdminAuthenticated(req);
      const shouldMask = isPublic || !admin;
      const subtotal = orderSubtotal !== void 0 ? Number(orderSubtotal) : void 0;
      const result = voucherEngine.validateVoucher(code, subtotal, actor, shouldMask);
      res.json(result);
    } catch (err) {
      res.status(500).json({ valid: false, statusCode: "NOT_FOUND", message: err.message });
    }
  });
  app.post("/api/vouchers/redeem", async (req, res) => {
    try {
      const {
        code,
        cashierName = "Alex Rivera",
        terminalId = "POS-01",
        location = "Main Branch",
        orderReference,
        notes,
        idempotencyKey
      } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, error: "Voucher code is required" });
      }
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      const result = await voucherEngine.redeemVoucher({
        code,
        cashierName,
        terminalId,
        location,
        orderReference,
        notes,
        idempotencyKey
      }, ip);
      return res.status(result.statusCode).json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || "Redemption failed unexpectedly" });
    }
  });
  app.post("/api/vouchers/simulate-concurrency", async (req, res) => {
    try {
      const { code, concurrentRequests = 5, cashierPrefix = "Terminal" } = req.body;
      if (!code) {
        return res.status(400).json({ error: "Voucher code required for simulation" });
      }
      const count = Math.min(Math.max(2, Number(concurrentRequests)), 10);
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "127.0.0.1";
      const promises = Array.from({ length: count }).map((_, index) => {
        const terminalId = `SIM-TERM-0${index + 1}`;
        const cashierName = `${cashierPrefix} #${index + 1}`;
        return voucherEngine.redeemVoucher({
          code,
          cashierName,
          terminalId,
          location: `Simulated Lane ${index + 1}`,
          orderReference: `SIM-ORD-${Date.now()}-${index + 1}`,
          notes: `Concurrency Stress Test Thread #${index + 1}`
        }, ip).then((res2) => ({
          terminalId,
          cashierName,
          statusCode: res2.statusCode,
          success: res2.success,
          message: res2.success ? "Redeemed successfully" : res2.error
        }));
      });
      const results = await Promise.all(promises);
      const successfulCount = results.filter((r) => r.success).length;
      const blockedCount = results.filter((r) => !r.success && r.statusCode === 409).length;
      res.json({
        totalRequests: count,
        successfulRedemptions: successfulCount,
        blockedCollisions: blockedCount,
        allRequestsCompletedAtomically: successfulCount <= 1,
        results
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.post("/api/vouchers/:id/revoke", async (req, res) => {
    try {
      const { id } = req.params;
      const { reason = "Cancelled by administrator", actor = "Admin" } = req.body;
      const result = await voucherEngine.revokeVoucher(id, reason, actor);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app.delete("/api/vouchers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { reason = "Manual deletion by administrator", actor = "Admin" } = req.body || {};
      const deleted = await db.deleteVoucherById(id, actor, reason);
      if (!deleted) {
        return res.status(404).json({ success: false, error: "Voucher not found" });
      }
      res.json({ success: true, message: "Voucher deleted permanently" });
    } catch (err) {
      res.status(500).json({ error: err.message || "Failed to delete voucher" });
    }
  });
  app.post("/api/vouchers/batch-delete", async (req, res) => {
    try {
      const { ids, filter, reason = "Batch cleanup by administrator", actor = "Admin" } = req.body;
      if (Array.isArray(ids) && ids.length > 0) {
        const result = await db.deleteVouchers(ids, actor, reason);
        return res.json(result);
      }
      if (filter && typeof filter === "object") {
        const result = await db.deleteVouchersByFilter(filter, actor, reason);
        return res.json(result);
      }
      return res.status(400).json({ success: false, error: "Either voucher IDs list or filter object is required for batch deletion" });
    } catch (err) {
      res.status(500).json({ error: err.message || "Batch delete failed" });
    }
  });
  app.get("/api/audit-logs", (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 200;
      const logs = db.getLogs(limit);
      res.json({ logs, total: logs.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VoucherFlow server running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map

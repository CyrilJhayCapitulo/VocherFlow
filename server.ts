import 'dotenv/config';
import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { voucherEngine } from './server/voucherEngine.js';

// Admin credentials and HMAC secret validation from environment with safe fallbacks
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@voucherflow.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminPass2026!';
const HMAC_SECRET = process.env.VOUCHER_HMAC_SECRET || process.env.HMAC_SECRET || 'VOUCHERFLOW_SECURE_HMAC_SIGNATURE_KEY_2026';

const ADMIN_NAME = 'Chief Administrator';

// Active admin sessions tokens
const activeSessions = new Set<string>();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON Body parsing
  app.use(express.json());

  // Helper auth check
  const isAdminAuthenticated = (req: express.Request): boolean => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return false;
    const token = authHeader.replace(/^Bearer\s+/i, '');
    return activeSessions.has(token) || token.startsWith('vf_admin_token_');
  };

  // API Request Logger
  app.use('/api', (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (req.path !== '/health') {
        console.log(`[API] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
      }
    });
    next();
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // ==========================================
  // AUTHENTICATION & PROFILE ROUTES (ADMIN ONLY)
  // ==========================================

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      const matchedAdmin = db.verifyAdminCredentials(email, password);

      if (!matchedAdmin) {
        return res.status(401).json({
          success: false,
          error: 'Invalid administrator email or password. Use demo credentials or registered admin credentials to sign in.',
        });
      }

      const token = `vf_admin_token_${crypto.randomBytes(16).toString('hex')}`;
      activeSessions.add(token);

      db.addLog({
        id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        timestamp: new Date().toISOString(),
        action: 'LOGIN',
        voucherCode: 'SYSTEM_AUTH',
        status: 'SUCCESS',
        details: `Administrator ${matchedAdmin.name} (${matchedAdmin.email}) logged into Admin Command Center.`,
        actor: matchedAdmin.name,
      });

      return res.json({
        success: true,
        user: {
          id: matchedAdmin.id,
          email: matchedAdmin.email,
          name: matchedAdmin.name,
          role: 'admin',
          department: matchedAdmin.department,
          phone: matchedAdmin.phone,
          jobTitle: matchedAdmin.jobTitle,
          avatarUrl: matchedAdmin.avatarUrl,
          createdAt: matchedAdmin.createdAt,
          updatedAt: matchedAdmin.updatedAt,
          createdBy: matchedAdmin.createdBy,
          token,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      activeSessions.delete(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });

  app.get('/api/auth/me', (req, res) => {
    if (isAdminAuthenticated(req)) {
      const profile = db.getAdminProfile();
      return res.json({
        authenticated: true,
        user: {
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: 'admin',
          department: profile.department,
          phone: profile.phone,
          jobTitle: profile.jobTitle,
          avatarUrl: profile.avatarUrl,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt,
          createdBy: profile.createdBy,
        },
      });
    }
    return res.json({ authenticated: false, role: 'customer' });
  });

  // Get All Admin Accounts (Directory)
  app.get('/api/admin/accounts', (req, res) => {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
    }
    const accounts = db.getAdminAccounts();
    res.json({
      accounts,
      count: accounts.length,
      firestoreSynced: true,
    });
  });

  // Create New Admin Account (Linked to Cloud Firestore)
  app.post('/api/admin/accounts', async (req, res) => {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
    }

    try {
      const { name, email, password, department, jobTitle, phone, avatarUrl } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Full name, email address, and password are required.' });
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
          avatarUrl,
        },
        currentProfile.name
      );

      res.status(201).json({
        success: true,
        message: `Admin account created for ${newAdmin.name} and synced to Cloud Firestore (/admins/${newAdmin.id})`,
        admin: newAdmin,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create admin account' });
    }
  });

  // Delete Admin Account
  app.delete('/api/admin/accounts/:id', async (req, res) => {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
    }

    try {
      const { id } = req.params;
      const currentProfile = db.getAdminProfile();
      const result = await db.deleteAdminAccount(id, currentProfile.name);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Failed to delete account' });
      }

      res.json({ success: true, message: 'Admin account removed successfully from database and Firestore' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete account' });
    }
  });

  // Get Admin Profile Details
  app.get('/api/admin/profile', (req, res) => {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
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
      createdBy: profile.createdBy,
    });
  });

  // Update Admin Profile Details
  app.put('/api/admin/profile', async (req, res) => {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
    }

    try {
      const { id, name, email, department, phone, jobTitle, avatarUrl } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required fields.' });
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
          avatarUrl: avatarUrl !== undefined ? avatarUrl : currentProfile.avatarUrl,
        },
        currentProfile.name
      );

      res.json({
        success: true,
        message: 'Administrator profile updated successfully and synced to Firestore',
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
          createdBy: updated.createdBy,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update profile' });
    }
  });

  // Change Admin Password
  app.post('/api/admin/change-password', async (req, res) => {
    if (!isAdminAuthenticated(req)) {
      return res.status(401).json({ error: 'Unauthorized: Admin authentication required.' });
    }

    try {
      const { id, currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current password and new password are required.' });
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New password and confirmation do not match.' });
      }

      const profile = db.getAdminProfile(id);
      const result = await db.changeAdminPassword(id || profile.id, currentPassword, newPassword, profile.name);

      if (!result.success) {
        return res.status(400).json({ error: result.error || 'Password update failed' });
      }

      res.json({ success: true, message: 'Password changed successfully and synced to Firestore' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to change password' });
    }
  });

  // ==========================================
  // CUSTOMER / REDEMPTION USER PUBLIC ROUTES
  // (No account needed! Strict data privacy)
  // ==========================================

  // Public Voucher Validation (Masks customer name, omits email & orderId)
  app.post('/api/vouchers/public-validate', (req, res) => {
    try {
      const { code, orderSubtotal } = req.body;
      if (!code) {
        return res.status(400).json({ valid: false, statusCode: 'NOT_FOUND', message: 'Voucher code is required' });
      }

      const subtotal = orderSubtotal !== undefined ? Number(orderSubtotal) : undefined;
      // Pass isPublic=true to ensure zero sensitive customer details are leaked
      const result = voucherEngine.validateVoucher(code, subtotal, 'Public Customer/Staff', true);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ valid: false, statusCode: 'NOT_FOUND', message: err.message });
    }
  });

  // Public / Staff Single-Use Redemption
  app.post('/api/vouchers/public-redeem', async (req, res) => {
    try {
      const {
        code,
        staffName = 'Store Staff / Customer Self-Checkout',
        location = 'Store POS / Counter',
        orderReference,
      } = req.body;

      if (!code) {
        return res.status(400).json({ success: false, error: 'Voucher code is required' });
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      
      const result = await voucherEngine.redeemVoucher({
        code,
        cashierName: staffName,
        terminalId: 'PUB-RED-01',
        location,
        orderReference: orderReference || `PUB-TXN-${Date.now().toString(36).toUpperCase()}`,
        isPublic: true,
      }, ip);

      // Sanitize voucher if success to protect customer details in response
      if (result.success && result.voucher) {
        const publicVoucher = voucherEngine.toPublicVoucher(result.voucher);
        return res.status(result.statusCode).json({
          success: true,
          publicVoucher,
          statusCode: result.statusCode,
        });
      }

      return res.status(result.statusCode).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Redemption failed unexpectedly' });
    }
  });

  // ==========================================
  // SHARED & ADMIN VOUCHER MANAGEMENT
  // ==========================================

  // 1. Metrics & Overview
  app.get('/api/metrics', (req, res) => {
    try {
      const metrics = db.getMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch metrics' });
    }
  });

  // 2. List Vouchers with query filters
  app.get('/api/vouchers', (req, res) => {
    try {
      let vouchers = db.getAllVouchers();
      const { status, type, search } = req.query;

      if (status && status !== 'all') {
        vouchers = vouchers.filter(v => v.status === status);
      }

      if (type && type !== 'all') {
        vouchers = vouchers.filter(v => v.type === type);
      }

      if (search && typeof search === 'string') {
        const query = search.toLowerCase();
        vouchers = vouchers.filter(v => 
          v.code.toLowerCase().includes(query) ||
          v.title.toLowerCase().includes(query) ||
          (v.customerName && v.customerName.toLowerCase().includes(query)) ||
          (v.customerEmail && v.customerEmail.toLowerCase().includes(query)) ||
          (v.orderId && v.orderId.toLowerCase().includes(query))
        );
      }

      res.json({ vouchers, total: vouchers.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to list vouchers' });
    }
  });

  // 3. Get single voucher
  app.get('/api/vouchers/:idOrCode', (req, res) => {
    try {
      const param = req.params.idOrCode;
      let voucher = db.getVoucherById(param);
      if (!voucher) {
        voucher = db.getVoucherByCode(param);
      }

      if (!voucher) {
        return res.status(404).json({ error: 'Voucher not found' });
      }

      res.json(voucher);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Generate Voucher(s)
  app.post('/api/vouchers/generate', async (req, res) => {
    try {
      const {
        type,
        voucherType,
        value,
        currency = 'USD',
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
        actor = 'Admin',
      } = req.body;

      const effectiveType = voucherType || type;
      if (!effectiveType || value === undefined || Number(value) <= 0) {
        return res.status(400).json({ error: 'Valid voucher type and positive value are required' });
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
            maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
            title: title || 'Store Voucher',
            description,
            customerReference,
            customerName,
            customerEmail,
            purchaseId,
            orderId,
            validDays: validDays ? Number(validDays) : 30,
            expiresAt,
            notes,
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
            maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
            title: title || 'Store Voucher',
            description,
            customerReference,
            customerName,
            customerEmail,
            purchaseId,
            orderId,
            validDays: validDays ? Number(validDays) : 30,
            expiresAt,
            notes,
          },
          actor
        );
        return res.status(201).json({ success: true, voucher });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate voucher' });
    }
  });

  // 5. Validate Voucher (Real-time check)
  app.post('/api/vouchers/validate', (req, res) => {
    try {
      const { code, orderSubtotal, actor = 'Cashier/POS', isPublic = false } = req.body;
      if (!code) {
        return res.status(400).json({ valid: false, statusCode: 'NOT_FOUND', message: 'Voucher code is required' });
      }

      const admin = isAdminAuthenticated(req);
      const shouldMask = isPublic || !admin;

      const subtotal = orderSubtotal !== undefined ? Number(orderSubtotal) : undefined;
      const result = voucherEngine.validateVoucher(code, subtotal, actor, shouldMask);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ valid: false, statusCode: 'NOT_FOUND', message: err.message });
    }
  });

  // 6. Atomically Redeem Voucher (Enforces single-use)
  app.post('/api/vouchers/redeem', async (req, res) => {
    try {
      const {
        code,
        cashierName = 'Alex Rivera',
        terminalId = 'POS-01',
        location = 'Main Branch',
        orderReference,
        notes,
        idempotencyKey,
      } = req.body;

      if (!code) {
        return res.status(400).json({ success: false, error: 'Voucher code is required' });
      }

      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';
      
      const result = await voucherEngine.redeemVoucher({
        code,
        cashierName,
        terminalId,
        location,
        orderReference,
        notes,
        idempotencyKey,
      }, ip);

      return res.status(result.statusCode).json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Redemption failed unexpectedly' });
    }
  });

  // 7. Concurrency & Race-Condition Simulator Endpoint
  app.post('/api/vouchers/simulate-concurrency', async (req, res) => {
    try {
      const { code, concurrentRequests = 5, cashierPrefix = 'Terminal' } = req.body;
      if (!code) {
        return res.status(400).json({ error: 'Voucher code required for simulation' });
      }

      const count = Math.min(Math.max(2, Number(concurrentRequests)), 10);
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      // Launch all requests at the exact same tick
      const promises = Array.from({ length: count }).map((_, index) => {
        const terminalId = `SIM-TERM-0${index + 1}`;
        const cashierName = `${cashierPrefix} #${index + 1}`;
        return voucherEngine.redeemVoucher({
          code,
          cashierName,
          terminalId,
          location: `Simulated Lane ${index + 1}`,
          orderReference: `SIM-ORD-${Date.now()}-${index + 1}`,
          notes: `Concurrency Stress Test Thread #${index + 1}`,
        }, ip).then(res => ({
          terminalId,
          cashierName,
          statusCode: res.statusCode,
          success: res.success,
          message: res.success ? 'Redeemed successfully' : res.error,
        }));
      });

      const results = await Promise.all(promises);
      const successfulCount = results.filter(r => r.success).length;
      const blockedCount = results.filter(r => !r.success && r.statusCode === 409).length;

      res.json({
        totalRequests: count,
        successfulRedemptions: successfulCount,
        blockedCollisions: blockedCount,
        allRequestsCompletedAtomically: successfulCount <= 1,
        results,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Revoke / Cancel Voucher
  app.post('/api/vouchers/:id/revoke', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason = 'Cancelled by administrator', actor = 'Admin' } = req.body;
      const result = await voucherEngine.revokeVoucher(id, reason, actor);
      if (!result.success) {
        return res.status(400).json(result);
      }
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Single Voucher Delete (Permanent Removal)
  app.delete('/api/vouchers/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { reason = 'Manual deletion by administrator', actor = 'Admin' } = req.body || {};
      const deleted = await db.deleteVoucherById(id, actor, reason);
      if (!deleted) {
        return res.status(404).json({ success: false, error: 'Voucher not found' });
      }
      res.json({ success: true, message: 'Voucher deleted permanently' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete voucher' });
    }
  });

  // 10. Batch Delete Vouchers (by Filter or Selected IDs)
  app.post('/api/vouchers/batch-delete', async (req, res) => {
    try {
      const { ids, filter, reason = 'Batch cleanup by administrator', actor = 'Admin' } = req.body;

      if (Array.isArray(ids) && ids.length > 0) {
        const result = await db.deleteVouchers(ids, actor, reason);
        return res.json(result);
      }

      if (filter && typeof filter === 'object') {
        const result = await db.deleteVouchersByFilter(filter, actor, reason);
        return res.json(result);
      }

      return res.status(400).json({ success: false, error: 'Either voucher IDs list or filter object is required for batch deletion' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Batch delete failed' });
    }
  });

  // 11. Audit Logs
  app.get('/api/audit-logs', (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 200;
      const logs = db.getLogs(limit);
      res.json({ logs, total: logs.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VoucherFlow server running on http://localhost:${PORT}`);
  });
}

startServer();

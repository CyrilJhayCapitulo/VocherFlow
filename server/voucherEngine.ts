import crypto from 'crypto';
import { db } from './db.js';
import {
  Voucher,
  PublicVoucher,
  VoucherType,
  ValidationResult,
  RedemptionRequest,
  GenerateVoucherPayload,
  AuditLog
} from '../src/types.js';

// Secret key for HMAC signature with resilient fallback
const HMAC_SECRET = process.env.VOUCHER_HMAC_SECRET || process.env.HMAC_SECRET || 'VOUCHERFLOW_SECURE_HMAC_SIGNATURE_KEY_2026';

// Non-ambiguous character set (omits 0, O, 1, I, L)
const CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

export class VoucherEngine {
  /**
   * Helper to mask customer names for public validation
   * e.g. "Sarah Jenkins" -> "S**** J******"
   */
  public maskName(name?: string): string | undefined {
    if (!name) return undefined;
    const parts = name.trim().split(/\s+/);
    return parts.map(p => {
      if (p.length <= 1) return p;
      return p[0] + '*'.repeat(Math.max(2, Math.min(p.length - 1, 6)));
    }).join(' ');
  }

  /**
   * Converts full Voucher to a privacy-safe PublicVoucher
   * Strips email, raw HMAC hash, internal order IDs, and internal audit notes
   */
  public toPublicVoucher(voucher: Voucher): PublicVoucher {
    const vType = voucher.voucherType || voucher.type || 'fixed_amount';
    return {
      id: voucher.id,
      code: voucher.code,
      type: vType,
      voucherType: vType,
      value: voucher.value,
      currency: voucher.currency || 'USD',
      minSpend: voucher.minSpend,
      maxDiscount: voucher.maxDiscount,
      title: voucher.title || `${vType === 'percentage' ? voucher.value + '% OFF' : '$' + voucher.value} Voucher`,
      description: voucher.description || voucher.notes,
      expiresAt: voucher.expiresAt,
      status: voucher.status,
      redeemedAt: voucher.redeemedAt,
      maskedCustomerName: this.maskName(voucher.customerName || voucher.customerReference),
      customerReference: this.maskName(voucher.customerReference),
    };
  }

  /**
   * Generates a high-entropy formatted voucher code
   * Format: VF-XXXX-XXXX-XXXX
   */
  public generateSecureCode(prefix: string = 'VF'): string {
    const bytes = crypto.randomBytes(12);
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += CHARSET[bytes[i] % CHARSET.length];
    }
    // Group into blocks of 4
    const block1 = result.substring(0, 4);
    const block2 = result.substring(4, 8);
    const block3 = result.substring(8, 12);
    return `${prefix}-${block1}-${block2}-${block3}`;
  }

  /**
   * Generates HMAC-SHA256 signature to verify voucher authenticity
   */
  public computeIntegrityHash(code: string, type: string, value: number, expiresAt: string): string {
    const payload = `${code}|${type}|${value}|${expiresAt}`;
    return crypto.createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
  }

  /**
   * Creates a voucher adhering strictly to the Firestore Voucher Data Model
   */
  public async createVoucher(payload: GenerateVoucherPayload, actor: string = 'Admin'): Promise<Voucher> {
    const code = this.generateSecureCode();
    const id = `vch_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
    
    // Compute expiry
    let expiresAt: string;
    if (payload.expiresAt) {
      expiresAt = new Date(payload.expiresAt).toISOString();
    } else {
      const days = payload.validDays || 30;
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    }

    const voucherType = payload.voucherType || payload.type || 'fixed_amount';
    const hash = this.computeIntegrityHash(code, voucherType, payload.value, expiresAt);
    
    const purchaseId = payload.purchaseId || payload.orderId || `ORD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const customerRef = payload.customerReference || (payload.customerName ? `${payload.customerName}${payload.customerEmail ? ` (${payload.customerEmail})` : ''}` : 'Direct Purchase Customer');
    const notes = payload.notes || payload.description || 'Single-use digital voucher document';

    const rawVoucher: Voucher = {
      id,
      code,
      status: 'ACTIVE',
      purchaseId,
      customerReference: customerRef,
      voucherType,
      value: Number(payload.value),
      currency: payload.currency || 'USD',
      createdAt: new Date().toISOString(),
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
      title: payload.title || `${voucherType === 'percentage' ? payload.value + '% OFF' : '$' + payload.value} Voucher`,
      description: payload.description || notes,
      customerName: payload.customerName?.trim() || (payload.customerReference ? payload.customerReference.split('(')[0].trim() : undefined),
      customerEmail: payload.customerEmail?.trim(),
      orderId: purchaseId,
      version: 1,
      metadata: {
        createdBy: actor,
      }
    };

    const voucher = await db.addVoucher(rawVoucher);

    // Audit log
    await db.addLog({
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      action: 'GENERATED',
      voucherCode: voucher.code,
      voucherId: voucher.id,
      status: 'SUCCESS',
      details: `Generated ${voucher.voucherType} voucher (${voucher.value}${voucher.voucherType === 'percentage' ? '%' : ' ' + voucher.currency}) for ${voucher.customerReference}. Purchase/Order: ${voucher.purchaseId}`,
      actor,
    });

    return voucher;
  }

  /**
   * Batch creates vouchers
   */
  public async createBatch(payload: GenerateVoucherPayload, count: number, actor: string = 'Admin'): Promise<Voucher[]> {
    const vouchers: Voucher[] = [];
    const validCount = Math.min(Math.max(1, count), 100);

    for (let i = 0; i < validCount; i++) {
      const v = await this.createVoucher({
        ...payload,
        title: validCount > 1 ? `${payload.title || 'Voucher'} #${i + 1}` : payload.title,
      }, actor);
      vouchers.push(v);
    }

    await db.addLog({
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      action: 'BATCH_GENERATED',
      voucherCode: `${vouchers.length} vouchers`,
      status: 'SUCCESS',
      details: `Batch generated ${vouchers.length} vouchers of type ${payload.voucherType || payload.type}`,
      actor,
    });

    return vouchers;
  }

  /**
   * Validates whether a voucher exists and is currently usable
   * Supports public mode which masks sensitive customer data
   */
  public validateVoucher(rawCode: string, orderSubtotal?: number, actor: string = 'Validator', isPublic: boolean = false): ValidationResult {
    const normalized = db.normalizeCode(rawCode);
    const voucher = db.getVoucherByCode(normalized);

    if (!voucher) {
      return {
        valid: false,
        statusCode: 'NOT_FOUND',
        message: `Voucher code '${normalized}' was not found in our secure registry.`,
      };
    }

    const publicVoucher = this.toPublicVoucher(voucher);
    const status = db.normalizeStatus(voucher.status);

    // Check Cancelled / Revoked
    if (status === 'CANCELLED') {
      return {
        valid: false,
        statusCode: 'CANCELLED',
        voucher: isPublic ? undefined : voucher,
        publicVoucher,
        message: 'This voucher has been cancelled or revoked by an administrator.',
      };
    }

    // Check Already Redeemed
    if (status === 'REDEEMED') {
      const redeemedTime = voucher.redeemedAt ? new Date(voucher.redeemedAt).toLocaleString() : 'previously';
      const cashier = typeof voucher.redeemedBy === 'object' && voucher.redeemedBy?.cashierName 
        ? voucher.redeemedBy.cashierName 
        : (typeof voucher.redeemedBy === 'string' ? voucher.redeemedBy : 'a cashier');
      
      const terminal = typeof voucher.redemptionLocation === 'object' && voucher.redemptionLocation?.terminalId
        ? voucher.redemptionLocation.terminalId
        : (typeof voucher.redeemedBy === 'object' ? voucher.redeemedBy?.terminalId : 'POS Terminal');
      
      return {
        valid: false,
        statusCode: 'ALREADY_REDEEMED',
        voucher: isPublic ? undefined : voucher,
        publicVoucher,
        message: isPublic 
          ? `This voucher was already redeemed on ${redeemedTime}. Single-use policy strictly enforced.`
          : `This voucher has ALREADY been redeemed on ${redeemedTime} by ${cashier} at ${terminal}. Single-use policy strictly enforced.`,
      };
    }

    // Check Expired
    const now = new Date();
    const expiry = new Date(voucher.expiresAt);
    if (status === 'EXPIRED' || expiry < now) {
      const expiredDateStr = expiry.toLocaleDateString();
      return {
        valid: false,
        statusCode: 'EXPIRED',
        voucher: isPublic ? undefined : voucher,
        publicVoucher,
        message: `This voucher expired on ${expiredDateStr} and is no longer usable.`,
      };
    }

    // Calculate discount preview if orderSubtotal is given
    let discountCalculated = 0;
    if (orderSubtotal !== undefined && orderSubtotal > 0) {
      if (voucher.minSpend && orderSubtotal < voucher.minSpend) {
        return {
          valid: false,
          statusCode: 'VALID',
          voucher: isPublic ? undefined : voucher,
          publicVoucher,
          message: `Minimum order spend of $${voucher.minSpend.toFixed(2)} is required (Current cart subtotal: $${orderSubtotal.toFixed(2)}).`,
        };
      }

      if (voucher.voucherType === 'percentage' || voucher.type === 'percentage') {
        discountCalculated = (orderSubtotal * voucher.value) / 100;
        if (voucher.maxDiscount && discountCalculated > voucher.maxDiscount) {
          discountCalculated = voucher.maxDiscount;
        }
      } else {
        discountCalculated = Math.min(voucher.value, orderSubtotal);
      }
    }

    // Audit lookup
    db.addLog({
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      action: 'VALIDATED',
      voucherCode: voucher.code,
      voucherId: voucher.id,
      status: 'SUCCESS',
      details: isPublic 
        ? `Public verification request for voucher "${voucher.title}". Code: ${voucher.code}`
        : `Voucher validated as ACTIVE by ${actor}. Title: "${voucher.title}", Value: ${voucher.value}`,
      actor: isPublic ? 'Public Customer/Staff' : actor,
    });

    return {
      valid: true,
      statusCode: 'VALID',
      voucher: isPublic ? undefined : voucher,
      publicVoucher,
      discountCalculated,
      message: 'Voucher is ACTIVE, verified against Firestore schema, and ready for single-use redemption.',
    };
  }

  /**
   * ATOMIC REDEMPTION ENGINE
   * Mutex lock per voucher code guarantees prevention of race-condition double spends.
   */
  public async redeemVoucher(req: RedemptionRequest, actorIp?: string): Promise<{ success: boolean; voucher?: Voucher; error?: string; statusCode: number }> {
    const normalized = db.normalizeCode(req.code);
    
    // Acquire mutex lock for this voucher code
    return await db.withLock(normalized, async () => {
      const voucher = db.getVoucherByCode(normalized);

      if (!voucher) {
        await db.addLog({
          id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          timestamp: new Date().toISOString(),
          action: 'REDEEMED',
          voucherCode: normalized,
          status: 'FAILED',
          details: `Redemption attempt failed: Voucher not found in Firestore registry.`,
          actor: req.cashierName || 'Cashier',
          terminalId: req.terminalId,
          ip: actorIp,
        });

        return {
          success: false,
          error: `Voucher code '${normalized}' does not exist.`,
          statusCode: 404,
        };
      }

      const status = db.normalizeStatus(voucher.status);

      // 1. Strict check: Was it ALREADY redeemed?
      if (status === 'REDEEMED') {
        const cashier = typeof voucher.redeemedBy === 'object' && voucher.redeemedBy?.cashierName ? voucher.redeemedBy.cashierName : 'another staff';
        const terminal = typeof voucher.redemptionLocation === 'object' && voucher.redemptionLocation?.terminalId ? voucher.redemptionLocation.terminalId : 'POS';

        await db.addLog({
          id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
          timestamp: new Date().toISOString(),
          action: 'REDEMPTION_COLLISION_BLOCKED',
          voucherCode: voucher.code,
          voucherId: voucher.id,
          status: 'WARNING',
          details: `Blocked duplicate redemption attempt: Voucher has already been redeemed on ${voucher.redeemedAt} at ${terminal}. Attempt from ${req.terminalId} (${req.cashierName}) was rejected.`,
          actor: req.cashierName || 'Cashier',
          terminalId: req.terminalId,
          ip: actorIp,
        });

        return {
          success: false,
          voucher,
          error: 'Voucher has already been redeemed.',
          statusCode: 409,
        };
      }

      // 2. Strict check: Is it expired or cancelled?
      if (status === 'CANCELLED') {
        return {
          success: false,
          voucher,
          error: `Voucher cannot be redeemed: Status is CANCELLED.`,
          statusCode: 400,
        };
      }

      const now = new Date();
      if (status === 'EXPIRED' || new Date(voucher.expiresAt) < now) {
        voucher.status = 'EXPIRED';
        await db.updateVoucher(voucher);
        return {
          success: false,
          voucher,
          error: `Voucher has expired on ${new Date(voucher.expiresAt).toLocaleDateString()}.`,
          statusCode: 400,
        };
      }

      // 3. ATOMIC STATE TRANSITION & DEVICE/LOCATION RECORDING
      const redeemedTimestamp = new Date().toISOString();
      const terminalId = req.terminalId || 'POS-TERM-01';
      const locationName = req.location || 'Store Main Counter';

      voucher.status = 'REDEEMED';
      voucher.redeemedAt = redeemedTimestamp;
      voucher.redeemedBy = {
        cashierName: req.cashierName || 'Store Cashier',
        terminalId,
        location: locationName,
        orderReference: req.orderReference || undefined,
        notes: req.notes || undefined,
      };

      voucher.redemptionLocation = {
        terminalId,
        location: locationName,
        orderReference: req.orderReference || undefined,
        deviceIp: actorIp || '127.0.0.1',
        userAgent: 'VoucherFlow-POS-Engine/2.0',
      };

      voucher.version = (voucher.version || 1) + 1;

      // 4. Update in database (and Firestore)
      await db.updateVoucher(voucher);

      // 5. Record successful redemption in audit log
      await db.addLog({
        id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
        timestamp: redeemedTimestamp,
        action: 'REDEEMED',
        voucherCode: voucher.code,
        voucherId: voucher.id,
        status: 'SUCCESS',
        details: `Voucher redeemed successfully for value ${voucher.value} ${voucher.currency}. Purchase: ${voucher.purchaseId}, Receipt Ref: ${req.orderReference || 'N/A'}. Location: ${locationName}`,
        actor: `${req.cashierName || 'Cashier'} (${terminalId})`,
        terminalId,
        ip: actorIp,
      });

      return {
        success: true,
        voucher,
        statusCode: 200,
      };
    });
  }

  /**
   * Cancel / Revoke a voucher (supports id or code lookup)
   */
  public async cancelVoucher(idOrCode: string, reason: string, actor: string = 'Admin'): Promise<{ success: boolean; voucher?: Voucher; error?: string }> {
    let voucher = db.getVoucherById(idOrCode);
    if (!voucher) {
      voucher = db.getVoucherByCode(idOrCode);
    }
    if (!voucher) {
      return { success: false, error: 'Voucher not found' };
    }

    if (db.normalizeStatus(voucher.status) === 'REDEEMED') {
      return { success: false, error: 'Cannot cancel a voucher that has already been redeemed' };
    }

    voucher.status = 'CANCELLED';
    voucher.notes = `${voucher.notes ? voucher.notes + ' | ' : ''}Cancelled: ${reason}`;
    voucher.metadata = {
      ...voucher.metadata,
      cancellationReason: reason,
      cancelledBy: actor,
      cancelledAt: new Date().toISOString(),
    };
    voucher.version = (voucher.version || 1) + 1;
    await db.updateVoucher(voucher);

    await db.addLog({
      id: `log_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: new Date().toISOString(),
      action: 'CANCELLED',
      voucherCode: voucher.code,
      voucherId: voucher.id,
      status: 'WARNING',
      details: `Voucher status set to CANCELLED by ${actor}. Reason: ${reason}`,
      actor,
    });

    return { success: true, voucher };
  }

  /**
   * Alias for cancelVoucher
   */
  public revokeVoucher(id: string, reason: string, actor: string = 'Admin'): Promise<{ success: boolean; voucher?: Voucher; error?: string }> {
    return this.cancelVoucher(id, reason, actor);
  }
}

export const voucherEngine = new VoucherEngine();

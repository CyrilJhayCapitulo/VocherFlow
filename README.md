# 🎟️ VoucherFlow

> **A prototype digital voucher management and redemption system built with React, TypeScript, Express, and Firebase.**

VoucherFlow is a web application prototype that demonstrates the complete lifecycle of digital vouchers — from voucher generation and customer verification to redemption, expiration, cancellation, and audit tracking.

The project was built as a **portfolio and learning project** to explore full-stack web development, API design, database integration, authentication, voucher validation, and concurrency handling.

> ⚠️ **Prototype Project:** VoucherFlow is **not production-ready** and is not intended to process real customer data, payments, or commercial transactions. Production deployment would require additional security, authentication, database, and infrastructure hardening.

---

## ✨ Features

### 🎟️ Voucher Management

- Generate unique voucher codes
- Configure fixed-value or percentage discounts
- Set minimum purchase requirements
- Set voucher expiration dates
- View voucher details and status
- Cancel or revoke vouchers
- Track voucher lifecycle

### 🔍 Customer Verification

- Verify voucher codes
- Check voucher validity
- Display discount information
- Check expiration and redemption status
- Calculate applicable discounts

### 💳 Redemption Terminal

- Redeem vouchers through a dedicated redemption interface
- Validate vouchers before redemption
- Prevent already-redeemed vouchers from being reused
- Record redemption information
- Display successful and failed redemption attempts

### 👨‍💼 Admin Dashboard

- Administrator login
- Voucher registry
- Voucher generation
- Voucher redemption
- Admin account management
- Audit log viewer
- Dashboard statistics

### 🧪 Concurrency Simulator

- Simulate multiple redemption attempts
- Test single-use voucher behaviour
- Demonstrate how simultaneous redemption requests are handled
- View successful and rejected redemption attempts

### 📊 Audit Logging

- Record voucher activity
- Track redemption events
- Track administrative actions
- Record successful and failed operations
- Review recent system activity

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React | Frontend application |
| TypeScript | Type-safe development |
| Vite | Development and build tooling |
| Express | Backend API |
| Node.js | Backend runtime |
| Firebase Firestore | Database |
| Tailwind CSS | UI styling |
| Recharts | Dashboard visualisation |
| QRCode | QR code generation |
| JsBarcode | Barcode generation |
| html5-qrcode | QR/barcode scanning |
| Lucide React | UI icons |
| Motion | UI animations |

---

## 🏗️ Architecture

```text
┌──────────────────────────────┐
│       React Frontend         │
│     TypeScript + Vite        │
└──────────────┬───────────────┘
               │
               │ REST API
               ▼
┌──────────────────────────────┐
│       Express Backend        │
│          server.ts           │
├──────────────────────────────┤
│ Authentication               │
│ Voucher API                  │
│ Redemption API               │
│ Admin API                    │
│ Audit API                    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│       Voucher Engine         │
├──────────────────────────────┤
│ Code Generation              │
│ Validation                   │
│ Expiration                   │
│ Discount Calculation         │
│ Redemption                   │
│ Integrity Verification       │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│      Firebase Firestore      │
│           Database           │
└──────────────────────────────┘

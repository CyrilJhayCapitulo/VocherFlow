import React, { useState, useEffect, useCallback } from 'react';
import { api } from './services/api';
import { Voucher, DashboardMetrics, AuditLog, AdminUser } from './types';
import { Header, ActiveTab } from './components/Header';
import { RedemptionTerminal } from './components/RedemptionTerminal';
import { VoucherGenerator } from './components/VoucherGenerator';
import { VoucherRegistry } from './components/VoucherRegistry';
import { ConcurrencySimulator } from './components/ConcurrencySimulator';
import { AuditDashboard } from './components/AuditDashboard';
import { CustomerCheck } from './components/CustomerCheck';
import { ProfileTab } from './components/ProfileTab';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ShieldCheck, RefreshCw, AlertCircle, Lock, ArrowRight, Shield } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('customer');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Pre-selected code for POS redemption
  const [terminalCode, setTerminalCode] = useState<string>('');

  // Initial Auth Check
  useEffect(() => {
    const stored = api.getStoredAdmin();
    if (stored) {
      setAdminUser(stored);
      // verify token with server
      api.checkAuth().then(res => {
        if (res.authenticated && res.user) {
          setAdminUser(res.user);
        } else {
          api.clearAuthToken();
          setAdminUser(null);
        }
      }).catch(() => {
        api.clearAuthToken();
        setAdminUser(null);
      });
    }
  }, []);

  const loadData = useCallback(async () => {
    // If not logged in as admin, do not make admin API calls
    if (!adminUser) {
      setVouchers([]);
      setMetrics(null);
      setLogs([]);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const [vouchersRes, metricsRes, logsRes] = await Promise.all([
        api.listVouchers(),
        api.getMetrics(),
        api.getAuditLogs(150),
      ]);
      setVouchers(vouchersRes.vouchers);
      setMetrics(metricsRes);
      setLogs(logsRes.logs);
    } catch (err: any) {
      console.error('Failed to load application state:', err);
      if (err.message && !err.message.includes('Unauthorized')) {
        setError(err.message || 'Failed to sync with VoucherFlow server');
      }
    } finally {
      setIsLoading(false);
    }
  }, [adminUser]);

  useEffect(() => {
    loadData();
  }, [loadData, adminUser]);

  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    setShowLoginModal(false);
    setActiveTab('registry');
    loadData();
  };

  const handleLogout = async () => {
    await api.logout();
    setAdminUser(null);
    setActiveTab('customer');
  };

  const handleSelectForRedeem = (code: string) => {
    setTerminalCode(code);
    setActiveTab('redeem');
  };

  const handleVoucherCreated = (newVouchers: Voucher[]) => {
    loadData();
  };

  const handleRedemptionSuccess = () => {
    loadData();
  };

  // Fallback for unauthenticated access to admin routes
  const renderAdminGate = () => (
    <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-5 animate-fadeIn">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-slate-900/10">
        <Lock className="w-8 h-8" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-slate-900">Administrator Access Required</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Please use the <strong>Admin Login</strong> button in the top right corner of the header to authenticate.
        </p>
      </div>

      <div className="pt-2">
        <button
          onClick={() => setActiveTab('customer')}
          className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          Return to Customer / Public Portal
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans antialiased selection:bg-emerald-500 selection:text-white">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
        }}
        voucherCount={vouchers.length}
        adminUser={adminUser}
        onOpenLoginModal={() => setShowLoginModal(true)}
        onLogout={handleLogout}
      />

      {/* Error alert if any */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 w-full">
          <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl flex items-center justify-between text-xs text-red-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={loadData}
              className="text-red-700 font-semibold underline hover:text-red-900 cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <div className="text-xs font-semibold text-slate-500">Connecting to VoucherFlow Registry...</div>
          </div>
        ) : (
          <div>
            {/* Public Tab (No login required) */}
            {activeTab === 'customer' && (
              <CustomerCheck 
                onRedemptionSuccess={handleRedemptionSuccess}
              />
            )}

            {/* Admin Tabs (Protected) */}
            {activeTab === 'registry' && (
              adminUser ? (
                <VoucherRegistry
                  vouchers={vouchers}
                  onRefresh={loadData}
                  onSelectForRedeem={handleSelectForRedeem}
                />
              ) : renderAdminGate()
            )}

            {activeTab === 'generate' && (
              adminUser ? (
                <VoucherGenerator
                  onVoucherCreated={handleVoucherCreated}
                  onNavigateToRedeem={handleSelectForRedeem}
                />
              ) : renderAdminGate()
            )}

            {activeTab === 'redeem' && (
              adminUser ? (
                <RedemptionTerminal
                  initialCode={terminalCode}
                  onRedemptionSuccess={handleRedemptionSuccess}
                />
              ) : renderAdminGate()
            )}

            {activeTab === 'concurrency' && (
              adminUser ? (
                <ConcurrencySimulator
                  vouchers={vouchers}
                  onRefresh={loadData}
                />
              ) : renderAdminGate()
            )}

            {activeTab === 'audit' && (
              adminUser ? (
                <AuditDashboard
                  metrics={metrics}
                  logs={logs}
                  vouchers={vouchers}
                  onRefresh={loadData}
                />
              ) : renderAdminGate()
            )}

            {activeTab === 'profile' && (
              adminUser ? (
                <ProfileTab
                  adminUser={adminUser}
                  onProfileUpdated={(updated) => {
                    setAdminUser(updated);
                    loadData();
                  }}
                />
              ) : renderAdminGate()
            )}
          </div>
        )}
      </main>

      {/* Admin Login Modal */}
      {showLoginModal && (
        <AdminLoginModal
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => setShowLoginModal(false)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>VoucherFlow Enterprise Engine</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">Atomic Single-Use & Concurrency Guard Active</span>
          </div>
          <div className="text-[11px] text-slate-400">
            SHA-256 HMAC Integrity • Thread-Safe Mutex Lock • File-Backed Persistence
          </div>
        </div>
      </footer>

    </div>
  );
}

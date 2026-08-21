import React from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  PlusCircle, 
  ListOrdered, 
  Zap, 
  BarChart3, 
  Search,
  Lock,
  Unlock,
  User,
  UserCircle,
  LogOut,
  Sparkles,
  QrCode
} from 'lucide-react';
import { AdminUser } from '../types';

export type ActiveTab = 'customer' | 'redeem' | 'generate' | 'registry' | 'concurrency' | 'audit' | 'profile';

interface Props {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  voucherCount: number;
  adminUser: AdminUser | null;
  onOpenLoginModal: () => void;
  onLogout: () => void;
}

export const Header: React.FC<Props> = ({ 
  activeTab, 
  onTabChange, 
  voucherCount,
  adminUser,
  onOpenLoginModal,
  onLogout
}) => {
  // Public tabs vs Admin tabs
  const publicTabs = [
    { id: 'customer', label: 'Customer / Public POS Check', icon: Search, badge: 'No Account' },
  ];

  const adminTabs = [
    { id: 'registry', label: 'Voucher Ledger', icon: ListOrdered, badge: voucherCount > 0 ? `${voucherCount}` : undefined },
    { id: 'generate', label: 'Generate Vouchers', icon: PlusCircle },
    { id: 'redeem', label: 'POS Terminal & Manual Redeem', icon: CreditCard },
    { id: 'concurrency', label: 'Concurrency Race Guard', icon: Zap, highlight: true },
    { id: 'audit', label: 'Audit Logs & Metrics', icon: BarChart3 },
    { id: 'profile', label: 'Admin Profile', icon: UserCircle },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Brand Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3 border-b border-slate-100">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-slate-900/10">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-slate-900">VoucherFlow</h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Enterprise POS & Ledger
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Cryptographic Generation, Anti-Duplicate Atomic Locks & Role-Based Access
              </p>
            </div>
          </div>

          {/* User Role & Auth Bar */}
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            
            {/* Mutex lock status indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Lock className="w-3 h-3 text-emerald-600" />
              <span>Double-Spend Guard Active</span>
            </div>

            {/* Admin Session or Login Button */}
            {adminUser ? (
              <div className="flex items-center gap-2 bg-slate-900 text-white pl-3 pr-1.5 py-1 rounded-xl border border-slate-800 text-xs shadow-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-semibold text-slate-200">{adminUser.name}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                    Admin
                  </span>
                </div>
                <button
                  id="admin-logout-btn"
                  onClick={onLogout}
                  className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                  title="Logout of Admin Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
                  Customer / Guest Mode
                </span>
                <button
                  id="header-admin-login-btn"
                  onClick={onOpenLoginModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Admin Login</span>
                </button>
              </div>
            )}

          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between overflow-x-auto py-2 scrollbar-none gap-2">
          
          <div className="flex space-x-1 items-center">
            {/* Public Tab */}
            {publicTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}-btn`}
                  onClick={() => onTabChange(tab.id as ActiveTab)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-emerald-600'}`} />
                  <span>{tab.label}</span>
                  {!adminUser && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Customer Mode
                    </span>
                  )}
                </button>
              );
            })}

            {/* Admin Tabs - ONLY visible when logged in as Admin */}
            {adminUser && (
              <>
                <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />
                {adminTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      id={`tab-${tab.id}-btn`}
                      onClick={() => onTabChange(tab.id as ActiveTab)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? (tab.highlight ? 'text-amber-400' : 'text-emerald-400') : 'text-slate-500'}`} />
                      <span>{tab.label}</span>
                      {tab.badge && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isActive ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {!adminUser ? (
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Admin features hidden for customer view</span>
              </span>
            </div>
          ) : (
            <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Admin Management Mode Unlocked</span>
            </div>
          )}

        </div>

      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  UserCircle, 
  KeyRound, 
  Save, 
  ShieldCheck, 
  Mail, 
  Briefcase, 
  Building2, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Lock, 
  RefreshCw, 
  UserCheck,
  UserPlus,
  Users,
  Database,
  Trash2,
  X,
  Sparkles,
  Calendar,
  Layers,
  Clock
} from 'lucide-react';
import { AdminUser, AdminAccount } from '../types';
import { api } from '../services/api';

interface Props {
  adminUser: AdminUser;
  onProfileUpdated: (updatedUser: AdminUser) => void;
}

export const ProfileTab: React.FC<Props> = ({ adminUser, onProfileUpdated }) => {
  // Information Form State
  const [name, setName] = useState(adminUser.name || '');
  const [email, setEmail] = useState(adminUser.email || '');
  const [department, setDepartment] = useState(adminUser.department || 'Operations & IT Infrastructure');
  const [jobTitle, setJobTitle] = useState(adminUser.jobTitle || 'Lead Voucher Security Director');
  const [phone, setPhone] = useState(adminUser.phone || '+1 (555) 234-5678');
  const [avatarUrl, setAvatarUrl] = useState(adminUser.avatarUrl || '');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback States
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Admin Directory State
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  // Create Admin Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminDept, setNewAdminDept] = useState('Operations');
  const [newAdminJobTitle, setNewAdminJobTitle] = useState('Voucher Security Administrator');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newAdminAvatar, setNewAdminAvatar] = useState('');
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Delete Admin State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Synchronize state when adminUser prop updates
  useEffect(() => {
    setName(adminUser.name || '');
    setEmail(adminUser.email || '');
    if (adminUser.department) setDepartment(adminUser.department);
    if (adminUser.jobTitle) setJobTitle(adminUser.jobTitle);
    if (adminUser.phone) setPhone(adminUser.phone);
    if (adminUser.avatarUrl !== undefined) setAvatarUrl(adminUser.avatarUrl);
  }, [adminUser]);

  // Load fresh profile and admin accounts on mount
  const loadAdminDirectory = async () => {
    setLoadingAccounts(true);
    setDirectoryError(null);
    try {
      const data = await api.getAdminAccounts();
      setAdminAccounts(data.accounts || []);
    } catch (err: any) {
      setDirectoryError(err.message || 'Failed to load administrator accounts');
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    api.getAdminProfile()
      .then(profile => {
        if (mounted && profile) {
          setName(profile.name || '');
          setEmail(profile.email || '');
          if (profile.department) setDepartment(profile.department);
          if (profile.jobTitle) setJobTitle(profile.jobTitle);
          if (profile.phone) setPhone(profile.phone);
          if (profile.avatarUrl !== undefined) setAvatarUrl(profile.avatarUrl);
        }
      })
      .catch(() => {});

    loadAdminDirectory();

    return () => {
      mounted = false;
    };
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoLoading(true);
    setInfoSuccess(null);
    setInfoError(null);

    if (!name.trim() || !email.trim()) {
      setInfoError('Full name and email address are required.');
      setInfoLoading(false);
      return;
    }

    try {
      const res = await api.updateAdminProfile({
        name: name.trim(),
        email: email.trim(),
        department: department.trim(),
        jobTitle: jobTitle.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim(),
      });

      setInfoSuccess('Administrator profile information saved & synced to Firestore.');
      onProfileUpdated(res.user);
      loadAdminDirectory();
      setTimeout(() => setInfoSuccess(null), 5000);
    } catch (err: any) {
      setInfoError(err.message || 'Failed to update profile information.');
    } finally {
      setInfoLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current administrator password.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation password do not match.');
      setPasswordLoading(false);
      return;
    }

    try {
      await api.changeAdminPassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordSuccess('Password has been changed securely and updated in Firestore.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewAdminPassword(pass);
    setShowNewAdminPassword(true);
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    if (!newAdminName.trim() || !newAdminEmail.trim() || !newAdminPassword.trim()) {
      setCreateError('Full name, email address, and initial password are required.');
      setCreateLoading(false);
      return;
    }

    if (newAdminPassword.length < 6) {
      setCreateError('Password must be at least 6 characters long.');
      setCreateLoading(false);
      return;
    }

    try {
      const res = await api.createAdminAccount({
        name: newAdminName.trim(),
        email: newAdminEmail.trim(),
        password: newAdminPassword.trim(),
        department: newAdminDept.trim(),
        jobTitle: newAdminJobTitle.trim(),
        phone: newAdminPhone.trim(),
        avatarUrl: newAdminAvatar.trim(),
      });

      setCreateSuccess(`Administrator account for ${res.admin.name} created and linked to Firestore!`);
      loadAdminDirectory();
      
      // Reset form
      setNewAdminName('');
      setNewAdminEmail('');
      setNewAdminPassword('');
      setNewAdminPhone('');
      setNewAdminAvatar('');

      setTimeout(() => {
        setCreateSuccess(null);
        setShowCreateModal(false);
      }, 1800);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create admin account');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: string, adminName: string) => {
    if (!window.confirm(`Are you sure you want to delete administrator account "${adminName}"? This action will remove their credentials and delete their document from Firebase Firestore.`)) {
      return;
    }

    setDeletingId(id);
    try {
      await api.deleteAdminAccount(id);
      await loadAdminDirectory();
    } catch (err: any) {
      alert(err.message || 'Failed to delete admin account');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Profile Overview Card with Firestore Badge & Create Admin Button */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-2xl shadow-inner">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name} 
                  className="w-full h-full object-cover rounded-2xl" 
                  referrerPolicy="no-referrer"
                  onError={() => setAvatarUrl('')}
                />
              ) : (
                <span>{name.charAt(0).toUpperCase() || 'A'}</span>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{name || 'Administrator'}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  Super Admin
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  <Database className="w-3 h-3 text-blue-400" />
                  Firebase Firestore Linked
                </span>
              </div>
              <p className="text-sm text-slate-300 flex flex-wrap items-center gap-2 mt-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{email}</span>
                <span className="text-slate-500">•</span>
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>{jobTitle}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <button
              id="create-new-admin-btn"
              onClick={() => {
                setShowCreateModal(true);
                setCreateError(null);
                setCreateSuccess(null);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Admin Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Admin Team & Firestore Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Administrator Accounts Directory</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                  {adminAccounts.length} {adminAccounts.length === 1 ? 'account' : 'accounts'}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Database className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Linked & synchronized with Firebase Firestore (<code className="font-mono text-[11px] text-slate-700 bg-slate-100 px-1 py-0.5 rounded">/admins</code> collection)</span>
              </p>
            </div>
          </div>

          <button
            onClick={loadAdminDirectory}
            disabled={loadingAccounts}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAccounts ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh Directory</span>
          </button>
        </div>

        {directoryError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{directoryError}</span>
          </div>
        )}

        {/* Directory List */}
        <div className="overflow-hidden rounded-xl border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Direct Contact</th>
                  <th className="py-3 px-4">Firestore Sync ID</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {adminAccounts.map((acc) => {
                  const isCurrent = acc.email.toLowerCase() === adminUser.email.toLowerCase();
                  return (
                    <tr key={acc.id} className={`hover:bg-slate-50/80 transition ${isCurrent ? 'bg-emerald-50/30' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 overflow-hidden">
                            {acc.avatarUrl ? (
                              <img src={acc.avatarUrl} alt={acc.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <span>{acc.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{acc.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 text-[11px] block">{acc.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-900 font-semibold block">{acc.jobTitle || 'Administrator'}</span>
                        <span className="text-slate-500 text-[11px]">{acc.department || 'Operations'}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {acc.phone ? <span>{acc.phone}</span> : <span className="text-slate-400 italic">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                          <Database className="w-3 h-3 text-blue-500 shrink-0" />
                          <span className="truncate max-w-[140px]">{acc.id}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {adminAccounts.length > 1 && !isCurrent ? (
                          <button
                            onClick={() => handleDeleteAdmin(acc.id, acc.name)}
                            disabled={deletingId === acc.id}
                            title="Delete Admin Account"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50 cursor-pointer"
                          >
                            {deletingId === acc.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Protected</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Two-Column Grid for Information & Password */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Edit Profile Information (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <UserCircle className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Administrator Profile Details</h3>
              <p className="text-xs text-slate-500">Update your operational contact and administrative details</p>
            </div>
          </div>

          {infoSuccess && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{infoSuccess}</span>
            </div>
          )}

          {infoError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-800 text-xs font-semibold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{infoError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="profile-name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chief Administrator"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="profile-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@voucherflow.com"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Department / Unit
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="profile-department-input"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Operations & IT Infrastructure"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Job Title
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="profile-jobtitle-input"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Lead Voucher Security Director"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Direct Phone Contact
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="profile-phone-input"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 234-5678"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Avatar Image URL (Optional)
                </label>
                <input
                  id="profile-avatar-input"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-medium"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                id="save-profile-btn"
                type="submit"
                disabled={infoLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                {infoLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Firestore...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-emerald-400" />
                    <span>Save Information</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Change Password (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-4 mb-6 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Change Password</h3>
                <p className="text-xs text-slate-500">Update your administrative credentials</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-800 text-xs font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="current-password-input"
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="new-password-input"
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirm-password-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3">
                <button
                  id="submit-change-password-btn"
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {passwordLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Updating in Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Passwords are hashed using SHA-256 and audited on change.</span>
          </div>
        </div>

      </div>

      {/* Create New Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Administrator</h3>
                <p className="text-xs text-slate-500">Add an administrator linked to Firebase Firestore</p>
              </div>
            </div>

            {createSuccess && (
              <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{createSuccess}</span>
              </div>
            )}

            {createError && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-red-800 text-xs font-semibold animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-admin-name-input"
                  type="text"
                  required
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  placeholder="e.g. Alexander Mitchell"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="new-admin-email-input"
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="alex.mitchell@voucherflow.com"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Initial Password <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Generate Strong Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="new-admin-password-input"
                    type={showNewAdminPassword ? 'text' : 'password'}
                    required
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewAdminPassword(!showNewAdminPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showNewAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newAdminDept}
                    onChange={(e) => setNewAdminDept(e.target.value)}
                    placeholder="Operations & Security"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={newAdminJobTitle}
                    onChange={(e) => setNewAdminJobTitle(e.target.value)}
                    placeholder="Voucher Security Lead"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    placeholder="+1 (555) 019-2831"
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Avatar URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={newAdminAvatar}
                    onChange={(e) => setNewAdminAvatar(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-600">
                <Database className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <span>This account will be provisioned in the Cloud Firestore database under <code className="font-mono text-slate-800">/admins</code> and can immediately sign into the Admin Command Center.</span>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="submit-create-admin-btn"
                  type="submit"
                  disabled={createLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  {createLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Provisioning in Firestore...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create & Sync Admin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

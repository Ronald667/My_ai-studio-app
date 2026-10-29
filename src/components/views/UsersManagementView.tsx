import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole, UserStatus } from '../../types';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ArrowRightLeft,
  Filter,
  Grid,
  List,
  Copy,
  X,
  Briefcase,
  Mail,
  Phone,
  Clock,
  Lock,
  Trash2,
  Edit3,
  Sparkles,
  ExternalLink,
  Check,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

export const UsersManagementView: React.FC = () => {
  const {
    state,
    currentUser,
    switchUser,
    updateUserProfile,
    deleteUserAccount,
    setIsCreateAccountOpen,
    setIsUpgradeModalOpen,
    setRole,
    showPushAlert,
    t,
  } = useApp();

  // Filters and View State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [mfaFilter, setMfaFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Interactive Selected User Detail Drawer
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<{
    name: string;
    email: string;
    jobTitle: string;
    department: string;
    role: UserRole;
    phoneNumber: string;
    twoFactorEnabled: boolean;
    status: UserStatus;
  }>({
    name: '',
    email: '',
    jobTitle: '',
    department: '',
    role: 'team_member',
    phoneNumber: '',
    twoFactorEnabled: false,
    status: 'active',
  });

  // Delete confirmation modal state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Copied feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const users = state.users;
  const subscription = state.subscription;
  const seatsUsed = subscription?.seatsUsed || users.length;
  const seatsAllocated = subscription?.seatsAllocated || 25;
  const seatsPercent = Math.min(100, Math.round((seatsUsed / seatsAllocated) * 100));

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set);
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesDept = u.department?.toLowerCase().includes(q);
        const matchesTitle = u.jobTitle?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesDept && !matchesTitle) {
          return false;
        }
      }

      // Role filter
      if (roleFilter !== 'all' && u.role !== roleFilter) {
        return false;
      }

      // Department filter
      if (departmentFilter !== 'all' && u.department !== departmentFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && u.status !== statusFilter) {
        return false;
      }

      // MFA filter
      if (mfaFilter === 'enabled' && !u.twoFactorEnabled) return false;
      if (mfaFilter === 'disabled' && u.twoFactorEnabled) return false;

      return true;
    });
  }, [users, searchQuery, roleFilter, departmentFilter, statusFilter, mfaFilter]);

  // Key KPI stats
  const totalCount = users.length;
  const activeCount = users.filter((u) => u.status === 'active').length;
  const adminCount = users.filter(
    (u) => u.role === 'super_admin' || u.role === 'compliance_officer'
  ).length;
  const mfaEnabledCount = users.filter((u) => u.twoFactorEnabled).length;
  const mfaRate = totalCount > 0 ? Math.round((mfaEnabledCount / totalCount) * 100) : 0;

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Open Edit modal
  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setEditFormData({
      name: u.name,
      email: u.email,
      jobTitle: u.jobTitle || '',
      department: u.department || 'Operations',
      role: u.role,
      phoneNumber: u.phoneNumber || '',
      twoFactorEnabled: Boolean(u.twoFactorEnabled),
      status: u.status,
    });
  };

  // Save Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUserProfile(editingUser.id, {
      name: editFormData.name,
      email: editFormData.email,
      jobTitle: editFormData.jobTitle,
      department: editFormData.department,
      role: editFormData.role,
      phoneNumber: editFormData.phoneNumber,
      twoFactorEnabled: editFormData.twoFactorEnabled,
      status: editFormData.status,
    });

    if (selectedUser?.id === editingUser.id) {
      setSelectedUser({
        ...selectedUser,
        ...editFormData,
      });
    }

    setEditingUser(null);
    showPushAlert('User Account Updated', `Changes to ${editFormData.name} have been committed.`);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (!userToDelete) return;
    deleteUserAccount(userToDelete.id);
    if (selectedUser?.id === userToDelete.id) {
      setSelectedUser(null);
    }
    setUserToDelete(null);
  };

  // Password reset simulation
  const handleResetPassword = async (user: User) => {
    try {
      await fetch(`/api/users/${user.id}/reset-password`, { method: 'POST' });
      showPushAlert('Security Link Sent', `Password reset instructions dispatched to ${user.email}.`);
    } catch {
      showPushAlert('Notice', `Simulated reset instructions dispatched to ${user.email}.`);
    }
  };

  // Toggle 2FA directly
  const handleToggle2FA = (user: User) => {
    const updated = !user.twoFactorEnabled;
    updateUserProfile(user.id, { twoFactorEnabled: updated });
    if (selectedUser?.id === user.id) {
      setSelectedUser({ ...selectedUser, twoFactorEnabled: updated });
    }
    showPushAlert(
      updated ? '2FA Enforced' : '2FA Deactivated',
      `Two-Factor Authentication is now ${updated ? 'active' : 'disabled'} for ${user.name}.`
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Department', 'Job Title', 'Status', '2FA Enforced', 'Created At'];
    const rows = filteredUsers.map((u) => [
      u.id,
      `"${u.name}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.department || ''}"`,
      `"${u.jobTitle || ''}"`,
      `"${u.status}"`,
      u.twoFactorEnabled ? 'YES' : 'NO',
      `"${u.createdAt || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `omniwork-users-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showPushAlert('Directory Exported', `Generated CSV export containing ${filteredUsers.length} user records.`);
  };

  // Role Badge Helper
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-purple-500/10 px-2 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Lock className="h-3 w-3" />
            Super Admin
          </span>
        );
      case 'compliance_officer':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="h-3 w-3" />
            Compliance Officer
          </span>
        );
      case 'project_manager':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Briefcase className="h-3 w-3" />
            Project Manager
          </span>
        );
      case 'production_lead':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Sparkles className="h-3 w-3" />
            Production Lead
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-500/10 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400 border border-slate-500/20">
            <Users className="h-3 w-3" />
            Team Member
          </span>
        );
    }
  };

  // Status Indicator
  const getStatusIndicator = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case 'busy':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Busy
          </span>
        );
      case 'away':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Away
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            Offline
          </span>
        );
    }
  };

  const isCurrentSuperAdmin = currentUser.role === 'super_admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-violet-900/10 via-indigo-900/10 to-slate-900/5 dark:from-violet-950/40 dark:via-indigo-950/30 dark:to-slate-900/40 p-6 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-600/30">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
                Enterprise User Directory & Access Governance
              </h1>
              <span className="rounded-full bg-violet-500/10 dark:bg-violet-500/20 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wide text-violet-600 dark:text-violet-400 border border-violet-500/30">
                ADMIN CONSOLE
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Centralized identity governance, role-based authorization (RBAC), multi-factor security status, and tenant seat allocations.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="export-users-csv-btn"
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-sm transition-all"
            title="Download CSV report of all workspace users"
          >
            <Download className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>

          <button
            id="admin-add-new-user-btn"
            type="button"
            onClick={() => setIsCreateAccountOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/20 hover:from-violet-500 hover:to-indigo-500 transition-all"
            title="Provision a new user account"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Add New User</span>
          </button>
        </div>
      </div>

      {/* RBAC Notice if viewer is not Super Admin */}
      {!isCurrentSuperAdmin && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
            <span>
              You are currently viewing the User Directory in <strong>Audit Mode</strong> as{' '}
              <strong>{currentUser.name}</strong> ({currentUser.role}). Administrative operations like changing roles or decommissioning accounts require Super Admin authorization.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              const admin = users.find((u) => u.role === 'super_admin');
              if (admin) {
                switchUser(admin.id);
                setRole('super_admin');
              }
            }}
            className="whitespace-nowrap rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition-colors"
          >
            Switch to Super Admin
          </button>
        </div>
      )}

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Workspace Users
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 font-display">
              {totalCount}
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              {activeCount} active today
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            Across {departments.length} enterprise departments
          </div>
        </div>

        {/* License & Seat Utilization */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Seat License Quota
            </span>
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="text-[11px] font-bold text-indigo-500 hover:underline"
            >
              + Add Seats
            </button>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 font-display">
              {seatsUsed} / {seatsAllocated}
            </span>
            <span className="text-xs font-medium text-slate-400">
              ({seatsAllocated - seatsUsed} available)
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                seatsPercent > 90 ? 'bg-rose-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${seatsPercent}%` }}
            />
          </div>
        </div>

        {/* Privileged Roles */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Privileged Governance
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 font-display">
              {adminCount}
            </span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              High-privilege accounts
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {users.filter((u) => u.role === 'super_admin').length} Super Admin(s),{' '}
            {users.filter((u) => u.role === 'compliance_officer').length} Compliance Officer(s)
          </div>
        </div>

        {/* 2FA Enforcement */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              MFA / 2FA Adoption
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Lock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 font-display">
              {mfaRate}%
            </span>
            <span
              className={`text-xs font-medium ${
                mfaRate >= 80
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {mfaEnabledCount} of {totalCount} enrolled
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            SOC2 & HIPAA standard: 100% recommended
          </div>
        </div>
      </div>

      {/* Search, Filter, and Controls Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="users-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, job title, or department..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 pl-10 pr-9 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Table view"
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all ${
                viewMode === 'grid'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              title="Grid card view"
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Cards</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            <Filter className="h-3 w-3" />
            <span>Filters:</span>
          </div>

          {/* Role Filter */}
          <select
            id="role-filter-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter users by role"
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:border-violet-500 focus:outline-none"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="compliance_officer">Compliance Officer</option>
            <option value="project_manager">Project Manager</option>
            <option value="production_lead">Production Lead</option>
            <option value="team_member">Team Member</option>
          </select>

          {/* Department Filter */}
          <select
            id="dept-filter-select"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            aria-label="Filter users by department"
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:border-violet-500 focus:outline-none"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            id="status-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter users by status"
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:border-violet-500 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="busy">Busy</option>
            <option value="away">Away</option>
            <option value="offline">Offline</option>
          </select>

          {/* MFA Filter */}
          <select
            id="mfa-filter-select"
            value={mfaFilter}
            onChange={(e) => setMfaFilter(e.target.value)}
            aria-label="Filter users by 2FA status"
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 focus:border-violet-500 focus:outline-none"
          >
            <option value="all">All 2FA States</option>
            <option value="enabled">2FA Enforced</option>
            <option value="disabled">2FA Disabled</option>
          </select>

          {/* Active Filter Clear */}
          {(roleFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all' || mfaFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setRoleFilter('all');
                setDepartmentFilter('all');
                setStatusFilter('all');
                setMfaFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-semibold ml-auto"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Users Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> registered users
        </span>
        <span>
          Active session: <strong>{currentUser.name}</strong> ({currentUser.role})
        </span>
      </div>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-3">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            No matching users found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
            Try adjusting your search criteria, role filters, or department filters.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
              setDepartmentFilter('all');
              setStatusFilter('all');
              setMfaFilter('all');
            }}
            className="mt-4 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-500 transition-colors"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && filteredUsers.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-4 pr-3">User & Identity</th>
                  <th className="py-3.5 px-3">Role & Permissions</th>
                  <th className="py-3.5 px-3">Department</th>
                  <th className="py-3.5 px-3">Status</th>
                  <th className="py-3.5 px-3">2FA Security</th>
                  <th className="py-3.5 px-3">Member Since</th>
                  <th className="py-3.5 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUser.id;
                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        isCurrent ? 'bg-violet-50/40 dark:bg-violet-950/10' : ''
                      }`}
                    >
                      {/* User & Identity */}
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="h-10 w-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
                            />
                            <span
                              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                                user.status === 'active'
                                  ? 'bg-emerald-500'
                                  : user.status === 'busy'
                                  ? 'bg-amber-500'
                                  : user.status === 'away'
                                  ? 'bg-orange-500'
                                  : 'bg-slate-400'
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {user.name}
                              </span>
                              {isCurrent && (
                                <span className="rounded bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 text-[10px] font-bold px-1.5 py-0.2 uppercase">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                              <span className="truncate">{user.email}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(user.email, `email-${user.id}`)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                title="Copy Email"
                              >
                                {copiedId === `email-${user.id}` ? (
                                  <Check className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                            {user.jobTitle && (
                              <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                {user.jobTitle}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-block rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-slate-700 dark:text-slate-300 text-xs font-medium">
                          {user.department || 'Operations'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {getStatusIndicator(user.status)}
                      </td>

                      {/* 2FA Security */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggle2FA(user)}
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold transition-all ${
                            user.twoFactorEnabled
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20'
                          }`}
                          title={`Click to ${user.twoFactorEnabled ? 'disable' : 'enable'} 2FA`}
                        >
                          {user.twoFactorEnabled ? (
                            <>
                              <ShieldCheck className="h-3 w-3 text-emerald-500" />
                              <span>Enforced</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="h-3 w-3 text-amber-500" />
                              <span>Disabled</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Member Since */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                        <div>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Jan 15, 2025'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {user.lastActive || 'Active today'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          {/* Inspect Profile */}
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            title="View full user profile & permissions"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Switch User / Impersonate */}
                          {!isCurrent && (
                            <button
                              type="button"
                              onClick={() => {
                                switchUser(user.id);
                                showPushAlert('Session Switched', `Now acting as ${user.name}.`);
                              }}
                              className="rounded-lg p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-colors"
                              title="Switch active identity to this user"
                            >
                              <ArrowRightLeft className="h-4 w-4" />
                            </button>
                          )}

                          {/* Edit User */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                            title="Edit user details & role"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          {/* Delete Account */}
                          <button
                            type="button"
                            disabled={isCurrent}
                            onClick={() => setUserToDelete(user)}
                            className={`rounded-lg p-1.5 transition-colors ${
                              isCurrent
                                ? 'opacity-30 cursor-not-allowed text-slate-400'
                                : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600'
                            }`}
                            title={isCurrent ? 'Cannot delete current session' : 'Revoke user credentials & delete account'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRID CARD VIEW */}
      {viewMode === 'grid' && filteredUsers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((user) => {
            const isCurrent = user.id === currentUser.id;
            const assignedTasksCount = state.tasks.filter(
              (t) => t.assigneeId === user.id || t.assigneeName === user.name
            ).length;

            return (
              <div
                key={user.id}
                className={`relative rounded-2xl border transition-all p-5 backdrop-blur-sm ${
                  isCurrent
                    ? 'border-violet-500/40 bg-violet-50/20 dark:bg-violet-950/10 shadow-md shadow-violet-500/5'
                    : 'border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Top Card Bar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="relative">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-14 w-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                        user.status === 'active'
                          ? 'bg-emerald-500'
                          : user.status === 'busy'
                          ? 'bg-amber-500'
                          : user.status === 'away'
                          ? 'bg-orange-500'
                          : 'bg-slate-400'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    {getRoleBadge(user.role)}
                    {isCurrent && (
                      <span className="rounded bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 text-[10px] font-bold px-1.5 py-0.2 uppercase">
                        Current Session
                      </span>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="mt-4">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {user.jobTitle || 'Team Member'}
                  </p>
                  <p className="text-xs font-semibold text-violet-600 dark:text-violet-400 mt-0.5">
                    {user.department || 'Operations'}
                  </p>
                </div>

                {/* Contact Details */}
                <div className="mt-4 space-y-1.5 border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 truncate">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{user.email}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(user.email, `grid-email-${user.id}`)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {copiedId === `grid-email-${user.id}` ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>

                  {user.phoneNumber && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>{user.phoneNumber}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">2FA Security:</span>
                    <button
                      type="button"
                      onClick={() => handleToggle2FA(user)}
                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                        user.twoFactorEnabled
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {user.twoFactorEnabled ? (
                        <>
                          <ShieldCheck className="h-3 w-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-3 w-3" />
                          <span>Disabled</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <span className="text-[11px] text-slate-400">
                    {assignedTasksCount} assigned task{assignedTasksCount === 1 ? '' : 's'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedUser(user)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Inspect User Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    {!isCurrent && (
                      <button
                        type="button"
                        onClick={() => {
                          switchUser(user.id);
                          showPushAlert('Identity Switched', `Now logged in as ${user.name}.`);
                        }}
                        className="rounded-lg p-1.5 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                        title="Switch to this user account"
                      >
                        <ArrowRightLeft className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(user)}
                      className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Profile"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      disabled={isCurrent}
                      onClick={() => setUserToDelete(user)}
                      className={`rounded-lg p-1.5 transition-colors ${
                        isCurrent
                          ? 'opacity-25 cursor-not-allowed text-slate-400'
                          : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                      }`}
                      title={isCurrent ? 'Cannot delete current session' : 'Delete user account'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* USER DETAIL SLIDE-OVER DRAWER */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="flex flex-col w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  User Governance Profile
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6">
              {/* Profile Card */}
              <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                <div className="relative">
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="h-20 w-20 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-md"
                  />
                  <span
                    className={`absolute bottom-1 right-1 h-4 w-4 rounded-full ring-2 ring-white dark:ring-slate-900 ${
                      selectedUser.status === 'active'
                        ? 'bg-emerald-500'
                        : selectedUser.status === 'busy'
                        ? 'bg-amber-500'
                        : selectedUser.status === 'away'
                        ? 'bg-orange-500'
                        : 'bg-slate-400'
                    }`}
                  />
                </div>
                <h3 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedUser.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedUser.jobTitle || 'Team Member'}
                </p>
                <div className="mt-2.5 flex items-center gap-2">
                  {getRoleBadge(selectedUser.role)}
                  <span className="rounded-md bg-slate-200 dark:bg-slate-700 px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {selectedUser.department || 'Operations'}
                  </span>
                </div>
              </div>

              {/* Primary Identity Info */}
              <div className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[10px] text-slate-400">
                  Identity Details
                </h4>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Email Address</span>
                  <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                    <span>{selectedUser.email}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedUser.email, 'drawer-email')}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {copiedId === 'drawer-email' ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Phone Number</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedUser.phoneNumber || '+1 (415) 555-0100'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Tenant Account ID</span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    {selectedUser.id}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                  <span className="text-slate-500 dark:text-slate-400">Two-Factor Authentication</span>
                  <button
                    type="button"
                    onClick={() => handleToggle2FA(selectedUser)}
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold text-xs ${
                      selectedUser.twoFactorEnabled
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {selectedUser.twoFactorEnabled ? 'Enforced (TOTP)' : 'Not Enabled'}
                  </button>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Created / Registered</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleString()
                      : 'January 15, 2025'}
                  </span>
                </div>
              </div>

              {/* RBAC Entitlements Matrix */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-xs space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                  Role Entitlements & Permissions
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      User & Tenant Management
                    </span>
                    {selectedUser.role === 'super_admin' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <span className="text-[11px] text-slate-400">Read Only</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      GDPR & HIPAA Compliance Audit
                    </span>
                    {selectedUser.role === 'super_admin' || selectedUser.role === 'compliance_officer' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <span className="text-[11px] text-slate-400">Restricted</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      Inventory Adjustments & Stock Movement
                    </span>
                    {selectedUser.role === 'super_admin' || selectedUser.role === 'production_lead' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <span className="text-[11px] text-slate-400">Restricted</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      Subscription & Enterprise Billing
                    </span>
                    {selectedUser.role === 'super_admin' ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <span className="text-[11px] text-slate-400">Restricted</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Tasks Assigned to this user */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
                    Assigned Work Orders & Tasks
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {
                      state.tasks.filter(
                        (t) => t.assigneeId === selectedUser.id || t.assigneeName === selectedUser.name
                      ).length
                    }{' '}
                    total
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {state.tasks
                    .filter(
                      (t) => t.assigneeId === selectedUser.id || t.assigneeName === selectedUser.name
                    )
                    .map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-800/40 p-2.5 border border-slate-100 dark:border-slate-800"
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                            {t.title}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Priority: {t.priority} • Due {t.dueDate || 'Soon'}
                          </p>
                        </div>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                            t.status === 'done'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : t.status === 'in_progress'
                              ? 'bg-indigo-500/10 text-indigo-500'
                              : 'bg-slate-500/10 text-slate-500'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  {state.tasks.filter(
                    (t) => t.assigneeId === selectedUser.id || t.assigneeName === selectedUser.name
                  ).length === 0 && (
                    <p className="text-slate-400 text-xs py-2 text-center">
                      No active tasks currently assigned to this user.
                    </p>
                  )}
                </div>
              </div>

              {/* Administrative Actions */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleResetPassword(selectedUser)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Lock className="h-4 w-4 text-slate-400" />
                  <span>Dispatch Security Password Reset Link</span>
                </button>

                {selectedUser.id !== currentUser.id && (
                  <button
                    type="button"
                    onClick={() => {
                      switchUser(selectedUser.id);
                      setSelectedUser(null);
                      showPushAlert('Identity Switched', `Now logged in as ${selectedUser.name}.`);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-violet-500 transition-colors"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    <span>Impersonate / Switch to {selectedUser.name}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(selectedUser);
                    setSelectedUser(null);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Edit3 className="h-4 w-4 text-slate-400" />
                  <span>Edit Account Role & Profile Information</span>
                </button>

                {selectedUser.id !== currentUser.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserToDelete(selectedUser);
                      setSelectedUser(null);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 py-2.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Decommission & Revoke Account</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Edit3 className="h-5 w-5 text-violet-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Edit User Account & Role
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editFormData.phoneNumber}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, phoneNumber: e.target.value })
                    }
                    placeholder="+1 (415) 555-0199"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={editFormData.jobTitle}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, jobTitle: e.target.value })
                    }
                    placeholder="Staff Engineer / VP"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editFormData.department}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, department: e.target.value })
                    }
                    placeholder="Operations / Legal / Engineering"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role & Authority Level
                  </label>
                  <select
                    value={editFormData.role}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, role: e.target.value as UserRole })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:outline-none"
                  >
                    <option value="team_member">Team Member (Standard User)</option>
                    <option value="project_manager">Project Manager (Sprints & Delivery)</option>
                    <option value="production_lead">Production Lead (Inventory & Batches)</option>
                    <option value="compliance_officer">Compliance Officer (HIPAA & Audit)</option>
                    <option value="super_admin">Super Admin (Full Workspace Access)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Directory Presence Status
                  </label>
                  <select
                    value={editFormData.status}
                    onChange={(e) =>
                      setEditFormData({ ...editFormData, status: e.target.value as UserStatus })
                    }
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-violet-500 focus:outline-none"
                  >
                    <option value="active">Active (Online)</option>
                    <option value="busy">Busy (In Review)</option>
                    <option value="away">Away (Temporary)</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="edit-two-factor"
                  checked={editFormData.twoFactorEnabled}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, twoFactorEnabled: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                />
                <label
                  htmlFor="edit-two-factor"
                  className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <span className="font-bold">Enforce Two-Factor Authentication (2FA)</span>
                  <p className="text-[11px] text-slate-400">
                    Mandates TOTP / Hardware key verification upon next session login.
                  </p>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-violet-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DECOMMISSION / DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-slate-900 p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-950/60">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Decommission User Account?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to revoke credentials and decommission{' '}
              <strong>{userToDelete.name}</strong> ({userToDelete.email})?
            </p>

            <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1 text-slate-500 dark:text-slate-400">
              <p>• Tenant seat will be released and returned to license pool.</p>
              <p>• An immutable GDPR access revocation audit entry will be logged.</p>
              <p>• This action immediately terminates active sessions.</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-500 transition-colors"
              >
                Confirm Decommission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { Language } from '../i18n';
import {
  Bell,
  Sun,
  Moon,
  ShieldCheck,
  Globe,
  Radio,
  ChevronDown,
  UserCheck,
  CheckCircle2,
  Lock,
  Layers,
  Sparkles,
  UserPlus,
  CreditCard,
  User as UserIcon,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    t,
    state,
    currentUser,
    currentRole,
    setRole,
    language,
    setLanguage,
    theme,
    toggleTheme,
    isSocketConnected,
    pushEnabled,
    setPushEnabled,
    notificationDrawerOpen,
    setNotificationDrawerOpen,
    setIsCreateAccountOpen,
    setIsUpgradeModalOpen,
    setCurrentTab,
    switchUser,
  } = useApp();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const unreadCount = state.notifications.filter((n) => !n.read).length;

  const roleLabels: Record<UserRole, { label: string; color: string; desc: string }> = {
    super_admin: {
      label: t.roleSuperAdmin,
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      desc: 'Full unrestricted governance & systems override',
    },
    project_manager: {
      label: t.roleProjectManager,
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      desc: 'Deadlines, deliverables & sprint oversight',
    },
    compliance_officer: {
      label: t.roleComplianceOfficer,
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      desc: 'HIPAA ePHI access, GDPR DSAR & audit security',
    },
    production_lead: {
      label: t.roleProductionLead,
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      desc: 'Manufacturing work orders & inventory threshold balance',
    },
    team_member: {
      label: t.roleTeamMember,
      color: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
      desc: 'Direct task execution, SOP reading & team chat',
    },
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English (US)', flag: '🇺🇸' },
    { code: 'es', label: 'Español (ES)', flag: '🇪🇸' },
    { code: 'de', label: 'Deutsch (DE)', flag: '🇩🇪' },
    { code: 'fr', label: 'Français (FR)', flag: '🇫🇷' },
    { code: 'ja', label: '日本語 (JP)', flag: '🇯🇵' },
    { code: 'zh', label: '简体中文 (CN)', flag: '🇨🇳' },
  ];

  return (
    <header
      id="app-header"
      className="sticky top-0 z-30 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors"
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand & Connection Health */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <Layers className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight text-base font-display">
                  OmniWork
                </span>
                <span className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50">
                  Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs">
                HIPAA / GDPR / Cross-Platform Sync
              </p>
            </div>
          </div>

          {/* Real-time Socket Indicator */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-2.5 py-1 text-xs">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isSocketConnected ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isSocketConnected ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              />
            </span>
            <span className="font-medium text-slate-700 dark:text-slate-300 text-[11px]">
              {isSocketConnected ? t.syncConnected : t.syncReconnecting}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-[10px]">
              • {state.connectedClientsCount} online
            </span>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Profile Switcher */}
          <div className="relative">
            <button
              id="role-switcher-button"
              type="button"
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all ${roleLabels[currentRole].color} hover:brightness-110`}
              title={t.switchRole}
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden lg:inline">{roleLabels[currentRole].label}</span>
              <span className="lg:hidden uppercase text-[10px] tracking-wider">
                {currentRole.replace('_', ' ')}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>

            {roleMenuOpen && (
              <div
                id="role-dropdown-menu"
                className="absolute right-0 mt-2 w-72 origin-top-right rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                    {t.switchRole}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Test RBAC permissions and security governance
                  </p>
                </div>

                {(Object.keys(roleLabels) as UserRole[]).map((rKey) => {
                  const r = roleLabels[rKey];
                  const isSelected = rKey === currentRole;
                  return (
                    <button
                      key={rKey}
                      id={`role-select-${rKey}`}
                      onClick={() => {
                        setRole(rKey);
                        setRoleMenuOpen(false);
                      }}
                      className={`flex w-full items-start gap-2.5 rounded-lg p-2 text-left text-xs transition-colors ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 font-medium'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="mt-0.5">
                        {isSelected ? (
                          <CheckCircle2 className="h-4 w-4 text-indigo-500" />
                        ) : (
                          <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-700" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {r.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                          {r.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Language Switcher */}
          <div className="relative">
            <button
              id="language-switcher-button"
              type="button"
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
              title={t.language}
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline font-mono uppercase text-xs font-semibold">
                {language}
              </span>
            </button>

            {langMenuOpen && (
              <div
                id="language-dropdown-menu"
                className="absolute right-0 mt-2 w-44 origin-top-right rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1.5 shadow-xl z-50 animate-in fade-in duration-100"
              >
                {languages.map((l) => (
                  <button
                    key={l.code}
                    id={`lang-select-${l.code}`}
                    onClick={() => {
                      setLanguage(l.code);
                      setLangMenuOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      language === l.code
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </span>
                    {language === l.code && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Push Notifications Toggle */}
          <button
            id="push-toggle-button"
            type="button"
            onClick={() => setPushEnabled(!pushEnabled)}
            className={`hidden sm:flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              pushEnabled
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={pushEnabled ? t.pushEnabled : t.pushDisabled}
          >
            <Radio className={`h-3.5 w-3.5 ${pushEnabled ? 'animate-pulse' : ''}`} />
            <span>Push</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            id="theme-toggle-button"
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'dark' ? t.lightMode : t.darkMode}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notification Bell Button */}
          <button
            id="notification-bell-button"
            type="button"
            onClick={() => setNotificationDrawerOpen(!notificationDrawerOpen)}
            className="relative rounded-lg border border-slate-200 dark:border-slate-800 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications & Automated Workflow Alerts"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Quick Plan Upgrade Button */}
          <button
            id="header-upgrade-plan-btn"
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="hidden sm:flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm hover:from-indigo-500 hover:to-violet-500 transition-all"
            title="Upgrade Workspace Plan"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="capitalize">{state.subscription?.currentPlan || 'Enterprise'}</span>
          </button>

          {/* User Profile Dropdown Menu */}
          <div className="relative pl-1 border-l border-slate-200 dark:border-slate-800">
            <button
              id="user-profile-menu-button"
              type="button"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-1.5 rounded-full p-0.5 hover:ring-2 hover:ring-indigo-500 transition-all"
              title={`${currentUser.name} (${currentUser.department})`}
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-8 w-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
              />
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {userMenuOpen && (
              <div
                id="user-profile-dropdown"
                className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
              >
                {/* User Summary */}
                <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 mb-2">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="h-10 w-10 rounded-full object-cover border border-slate-300 dark:border-slate-700"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {currentUser.name}
                      </p>
                      <span className="rounded bg-indigo-500/10 text-indigo-500 text-[10px] font-bold px-1.5 py-0.2 uppercase">
                        {state.subscription?.currentPlan || 'Enterprise'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {currentUser.email}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {currentUser.department} • {currentUser.jobTitle || 'Team Member'}
                    </p>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setIsCreateAccountOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>+ Create New User Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setCurrentTab('billing');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <CreditCard className="h-4 w-4 text-slate-400" />
                    <span>Plans & Payment Methods</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setIsUpgradeModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span>Upgrade Subscription Plan</span>
                  </button>
                </div>

                {/* Switch Workspace User */}
                <div>
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span>Switch Active Account</span>
                    <span className="text-[10px]">{state.users.length} users</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-0.5 mt-1">
                    {state.users.map((u) => {
                      const isActive = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            switchUser(u.id);
                            setUserMenuOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs transition-colors ${
                            isActive
                              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="h-6 w-6 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                            <div className="text-left min-w-0">
                              <p className="truncate text-xs font-medium">{u.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{u.department}</p>
                            </div>
                          </div>
                          {isActive && <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

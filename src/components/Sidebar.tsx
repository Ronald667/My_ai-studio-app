import React from 'react';
import { useApp, NavTab } from '../context/AppContext';
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  FileText,
  Boxes,
  Cpu,
  ShieldCheck,
  Cloud,
  BarChart3,
  ChevronRight,
  AlertTriangle,
  CreditCard,
  Sparkles,
  UserPlus,
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const {
    t,
    currentTab,
    setCurrentTab,
    state,
    currentUser,
    setIsUpgradeModalOpen,
    setIsCreateAccountOpen,
  } = useApp();

  const lowStockCount = state.inventory.filter((i) => i.status === 'low_stock' || i.status === 'out_of_stock').length;
  const urgentTasksCount = state.tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length;
  const currentPlan = state.subscription?.currentPlan || 'enterprise';
  const seatsUsed = state.subscription?.seatsUsed || state.users.length;
  const seatsAllocated = state.subscription?.seatsAllocated || 100;

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number | string;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: t.navDashboard,
      icon: LayoutDashboard,
    },
    {
      id: 'tasks',
      label: t.navTasks,
      icon: CheckSquare,
      badge: urgentTasksCount > 0 ? urgentTasksCount : undefined,
      badgeColor: 'bg-rose-500/10 text-rose-500 border border-rose-500/20',
    },
    {
      id: 'chat',
      label: t.navChat,
      icon: MessageSquare,
      badge: state.chatMessages.length > 0 ? 'Live' : undefined,
      badgeColor: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    },
    {
      id: 'documents',
      label: t.navDocs,
      icon: FileText,
    },
    {
      id: 'inventory',
      label: t.navInventory,
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} alert` : undefined,
      badgeColor: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    },
    {
      id: 'workflows',
      label: t.navWorkflows,
      icon: Cpu,
    },
    {
      id: 'compliance',
      label: t.navCompliance,
      icon: ShieldCheck,
      badge: 'HIPAA',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    },
    {
      id: 'cloud',
      label: t.navCloud,
      icon: Cloud,
    },
    {
      id: 'analytics',
      label: t.navAnalytics,
      icon: BarChart3,
    },
    {
      id: 'billing',
      label: t.navBilling,
      icon: CreditCard,
      badge: currentPlan.toUpperCase(),
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30',
    },
  ];

  return (
    <aside
      id="desktop-sidebar"
      className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md transition-colors"
    >
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Enterprise Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              type="button"
              onClick={() => setCurrentTab(item.id)}
              className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}
                />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.badgeColor || 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Workspace Plan & Seat Utilization Mini Card */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/50">
        <div className="rounded-xl border border-indigo-200/80 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 p-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              <span className="capitalize">{currentPlan}</span> Tier
            </span>
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(true)}
              className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Upgrade
            </button>
          </div>

          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mb-1">
              <span>Seats: {seatsUsed}/{seatsAllocated}</span>
              <span>{Math.round((seatsUsed / seatsAllocated) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${Math.min(100, (seatsUsed / seatsAllocated) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer User Info & Department */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30">
        <div className="flex items-center justify-between gap-2 px-1 py-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative shrink-0">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-8 w-8 rounded-full object-cover border border-slate-300 dark:border-slate-700"
              />
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {currentUser.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {currentUser.department}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateAccountOpen(true)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Create User Account"
          >
            <UserPlus className="h-3.5 w-3.5 text-indigo-500" />
          </button>
        </div>
      </div>
    </aside>
  );
};

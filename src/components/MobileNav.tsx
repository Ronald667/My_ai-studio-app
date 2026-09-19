import React, { useState } from 'react';
import { useApp, NavTab } from '../context/AppContext';
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  FileText,
  Menu,
  X,
  Boxes,
  Cpu,
  ShieldCheck,
  Cloud,
  BarChart3,
  CreditCard,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { t, currentTab, setCurrentTab } = useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mainItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'tasks', label: t.navTasks, icon: CheckSquare },
    { id: 'chat', label: t.navChat, icon: MessageSquare },
    { id: 'documents', label: t.navDocs, icon: FileText },
  ];

  const extendedItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'inventory', label: t.navInventory, icon: Boxes },
    { id: 'workflows', label: t.navWorkflows, icon: Cpu },
    { id: 'compliance', label: t.navCompliance, icon: ShieldCheck },
    { id: 'cloud', label: t.navCloud, icon: Cloud },
    { id: 'analytics', label: t.navAnalytics, icon: BarChart3 },
    { id: 'billing', label: t.navBilling, icon: CreditCard },
  ];

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="absolute bottom-16 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-2xl p-4 shadow-2xl max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Workspace Modules
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {extendedItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setDrawerOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Fixed Bar */}
      <nav
        id="mobile-bottom-nav"
        className="fixed bottom-0 inset-x-0 z-40 h-16 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-around px-2 md:hidden"
      >
        {mainItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}

        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-lg transition-colors ${
            drawerOpen || extendedItems.some((i) => i.id === currentTab)
              ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] mt-0.5">More</span>
        </button>
      </nav>
    </>
  );
};

import React from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  CheckCheck,
  Bell,
  AlertTriangle,
  Clock,
  Boxes,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const {
    state,
    notificationDrawerOpen,
    setNotificationDrawerOpen,
    markNotificationRead,
    markAllNotificationsRead,
    setCurrentTab,
    pushEnabled,
    setPushEnabled,
  } = useApp();

  if (!notificationDrawerOpen) return null;

  const notifIcons = {
    workflow: <Clock className="h-4 w-4 text-indigo-400" />,
    deadline: <AlertTriangle className="h-4 w-4 text-amber-400" />,
    inventory: <Boxes className="h-4 w-4 text-rose-400" />,
    compliance: <ShieldAlert className="h-4 w-4 text-emerald-400" />,
    mention: <Bell className="h-4 w-4 text-cyan-400" />,
  };

  return (
    <div
      id="notification-drawer-overlay"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex justify-end animate-in fade-in"
      onClick={() => setNotificationDrawerOpen(false)}
    >
      <div
        id="notification-drawer-panel"
        className="w-full max-w-md bg-white dark:bg-slate-900 h-full border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-indigo-500" />
            <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
              Notification & Workflow Center
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={markAllNotificationsRead}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              title="Mark all as read"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Read all</span>
            </button>
            <button
              onClick={() => setNotificationDrawerOpen(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Push Status Banner */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400">
            Browser Push Alerts
          </span>
          <button
            onClick={() => setPushEnabled(!pushEnabled)}
            className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
              pushEnabled
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            {pushEnabled ? 'Enabled (Active)' : 'Disabled (Silent)'}
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {state.notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-slate-400">
              <Bell className="h-8 w-8 opacity-30 mb-2" />
              <p className="text-xs">No notifications in workspace feed.</p>
            </div>
          ) : (
            state.notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  markNotificationRead(notif.id);
                  if (notif.linkTab) {
                    setCurrentTab(notif.linkTab as any);
                    setNotificationDrawerOpen(false);
                  }
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  notif.read
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/60 opacity-80'
                    : 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/60 shadow-xs'
                } hover:border-indigo-400 dark:hover:border-indigo-700`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {notifIcons[notif.type] || <Bell className="h-4 w-4 text-indigo-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {notif.title}
                      </span>
                      {!notif.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/40 text-[10px] text-slate-400">
                      <span>{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {notif.linkTab && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-0.5">
                          Open {notif.linkTab} <ArrowRight className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Cpu,
  Radio,
  Play,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  ShieldAlert,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
  Zap,
} from 'lucide-react';

export const WorkflowsView: React.FC = () => {
  const {
    t,
    state,
    toggleWorkflowRule,
    simulateWorkflowTrigger,
    pushEnabled,
    setPushEnabled,
    askAIAssist,
  } = useApp();

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  const requestBrowserPushPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') {
          setPushEnabled(true);
        }
      } catch (err) {
        console.error('Push permission error:', err);
      }
    }
  };

  const handleSimulate = (ruleId: string, name: string) => {
    simulateWorkflowTrigger(ruleId);
    setSimulationStatus(`Triggered "${name}" — Check notifications and channels.`);
    setTimeout(() => setSimulationStatus(null), 4000);
  };

  const handleAiConsultant = async () => {
    setLoadingAi(true);
    const res = await askAIAssist('workflow_optimization');
    setAiAnalysis(res.recommendation);
    setLoadingAi(false);
  };

  return (
    <div id="workflows-view" className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 dark:text-slate-100">
            {t.workflowAutomation}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Event-driven triggers, real-time push dispatches, and automated channel notifications
          </p>
        </div>

        <button
          onClick={handleAiConsultant}
          disabled={loadingAi}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all self-start sm:self-auto"
        >
          <Sparkles className="h-4 w-4" />
          <span>{loadingAi ? 'Synthesizing...' : 'AI Operations Advisor'}</span>
        </button>
      </div>

      {simulationStatus && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <Zap className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="font-semibold">{simulationStatus}</span>
        </div>
      )}

      {/* AI Operations Advisor Output */}
      {aiAnalysis && (
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span>Agile Workflow Optimization Strategy (Gemini Server-Side)</span>
            </div>
            <button
              onClick={() => setAiAnalysis(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Dismiss
            </button>
          </div>
          <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
            {aiAnalysis}
          </p>
        </div>
      )}

      {/* Push Notification System Integration Card */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Automated Push Notification Engine
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Dispatches web push alerts, desktop banners, and mobile lockscreen updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={requestBrowserPushPermission}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Request Browser Permission
            </button>

            <button
              onClick={() => setPushEnabled(!pushEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                pushEnabled
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              <Bell className="h-3.5 w-3.5" />
              <span>{pushEnabled ? 'Push Enabled' : 'Push Muted'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400">WebSocket Transport</span>
            <p className="font-semibold text-emerald-500 mt-0.5">TLS 1.3 Sub-millisecond</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400">Notification Triggers Logged</span>
            <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
              {state.notifications.length} alerts in workspace feed
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
            <span className="text-slate-400">Cross-Platform Sync</span>
            <p className="font-semibold text-indigo-500 mt-0.5">BroadcastChannel + WSS Active</p>
          </div>
        </div>
      </div>

      {/* Active Rules Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Automated Trigger Rules ({state.workflows.length})
          </h2>
          <span className="text-xs text-slate-400">
            Click "Simulate Event" to test instant push notification delivery
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.workflows.map((rule) => {
            const triggerIcons: Record<string, React.ReactNode> = {
              inventory_low_stock: <Boxes className="h-4 w-4 text-amber-500" />,
              task_status_change: <Clock className="h-4 w-4 text-indigo-500" />,
              phi_data_access: <ShieldAlert className="h-4 w-4 text-rose-500" />,
              approaching_deadline: <AlertTriangle className="h-4 w-4 text-rose-500" />,
              compliance_audit: <CheckCircle2 className="h-4 w-4 text-cyan-500" />,
            };

            return (
              <div
                key={rule.id}
                className={`p-4 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                  rule.active
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                    : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800/40 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                        {triggerIcons[rule.trigger] || <Cpu className="h-4 w-4 text-indigo-500" />}
                      </div>
                      <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {rule.name}
                      </span>
                    </div>

                    <button
                      onClick={() => toggleWorkflowRule(rule.id)}
                      className="text-slate-400 hover:text-indigo-500 transition-colors"
                      title={rule.active ? 'Deactivate rule' : 'Activate rule'}
                    >
                      {rule.active ? (
                        <ToggleRight className="h-6 w-6 text-indigo-600" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-3 leading-relaxed">
                    {rule.conditionDescription}
                  </p>

                  <div className="space-y-1.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/60 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Trigger Event:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">
                        {rule.trigger}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Channel:</span>
                      <span className="font-mono text-indigo-500">
                        #{rule.targetChannelId || 'general'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Times Executed:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {rule.triggerCount} runs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400">
                    Last:{' '}
                    {rule.lastTriggered
                      ? new Date(rule.lastTriggered).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Pending'}
                  </span>

                  <button
                    onClick={() => handleSimulate(rule.id, rule.name)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] border border-indigo-200 dark:border-indigo-800"
                  >
                    <Play className="h-3 w-3" />
                    <span>Simulate Event</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

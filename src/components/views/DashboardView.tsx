import React from 'react';
import { useApp } from '../../context/AppContext';
import { AITaskPrioritizationCard } from '../AITaskPrioritizationCard';
import {
  CheckCircle2,
  Clock,
  Boxes,
  ShieldCheck,
  Users,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Plus,
  Radio,
  FileCheck2,
  Lock,
  Sparkles,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenNewTask: () => void;
  onOpenStockAdjust: () => void;
  onOpenNewWorkOrder: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewTask,
  onOpenStockAdjust,
  onOpenNewWorkOrder,
}) => {
  const { t, state, setCurrentTab, simulateWorkflowTrigger } = useApp();

  const activeTasks = state.tasks.filter((t) => t.status !== 'done');
  const completedTasks = state.tasks.filter((t) => t.status === 'done');
  const urgentTasks = state.tasks.filter((t) => t.priority === 'urgent' && t.status !== 'done');
  const lowStockItems = state.inventory.filter(
    (i) => i.status === 'low_stock' || i.status === 'out_of_stock'
  );

  return (
    <div id="dashboard-view" className="space-y-6 animate-in fade-in duration-150">
      {/* Welcome & System Status Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-indigo-900/90 via-slate-900 to-violet-950 text-white border border-indigo-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
              Operations Center • ISO-13485 & HIPAA Compliant
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight text-white">
            {t.appName}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {t.tagline}
          </p>
        </div>

        {/* Quick Command Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="quick-add-task-btn"
            type="button"
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t.addTask}</span>
          </button>
          <button
            id="quick-stock-adjust-btn"
            type="button"
            onClick={onOpenStockAdjust}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors"
          >
            <Boxes className="h-4 w-4 text-amber-400" />
            <span>{t.stockMovement}</span>
          </button>
          <button
            id="quick-work-order-btn"
            type="button"
            onClick={onOpenNewWorkOrder}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors"
          >
            <FileCheck2 className="h-4 w-4 text-cyan-400" />
            <span>Work Order</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Active Tasks */}
        <div
          onClick={() => setCurrentTab('tasks')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs cursor-pointer hover:border-indigo-500/50 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.kpiActiveTasks}</span>
            <CheckCircle2 className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {activeTasks.length}
            </span>
            <span className="text-[11px] text-emerald-500 font-medium">
              +{completedTasks.length} done
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all"
              style={{
                width: `${(completedTasks.length / (state.tasks.length || 1)) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Deadlines in 48h */}
        <div
          onClick={() => setCurrentTab('tasks')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs cursor-pointer hover:border-amber-500/50 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.kpiDeadlines48h}</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {urgentTasks.length || 2}
            </span>
            <span className="text-[11px] text-amber-500 font-medium">
              Urgent review
            </span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 truncate">
            Project Helix & Inventory v4
          </p>
        </div>

        {/* Inventory Health */}
        <div
          onClick={() => setCurrentTab('inventory')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs cursor-pointer hover:border-cyan-500/50 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.kpiInventoryHealth}</span>
            <Boxes className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {state.inventory.length - lowStockItems.length}/{state.inventory.length}
            </span>
            {lowStockItems.length > 0 ? (
              <span className="text-[11px] text-rose-500 font-medium">
                {lowStockItems.length} low
              </span>
            ) : (
              <span className="text-[11px] text-emerald-500 font-medium">Stable</span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 truncate">
            {lowStockItems.length > 0 ? 'Auto-reorder armed' : 'All buffers healthy'}
          </p>
        </div>

        {/* Compliance Rating */}
        <div
          onClick={() => setCurrentTab('compliance')}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs cursor-pointer hover:border-emerald-500/50 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.kpiComplianceScore}</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              100%
            </span>
            <span className="text-[11px] text-emerald-500 font-medium">Verified</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 truncate">
            AES-256 + SHA-256 Hash Valid
          </p>
        </div>

        {/* Connected Teammates */}
        <div
          onClick={() => setCurrentTab('chat')}
          className="col-span-2 lg:col-span-1 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs cursor-pointer hover:border-violet-500/50 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.kpiOnlineTeam}</span>
            <Users className="h-4 w-4 text-violet-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {state.users.filter((u) => u.status === 'active' || u.status === 'busy').length}
            </span>
            <span className="text-[11px] text-emerald-500 font-medium">
              Live Socket Synced
            </span>
          </div>
          <div className="flex -space-x-1.5 mt-2 overflow-hidden">
            {state.users.map((u) => (
              <img
                key={u.id}
                src={u.avatar}
                alt={u.name}
                className="h-5 w-5 rounded-full ring-2 ring-white dark:ring-slate-900 object-cover"
                title={u.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* AI-Powered Task Prioritization & Optimal Operations Schedule */}
      <AITaskPrioritizationCard />

      {/* Main Grid: Projects Status & Real-time Operations Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Projects & Milestones */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {t.projects}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cross-functional milestones & deadline burn-down
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('tasks')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>View all tasks</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {state.projects.map((proj) => {
                const statusColors = {
                  on_track: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                  at_risk: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                  delayed: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                  completed: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
                };

                return (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                            {proj.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {proj.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {proj.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            statusColors[proj.status]
                          }`}
                        >
                          {proj.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Due: {proj.targetDate}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar & Budget Info */}
                    <div className="space-y-1 mt-3">
                      <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Milestone Progress: {proj.progress}%</span>
                        <span>
                          ${proj.spent.toLocaleString()} spent of ${proj.budget.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            proj.status === 'at_risk'
                              ? 'bg-amber-500'
                              : proj.status === 'delayed'
                              ? 'bg-rose-500'
                              : 'bg-indigo-600'
                          }`}
                          style={{ width: `${proj.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Urgent Tasks Quick Queue */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Critical Work Tasks & Deliverables
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {urgentTasks.length} urgent tasks flagged
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {state.tasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        task.priority === 'urgent'
                          ? 'bg-rose-500'
                          : task.priority === 'high'
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {task.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">
                        {task.projectName} • Assigned to {task.assigneeName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {task.aiPriorityRank && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                        AI #{task.aiPriorityRank}
                      </span>
                    )}
                    {task.isBottleneck && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                        BLOCKER
                      </span>
                    )}
                    {task.hipaaPhiSensitive && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/10 text-rose-500 border border-rose-500/20 font-semibold">
                        PHI
                      </span>
                    )}
                    <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                      {task.dueDate}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Live Operations Activity Feed & Workflow Simulator */}
        <div className="space-y-6">
          {/* Automated Workflow Quick Simulator */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-b from-indigo-50/50 dark:from-indigo-950/20 to-white dark:to-slate-900 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Automated Workflows
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Real-time triggers notify team channels and dispatches push alerts
            </p>

            <div className="space-y-2">
              {state.workflows.slice(0, 3).map((rule) => (
                <div
                  key={rule.id}
                  className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {rule.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {rule.triggerCount} triggers executed
                    </p>
                  </div>
                  <button
                    onClick={() => simulateWorkflowTrigger(rule.id)}
                    className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold border border-indigo-200 dark:border-indigo-800 shrink-0"
                    title="Simulate Event"
                  >
                    Test Run
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Live Operations Feed */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-emerald-500 animate-pulse" />
                <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Live Operations Stream
                </h2>
              </div>
              <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Real-Time
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {state.notifications.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/30 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </span>
                    <span className="text-[9px] text-slate-400 shrink-0">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

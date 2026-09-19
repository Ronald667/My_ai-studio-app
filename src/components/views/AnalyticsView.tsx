import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Boxes,
  ShieldCheck,
  Printer,
  PieChart,
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { t, state } = useApp();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'q3' | 'ytd'>('30d');

  const totalTasks = state.tasks.length || 1;
  const completedTasks = state.tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = state.tasks.filter((t) => t.status === 'in_progress').length;
  const reviewTasks = state.tasks.filter((t) => t.status === 'review').length;
  const todoTasks = state.tasks.filter((t) => t.status === 'todo').length;
  const backlogTasks = state.tasks.filter((t) => t.status === 'backlog').length;

  const urgentTasks = state.tasks.filter((t) => t.priority === 'urgent').length;
  const highTasks = state.tasks.filter((t) => t.priority === 'high').length;
  const mediumTasks = state.tasks.filter((t) => t.priority === 'medium').length;
  const lowTasks = state.tasks.filter((t) => t.priority === 'low').length;

  const completionRate = Math.round((completedTasks / totalTasks) * 100);

  const totalBudget = state.projects.reduce((acc, p) => acc + p.budget, 0);
  const totalSpent = state.projects.reduce((acc, p) => acc + p.spent, 0);
  const budgetUtilization = Math.round((totalSpent / (totalBudget || 1)) * 100);

  const totalInventoryValuation = state.inventory.reduce(
    (acc, i) => acc + i.quantity * i.unitCost,
    0
  );

  return (
    <div id="analytics-view" className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 dark:text-slate-100">
            {t.analyticsAndReports}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cross-department throughput, milestone velocities, and operational compliance metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time Range Selector */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 text-xs">
            {(['7d', '30d', 'q3', 'ytd'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-2.5 py-1 rounded-md font-medium uppercase transition-colors ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-xs"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Top Level Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Sprint Velocity Completion</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {completionRate}%
          </p>
          <span className="text-[10px] text-emerald-500 font-semibold">
            {completedTasks} of {totalTasks} deliverables done
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Budget Burn-Down</span>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {budgetUtilization}%
          </p>
          <span className="text-[10px] text-slate-500">
            ${totalSpent.toLocaleString()} of ${totalBudget.toLocaleString()}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Inventory Asset Capital</span>
            <Boxes className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            ${(totalInventoryValuation / 1000).toFixed(1)}k
          </p>
          <span className="text-[10px] text-slate-500">All warehouse bin locations</span>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-medium">Regulatory Audit Score</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            100%
          </p>
          <span className="text-[10px] text-emerald-500 font-semibold">
            Zero Non-Conformances
          </span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Workflow Stage Distribution */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Tasks by Operational Stage
              </h2>
              <p className="text-xs text-slate-500">Current work item volume across workflow</p>
            </div>
            <span className="text-xs font-mono font-semibold text-indigo-500">
              {totalTasks} total
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Backlog', count: backlogTasks, color: 'bg-slate-400' },
              { label: 'To Do', count: todoTasks, color: 'bg-indigo-500' },
              { label: 'In Progress', count: inProgressTasks, color: 'bg-cyan-500' },
              { label: 'Under Review', count: reviewTasks, color: 'bg-amber-500' },
              { label: 'Done / Released', count: completedTasks, color: 'bg-emerald-500' },
            ].map((stage) => {
              const pct = Math.round((stage.count / totalTasks) * 100);
              return (
                <div key={stage.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {stage.label}
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {stage.count} tasks ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stage.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Severity Breakdown */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Task Priority Severity
              </h2>
              <p className="text-xs text-slate-500">Urgency allocation for operations sprint</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Urgent (Within 48h)', count: urgentTasks, color: 'bg-rose-500' },
              { label: 'High Priority', count: highTasks, color: 'bg-amber-500' },
              { label: 'Medium Priority', count: mediumTasks, color: 'bg-indigo-500' },
              { label: 'Low Priority', count: lowTasks, color: 'bg-slate-400' },
            ].map((prio) => {
              const pct = Math.round((prio.count / totalTasks) * 100);
              return (
                <div key={prio.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {prio.label}
                    </span>
                    <span className="font-mono text-slate-500 text-[11px]">
                      {prio.count} tasks ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${prio.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Projects Budget Utilization Bar Breakdown */}
      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
          Program Budget & Resource Allocation
        </h2>

        <div className="space-y-3">
          {state.projects.map((p) => {
            const pct = Math.round((p.spent / p.budget) * 100);
            return (
              <div
                key={p.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 space-y-1.5"
              >
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {p.name} ({p.code})
                  </span>
                  <span className="font-mono text-slate-500 text-[11px]">
                    ${p.spent.toLocaleString()} / ${p.budget.toLocaleString()} ({pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      pct > 90 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

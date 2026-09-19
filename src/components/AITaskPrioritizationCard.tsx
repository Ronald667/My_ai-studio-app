import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { exampleTaskScenarios } from '../initialData';
import {
  Sparkles,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Layers,
  ChevronDown,
  ShieldCheck,
  Check,
  Play,
  RotateCcw,
} from 'lucide-react';

export const AITaskPrioritizationCard: React.FC = () => {
  const {
    state,
    aiPrioritization,
    isPrioritizing,
    prioritizeTasks,
    loadExampleScenario,
    selectedScenarioId,
    updateTask,
    setCurrentTab,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<'all' | 'blockers' | 'ready' | 'urgent'>('all');
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  // Map task IDs for fast lookup
  const taskMap = new Map(state.tasks.map((t) => [t.id, t]));

  // Build list of prioritized items merged with full task objects
  const orderedItems = (aiPrioritization?.optimalOrder || [])
    .map((item) => {
      const task = taskMap.get(item.taskId);
      return {
        ...item,
        task,
      };
    })
    .filter((item) => item.task && item.task.status !== 'done');

  // Filter based on selected tab
  const filteredItems = orderedItems.filter((item) => {
    if (!item.task) return false;
    if (activeFilter === 'blockers') return item.unblocksCount > 0 && !item.isBlocked;
    if (activeFilter === 'ready') return !item.isBlocked;
    if (activeFilter === 'urgent') return item.urgencyTier === 'critical' || item.urgencyTier === 'high';
    return true;
  });

  const handleQuickStatus = (taskId: string, currentStatus: string) => {
    setCompletingTaskId(taskId);
    setTimeout(() => {
      const nextStatus = currentStatus === 'in_progress' ? 'done' : 'in_progress';
      updateTask({ id: taskId, status: nextStatus as any });
      setCompletingTaskId(null);
    }, 250);
  };

  const getRankBadgeStyle = (rank: number) => {
    if (rank === 1) {
      return 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-xs shadow-rose-500/20';
    }
    if (rank === 2) {
      return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs shadow-amber-500/20';
    }
    if (rank === 3) {
      return 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white';
    }
    return 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
  };

  const getUrgencyBadge = (tier: string) => {
    switch (tier) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            HIGH URGENCY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            SCHEDULED
          </span>
        );
    }
  };

  return (
    <div
      id="ai-task-prioritization-card"
      className="p-5 sm:p-6 rounded-2xl border border-indigo-200/70 dark:border-indigo-900/50 bg-gradient-to-b from-white via-slate-50/40 to-white dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950 shadow-md relative overflow-hidden"
    >
      {/* Decorative ambient background accent */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title, Model Badge and Action Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="h-3 w-3 text-indigo-500 animate-spin-slow" />
              <span>AI Operations Scheduler</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {aiPrioritization?.source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Rule Engine Engine'}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>Optimal Order of Operations</span>
            {aiPrioritization?.criticalBlockersCount ? (
              <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {aiPrioritization.criticalBlockersCount} Critical Path Blockers
              </span>
            ) : null}
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-2xl">
            Analyzes task deadlines, dependency chains, and user priorities to eliminate bottlenecks and guide team execution.
          </p>
        </div>

        {/* Action Buttons: Run AI Prioritization & Load Example Scenarios */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Example Scenarios Switcher */}
          <div className="relative">
            <button
              id="load-example-scenarios-btn"
              type="button"
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-xs transition-colors"
            >
              <Layers className="h-3.5 w-3.5 text-indigo-500" />
              <span>Example Scenarios</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showScenarioMenu && (
              <div className="absolute right-0 mt-1.5 w-72 sm:w-80 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-30 p-2 space-y-1 animate-in fade-in zoom-in-95">
                <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Example Workstream
                </div>
                {exampleTaskScenarios.map((scen) => (
                  <button
                    key={scen.id}
                    onClick={() => {
                      loadExampleScenario(scen.id);
                      setShowScenarioMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex flex-col gap-0.5 ${
                      selectedScenarioId === scen.id
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 font-medium'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{scen.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        {scen.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {scen.description}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Run Prioritization Trigger */}
          <button
            id="run-ai-prioritize-btn"
            type="button"
            onClick={prioritizeTasks}
            disabled={isPrioritizing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60 active:scale-95"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isPrioritizing ? 'animate-spin' : ''}`} />
            <span>{isPrioritizing ? 'Optimizing Graph...' : 'Re-Analyze with AI'}</span>
          </button>
        </div>
      </div>

      {/* AI Executive Summary & Bottleneck Callout */}
      {aiPrioritization?.executiveSummary && (
        <div className="mt-4 p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-3 text-xs">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
            <Zap className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white">
                Executive Schedule Recommendation
              </span>
              <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                Live Dependency Sync
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              {aiPrioritization.executiveSummary}
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between mt-4 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            All Recommended ({orderedItems.length})
          </button>
          <button
            onClick={() => setActiveFilter('blockers')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              activeFilter === 'blockers'
                ? 'bg-amber-600 text-white'
                : 'text-slate-500 hover:text-amber-600 dark:hover:text-amber-400'
            }`}
          >
            <span>Critical Path Blockers</span>
            <span className="text-[10px] px-1 rounded bg-amber-500/20">
              {orderedItems.filter((i) => i.unblocksCount > 0 && !i.isBlocked).length}
            </span>
          </button>
          <button
            onClick={() => setActiveFilter('ready')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeFilter === 'ready'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            Ready to Execute ({orderedItems.filter((i) => !i.isBlocked).length})
          </button>
          <button
            onClick={() => setActiveFilter('urgent')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeFilter === 'urgent'
                ? 'bg-rose-600 text-white'
                : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
            }`}
          >
            Urgent Deadlines
          </button>
        </div>

        <button
          onClick={() => setCurrentTab('tasks')}
          className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-0.5 shrink-0"
        >
          <span>Open Tasks Board</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Ordered Task Operations List */}
      <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800/80">
        {filteredItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No tasks match the active filter.
          </div>
        ) : (
          filteredItems.map((item) => {
            const task = item.task!;
            const isTopAction = item.rank === 1;

            return (
              <div
                key={task.id}
                className={`py-3.5 px-3 rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                  isTopAction
                    ? 'bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 my-1'
                    : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                }`}
              >
                {/* Left Side: Rank, Title, Reasons and Dependency Indicators */}
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {/* Sequence Rank Badge */}
                  <div
                    className={`flex flex-col items-center justify-center h-11 w-11 rounded-xl shrink-0 font-display ${getRankBadgeStyle(
                      item.rank
                    )}`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {item.rank === 1 ? 'Next' : `#${item.rank}`}
                    </span>
                    <span className="text-xs font-extrabold">{item.priorityScore}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    {/* Title + Badges Header */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                        {task.title}
                      </span>
                      {getUrgencyBadge(item.urgencyTier)}
                      {task.hipaaPhiSensitive && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                          HIPAA PHI
                        </span>
                      )}
                    </div>

                    {/* AI Suggested Rationale */}
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        AI Rationale:
                      </span>
                      <span>{item.reason}</span>
                    </p>

                    {/* Dependency Chain Context */}
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px]">
                      {item.unblocksCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <Zap className="h-3 w-3" />
                          <span>Unblocks {item.unblocksCount} downstream workstream{item.unblocksCount > 1 ? 's' : ''}</span>
                        </span>
                      )}

                      {item.isBlocked ? (
                        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium bg-amber-500/10 px-1.5 py-0.5 rounded">
                          <Clock className="h-3 w-3" />
                          <span>Waiting on: {item.blockingTaskTitles?.[0] || 'Prerequisite'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Prerequisites clear</span>
                        </span>
                      )}

                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {task.projectName}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Deadline, Assignee and Quick Operator Action */}
                <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  {/* Deadline indicator */}
                  <div className="text-left md:text-right">
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{task.dueDate}</span>
                    </div>
                    <span className="text-[9px] text-slate-400">
                      Est. {task.estimatedHours}h ({task.loggedHours}h logged)
                    </span>
                  </div>

                  {/* Assignee pill */}
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <img
                      src={task.assigneeAvatar}
                      alt={task.assigneeName}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                    <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300 truncate max-w-[100px]">
                      {task.assigneeName.split(' ')[0]}
                    </span>
                  </div>

                  {/* Quick Action Button */}
                  <button
                    type="button"
                    onClick={() => handleQuickStatus(task.id, task.status)}
                    disabled={completingTaskId === task.id}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      task.status === 'in_progress'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs'
                        : 'bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    }`}
                  >
                    {task.status === 'in_progress' ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Complete</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3" />
                        <span>Start</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

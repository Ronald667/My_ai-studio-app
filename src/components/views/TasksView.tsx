import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Task, TaskPriority, TaskStatus } from '../../types';
import {
  Plus,
  Search,
  Filter,
  Kanban,
  List,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  ShieldAlert,
  ArrowRight,
  ChevronDown,
  User,
  Trash2,
  CheckSquare,
  Sparkles,
  Zap,
  BarChart2,
} from 'lucide-react';
import { AITaskPrioritizationCard } from '../AITaskPrioritizationCard';
import { GanttChart } from '../GanttChart';

interface TasksViewProps {
  onOpenNewTask: () => void;
}

export const TasksView: React.FC<TasksViewProps> = ({ onOpenNewTask }) => {
  const { t, state, updateTask, deleteTask, currentUser, hasPermission } = useApp();

  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'gantt' | 'timeline' | 'ai_prioritized'>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');

  const filteredTasks = state.tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assigneeName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = selectedProject === 'all' || task.projectId === selectedProject;
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    return matchesSearch && matchesProject && matchesPriority;
  });

  const columns: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'backlog', label: t.statusBacklog, color: 'border-t-slate-400' },
    { id: 'todo', label: t.statusTodo, color: 'border-t-indigo-500' },
    { id: 'in_progress', label: t.statusInProgress, color: 'border-t-cyan-500' },
    { id: 'review', label: t.statusReview, color: 'border-t-amber-500' },
    { id: 'done', label: t.statusDone, color: 'border-t-emerald-500' },
  ];

  const priorityBadge = (priority: TaskPriority) => {
    const map = {
      urgent: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
      high: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      medium: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${map[priority]}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, urgent: true };
    if (diffDays === 0) return { label: 'Due today', urgent: true };
    if (diffDays <= 2) return { label: `${diffDays}d left`, urgent: true };
    return { label: `${diffDays}d left`, urgent: false };
  };

  return (
    <div id="tasks-view" className="space-y-5 animate-in fade-in duration-150">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-900 dark:text-slate-100">
            {t.navTasks} & Deadlines
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cross-platform task tracking with automated workflow status synchronization
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 text-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Kanban className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List</span>
            </button>
            <button
              id="tasks-gantt-view-btn"
              onClick={() => setViewMode('gantt')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'gantt'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5 rotate-90" />
              <span>Gantt Chart</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Milestones</span>
            </button>
            <button
              id="tasks-ai-prioritized-tab-btn"
              onClick={() => setViewMode('ai_prioritized')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors ${
                viewMode === 'ai_prioritized'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-semibold'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
              <span>AI Operations Order</span>
            </button>
          </div>

          {/* Add Task Button */}
          <button
            id="open-new-task-modal-btn"
            onClick={onOpenNewTask}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t.addTask}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Project Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Project:</span>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Projects</option>
            {state.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Selector */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Priority:</span>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {columns.map((col) => {
            const tasksInCol = filteredTasks.filter((t) => t.status === col.id);
            return (
              <div
                key={col.id}
                className="flex flex-col rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 min-w-[260px] max-h-[750px]"
              >
                {/* Column Header */}
                <div
                  className={`p-3 border-t-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-t-xl flex items-center justify-between ${col.color}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                      {col.label}
                    </span>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-600 dark:text-slate-400">
                      {tasksInCol.length}
                    </span>
                  </div>
                </div>

                {/* Task Cards in Column */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2.5">
                  {tasksInCol.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Empty stage
                    </div>
                  ) : (
                    tasksInCol.map((task) => {
                      const countdown = getDaysRemaining(task.dueDate);
                      return (
                        <div
                          key={task.id}
                          className="group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-xs"
                        >
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide truncate">
                                {task.projectName}
                              </span>
                              {task.aiPriorityRank && task.status !== 'done' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                  AI #{task.aiPriorityRank}
                                </span>
                              )}
                              {task.isBottleneck && task.status !== 'done' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  BLOCKER
                                </span>
                              )}
                            </div>
                            {priorityBadge(task.priority)}
                          </div>

                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 mb-1.5 leading-snug">
                            {task.title}
                          </h3>

                          {task.description && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                              {task.description}
                            </p>
                          )}

                          {/* PHI Sensitive Tag */}
                          {task.hipaaPhiSensitive && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] font-bold mb-2">
                              <ShieldAlert className="h-3 w-3" />
                              <span>HIPAA PHI SECURE</span>
                            </div>
                          )}

                          {/* AI Suggested Rationale */}
                          {task.aiSuggestedOrderReason && task.status !== 'done' && (
                            <div className="mb-2 p-1.5 rounded bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 text-[10px] text-slate-600 dark:text-slate-300">
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">AI Order: </span>
                              <span>{task.aiSuggestedOrderReason}</span>
                            </div>
                          )}

                          {/* Prerequisites and Downstream Unblockers */}
                          {task.dependencies && task.dependencies.length > 0 && task.status !== 'done' && (
                            <div className="mb-2 text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span className="truncate">
                                Prereq: {task.dependencies.map((d) => state.tasks.find((st) => st.id === d)?.title || d).join(', ')}
                              </span>
                            </div>
                          )}

                          {/* Subtasks Progress */}
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="mb-2 text-[10px] text-slate-500 flex items-center gap-1.5">
                              <CheckSquare className="h-3 w-3 text-slate-400" />
                              <span>
                                {task.subtasks.filter((s) => s.completed).length}/
                                {task.subtasks.length} subtasks
                              </span>
                            </div>
                          )}

                          {/* Footer Info: Assignee & Deadline */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <img
                                src={task.assigneeAvatar}
                                alt={task.assigneeName}
                                className="h-5 w-5 rounded-full object-cover"
                                title={task.assigneeName}
                              />
                              <span className="text-slate-600 dark:text-slate-300 truncate max-w-[80px]">
                                {task.assigneeName.split(' ')[0]}
                              </span>
                            </div>

                            <span
                              className={`font-mono text-[10px] flex items-center gap-1 ${
                                countdown.urgent
                                  ? 'text-rose-500 font-semibold'
                                  : 'text-slate-400'
                              }`}
                            >
                              <Clock className="h-3 w-3" />
                              <span>{countdown.label}</span>
                            </span>
                          </div>

                          {/* Quick Status Shift Bar */}
                          <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                            <span className="text-slate-400">Move to:</span>
                            <div className="flex items-center gap-1">
                              {columns
                                .filter((c) => c.id !== task.status)
                                .slice(0, 2)
                                .map((c) => (
                                  <button
                                    key={c.id}
                                    onClick={() => updateTask({ id: task.id, status: c.id })}
                                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 font-medium"
                                  >
                                    {c.label.split(' ')[0]}
                                  </button>
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: LIST / TABLE VIEW */}
      {viewMode === 'list' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Task Name</th>
                <th className="py-3 px-3">Project</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">AI Optimal Order</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Assignee</th>
                <th className="py-3 px-3">Deadline</th>
                <th className="py-3 px-3 text-right">Hours Logged</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTasks.map((task) => {
                const countdown = getDaysRemaining(task.dueDate);
                return (
                  <tr key={task.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 max-w-xs">
                      <div className="flex items-center gap-2">
                        {task.hipaaPhiSensitive && (
                          <span className="p-0.5 rounded bg-rose-500/10 text-rose-500 font-bold text-[9px]">
                            PHI
                          </span>
                        )}
                        <span className="truncate">{task.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                      {task.projectName}
                    </td>
                    <td className="py-3 px-3">{priorityBadge(task.priority)}</td>
                    <td className="py-3 px-3">
                      {task.status !== 'done' && task.aiPriorityRank ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                            #{task.aiPriorityRank} ({task.aiPriorityScore} pts)
                          </span>
                          {task.isBottleneck && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              Blocker
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <select
                        value={task.status}
                        onChange={(e) =>
                          updateTask({ id: task.id, status: e.target.value as TaskStatus })
                        }
                        className="rounded border border-slate-200 dark:border-slate-700 bg-transparent px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                      >
                        <option value="backlog">Backlog</option>
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="review">Review</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={task.assigneeAvatar}
                          alt={task.assigneeName}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                        <span className="text-slate-700 dark:text-slate-300">
                          {task.assigneeName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-mono ${
                          countdown.urgent ? 'text-rose-500 font-semibold' : 'text-slate-500'
                        }`}
                      >
                        {task.dueDate} ({countdown.label})
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                      {task.loggedHours}h / {task.estimatedHours}h
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW: GANTT CHART */}
      {viewMode === 'gantt' && (
        <div className="space-y-4">
          <GanttChart />
        </div>
      )}

      {/* VIEW 4: AI OPERATIONS ORDER */}
      {viewMode === 'ai_prioritized' && (
        <div className="space-y-4">
          <AITaskPrioritizationCard />
        </div>
      )}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50">
            <div className="flex items-center gap-2 text-xs">
              <BarChart2 className="h-4 w-4 text-indigo-600 dark:text-indigo-400 rotate-90" />
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                Looking for task dependencies, critical paths, and schedule overlap radar?
              </span>
            </div>
            <button
              onClick={() => setViewMode('gantt')}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              Open Gantt Chart
            </button>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <h2 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-1">
              Project Milestone Timeline & Deadline Matrix
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Real-time countdown tracking across multi-quarter milestones
            </p>

            <div className="space-y-4">
              {state.projects.map((proj) => {
                const projTasks = state.tasks.filter((t) => t.projectId === proj.id);
                return (
                  <div
                    key={proj.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                            {proj.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                            Deadline: {proj.targetDate}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {proj.description}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {proj.progress}% Complete
                      </span>
                    </div>

                    {/* Timeline Task Blocks */}
                    <div className="space-y-2 mt-3 pl-2 border-l-2 border-indigo-500/30">
                      {projTasks.map((t) => {
                        const days = getDaysRemaining(t.dueDate);
                        return (
                          <div
                            key={t.id}
                            className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  t.status === 'done'
                                    ? 'bg-emerald-500'
                                    : days.urgent
                                    ? 'bg-rose-500'
                                    : 'bg-indigo-500'
                                }`}
                              />
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {t.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-slate-400">
                                Assignee: {t.assigneeName}
                              </span>
                              <span
                                className={`text-[10px] font-mono font-semibold ${
                                  days.urgent ? 'text-rose-500' : 'text-slate-500'
                                }`}
                              >
                                {days.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

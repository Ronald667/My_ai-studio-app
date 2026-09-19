import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Task, TaskPriority, TaskStatus } from '../types';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Filter,
  ArrowRight,
  Search,
  Users,
  Zap,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Check,
  Play,
  X,
  ExternalLink,
} from 'lucide-react';

interface GanttTaskItem {
  task: Task;
  startDate: Date;
  dueDate: Date;
  startDayOffset: number;
  durationDays: number;
  progressPercent: number;
  isOverdue: boolean;
  isUrgent: boolean;
  hasOverlaps: boolean;
  overlapCount: number;
  overlappingTaskIds: string[];
  prerequisiteTasks: Task[];
  dependentTasks: Task[];
}

export const GanttChart: React.FC = () => {
  const { state, updateTask, setCurrentTab } = useApp();

  // Controls state
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [timeScale, setTimeScale] = useState<'days' | 'weeks'>('days');
  const [showDependencies, setShowDependencies] = useState<boolean>(true);
  const [showOnlyCriticalPath, setShowOnlyCriticalPath] = useState<boolean>(false);
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [collapsedProjects, setCollapsedProjects] = useState<Record<string, boolean>>({});

  const containerRef = useRef<HTMLDivElement>(null);

  // Reference "Today" as 2026-09-18
  const today = useMemo(() => {
    const d = new Date('2026-09-18T00:00:00Z');
    return d;
  }, []);

  // Compute overall timeline bounds across all tasks and projects
  const { timelineStart, timelineEnd, totalDays, datesList } = useMemo(() => {
    // Start window on Sep 10, 2026 to Oct 02, 2026 for a crisp 23-day sprint window
    const start = new Date('2026-09-10T00:00:00Z');
    const end = new Date('2026-10-02T00:00:00Z');

    const days: Date[] = [];
    const curr = new Date(start);
    while (curr <= end) {
      days.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return {
      timelineStart: start,
      timelineEnd: end,
      totalDays: diff,
      datesList: days,
    };
  }, []);

  // Quick map for fast lookup
  const taskMap = useMemo(() => {
    return new Map(state.tasks.map((t) => [t.id, t]));
  }, [state.tasks]);

  // Dependent children map (which tasks does task X unblock?)
  const dependentsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    state.tasks.forEach((t) => {
      (t.dependencies || []).forEach((depId) => {
        const list = map.get(depId) || [];
        list.push(t.id);
        map.set(depId, list);
      });
    });
    return map;
  }, [state.tasks]);

  // Compute Gantt task details (start date, duration, progress, overlaps)
  const ganttTasks: GanttTaskItem[] = useMemo(() => {
    return state.tasks.map((task) => {
      const due = new Date(task.dueDate + 'T23:59:59Z');

      // Compute calculated start date:
      // If task has dependencies, its start date begins after the latest prerequisite due date
      let start: Date;
      const prereqs = (task.dependencies || [])
        .map((id) => taskMap.get(id))
        .filter(Boolean) as Task[];

      if (prereqs.length > 0) {
        const latestPrereqDue = prereqs.reduce((latest, p) => {
          const pDue = new Date(p.dueDate + 'T00:00:00Z');
          return pDue > latest ? pDue : latest;
        }, new Date(0));
        start = latestPrereqDue;
      } else {
        // Estimate start date based on createdAt or duration prior to dueDate
        const created = new Date(task.createdAt);
        const estDays = Math.max(2, Math.round(task.estimatedHours / 4));
        const estimatedStart = new Date(due);
        estimatedStart.setDate(estimatedStart.getDate() - estDays);

        start = created > timelineStart && created < due ? created : estimatedStart;
      }

      // Clamp start to not exceed due date
      if (start >= due) {
        start = new Date(due);
        start.setDate(start.getDate() - 2);
      }

      const startOffsetDays = Math.max(
        0,
        Math.floor((start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
      );
      const endOffsetDays = Math.min(
        totalDays - 1,
        Math.floor((due.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24))
      );
      const durationDays = Math.max(1, endOffsetDays - startOffsetDays + 1);

      // Calculate progress percent
      let progressPercent = 0;
      if (task.status === 'done') {
        progressPercent = 100;
      } else if (task.subtasks && task.subtasks.length > 0) {
        const comp = task.subtasks.filter((s) => s.completed).length;
        progressPercent = Math.round((comp / task.subtasks.length) * 100);
      } else {
        const statusMap: Record<TaskStatus, number> = {
          backlog: 5,
          todo: 15,
          in_progress: 55,
          review: 85,
          done: 100,
        };
        progressPercent = statusMap[task.status] || 0;
      }

      const isOverdue = due < today && task.status !== 'done';
      const isUrgent =
        task.priority === 'urgent' ||
        (due.getTime() - today.getTime() <= 2 * 24 * 60 * 60 * 1000 && task.status !== 'done');

      const dependentIds = dependentsMap.get(task.id) || [];
      const dependentTasks = dependentIds.map((id) => taskMap.get(id)).filter(Boolean) as Task[];

      return {
        task,
        startDate: start,
        dueDate: due,
        startDayOffset: startOffsetDays,
        durationDays,
        progressPercent,
        isOverdue,
        isUrgent,
        hasOverlaps: false, // will compute below
        overlapCount: 0,
        overlappingTaskIds: [],
        prerequisiteTasks: prereqs,
        dependentTasks,
      };
    });
  }, [state.tasks, taskMap, dependentsMap, timelineStart, totalDays, today]);

  // Compute timeline overlaps between tasks (especially within same project or assignee)
  const ganttTasksWithOverlaps = useMemo(() => {
    return ganttTasks.map((item, idx) => {
      const overlapping: string[] = [];
      ganttTasks.forEach((other, otherIdx) => {
        if (idx === otherIdx) return;
        // Check if dates intersect
        const intersects =
          item.startDate <= other.dueDate && item.dueDate >= other.startDate;
        const sameProject = item.task.projectId === other.task.projectId;
        const sameAssignee = item.task.assigneeId === other.task.assigneeId;

        if (intersects && (sameProject || sameAssignee)) {
          overlapping.push(other.task.id);
        }
      });

      return {
        ...item,
        hasOverlaps: overlapping.length > 0,
        overlapCount: overlapping.length,
        overlappingTaskIds: overlapping,
      };
    });
  }, [ganttTasks]);

  // Filter tasks based on search, project, and critical path toggle
  const filteredGanttTasks = useMemo(() => {
    return ganttTasksWithOverlaps.filter((item) => {
      const matchesSearch =
        item.task.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.task.assigneeName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.task.projectName.toLowerCase().includes(searchFilter.toLowerCase());

      const matchesProject =
        selectedProjectId === 'all' || item.task.projectId === selectedProjectId;

      const matchesCritical =
        !showOnlyCriticalPath ||
        item.task.isBottleneck ||
        item.dependentTasks.length > 0 ||
        item.task.priority === 'urgent';

      return matchesSearch && matchesProject && matchesCritical;
    });
  }, [ganttTasksWithOverlaps, searchFilter, selectedProjectId, showOnlyCriticalPath]);

  // Group filtered tasks by project
  const tasksByProject = useMemo(() => {
    const map = new Map<string, { project: (typeof state.projects)[0]; items: GanttTaskItem[] }>();

    state.projects.forEach((proj) => {
      map.set(proj.id, { project: proj, items: [] });
    });

    filteredGanttTasks.forEach((item) => {
      const group = map.get(item.task.projectId);
      if (group) {
        group.items.push(item);
      } else {
        // Fallback for custom project
        const customProj = {
          id: item.task.projectId,
          name: item.task.projectName,
          code: 'PROJ',
          clientOrDept: 'Operations',
          startDate: '2026-08-01',
          targetDate: '2026-10-15',
          status: 'on_track' as const,
          budget: 0,
          spent: 0,
          progress: 50,
          managerId: '',
          managerName: '',
          description: '',
          tasksCount: 1,
          completedTasksCount: 0,
        };
        map.set(item.task.projectId, { project: customProj, items: [item] });
      }
    });

    // Return only projects that have matching tasks or when viewing 'all'
    return Array.from(map.values()).filter((g) => g.items.length > 0);
  }, [state.projects, filteredGanttTasks]);

  // Calculate today's horizontal offset percentage on the timeline
  const todayLeftPct = useMemo(() => {
    const diff = (today.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.min(100, (diff / totalDays) * 100));
  }, [today, timelineStart, totalDays]);

  const toggleProjectCollapse = (projectId: string) => {
    setCollapsedProjects((prev) => ({
      ...prev,
      [projectId]: !prev[projectId],
    }));
  };

  // Helper for Gantt task bar styling
  const getTaskBarTheme = (task: Task, isOverdue: boolean, isUrgent: boolean) => {
    if (task.status === 'done') {
      return {
        bar: 'bg-emerald-600 dark:bg-emerald-500 border-emerald-500 text-white',
        fill: 'bg-emerald-400/40',
        badge: 'bg-emerald-500/20 text-emerald-300',
      };
    }
    if (isOverdue) {
      return {
        bar: 'bg-rose-600 dark:bg-rose-500 border-rose-500 text-white animate-pulse',
        fill: 'bg-rose-400/40',
        badge: 'bg-rose-500/20 text-rose-300',
      };
    }
    if (task.isBottleneck) {
      return {
        bar: 'bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 border-amber-400 text-white shadow-xs shadow-amber-500/30',
        fill: 'bg-amber-300/30',
        badge: 'bg-amber-400/20 text-amber-200',
      };
    }
    if (isUrgent) {
      return {
        bar: 'bg-gradient-to-r from-rose-500 to-amber-600 border-rose-400 text-white',
        fill: 'bg-rose-400/30',
        badge: 'bg-rose-500/20 text-rose-200',
      };
    }
    if (task.status === 'in_progress') {
      return {
        bar: 'bg-indigo-600 dark:bg-indigo-500 border-indigo-400 text-white',
        fill: 'bg-indigo-400/30',
        badge: 'bg-indigo-400/20 text-indigo-200',
      };
    }
    if (task.status === 'review') {
      return {
        bar: 'bg-amber-600 dark:bg-amber-500 border-amber-400 text-white',
        fill: 'bg-amber-400/30',
        badge: 'bg-amber-400/20 text-amber-200',
      };
    }
    return {
      bar: 'bg-slate-500 dark:bg-slate-600 border-slate-400 text-slate-100',
      fill: 'bg-slate-400/30',
      badge: 'bg-slate-400/20 text-slate-200',
    };
  };

  // Helper to determine if a task is directly related to the currently highlighted task
  const isTaskRelated = (taskId: string) => {
    if (!highlightedTaskId) return false;
    if (highlightedTaskId === taskId) return true;
    const targetItem = ganttTasksWithOverlaps.find((g) => g.task.id === highlightedTaskId);
    if (!targetItem) return false;
    const isPrereq = targetItem.prerequisiteTasks.some((p) => p.id === taskId);
    const isDependent = targetItem.dependentTasks.some((d) => d.id === taskId);
    return isPrereq || isDependent;
  };

  // Quick status upgrade from inspector
  const handleQuickAdvanceStatus = (taskId: string, currentStatus: TaskStatus) => {
    const flow: Record<TaskStatus, TaskStatus> = {
      backlog: 'todo',
      todo: 'in_progress',
      in_progress: 'review',
      review: 'done',
      done: 'in_progress',
    };
    updateTask({ id: taskId, status: flow[currentStatus] });
    if (selectedTask && selectedTask.id === taskId) {
      setSelectedTask({ ...selectedTask, status: flow[currentStatus] });
    }
  };

  return (
    <div
      id="gantt-chart-container"
      className="space-y-4 animate-in fade-in duration-200"
    >
      {/* Chart Top Control Header */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Project Radar & Schedule Matrix
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Enterprise Gantt Chart & Dependency Map</span>
            <span className="text-xs font-normal font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredGanttTasks.length} Workstreams
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualize workstream schedules, critical path milestones, prerequisite handoffs, and concurrency overlaps.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Selector Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">All Projects ({state.projects.length})</option>
              {state.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Filter */}
          <div className="relative min-w-[150px]">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter tasks or owner..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Dependency Lines Toggle */}
          <button
            type="button"
            onClick={() => setShowDependencies(!showDependencies)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showDependencies
                ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Zap className={`h-3.5 w-3.5 ${showDependencies ? 'text-amber-500' : 'text-slate-400'}`} />
            <span>Dependency Links</span>
          </button>

          {/* Critical Path Only Toggle */}
          <button
            type="button"
            onClick={() => setShowOnlyCriticalPath(!showOnlyCriticalPath)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showOnlyCriticalPath
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-semibold'
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className={`h-3.5 w-3.5 ${showOnlyCriticalPath ? 'text-rose-500' : 'text-slate-400'}`} />
            <span>Critical Path Only</span>
          </button>
        </div>
      </div>

      {/* Overlap & Dependency Radar Alert Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-500 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Timeline Window
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Sep 10 – Oct 02, 2026 ({totalDays} Days)
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold">
            Sprint 38-39
          </span>
        </div>

        <div className="p-3 rounded-xl border border-amber-100 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Prerequisite Chains
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {ganttTasks.filter((t) => t.prerequisiteTasks.length > 0).length} Sequenced Dependencies
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
            Active Blockers Flagged
          </span>
        </div>

        <div className="p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-500 shrink-0" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Concurrency Radar
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {ganttTasksWithOverlaps.filter((t) => t.hasOverlaps).length} Tasks with Scheduled Overlaps
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
            Workload Balanced
          </span>
        </div>
      </div>

      {/* Main Gantt Canvas Card */}
      <div
        ref={containerRef}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden"
      >
        {/* Scrollable Container */}
        <div className="overflow-x-auto min-w-full">
          <div className="min-w-[980px]">
            {/* Timeline Header Row: Month / Week / Day Columns */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 sticky top-0 z-10 text-xs">
              {/* Left Column Header: Task & Owner Meta */}
              <div className="w-[300px] shrink-0 p-3 font-semibold text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span>Task & Workstream</span>
                <span className="text-[10px] text-slate-400 font-mono">Status / Owner</span>
              </div>

              {/* Right Columns: Date Days */}
              <div className="flex-1 flex relative">
                {datesList.map((date, idx) => {
                  const dayNum = date.getDate();
                  const dayName = date.toLocaleDateString('en-US', { weekday: 'narrow' });
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isCurrentDay =
                    date.getDate() === today.getDate() &&
                    date.getMonth() === today.getMonth() &&
                    date.getFullYear() === today.getFullYear();

                  return (
                    <div
                      key={idx}
                      className={`flex-1 py-2 px-0.5 text-center border-r border-slate-100 dark:border-slate-800/60 select-none ${
                        isCurrentDay
                          ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold'
                          : isWeekend
                          ? 'bg-slate-100/50 dark:bg-slate-950/40 text-slate-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <div className="text-[9px] uppercase tracking-wider">{dayName}</div>
                      <div
                        className={`text-xs font-mono mt-0.5 ${
                          isCurrentDay
                            ? 'inline-flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600 text-white font-bold'
                            : ''
                        }`}
                      >
                        {dayNum}
                      </div>
                    </div>
                  );
                })}

                {/* "TODAY" Line Marker in Header */}
                <div
                  className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center"
                  style={{ left: `${todayLeftPct}%`, transform: 'translateX(-50%)' }}
                >
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-indigo-600 text-white shadow-xs">
                    Today
                  </span>
                </div>
              </div>
            </div>

            {/* Gantt Body: Grouped by Projects */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 relative">
              {/* Full-height Vertical "Today" Line Marker across all rows */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-10 border-l-2 border-indigo-500/80 border-dashed"
                style={{ left: `calc(300px + (100% - 300px) * (${todayLeftPct} / 100))` }}
              />

              {tasksByProject.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400">
                  No workstreams match the active filters or critical path criteria.
                </div>
              ) : (
                tasksByProject.map(({ project, items }) => {
                  const isCollapsed = collapsedProjects[project.id];
                  const completedInProj = items.filter((i) => i.task.status === 'done').length;
                  const projectPercent = items.length > 0 ? Math.round((completedInProj / items.length) * 100) : 0;

                  return (
                    <div key={project.id} className="group/proj">
                      {/* Project Swimlane Header Row */}
                      <div className="flex items-center bg-slate-50 dark:bg-slate-950/70 hover:bg-slate-100/70 dark:hover:bg-slate-900/60 transition-colors border-b border-slate-200/80 dark:border-slate-800">
                        {/* Project Info Block */}
                        <div className="w-[300px] shrink-0 p-2.5 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => toggleProjectCollapse(project.id)}
                            className="flex items-center gap-2 text-left min-w-0"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4 text-slate-400 shrink-0" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate block">
                                {project.name}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {project.code} • {projectPercent}% Complete
                              </span>
                            </div>
                          </button>

                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 font-semibold">
                            {items.length} Tasks
                          </span>
                        </div>

                        {/* Project Milestone Bar Track */}
                        <div className="flex-1 p-2.5 relative">
                          <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all"
                              style={{ width: `${projectPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Tasks Rows under this Project */}
                      {!isCollapsed &&
                        items.map((item) => {
                          const { task, startDayOffset, durationDays, progressPercent, isOverdue, isUrgent } = item;
                          const theme = getTaskBarTheme(task, isOverdue, isUrgent);
                          const isHighlighted = isTaskRelated(task.id);
                          const isSelected = selectedTask?.id === task.id;

                          // Left % and Width %
                          const leftPct = Math.max(0, (startDayOffset / totalDays) * 100);
                          const widthPct = Math.max(4, (durationDays / totalDays) * 100);

                          return (
                            <div
                              key={task.id}
                              onMouseEnter={() => setHighlightedTaskId(task.id)}
                              onMouseLeave={() => setHighlightedTaskId(null)}
                              onClick={() => setSelectedTask(task)}
                              className={`flex items-center transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/50 ${
                                isSelected
                                  ? 'bg-indigo-50/80 dark:bg-indigo-950/40'
                                  : isHighlighted
                                  ? 'bg-amber-50/40 dark:bg-amber-950/20'
                                  : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30'
                              }`}
                            >
                              {/* Left Meta: Title, Assignee & Status */}
                              <div className="w-[300px] shrink-0 p-2.5 border-r border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    {task.aiPriorityRank && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                                        #{task.aiPriorityRank}
                                      </span>
                                    )}
                                    {task.isBottleneck && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                        BLOCKER
                                      </span>
                                    )}
                                    <span
                                      className={`font-semibold truncate text-xs ${
                                        task.status === 'done'
                                          ? 'line-through text-slate-400'
                                          : 'text-slate-800 dark:text-slate-200'
                                      }`}
                                      title={task.title}
                                    >
                                      {task.title}
                                    </span>
                                  </div>

                                  {/* Sub-label: Dependencies & Overlap tags */}
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 truncate">
                                    {item.prerequisiteTasks.length > 0 && (
                                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                                        <span>Prereq: {item.prerequisiteTasks.length}</span>
                                      </span>
                                    )}
                                    {item.dependentTasks.length > 0 && (
                                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                                        <span>Unblocks: {item.dependentTasks.length}</span>
                                      </span>
                                    )}
                                    {item.hasOverlaps && (
                                      <span className="text-rose-500 font-medium">
                                        Overlap ({item.overlapCount})
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Assignee Avatar */}
                                <div className="flex items-center gap-1 shrink-0">
                                  <img
                                    src={task.assigneeAvatar}
                                    alt={task.assigneeName}
                                    className="h-5 w-5 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                                    title={task.assigneeName}
                                  />
                                </div>
                              </div>

                              {/* Right Gantt Bar Track */}
                              <div className="flex-1 p-2.5 relative h-12 flex items-center">
                                {/* Grid Background Sub-lines for each day */}
                                <div className="absolute inset-0 flex pointer-events-none">
                                  {datesList.map((d, i) => (
                                    <div
                                      key={i}
                                      className={`flex-1 border-r border-slate-100 dark:border-slate-800/40 ${
                                        d.getDay() === 0 || d.getDay() === 6
                                          ? 'bg-slate-50/40 dark:bg-slate-950/20'
                                          : ''
                                      }`}
                                    />
                                  ))}
                                </div>

                                {/* Gantt Task Schedule Bar */}
                                <div
                                  className={`h-7 rounded-lg border flex items-center relative overflow-hidden transition-all shadow-xs z-10 select-none ${
                                    theme.bar
                                  } ${
                                    isHighlighted
                                      ? 'ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-slate-900 scale-[1.01]'
                                      : ''
                                  }`}
                                  style={{
                                    left: `${leftPct}%`,
                                    width: `${widthPct}%`,
                                  }}
                                  title={`${task.title} • ${task.dueDate} • ${progressPercent}% done`}
                                >
                                  {/* Progress Fill inside the bar */}
                                  <div
                                    className={`absolute left-0 top-0 bottom-0 ${theme.fill} rounded-l-lg transition-all`}
                                    style={{ width: `${progressPercent}%` }}
                                  />

                                  {/* Bar Content */}
                                  <div className="relative z-10 px-2 flex items-center justify-between w-full min-w-0 text-[11px] font-medium leading-none">
                                    <span className="truncate pr-1 text-white drop-shadow-xs">
                                      {task.title}
                                    </span>
                                    <span className="font-mono text-[9px] opacity-90 shrink-0">
                                      {durationDays}d ({progressPercent}%)
                                    </span>
                                  </div>

                                  {/* Prerequisite Indicator Dot */}
                                  {item.prerequisiteTasks.length > 0 && showDependencies && (
                                    <div
                                      className="absolute left-0.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-amber-300 ring-1 ring-amber-500"
                                      title={`Prerequisite: ${item.prerequisiteTasks[0].title}`}
                                    />
                                  )}

                                  {/* Unblocker Indicator Dot */}
                                  {item.dependentTasks.length > 0 && showDependencies && (
                                    <div
                                      className="absolute right-0.5 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-emerald-300 ring-1 ring-emerald-500"
                                      title={`Unblocks ${item.dependentTasks.length} tasks`}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Legend & Guide Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-emerald-500" />
              <span>Completed (100%)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-indigo-500" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-amber-500" />
              <span>In Review / Pending</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-rose-500" />
              <span>Urgent / Overdue</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 ring-2 ring-amber-600" />
              <span>Prerequisite Handoff Link</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            Click any workstream bar to view prerequisites, dependencies & timeline inspector.
          </div>
        </div>
      </div>

      {/* Task Detail Inspector Modal / Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div
            className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    {selectedTask.projectName}
                  </span>
                  {selectedTask.aiPriorityRank && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      AI Rank #{selectedTask.aiPriorityRank}
                    </span>
                  )}
                  {selectedTask.hipaaPhiSensitive && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      HIPAA PHI
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {selectedTask.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTask(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Description */}
              {selectedTask.description && (
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {selectedTask.description}
                </p>
              )}

              {/* Schedule Dates & Estimated Hours */}
              <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400">Due Date</span>
                  <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedTask.dueDate}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Hours Estimated</span>
                  <p className="font-mono font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                    {selectedTask.estimatedHours}h ({selectedTask.loggedHours}h logged)
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Assignee</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <img
                      src={selectedTask.assigneeAvatar}
                      alt={selectedTask.assigneeName}
                      className="h-4 w-4 rounded-full object-cover"
                    />
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {selectedTask.assigneeName}
                    </span>
                  </div>
                </div>
              </div>

              {/* Upstream Prerequisites (Dependencies) */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                  <span>Upstream Prerequisites (Must Finish First)</span>
                </span>
                {selectedTask.dependencies && selectedTask.dependencies.length > 0 ? (
                  <div className="space-y-1.5">
                    {selectedTask.dependencies.map((depId) => {
                      const dep = taskMap.get(depId);
                      return (
                        <div
                          key={depId}
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {dep?.status === 'done' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                                {dep?.title || depId}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Assigned to {dep?.assigneeName} • Due {dep?.dueDate}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                              dep?.status === 'done'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {dep?.status?.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No prerequisites required. Task can begin immediately.</p>
                )}
              </div>

              {/* Downstream Workstreams (Tasks Unblocked) */}
              <div className="space-y-1.5">
                <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Downstream Tasks Unblocked by Completing This</span>
                </span>
                {(dependentsMap.get(selectedTask.id) || []).length > 0 ? (
                  <div className="space-y-1.5">
                    {(dependentsMap.get(selectedTask.id) || []).map((depId) => {
                      const dep = taskMap.get(depId);
                      return (
                        <div
                          key={depId}
                          className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 flex items-center justify-between"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                              {dep?.title || depId}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Assigned to {dep?.assigneeName} • Target Due {dep?.dueDate}
                            </p>
                          </div>
                          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded shrink-0">
                            Waiting on this
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No downstream dependencies dependent on this deliverable.</p>
                )}
              </div>

              {/* AI Suggested Rationale */}
              {selectedTask.aiSuggestedOrderReason && (
                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40">
                  <span className="font-semibold text-indigo-700 dark:text-indigo-300 block mb-0.5">
                    AI Schedule Rationale
                  </span>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedTask.aiSuggestedOrderReason}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Current Status: <strong className="text-slate-700 dark:text-slate-300 uppercase">{selectedTask.status.replace('_', ' ')}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickAdvanceStatus(selectedTask.id, selectedTask.status)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Play className="h-3 w-3" />
                  <span>Advance Status</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTask(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

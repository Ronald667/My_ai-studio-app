import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useApp } from '../context/AppContext';
import { Task } from '../types';
import { ArrowRightLeft, SlidersHorizontal, X } from 'lucide-react';

type HeatmapDimension = 'priority' | 'status' | 'project';

interface HeatmapColumn {
  id: string;
  label: string;
}

interface HeatmapCellData {
  userId: string;
  userName: string;
  colId: string;
  colLabel: string;
  hours: number;
  taskCount: number;
  tasks: Task[];
}

const WEEKLY_CAPACITY_HOURS = 40;

export const TeamResourceHeatmap: React.FC = () => {
  const { state, theme, updateTask, showPushAlert } = useApp();

  const [dimension, setDimension] = useState<HeatmapDimension>('priority');
  const [selectedCell, setSelectedCell] = useState<{ userId: string; colId: string } | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    data: HeatmapCellData;
    x: number;
    y: number;
  } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(760);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Measure container width responsively
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const updateWidth = () => {
      const next = Math.max(480, Math.floor(el.clientWidth));
      setContainerWidth(next);
    };

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => updateWidth());
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const activeTasks = useMemo(
    () => state.tasks.filter((t) => t.status !== 'done'),
    [state.tasks]
  );

  const columns: HeatmapColumn[] = useMemo(() => {
    if (dimension === 'priority') {
      return [
        { id: 'urgent', label: 'Urgent' },
        { id: 'high', label: 'High' },
        { id: 'medium', label: 'Medium' },
        { id: 'low', label: 'Low' },
      ];
    }
    if (dimension === 'status') {
      return [
        { id: 'backlog', label: 'Backlog' },
        { id: 'todo', label: 'To Do' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'review', label: 'Review' },
      ];
    }
    return state.projects.slice(0, 5).map((p) => ({
      id: p.id,
      label: p.code || p.name.slice(0, 12),
    }));
  }, [dimension, state.projects]);

  // Aggregate workload matrix + per-user totals
  const { cells, userTotals, maxCellHours } = useMemo(() => {
    const cellList: HeatmapCellData[] = [];
    const totalsMap = new Map<string, { hours: number; tasks: number }>();
    let maxHrs = 0;

    state.users.forEach((user) => {
      const userTasks = activeTasks.filter((t) => t.assigneeId === user.id);
      const totalH = userTasks.reduce(
        (sum, t) => sum + Math.max(0, (t.estimatedHours || 0) - (t.loggedHours || 0) * 0.5),
        0
      );
      // Display full estimated remaining/committed hours cleanly
      const committedHours = userTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);
      totalsMap.set(user.id, {
        hours: Math.round(committedHours || totalH),
        tasks: userTasks.length,
      });

      columns.forEach((col) => {
        const matchingTasks = userTasks.filter((t) => {
          if (dimension === 'priority') return t.priority === col.id;
          if (dimension === 'status') return t.status === col.id;
          return t.projectId === col.id;
        });

        const cellHours = matchingTasks.reduce(
          (sum, t) => sum + (Number(t.estimatedHours) || 0),
          0
        );
        if (cellHours > maxHrs) maxHrs = cellHours;

        cellList.push({
          userId: user.id,
          userName: user.name,
          colId: col.id,
          colLabel: col.label,
          hours: cellHours,
          taskCount: matchingTasks.length,
          tasks: matchingTasks,
        });
      });
    });

    return {
      cells: cellList,
      userTotals: totalsMap,
      maxCellHours: Math.max(16, maxHrs),
    };
  }, [state.users, activeTasks, columns, dimension]);

  // Summary counts for header metadata
  const summaryStats = useMemo(() => {
    let overloaded = 0;
    let balanced = 0;
    let available = 0;

    state.users.forEach((u) => {
      const hrs = userTotals.get(u.id)?.hours || 0;
      if (hrs > WEEKLY_CAPACITY_HOURS) overloaded += 1;
      else if (hrs >= 16) balanced += 1;
      else available += 1;
    });

    return { overloaded, balanced, available };
  }, [state.users, userTotals]);

  // Render D3 SVG Heatmap
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || state.users.length === 0 || columns.length === 0) return;

    const isDark = theme === 'dark';
    const margin = { top: 34, right: 112, bottom: 16, left: 168 };
    const rowHeight = 42;
    const width = containerWidth;
    const height = margin.top + state.users.length * rowHeight + margin.bottom;
    const innerWidth = Math.max(200, width - margin.left - margin.right);
    const innerHeight = state.users.length * rowHeight;

    const svg = d3
      .select(svgEl)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', width)
      .attr('height', height);

    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3
      .scaleBand<string>()
      .domain(columns.map((c) => c.id))
      .range([0, innerWidth])
      .padding(0.1);

    const yScale = d3
      .scaleBand<string>()
      .domain(state.users.map((u) => u.id))
      .range([0, innerHeight])
      .padding(0.16);

    // Semantic workload color ramp: idle -> nominal -> elevated -> overloaded
    const colorScale = d3
      .scaleLinear<string>()
      .domain([0, maxCellHours * 0.35, maxCellHours * 0.7, maxCellHours])
      .range(
        isDark
          ? ['#1e293b', '#312e81', '#b45309', '#be123c']
          : ['#f1f5f9', '#c7d2fe', '#f59e0b', '#e11d48']
      )
      .clamp(true);

    // X-axis column labels at top
    g.append('g')
      .selectAll('text.x-label')
      .data(columns)
      .join('text')
      .attr('class', 'x-label')
      .attr('x', (d) => (xScale(d.id) || 0) + xScale.bandwidth() / 2)
      .attr('y', -12)
      .attr('text-anchor', 'middle')
      .attr('fill', isDark ? '#94a3b8' : '#475569')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .text((d) => d.label);

    // Y-axis team member names on left
    const yAxisGroup = g
      .append('g')
      .selectAll('g.y-member')
      .data(state.users)
      .join('g')
      .attr('class', 'y-member')
      .attr(
        'transform',
        (u) => `translate(-12, ${(yScale(u.id) || 0) + yScale.bandwidth() / 2})`
      );

    yAxisGroup
      .append('text')
      .attr('x', 0)
      .attr('y', -2)
      .attr('text-anchor', 'end')
      .attr('fill', isDark ? '#e2e8f0' : '#0f172a')
      .style('font-size', '12px')
      .style('font-weight', '600')
      .text((u) => {
        const shortName = u.name.replace(', PMP', '');
        return shortName.length > 18 ? `${shortName.slice(0, 17)}…` : shortName;
      });

    yAxisGroup
      .append('text')
      .attr('x', 0)
      .attr('y', 11)
      .attr('text-anchor', 'end')
      .attr('fill', isDark ? '#64748b' : '#64748b')
      .style('font-size', '10px')
      .text((u) => u.role.replace('_', ' '));

    // Heatmap cells
    const cellGroups = g
      .append('g')
      .selectAll('g.heatmap-cell')
      .data(cells)
      .join('g')
      .attr('class', 'heatmap-cell')
      .attr(
        'transform',
        (d) => `translate(${xScale(d.colId) || 0}, ${yScale(d.userId) || 0})`
      )
      .style('cursor', 'pointer')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .select('rect')
          .attr('stroke', isDark ? '#818cf8' : '#4f46e5')
          .attr('stroke-width', 2);

        const rect = wrapperRef.current?.getBoundingClientRect();
        if (rect) {
          setHoveredCell({
            data: d,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }
      })
      .on('mousemove', (event, d) => {
        const rect = wrapperRef.current?.getBoundingClientRect();
        if (rect) {
          setHoveredCell({
            data: d,
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }
      })
      .on('mouseleave', function (_, d) {
        const isSelected =
          selectedCell?.userId === d.userId && selectedCell?.colId === d.colId;
        d3.select(this)
          .select('rect')
          .attr('stroke', isSelected ? (isDark ? '#818cf8' : '#4f46e5') : (isDark ? '#334155' : '#e2e8f0'))
          .attr('stroke-width', isSelected ? 2 : 1);
        setHoveredCell(null);
      })
      .on('click', (_, d) => {
        setSelectedCell((prev) =>
          prev?.userId === d.userId && prev?.colId === d.colId
            ? null
            : { userId: d.userId, colId: d.colId }
        );
      });

    cellGroups
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('fill', (d) =>
        d.hours === 0
          ? isDark
            ? '#0f172a'
            : '#f8fafc'
          : colorScale(d.hours)
      )
      .attr('stroke', (d) => {
        const isSelected =
          selectedCell?.userId === d.userId && selectedCell?.colId === d.colId;
        if (isSelected) return isDark ? '#818cf8' : '#4f46e5';
        return isDark ? '#1e293b' : '#e2e8f0';
      })
      .attr('stroke-width', (d) =>
        selectedCell?.userId === d.userId && selectedCell?.colId === d.colId ? 2 : 1
      );

    cellGroups
      .append('text')
      .attr('x', xScale.bandwidth() / 2)
      .attr('y', yScale.bandwidth() / 2 + 4)
      .attr('text-anchor', 'middle')
      .style('font-family', 'JetBrains Mono, monospace')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('font-variant-numeric', 'tabular-nums')
      .attr('fill', (d) => {
        if (d.hours === 0) return isDark ? '#475569' : '#94a3b8';
        if (d.hours >= maxCellHours * 0.45) return '#ffffff';
        return isDark ? '#e2e8f0' : '#1e293b';
      })
      .text((d) => (d.hours > 0 ? `${d.hours}h · ${d.taskCount}` : '—'));

    // Right-hand Total Load & Utilization Column
    const totalGroup = g
      .append('g')
      .attr('transform', `translate(${innerWidth + 14}, 0)`);

    totalGroup
      .append('text')
      .attr('x', 0)
      .attr('y', -12)
      .attr('fill', isDark ? '#94a3b8' : '#475569')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .text('Load / 40h');

    state.users.forEach((u) => {
      const stats = userTotals.get(u.id) || { hours: 0, tasks: 0 };
      const pct = Math.round((stats.hours / WEEKLY_CAPACITY_HOURS) * 100);
      const yPos = (yScale(u.id) || 0) + yScale.bandwidth() / 2 + 4;
      const loadColor =
        stats.hours > WEEKLY_CAPACITY_HOURS
          ? isDark
            ? '#fb7185'
            : '#dc2626'
          : stats.hours >= 24
          ? isDark
            ? '#fbbf24'
            : '#d97706'
          : isDark
          ? '#34d399'
          : '#16a34a';

      totalGroup
        .append('text')
        .attr('x', 0)
        .attr('y', yPos)
        .attr('fill', loadColor)
        .style('font-family', 'JetBrains Mono, monospace')
        .style('font-size', '11px')
        .style('font-weight', '600')
        .style('font-variant-numeric', 'tabular-nums')
        .text(`${stats.hours}h (${pct}%)`);
    });
  }, [state.users, columns, cells, userTotals, maxCellHours, theme, containerWidth, selectedCell]);

  const activeCellData = useMemo(() => {
    if (!selectedCell) return null;
    return (
      cells.find(
        (c) => c.userId === selectedCell.userId && c.colId === selectedCell.colId
      ) || null
    );
  }, [selectedCell, cells]);

  const handleReassignTask = (task: Task, newAssigneeId: string) => {
    const newOwner = state.users.find((u) => u.id === newAssigneeId);
    if (!newOwner || newOwner.id === task.assigneeId) return;

    updateTask({
      id: task.id,
      assigneeId: newOwner.id,
      assigneeName: newOwner.name,
      assigneeAvatar: newOwner.avatar,
    });
    showPushAlert(
      'Workload Rebalanced',
      `Reassigned "${task.title}" to ${newOwner.name}.`
    );
  };

  return (
    <section
      id="team-resource-heatmap"
      className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-indigo-500" />
            <span>Team Resource Heatmap</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono tabular-nums">
            <span>{summaryStats.overloaded} overloaded (&gt;40h)</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>{summaryStats.balanced} balanced (16–40h)</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>{summaryStats.available} available (&lt;16h)</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>Click any cell to rebalance tasks</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Heat Scale Legend */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Light</span>
            <span className="h-2.5 w-4 rounded-xs bg-slate-200 dark:bg-slate-800" />
            <span className="h-2.5 w-4 rounded-xs bg-indigo-300 dark:bg-indigo-900" />
            <span className="h-2.5 w-4 rounded-xs bg-amber-500 dark:bg-amber-700" />
            <span className="h-2.5 w-4 rounded-xs bg-rose-600 dark:bg-rose-700" />
            <span>Heavy</span>
          </div>

          {/* Grouping Dimension Selector */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
            {(
              [
                { id: 'priority', label: 'By Priority' },
                { id: 'status', label: 'By Stage' },
                { id: 'project', label: 'By Project' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setDimension(opt.id);
                  setSelectedCell(null);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  dimension === opt.id
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* D3 SVG Canvas */}
      <div ref={wrapperRef} className="relative w-full overflow-x-auto">
        <svg ref={svgRef} className="block w-full min-w-[480px]" />

        {/* Hover Tooltip */}
        {hoveredCell && (
          <div
            className="pointer-events-none absolute z-20 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 shadow-lg text-xs"
            style={{
              left: Math.min(containerWidth - 210, Math.max(8, hoveredCell.x + 12)),
              top: Math.max(8, hoveredCell.y - 44),
            }}
          >
            <div className="font-semibold text-slate-900 dark:text-slate-100">
              {hoveredCell.data.userName} · {hoveredCell.data.colLabel}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">
              {hoveredCell.data.hours}h committed · {hoveredCell.data.taskCount} active task
              {hoveredCell.data.taskCount === 1 ? '' : 's'}
            </div>
          </div>
        )}
      </div>

      {/* Inline Task Rebalancing Panel when a cell is clicked */}
      {activeCellData && (
        <div
          id="heatmap-rebalance-panel"
          className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-500" />
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Rebalance Queue: {activeCellData.userName} ({activeCellData.colLabel})
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                · {activeCellData.hours}h across {activeCellData.taskCount} task
                {activeCellData.taskCount === 1 ? '' : 's'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCell(null)}
              aria-label="Close rebalance panel"
              className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {activeCellData.tasks.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
              No active tasks in this bucket for {activeCellData.userName}. Select an overloaded cell to reassign work here.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {activeCellData.tasks.map((task) => (
                <div
                  key={task.id}
                  className="px-3.5 py-2.5 bg-slate-50/60 dark:bg-slate-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {task.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {task.projectName} · {task.estimatedHours}h est · Due {task.dueDate}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <label
                      htmlFor={`reassign-${task.id}`}
                      className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      Reassign to:
                    </label>
                    <select
                      id={`reassign-${task.id}`}
                      value={task.assigneeId}
                      onChange={(e) => handleReassignTask(task, e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {state.users.map((u) => {
                        const loadHrs = userTotals.get(u.id)?.hours || 0;
                        return (
                          <option key={u.id} value={u.id}>
                            {u.name} ({loadHrs}h)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

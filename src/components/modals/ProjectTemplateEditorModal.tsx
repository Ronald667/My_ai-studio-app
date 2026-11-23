import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ProjectTemplate,
  ProjectTemplateCategory,
  TaskPriority,
  TemplateMilestoneDefinition,
  TemplateTaskDefinition,
} from '../../types';
import { X, Plus, Trash2, Calendar, Clock, Flag, CheckSquare } from 'lucide-react';

interface ProjectTemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTemplate?: ProjectTemplate | null;
}

const CATEGORIES: ProjectTemplateCategory[] = [
  'Client Onboarding',
  'Software Release',
  'Compliance Audit',
  'Manufacturing Launch',
  'Custom',
];

export const ProjectTemplateEditorModal: React.FC<ProjectTemplateEditorModalProps> = ({
  isOpen,
  onClose,
  editingTemplate,
}) => {
  const { state, currentUser, createProjectTemplate, updateProjectTemplate } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProjectTemplateCategory>('Client Onboarding');
  const [description, setDescription] = useState('');
  const [defaultDurationDays, setDefaultDurationDays] = useState(21);
  const [defaultBudget, setDefaultBudget] = useState(35000);
  const [defaultManagerId, setDefaultManagerId] = useState(currentUser.id);
  const [milestones, setMilestones] = useState<TemplateMilestoneDefinition[]>([]);
  const [tasks, setTasks] = useState<TemplateTaskDefinition[]>([]);
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<'tasks' | 'milestones'>('tasks');

  useEffect(() => {
    if (!isOpen) return;
    if (editingTemplate) {
      setName(editingTemplate.name);
      setCategory(editingTemplate.category);
      setDescription(editingTemplate.description);
      setDefaultDurationDays(editingTemplate.defaultDurationDays);
      setDefaultBudget(editingTemplate.defaultBudget);
      setDefaultManagerId(editingTemplate.defaultManagerId);
      setMilestones(JSON.parse(JSON.stringify(editingTemplate.milestones)));
      setTasks(JSON.parse(JSON.stringify(editingTemplate.tasks)));
    } else {
      const firstUser = state.users[0]?.id || currentUser.id;
      setName('');
      setCategory('Custom');
      setDescription('');
      setDefaultDurationDays(14);
      setDefaultBudget(25000);
      setDefaultManagerId(currentUser.id);
      setMilestones([
        {
          id: `tpl-ms-${Date.now()}-1`,
          title: 'Kickoff & Scope Approval',
          description: 'Initial stakeholder alignment and timeline sign-off.',
          targetOffsetDays: 3,
          ownerId: firstUser,
        },
        {
          id: `tpl-ms-${Date.now()}-2`,
          title: 'Final Delivery & Handover',
          description: 'Project deliverables verified and closed.',
          targetOffsetDays: 14,
          ownerId: firstUser,
        },
      ]);
      setTasks([
        {
          id: `tpl-task-${Date.now()}-1`,
          title: 'Kickoff Alignment & Stakeholder Brief',
          description: 'Review objectives, roles, and delivery schedule.',
          priority: 'high',
          startOffsetDays: 0,
          estimatedDurationDays: 3,
          estimatedHours: 6,
          defaultAssigneeId: firstUser,
          tags: ['Planning'],
          hipaaPhiSensitive: false,
          subtasks: ['Circulate kickoff agenda', 'Confirm team availability'],
        },
      ]);
    }
    setSubtaskDrafts({});
    setActiveSection('tasks');
  }, [isOpen, editingTemplate, currentUser.id, state.users]);

  if (!isOpen) return null;

  const handleAddMilestone = () => {
    const nextOffset =
      milestones.length > 0
        ? Math.min(defaultDurationDays, milestones[milestones.length - 1].targetOffsetDays + 5)
        : Math.max(1, Math.round(defaultDurationDays / 2));
    setMilestones((prev) => [
      ...prev,
      {
        id: `tpl-ms-${Date.now()}-${prev.length + 1}`,
        title: `Milestone ${prev.length + 1}`,
        description: '',
        targetOffsetDays: nextOffset,
        ownerId: defaultManagerId,
      },
    ]);
  };

  const handleUpdateMilestone = (
    id: string,
    patch: Partial<TemplateMilestoneDefinition>
  ) => {
    setMilestones((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
    setTasks((prev) =>
      prev.map((t) => (t.milestoneRefId === id ? { ...t, milestoneRefId: undefined } : t))
    );
  };

  const handleAddTask = () => {
    const newTask: TemplateTaskDefinition = {
      id: `tpl-task-${Date.now()}-${tasks.length + 1}`,
      title: `Standard Deliverable ${tasks.length + 1}`,
      description: '',
      priority: 'medium',
      startOffsetDays: 0,
      estimatedDurationDays: 4,
      estimatedHours: 8,
      defaultAssigneeId: defaultManagerId,
      milestoneRefId: milestones[0]?.id,
      tags: [category.split(' ')[0] || 'Workflow'],
      hipaaPhiSensitive: false,
      subtasks: [],
    };
    setTasks((prev) => [...prev, newTask]);
  };

  const handleUpdateTask = (id: string, patch: Partial<TemplateTaskDefinition>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  };

  const handleRemoveTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddSubtaskToTask = (taskId: string) => {
    const text = (subtaskDrafts[taskId] || '').trim();
    if (!text) return;
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, subtasks: [...t.subtasks, text] } : t))
    );
    setSubtaskDrafts((prev) => ({ ...prev, [taskId]: '' }));
  };

  const handleRemoveSubtaskFromTask = (taskId: string, subIndex: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, subtasks: t.subtasks.filter((_, idx) => idx !== subIndex) }
          : t
      )
    );
  };

  const totalEstimatedHours = tasks.reduce(
    (sum, t) => sum + (Number(t.estimatedHours) || 0),
    0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const cleanTasks = tasks.map((t) => ({
      ...t,
      title: t.title.trim() || 'Untitled Task',
      startOffsetDays: Math.max(0, Number(t.startOffsetDays) || 0),
      estimatedDurationDays: Math.max(1, Number(t.estimatedDurationDays) || 1),
      estimatedHours: Math.max(1, Number(t.estimatedHours) || 1),
    }));

    const cleanMilestones = milestones.map((m) => ({
      ...m,
      title: m.title.trim() || 'Untitled Milestone',
      targetOffsetDays: Math.max(1, Number(m.targetOffsetDays) || 1),
    }));

    if (editingTemplate) {
      updateProjectTemplate({
        ...editingTemplate,
        name: name.trim(),
        category,
        description: description.trim(),
        defaultDurationDays: Math.max(1, Number(defaultDurationDays) || 1),
        defaultBudget: Math.max(0, Number(defaultBudget) || 0),
        defaultManagerId,
        tasks: cleanTasks,
        milestones: cleanMilestones,
      });
    } else {
      createProjectTemplate({
        name: name.trim(),
        category,
        description: description.trim(),
        defaultDurationDays: Math.max(1, Number(defaultDurationDays) || 1),
        defaultBudget: Math.max(0, Number(defaultBudget) || 0),
        defaultManagerId,
        tasks: cleanTasks,
        milestones: cleanMilestones,
      });
    }

    onClose();
  };

  return (
    <div
      id="project-template-editor-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="project-template-editor-modal"
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Create Project Template'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Define reusable standard tasks, estimated durations, typical assignees, and milestones.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Template Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Template Name *
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., Enterprise Client Onboarding"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Workflow Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectTemplateCategory)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Project Lead
              </label>
              <select
                value={defaultManagerId}
                onChange={(e) => setDefaultManagerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {state.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Template Overview
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Standardized scope, deliverables, and governance cadence..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Standard Duration (Days)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={defaultDurationDays}
                onChange={(e) => setDefaultDurationDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Baseline Budget (USD)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={defaultBudget}
                onChange={(e) => setDefaultBudget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Section Switcher: Standard Tasks vs Milestones */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setActiveSection('tasks')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  activeSection === 'tasks'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Standard Tasks ({tasks.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('milestones')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  activeSection === 'milestones'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Milestones ({milestones.length})
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
              <span>{tasks.length} tasks</span>
              <span aria-hidden="true">·</span>
              <span>{totalEstimatedHours}h total effort</span>
              <span aria-hidden="true">·</span>
              <span>{milestones.length} milestones</span>
              <span aria-hidden="true">·</span>
              <span>{defaultDurationDays}d cycle</span>
            </div>
          </div>

          {/* Standard Tasks Editor */}
          {activeSection === 'tasks' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure standard tasks, day offsets from kickoff, estimated durations, and typical assignees.
                </p>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Standard Task</span>
                </button>
              </div>

              {tasks.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  No standard tasks added yet. Add at least one task to pre-populate new projects.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {tasks.map((task, idx) => (
                    <div
                      key={task.id}
                      className="p-4 bg-white dark:bg-slate-900 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-5">
                            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                              Task {idx + 1} Title
                            </label>
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) =>
                                handleUpdateTask(task.id, { title: e.target.value })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                              Typical Assignee
                            </label>
                            <select
                              value={task.defaultAssigneeId}
                              onChange={(e) =>
                                handleUpdateTask(task.id, {
                                  defaultAssigneeId: e.target.value,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
                            >
                              {state.users.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                              Priority
                            </label>
                            <select
                              value={task.priority}
                              onChange={(e) =>
                                handleUpdateTask(task.id, {
                                  priority: e.target.value as TaskPriority,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
                            >
                              <option value="urgent">Urgent</option>
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                              Linked Milestone
                            </label>
                            <select
                              value={task.milestoneRefId || ''}
                              onChange={(e) =>
                                handleUpdateTask(task.id, {
                                  milestoneRefId: e.target.value || undefined,
                                })
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
                            >
                              <option value="">None</option>
                              {milestones.map((ms) => (
                                <option key={ms.id} value={ms.id}>
                                  {ms.title}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveTask(task.id)}
                          aria-label={`Remove task ${task.title}`}
                          className="mt-5 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Timing, Duration, Hours & Description */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Scope Notes
                          </label>
                          <input
                            type="text"
                            value={task.description}
                            onChange={(e) =>
                              handleUpdateTask(task.id, { description: e.target.value })
                            }
                            placeholder="Standard deliverable instructions..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Start Day (Offset)
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={365}
                            value={task.startOffsetDays}
                            onChange={(e) =>
                              handleUpdateTask(task.id, {
                                startOffsetDays: Number(e.target.value),
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Duration (Days)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={180}
                            value={task.estimatedDurationDays}
                            onChange={(e) =>
                              handleUpdateTask(task.id, {
                                estimatedDurationDays: Number(e.target.value),
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Est. Effort (Hrs)
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={task.estimatedHours}
                            onChange={(e) =>
                              handleUpdateTask(task.id, {
                                estimatedHours: Number(e.target.value),
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none"
                          />
                        </div>

                        <div className="sm:col-span-1 flex items-center justify-end pb-1">
                          <label className="inline-flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 dark:text-slate-400">
                            <input
                              type="checkbox"
                              checked={Boolean(task.hipaaPhiSensitive)}
                              onChange={(e) =>
                                handleUpdateTask(task.id, {
                                  hipaaPhiSensitive: e.target.checked,
                                })
                              }
                              className="h-3.5 w-3.5 rounded text-rose-600"
                            />
                            <span>PHI</span>
                          </label>
                        </div>
                      </div>

                      {/* Subtasks inline editor */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/70 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <CheckSquare className="h-3 w-3" />
                          Checklist ({task.subtasks.length}):
                        </span>
                        {task.subtasks.map((st, sIdx) => (
                          <span
                            key={`${task.id}-sub-${sIdx}`}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300"
                          >
                            <span>{st}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubtaskFromTask(task.id, sIdx)}
                              className="text-slate-400 hover:text-rose-500"
                              aria-label="Remove checklist item"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="Add checklist step..."
                            value={subtaskDrafts[task.id] || ''}
                            onChange={(e) =>
                              setSubtaskDrafts((prev) => ({
                                ...prev,
                                [task.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddSubtaskToTask(task.id);
                              }
                            }}
                            className="px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-[11px] w-40 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddSubtaskToTask(task.id)}
                            className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-[11px] font-medium"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Milestones Editor */}
          {activeSection === 'milestones' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Define project checkpoint milestones scheduled relative to project kickoff day.
                </p>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold whitespace-nowrap shrink-0 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Milestone</span>
                </button>
              </div>

              {milestones.length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  No milestones configured yet. Add checkpoint milestones to track key delivery gates.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  {milestones.map((ms, idx) => (
                    <div
                      key={ms.id}
                      className="p-4 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Milestone {idx + 1} Title
                        </label>
                        <input
                          type="text"
                          value={ms.title}
                          onChange={(e) =>
                            handleUpdateMilestone(ms.id, { title: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="sm:col-span-4">
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Gate Criteria / Notes
                        </label>
                        <input
                          type="text"
                          value={ms.description}
                          onChange={(e) =>
                            handleUpdateMilestone(ms.id, { description: e.target.value })
                          }
                          placeholder="Exit criteria..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                          Target Day
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={ms.targetOffsetDays}
                          onChange={(e) =>
                            handleUpdateMilestone(ms.id, {
                              targetOffsetDays: Number(e.target.value),
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                            Owner
                          </label>
                          <select
                            value={ms.ownerId || defaultManagerId}
                            onChange={(e) =>
                              handleUpdateMilestone(ms.id, { ownerId: e.target.value })
                            }
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
                          >
                            {state.users.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name.split(' ')[0]}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(ms.id)}
                          aria-label={`Remove milestone ${ms.title}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium whitespace-nowrap shrink-0 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold whitespace-nowrap shrink-0 shadow-xs transition-colors"
            >
              {editingTemplate ? 'Save Template Changes' : 'Save Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ProjectMilestone,
  ProjectTemplate,
  ProjectTemplateCategory,
  TaskPriority,
} from '../../types';
import { X, Plus, Trash2, CheckSquare, Layers, Calendar } from 'lucide-react';

interface DraftProjectTask {
  draftId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  startOffsetDays: number;
  estimatedDurationDays: number;
  dueDate: string;
  estimatedHours: number;
  assigneeId: string;
  tags: string[];
  hipaaPhiSensitive: boolean;
  subtasks: string[];
}

interface DraftProjectMilestone {
  draftId: string;
  title: string;
  description: string;
  targetOffsetDays: number;
  targetDate: string;
  ownerId: string;
}

function addDaysToIsoDate(baseIsoDate: string, days: number): string {
  const base = new Date(`${baseIsoDate}T12:00:00Z`);
  if (Number.isNaN(base.getTime())) {
    return new Date(Date.now() + days * 86400000).toISOString().split('T')[0];
  }
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().split('T')[0];
}

export const CreateProjectFromTemplateModal: React.FC = () => {
  const {
    state,
    currentUser,
    isNewProjectModalOpen,
    setIsNewProjectModalOpen,
    preselectedTemplateId,
    createProjectFromTemplate,
    createProjectTemplate,
    setCurrentTab,
  } = useApp();

  const todayIso = new Date().toISOString().split('T')[0];

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('blank');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [clientOrDept, setClientOrDept] = useState('');
  const [startDate, setStartDate] = useState(todayIso);
  const [targetDate, setTargetDate] = useState(addDaysToIsoDate(todayIso, 21));
  const [budget, setBudget] = useState(35000);
  const [managerId, setManagerId] = useState(currentUser.id);
  const [description, setDescription] = useState('');

  const [draftMilestones, setDraftMilestones] = useState<DraftProjectMilestone[]>([]);
  const [draftTasks, setDraftTasks] = useState<DraftProjectTask[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'milestones'>('tasks');
  const [saveAsNewTemplate, setSaveAsNewTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const applyTemplateToDraft = (tpl: ProjectTemplate | null, baseStart: string) => {
    if (!tpl) {
      setSelectedTemplateId('blank');
      setName('');
      setCode(`PRJ-${Math.floor(100 + Math.random() * 900)}`);
      setClientOrDept('');
      setTargetDate(addDaysToIsoDate(baseStart, 14));
      setBudget(20000);
      setManagerId(currentUser.id);
      setDescription('');
      setDraftMilestones([
        {
          draftId: `ms-${Date.now()}-1`,
          title: 'Project Kickoff & Scope Sign-Off',
          description: 'Confirm deliverables, schedule, and team assignments.',
          targetOffsetDays: 2,
          targetDate: addDaysToIsoDate(baseStart, 2),
          ownerId: currentUser.id,
        },
      ]);
      setDraftTasks([
        {
          draftId: `tsk-${Date.now()}-1`,
          title: 'Initial Project Setup & Stakeholder Kickoff',
          description: 'Align project timeline and confirm deliverables.',
          priority: 'high',
          startOffsetDays: 0,
          estimatedDurationDays: 3,
          dueDate: addDaysToIsoDate(baseStart, 3),
          estimatedHours: 6,
          assigneeId: currentUser.id,
          tags: ['Kickoff'],
          hipaaPhiSensitive: false,
          subtasks: ['Create project channels', 'Confirm milestone dates'],
        },
      ]);
      return;
    }

    setSelectedTemplateId(tpl.id);
    const shortTag = tpl.name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
    setName(`${tpl.name} — Q4 Initiative`);
    setCode(`${shortTag || 'PRJ'}-${Math.floor(100 + Math.random() * 899)}`);
    setClientOrDept(
      tpl.category === 'Client Onboarding'
        ? 'Enterprise Client Account'
        : tpl.category === 'Software Release'
        ? 'Product & Engineering'
        : 'Compliance & Operations'
    );
    setTargetDate(addDaysToIsoDate(baseStart, tpl.defaultDurationDays));
    setBudget(tpl.defaultBudget);
    setManagerId(tpl.defaultManagerId || currentUser.id);
    setDescription(tpl.description);

    setDraftMilestones(
      tpl.milestones.map((m, idx) => ({
        draftId: `ms-${Date.now()}-${idx}`,
        title: m.title,
        description: m.description,
        targetOffsetDays: m.targetOffsetDays,
        targetDate: addDaysToIsoDate(baseStart, m.targetOffsetDays),
        ownerId: m.ownerId || tpl.defaultManagerId || currentUser.id,
      }))
    );

    setDraftTasks(
      tpl.tasks.map((t, idx) => ({
        draftId: `tsk-${Date.now()}-${idx}`,
        title: t.title,
        description: t.description,
        priority: t.priority,
        startOffsetDays: t.startOffsetDays,
        estimatedDurationDays: t.estimatedDurationDays,
        dueDate: addDaysToIsoDate(baseStart, t.startOffsetDays + t.estimatedDurationDays),
        estimatedHours: t.estimatedHours,
        assigneeId: t.defaultAssigneeId || tpl.defaultManagerId || currentUser.id,
        tags: [...t.tags],
        hipaaPhiSensitive: Boolean(t.hipaaPhiSensitive),
        subtasks: [...t.subtasks],
      }))
    );
  };

  useEffect(() => {
    if (!isNewProjectModalOpen) return;
    const defaultTpl =
      (preselectedTemplateId &&
        state.projectTemplates.find((tpl) => tpl.id === preselectedTemplateId)) ||
      state.projectTemplates[0] ||
      null;
    setStartDate(todayIso);
    setActiveTab('tasks');
    setSaveAsNewTemplate(false);
    setNewTemplateName('');
    applyTemplateToDraft(defaultTpl, todayIso);
  }, [isNewProjectModalOpen, preselectedTemplateId]);

  if (!isNewProjectModalOpen) return null;

  const selectedTemplate =
    state.projectTemplates.find((t) => t.id === selectedTemplateId) || null;

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (selectedTemplate) {
      setTargetDate(addDaysToIsoDate(newStart, selectedTemplate.defaultDurationDays));
    }
    setDraftMilestones((prev) =>
      prev.map((m) => ({
        ...m,
        targetDate: addDaysToIsoDate(newStart, m.targetOffsetDays),
      }))
    );
    setDraftTasks((prev) =>
      prev.map((t) => ({
        ...t,
        dueDate: addDaysToIsoDate(newStart, t.startOffsetDays + t.estimatedDurationDays),
      }))
    );
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'blank') {
      applyTemplateToDraft(null, startDate);
      return;
    }
    const found = state.projectTemplates.find((t) => t.id === templateId) || null;
    applyTemplateToDraft(found, startDate);
  };

  const handleUpdateTask = (draftId: string, patch: Partial<DraftProjectTask>) => {
    setDraftTasks((prev) =>
      prev.map((t) => {
        if (t.draftId !== draftId) return t;
        const next = { ...t, ...patch };
        if (
          patch.estimatedDurationDays !== undefined &&
          patch.dueDate === undefined
        ) {
          next.dueDate = addDaysToIsoDate(
            startDate,
            next.startOffsetDays + Math.max(1, Number(patch.estimatedDurationDays) || 1)
          );
        }
        return next;
      })
    );
  };

  const handleAddCustomTask = () => {
    setDraftTasks((prev) => [
      ...prev,
      {
        draftId: `tsk-${Date.now()}-${prev.length + 1}`,
        title: `Custom Project Task ${prev.length + 1}`,
        description: '',
        priority: 'medium',
        startOffsetDays: 0,
        estimatedDurationDays: 5,
        dueDate: addDaysToIsoDate(startDate, 5),
        estimatedHours: 8,
        assigneeId: managerId,
        tags: ['Custom'],
        hipaaPhiSensitive: false,
        subtasks: [],
      },
    ]);
  };

  const handleRemoveTask = (draftId: string) => {
    setDraftTasks((prev) => prev.filter((t) => t.draftId !== draftId));
  };

  const handleUpdateMilestone = (
    draftId: string,
    patch: Partial<DraftProjectMilestone>
  ) => {
    setDraftMilestones((prev) =>
      prev.map((m) => (m.draftId === draftId ? { ...m, ...patch } : m))
    );
  };

  const handleAddCustomMilestone = () => {
    setDraftMilestones((prev) => [
      ...prev,
      {
        draftId: `ms-${Date.now()}-${prev.length + 1}`,
        title: `Project Milestone ${prev.length + 1}`,
        description: '',
        targetOffsetDays: 10,
        targetDate: targetDate || addDaysToIsoDate(startDate, 10),
        ownerId: managerId,
      },
    ]);
  };

  const handleRemoveMilestone = (draftId: string) => {
    setDraftMilestones((prev) => prev.filter((m) => m.draftId !== draftId));
  };

  const totalHours = draftTasks.reduce((sum, t) => sum + (Number(t.estimatedHours) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const preparedMilestones: ProjectMilestone[] = draftMilestones.map((m, idx) => {
      const owner = state.users.find((u) => u.id === m.ownerId);
      return {
        id: `ms-${Date.now()}-${idx}`,
        title: m.title.trim() || `Milestone ${idx + 1}`,
        description: m.description.trim(),
        targetDate: m.targetDate || targetDate,
        completed: false,
        ownerId: owner?.id || managerId,
        ownerName: owner?.name || currentUser.name,
      };
    });

    const preparedTasks = draftTasks.map((t) => ({
      title: t.title.trim() || 'Untitled Task',
      description: t.description.trim(),
      priority: t.priority,
      status: 'todo' as const,
      dueDate: t.dueDate || targetDate,
      estimatedHours: Number(t.estimatedHours) || 8,
      assigneeId: t.assigneeId,
      tags: t.tags,
      hipaaPhiSensitive: t.hipaaPhiSensitive,
      subtasks: t.subtasks.map((st, sIdx) => ({
        id: `sub-${Date.now()}-${sIdx}`,
        title: st,
        completed: false,
      })),
    }));

    if (saveAsNewTemplate && newTemplateName.trim()) {
      const startMs = new Date(`${startDate}T12:00:00Z`).getTime();
      const targetMs = new Date(`${targetDate}T12:00:00Z`).getTime();
      const computedDuration = Math.max(1, Math.round((targetMs - startMs) / 86400000) || 14);
      const category: ProjectTemplateCategory = selectedTemplate?.category || 'Custom';

      createProjectTemplate({
        name: newTemplateName.trim(),
        category,
        description: description.trim() || `Custom template derived from ${name.trim()}`,
        defaultDurationDays: computedDuration,
        defaultBudget: Number(budget) || 0,
        defaultManagerId: managerId,
        milestones: draftMilestones.map((m, idx) => ({
          id: `tpl-ms-${Date.now()}-${idx}`,
          title: m.title.trim() || `Milestone ${idx + 1}`,
          description: m.description.trim(),
          targetOffsetDays: m.targetOffsetDays,
          ownerId: m.ownerId,
        })),
        tasks: draftTasks.map((t, idx) => ({
          id: `tpl-task-${Date.now()}-${idx}`,
          title: t.title.trim() || `Task ${idx + 1}`,
          description: t.description.trim(),
          priority: t.priority,
          startOffsetDays: t.startOffsetDays,
          estimatedDurationDays: t.estimatedDurationDays,
          estimatedHours: t.estimatedHours,
          defaultAssigneeId: t.assigneeId,
          tags: t.tags,
          hipaaPhiSensitive: t.hipaaPhiSensitive,
          subtasks: t.subtasks,
        })),
      });
    }

    createProjectFromTemplate({
      project: {
        name: name.trim(),
        code: code.trim() || `PRJ-${Math.floor(100 + Math.random() * 899)}`,
        clientOrDept: clientOrDept.trim() || 'Internal Operations',
        startDate,
        targetDate,
        budget: Number(budget) || 0,
        managerId,
        description: description.trim(),
        templateId: selectedTemplate?.id,
        templateName: selectedTemplate?.name,
      },
      tasks: preparedTasks,
      milestones: preparedMilestones,
    });

    setIsNewProjectModalOpen(false);
    setCurrentTab('tasks');
  };

  return (
    <div
      id="create-project-from-template-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={() => setIsNewProjectModalOpen(false)}
    >
      <div
        id="create-project-from-template-modal"
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Layers className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                Create Project from Template
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Select a workflow template to pre-populate tasks, durations, assignees, and milestones, then adjust for this project.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewProjectModalOpen(false)}
            aria-label="Close modal"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Step 1: Template Selection Strip */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-700 dark:text-slate-300">
              Choose Workflow Blueprint
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {state.projectTemplates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleTemplateSelect(tpl.id)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-slate-100'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="font-semibold text-xs truncate">{tpl.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                      {tpl.defaultDurationDays}d · {tpl.tasks.length} tasks · {tpl.milestones.length} milestones
                    </div>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => handleTemplateSelect('blank')}
                className={`text-left p-3 rounded-xl border transition-all ${
                  selectedTemplateId === 'blank'
                    ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 text-slate-900 dark:text-slate-100'
                    : 'border-dashed border-slate-300 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-400 hover:border-slate-400'
                }`}
              >
                <div className="font-semibold text-xs">Blank Project</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Start from scratch with custom dates & milestones
                </div>
              </button>
            </div>
          </div>

          {/* Step 2: Project Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="lg:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Project Name *
              </label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="E.g., Apex Diagnostics Client Onboarding"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Project Code *
              </label>
              <input
                required
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="APX-2026"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono uppercase text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Client / Department
              </label>
              <input
                type="text"
                value={clientOrDept}
                onChange={(e) => setClientOrDept(e.target.value)}
                placeholder="E.g., Apex BioHealth"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kickoff Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Target Completion Date
              </label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Project Manager
              </label>
              <select
                value={managerId}
                onChange={(e) => setManagerId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {state.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Allocated Budget (USD)
              </label>
              <input
                type="number"
                min={0}
                step={500}
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="lg:col-span-4">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Project Scope & Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief summary of deliverables and goals..."
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Step 3: Customize Pre-Populated Tasks & Milestones */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    activeTab === 'tasks'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Pre-Populated Tasks ({draftTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('milestones')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    activeTab === 'milestones'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Project Milestones ({draftMilestones.length})
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                  {draftTasks.length} tasks · {totalHours}h total · {draftMilestones.length} milestones
                </span>
                <button
                  type="button"
                  onClick={activeTab === 'tasks' ? handleAddCustomTask : handleAddCustomMilestone}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium whitespace-nowrap shrink-0 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{activeTab === 'tasks' ? 'Add Task' : 'Add Milestone'}</span>
                </button>
              </div>
            </div>

            {activeTab === 'tasks' && (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3 min-w-[230px]">Task Deliverable</th>
                      <th className="py-2.5 px-3 min-w-[155px]">Assignee</th>
                      <th className="py-2.5 px-3 w-28">Priority</th>
                      <th className="py-2.5 px-3 w-24 text-right">Duration (d)</th>
                      <th className="py-2.5 px-3 w-24 text-right">Effort (h)</th>
                      <th className="py-2.5 px-3 w-36">Due Date</th>
                      <th className="py-2.5 px-3 w-12 text-center">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {draftTasks.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                          No tasks in this project yet. Click "Add Task" above to include deliverables.
                        </td>
                      </tr>
                    ) : (
                      draftTasks.map((task) => (
                        <tr
                          key={task.draftId}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                        >
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) =>
                                handleUpdateTask(task.draftId, { title: e.target.value })
                              }
                              className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            {task.subtasks.length > 0 && (
                              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                                <CheckSquare className="h-3 w-3 shrink-0" />
                                <span className="truncate">
                                  {task.subtasks.length} checklist items pre-loaded
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={task.assigneeId}
                              onChange={(e) =>
                                handleUpdateTask(task.draftId, { assigneeId: e.target.value })
                              }
                              className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                            >
                              {state.users.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={task.priority}
                              onChange={(e) =>
                                handleUpdateTask(task.draftId, {
                                  priority: e.target.value as TaskPriority,
                                })
                              }
                              className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                            >
                              <option value="urgent">Urgent</option>
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min={1}
                              max={180}
                              value={task.estimatedDurationDays}
                              onChange={(e) =>
                                handleUpdateTask(task.draftId, {
                                  estimatedDurationDays: Number(e.target.value),
                                })
                              }
                              className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min={1}
                              max={500}
                              value={task.estimatedHours}
                              onChange={(e) =>
                                handleUpdateTask(task.draftId, {
                                  estimatedHours: Number(e.target.value),
                                })
                              }
                              className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="date"
                              value={task.dueDate}
                              onChange={(e) =>
                                handleUpdateTask(task.draftId, { dueDate: e.target.value })
                              }
                              className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none"
                            />
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveTask(task.draftId)}
                              aria-label={`Remove ${task.title}`}
                              className="p-1 rounded text-slate-400 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'milestones' && (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {draftMilestones.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    No milestones defined for this project yet.
                  </div>
                ) : (
                  draftMilestones.map((ms) => (
                    <div
                      key={ms.draftId}
                      className="p-3.5 bg-white dark:bg-slate-900 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                    >
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={ms.title}
                          onChange={(e) =>
                            handleUpdateMilestone(ms.draftId, { title: e.target.value })
                          }
                          placeholder="Milestone title"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-medium focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={ms.description}
                          onChange={(e) =>
                            handleUpdateMilestone(ms.draftId, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Gate criteria..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 focus:outline-none"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <select
                          value={ms.ownerId}
                          onChange={(e) =>
                            handleUpdateMilestone(ms.draftId, { ownerId: e.target.value })
                          }
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                          {state.users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2">
                        <input
                          type="date"
                          value={ms.targetDate}
                          onChange={(e) =>
                            handleUpdateMilestone(ms.draftId, { targetDate: e.target.value })
                          }
                          className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono tabular-nums text-slate-900 dark:text-slate-100 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveMilestone(ms.draftId)}
                          aria-label={`Remove milestone ${ms.title}`}
                          className="p-1 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Save Adjustments as Reusable Template Option */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
              <input
                type="checkbox"
                checked={saveAsNewTemplate}
                onChange={(e) => setSaveAsNewTemplate(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Save this customized setup as a new reusable project template</span>
            </label>

            {saveAsNewTemplate && (
              <input
                type="text"
                required={saveAsNewTemplate}
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="New template name..."
                className="sm:w-64 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            )}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Calendar className="h-3.5 w-3.5" />
              <span className="font-mono tabular-nums">
                {startDate} → {targetDate}
              </span>
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={() => setIsNewProjectModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium whitespace-nowrap shrink-0 transition-colors"
              >
                Cancel
              </button>
              <button
                id="launch-project-from-template-btn"
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold whitespace-nowrap shrink-0 shadow-xs transition-colors"
              >
                Launch Project ({draftTasks.length} Tasks)
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

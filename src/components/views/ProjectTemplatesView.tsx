import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ProjectTemplate, ProjectTemplateCategory } from '../../types';
import { ProjectTemplateEditorModal } from '../modals/ProjectTemplateEditorModal';
import {
  Plus,
  Search,
  Copy,
  Edit3,
  Trash2,
  ArrowRight,
  Layers,
  Flag,
  CheckSquare,
  Clock,
} from 'lucide-react';

const CATEGORY_FILTERS: Array<'All' | ProjectTemplateCategory> = [
  'All',
  'Client Onboarding',
  'Software Release',
  'Compliance Audit',
  'Manufacturing Launch',
  'Custom',
];

export const ProjectTemplatesView: React.FC = () => {
  const {
    state,
    openNewProjectFromTemplate,
    createProjectTemplate,
    deleteProjectTemplate,
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<'All' | ProjectTemplateCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    state.projectTemplates[0]?.id || null
  );
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);

  const filteredTemplates = state.projectTemplates.filter((tpl) => {
    const matchesCategory =
      selectedCategory === 'All' || tpl.category === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      tpl.name.toLowerCase().includes(q) ||
      tpl.description.toLowerCase().includes(q) ||
      tpl.category.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const activeTemplate =
    filteredTemplates.find((t) => t.id === selectedTemplateId) ||
    filteredTemplates[0] ||
    null;

  const userMap = new Map(state.users.map((u) => [u.id, u]));

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (tpl: ProjectTemplate) => {
    setEditingTemplate(tpl);
    setIsEditorOpen(true);
  };

  const handleDuplicate = (tpl: ProjectTemplate) => {
    const duplicated = createProjectTemplate({
      name: `${tpl.name} (Copy)`,
      category: tpl.category,
      description: tpl.description,
      defaultDurationDays: tpl.defaultDurationDays,
      defaultBudget: tpl.defaultBudget,
      defaultManagerId: tpl.defaultManagerId,
      tasks: JSON.parse(JSON.stringify(tpl.tasks)),
      milestones: JSON.parse(JSON.stringify(tpl.milestones)),
    });
    setSelectedTemplateId(duplicated.id);
  };

  const handleDelete = (tpl: ProjectTemplate) => {
    deleteProjectTemplate(tpl.id);
    if (activeTemplate?.id === tpl.id) {
      const remaining = state.projectTemplates.filter((t) => t.id !== tpl.id);
      setSelectedTemplateId(remaining[0]?.id || null);
    }
  };

  const totalEffortHours = (tpl: ProjectTemplate) =>
    tpl.tasks.reduce((sum, task) => sum + (Number(task.estimatedHours) || 0), 0);

  return (
    <div id="project-templates-view" className="space-y-5">
      {/* Toolbar: Search, Category Filters & New Template CTA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-x-auto">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          id="create-project-template-btn"
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 shadow-xs transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Template</span>
        </button>
      </div>

      {/* Main Split View: Template Directory (Left) & Blueprint Details (Right) */}
      {filteredTemplates.length === 0 ? (
        <div className="p-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
          <div className="mx-auto h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <Layers className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            No matching project templates
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Create a customizable blueprint with standard tasks, durations, typical assignees, and milestones to streamline repeatable workflows.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create First Template</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Template Catalog List */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {filteredTemplates.map((tpl) => {
              const isSelected = activeTemplate?.id === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedTemplateId(tpl.id)}
                  className={`w-full text-left p-4 transition-colors ${
                    isSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/35'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {tpl.name}
                    </h3>
                    <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                      {tpl.defaultDurationDays}d
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {tpl.description || 'Customizable project workflow template'}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    <span>{tpl.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{tpl.tasks.length} tasks</span>
                    <span aria-hidden="true">·</span>
                    <span>{tpl.milestones.length} milestones</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Blueprint Inspector */}
          {activeTemplate && (
            <div className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span>{activeTemplate.category}</span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>Managed by {userMap.get(activeTemplate.defaultManagerId)?.name || activeTemplate.createdBy}</span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">Used {activeTemplate.usageCount} times</span>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {activeTemplate.name}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                    {activeTemplate.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(activeTemplate)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 transition-colors"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(activeTemplate)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap shrink-0 transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Duplicate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(activeTemplate)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 whitespace-nowrap shrink-0 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                  <button
                    id="use-selected-template-btn"
                    type="button"
                    onClick={() => openNewProjectFromTemplate(activeTemplate.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 shadow-xs transition-colors"
                  >
                    <span>Use This Template</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Blueprint Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/30">
                <div className="p-4">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Standard Duration</div>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                    {activeTemplate.defaultDurationDays} Days
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Estimated Effort</div>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                    {totalEffortHours(activeTemplate)} Hours
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Baseline Budget</div>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                    ${activeTemplate.defaultBudget.toLocaleString()}
                  </div>
                </div>
                <div className="p-4">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">Pre-Populated Scope</div>
                  <div className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                    {activeTemplate.tasks.length} Tasks / {activeTemplate.milestones.length} Gates
                  </div>
                </div>
              </div>

              {/* Milestones Sequence */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Flag className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Standard Milestones</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {activeTemplate.milestones.length} checkpoints
                  </span>
                </div>

                {activeTemplate.milestones.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No milestones configured in this template.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {activeTemplate.milestones.map((ms) => {
                      const owner = ms.ownerId ? userMap.get(ms.ownerId) : undefined;
                      return (
                        <div
                          key={ms.id}
                          className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {ms.title}
                            </div>
                            {ms.description && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {ms.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 shrink-0 font-mono tabular-nums">
                            <span>{owner ? owner.name : 'Project Manager'}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              Day {ms.targetOffsetDays}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Standard Tasks Table */}
              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <CheckSquare className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Standard Tasks & Typical Assignees</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Automatically assigned and dated on project creation
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="py-2.5 px-3">Task Deliverable</th>
                        <th className="py-2.5 px-3">Typical Assignee</th>
                        <th className="py-2.5 px-3">Priority</th>
                        <th className="py-2.5 px-3 text-right">Window</th>
                        <th className="py-2.5 px-3 text-right">Effort</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {activeTemplate.tasks.map((task) => {
                        const assignee = userMap.get(task.defaultAssigneeId);
                        return (
                          <tr
                            key={task.id}
                            className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30"
                          >
                            <td className="py-3 px-3">
                              <div className="font-medium text-slate-900 dark:text-slate-100">
                                {task.title}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {task.description || 'Standard deliverable'}
                                {task.subtasks.length > 0 && (
                                  <span> · {task.subtasks.length} checklist items</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              {assignee ? (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={assignee.avatar}
                                    alt={assignee.name}
                                    referrerPolicy="no-referrer"
                                    className="h-5 w-5 rounded-full object-cover"
                                  />
                                  <span className="text-slate-700 dark:text-slate-300">
                                    {assignee.name}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-slate-400">Unassigned</span>
                              )}
                            </td>
                            <td className="py-3 px-3 capitalize text-slate-700 dark:text-slate-300">
                              {task.priority}
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              Day {task.startOffsetDays}–{task.startOffsetDays + task.estimatedDurationDays} ({task.estimatedDurationDays}d)
                            </td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3 text-slate-400" />
                                {task.estimatedHours}h
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Create / Edit Modal */}
      <ProjectTemplateEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        editingTemplate={editingTemplate}
      />
    </div>
  );
};

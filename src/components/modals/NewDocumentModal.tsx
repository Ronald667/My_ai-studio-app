import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, FileText, ShieldCheck, ShieldAlert } from 'lucide-react';

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewDocumentModal: React.FC<NewDocumentModalProps> = ({ isOpen, onClose }) => {
  const { createDocument, currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'SOP' | 'Compliance' | 'Meeting Notes' | 'Policy'>('SOP');
  const [content, setContent] = useState('# Title\n\n## Objective\nDescribe purpose...\n\n## Procedures\n1. Step 1\n2. Step 2\n');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [phiFlag, setPhiFlag] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createDocument({
      title: title.trim(),
      category,
      content,
      isEncrypted,
      phiFlag,
    });

    onClose();
  };

  return (
    <div
      id="new-document-modal-overlay"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        id="new-document-modal-card"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-500" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Create Enterprise Document / SOP
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Document Title *
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.g., SOP-701: Cleanroom Sanitization Procedure"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none"
            >
              <option value="SOP">Standard Operating Procedure (SOP)</option>
              <option value="Compliance">Regulatory Compliance</option>
              <option value="Meeting Notes">Executive Meeting Notes</option>
              <option value="Policy">Security & Privacy Policy</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Initial Markdown Template Content
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 cursor-pointer">
              <input
                type="checkbox"
                checked={isEncrypted}
                onChange={(e) => setIsEncrypted(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-[11px]">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  AES-256 Encrypted
                </span>
                <span className="text-slate-400">At-rest encryption</span>
              </div>
            </label>

            <label className="flex items-center gap-2 p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 cursor-pointer">
              <input
                type="checkbox"
                checked={phiFlag}
                onChange={(e) => setPhiFlag(e.target.checked)}
                className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500"
              />
              <div className="text-[11px]">
                <span className="font-semibold text-rose-600 dark:text-rose-400 block">
                  HIPAA ePHI Data
                </span>
                <span className="text-slate-400">Audit trail logging</span>
              </div>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
            >
              Save Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

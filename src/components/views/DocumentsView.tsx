import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DocumentItem } from '../../types';
import {
  FileText,
  Lock,
  Unlock,
  ShieldCheck,
  ShieldAlert,
  History,
  Eye,
  Edit3,
  Plus,
  Save,
  Search,
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';

interface DocumentsViewProps {
  onOpenNewDocument: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ onOpenNewDocument }) => {
  const {
    t,
    state,
    selectedDocId,
    setSelectedDocId,
    updateDocument,
    toggleDocLock,
    currentUser,
    hasPermission,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [editorContent, setEditorContent] = useState<string>('');
  const [editorTitle, setEditorTitle] = useState<string>('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const selectedDoc =
    state.documents.find((d) => d.id === selectedDocId) || state.documents[0];

  // Sync editor content when selected document changes
  React.useEffect(() => {
    if (selectedDoc) {
      setEditorContent(selectedDoc.content);
      setEditorTitle(selectedDoc.title);
      setHasUnsavedChanges(false);
    }
  }, [selectedDoc?.id]);

  const filteredDocs = state.documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const isLockedByOther =
    selectedDoc?.lockedBy && selectedDoc.lockedBy.id !== currentUser.id;
  const isLockedByMe =
    selectedDoc?.lockedBy && selectedDoc.lockedBy.id === currentUser.id;

  const handleSave = () => {
    if (!selectedDoc) return;
    updateDocument({
      id: selectedDoc.id,
      title: editorTitle,
      content: editorContent,
    });
    setHasUnsavedChanges(false);
  };

  return (
    <div
      id="documents-view"
      className="flex h-[calc(100vh-140px)] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden animate-in fade-in duration-150"
    >
      {/* Left Sidebar: Document Catalog */}
      <div className="w-72 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-950/40">
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-indigo-500" />
            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Documents & SOPs
            </span>
          </div>
          <button
            onClick={onOpenNewDocument}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs shadow-xs"
            title="New Document"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-2 space-y-2 border-b border-slate-200 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1 text-[10px]">
            {['all', 'SOP', 'Compliance', 'Meeting Notes', 'Policy'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded-md font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Document Items List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
          {filteredDocs.map((doc) => {
            const isSelected = selectedDoc?.id === doc.id;
            return (
              <div
                key={doc.id}
                onClick={() => setSelectedDocId(doc.id)}
                className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="text-[10px] font-semibold text-indigo-500 uppercase">
                    {doc.category}
                  </span>
                  <div className="flex items-center gap-1">
                    {doc.phiFlag && (
                      <span className="px-1 py-0.2 rounded bg-rose-500/10 text-rose-500 text-[9px] font-bold">
                        PHI
                      </span>
                    )}
                    {doc.lockedBy && (
                      <span title={`Locked by ${doc.lockedBy.name}`}>
                        <Lock className="h-3 w-3 text-amber-500" />
                      </span>
                    )}
                  </div>
                </div>

                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate mb-1">
                  {doc.title}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>v{doc.version}</span>
                  <span>{new Date(doc.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center/Right: Document Collaborative Workspace */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900">
        {selectedDoc ? (
          <>
            {/* Document Header & Security Toolbar */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/30">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={editorTitle}
                  disabled={isLockedByOther}
                  onChange={(e) => {
                    setEditorTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full bg-transparent font-bold text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                />
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 pl-1">
                  <span>Last modified by {selectedDoc.authorName}</span>
                  <span>•</span>
                  <span>Version {selectedDoc.version}</span>
                  {selectedDoc.isEncrypted && (
                    <span className="flex items-center gap-1 text-emerald-500 font-medium">
                      <ShieldCheck className="h-3 w-3" />
                      AES-256 Encrypted
                    </span>
                  )}
                  {selectedDoc.phiFlag && (
                    <span className="flex items-center gap-1 text-rose-500 font-bold">
                      <ShieldAlert className="h-3 w-3" />
                      HIPAA PHI Governed
                    </span>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2">
                {/* Lock/Unlock Exclusive Edit */}
                <button
                  type="button"
                  onClick={() => toggleDocLock(selectedDoc.id, !isLockedByMe)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    isLockedByMe
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                  title={isLockedByMe ? 'Release exclusive lock' : 'Acquire exclusive edit lock'}
                >
                  {isLockedByMe ? (
                    <>
                      <Lock className="h-3.5 w-3.5 text-amber-500" />
                      <span>Locked by You</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3.5 w-3.5" />
                      <span>Lock to Edit</span>
                    </>
                  )}
                </button>

                {/* Preview / Edit Toggle */}
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {isPreviewMode ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  <span>{isPreviewMode ? 'Edit' : 'Preview'}</span>
                </button>

                {/* Version History Toggle */}
                <button
                  type="button"
                  onClick={() => setShowVersionHistory(!showVersionHistory)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <History className="h-3.5 w-3.5" />
                  <span>History ({selectedDoc.versions.length})</span>
                </button>

                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || isLockedByOther}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                    hasUnsavedChanges && !isLockedByOther
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>

            {/* Lock warning banner if locked by someone else */}
            {isLockedByOther && (
              <div className="p-2.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-500 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  Locked for exclusive collaborative editing by {selectedDoc.lockedBy?.name}. Read-only until released.
                </span>
              </div>
            )}

            {/* Main Editor Body & Version Drawer */}
            <div className="flex-1 flex overflow-hidden">
              {/* Content Area */}
              <div className="flex-1 p-6 overflow-y-auto font-sans">
                {isPreviewMode ? (
                  <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed space-y-3 whitespace-pre-wrap">
                    {editorContent}
                  </div>
                ) : (
                  <textarea
                    value={editorContent}
                    disabled={isLockedByOther}
                    onChange={(e) => {
                      setEditorContent(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="Enter document text or Markdown..."
                    className="w-full h-full bg-transparent font-mono text-xs text-slate-800 dark:text-slate-200 resize-none focus:outline-none leading-relaxed"
                  />
                )}
              </div>

              {/* Version History Sidebar Drawer */}
              {showVersionHistory && (
                <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 overflow-y-auto space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                      Version Audit Trail
                    </span>
                    <button
                      onClick={() => setShowVersionHistory(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Close
                    </button>
                  </div>

                  <div className="p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-xs">
                    <div className="flex items-center justify-between font-bold text-indigo-700 dark:text-indigo-300">
                      <span>Current Active (v{selectedDoc.version})</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {selectedDoc.authorName} • {new Date(selectedDoc.lastModified).toLocaleDateString()}
                    </p>
                  </div>

                  {selectedDoc.versions.map((ver) => (
                    <div
                      key={ver.version}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          Version {ver.version}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ver.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {ver.summary}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 truncate">
                        Author: {ver.authorName}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
            <FileText className="h-8 w-8 opacity-20 mb-2" />
            <span>Select a document to open collaborative workspace</span>
          </div>
        )}
      </div>
    </div>
  );
};

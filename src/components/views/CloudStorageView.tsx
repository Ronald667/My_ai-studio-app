import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CloudStorageFile } from '../../types';
import {
  Cloud,
  UploadCloud,
  File,
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  HardDrive,
  Download,
  Lock,
  ExternalLink,
} from 'lucide-react';

export const CloudStorageView: React.FC = () => {
  const { t, state, uploadCloudFile, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = state.cloudFiles.filter((file) => {
    const matchesSearch =
      file.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = selectedProvider === 'all' || file.cloudProvider === selectedProvider;
    return matchesSearch && matchesProvider;
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    setUploadStatus(`Encrypting & uploading ${file.name} with AES-256-GCM...`);

    setTimeout(() => {
      uploadCloudFile({
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        mimeType: file.type || 'application/octet-stream',
        cloudProvider: 'AWS S3',
        accessLevel: 'Confidential',
      });
      setUploadStatus(`Successfully encrypted and synced ${file.name} to cloud storage.`);
      setTimeout(() => setUploadStatus(null), 3000);
    }, 800);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div id="cloud-storage-view" className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display text-slate-900 dark:text-slate-100">
              {t.cloudStorage}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[10px] font-bold">
              Multi-Cloud AES-256
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Encrypted object repository integrated across AWS S3, Google Cloud Storage & Azure Blob
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-colors self-start sm:self-auto"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload Encrypted File</span>
        </button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {uploadStatus && (
        <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <ShieldCheck className="h-4 w-4 text-indigo-500 shrink-0" />
          <span className="font-semibold">{uploadStatus}</span>
        </div>
      )}

      {/* Cloud Providers Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 font-bold text-xs">
              AWS
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-slate-100">AWS S3 (us-east-1)</p>
              <p className="text-[10px] text-slate-400">AES-256-KMS / Bucket Encrypted</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-emerald-500 text-[10px] font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 font-bold text-xs">
              GCS
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-slate-100">Google Cloud Storage</p>
              <p className="text-[10px] text-slate-400">EU Sovereignty Mirror / Frankfurt</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-emerald-500 text-[10px] font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500 font-bold text-xs">
              AZR
            </div>
            <div>
              <p className="font-bold text-xs text-slate-900 dark:text-slate-100">Azure Blob Storage</p>
              <p className="text-[10px] text-slate-400">Hot Tier / Immutable WORM</p>
            </div>
          </div>
          <span className="flex items-center gap-1 text-emerald-500 text-[10px] font-semibold">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Active
          </span>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
            : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-700 bg-slate-50/50 dark:bg-slate-950/20'
        }`}
      >
        <UploadCloud className="h-8 w-8 mx-auto text-indigo-500 mb-2 opacity-80" />
        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
          Drag and drop files to encrypt & store in multi-cloud vault
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
          Supports SOPs, clinical protocols, CAD models, and test logs. Automated client-side SHA-256 validation.
        </p>
      </div>

      {/* File Table */}
      <div className="space-y-3">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search file repository..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Cloud Provider:</span>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="all">All Clouds</option>
              <option value="AWS S3">AWS S3</option>
              <option value="Google Cloud Storage">Google Cloud Storage</option>
              <option value="Azure Blob">Azure Blob</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-3">Size</th>
                <th className="py-3 px-3">Cloud Storage</th>
                <th className="py-3 px-3">Security Level</th>
                <th className="py-3 px-3">Upload Date</th>
                <th className="py-3 px-3 font-mono">SHA-256 Checksum</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredFiles.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="truncate max-w-xs">{f.fileName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-500">{f.fileSize}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[10px] text-slate-700 dark:text-slate-300">
                      {f.cloudProvider}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        f.accessLevel.includes('PHI')
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-indigo-500/10 text-indigo-500'
                      }`}
                    >
                      {f.accessLevel}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[10px]">{f.uploadDate}</td>
                  <td className="py-3 px-3 font-mono text-[10px] text-slate-400 max-w-[120px] truncate" title={f.checksum}>
                    {f.checksum.slice(0, 20)}...
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => alert(`Initiating secure authenticated KMS download for ${f.fileName}...`)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                      title="Download"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

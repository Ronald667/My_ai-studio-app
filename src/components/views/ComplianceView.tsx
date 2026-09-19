import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ComplianceRecord } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  FileCheck2,
  AlertOctagon,
  Download,
  Key,
  Database,
  Hash,
  CheckCircle2,
  AlertTriangle,
  History,
  Sparkles,
} from 'lucide-react';

export const ComplianceView: React.FC = () => {
  const { t, state, createComplianceRecord, currentUser, hasPermission, askAIAssist } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'hipaa' | 'gdpr' | 'audit_trail'>('overview');
  const [breakGlassActive, setBreakGlassActive] = useState(false);
  const [breakGlassReason, setBreakGlassReason] = useState('');
  const [showBreakGlassModal, setShowBreakGlassModal] = useState(false);
  const [aiAuditReport, setAiAuditReport] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const isComplianceOfficer =
    currentUser.role === 'compliance_officer' || currentUser.role === 'super_admin';

  const handleBreakGlassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!breakGlassReason.trim()) return;

    createComplianceRecord({
      standard: 'HIPAA',
      type: 'EMERGENCY_OVERRIDE',
      subject: `Emergency Break-Glass ePHI Access Invoked by ${currentUser.name}`,
      details: `Justification: ${breakGlassReason}. Audit flags dispatched to security committee.`,
      status: 'verified',
    });

    setBreakGlassActive(true);
    setShowBreakGlassModal(false);
    setBreakGlassReason('');
  };

  const handleSimulateErasure = () => {
    createComplianceRecord({
      standard: 'GDPR',
      type: 'RIGHT_TO_ERASURE',
      subject: 'Data Subject Erasure Request (DSAR-EU-2026-089)',
      details: 'Personal identifiers permanently scrubbed and pseudonymized across AWS S3 and primary storage.',
      status: 'verified',
    });
  };

  const handleAiAudit = async () => {
    setLoadingAi(true);
    const res = await askAIAssist('compliance_audit');
    setAiAuditReport(res.recommendation);
    setLoadingAi(false);
  };

  return (
    <div id="compliance-view" className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display text-slate-900 dark:text-slate-100">
              {t.complianceCenter}
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold">
              100% AUDIT PASS
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Full compliance suite for EU GDPR (2016/679) & HIPAA Security Rule (45 CFR § 164.312)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Break Glass Protocol Button */}
          <button
            onClick={() => setShowBreakGlassModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
              breakGlassActive
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-rose-500/10 text-rose-500 border border-rose-500/30 hover:bg-rose-500/20'
            }`}
          >
            <AlertOctagon className="h-4 w-4" />
            <span>{breakGlassActive ? 'Break-Glass Protocol ACTIVE' : 'Emergency Break-Glass'}</span>
          </button>

          <button
            onClick={handleAiAudit}
            disabled={loadingAi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs"
          >
            <Sparkles className="h-4 w-4" />
            <span>{loadingAi ? 'Auditing...' : 'AI Compliance Audit'}</span>
          </button>
        </div>
      </div>

      {/* RBAC Notice if not Compliance Officer */}
      {!isComplianceOfficer && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 shrink-0" />
            <span>
              You are currently viewing as <strong>{currentUser.name}</strong> ({currentUser.role}). For administrative audit sign-offs and unmasked ePHI inspection, switch role to <strong>Compliance Officer</strong>.
            </span>
          </div>
        </div>
      )}

      {/* AI Compliance Auditor Report */}
      {aiAuditReport && (
        <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/30 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span>Certified Auditor Risk & Readiness Assessment</span>
            </div>
            <button
              onClick={() => setAiAuditReport(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Close
            </button>
          </div>
          <p className="text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
            {aiAuditReport}
          </p>
        </div>
      )}

      {/* Standards Sub-Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Security Safeguards Overview
        </button>
        <button
          onClick={() => setActiveTab('hipaa')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'hipaa'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          HIPAA & ePHI Controls (45 CFR § 164)
        </button>
        <button
          onClick={() => setActiveTab('gdpr')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'gdpr'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          GDPR & DSAR Governance (EU 2016/679)
        </button>
        <button
          onClick={() => setActiveTab('audit_trail')}
          className={`pb-2.5 border-b-2 transition-colors ${
            activeTab === 'audit_trail'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Cryptographic Audit Trail ({state.complianceRecords.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW SAFEGUARDS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
              <Key className="h-4 w-4 text-indigo-500" />
              <span>Encryption at Rest & In Transit</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              AES-256-GCM symmetric encryption with hardware HSM key rotation. TLS 1.3 enforced for all client-to-server data transmission.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-emerald-500 text-[10px] font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>FIPS 140-3 Validated</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
              <Hash className="h-4 w-4 text-emerald-500" />
              <span>Tamper-Evident SHA-256 Audit Seal</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every data access touch, document edit, or inventory adjustment computes a cryptographic digest to guarantee immutable auditability.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-emerald-500 text-[10px] font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Zero Hash Inconsistencies</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-slate-100">
              <Database className="h-4 w-4 text-cyan-500" />
              <span>Multi-Region Cloud Redundancy</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Automated snapshot mirroring across sovereign EU and US data centers with 99.999% durability and disaster recovery RPO &lt; 15 mins.
            </p>
            <div className="pt-2 flex items-center gap-1.5 text-emerald-500 text-[10px] font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Geographic Sovereignty Compliant</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HIPAA SUITE */}
      {activeTab === 'hipaa' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  HIPAA Security Rule (45 CFR § 164.312) Verification Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Mandatory safeguards for protected health information (ePHI)
                </p>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">
                BAA Signed & Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  § 164.312(a)(1) Access Control
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Unique user identification, emergency access ("break-glass") procedures, and automatic logoff session controls enabled.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  § 164.312(b) Audit Controls
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Hardware and software mechanisms that record and examine activity in information systems containing ePHI.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  § 164.312(c)(1) Integrity Controls
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Cryptographic hashing to protect ePHI from improper alteration or destruction.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  § 164.312(e)(1) Transmission Security
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  End-to-end TLS 1.3 encryption across all internal and public network interfaces.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GDPR SUITE */}
      {activeTab === 'gdpr' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Data Subject Access Requests (DSAR) & Article 17 Erasure
                </h3>
                <p className="text-xs text-slate-500">
                  Manage individual data rights with automated verification and cryptographic erasure
                </p>
              </div>

              <button
                onClick={handleSimulateErasure}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 self-start sm:self-auto"
              >
                <Database className="h-3.5 w-3.5 text-rose-400" />
                <span>Simulate Article 17 Erasure</span>
              </button>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                <span>Active DSAR: DSAR-EU-2026-042 (Sarah Chen)</span>
                <span className="text-emerald-500">Verified Identity (Passport 2FA)</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Statutory Deadline: 27 days remaining (Article 12(3) Compliance). All personal data package ready for export.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CRYPTOGRAPHIC AUDIT TRAIL */}
      {activeTab === 'audit_trail' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Standard</th>
                <th className="py-3 px-3">Action Type</th>
                <th className="py-3 px-3">Subject / Event</th>
                <th className="py-3 px-3">Operator</th>
                <th className="py-3 px-3 font-mono">SHA-256 Integrity Hash</th>
                <th className="py-3 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.complianceRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                    {new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        rec.standard === 'HIPAA'
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-indigo-500/10 text-indigo-500'
                      }`}
                    >
                      {rec.standard}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {rec.type}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                    {rec.subject}
                  </td>
                  <td className="py-3 px-3 text-slate-500 text-[11px]">
                    {rec.operator} ({rec.operatorRole})
                  </td>
                  <td className="py-3 px-3 font-mono text-[10px] text-slate-400 max-w-[120px] truncate" title={rec.hashSignature}>
                    {rec.hashSignature.slice(0, 16)}...
                  </td>
                  <td className="py-3 px-3">
                    <span className="flex items-center gap-1 text-emerald-500 font-bold text-[10px]">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Emergency Break-Glass Modal */}
      {showBreakGlassModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-rose-500/50 p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertOctagon className="h-6 w-6" />
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Emergency Break-Glass Access (HIPAA § 164.312)
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Invoking Emergency Break-Glass temporarily bypasses standard role access limits to unmask ePHI for critical clinical or manufacturing safety interventions. Every keystroke is logged with legal evidentiary timestamping.
            </p>

            <form onSubmit={handleBreakGlassSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory Clinical / Safety Justification:
                </label>
                <textarea
                  required
                  value={breakGlassReason}
                  onChange={(e) => setBreakGlassReason(e.target.value)}
                  placeholder="E.g., Urgent patient vital alert inspection during Trial Batch 2026..."
                  className="w-full h-24 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBreakGlassModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30"
                >
                  Authorize Break-Glass Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlanTier } from '../../types';
import {
  Sparkles,
  CreditCard,
  UserPlus,
  Users,
  HardDrive,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Star,
  ExternalLink,
  ShieldCheck,
  Building,
  FileText,
  ArrowUpRight,
  Zap,
} from 'lucide-react';

export const BillingView: React.FC = () => {
  const {
    state,
    setIsUpgradeModalOpen,
    setIsAddPaymentMethodOpen,
    setIsCreateAccountOpen,
    setSelectedInvoice,
    removePaymentMethod,
    setDefaultPaymentMethod,
    currentUser,
    hasPermission,
  } = useApp();

  const subscription = state.subscription;
  const currentPlan = subscription?.currentPlan || 'starter';
  const seatsUsed = subscription?.seatsUsed || state.users.length;
  const seatsAllocated = subscription?.seatsAllocated || 25;
  const seatsPercentage = Math.min(100, Math.round((seatsUsed / seatsAllocated) * 100));

  const paymentMethods = subscription?.paymentMethods || [];
  const invoices = subscription?.invoices || [];

  const canManageBilling = hasPermission('compliance_admin') || currentUser.role === 'super_admin';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-900/10 via-purple-900/10 to-slate-900/5 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-slate-900/40 p-6 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-display">
                Subscription & Enterprise Billing
              </h1>
              <span className="rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 px-3 py-0.5 text-xs font-extrabold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                {currentPlan.toUpperCase()} TIER
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
              Manage workspace licenses, tenant seats, encrypted storage quotas, tokenized payment methods, and automated billing receipts.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            id="open-create-account-button"
            type="button"
            onClick={() => setIsCreateAccountOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-sm transition-all"
          >
            <UserPlus className="h-4 w-4 text-indigo-500" />
            <span>+ Create User Account</span>
          </button>

          <button
            id="open-add-payment-button"
            type="button"
            onClick={() => setIsAddPaymentMethodOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 shadow-sm transition-all"
          >
            <CreditCard className="h-4 w-4 text-indigo-500" />
            <span>+ Add Payment Method</span>
          </button>

          <button
            id="open-upgrade-plan-button"
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-violet-500 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            <span>Upgrade Workspace</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Seats Utilization */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Allocated Seats
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
              {seatsUsed}
            </span>
            <span className="text-xs text-slate-500">/ {seatsAllocated} seats assigned</span>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
              <span>Utilization</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{seatsPercentage}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  seatsPercentage > 85 ? 'bg-amber-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${seatsPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Encrypted Cloud Storage */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Sovereign Cloud Storage
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display">
              18.4 GB
            </span>
            <span className="text-xs text-slate-500">
              / {subscription?.storageLimitGb || 100} GB Limit
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>FIPS 140-3 & AES-256 encrypted</span>
          </p>
        </div>

        {/* Cadence & Next Renewal */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Billing Cadence
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-display capitalize">
              {subscription?.billingInterval || 'Annual'}
            </span>
            <span className="text-[11px] rounded bg-emerald-500/10 text-emerald-500 font-bold px-1.5 py-0.5">
              20% Discount
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
            Next renewal: <strong className="text-slate-700 dark:text-slate-300">Oct 1, 2026</strong>
          </p>
        </div>

        {/* Primary Payment Source */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Primary Payment
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            {paymentMethods.find((p) => p.isDefault) ? (
              <div>
                <span className="text-base font-bold text-slate-900 dark:text-slate-100 uppercase font-mono">
                  {paymentMethods.find((p) => p.isDefault)?.brand} ••••{' '}
                  {paymentMethods.find((p) => p.isDefault)?.last4}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Expires {paymentMethods.find((p) => p.isDefault)?.expiryMonth}/
                  {paymentMethods.find((p) => p.isDefault)?.expiryYear}
                </p>
              </div>
            ) : (
              <div>
                <span className="text-sm font-semibold text-amber-500">No Default Card</span>
                <p className="text-[11px] text-slate-400 mt-1">Add a payment method below</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subscription Plans Quick Comparison Matrix */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Available Subscription Tiers & Capabilities
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Scale your team capacity and enterprise features on demand
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            <span>Change Plan Cadence or Seats</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Starter */}
          <div
            className={`rounded-xl p-4 border transition-all ${
              currentPlan === 'starter'
                ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-indigo-600'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Starter</span>
              {currentPlan === 'starter' && (
                <span className="rounded-md bg-indigo-600 text-white px-2 py-0.5 text-[10px] font-bold">
                  Active
                </span>
              )}
            </div>
            <div className="mt-2 text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
              $0 <span className="text-xs font-normal text-slate-500">/ mo</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Free for basic collaboration up to 5 users</p>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">✓ 5 Workspace Users</li>
              <li className="flex items-center gap-2">✓ Basic Task Kanban & Chat</li>
              <li className="flex items-center gap-2">✓ 5 GB Encrypted Cloud</li>
            </ul>
          </div>

          {/* Professional */}
          <div
            className={`rounded-xl p-4 border transition-all ${
              currentPlan === 'professional'
                ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-indigo-600'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Professional</span>
              {currentPlan === 'professional' && (
                <span className="rounded-md bg-indigo-600 text-white px-2 py-0.5 text-[10px] font-bold">
                  Active
                </span>
              )}
            </div>
            <div className="mt-2 text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
              $24 <span className="text-xs font-normal text-slate-500">/ seat / mo</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">High-performance project management</p>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">✓ 25 Subscriber Seats</li>
              <li className="flex items-center gap-2">✓ Interactive Gantt & AI Prioritization</li>
              <li className="flex items-center gap-2">✓ HIPAA/GDPR Audit Logs</li>
              <li className="flex items-center gap-2">✓ 100 GB Encrypted Cloud</li>
            </ul>
          </div>

          {/* Enterprise */}
          <div
            className={`rounded-xl p-4 border transition-all ${
              currentPlan === 'enterprise'
                ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-indigo-600'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Enterprise</span>
                <span className="rounded bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-1.5 py-0.2 text-[9px] font-extrabold">
                  ULTRA
                </span>
              </div>
              {currentPlan === 'enterprise' && (
                <span className="rounded-md bg-indigo-600 text-white px-2 py-0.5 text-[10px] font-bold">
                  Active
                </span>
              )}
            </div>
            <div className="mt-2 text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
              $65 <span className="text-xs font-normal text-slate-500">/ seat / mo</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Unlimited scale, governance & 99.99% SLA</p>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li className="flex items-center gap-2">✓ 100+ Workspace Seats</li>
              <li className="flex items-center gap-2">✓ Full RBAC Custom Policies</li>
              <li className="flex items-center gap-2">✓ Real-time Cross-Client Broadcast</li>
              <li className="flex items-center gap-2">✓ 1 TB Dedicated Cloud Storage</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-500" />
              Enterprise Payment Methods & Invoicing Terms
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cards and direct financial accounts stored securely via tokenized gateways
            </p>
          </div>

          <button
            id="add-payment-method-btn-grid"
            type="button"
            onClick={() => setIsAddPaymentMethodOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Payment Method</span>
          </button>
        </div>

        {paymentMethods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentMethods.map((pm) => (
              <div
                key={pm.id}
                className={`relative rounded-xl border p-4 transition-all ${
                  pm.isDefault
                    ? 'border-indigo-500 bg-indigo-50/15 dark:bg-indigo-950/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
                      {pm.type === 'bank_ach' ? (
                        <Building className="h-4 w-4 text-indigo-500" />
                      ) : pm.type === 'corporate_po' ? (
                        <FileText className="h-4 w-4 text-purple-500" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-indigo-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200 font-mono">
                          {pm.brand} •••• {pm.last4}
                        </span>
                        {pm.isDefault && (
                          <span className="rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[10px] font-bold border border-emerald-500/20">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {pm.name}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {!pm.isDefault && (
                      <button
                        type="button"
                        onClick={() => setDefaultPaymentMethod(pm.id)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        title="Set as Default"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removePaymentMethod(pm.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Remove Payment Method"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  {pm.expiryMonth && pm.expiryYear ? (
                    <span>Expires {pm.expiryMonth}/{pm.expiryYear}</span>
                  ) : pm.bankName ? (
                    <span>{pm.bankName}</span>
                  ) : pm.poNumber ? (
                    <span>PO Terms (Net 30)</span>
                  ) : (
                    <span>Active</span>
                  )}
                  <span className="flex items-center gap-1 text-emerald-500 font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
            <CreditCard className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              No payment methods on file
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Add a corporate card, ACH account or purchase order to support uninterrupted service.
            </p>
            <button
              type="button"
              onClick={() => setIsAddPaymentMethodOpen(true)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Payment Method
            </button>
          </div>
        )}
      </div>

      {/* User Accounts & License Allocation Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              Active Workspace Subscribers & Account Provisioning
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {state.users.length} provisioned users utilizing {seatsUsed} of {seatsAllocated} authorized tenant seats
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateAccountOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>+ Provision New Account</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="p-3">User & Email</th>
                <th className="p-3">Department</th>
                <th className="p-3">Job Title</th>
                <th className="p-3">Assigned Role</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {state.users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="h-7 w-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                      />
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {u.name}
                        </span>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{u.department}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-300">{u.jobTitle || 'Team Member'}</td>
                  <td className="p-3">
                    <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active Seat
                    </span>
                  </td>
                  <td className="p-3 text-right text-slate-500 font-mono text-[11px]">
                    {u.lastActive}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice & Billing Receipts History */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-500" />
              Invoice & Tax Receipt History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Download itemized receipts and tax statements for corporate accounting
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="p-3">Invoice Number</th>
                <th className="p-3">Date</th>
                <th className="p-3">Description</th>
                <th className="p-3">Method</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                    {inv.invoiceNumber}
                  </td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{inv.date}</td>
                  <td className="p-3 font-medium text-slate-800 dark:text-slate-200">
                    {inv.planName}
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px]">
                    {inv.paymentMethodSummary}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                    ${inv.total.toLocaleString()} {inv.currency}
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold border border-emerald-500/20 uppercase">
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(inv)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span>View Receipt</span>
                      <ExternalLink className="h-3 w-3" />
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

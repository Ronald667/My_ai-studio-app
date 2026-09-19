import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlanTier, BillingInterval } from '../../types';
import {
  X,
  Sparkles,
  Check,
  Zap,
  Shield,
  CreditCard,
  Building,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const UpgradePlanModal: React.FC = () => {
  const {
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    setIsAddPaymentMethodOpen,
    state,
    upgradeSubscription,
  } = useApp();

  const currentPlan = state.subscription?.currentPlan || 'starter';
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanTier>(
    currentPlan === 'enterprise' ? 'enterprise' : 'enterprise'
  );
  const [interval, setInterval] = useState<BillingInterval>(
    state.subscription?.billingInterval || 'annual'
  );
  const [seats, setSeats] = useState<number>(
    selectedPlan === 'enterprise' ? 100 : selectedPlan === 'professional' ? 25 : 5
  );
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(
    state.subscription?.paymentMethods.find((p) => p.isDefault)?.id ||
      state.subscription?.paymentMethods[0]?.id ||
      ''
  );
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isUpgradeModalOpen) return null;

  const paymentMethods = state.subscription?.paymentMethods || [];

  const plans: {
    tier: SubscriptionPlanTier;
    name: string;
    badge?: string;
    monthlyPrice: number;
    annualPrice: number; // per seat/mo
    defaultSeats: number;
    storage: string;
    features: string[];
    isPopular?: boolean;
  }[] = [
    {
      tier: 'starter',
      name: 'Starter Tier',
      monthlyPrice: 0,
      annualPrice: 0,
      defaultSeats: 5,
      storage: '5 GB',
      features: [
        'Up to 5 Workspace Seats',
        'Basic Task Tracking & Kanban',
        'Direct Team Chat & DMs',
        '5 GB Secure Cloud Storage',
        'Standard Community Support',
      ],
    },
    {
      tier: 'professional',
      name: 'Professional',
      monthlyPrice: 29,
      annualPrice: 24,
      defaultSeats: 25,
      storage: '100 GB',
      features: [
        '25 Active Subscriber Seats',
        'Interactive Gantt & AI Task Prioritization',
        'Production Work Orders & Real-Time Stock Tracking',
        'HIPAA & EU GDPR Compliance Audit Logs',
        '100 GB End-to-End Encrypted Cloud Storage',
        'Priority Technical Support (4-hour SLA)',
      ],
    },
    {
      tier: 'enterprise',
      name: 'Enterprise Ultra',
      badge: 'RECOMMENDED',
      monthlyPrice: 79,
      annualPrice: 65,
      defaultSeats: 100,
      storage: '1,000 GB (1 TB)',
      features: [
        '100 Included Seats (Scalable to 1,000+)',
        'Full Unrestricted RBAC Governance & IAM Override',
        'Real-Time Multi-Tab WebSocket & BroadcastChannel Sync',
        'Automated Workflow Triggers & Smart Event Chains',
        'Automated Cryptographic Hash Audit Signatures',
        '1 TB Sovereign Cloud Storage with Multi-Cloud KMS',
        '24/7 Dedicated Account Director & 99.99% SLA',
      ],
      isPopular: true,
    },
  ];

  const activePlanObj = plans.find((p) => p.tier === selectedPlan) || plans[2];
  const unitRate = interval === 'annual' ? activePlanObj.annualPrice : activePlanObj.monthlyPrice;
  const multiplier = interval === 'annual' ? 12 : 1;
  const totalPrice = selectedPlan === 'starter' ? 0 : unitRate * seats * multiplier;

  const handleSelectPlan = (tier: SubscriptionPlanTier) => {
    setSelectedPlan(tier);
    if (tier === 'enterprise') setSeats(100);
    else if (tier === 'professional') setSeats(25);
    else setSeats(5);
  };

  const handleConfirmUpgrade = () => {
    if (paymentMethods.length === 0 && selectedPlan !== 'starter') {
      setIsAddPaymentMethodOpen(true);
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      upgradeSubscription(selectedPlan, interval, seats);
      setIsProcessing(false);
      setIsUpgradeModalOpen(false);
    }, 600);
  };

  return (
    <div
      id="upgrade-plan-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setIsUpgradeModalOpen(false)}
    >
      <div
        id="upgrade-plan-modal"
        className="relative w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/60 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Upgrade Workspace Subscription
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unlock higher seat allocations, compliant storage, and priority enterprise automation
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsUpgradeModalOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Interval Selector Banner */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 bg-indigo-50/50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/30 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">
              Billing Cadence:
            </span>
            <div className="flex items-center rounded-xl bg-slate-200/80 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => setInterval('monthly')}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                  interval === 'monthly'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setInterval('annual')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                  interval === 'annual'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>Annual</span>
                <span className="rounded bg-emerald-500/20 text-emerald-300 dark:text-emerald-400 text-[10px] px-1 py-0.2">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Current Tier: <strong className="text-indigo-600 dark:text-indigo-400 uppercase">{currentPlan}</strong>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isSelected = selectedPlan === p.tier;
            const isCurrent = currentPlan === p.tier;
            const price = interval === 'annual' ? p.annualPrice : p.monthlyPrice;

            return (
              <div
                key={p.tier}
                onClick={() => handleSelectPlan(p.tier)}
                className={`relative flex flex-col justify-between rounded-2xl p-5 border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-lg shadow-indigo-600/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-white shadow-sm">
                    {p.badge}
                  </span>
                )}

                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{p.name}</h3>
                    {isCurrent && (
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                        Current
                      </span>
                    )}
                  </div>

                  {/* Pricing Display */}
                  <div className="mt-3 mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
                        ${price}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        / seat / month
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {p.tier === 'starter'
                        ? 'Always free for small teams'
                        : interval === 'annual'
                        ? 'Billed annually per subscriber'
                        : 'Billed monthly per subscriber'}
                    </p>
                  </div>

                  {/* Feature Checklist */}
                  <ul className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs text-slate-600 dark:text-slate-300">
                    {p.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="h-3.5 w-3.5 text-indigo-500 mt-0.5 shrink-0" />
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Select Plan
                    </span>
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Seat Configurator & Checkout Summary */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Seat Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Total Workspace Seats
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={selectedPlan === 'enterprise' ? 25 : selectedPlan === 'professional' ? 5 : 1}
                  max={selectedPlan === 'enterprise' ? 500 : 50}
                  step={selectedPlan === 'enterprise' ? 25 : 5}
                  value={seats}
                  onChange={(e) => setSeats(parseInt(e.target.value, 10))}
                  className="flex-1 accent-indigo-600"
                />
                <span className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-mono text-xs font-bold text-slate-900 dark:text-slate-100 min-w-[70px] text-center">
                  {seats} Seats
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {state.users.length} seats currently in use by team accounts
              </p>
            </div>

            {/* Payment Method Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Payment Method
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddPaymentMethodOpen(true)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  + Add New
                </button>
              </div>

              {paymentMethods.length > 0 ? (
                <select
                  value={selectedPaymentId}
                  onChange={(e) => setSelectedPaymentId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.brand.toUpperCase()} ending in {pm.last4} {pm.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 p-2.5 text-xs text-amber-700 dark:text-amber-300 flex items-center justify-between">
                  <span>No payment method configured</span>
                  <button
                    type="button"
                    onClick={() => setIsAddPaymentMethodOpen(true)}
                    className="font-bold underline"
                  >
                    Add Card/Bank
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pricing Calculation Summary */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 dark:text-slate-400">Total Commitment:</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-display">
                  ${totalPrice.toLocaleString()} {interval === 'annual' ? '/ year' : '/ month'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                ${unitRate} / seat × {seats} seats × {interval === 'annual' ? '12 months' : '1 month'}. Next automated renewal on Oct 1, 2026.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsUpgradeModalOpen(false)}
                className="flex-1 sm:flex-initial rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                id="confirm-upgrade-button"
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmUpgrade}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-600/20 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isProcessing ? 'Processing Upgrade...' : `Confirm & Upgrade to ${activePlanObj.name}`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

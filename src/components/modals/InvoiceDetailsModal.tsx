import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Printer,
  Download,
  CheckCircle2,
  Building,
  FileText,
  CreditCard,
  Layers,
} from 'lucide-react';

export const InvoiceDetailsModal: React.FC = () => {
  const { selectedInvoice, setSelectedInvoice } = useApp();

  if (!selectedInvoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="invoice-details-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setSelectedInvoice(null)}
    >
      <div
        id="invoice-details-modal"
        className="relative w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Actions Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/60 dark:bg-slate-950/60 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tax Invoice & Receipt
            </span>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              PAID IN FULL
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedInvoice(null)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="p-8 space-y-6 text-slate-800 dark:text-slate-200">
          {/* Top Brand & Invoice Metadata */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
                  <Layers className="h-4 w-4" />
                </div>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-display">
                  OmniWork Technologies, Inc.
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100 Montgomery St, Suite 2400<br />
                San Francisco, CA 94104, USA<br />
                billing@omniwork.internal • VAT: US-94281729
              </p>
            </div>

            <div className="text-left sm:text-right">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-mono">
                {selectedInvoice.invoiceNumber}
              </h1>
              <div className="mt-1 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                <p>Date Issued: <strong className="text-slate-800 dark:text-slate-200 font-mono">{selectedInvoice.date}</strong></p>
                <p>Status: <span className="font-semibold text-emerald-500 uppercase">{selectedInvoice.status}</span></p>
                <p>Payment: {selectedInvoice.paymentMethodSummary}</p>
              </div>
            </div>
          </div>

          {/* Billed To Information */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Billed To
              </span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mt-1">
                OmniWork Enterprise Customer
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Primary Account Administrator<br />
                admin@omniwork.internal<br />
                Workspace ID: ws-omni-core-01
              </p>
            </div>

            <div>
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                Subscription Specifications
              </span>
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mt-1">
                {selectedInvoice.planName}
              </p>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Interval: <span className="capitalize">{selectedInvoice.billingInterval}</span><br />
                Allocated Seats: {selectedInvoice.seatsCount} Seats<br />
                Automatic Recurring Renewal Enabled
              </p>
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3 text-center">Qty / Seats</th>
                  <th className="p-3 text-right">Unit Rate</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {selectedInvoice.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                      {item.description}
                    </td>
                    <td className="p-3 text-center font-mono">{item.qty}</td>
                    <td className="p-3 text-right font-mono">${item.unitPrice.toFixed(2)}</td>
                    <td className="p-3 text-right font-mono font-semibold">
                      ${item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                  ${selectedInvoice.subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Enterprise Tax / VAT (0% Exempt):</span>
                <span className="font-mono font-medium text-slate-800 dark:text-slate-200">$0.00</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <span>Total Paid:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400 font-extrabold text-base">
                  ${selectedInvoice.total.toLocaleString()} {selectedInvoice.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Receipt Confirmation */}
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-950/20 p-3.5 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <div>
              <p className="font-semibold">Payment Completed & Cryptographically Verified</p>
              <p className="text-[11px] opacity-80 mt-0.5">
                Transaction processed through Stripe / Tokenized PCI Gateway. Transaction ID: tx_{selectedInvoice.id}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

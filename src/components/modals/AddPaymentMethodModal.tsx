import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PaymentMethod } from '../../types';
import {
  X,
  CreditCard,
  Building2,
  FileCheck,
  ShieldCheck,
  Lock,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export const AddPaymentMethodModal: React.FC = () => {
  const { isAddPaymentMethodOpen, setIsAddPaymentMethodOpen, addPaymentMethod } = useApp();

  const [methodType, setMethodType] = useState<PaymentMethod['type']>('credit_card');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('12');
  const [expiryYear, setExpiryYear] = useState('2028');
  const [cvc, setCvc] = useState('');
  const [postalCode, setPostalCode] = useState('94107');
  const [country, setCountry] = useState('United States');
  const [isDefault, setIsDefault] = useState(true);

  // ACH Bank Debit Fields
  const [bankName, setBankName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');

  // Corporate PO Fields
  const [poNumber, setPoNumber] = useState('');
  const [billingEmail, setBillingEmail] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAddPaymentMethodOpen) return null;

  // Format card number with spaces every 4 digits
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Determine card brand from first digits
  const detectBrand = (num: string): PaymentMethod['brand'] => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (clean.startsWith('5')) return 'mastercard';
    if (clean.startsWith('3')) return 'amex';
    if (clean.startsWith('6')) return 'discover';
    return 'visa';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (methodType === 'credit_card') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (cleanNum.length < 15) {
        setError('Please enter a valid 15 or 16 digit card number.');
        return;
      }
      if (!cardholderName.trim()) {
        setError('Please enter the name printed on the card.');
        return;
      }
      if (cvc.length < 3) {
        setError('Please enter a 3 or 4 digit security CVC code.');
        return;
      }

      setIsSubmitting(true);
      const brand = detectBrand(cleanNum);
      const last4 = cleanNum.slice(-4);

      addPaymentMethod({
        type: 'credit_card',
        isDefault,
        name: cardholderName.trim(),
        last4,
        brand,
        expiryMonth: parseInt(expiryMonth, 10),
        expiryYear: parseInt(expiryYear, 10),
        postalCode: postalCode.trim(),
        country,
      });
    } else if (methodType === 'bank_ach') {
      if (!bankName.trim()) {
        setError('Please provide the financial institution name.');
        return;
      }
      if (routingNumber.length !== 9) {
        setError('ABA Routing number must be 9 digits.');
        return;
      }
      if (accountNumber.length < 4) {
        setError('Please enter a valid bank account number.');
        return;
      }

      setIsSubmitting(true);
      const last4 = accountNumber.slice(-4);

      addPaymentMethod({
        type: 'bank_ach',
        isDefault,
        name: cardholderName.trim() || 'Corporate Operating Account',
        last4,
        brand: 'ach',
        bankName: bankName.trim(),
        accountType,
        country,
      });
    } else {
      // Corporate PO
      if (!poNumber.trim()) {
        setError('Please specify a corporate Purchase Order (PO) number.');
        return;
      }
      if (!billingEmail.trim() || !billingEmail.includes('@')) {
        setError('Please enter an Accounts Payable (AP) invoice email.');
        return;
      }

      setIsSubmitting(true);
      addPaymentMethod({
        type: 'corporate_po',
        isDefault,
        name: cardholderName.trim() || 'Enterprise Billing Terms',
        last4: poNumber.slice(-4),
        brand: 'po',
        poNumber: poNumber.trim(),
        billingEmail: billingEmail.trim(),
        country,
      });
    }

    setIsSubmitting(false);
    setIsAddPaymentMethodOpen(false);
  };

  return (
    <div
      id="add-payment-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setIsAddPaymentMethodOpen(false)}
    >
      <div
        id="add-payment-modal"
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Add Enterprise Payment Method
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PCI-DSS Level 1 & TLS 1.3 tokenized billing gateway
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddPaymentMethodOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Payment Method Type Tabs */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setMethodType('credit_card')}
            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${
              methodType === 'credit_card'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-500 shadow-sm'
                : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-white/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>Credit / Debit</span>
          </button>

          <button
            type="button"
            onClick={() => setMethodType('bank_ach')}
            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${
              methodType === 'bank_ach'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-500 shadow-sm'
                : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-white/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>ACH Bank Debit</span>
          </button>

          <button
            type="button"
            onClick={() => setMethodType('corporate_po')}
            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl text-xs font-semibold transition-all border ${
              methodType === 'corporate_po'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border-indigo-500 shadow-sm'
                : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:bg-white/50 dark:hover:bg-slate-800/40'
            }`}
          >
            <FileCheck className="h-4 w-4" />
            <span>PO / Invoice</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/50 p-3 text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {methodType === 'credit_card' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Name on Card <span className="text-rose-500">*</span>
                </label>
                <input
                  id="card-name"
                  type="text"
                  required
                  placeholder="e.g. Elena Rostova"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Card Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="card-number"
                    type="text"
                    required
                    placeholder="4000 1234 5678 9010"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 pl-3 pr-10 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <div className="absolute right-3 top-2.5">
                    <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {detectBrand(cardNumber)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Month
                  </label>
                  <select
                    value={expiryMonth}
                    onChange={(e) => setExpiryMonth(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Year
                  </label>
                  <select
                    value={expiryYear}
                    onChange={(e) => setExpiryYear(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {Array.from({ length: 10 }, (_, i) => 2026 + i).map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    CVC / CVV
                  </label>
                  <input
                    id="card-cvc"
                    type="text"
                    maxLength={4}
                    required
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Postal / ZIP Code
                  </label>
                  <input
                    id="card-postal"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Country
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Canada">Canada</option>
                    <option value="Japan">Japan</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {methodType === 'bank_ach' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Bank / Financial Institution <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. JPMorgan Chase, Silicon Valley Bank"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Routing Number (9-digits) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={9}
                    required
                    placeholder="121000358"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Account Type
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-2.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="checking">Commercial Checking</option>
                    <option value="savings">Corporate Savings / Treasury</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Account Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Account number"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </>
          )}

          {methodType === 'corporate_po' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Purchase Order (PO) Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="PO-2026-OMNI-782"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Accounts Payable (AP) Invoice Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="ap-billing@omnicorp.internal"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3 text-xs text-slate-600 dark:text-slate-400">
                Invoices will be automatically emailed to this AP address on Net 30 terms upon each plan renewal cycle.
              </div>
            </>
          )}

          {/* Set as Default Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300 pt-1">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Set as primary default payment method for all workspace subscriptions
          </label>

          {/* Security Notice */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Encrypted using bank-grade AES-256 tokenization. No plain numbers stored.</span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsAddPaymentMethodOpen(false)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-payment-method-button"
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-500 disabled:opacity-50 transition-all"
            >
              <CreditCard className="h-4 w-4" />
              <span>{isSubmitting ? 'Verifying...' : 'Save Payment Method'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

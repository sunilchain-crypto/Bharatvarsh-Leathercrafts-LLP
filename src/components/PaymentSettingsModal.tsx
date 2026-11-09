import React, { useState } from 'react';
import { paymentService } from '../services/paymentService';
import { PaymentGatewayConfig } from '../types';
import { X, CreditCard, ShieldCheck, Check, Key, ExternalLink, Info, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PaymentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentSettingsModal: React.FC<PaymentSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const { isOwner, role } = useAuth();
  if (!isOpen) return null;

  if (!isOwner) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-stone-900 border border-red-900/60 rounded-2xl p-6 text-center text-stone-200 shadow-2xl">
          <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400">
            <Lock className="w-7 h-7" />
          </div>
          <span className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-300 bg-red-950/80 border border-red-800/80 rounded-full mb-2">
            HTTP 403 Forbidden
          </span>
          <h3 className="font-serif text-xl font-bold text-amber-100 mb-2">
            Store Settings Restricted
          </h3>
          <p className="text-xs text-stone-300 mb-5">
            Payment gateway credentials and settlement keys are strictly restricted to the <strong>Store Owner</strong>. You are currently authenticated as {role}.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-amber-700 hover:bg-amber-600 text-amber-50 rounded-xl text-xs font-semibold transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  const [config, setConfig] = useState<PaymentGatewayConfig>(paymentService.getConfig());
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    paymentService.updateConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden border border-[#24140D]/15 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#24140D]/10 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#783A1D] text-[#FAF7F2] flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-[#C29B38]" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#24140D]">
                Payment Gateway Configuration
              </h2>
              <span className="text-[11px] text-[#783A1D] uppercase tracking-wider font-semibold">
                Isolated Payment Layer for Bharatvarsh Leathercrafts LLP
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close payment config"
            className="p-1.5 rounded-lg text-[#24140D]/60 hover:text-[#24140D] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-950">
              <Key className="w-4 h-4 text-[#783A1D]" />
              <span>Isolated Architecture & Security</span>
            </div>
            <p className="leading-relaxed">
              No API secrets are ever hardcoded in the application. Public publishable client keys are safely read from environment variables (<code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_RAZORPAY_KEY_ID</code> and <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_STRIPE_PUBLISHABLE_KEY</code>) or simulated in sandbox test mode.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Gateway Mode Toggle */}
            <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 space-y-3">
              <label className="font-semibold text-[#24140D] block">Operational Mode</label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={config.testMode}
                    onChange={() => setConfig({ ...config, testMode: true })}
                    className="accent-[#783A1D]"
                  />
                  <span>Sandbox Test Mode (Instant Mock Authorizations)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="mode"
                    checked={!config.testMode}
                    onChange={() => setConfig({ ...config, testMode: false })}
                    className="accent-[#783A1D]"
                  />
                  <span>Live Production Gateway</span>
                </label>
              </div>
            </div>

            {/* Razorpay Setup Box */}
            <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#24140D] flex items-center gap-1.5">
                  <span>Razorpay Key ID</span>
                  <span className="text-[10px] bg-[#783A1D]/10 text-[#783A1D] px-2 py-0.5 rounded font-medium">
                    India (UPI, RuPay, NetBanking)
                  </span>
                </span>
                <a
                  href="https://dashboard.razorpay.com/#/access/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#783A1D] hover:underline flex items-center gap-1"
                >
                  <span>Get Razorpay Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={config.razorpayKeyId}
                onChange={(e) => setConfig({ ...config, razorpayKeyId: e.target.value })}
                placeholder="rzp_test_... or rzp_live_..."
                className="w-full px-3 py-2 bg-[#FAF7F2] font-mono text-xs border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
              />
              <p className="text-[10px] text-[#24140D]/60 leading-tight">
                Stored in <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">.env</code> as <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">VITE_RAZORPAY_KEY_ID</code>.
              </p>
            </div>

            {/* Stripe Setup Box */}
            <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#24140D] flex items-center gap-1.5">
                  <span>Stripe Publishable Key</span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                    Global Cards & Apple Pay
                  </span>
                </span>
                <a
                  href="https://dashboard.stripe.com/apikeys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-[#783A1D] hover:underline flex items-center gap-1"
                >
                  <span>Get Stripe Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={config.stripePublishableKey}
                onChange={(e) => setConfig({ ...config, stripePublishableKey: e.target.value })}
                placeholder="pk_test_... or pk_live_..."
                className="w-full px-3 py-2 bg-[#FAF7F2] font-mono text-xs border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
              />
              <p className="text-[10px] text-[#24140D]/60 leading-tight">
                Stored in <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">.env</code> as <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">VITE_STRIPE_PUBLISHABLE_KEY</code>.
              </p>
            </div>

            {/* LLP Indian Compliance Guide */}
            <div className="p-4 rounded-xl bg-[#EFE9DF]/60 border border-[#24140D]/10 space-y-2 text-[11px] text-[#24140D]/80">
              <span className="font-semibold text-[#24140D] block">
                Indian LLP E-Commerce Checklist:
              </span>
              <ul className="space-y-1 list-disc pl-4 text-[#24140D]/70">
                <li>Razorpay requires your registered LLP PAN and Certificate of Incorporation (MCA).</li>
                <li>Invoice generation auto-computes the 18% HSN/GST component on luxury leather goods.</li>
                <li>UPI QR and VPA intent flows trigger automatically on mobile devices during checkout.</li>
              </ul>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Payment configuration saved successfully.</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#24140D]/20 rounded-lg text-xs font-semibold hover:bg-[#EFE9DF]"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

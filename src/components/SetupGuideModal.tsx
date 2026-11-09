import React from 'react';
import { X, BookOpen, CheckCircle, FolderTree, Key, Sparkles, Terminal, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin: () => void;
  onOpenPaymentSettings: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({
  isOpen,
  onClose,
  onOpenAdmin,
  onOpenPaymentSettings
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
            Store Operations Guide Restricted
          </h3>
          <p className="text-xs text-stone-300 mb-5">
            Internal setup guides, Hostinger commands, and secrets are strictly restricted to the <strong>Store Owner</strong>. You are currently authenticated as {role}.
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden border border-[#24140D]/15 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#24140D]/10 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#24140D] text-[#FAF7F2] flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#C29B38]" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#24140D]">
                Store Owner Setup & Maintenance Guide
              </h2>
              <span className="text-[11px] text-[#783A1D] uppercase tracking-wider font-semibold">
                Bharatvarsh Leathercrafts LLP
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close setup guide"
            className="p-1.5 rounded-lg text-[#24140D]/60 hover:text-[#24140D] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 text-xs text-[#24140D]/80 leading-relaxed">
          
          {/* Section 1: Overview */}
          <div className="space-y-2">
            <h3 className="font-serif text-2xl font-bold text-[#24140D]">
              Welcome to the Bharatvarsh Storefront
            </h3>
            <p>
              This production storefront was architected specifically for <strong>Bharatvarsh Leathercrafts LLP</strong>, extracting the color palette (deep rich harness leather brown, warm saddle cognac tan, burnished brass gold, and warm ivory parchment), typography feel, and artisanal mood from your official circular stitched leather emblem.
            </p>
          </div>

          {/* Section 2: Adding Products & Categories */}
          <div className="p-5 rounded-xl bg-white border border-[#24140D]/10 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#24140D]/10 pb-3">
              <h4 className="font-serif text-base font-bold text-[#24140D] flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-[#783A1D]" />
                <span>1. Adding & Managing Products and Categories</span>
              </h4>
              <button
                onClick={() => {
                  onClose();
                  onOpenAdmin();
                }}
                className="text-xs text-[#783A1D] font-semibold hover:underline cursor-pointer"
              >
                Launch Admin CMS →
              </button>
            </div>

            <p>
              The storefront supports <strong>two flexible methods</strong> to add, edit, or remove products and categories without touching core React application logic:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#24140D]/10 space-y-1.5">
                <strong className="text-[#24140D] block font-semibold">Method A: Through the Built-in Admin CMS</strong>
                <p className="text-[11px] text-[#24140D]/70">
                  Open the <strong>Store Admin</strong> panel (from the header or footer). Click <em>Add New Product</em>, fill in the title, category, price, and specs, and click <em>Publish</em>. Changes are instantly saved and persist across browser reloads via <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">localStorage</code>.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#24140D]/10 space-y-1.5">
                <strong className="text-[#24140D] block font-semibold">Method B: Through Structured JSON</strong>
                <p className="text-[11px] text-[#24140D]/70">
                  Edit <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">src/data/initialCatalog.ts</code> or export the JSON directly from the Admin Panel’s <strong>JSON Source Code</strong> tab. You can paste new items or categories directly in JSON format.
                </p>
              </div>
            </div>

            <div className="text-[11px] text-[#24140D]/70 space-y-1">
              <strong>Category Structure:</strong>
              <ul className="list-disc pl-5 space-y-0.5">
                <li><strong>Men:</strong> Leather Belts, Wallets</li>
                <li><strong>Women:</strong> Belts, Wallets, Purses</li>
                <li><strong>Unisex:</strong> Backpacks, Briefcases</li>
                <li><em>New product types (e.g. Cardholders, Duffel Bags) can be added anytime in the Category tab!</em></li>
              </ul>
            </div>
          </div>

          {/* Section 3: Payment Gateway Configuration */}
          <div className="p-5 rounded-xl bg-white border border-[#24140D]/10 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#24140D]/10 pb-3">
              <h4 className="font-serif text-base font-bold text-[#24140D] flex items-center gap-2">
                <Key className="w-4 h-4 text-[#783A1D]" />
                <span>2. Connecting Payments (Razorpay & Stripe)</span>
              </h4>
              <button
                onClick={() => {
                  onClose();
                  onOpenPaymentSettings();
                }}
                className="text-xs text-[#783A1D] font-semibold hover:underline cursor-pointer"
              >
                Payment Settings →
              </button>
            </div>

            <p>
              The checkout integration layer is fully isolated in <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">src/services/paymentService.ts</code>. API keys are never hardcoded.
            </p>

            <div className="space-y-2">
              <strong className="text-[#24140D] block font-semibold">Where to put your API keys:</strong>
              <p className="text-[11px] text-[#24140D]/70">
                In your project root, copy <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">.env.example</code> to <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">.env</code>:
              </p>
              <pre className="p-3 bg-[#24140D] text-[#D4B37A] font-mono text-[11px] rounded-lg overflow-x-auto">
{`# For Indian Payments (UPI, RuPay, NetBanking, Cards):
VITE_RAZORPAY_KEY_ID="rzp_live_your_actual_key_here"

# For Global & International Cards:
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_your_actual_key_here"`}
              </pre>
              <p className="text-[11px] text-[#24140D]/70">
                When left empty or using the default placeholders, the store runs in <strong>Sandbox Mode</strong>, which allows end-to-end testing of customer checkouts, addresses, and receipts without real charges.
              </p>
            </div>
          </div>

          {/* Section: AI Features & Admin Verification */}
          <div className="p-5 rounded-xl bg-white border border-[#24140D]/10 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#24140D]/10 pb-3">
              <h4 className="font-serif text-base font-bold text-[#24140D] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C29B38]" />
                <span>3. AI Storyteller &amp; Patron Concierge (Gemini 3.8 Flash)</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#24140D]/10 space-y-1.5">
                <strong className="text-[#24140D] block font-semibold">Store Manager AI Storyteller (Admin CMS)</strong>
                <p className="text-[11px] text-[#24140D]/70">
                  Located in the Admin CMS Product form. Enter basic titles, leather types, and hardware specs, then click <em>Generate Story</em>. <strong>Admin verification is strictly enforced:</strong> stories open in an interactive review modal allowing edits, and only publish after you click <em>&quot;Approve &amp; Apply to Product&quot;</em>.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#FAF7F2] border border-[#24140D]/10 space-y-1.5">
                <strong className="text-[#24140D] block font-semibold">Customer Sizing &amp; Care Concierge</strong>
                <p className="text-[11px] text-[#24140D]/70">
                  A floating luxury concierge accessible across product pages. Guides buyers on belt sizing rules (+2 inches over trouser waist), vegetable-tanned leather care during Indian monsoons, and bespoke 22k gold monogramming.
                </p>
              </div>
            </div>
          </div>

          {/* Section 4: Architecture */}
          <div className="p-5 rounded-xl bg-white border border-[#24140D]/10 space-y-3 shadow-xs">
            <h4 className="font-serif text-base font-bold text-[#24140D] flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[#783A1D]" />
              <span>4. Project Source Architecture</span>
            </h4>
            <pre className="p-3 bg-[#FAF7F2] text-[#24140D] font-mono text-[11px] rounded-lg border border-[#24140D]/10 overflow-x-auto">
{`├── server.ts                   # Express server with Vite dev middleware & Gemini API routes
├── src/
│   ├── components/
│   │   ├── LeatherConciergeWidget.tsx # Floating Sizing & Care AI Concierge
│   │   ├── AdminPanelModal.tsx        # Catalog CMS with AI Story Generator & Admin Review
│   │   ├── ProductDetailModal.tsx     # Gallery, specs, and concierge consultation trigger
│   │   ├── CartDrawer.tsx             # Slide-over cart with coupons & free shipping bar
│   │   ├── CheckoutModal.tsx          # Multi-step checkout & payment receipt
│   │   └── ...
│   ├── services/
│   │   ├── aiService.ts               # Gemini client integration for Story & Concierge
│   │   ├── catalogService.ts          # Persistent catalog CRUD
│   │   └── couponService.ts           # Festive discount codes & promotional engine
│   └── types/                         # Strict TypeScript interfaces`}
            </pre>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm cursor-pointer"
            >
              Close Guide
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { TopCategory } from '../types';
import { SlidersHorizontal, CreditCard, BookOpen, Shield, Mail, Phone, MapPin, Building2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FooterProps {
  onSelectCategory: (category: TopCategory | 'All') => void;
  onOpenAdmin: () => void;
  onOpenPaymentSettings: () => void;
  onOpenSetupGuide: () => void;
  onOpenAccount: () => void;
  onOpenCorporate?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenAdmin,
  onOpenPaymentSettings,
  onOpenSetupGuide,
  onOpenAccount,
  onOpenCorporate
}) => {
  const { isOwner } = useAuth();
  return (
    <footer className="bg-[#1C1009] text-[#EFE9DF] border-t border-[#C29B38]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Column 1: Brand & Identity */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/Circular_with_Stitch_and_ring_Bharatvarsh_2405b0e7.png"
                alt="Bharatvarsh Leathercrafts LLP"
                className="w-12 h-12 object-contain rounded-full bg-white/20 p-1"
              />
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#FAF7F2] leading-none">
                  Bharatvarsh
                </h3>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#C29B38] font-medium">
                  Leathercrafts LLP
                </span>
              </div>
            </div>

            <p className="text-xs text-[#EFE9DF]/70 max-w-sm leading-relaxed">
              Bespoke artisanal leather goods hand-crafted in India from Tuscan and English vegetable-tanned hides, hand saddle-stitched, and finished with solid brass hardware.
            </p>

            <div className="space-y-1.5 text-xs text-[#EFE9DF]/60 pt-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#C29B38] shrink-0" />
                <span>The Crown Greens, Hinjewadi Phase 2, Pune 411057</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#C29B38] shrink-0" />
                <span>support@bharatvarshcrafts.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#C29B38] shrink-0" />
                <span>Artisan Helpline: +91 (0) 20 2986 0221</span>
              </div>
            </div>
          </div>

          {/* Column 2: Category Architecture */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#C29B38]">
              Collections
            </h4>
            <ul className="space-y-2 text-xs text-[#EFE9DF]/80">
              <li>
                <button
                  onClick={() => onSelectCategory('Men')}
                  className="hover:text-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Men (Belts & Wallets)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Women')}
                  className="hover:text-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Women (Belts, Wallets & Purses)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('Unisex')}
                  className="hover:text-[#FAF7F2] transition-colors cursor-pointer"
                >
                  Unisex (Backpacks & Briefcases)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory('All')}
                  className="hover:text-[#FAF7F2] transition-colors cursor-pointer"
                >
                  All Handcrafted Editions
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: The Craft */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#C29B38]">
              Atelier Principles
            </h4>
            <ul className="space-y-2 text-xs text-[#EFE9DF]/80">
              <li>
                <a href="#patron-stories" className="hover:text-[#FAF7F2] transition-colors flex items-center gap-1.5 text-[#C29B38]">
                  <span>★</span>
                  <span className="text-[#FAF7F2] font-semibold">Patron Patina Wall & Reviews</span>
                </a>
              </li>
              <li>
                <a href="#craftsmanship-story" className="hover:text-[#FAF7F2] transition-colors">
                  Full-Grain Vegetable Tanning
                </a>
              </li>
              <li>
                <a href="#craftsmanship-story" className="hover:text-[#FAF7F2] transition-colors">
                  Hand Saddle Stitching
                </a>
              </li>
              <li>
                <a href="#craftsmanship-story" className="hover:text-[#FAF7F2] transition-colors">
                  Solid Cast Brass Castings
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Store Operations (Owner) or Patron Services (Customer) */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-[#C29B38]">
              {isOwner ? 'Store Management' : 'Patron Services'}
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenCorporate}
                  className="text-[#EFE9DF]/80 hover:text-[#FAF7F2] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-[#C29B38]" />
                  <span>Corporate Gifting & GST Quotes</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onOpenAccount}
                  className="text-[#EFE9DF]/80 hover:text-[#FAF7F2] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-[#C29B38]" />
                  <span>My Orders & Consignment Tracking</span>
                </button>
              </li>

              {isOwner ? (
                <>
                  <li>
                    <button
                      onClick={onOpenAdmin}
                      className="text-[#EFE9DF]/80 hover:text-[#FAF7F2] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 text-[#C29B38]" />
                      <span>Admin Catalog CMS</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={onOpenPaymentSettings}
                      className="text-[#EFE9DF]/80 hover:text-[#FAF7F2] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-[#C29B38]" />
                      <span>Payment Gateway Setup</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={onOpenSetupGuide}
                      className="text-[#EFE9DF]/80 hover:text-[#FAF7F2] flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#C29B38]" />
                      <span>Setup & Operations Guide</span>
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li className="text-[#EFE9DF]/60 flex items-center gap-1.5">
                    <span className="text-[#C29B38]">✓</span>
                    <span>Bespoke Monogramming Included</span>
                  </li>
                  <li className="text-[#EFE9DF]/60 flex items-center gap-1.5">
                    <span className="text-[#C29B38]">✓</span>
                    <span>Lifetime Leather Stitching Warranty</span>
                  </li>
                </>
              )}
            </ul>
          </div>

        </div>

        {/* Bottom Bar: Copyright, Legal & Compliance */}
        <div className="mt-12 pt-8 border-t border-[#FAF7F2]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#EFE9DF]/60">
          <div>
            © {new Date().getFullYear()} Bharatvarsh Leathercrafts LLP. Registered Limited Liability Partnership (LLPIN: ADD-6497). All Rights Reserved.
          </div>
          <div className="flex items-center gap-4">
            <span>Bespoke Handcrafted in India</span>
            <span aria-hidden="true">·</span>
            <span>GSTIN Compliant 18% HSN Code 4202</span>
            <span aria-hidden="true">·</span>
            <span>Zero Synthetic Leathers</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

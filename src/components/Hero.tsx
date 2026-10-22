import React from 'react';
import { TopCategory } from '../types';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

interface HeroProps {
  onSelectCategory: (category: TopCategory) => void;
  onExploreAll: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onSelectCategory, onExploreAll }) => {
  return (
    <section className="relative overflow-hidden border-b border-[#24140D]/10 bg-gradient-to-b from-[#FAF7F2] via-[#F4ECE1] to-[#FAF7F2]">
      {/* Subtle stitch watermark border top */}
      <div className="h-[2px] bg-repeat-x opacity-60" style={{
        backgroundImage: 'repeating-linear-gradient(90deg, #C29B38, #C29B38 8px, transparent 8px, transparent 16px)'
      }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Hero Column: Brand Narrative & Category Entrypoints */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-xs tracking-widest uppercase text-[#783A1D] font-semibold">
                <span className="flex items-center gap-1.5 text-[#C29B38]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Master Artisanal Atelier
                </span>
                <span aria-hidden="true" className="text-[#24140D]/30">·</span>
                <span>Established in India</span>
                <span aria-hidden="true" className="text-[#24140D]/30">·</span>
                <span>Full-Grain Vegetable Tan</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#24140D] tracking-tight leading-[1.08] [text-wrap:balance]">
                Heirloom leathercraft, carved by hand for generations.
              </h1>

              <p className="text-base sm:text-lg text-[#24140D]/75 max-w-2xl leading-relaxed">
                Bharatvarsh Leathercrafts LLP engineers pure full-grain vegetable-tanned accessories with hand-cast solid brass hardware and meticulous saddle stitching. Built without shortcuts to acquire a luminous patina over decades of daily carry.
              </p>
            </div>

            {/* Category Quick Jump Buttons */}
            <div className="space-y-3">
              <span className="text-xs uppercase tracking-wider text-[#24140D]/60 font-medium block">
                Explore Core Collections
              </span>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => onSelectCategory('Men')}
                  className="group px-5 py-3 rounded-lg bg-[#24140D] text-[#FAF7F2] hover:bg-[#3D2013] transition-all text-xs font-semibold tracking-wide flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <span>Men’s Collection</span>
                  <span className="text-[#C29B38] text-[11px] font-normal group-hover:translate-x-1 transition-transform">
                    Belts & Wallets →
                  </span>
                </button>

                <button
                  onClick={() => onSelectCategory('Women')}
                  className="group px-5 py-3 rounded-lg bg-[#FAF7F2] text-[#24140D] border border-[#24140D]/20 hover:border-[#783A1D] hover:bg-[#EFE9DF] transition-all text-xs font-semibold tracking-wide flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span>Women’s Collection</span>
                  <span className="text-[#783A1D] text-[11px] font-normal group-hover:translate-x-1 transition-transform">
                    Belts, Wallets & Purses →
                  </span>
                </button>

                <button
                  onClick={() => onSelectCategory('Unisex')}
                  className="group px-5 py-3 rounded-lg bg-[#FAF7F2] text-[#24140D] border border-[#24140D]/20 hover:border-[#783A1D] hover:bg-[#EFE9DF] transition-all text-xs font-semibold tracking-wide flex items-center gap-2 cursor-pointer whitespace-nowrap"
                >
                  <span>Unisex Travel</span>
                  <span className="text-[#783A1D] text-[11px] font-normal group-hover:translate-x-1 transition-transform">
                    Backpacks & Briefcases →
                  </span>
                </button>
              </div>
            </div>

            {/* Quality Commitment Badges - Unboxed quiet metadata */}
            <div className="pt-4 border-t border-[#24140D]/10 grid grid-cols-3 gap-6 text-xs text-[#24140D]/80">
              <div className="space-y-1">
                <div className="font-serif text-lg font-bold text-[#24140D]">100% Full Grain</div>
                <p className="text-[11px] text-[#24140D]/60 leading-snug">Zero bonded or corrected leathers</p>
              </div>
              <div className="space-y-1">
                <div className="font-serif text-lg font-bold text-[#24140D]">Saddle Stitched</div>
                <p className="text-[11px] text-[#24140D]/60 leading-snug">Dual-needle hand-waxed linen</p>
              </div>
              <div className="space-y-1">
                <div className="font-serif text-lg font-bold text-[#24140D]">Solid Brass</div>
                <p className="text-[11px] text-[#24140D]/60 leading-snug">Cast hardware with lifetime integrity</p>
              </div>
            </div>
          </div>

          {/* Right Hero Column: Atelier Showcase & Logo Focal Point */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Decorative Leather Backplate Card */}
              <div className="relative rounded-2xl bg-[#EFE9DF] border border-[#24140D]/15 p-8 shadow-xl overflow-hidden text-center">
                
                {/* Decorative stitch framing inside card */}
                <div className="absolute inset-3 border border-[#C29B38]/40 border-dashed rounded-xl pointer-events-none" />

                {/* Brand Seal */}
                <div className="relative mx-auto w-48 h-48 sm:w-56 sm:h-56 mb-6">
                  <img
                    src="/assets/aistudio/Circular_with_Stitch_and_ring_Bharatvarsh_2405b0e7.png"
                    alt="Bharatvarsh Leathercrafts LLP Emblem"
                    className="w-full h-full object-contain filter drop-shadow-md rounded-full bg-white/40 p-1"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="font-serif text-2xl font-bold text-[#24140D]">
                    Artisan Workshop Direct
                  </h3>
                  <p className="text-xs text-[#24140D]/70 max-w-xs mx-auto leading-relaxed">
                    Every piece is crafted in small batches, edge-burnished with natural tree beeswax, and inspected under bench lamp illumination.
                  </p>
                </div>

                <div className="mt-6 pt-5 border-t border-[#24140D]/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-[#783A1D] font-medium">
                    <ShieldCheck className="w-4 h-4 text-[#C29B38]" />
                    <span>Lifetime Stitch Guarantee</span>
                  </div>
                  <button
                    onClick={onExploreAll}
                    className="font-medium text-[#24140D] hover:text-[#783A1D] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>View Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

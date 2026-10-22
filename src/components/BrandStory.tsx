import React from 'react';
import { ShieldCheck, Award, HeartHandshake, Sparkles } from 'lucide-react';

export const BrandStory: React.FC = () => {
  return (
    <section id="craftsmanship-story" className="py-20 bg-[#FAF7F2] border-t border-[#24140D]/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-[#783A1D] font-semibold">
            <span>The Bharatvarsh Philosophy</span>
            <span aria-hidden="true" className="text-[#24140D]/30">·</span>
            <span>Uncompromising Atelier Benchwork</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#24140D] tracking-tight [text-wrap:balance]">
            Crafted for a lifetime of distinguished character.
          </h2>
          <p className="text-sm sm:text-base text-[#24140D]/75 leading-relaxed">
            Every creation bearing the Bharatvarsh Leathercrafts LLP emblem is born from a refusal to compromise. We reject synthetic bonded leathers, fast-fashion glues, and mass-market stamped finishes in favor of heirloom materials that grow more magnificent with each passing year.
          </p>
        </div>

        {/* The 3 Pillars of Bharatvarsh Craftsmanship */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Pillar 1 */}
          <div className="p-8 rounded-2xl bg-white border border-[#24140D]/10 hover:border-[#783A1D]/30 transition-all shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#24140D]/10 flex items-center justify-center text-[#783A1D]">
              <Sparkles className="w-6 h-6 text-[#C29B38]" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#24140D]">
              Vegetable-Tanned Full Grain
            </h3>
            <p className="text-xs sm:text-sm text-[#24140D]/70 leading-relaxed">
              Tanned slowly over 60 days using natural extracts from mimosa, chestnut, and quebracho barks. This time-honored organic process retains the hide’s natural fiber density, imparting the intoxicating aroma of authentic artisanal leather.
            </p>
            <div className="pt-2 border-t border-[#24140D]/10 text-xs text-[#783A1D] font-medium">
              Zero chrome toxicity · 100% Biodegradable
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-8 rounded-2xl bg-white border border-[#24140D]/10 hover:border-[#783A1D]/30 transition-all shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#24140D]/10 flex items-center justify-center text-[#783A1D]">
              <HeartHandshake className="w-6 h-6 text-[#783A1D]" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#24140D]">
              Traditional Saddle Stitching
            </h3>
            <p className="text-xs sm:text-sm text-[#24140D]/70 leading-relaxed">
              Unlike sewing machines that use lock-stitches prone to unravelling if a single thread breaks, our artisans punch each hole with pricking irons and pass two needles simultaneously through every stitch. If one thread ever wears through, the seam remains firmly locked.
            </p>
            <div className="pt-2 border-t border-[#24140D]/10 text-xs text-[#783A1D] font-medium">
              0.6mm Beeswax-Coated French Linen Thread
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-8 rounded-2xl bg-white border border-[#24140D]/10 hover:border-[#783A1D]/30 transition-all shadow-xs space-y-4">
            <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#24140D]/10 flex items-center justify-center text-[#783A1D]">
              <Award className="w-6 h-6 text-[#C29B38]" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#24140D]">
              Solid Cast Brass Hardware
            </h3>
            <p className="text-xs sm:text-sm text-[#24140D]/70 leading-relaxed">
              Every buckle, turn-lock, D-ring, and rivet is individually poured and hand-burnished from solid brass. We avoid lightweight pot metal and hollow zinc alloys, ensuring our hardware withstands decades of rugged travel and daily carry.
            </p>
            <div className="pt-2 border-t border-[#24140D]/10 text-xs text-[#783A1D] font-medium">
              Heirloom weight · Anti-corrosive finish
            </div>
          </div>

        </div>

        {/* Patina Evolution Showcase Banner */}
        <div className="rounded-2xl bg-[#24140D] text-[#FAF7F2] p-8 sm:p-12 relative overflow-hidden border border-[#C29B38]/30 shadow-xl">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-serif tracking-widest uppercase text-[#C29B38] font-semibold">
                The Living Material
              </span>
              <h3 className="font-serif text-3xl sm:text-4xl font-bold leading-tight">
                Your life story, etched in rich amber patina.
              </h3>
              <p className="text-xs sm:text-sm text-[#EFE9DF]/80 max-w-2xl leading-relaxed">
                Vegetable-tanned leather is not an inert synthetic; it responds to your daily movements, ambient sunlight, and natural hand oils. Over months and years, the surface deepens into a rich, golden gloss that is uniquely and exclusively yours.
              </p>
            </div>

            <div className="lg:col-span-4 flex justify-center lg:justify-end">
              <div className="p-4 rounded-xl bg-[#3D2013] border border-[#C29B38]/20 text-center space-y-2">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-[#C29B38]/40 p-1 bg-white/10">
                  <img
                    src="/assets/aistudio/Circular_with_Stitch_and_ring_Bharatvarsh_2405b0e7.png"
                    alt="Bharatvarsh Leathercrafts Authenticity Seal"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="font-serif text-sm font-bold text-[#EFE9DF]">The Artisan Seal</div>
                <div className="text-[10px] text-[#D4B37A]">Bharatvarsh Leathercrafts LLP</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};

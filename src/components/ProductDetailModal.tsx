import React, { useState } from 'react';
import { Product } from '../types';
import { ProductImage } from './ProductImage';
import { PincodeEstimator } from './PincodeEstimator';
import { reviewService } from '../services/reviewService';
import { X, Check, Shield, Sparkles, Feather, Clock, ShoppingBag, Truck, Bookmark, Star, Camera, CheckCircle2 } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, selectedColor: string, monogramText?: string, quantity?: number) => void;
  onBuyNow: (product: Product, selectedColor: string, monogramText?: string, quantity?: number) => void;
  onToggleWishlist?: (product: Product, selectedColor: string, monogramText?: string) => void;
  isInWishlist?: boolean;
  onViewPatronWall?: () => void;
  onOpenConcierge?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onBuyNow,
  onToggleWishlist,
  isInWishlist = false,
  onViewPatronWall,
  onOpenConcierge
}) => {
  if (!product) return null;

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]?.name || 'Standard');
  const [monogramText, setMonogramText] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'care' | 'reviews'>('details');

  const productReviews = reviewService.getReviewsForProduct(product.id);
  const stats = reviewService.getReviewStats(product.id);

  const handleAddToCart = () => {
    onAddToCart(product, selectedColor, monogramText.trim() ? monogramText.toUpperCase() : undefined, quantity);
  };

  const handleBuyNow = () => {
    onBuyNow(product, selectedColor, monogramText.trim() ? monogramText.toUpperCase() : undefined, quantity);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden border border-[#24140D]/15 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="px-6 py-4 border-b border-[#24140D]/10 flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2 text-xs text-[#783A1D] uppercase tracking-wider font-semibold">
            <span>{product.category}</span>
            <span aria-hidden="true" className="text-[#24140D]/30">·</span>
            <span>{product.productType}</span>
            {product.badge && (
              <>
                <span aria-hidden="true" className="text-[#24140D]/30">·</span>
                <span className="text-[#24140D] font-medium">{product.badge}</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close product detail"
            className="p-1.5 rounded-lg text-[#24140D]/60 hover:text-[#24140D] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">

            {/* Left: Product Gallery */}
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border border-[#24140D]/10 shadow-sm bg-[#EFE9DF]">
                <ProductImage
                  src={product.images?.[selectedImageIndex] || product.images?.[0] || ''}
                  alt={product.name}
                  category={product.productType}
                  aspectRatio="square"
                />
              </div>

              {/* Thumbnails */}
              {Array.isArray(product.images) && product.images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                        selectedImageIndex === idx
                          ? 'border-[#783A1D] scale-105 shadow-sm'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} thumbnail ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Trust Badges */}
              <div className="p-4 rounded-xl bg-[#EFE9DF]/60 border border-[#24140D]/10 space-y-2 text-xs text-[#24140D]/80">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#783A1D] shrink-0" />
                  <span><strong>100% Full-Grain Hide</strong> with solid cast brass hardware</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-[#783A1D] shrink-0" />
                  <span>Complimentary insured shipping across India & 14-day exchange</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#C29B38] shrink-0" />
                  <span>Complimentary bespoke hot-foil monogramming</span>
                </div>
              </div>
            </div>

            {/* Right: Contiguous Purchase Module */}
            <div className="space-y-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#24140D] leading-tight">
                  {product.name}
                </h2>
                
                {/* Patron Rating & Patina summary */}
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <div className="flex items-center text-[#C29B38]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-[#24140D] font-mono">4.9 / 5</span>
                  <span className="text-xs text-[#24140D]/40">·</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('reviews')}
                    className="text-xs text-[#783A1D] hover:underline cursor-pointer font-medium"
                  >
                    {productReviews.length > 0 ? `${productReviews.length} Patron Chronicles` : 'Verified Artisan Quality'}
                  </button>
                  <span className="text-xs text-[#24140D]/40">·</span>
                  <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                    Real Patina Tested
                  </span>
                </div>

                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-2xl font-bold text-[#24140D] font-mono tabular-nums">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-[#24140D]/40 line-through font-mono tabular-nums">
                      ₹{product.originalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="text-[11px] text-[#783A1D] font-medium">
                    (Inclusive of all taxes & GST)
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-[#24140D]/80 leading-relaxed">
                {product.description}
              </p>

              {/* Leather Shade Selection */}
              <div className="space-y-2 pt-2 border-t border-[#24140D]/10">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#24140D]">Leather Shade:</span>
                  <span className="text-[#783A1D] font-medium">{selectedColor}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(c.name)}
                      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                        selectedColor === c.name
                          ? 'border-[#783A1D] bg-[#EFE9DF] text-[#24140D]'
                          : 'border-[#24140D]/15 hover:border-[#24140D]/40 text-[#24140D]/80'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs inline-block shrink-0"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                      {selectedColor === c.name && (
                        <Check className="w-3 h-3 text-[#783A1D]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Personalization / Bespoke Monogramming */}
              {product.monogramAvailable && (
                <div className="space-y-2 p-3.5 rounded-xl bg-[#EFE9DF]/40 border border-[#C29B38]/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#24140D] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#C29B38]" />
                      Bespoke Monogram (Optional)
                    </span>
                    <span className="text-[11px] text-[#783A1D]">Complimentary</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={monogramText}
                      onChange={(e) => setMonogramText(e.target.value)}
                      placeholder="e.g. BLC or initials"
                      className="w-full px-3 py-1.5 text-xs uppercase font-mono tracking-widest bg-white border border-[#24140D]/20 rounded-md focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>
                  <p className="text-[10px] text-[#24140D]/60 leading-tight">
                    Hand-stamped in blind deboss or 22k gold foil at our atelier. Up to 4 characters.
                  </p>
                </div>
              )}

              {/* Quantity and Actions */}
              <div className="space-y-3 pt-2 border-t border-[#24140D]/10">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-[#24140D]/20 rounded-lg bg-white overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="px-3 py-2 text-xs font-bold text-[#24140D] hover:bg-[#EFE9DF] disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-3 py-2 text-xs font-mono font-bold text-[#24140D] tabular-nums">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-2 text-xs font-bold text-[#24140D] hover:bg-[#EFE9DF] cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    className="flex-1 py-3 px-4 rounded-lg bg-[#FAF7F2] border border-[#24140D] hover:bg-[#EFE9DF] text-[#24140D] text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <ShoppingBag className="w-4 h-4 text-[#783A1D]" />
                    <span>Add to Bag</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onToggleWishlist?.(product, selectedColor, monogramText.trim() ? monogramText.toUpperCase() : undefined)}
                    className={`p-3 rounded-lg border transition-colors flex items-center justify-center cursor-pointer shadow-xs ${
                      isInWishlist
                        ? 'bg-[#24140D] text-[#C29B38] border-[#24140D]'
                        : 'bg-[#FAF7F2] text-[#24140D] border-[#24140D]/30 hover:bg-[#EFE9DF]'
                    }`}
                    title={isInWishlist ? "Saved in your Patron Wishlist" : "Curate to Patron Wishlist"}
                    aria-label={isInWishlist ? "Remove from Wishlist" : "Save to Wishlist"}
                  >
                    <Bookmark className={`w-4 h-4 ${isInWishlist ? 'fill-current text-[#C29B38]' : ''}`} />
                  </button>
                </div>

                <button
                  onClick={handleBuyNow}
                  className="w-full py-3.5 px-4 rounded-lg bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-bold tracking-wider uppercase transition-colors shadow-md cursor-pointer"
                >
                  Proceed to Immediate Checkout
                </button>

                {/* Atelier Concierge Quick Sizing & Care trigger */}
                {onOpenConcierge && (
                  <button
                    type="button"
                    onClick={onOpenConcierge}
                    className="w-full py-2.5 px-3 rounded-lg bg-[#FAF7F2] border border-[#C29B38]/60 hover:bg-[#EFE9DF] text-[#783A1D] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs group"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#C29B38] group-hover:scale-110 transition-transform" />
                    <span>Consult Atelier Concierge on Sizing & Leather Care</span>
                  </button>
                )}
              </div>

              {/* Real-time Indian Logistics & Pincode Checker */}
              <PincodeEstimator className="mt-2" />

              {/* Specifications, Care & Patron Reviews Tabs */}
              <div className="pt-4 border-t border-[#24140D]/10 space-y-3">
                <div className="flex items-center gap-3 border-b border-[#24140D]/10 text-xs overflow-x-auto pb-1">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`pb-2 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === 'details'
                        ? 'text-[#783A1D] border-b-2 border-[#783A1D]'
                        : 'text-[#24140D]/60 hover:text-[#24140D]'
                    }`}
                  >
                    Craft Features
                  </button>
                  <button
                    onClick={() => setActiveTab('specs')}
                    className={`pb-2 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === 'specs'
                        ? 'text-[#783A1D] border-b-2 border-[#783A1D]'
                        : 'text-[#24140D]/60 hover:text-[#24140D]'
                    }`}
                  >
                    Specifications
                  </button>
                  <button
                    onClick={() => setActiveTab('care')}
                    className={`pb-2 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === 'care'
                        ? 'text-[#783A1D] border-b-2 border-[#783A1D]'
                        : 'text-[#24140D]/60 hover:text-[#24140D]'
                    }`}
                  >
                    Leather Care
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`pb-2 font-semibold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      activeTab === 'reviews'
                        ? 'text-[#783A1D] border-b-2 border-[#783A1D]'
                        : 'text-[#24140D]/60 hover:text-[#24140D]'
                    }`}
                  >
                    <span>Patina Reviews</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EFE9DF] text-[#783A1D] font-mono">
                      {productReviews.length}
                    </span>
                  </button>
                </div>

                {activeTab === 'details' && (
                  <ul className="space-y-1.5 text-xs text-[#24140D]/80">
                    {product.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#C29B38] mt-0.5">•</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {activeTab === 'specs' && (
                  <div className="space-y-2 text-xs text-[#24140D]/80">
                    <div>
                      <span className="font-semibold text-[#24140D]">Leather: </span>
                      <span>{product.leatherType}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#24140D]">Hardware: </span>
                      <span>{product.hardware}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#24140D]">Dimensions: </span>
                      <span>{product.dimensions}</span>
                    </div>
                  </div>
                )}

                {activeTab === 'care' && (
                  <p className="text-xs text-[#24140D]/80 leading-relaxed">
                    {product.careInstructions ||
                      'Condition with natural beeswax and neatsfoot balm every six months. Avoid direct immersion in water. Store in the supplied cotton dust bag.'}
                  </p>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-3">
                    {productReviews.length === 0 ? (
                      <div className="p-4 rounded-lg bg-[#EFE9DF]/40 border border-[#24140D]/10 text-center space-y-2">
                        <p className="text-xs text-[#24140D]/70">
                          Be the first patron to document the patina of this handcrafted piece!
                        </p>
                        {onViewPatronWall && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onViewPatronWall();
                            }}
                            className="text-xs text-[#783A1D] font-semibold underline cursor-pointer"
                          >
                            Explore All Patron Chronicles & Patina Wall
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {productReviews.slice(0, 2).map((rev) => (
                          <div key={rev.id} className="p-3 rounded-lg bg-white border border-[#24140D]/10 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-[#24140D]">{rev.authorName}</span>
                              <span className="text-[10px] text-[#783A1D] font-mono font-medium">
                                {rev.monthsOfUse} mo. carry · {rev.patinaGrade}
                              </span>
                            </div>
                            <h5 className="font-serif text-xs font-bold text-[#24140D]">"{rev.title}"</h5>
                            <p className="text-[11px] text-[#24140D]/80 leading-relaxed line-clamp-3 italic">
                              {rev.story}
                            </p>
                          </div>
                        ))}
                        {onViewPatronWall && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onViewPatronWall();
                            }}
                            className="w-full py-2 rounded-lg bg-[#EFE9DF] hover:bg-[#E2DACD] text-xs font-semibold text-[#783A1D] transition-colors cursor-pointer text-center"
                          >
                            View All Patron Photos & Chronicles Wall →
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

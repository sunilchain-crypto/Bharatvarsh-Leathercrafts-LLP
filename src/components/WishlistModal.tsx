import React, { useState } from 'react';
import { WishlistItem, WishlistRegistry, Product } from '../types';
import { wishlistService } from '../services/wishlistService';
import { ProductImage } from './ProductImage';
import {
  X,
  Bookmark,
  Share2,
  Gift,
  Copy,
  Check,
  ShoppingBag,
  Trash2,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Heart,
  MessageCircle
} from 'lucide-react';

interface WishlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: WishlistItem[];
  onWishlistChanged: () => void;
  onMoveToBag: (item: WishlistItem) => void;
  onSelectProduct: (product: Product) => void;
  activeSharedRegistry?: WishlistRegistry | null;
  onClearSharedRegistry?: () => void;
}

const OCCASIONS = [
  'Milestone Birthday',
  'Promotion & New Venture',
  'Diwali Gifting',
  'Wedding & Anniversary Registry',
  'Executive Appreciation',
  'Personal Heirloom Curations'
];

export const WishlistModal: React.FC<WishlistModalProps> = ({
  isOpen,
  onClose,
  wishlist,
  onWishlistChanged,
  onMoveToBag,
  onSelectProduct,
  activeSharedRegistry,
  onClearSharedRegistry
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'wishlist' | 'share'>(
    activeSharedRegistry ? 'wishlist' : 'wishlist'
  );

  // Sharing form state
  const [patronName, setPatronName] = useState('Sunil Chainani');
  const [occasion, setOccasion] = useState('Milestone Birthday');
  const [personalNote, setPersonalNote] = useState(
    'A few handcrafted pieces from Bharatvarsh Leathercrafts that I would cherish for decades.'
  );
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const handleGenerateLink = () => {
    const url = wishlistService.generateShareableLink(
      patronName,
      occasion,
      personalNote,
      wishlist
    );
    setShareUrl(url);
  };

  const handleCopyLink = () => {
    const urlToCopy =
      shareUrl ||
      wishlistService.generateShareableLink(patronName, occasion, personalNote, wishlist);
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const urlToShare =
      shareUrl ||
      wishlistService.generateShareableLink(patronName, occasion, personalNote, wishlist);
    const text = encodeURIComponent(
      `Hello! Here is my curated Bharatvarsh Leathercrafts gift wishlist for my ${occasion}:\n${urlToShare}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleRemove = (id: string) => {
    wishlistService.removeFromWishlist(id);
    onWishlistChanged();
  };

  const isViewingShared = !!activeSharedRegistry;
  const displayItems = isViewingShared ? activeSharedRegistry.items : wishlist;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden border border-[#24140D]/15 max-h-[92vh] flex flex-col text-xs text-[#24140D]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#24140D]/10 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#24140D] text-[#FAF7F2] flex items-center justify-center">
              <Gift className="w-4 h-4 text-[#C29B38]" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#24140D] leading-tight">
                {isViewingShared
                  ? `${activeSharedRegistry.patronName}'s Gift Registry`
                  : 'Patron Wishlist & Gift Registry'}
              </h2>
              <span className="text-[11px] text-[#783A1D] uppercase tracking-wider font-semibold">
                {isViewingShared
                  ? activeSharedRegistry.occasion
                  : 'Curated Heirloom Pieces'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close wishlist modal"
            className="p-1.5 rounded-lg text-[#24140D]/60 hover:text-[#24140D] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shared Registry Banner (if user opened a shared link) */}
        {isViewingShared && (
          <div className="p-4 bg-gradient-to-r from-[#24140D] to-[#3D2013] text-[#FAF7F2] border-b border-[#C29B38]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C29B38]" />
                <span className="font-serif text-sm font-bold">
                  You are viewing {activeSharedRegistry.patronName}’s Curated Registry
                </span>
              </div>
              <p className="text-[11px] text-[#EFE9DF]/80 italic">
                "{activeSharedRegistry.personalNote}"
              </p>
            </div>
            {onClearSharedRegistry && (
              <button
                onClick={onClearSharedRegistry}
                className="text-[10px] bg-white/10 hover:bg-white/20 text-[#C29B38] px-2.5 py-1 rounded border border-[#C29B38]/40 shrink-0 cursor-pointer"
              >
                Switch to My Own Wishlist
              </button>
            )}
          </div>
        )}

        {/* Tab Navigation (only for own wishlist) */}
        {!isViewingShared && (
          <div className="px-6 bg-[#FAF7F2] border-b border-[#24140D]/10 flex gap-6 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('wishlist')}
              className={`py-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'wishlist'
                  ? 'border-[#783A1D] text-[#783A1D]'
                  : 'border-transparent text-[#24140D]/60 hover:text-[#24140D]'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved Pieces ({wishlist.length})</span>
            </button>
            <button
              onClick={() => {
                handleGenerateLink();
                setActiveTab('share');
              }}
              className={`py-3 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTab === 'share'
                  ? 'border-[#783A1D] text-[#783A1D]'
                  : 'border-transparent text-[#24140D]/60 hover:text-[#24140D]'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-[#C29B38]" />
              <span>Share as Gift Registry</span>
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">

          {/* TAB 1: SAVED PIECES / SHARED ITEMS */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6">
              {displayItems.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#24140D]/10 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#783A1D]">
                    <Bookmark className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-xl font-bold text-[#24140D]">Your Wishlist is Empty</h3>
                    <p className="text-xs text-[#24140D]/60 max-w-sm mx-auto">
                      Click the bookmark icon on any handcrafted leather belt, wallet, or briefcase to curate your registry.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-[#24140D] text-[#FAF7F2] text-xs font-semibold rounded-lg hover:bg-[#3D2013] transition-colors cursor-pointer"
                  >
                    Browse Collections
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 sm:p-5 rounded-2xl bg-white border border-[#24140D]/10 hover:border-[#783A1D]/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Thumbnail */}
                        <div
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-[#24140D]/10 shrink-0 bg-[#EFE9DF] cursor-pointer"
                          onClick={() => {
                            onClose();
                            onSelectProduct(item.product);
                          }}
                        >
                          <ProductImage
                            src={item.product.images[0]}
                            alt={item.product.name}
                            aspectRatio="square"
                          />
                        </div>

                        {/* Details */}
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-1.5 text-[10px] text-[#783A1D] uppercase tracking-wider font-semibold">
                            <span>{item.product.category}</span>
                            <span aria-hidden="true" className="text-[#24140D]/30">·</span>
                            <span>{item.product.productType}</span>
                          </div>

                          <h4
                            onClick={() => {
                              onClose();
                              onSelectProduct(item.product);
                            }}
                            className="font-serif font-bold text-base text-[#24140D] hover:text-[#783A1D] cursor-pointer truncate"
                          >
                            {item.product.name}
                          </h4>

                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#24140D]/70">
                            <span>Shade: <strong>{item.selectedColor}</strong></span>
                            {item.monogramText && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-[#783A1D] font-mono font-bold tracking-widest">
                                  Monogram: [{item.monogramText}]
                                </span>
                              </>
                            )}
                          </div>

                          <div className="pt-1">
                            <span className="font-serif font-bold text-base text-[#24140D] font-mono tabular-nums">
                              ₹{item.product.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#24140D]/10">
                        {!isViewingShared && (
                          <button
                            onClick={() => handleRemove(item.id)}
                            aria-label="Remove from wishlist"
                            className="p-2 text-[#24140D]/40 hover:text-red-700 transition-colors cursor-pointer"
                            title="Remove from wishlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            onMoveToBag(item);
                            onClose();
                          }}
                          className={`px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                            isViewingShared
                              ? 'bg-[#783A1D] hover:bg-[#8F4725] text-[#FAF7F2]'
                              : 'bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2]'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#C29B38]" />
                          <span>
                            {isViewingShared
                              ? `Gift This to ${activeSharedRegistry.patronName}`
                              : 'Move to Bag'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SHARE AS GIFT REGISTRY */}
          {activeTab === 'share' && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="space-y-1 text-center">
                <h3 className="font-serif text-2xl font-bold text-[#24140D]">
                  Create Your Personal Gift Registry
                </h3>
                <p className="text-xs text-[#24140D]/70 max-w-md mx-auto">
                  Share your chosen leathercraft pieces with friends and family for birthdays, anniversaries, or celebrations. Your chosen leather shades and monogram initials are locked in for seamless gifting.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-[#24140D]/10 space-y-4 shadow-xs text-xs">
                <div>
                  <label className="block font-semibold text-[#24140D] mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    value={patronName}
                    onChange={(e) => setPatronName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#24140D] mb-1">Occasion / Celebration</label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D] cursor-pointer"
                  >
                    {OCCASIONS.map((occ) => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#24140D] mb-1">Personal Note to Friends & Family</label>
                  <textarea
                    rows={2}
                    value={personalNote}
                    onChange={(e) => setPersonalNote(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                  />
                </div>

                {/* Generated Link Box */}
                <div className="pt-2 border-t border-[#24140D]/10 space-y-2">
                  <label className="block font-semibold text-[#24140D]">
                    Shareable Registry URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareUrl || wishlistService.generateShareableLink(patronName, occasion, personalNote, wishlist)}
                      className="flex-1 px-3 py-2 bg-[#FAF7F2] font-mono text-[11px] border border-[#24140D]/20 rounded-lg text-[#24140D]/80"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="px-4 py-2 bg-[#24140D] text-[#FAF7F2] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-[#3D2013]"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#C29B38]" />}
                      <span>{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Direct Share Buttons */}
                <div className="pt-3 flex flex-wrap gap-3">
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Share on WhatsApp</span>
                  </button>

                  <a
                    href={`mailto:?subject=${encodeURIComponent(`${patronName}'s Bharatvarsh Gift Wishlist`)}&body=${encodeURIComponent(`Hello! Here is my curated gift wishlist for my ${occasion}:\n\n${shareUrl || wishlistService.generateShareableLink(patronName, occasion, personalNote, wishlist)}`)}`}
                    className="flex-1 py-2.5 px-3 rounded-lg border border-[#24140D]/20 hover:bg-[#FAF7F2] text-[#24140D] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer text-center"
                  >
                    <Share2 className="w-4 h-4 text-[#783A1D]" />
                    <span>Share via Email</span>
                  </a>
                </div>

                <div className="p-3 bg-[#EFE9DF]/60 rounded-xl border border-[#24140D]/10 text-[11px] text-[#24140D]/75 space-y-1">
                  <strong>How Gifting Works:</strong>
                  <p>
                    When anyone opens your link, they see your list with your chosen leather shades and custom monogram. They can click "Gift This" and checkout immediately—ensuring you get the exact piece, color, and size you desire.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { ShoppingBag, SlidersHorizontal, Menu, X, User, Package, Bookmark, ShieldCheck, LogIn } from 'lucide-react';
import { TopCategory } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeCategory: TopCategory | 'All';
  onSelectCategory: (category: TopCategory | 'All') => void;
  cartCount: number;
  ordersCount: number;
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenWishlist: () => void;
  onOpenCorporate: () => void;
  onOpenAdmin: () => void;
  onScrollToStory: () => void;
  onScrollToStories?: () => void;
  isCorporateView?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  cartCount,
  ordersCount,
  wishlistCount,
  onOpenCart,
  onOpenAccount,
  onOpenWishlist,
  onOpenCorporate,
  onOpenAdmin,
  onScrollToStory,
  onScrollToStories,
  isCorporateView = false
}) => {
  const { user, isOwner, role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const handleNavClick = (cat: TopCategory | 'All') => {
    onSelectCategory(cat);
    setMobileMenuOpen(false);
    const catalogEl = document.getElementById('catalog-section');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#24140D]/10">
      {/* Slim Promotional Bar (≤ 40px) */}
      {!bannerDismissed && (
        <div className="bg-[#24140D] text-[#EFE9DF] text-[11px] tracking-wider py-1.5 px-4 flex items-center justify-between transition-all">
          <div className="mx-auto flex items-center gap-3">
            <span className="text-[#C29B38] font-serif uppercase tracking-widest text-[10px]">Heirloom Craft</span>
            <span aria-hidden="true" className="text-[#C29B38]/50">·</span>
            <span>Complimentary Custom Monogramming & Free Shipping across India on orders over ₹2,999</span>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss banner"
            className="text-[#EFE9DF]/60 hover:text-[#EFE9DF] text-xs px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Bar Contract: Zone 1 (Brand) — Zone 2 (4–5 Nav Links) — Zone 3 (Primary Action) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single line, luxury serif) */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('All');
          }}
          className="flex items-center gap-3 group whitespace-nowrap shrink-0 text-decoration-none"
        >
          <img
            src="/assets/aistudio/Circular_with_Stitch_and_ring_Bharatvarsh_2405b0e7.png"
            alt="Bharatvarsh Leathercrafts Logo"
            className="w-10 h-10 object-contain rounded-full shadow-sm group-hover:scale-105 transition-transform"
          />
          <div className="flex flex-col">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-[#24140D] leading-none">
              Bharatvarsh
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#783A1D] font-medium leading-tight">
              Leathercrafts LLP
            </span>
          </div>
        </a>

        {/* Zone 2: 4-5 Concise Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#24140D]/80">
          <button
            onClick={() => handleNavClick('Men')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 relative ${
              !isCorporateView && activeCategory === 'Men'
                ? 'text-[#783A1D] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#783A1D]'
                : 'hover:text-[#24140D]'
            }`}
          >
            Men
          </button>
          <button
            onClick={() => handleNavClick('Women')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 relative ${
              !isCorporateView && activeCategory === 'Women'
                ? 'text-[#783A1D] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#783A1D]'
                : 'hover:text-[#24140D]'
            }`}
          >
            Women
          </button>
          <button
            onClick={() => handleNavClick('Unisex')}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 relative ${
              !isCorporateView && activeCategory === 'Unisex'
                ? 'text-[#783A1D] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#783A1D]'
                : 'hover:text-[#24140D]'
            }`}
          >
            Unisex
          </button>
          <button
            onClick={onOpenCorporate}
            className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer py-1 relative ${
              isCorporateView
                ? 'text-[#783A1D] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#783A1D]'
                : 'hover:text-[#24140D]'
            }`}
            title="Institutional & Corporate Gifting with Indian GST Quotations"
          >
            Corporate
          </button>
          <button
            onClick={onScrollToStories}
            className="transition-colors whitespace-nowrap shrink-0 cursor-pointer hover:text-[#783A1D] py-1"
            title="Verified patron stories & leather patina photos"
          >
            Patron Wall
          </button>
          <button
            onClick={onOpenAccount}
            className="transition-colors whitespace-nowrap shrink-0 cursor-pointer hover:text-[#783A1D] flex items-center gap-1.5"
            title="View past purchases and live delivery status"
          >
            <Package className="w-3.5 h-3.5 text-[#783A1D]" />
            <span>Orders</span>
            {ordersCount > 0 && (
              <span className="bg-[#EFE9DF] text-[#783A1D] font-mono text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-[#24140D]/10 tabular-nums">
                {ordersCount}
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: Wishlist + Account + Primary Action (Bag) + Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Wishlist Button */}
          <button
            onClick={onOpenWishlist}
            aria-label={`View patron wishlist containing ${wishlistCount} saved items`}
            className="relative p-2 rounded-lg text-[#24140D] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
            title="Patron Wishlist & Gift Registry"
          >
            <Bookmark className={`w-4 h-4 ${wishlistCount > 0 ? 'text-[#783A1D] fill-[#783A1D]/20' : 'text-[#783A1D]'}`} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#C29B38] text-[#24140D] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            onClick={onOpenAccount}
            aria-label="Customer profile and order history"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[#24140D] hover:bg-[#EFE9DF] transition-colors whitespace-nowrap shrink-0 text-xs font-medium cursor-pointer border border-[#24140D]/10"
            title={user ? `Signed in as ${user.displayName || user.email} (${role})` : "Sign in to Bharatvarsh Patron Account"}
          >
            {user ? (
              <>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Patron'}
                    className="w-5 h-5 rounded-full object-cover border border-[#C29B38]"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#783A1D] text-[#FAF7F2] flex items-center justify-center text-[10px] font-bold">
                    {(user.displayName || user.email || 'P')[0].toUpperCase()}
                  </div>
                )}
                <span className="max-w-[110px] truncate">
                  {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                    isOwner
                      ? 'bg-amber-900/15 text-amber-900 border border-amber-900/30'
                      : 'bg-stone-200 text-stone-700'
                  }`}
                >
                  {role}
                </span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-[#783A1D]" />
                <span>Sign In</span>
              </>
            )}
          </button>

          {isOwner && (
            <button
              onClick={onOpenAdmin}
              aria-label="Store Management (Owner Only)"
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-900/10 text-amber-900 hover:bg-amber-900/20 border border-amber-900/20 transition-colors whitespace-nowrap shrink-0 text-xs font-semibold cursor-pointer"
              title="Store Management & Catalog Control (Owner Only)"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-800" />
              <span>Store Admin</span>
            </button>
          )}

          <button
            onClick={onOpenCart}
            aria-label={`View cart containing ${cartCount} items`}
            className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-[#24140D] text-[#FAF7F2] hover:bg-[#3D2013] transition-colors whitespace-nowrap shrink-0 text-xs font-medium cursor-pointer shadow-sm"
          >
            <ShoppingBag className="w-4 h-4 text-[#C29B38]" />
            <span className="hidden sm:inline">Bag</span>
            <span className="bg-[#783A1D] text-[#FAF7F2] text-[11px] font-semibold px-2 py-0.5 rounded-full tabular-nums">
              {cartCount}
            </span>
          </button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 text-[#24140D] hover:bg-[#EFE9DF] rounded-md transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#24140D]/10 bg-[#FAF7F2] px-6 py-5 space-y-4 shadow-xl">
          {/* User Auth Status Bar */}
          <div
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAccount();
            }}
            className="p-3 rounded-xl bg-white border border-[#24140D]/10 flex items-center justify-between cursor-pointer hover:bg-[#EFE9DF]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Patron'}
                  className="w-8 h-8 rounded-full object-cover border border-[#C29B38]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#24140D] text-[#FAF7F2] flex items-center justify-center text-xs font-bold border border-[#C29B38]/30">
                  <User className="w-4 h-4 text-[#C29B38]" />
                </div>
              )}
              <div>
                <div className="font-semibold text-xs text-[#24140D]">
                  {user ? (user.displayName || user.email) : 'Patron Account'}
                </div>
                <div className="text-[10px] text-[#783A1D] flex items-center gap-1">
                  {user ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      <span>Firebase Verified</span>
                    </>
                  ) : (
                    <span>Sign in with Google / Email &rarr;</span>
                  )}
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-[#783A1D] px-2 py-1 rounded bg-[#FAF7F2] border border-[#783A1D]/20">
              {user ? 'View' : 'Login'}
            </span>
          </div>

          <div className="flex flex-col space-y-3 text-base">
            <button
              onClick={() => handleNavClick('All')}
              className="text-left font-medium py-1 text-[#24140D]"
            >
              All Collections
            </button>
            <button
              onClick={() => handleNavClick('Men')}
              className="text-left font-medium py-1 text-[#24140D]"
            >
              Men (Belts & Wallets)
            </button>
            <button
              onClick={() => handleNavClick('Women')}
              className="text-left font-medium py-1 text-[#24140D]"
            >
              Women (Belts, Wallets & Purses)
            </button>
            <button
              onClick={() => handleNavClick('Unisex')}
              className="text-left font-medium py-1 text-[#24140D]"
            >
              Unisex (Backpacks & Briefcases)
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenCorporate();
              }}
              className="text-left font-medium py-1 text-[#783A1D] flex items-center justify-between"
            >
              <span>Corporate Gifting & GST Quotes</span>
              <span className="text-[10px] bg-[#C29B38]/20 text-[#783A1D] font-semibold px-2 py-0.5 rounded">
                B2B Suite
              </span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenWishlist();
              }}
              className="text-left font-medium py-1 text-[#783A1D] flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                <span>Patron Wishlist & Gifts</span>
              </span>
              <span className="text-xs bg-[#EFE9DF] px-2 py-0.5 rounded font-mono font-bold">
                {wishlistCount}
              </span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAccount();
              }}
              className="text-left font-medium py-1 text-[#783A1D] flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>My Orders & Account</span>
              </span>
              <span className="text-xs bg-[#EFE9DF] px-2 py-0.5 rounded font-mono font-bold">
                {ordersCount}
              </span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onScrollToStories) onScrollToStories();
              }}
              className="text-left font-medium py-1 text-[#24140D] flex items-center justify-between"
            >
              <span>Patron Chronicles & Patina Wall</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                ★ 4.9 Reviews
              </span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onScrollToStory();
              }}
              className="text-left font-medium py-1 text-[#24140D]"
            >
              Craftsmanship & Heritage
            </button>
            {isOwner && (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className="text-left font-medium py-1 text-[#783A1D] flex items-center gap-2 pt-2 border-t border-[#24140D]/10"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Store Management (Owner)</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

import React from 'react';
import { CartItem } from '../types';
import { X, Trash2, ArrowRight, ShieldCheck, Sparkles, ShoppingBag } from 'lucide-react';
import { ProductImage } from './ProductImage';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
}

const FREE_SHIPPING_THRESHOLD = 2999;

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) => {
  if (!isOpen) return null;

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const progressToFreeShipping = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col border-l border-[#24140D]/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-[#24140D]/10 flex items-center justify-between bg-[#FAF7F2]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#783A1D]" />
            <h2 className="font-serif text-xl font-bold text-[#24140D]">Your Shopping Bag</h2>
            <span className="text-xs font-mono font-semibold text-[#783A1D] tabular-nums">
              ({items.reduce((acc, i) => acc + i.quantity, 0)})
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart drawer"
            className="p-1.5 rounded-lg text-[#24140D]/60 hover:text-[#24140D] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div className="px-6 py-3 bg-[#EFE9DF]/80 border-b border-[#24140D]/10 text-xs">
          {remainingForFreeShipping > 0 ? (
            <div className="space-y-1.5">
              <p className="text-[#24140D]/80">
                Add <span className="font-mono font-bold text-[#783A1D]">₹{remainingForFreeShipping.toLocaleString('en-IN')}</span> more for <strong className="text-[#24140D]">Free Insured Express Delivery</strong>
              </p>
              <div className="w-full bg-[#FAF7F2] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#783A1D] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${progressToFreeShipping}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[#24140D] font-medium">
              <Sparkles className="w-4 h-4 text-[#C29B38]" />
              <span>Complimentary Insured Express Delivery unlocked!</span>
            </div>
          )}
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
              <div className="w-16 h-16 rounded-full bg-[#EFE9DF] flex items-center justify-center text-[#783A1D]">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-[#24140D]">Your bag is empty</h3>
                <p className="text-xs text-[#24140D]/60 max-w-xs">
                  Browse our handcrafted collections of full-grain leather belts, wallets, and bags.
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-lg bg-[#24140D] text-[#FAF7F2] text-xs font-semibold hover:bg-[#3D2013] transition-colors cursor-pointer"
              >
                Explore Catalog
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-white border border-[#24140D]/10 flex gap-4 items-start shadow-2xs"
              >
                {/* Thumbnail */}
                <div className="w-18 h-18 rounded-lg overflow-hidden shrink-0 border border-[#24140D]/10 bg-[#EFE9DF]">
                  <ProductImage
                    src={item.product.images[0]}
                    alt={item.product.name}
                    aspectRatio="square"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif text-sm font-bold text-[#24140D] truncate">
                      {item.product.name}
                    </h4>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      aria-label="Remove item"
                      className="text-[#24140D]/40 hover:text-red-700 transition-colors p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#24140D]/70">
                    <span>Shade: {item.selectedColor}</span>
                    {item.monogramText && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[#783A1D] font-mono font-bold tracking-widest">
                          [{item.monogramText}]
                        </span>
                      </>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    {/* Stepper */}
                    <div className="flex items-center border border-[#24140D]/20 rounded-md bg-[#FAF7F2]">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="px-2 py-0.5 text-xs font-bold text-[#24140D] hover:bg-[#EFE9DF] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-mono font-bold tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="px-2 py-0.5 text-xs font-bold text-[#24140D] hover:bg-[#EFE9DF] cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    {/* Price */}
                    <span className="font-mono font-bold text-sm text-[#24140D] tabular-nums">
                      ₹{(item.product.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-6 border-t border-[#24140D]/10 bg-white space-y-4">
            <div className="space-y-1.5 text-xs text-[#24140D]/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-semibold text-[#24140D] tabular-nums">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Insured Express Shipping</span>
                <span className="font-mono tabular-nums">
                  {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                    <span className="text-emerald-700 font-semibold">Free</span>
                  ) : (
                    '₹250'
                  )}
                </span>
              </div>
              <div className="flex justify-between font-serif text-base font-bold text-[#24140D] pt-2 border-t border-[#24140D]/10">
                <span>Estimated Total</span>
                <span className="font-mono tabular-nums">
                  ₹{(subtotal + (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 250)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3.5 px-4 rounded-lg bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 text-[#C29B38]" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[10px] text-[#24140D]/60 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#783A1D]" />
              <span>Secured by 256-bit encrypted checkout</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

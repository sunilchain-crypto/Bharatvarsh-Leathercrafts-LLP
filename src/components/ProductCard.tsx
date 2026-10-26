import React from 'react';
import { Product } from '../types';
import { ProductImage } from './ProductImage';
import { Eye, Plus, Bookmark } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  onToggleWishlist?: (product: Product) => void;
  isInWishlist?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onQuickAdd,
  onToggleWishlist,
  isInWishlist = false
}) => {
  return (
    <div className="group relative flex flex-col bg-[#FAF7F2] border border-[#24140D]/10 hover:border-[#783A1D]/40 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      {/* Image Area with Quick Action Overlays */}
      <div className="relative overflow-hidden cursor-pointer" onClick={() => onSelect(product)}>
        <ProductImage
          src={product.images[0]}
          alt={product.name}
          category={product.productType}
          aspectRatio="square"
        />

        {/* Subtle Editorial Tag (No pill boxes, clean refined tag) */}
        {product.badge && (
          <div className="absolute top-3 left-3 bg-[#24140D]/90 backdrop-blur-sm text-[#EFE9DF] text-[10px] tracking-wider uppercase font-medium px-2.5 py-1 rounded">
            {product.badge}
          </div>
        )}

        {/* Wishlist Bookmark Button (Top Right) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist?.(product);
          }}
          aria-label={isInWishlist ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all cursor-pointer backdrop-blur-xs shadow-sm z-10 ${
            isInWishlist
              ? 'bg-[#24140D] text-[#C29B38] scale-105 ring-1 ring-[#C29B38]/50'
              : 'bg-[#FAF7F2]/80 hover:bg-[#FAF7F2] text-[#24140D]/70 hover:text-[#783A1D]'
          }`}
          title={isInWishlist ? 'Saved in your wishlist' : 'Save to wishlist'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isInWishlist ? 'fill-current text-[#C29B38]' : ''}`} />
        </button>

        {/* Quick Actions Hover Drawer */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-[#24140D]/90 via-[#24140D]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="flex-1 py-2 px-3 rounded bg-[#FAF7F2] text-[#24140D] hover:bg-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Examine</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(product);
            }}
            className="py-2 px-3 rounded bg-[#783A1D] text-[#FAF7F2] hover:bg-[#8F4725] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Add to shopping bag"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Unboxed Metadata with · separator */}
          <div className="flex items-center gap-1.5 text-[11px] text-[#783A1D] uppercase tracking-wider font-medium mb-1">
            <span>{product.category}</span>
            <span aria-hidden="true" className="text-[#24140D]/30">·</span>
            <span className="text-[#24140D]/70">{product.productType}</span>
          </div>

          {/* Product Title */}
          <h3
            onClick={() => onSelect(product)}
            className="font-serif text-lg font-bold text-[#24140D] group-hover:text-[#783A1D] transition-colors cursor-pointer line-clamp-1"
          >
            {product.name}
          </h3>

          <p className="text-xs text-[#24140D]/70 line-clamp-2 mt-1 leading-relaxed">
            {product.shortDescription}
          </p>
        </div>

        {/* Pricing, Colors, and CTA Footer */}
        <div className="pt-3 border-t border-[#24140D]/10 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-[#24140D] font-mono tabular-nums">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-[#24140D]/40 line-through font-mono tabular-nums">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Available Color Swatch Dots */}
          <div className="flex items-center gap-1" title={`${product.colors.length} shades available`}>
            {product.colors.map((c, idx) => (
              <span
                key={idx}
                className="w-3 h-3 rounded-full border border-black/20 shadow-xs inline-block"
                style={{ backgroundColor: c.hex }}
                title={c.name}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

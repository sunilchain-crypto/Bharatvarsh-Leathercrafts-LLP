import React, { useState, useMemo } from 'react';
import { CategoryStructure, Product, TopCategory } from '../types';
import { ProductCard } from './ProductCard';
import { Search, SlidersHorizontal, ArrowUpDown, LayoutGrid, ListFilter, Layers } from 'lucide-react';

interface CatalogSectionProps {
  categories: CategoryStructure[];
  products: Product[];
  activeCategory: TopCategory | 'All';
  onSelectCategory: (category: TopCategory | 'All') => void;
  onSelectProduct: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
  wishlistProductIds?: string[];
  onToggleWishlist?: (product: Product) => void;
}

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  categories,
  products,
  activeCategory,
  onSelectCategory,
  onSelectProduct,
  onQuickAdd,
  wishlistProductIds = [],
  onToggleWishlist
}) => {
  const [activeProductType, setActiveProductType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [groupBySection, setGroupBySection] = useState(false);

  // Compute available product types based on active category
  const availableProductTypes = useMemo(() => {
    if (activeCategory === 'All') {
      const allTypes = new Set<string>();
      categories.forEach((cat) => cat.productTypes.forEach((pt) => allTypes.add(pt)));
      return Array.from(allTypes);
    }
    const cat = categories.find(
      (c) => c.name.toLowerCase() === activeCategory.toLowerCase()
    );
    return cat ? cat.productTypes : [];
  }, [activeCategory, categories]);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      // Category filter
      if (activeCategory !== 'All' && p.category.toLowerCase() !== activeCategory.toLowerCase()) {
        return false;
      }
      // Product type filter
      if (activeProductType !== 'All' && p.productType.toLowerCase() !== activeProductType.toLowerCase()) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(query);
        const matchDesc = p.description.toLowerCase().includes(query);
        const matchType = p.productType.toLowerCase().includes(query);
        const matchLeather = p.leatherType.toLowerCase().includes(query);
        if (!matchName && !matchDesc && !matchType && !matchLeather) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // Featured: items with isFeatured first
      result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }

    return result;
  }, [products, activeCategory, activeProductType, searchQuery, sortBy]);

  // Grouped by Category & Product Type when in Grouped Mode
  const groupedSections = useMemo(() => {
    if (!groupBySection) return [];

    const activeCats =
      activeCategory === 'All'
        ? categories
        : categories.filter((c) => c.name.toLowerCase() === activeCategory.toLowerCase());

    return activeCats.map((cat) => {
      const types =
        activeProductType === 'All'
          ? cat.productTypes
          : cat.productTypes.filter((pt) => pt.toLowerCase() === activeProductType.toLowerCase());

      const typeSections = types.map((pt) => {
        const items = filteredProducts.filter(
          (p) =>
            p.category.toLowerCase() === cat.name.toLowerCase() &&
            p.productType.toLowerCase() === pt.toLowerCase()
        );
        return { productType: pt, items };
      }).filter((section) => section.items.length > 0);

      return {
        category: cat,
        sections: typeSections
      };
    }).filter((group) => group.sections.length > 0);
  }, [groupBySection, categories, activeCategory, activeProductType, filteredProducts]);

  return (
    <section id="catalog-section" className="py-16 bg-[#FAF7F2]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#24140D]/10 pb-8">
          <div>
            <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#783A1D] font-semibold mb-2">
              <span>Bharatvarsh Catalog</span>
              <span aria-hidden="true" className="text-[#24140D]/30">·</span>
              <span>Unlimited Artisanal Capacity</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#24140D] tracking-tight">
              {activeCategory === 'All' ? 'The Complete Leather Collection' : `${activeCategory}’s Leather Collection`}
            </h2>
            <p className="text-sm text-[#24140D]/70 max-w-xl mt-2 leading-relaxed">
              {activeCategory === 'All'
                ? 'Handcrafted belts, wallets, purses, backpacks, and briefcases fashioned from full-grain vegetable-tanned hides.'
                : categories.find((c) => c.name === activeCategory)?.description}
            </p>
          </div>

          {/* Quick view statistics */}
          <div className="flex items-center gap-4 text-xs text-[#24140D]/70">
            <span className="font-mono tabular-nums font-semibold text-[#24140D] bg-[#EFE9DF] px-3 py-1.5 rounded-lg border border-[#24140D]/10">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Design' : 'Designs'} Available
            </span>
            <button
              onClick={() => setGroupBySection(!groupBySection)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                groupBySection
                  ? 'bg-[#24140D] text-[#FAF7F2] border-[#24140D]'
                  : 'bg-[#FAF7F2] text-[#24140D] border-[#24140D]/20 hover:bg-[#EFE9DF]'
              }`}
              title="Organize by category and product type sections"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{groupBySection ? 'Section Mode On' : 'Group by Type'}</span>
            </button>
          </div>
        </div>

        {/* Category Architecture Controls */}
        <div className="space-y-4">
          {/* Top-Level Categories (Men, Women, Unisex, All) - Interactive Tab Control */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#24140D]/60 mr-2">
              Category:
            </span>
            <button
              onClick={() => {
                onSelectCategory('All');
                setActiveProductType('All');
              }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                activeCategory === 'All'
                  ? 'bg-[#24140D] text-[#FAF7F2] shadow-sm'
                  : 'bg-[#EFE9DF] text-[#24140D]/80 hover:bg-[#E5DDD0] hover:text-[#24140D]'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  onSelectCategory(cat.name);
                  setActiveProductType('All');
                }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === cat.name
                    ? 'bg-[#24140D] text-[#FAF7F2] shadow-sm'
                    : 'bg-[#EFE9DF] text-[#24140D]/80 hover:bg-[#E5DDD0] hover:text-[#24140D]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Sub-Product Types Filter */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#24140D]/10">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#24140D]/60 mr-2 flex items-center gap-1">
              <ListFilter className="w-3 h-3 text-[#783A1D]" />
              Type:
            </span>
            <button
              onClick={() => setActiveProductType('All')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeProductType === 'All'
                  ? 'bg-[#783A1D] text-[#FAF7F2]'
                  : 'bg-transparent text-[#24140D]/70 hover:text-[#24140D] hover:bg-[#EFE9DF]'
              }`}
            >
              All Types
            </button>
            {availableProductTypes.map((type) => (
              <button
                key={type}
                onClick={() => setActiveProductType(type)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  activeProductType === type
                    ? 'bg-[#783A1D] text-[#FAF7F2]'
                    : 'bg-transparent text-[#24140D]/70 hover:text-[#24140D] hover:bg-[#EFE9DF]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Search, Sort, and Query Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#24140D]/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search leather belts, bifold wallets, briefcases..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-lg bg-white border border-[#24140D]/20 focus:outline-none focus:border-[#783A1D] text-[#24140D] placeholder-[#24140D]/40"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#24140D]/40 hover:text-[#24140D]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-[#24140D]/60 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5" />
                Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products by"
                className="text-xs bg-white border border-[#24140D]/20 rounded-lg px-3 py-2 text-[#24140D] font-medium focus:outline-none focus:border-[#783A1D] cursor-pointer"
              >
                <option value="featured">Featured Artisanal First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name">Product Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Display: Grouped Mode vs Unified Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#EFE9DF]/50 rounded-2xl border border-[#24140D]/10 space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#EFE9DF] flex items-center justify-center text-[#783A1D]">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#24140D]">No leathercraft pieces found</h3>
            <p className="text-xs text-[#24140D]/60 max-w-sm mx-auto">
              We could not find any products matching your active search or filters. Try clearing your search query.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveProductType('All');
                onSelectCategory('All');
              }}
              className="px-4 py-2 bg-[#24140D] text-[#FAF7F2] text-xs font-semibold rounded-lg hover:bg-[#3D2013] transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : groupBySection ? (
          /* Grouped by Category & Product Type */
          <div className="space-y-16">
            {groupedSections.map((group) => (
              <div key={group.category.id} className="space-y-10">
                <div className="border-b-2 border-[#783A1D]/20 pb-3">
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#24140D]">
                    {group.category.name} Collection
                  </h3>
                  <p className="text-xs text-[#24140D]/60 mt-1">{group.category.description}</p>
                </div>

                {group.sections.map((section) => (
                  <div key={section.productType} className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#783A1D]" />
                        <h4 className="font-serif text-xl font-bold text-[#24140D]">
                          {section.productType}
                        </h4>
                        <span className="text-xs text-[#24140D]/50 font-mono">
                          ({section.items.length})
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                      {section.items.map((prod) => (
                        <ProductCard
                          key={prod.id}
                          product={prod}
                          onSelect={onSelectProduct}
                          onQuickAdd={onQuickAdd}
                          onToggleWishlist={onToggleWishlist}
                          isInWishlist={wishlistProductIds.includes(prod.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          /* Standard Unified Responsive 3-to-4 Column Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={onSelectProduct}
                onQuickAdd={onQuickAdd}
                onToggleWishlist={onToggleWishlist}
                isInWishlist={wishlistProductIds.includes(product.id)}
              />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

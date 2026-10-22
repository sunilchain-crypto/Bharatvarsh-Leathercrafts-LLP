import React, { useState } from 'react';
import { CategoryStructure, Product, TopCategory } from '../types';
import { catalogService } from '../services/catalogService';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Copy,
  HelpCircle,
  FolderTree,
  Tag,
  PackageCheck
} from 'lucide-react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: CategoryStructure[];
  onCatalogChanged: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  products,
  categories,
  onCatalogChanged
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'json' | 'guide'>('products');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New/Edit form state
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<string>('Men');
  const [formProductType, setFormProductType] = useState<string>('Leather Belts');
  const [formPrice, setFormPrice] = useState<number>(3500);
  const [formOriginalPrice, setFormOriginalPrice] = useState<number>(4200);
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formLeatherType, setFormLeatherType] = useState('Full-Grain Vegetable-Tanned Cowhide');
  const [formHardware, setFormHardware] = useState('Solid Cast Antique Brass');
  const [formDimensions, setFormDimensions] = useState('38mm width / custom size');
  const [formImageUrl, setFormImageUrl] = useState('https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80');
  const [formBadge, setFormBadge] = useState('Artisan Signature');
  const [formInStock, setFormInStock] = useState(true);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formMonogram, setFormMonogram] = useState(true);
  const [formColors, setFormColors] = useState('Saddle Tan (#8B4513), Deep Espresso (#24140D)');
  const [formFeatures, setFormFeatures] = useState('Hand-beveled edges\nSaddle-stitched by hand\nSolid cast brass buckle');

  // Category manager state
  const [newCatTarget, setNewCatTarget] = useState<string>('Men');
  const [newProductTypeName, setNewProductTypeName] = useState('');

  // JSON editor state
  const [jsonText, setJsonText] = useState(catalogService.exportCatalogJSON());
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setEditingProduct(null);
    setIsAddingNew(false);
    setFormName('');
    setFormCategory('Men');
    setFormProductType('Leather Belts');
    setFormPrice(3500);
    setFormOriginalPrice(4200);
    setFormShortDesc('');
    setFormDesc('');
    setFormLeatherType('Full-Grain Vegetable-Tanned Cowhide');
    setFormHardware('Solid Cast Antique Brass');
    setFormDimensions('Standard custom sizing');
    setFormBadge('');
    setFormInStock(true);
    setFormFeatured(false);
    setFormMonogram(true);
    setFormColors('Saddle Tan (#8B4513), Deep Espresso (#24140D)');
    setFormFeatures('Hand-beveled edges\nSaddle-stitched by hand\nSolid cast brass');
  };

  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setIsAddingNew(false);
    setFormName(prod.name);
    setFormCategory(prod.category);
    setFormProductType(prod.productType);
    setFormPrice(prod.price);
    setFormOriginalPrice(prod.originalPrice || 0);
    setFormShortDesc(prod.shortDescription);
    setFormDesc(prod.description);
    setFormLeatherType(prod.leatherType);
    setFormHardware(prod.hardware);
    setFormDimensions(prod.dimensions);
    setFormImageUrl(prod.images[0] || '');
    setFormBadge(prod.badge || '');
    setFormInStock(prod.inStock);
    setFormFeatured(prod.isFeatured || false);
    setFormMonogram(prod.monogramAvailable);
    setFormColors(prod.colors.map((c) => `${c.name} (${c.hex})`).join(', '));
    setFormFeatures(prod.features.join('\n'));
    setActiveTab('products');
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    // Parse color string
    const parsedColors = formColors
      .split(',')
      .map((item) => {
        const match = item.match(/(.+)\s*\((#[0-9a-fA-F]{3,6})\)/);
        if (match) {
          return { name: match[1].trim(), hex: match[2].trim() };
        }
        return { name: item.trim(), hex: '#783A1D' };
      })
      .filter((c) => c.name.length > 0);

    const parsedFeatures = formFeatures
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const productPayload = {
      name: formName,
      category: formCategory,
      productType: formProductType,
      price: Number(formPrice),
      originalPrice: formOriginalPrice ? Number(formOriginalPrice) : undefined,
      shortDescription: formShortDesc || formName,
      description: formDesc || formShortDesc,
      images: [formImageUrl],
      leatherType: formLeatherType,
      hardware: formHardware,
      dimensions: formDimensions,
      colors: parsedColors.length ? parsedColors : [{ name: 'Cognac', hex: '#8B4513' }],
      features: parsedFeatures.length ? parsedFeatures : ['Full-grain leather', 'Saddle stitched'],
      monogramAvailable: formMonogram,
      inStock: formInStock,
      badge: formBadge ? formBadge : undefined,
      isFeatured: formFeatured
    };

    if (editingProduct) {
      catalogService.updateProduct({
        ...productPayload,
        id: editingProduct.id
      });
      setStatusMessage({ text: `Updated "${formName}" successfully!`, type: 'success' });
    } else {
      catalogService.addProduct(productPayload);
      setStatusMessage({ text: `Created new product "${formName}" successfully!`, type: 'success' });
    }

    onCatalogChanged();
    resetForm();
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleDeleteProduct = (productId: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the catalog?`)) {
      catalogService.deleteProduct(productId);
      onCatalogChanged();
      setStatusMessage({ text: `Removed "${name}" from store.`, type: 'success' });
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleAddProductType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductTypeName.trim()) return;

    catalogService.addProductType(newCatTarget, newProductTypeName.trim());
    setNewProductTypeName('');
    onCatalogChanged();
    setStatusMessage({
      text: `Added new product type "${newProductTypeName}" to ${newCatTarget}!`,
      type: 'success'
    });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleApplyJSON = () => {
    const res = catalogService.importCatalogJSON(jsonText);
    if (res.success) {
      onCatalogChanged();
      setStatusMessage({ text: `Imported ${res.count} products successfully!`, type: 'success' });
    } else {
      setStatusMessage({ text: res.error || 'Import failed', type: 'error' });
    }
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all catalog modifications and restore initial factory products?')) {
      catalogService.resetToDefaults();
      onCatalogChanged();
      setJsonText(catalogService.exportCatalogJSON());
      setStatusMessage({ text: 'Catalog reset to factory default.', type: 'success' });
      setTimeout(() => setStatusMessage(null), 3500);
    }
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(jsonText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden border border-[#24140D]/15 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#24140D]/10 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#24140D] text-[#FAF7F2] flex items-center justify-center">
              <FolderTree className="w-4 h-4 text-[#C29B38]" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#24140D] leading-tight">
                Store Manager & Catalog CMS
              </h2>
              <span className="text-[11px] text-[#783A1D] uppercase tracking-wider font-semibold">
                Bharatvarsh Leathercrafts LLP Content Engine
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close admin panel"
            className="p-1.5 rounded-lg text-[#24140D]/60 hover:text-[#24140D] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 bg-[#FAF7F2] border-b border-[#24140D]/10 flex gap-4 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('products');
              resetForm();
            }}
            className={`py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-[#783A1D] text-[#783A1D]'
                : 'border-transparent text-[#24140D]/60 hover:text-[#24140D]'
            }`}
          >
            Products ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-[#783A1D] text-[#783A1D]'
                : 'border-transparent text-[#24140D]/60 hover:text-[#24140D]'
            }`}
          >
            Category Architecture
          </button>
          <button
            onClick={() => {
              setJsonText(catalogService.exportCatalogJSON());
              setActiveTab('json');
            }}
            className={`py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'json'
                ? 'border-[#783A1D] text-[#783A1D]'
                : 'border-transparent text-[#24140D]/60 hover:text-[#24140D]'
            }`}
          >
            JSON Source Code
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-[#783A1D] text-[#783A1D]'
                : 'border-transparent text-[#24140D]/60 hover:text-[#24140D]'
            }`}
          >
            Owner Guide & Documentation
          </button>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div
            className={`px-6 py-2 text-xs font-medium flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-red-50 text-red-800 border-b border-red-200'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)}>✕</button>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">

          {/* TAB 1: PRODUCT LIST & EDITOR */}
          {activeTab === 'products' && (
            <div className="space-y-8">
              {/* If editing or adding new */}
              {(isAddingNew || editingProduct) ? (
                <div className="p-6 rounded-xl bg-white border border-[#24140D]/15 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#24140D]/10 pb-3">
                    <h3 className="font-serif text-lg font-bold text-[#24140D]">
                      {editingProduct ? `Edit Product: ${editingProduct.name}` : 'Add New Handcrafted Product'}
                    </h3>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-xs text-[#24140D]/60 hover:text-[#24140D] cursor-pointer"
                    >
                      Cancel & Return
                    </button>
                  </div>

                  <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#24140D] mb-1">Product Title *</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. The Viceroy Full-Grain Bridle Belt"
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Top Category *</label>
                      <select
                        value={formCategory}
                        onChange={(e) => {
                          setFormCategory(e.target.value);
                          // Default product type for category
                          const cat = categories.find((c) => c.name === e.target.value);
                          if (cat && cat.productTypes.length > 0) {
                            setFormProductType(cat.productTypes[0]);
                          }
                        }}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      >
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Unisex">Unisex</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Product Type Section *</label>
                      <input
                        type="text"
                        required
                        list="available-types"
                        value={formProductType}
                        onChange={(e) => setFormProductType(e.target.value)}
                        placeholder="e.g. Leather Belts, Wallets, Purses, Backpacks..."
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                      <datalist id="available-types">
                        <option value="Leather Belts" />
                        <option value="Belts" />
                        <option value="Wallets" />
                        <option value="Purses" />
                        <option value="Backpacks" />
                        <option value="Briefcases" />
                      </datalist>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Price in INR (₹) *</label>
                      <input
                        type="number"
                        required
                        min={100}
                        value={formPrice}
                        onChange={(e) => setFormPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Original Price (₹ - Optional)</label>
                      <input
                        type="number"
                        min={0}
                        value={formOriginalPrice || ''}
                        onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#24140D] mb-1">Image URL</label>
                      <input
                        type="url"
                        value={formImageUrl}
                        onChange={(e) => setFormImageUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                      <p className="text-[10px] text-[#24140D]/60 mt-1">
                        Accepts any high-res URL. If left empty, our signature leather fallback art is displayed automatically.
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#24140D] mb-1">Short Description (for cards) *</label>
                      <input
                        type="text"
                        required
                        value={formShortDesc}
                        onChange={(e) => setFormShortDesc(e.target.value)}
                        placeholder="38mm English bridle cut with hand-burnished edges..."
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#24140D] mb-1">Detailed Description *</label>
                      <textarea
                        rows={3}
                        required
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        placeholder="Full story, craftsmanship details, hide tanning, and stitching..."
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Leather Type</label>
                      <input
                        type="text"
                        value={formLeatherType}
                        onChange={(e) => setFormLeatherType(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Hardware</label>
                      <input
                        type="text"
                        value={formHardware}
                        onChange={(e) => setFormHardware(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Dimensions</label>
                      <input
                        type="text"
                        value={formDimensions}
                        onChange={(e) => setFormDimensions(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#24140D] mb-1">Editorial Tag / Badge</label>
                      <input
                        type="text"
                        value={formBadge}
                        onChange={(e) => setFormBadge(e.target.value)}
                        placeholder="e.g. Masterpiece, Best Seller, Artisan"
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#24140D] mb-1">
                        Color Variations (Format: Name (#hex), Name (#hex))
                      </label>
                      <input
                        type="text"
                        value={formColors}
                        onChange={(e) => setFormColors(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#24140D] mb-1">
                        Features (one per line)
                      </label>
                      <textarea
                        rows={3}
                        value={formFeatures}
                        onChange={(e) => setFormFeatures(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-wrap gap-6 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formInStock}
                          onChange={(e) => setFormInStock(e.target.checked)}
                          className="accent-[#783A1D]"
                        />
                        <span>In Stock</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formFeatured}
                          onChange={(e) => setFormFeatured(e.target.checked)}
                          className="accent-[#783A1D]"
                        />
                        <span>Feature on Homepage</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formMonogram}
                          onChange={(e) => setFormMonogram(e.target.checked)}
                          className="accent-[#783A1D]"
                        />
                        <span>Support Monogramming</span>
                      </label>
                    </div>

                    <div className="sm:col-span-2 pt-4 flex justify-end gap-3 border-t border-[#24140D]/10">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 rounded-lg border border-[#24140D]/20 hover:bg-[#FAF7F2] text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-lg bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider shadow-sm"
                      >
                        {editingProduct ? 'Save Product Changes' : 'Create & Publish Product'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Product Table View */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#24140D]">Active Products</h3>
                      <p className="text-xs text-[#24140D]/60">Manage existing inventory, prices, and descriptions</p>
                    </div>
                    <button
                      onClick={() => {
                        resetForm();
                        setIsAddingNew(true);
                      }}
                      className="px-4 py-2 bg-[#783A1D] hover:bg-[#8F4725] text-[#FAF7F2] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add New Product</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#24140D]/10 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF7F2] border-b border-[#24140D]/10 text-[#24140D]/60 uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="py-3 px-4">Item</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Price</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#24140D]/5">
                        {products.map((p) => (
                          <tr key={p.id} className="hover:bg-[#FAF7F2]/50 transition-colors">
                            <td className="py-3 px-4 font-medium text-[#24140D]">
                              <div className="font-semibold">{p.name}</div>
                              <div className="text-[10px] text-[#24140D]/50 font-mono">{p.id}</div>
                            </td>
                            <td className="py-3 px-4 text-[#783A1D] font-medium">{p.category}</td>
                            <td className="py-3 px-4 text-[#24140D]/80">{p.productType}</td>
                            <td className="py-3 px-4 font-mono font-semibold tabular-nums">
                              ₹{p.price.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                                {p.inStock ? 'Active' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                onClick={() => startEditProduct(p)}
                                className="p-1 text-[#24140D]/60 hover:text-[#783A1D] cursor-pointer"
                                title="Edit product"
                              >
                                <Edit2 className="w-3.5 h-3.5 inline" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1 text-[#24140D]/60 hover:text-red-700 cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 className="w-3.5 h-3.5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CATEGORY ARCHITECTURE */}
          {activeTab === 'categories' && (
            <div className="space-y-8">
              <div className="p-5 rounded-xl bg-white border border-[#24140D]/15 space-y-4 shadow-sm">
                <h3 className="font-serif text-lg font-bold text-[#24140D]">
                  Add Product Type / Section
                </h3>
                <p className="text-xs text-[#24140D]/70">
                  Extend any top-level category with unlimited browsable product types (e.g. Add "Cardholders" to Men, or "Duffel Bags" to Unisex).
                </p>

                <form onSubmit={handleAddProductType} className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={newCatTarget}
                    onChange={(e) => setNewCatTarget(e.target.value)}
                    className="px-3 py-2 text-xs bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                  >
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Unisex">Unisex</option>
                  </select>
                  <input
                    type="text"
                    required
                    placeholder="New Product Type (e.g., Cardholders, Tote Bags, Travel Pouches)"
                    value={newProductTypeName}
                    onChange={(e) => setNewProductTypeName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Type</span>
                  </button>
                </form>
              </div>

              {/* Category Tree Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-5 rounded-xl bg-white border border-[#24140D]/10 space-y-3 shadow-xs"
                  >
                    <div className="flex items-center justify-between border-b border-[#24140D]/10 pb-2">
                      <h4 className="font-serif text-lg font-bold text-[#24140D]">{cat.name}</h4>
                      <span className="text-[10px] text-[#783A1D] uppercase tracking-wider font-semibold font-mono">
                        {cat.productTypes.length} Types
                      </span>
                    </div>
                    <p className="text-[11px] text-[#24140D]/60 leading-snug">{cat.description}</p>
                    
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[10px] uppercase tracking-wider text-[#24140D]/50 font-semibold block">
                        Included Product Types:
                      </span>
                      {cat.productTypes.map((pt) => {
                        const count = products.filter(
                          (p) => p.category.toLowerCase() === cat.name.toLowerCase() && p.productType.toLowerCase() === pt.toLowerCase()
                        ).length;
                        return (
                          <div
                            key={pt}
                            className="flex items-center justify-between py-1 px-2.5 rounded bg-[#FAF7F2] text-xs text-[#24140D]"
                          >
                            <span>{pt}</span>
                            <span className="font-mono text-[11px] text-[#783A1D]">{count} items</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: JSON SOURCE CODE */}
          {activeTab === 'json' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#24140D]">Structured Catalog JSON</h3>
                  <p className="text-xs text-[#24140D]/60">
                    Export, modify, or restore the complete store database in pure JSON.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyJSON}
                    className="px-3 py-1.5 rounded-lg border border-[#24140D]/20 text-xs font-semibold flex items-center gap-1.5 hover:bg-[#EFE9DF] cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                  <button
                    onClick={handleResetDefaults}
                    className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1.5 hover:bg-red-50 cursor-pointer"
                    title="Restore initial products"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Factory Reset</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={16}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full font-mono text-xs p-4 bg-[#24140D] text-[#EFE9DF] rounded-xl border border-[#24140D]/20 focus:outline-none focus:ring-1 focus:ring-[#C29B38]"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleApplyJSON}
                  className="px-6 py-2.5 rounded-lg bg-[#783A1D] hover:bg-[#8F4725] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
                >
                  Apply & Save JSON Changes
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: OWNER GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-6 max-w-2xl text-xs text-[#24140D]/80 leading-relaxed">
              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-bold text-[#24140D]">
                  How to Manage Bharatvarsh Leathercrafts LLP
                </h3>
                <p className="text-[#24140D]/70">
                  This storefront is built with zero lock-in: products and categories can be updated through the Admin Panel UI, or directly by committing edits to <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">src/data/products.json</code>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 space-y-3">
                <h4 className="font-serif text-base font-bold text-[#24140D] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#783A1D] text-[#FAF7F2] text-[11px] flex items-center justify-center">1</span>
                  <span>Adding a New Product via Admin UI</span>
                </h4>
                <p>
                  Click <strong>"Add New Product"</strong> on the Products tab. Choose the top category (Men, Women, or Unisex), assign a product type section (e.g. Leather Belts, Wallets, Purses, Backpacks, Briefcases), enter the pricing in INR (₹), upload or paste an image URL, and select custom leather shades. Click <strong>"Create & Publish Product"</strong> to make it live immediately.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 space-y-3">
                <h4 className="font-serif text-base font-bold text-[#24140D] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#783A1D] text-[#FAF7F2] text-[11px] flex items-center justify-center">2</span>
                  <span>Adding New Categories or Product Types</span>
                </h4>
                <p>
                  Switch to the <strong>"Category Architecture"</strong> tab. You can add new sub-product types (e.g., "Cardholders", "Passport Sleeves", "Duffel Bags") to any top-level category. The catalog grid will instantly display the new section.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 space-y-3">
                <h4 className="font-serif text-base font-bold text-[#24140D] flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#783A1D] text-[#FAF7F2] text-[11px] flex items-center justify-center">3</span>
                  <span>Connecting Live Razorpay / Stripe Payments</span>
                </h4>
                <p>
                  Payments are isolated in <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">src/services/paymentService.ts</code>. Simply add your Razorpay Key ID (<code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">VITE_RAZORPAY_KEY_ID</code>) in your <code className="font-mono bg-[#EFE9DF] px-1 py-0.5 rounded">.env</code> file. The app will immediately activate real payment authorization with zero code edits.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

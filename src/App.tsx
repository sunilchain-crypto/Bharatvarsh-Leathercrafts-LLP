import React, { useState, useEffect } from 'react';
import { TopCategory, Product, CartItem, Order, WishlistItem, WishlistRegistry } from './types';
import { catalogService } from './services/catalogService';
import { orderService } from './services/orderService';
import { wishlistService } from './services/wishlistService';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CatalogSection } from './components/CatalogSection';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AccountModal } from './components/AccountModal';
import { WishlistModal } from './components/WishlistModal';
import { AdminPanelModal } from './components/AdminPanelModal';
import { PaymentSettingsModal } from './components/PaymentSettingsModal';
import { SetupGuideModal } from './components/SetupGuideModal';
import { CorporateGiftingView } from './components/CorporateGiftingView';
import { BrandStory } from './components/BrandStory';
import { PatronStoriesWall } from './components/PatronStoriesWall';
import { LeatherConciergeWidget } from './components/LeatherConciergeWidget';
import { Footer } from './components/Footer';
import { Check, ShoppingBag } from 'lucide-react';

const CART_STORAGE_KEY = 'blc_shopping_cart_v1';

export default function App() {
  const [categories, setCategories] = useState(() => catalogService.getCategories());
  const [products, setProducts] = useState(() => catalogService.getProducts());
  const [orders, setOrders] = useState<Order[]>(() => orderService.getOrders());
  const [activeCategory, setActiveCategory] = useState<TopCategory | 'All'>('All');
  const [isCorporateView, setIsCorporateView] = useState(false);

  // Modals state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);

  // Patron Wishlist & Shared Registry state
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => wishlistService.getWishlist());
  const [activeSharedRegistry, setActiveSharedRegistry] = useState<WishlistRegistry | null>(null);

  // Check URL on load for shared registry link (?registry=...)
  useEffect(() => {
    const shared = wishlistService.parseRegistryFromUrl(products);
    if (shared && shared.items.length > 0) {
      setActiveSharedRegistry(shared);
      setIsWishlistOpen(true);
      showToast(`Viewing ${shared.patronName}’s Gift Registry`);
    }
  }, [products]);

  // Cart state with persistence
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Failed to persist cart items', e);
    }
  }, [cartItems]);

  const refreshCatalog = () => {
    setCategories(catalogService.getCategories());
    setProducts(catalogService.getProducts());
  };

  const refreshOrders = () => {
    setOrders(orderService.getOrders());
  };

  const refreshWishlist = () => {
    setWishlist(wishlistService.getWishlist());
  };

  const handleToggleWishlist = (product: Product, selectedColor?: string, monogramText?: string) => {
    const color = selectedColor || product.colors[0]?.name || 'Standard';
    const isCurrentlySaved = wishlist.some((it) => it.product.id === product.id);

    if (isCurrentlySaved) {
      const remaining = wishlistService.removeFromWishlist(product.id);
      setWishlist(remaining);
      showToast(`Removed "${product.name}" from your wishlist`);
    } else {
      const { isNew } = wishlistService.addToWishlist(product, color, monogramText);
      setWishlist(wishlistService.getWishlist());
      showToast(isNew ? `Saved "${product.name}" to your patron wishlist` : `Updated "${product.name}" preferences in wishlist`);
    }
  };

  const handleMoveToBagFromWishlist = (item: WishlistItem) => {
    handleAddToCart(item.product, item.selectedColor, item.monogramText, 1);
    setIsWishlistOpen(false);
  };

  const wishlistProductIds = wishlist.map((it) => it.product.id);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Cart operations
  const handleAddToCart = (
    product: Product,
    selectedColor: string,
    monogramText?: string,
    quantity: number = 1
  ) => {
    const existingIndex = cartItems.findIndex(
      (item) =>
        item.product.id === product.id &&
        item.selectedColor === selectedColor &&
        item.monogramText === monogramText
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += quantity;
      setCartItems(updated);
    } else {
      const newItem: CartItem = {
        id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        product,
        selectedColor,
        monogramText,
        quantity
      };
      setCartItems([...cartItems, newItem]);
    }

    showToast(`Added "${product.name}" (${selectedColor}) to your bag`);
    setSelectedProduct(null);
  };

  const handleQuickAdd = (product: Product) => {
    const defaultColor = product.colors[0]?.name || 'Standard';
    handleAddToCart(product, defaultColor, undefined, 1);
  };

  const handleBuyNow = (
    product: Product,
    selectedColor: string,
    monogramText?: string,
    quantity: number = 1
  ) => {
    handleAddToCart(product, selectedColor, monogramText, quantity);
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleUpdateCartQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleOrderSuccess = (order: Order) => {
    // Record order in customer order history
    orderService.addOrder(order);
    refreshOrders();

    // Clear cart on successful purchase
    setCartItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch (e) {
      console.warn(e);
    }
  };

  const handleReorder = (items: CartItem[]) => {
    setCartItems((prev) => [...prev, ...items]);
    showToast(`Added ${items.length} item(s) from past order back to bag`);
    setIsCartOpen(true);
  };

  const scrollToStory = () => {
    const el = document.getElementById('craftsmanship-story');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToStories = () => {
    const el = document.getElementById('patron-stories');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cartTotalCount = cartItems.reduce((acc, it) => acc + it.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#24140D] flex flex-col selection:bg-[#783A1D] selection:text-[#FAF7F2]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#24140D] text-[#FAF7F2] border border-[#C29B38]/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-5 h-5 rounded-full bg-[#783A1D] flex items-center justify-center text-[#FAF7F2]">
            <Check className="w-3 h-3 text-[#C29B38]" />
          </div>
          <span>{toastMessage}</span>
          <button
            onClick={() => setIsCartOpen(true)}
            className="ml-2 text-[#C29B38] underline hover:text-[#FAF7F2] cursor-pointer"
          >
            View Bag
          </button>
        </div>
      )}

      {/* Main Header with Top Bar Contract */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setIsCorporateView(false);
          setActiveCategory(cat);
        }}
        cartCount={cartTotalCount}
        ordersCount={orders.length}
        wishlistCount={wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenCorporate={() => {
          setIsCorporateView(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onScrollToStory={() => {
          setIsCorporateView(false);
          setTimeout(scrollToStory, 100);
        }}
        onScrollToStories={() => {
          setIsCorporateView(false);
          setTimeout(scrollToStories, 100);
        }}
        isCorporateView={isCorporateView}
      />

      <main className="flex-1">
        {isCorporateView ? (
          <CorporateGiftingView
            products={products}
            onBackToStore={() => {
              setIsCorporateView(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenAccount={() => setIsAccountOpen(true)}
          />
        ) : (
          <>
            {/* Hero Section */}
            <Hero
              onSelectCategory={(cat) => {
                setActiveCategory(cat);
                const el = document.getElementById('catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onExploreAll={() => {
                setActiveCategory('All');
                const el = document.getElementById('catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Catalog Section supporting unlimited items and product types */}
            <CatalogSection
              categories={categories}
              products={products}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              onSelectProduct={setSelectedProduct}
              onQuickAdd={handleQuickAdd}
              wishlistProductIds={wishlistProductIds}
              onToggleWishlist={(p) => handleToggleWishlist(p)}
            />

            {/* Artisanal Heritage & Craftsmanship Story */}
            <BrandStory />

            {/* Customer Reviews & Patron Stories Wall */}
            <PatronStoriesWall
              products={products}
              onSelectProduct={(p) => setSelectedProduct(p)}
            />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer
        onSelectCategory={(cat) => {
          setIsCorporateView(false);
          setActiveCategory(cat);
        }}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenPaymentSettings={() => setIsPaymentSettingsOpen(true)}
        onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
        onOpenAccount={() => setIsAccountOpen(true)}
        onOpenCorporate={() => {
          setIsCorporateView(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onToggleWishlist={handleToggleWishlist}
        isInWishlist={selectedProduct ? wishlistProductIds.includes(selectedProduct.id) : false}
        onViewPatronWall={() => {
          setSelectedProduct(null);
          setIsCorporateView(false);
          setTimeout(scrollToStories, 100);
        }}
        onOpenConcierge={() => setIsConciergeOpen(true)}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal with Isolated Payments */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cartItems}
        onOrderSuccess={handleOrderSuccess}
        onOpenPaymentSettings={() => {
          setIsCheckoutOpen(false);
          setIsPaymentSettingsOpen(true);
        }}
        onOpenAccount={() => {
          setIsCheckoutOpen(false);
          setIsAccountOpen(true);
        }}
      />

      {/* Customer Account & Order History Modal */}
      <AccountModal
        isOpen={isAccountOpen}
        onClose={() => setIsAccountOpen(false)}
        orders={orders}
        onOrdersChanged={refreshOrders}
        onReorder={handleReorder}
      />

      {/* Patron Wishlist & Gift Registry Modal */}
      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlist={wishlist}
        onWishlistChanged={refreshWishlist}
        onMoveToBag={handleMoveToBagFromWishlist}
        onSelectProduct={(p) => {
          setIsWishlistOpen(false);
          setSelectedProduct(p);
        }}
        activeSharedRegistry={activeSharedRegistry}
        onClearSharedRegistry={() => {
          setActiveSharedRegistry(null);
          const url = new URL(window.location.href);
          url.searchParams.delete('registry');
          window.history.replaceState({}, '', url.toString());
        }}
      />

      {/* Store Admin & Catalog CMS Modal */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        categories={categories}
        onCatalogChanged={refreshCatalog}
      />

      {/* Payment Gateway Settings Modal */}
      <PaymentSettingsModal
        isOpen={isPaymentSettingsOpen}
        onClose={() => setIsPaymentSettingsOpen(false)}
      />

      {/* Setup & Maintenance Guide Modal */}
      <SetupGuideModal
        isOpen={isSetupGuideOpen}
        onClose={() => setIsSetupGuideOpen(false)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenPaymentSettings={() => setIsPaymentSettingsOpen(true)}
      />

      {/* Floating Customer Leather Care & Sizing Concierge */}
      <LeatherConciergeWidget
        currentProduct={selectedProduct}
        isOpenExternal={isConciergeOpen}
        onCloseExternal={() => setIsConciergeOpen(false)}
      />

    </div>
  );
}

import { WishlistItem, WishlistRegistry, Product } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialCatalog';

const STORAGE_KEY_WISHLIST = 'blc_patron_wishlist_v1';
const STORAGE_KEY_REGISTRIES = 'blc_patron_registries_v1';

const SEED_WISHLIST: WishlistItem[] = [];

export const wishlistService = {
  getWishlist(): WishlistItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_WISHLIST);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out legacy default seed items
          const cleaned = parsed.filter(
            (it: WishlistItem) => it.id !== 'wish_seed_01' && it.id !== 'wish_seed_02'
          );
          if (cleaned.length !== parsed.length) {
            this.saveWishlist(cleaned);
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('Failed to load wishlist from storage', e);
    }
    return [];
  },

  saveWishlist(items: WishlistItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_WISHLIST, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save wishlist', e);
    }
  },

  addToWishlist(
    product: Product,
    selectedColor: string,
    monogramText?: string
  ): { item: WishlistItem; isNew: boolean } {
    const list = this.getWishlist();
    const existing = list.find((it) => it.product.id === product.id);

    if (existing) {
      existing.selectedColor = selectedColor;
      existing.monogramText = monogramText;
      this.saveWishlist(list);
      return { item: existing, isNew: false };
    }

    const newItem: WishlistItem = {
      id: `wish_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      product,
      selectedColor,
      monogramText,
      addedAt: new Date().toISOString(),
      isClaimed: false
    };

    list.unshift(newItem);
    this.saveWishlist(list);
    return { item: newItem, isNew: true };
  },

  removeFromWishlist(id: string): WishlistItem[] {
    const list = this.getWishlist().filter((it) => it.id !== id && it.product.id !== id);
    this.saveWishlist(list);
    return list;
  },

  isInWishlist(productId: string): boolean {
    return this.getWishlist().some((it) => it.product.id === productId);
  },

  toggleWishlist(
    product: Product,
    selectedColor?: string,
    monogramText?: string
  ): { inWishlist: boolean; item?: WishlistItem } {
    if (this.isInWishlist(product.id)) {
      this.removeFromWishlist(product.id);
      return { inWishlist: false };
    } else {
      const color = selectedColor || product.colors[0]?.name || 'Standard';
      const res = this.addToWishlist(product, color, monogramText);
      return { inWishlist: true, item: res.item };
    }
  },

  /**
   * Encodes a complete gift registry into a shareable URL string
   */
  generateShareableLink(
    patronName: string,
    occasion: string,
    personalNote: string,
    items: WishlistItem[]
  ): string {
    const registry: WishlistRegistry = {
      id: `reg_${Date.now()}`,
      patronName,
      occasion,
      personalNote,
      items,
      createdAt: new Date().toISOString()
    };

    try {
      // Lightweight serialization of key items
      const simplified = {
        n: patronName,
        o: occasion,
        m: personalNote,
        items: items.map((it) => ({
          pid: it.product.id,
          c: it.selectedColor,
          t: it.monogramText || ''
        }))
      };

      const base64 = btoa(encodeURIComponent(JSON.stringify(simplified)));
      const origin = window.location.origin + window.location.pathname;
      return `${origin}?registry=${base64}`;
    } catch (e) {
      console.error('Failed to encode registry link', e);
      return window.location.href;
    }
  },

  /**
   * Decodes a shared gift registry from the current URL
   */
  parseRegistryFromUrl(products: Product[]): WishlistRegistry | null {
    try {
      const params = new URLSearchParams(window.location.search);
      const registryParam = params.get('registry');
      if (!registryParam) return null;

      const jsonStr = decodeURIComponent(atob(registryParam));
      const parsed = JSON.parse(jsonStr);

      const resolvedItems: WishlistItem[] = (parsed.items || [])
        .map((it: any, idx: number) => {
          const prod = products.find((p) => p.id === it.pid);
          if (!prod) return null;
          return {
            id: `shared_it_${idx}_${it.pid}`,
            product: prod,
            selectedColor: it.c || prod.colors[0]?.name || 'Standard',
            monogramText: it.t || undefined,
            addedAt: new Date().toISOString(),
            isClaimed: false
          };
        })
        .filter(Boolean) as WishlistItem[];

      return {
        id: `reg_parsed`,
        patronName: parsed.n || 'Esteemed Patron',
        occasion: parsed.o || 'Special Celebration',
        personalNote: parsed.m || 'Handcrafted pieces I would cherish for a lifetime.',
        items: resolvedItems,
        createdAt: new Date().toISOString()
      };
    } catch (e) {
      console.warn('Could not parse shared registry from URL', e);
      return null;
    }
  }
};

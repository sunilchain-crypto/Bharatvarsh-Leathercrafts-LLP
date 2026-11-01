import { CategoryStructure, Product, TopCategory } from '../types';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS } from '../data/initialCatalog';

const STORAGE_KEY_PRODUCTS = 'blc_store_products_v1';
const STORAGE_KEY_CATEGORIES = 'blc_store_categories_v1';

export const catalogService = {
  // Sync from server (MySQL / Disk storage)
  async syncFromServer(): Promise<{ products: Product[]; categories: CategoryStructure[] }> {
    try {
      const [prodRes, catRes] = await Promise.allSettled([
        fetch('/api/products').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/categories').then((r) => (r.ok ? r.json() : null))
      ]);

      let products: Product[] = [];
      let categories: CategoryStructure[] = [];

      if (prodRes.status === 'fulfilled' && Array.isArray(prodRes.value) && prodRes.value.length > 0) {
        products = prodRes.value;
        this.saveProducts(products);
      } else {
        products = this.getProducts();
      }

      if (catRes.status === 'fulfilled' && Array.isArray(catRes.value) && catRes.value.length > 0) {
        categories = catRes.value;
        this.saveCategories(categories);
      } else {
        categories = this.getCategories();
      }

      return { products, categories };
    } catch (err) {
      console.warn('[Catalog Service] Server sync skipped or offline, using local cache:', err);
      return {
        products: this.getProducts(),
        categories: this.getCategories()
      };
    }
  },

  getCategories(): CategoryStructure[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read categories from storage', e);
    }
    return INITIAL_CATEGORIES;
  },

  getProducts(): Product[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read products from storage', e);
    }
    return INITIAL_PRODUCTS;
  },

  saveProducts(products: Product[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to storage', e);
    }
  },

  saveCategories(categories: CategoryStructure[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_CATEGORIES, JSON.stringify(categories));
      // Sync to server asynchronously
      fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories })
      }).catch((err) => console.warn('[Catalog Sync] Categories sync notice:', err.message));
    } catch (e) {
      console.error('Failed to save categories to storage', e);
    }
  },

  addProduct(newProduct: Omit<Product, 'id'> & { id?: string }): Product {
    const products = this.getProducts();
    const product: Product = {
      ...newProduct,
      id: newProduct.id || `blc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`
    };
    products.unshift(product);
    this.saveProducts(products);

    // Sync to server / MySQL asynchronously
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    }).catch((err) => console.warn('[Catalog Sync] Product add notice:', err.message));

    // Ensure category has this productType
    this.ensureProductType(product.category as TopCategory, product.productType);

    return product;
  },

  updateProduct(updatedProduct: Product): Product {
    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === updatedProduct.id);
    if (index !== -1) {
      products[index] = updatedProduct;
      this.saveProducts(products);

      // Sync to server / MySQL asynchronously
      fetch(`/api/products/${updatedProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      }).catch((err) => console.warn('[Catalog Sync] Product update notice:', err.message));

      this.ensureProductType(updatedProduct.category as TopCategory, updatedProduct.productType);
    }
    return updatedProduct;
  },

  deleteProduct(productId: string): boolean {
    const products = this.getProducts();
    const filtered = products.filter((p) => p.id !== productId);
    if (filtered.length !== products.length) {
      this.saveProducts(filtered);

      // Sync to server / MySQL asynchronously
      fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      }).catch((err) => console.warn('[Catalog Sync] Product delete notice:', err.message));

      return true;
    }
    return false;
  },

  ensureProductType(categoryName: TopCategory | string, productTypeName: string): void {
    if (!productTypeName) return;
    const categories = this.getCategories();
    const category = categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (category && !category.productTypes.includes(productTypeName)) {
      category.productTypes.push(productTypeName);
      this.saveCategories(categories);
    }
  },

  addProductType(categoryName: TopCategory | string, productTypeName: string): void {
    const categories = this.getCategories();
    const category = categories.find(
      (c) => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (category && !category.productTypes.includes(productTypeName)) {
      category.productTypes.push(productTypeName);
      this.saveCategories(categories);
    }
  },

  resetToDefaults(): { products: Product[]; categories: CategoryStructure[] } {
    localStorage.removeItem(STORAGE_KEY_PRODUCTS);
    localStorage.removeItem(STORAGE_KEY_CATEGORIES);
    return {
      products: INITIAL_PRODUCTS,
      categories: INITIAL_CATEGORIES
    };
  },

  exportCatalogJSON(): string {
    const data = {
      brand: 'Bharatvarsh Leathercrafts LLP',
      exportedAt: new Date().toISOString(),
      categories: this.getCategories(),
      products: this.getProducts()
    };
    return JSON.stringify(data, null, 2);
  },

  importCatalogJSON(jsonString: string): { success: boolean; count?: number; error?: string } {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.products && Array.isArray(parsed.products)) {
        this.saveProducts(parsed.products);
        if (parsed.categories && Array.isArray(parsed.categories)) {
          this.saveCategories(parsed.categories);
        }
        return { success: true, count: parsed.products.length };
      }
      return { success: false, error: 'Invalid JSON format: missing products array' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to parse JSON file' };
    }
  }
};

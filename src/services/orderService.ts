import { Order, CustomerProfile } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialCatalog';

const STORAGE_KEY_ORDERS = 'blc_customer_orders_v1';
const STORAGE_KEY_PROFILE = 'blc_customer_profile_v1';

export const DEFAULT_CUSTOMER_PROFILE: CustomerProfile = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  gstin: '',
  memberSince: '',
  tier: 'Patron of the Atelier'
};

const SEED_ORDERS: Order[] = [];

export const orderService = {
  getOrders(): Order[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out legacy default/seed orders
          const cleaned = parsed.filter(
            (o: Order) => o.id !== 'ord_seed_101' && o.orderNumber !== 'BLC-2026-7241'
          );
          if (cleaned.length !== parsed.length) {
            this.saveOrders(cleaned);
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('Failed to load orders', e);
    }
    return [];
  },

  saveOrders(orders: Order[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders', e);
    }
  },

  addOrder(order: Order): Order {
    const orders = this.getOrders();
    const orderWithStatus: Order = {
      ...order,
      status: order.status || 'Atelier Crafting',
      trackingNumber: order.trackingNumber || `BLC-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      courierName: 'BlueDart / DTDC Air Priority',
      estimatedDelivery: '3–5 Business Days'
    };
    orders.unshift(orderWithStatus);
    this.saveOrders(orders);

    // Save to MySQL backend & trigger SMTP notification
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderWithStatus)
    }).catch((err) => console.warn('[Order Sync] Notice:', err.message));

    return orderWithStatus;
  },

  updateOrderStatus(orderId: string, newStatus: Order['status']): void {
    const orders = this.getOrders();
    const target = orders.find((o) => o.id === orderId);
    if (target) {
      target.status = newStatus;
      this.saveOrders(orders);
    }
  },

  getProfile(): CustomerProfile {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load profile', e);
    }
    return DEFAULT_CUSTOMER_PROFILE;
  },

  saveProfile(profile: CustomerProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  }
};

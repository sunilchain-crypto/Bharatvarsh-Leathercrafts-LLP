import { Order, CustomerProfile } from '../types';
import { INITIAL_PRODUCTS } from '../data/initialCatalog';

const STORAGE_KEY_ORDERS = 'blc_customer_orders_v1';
const STORAGE_KEY_PROFILE = 'blc_customer_profile_v1';

export const DEFAULT_CUSTOMER_PROFILE: CustomerProfile = {
  name: 'Sunil Chainani',
  email: 'sunilchain@gmail.com',
  phone: '+91 98201 23456',
  address: '42, Heritage Enclave, MG Road',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400001',
  gstin: '27AAAAA0000A1Z5',
  memberSince: 'October 2025',
  tier: 'Patron of the Atelier'
};

const SEED_ORDERS: Order[] = [
  {
    id: 'ord_seed_101',
    orderNumber: 'BLC-2026-7241',
    customer: {
      name: 'Sunil Chainani',
      email: 'sunilchain@gmail.com',
      phone: '9820123456',
      address: '42, Heritage Enclave, MG Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      gstin: '27AAAAA0000A1Z5'
    },
    items: [
      {
        id: 'item_seed_1',
        product: INITIAL_PRODUCTS.find((p) => p.id === 'blc-m-wallet-01') || INITIAL_PRODUCTS[2],
        selectedColor: 'Vintage Saddle',
        monogramText: 'SC',
        quantity: 1
      }
    ],
    subtotal: 3250,
    discount: 325,
    shipping: 0,
    tax: 526,
    total: 2925,
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    paymentId: 'pay_rzp_live_84029412',
    createdAt: '2026-10-08T14:22:00.000Z',
    status: 'Delivered',
    trackingNumber: 'BD-84729103IN',
    courierName: 'BlueDart Air Express',
    estimatedDelivery: 'Delivered on Oct 11, 2026'
  }
];

export const orderService = {
  getOrders(): Order[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ORDERS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load orders', e);
    }
    // Seed initial orders if empty
    this.saveOrders(SEED_ORDERS);
    return SEED_ORDERS;
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

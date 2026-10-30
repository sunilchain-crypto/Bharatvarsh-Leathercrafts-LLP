import { Coupon } from '../types';

const COUPONS_STORAGE_KEY = 'blc_promotional_coupons_v1';

const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'cpn_diwali2026',
    code: 'DIWALI2026',
    description: 'Diwali Festive Blessing — 15% off on handcrafted heirloom leather goods',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 10000,
    maxDiscountCap: 3500,
    validUntil: '2026-11-30',
    usageLimit: 500,
    usageCount: 78,
    isActive: true,
    badge: 'Festive Offer'
  },
  {
    id: 'cpn_welcome10',
    code: 'WELCOME10',
    description: 'Inaugural Atelier Gift — 10% off on your first handcrafted leather acquisition',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 3000,
    maxDiscountCap: 1500,
    validUntil: '2026-12-31',
    usageLimit: 1000,
    usageCount: 242,
    isActive: true,
    badge: 'Welcome Gift'
  },
  {
    id: 'cpn_heritage2500',
    code: 'HERITAGE2500',
    description: 'Patron Heritage Privilege — Flat ₹2,500 off on executive briefcases and weekender duffels',
    discountType: 'flat',
    discountValue: 2500,
    minOrderValue: 15000,
    validUntil: '2026-12-31',
    usageLimit: 200,
    usageCount: 41,
    isActive: true,
    badge: 'Executive Privilege'
  },
  {
    id: 'cpn_royal500',
    code: 'ROYAL500',
    description: 'Artisan Studio Voucher — Flat ₹500 off on wallets, clutches, and leather belts',
    discountType: 'flat',
    discountValue: 500,
    minOrderValue: 3000,
    usageLimit: 300,
    usageCount: 115,
    isActive: true,
    badge: 'Studio Voucher'
  }
];

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  message: string;
}

export const couponService = {
  getCoupons(): Coupon[] {
    try {
      const stored = localStorage.getItem(COUPONS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load coupons from storage', e);
    }
    // Seed initial coupons
    this.saveCoupons(INITIAL_COUPONS);
    return INITIAL_COUPONS;
  },

  getActiveCoupons(): Coupon[] {
    return this.getCoupons().filter((c) => c.isActive);
  },

  saveCoupons(coupons: Coupon[]): void {
    try {
      localStorage.setItem(COUPONS_STORAGE_KEY, JSON.stringify(coupons));
    } catch (e) {
      console.warn('Failed to save coupons to storage', e);
    }
  },

  validateCoupon(code: string, subtotal: number): CouponValidationResult {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { isValid: false, discountAmount: 0, message: 'Please enter a valid promotional coupon code.' };
    }

    const coupons = this.getCoupons();
    const coupon = coupons.find((c) => c.code.toUpperCase() === cleanCode);

    if (!coupon) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Coupon code "${cleanCode}" was not found. Try DIWALI2026 or WELCOME10.`
      };
    }

    if (!coupon.isActive) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Coupon code "${coupon.code}" is currently paused or inactive.`
      };
    }

    if (coupon.validUntil) {
      const expiry = new Date(coupon.validUntil);
      if (expiry.getTime() < Date.now()) {
        return {
          isValid: false,
          discountAmount: 0,
          message: `Coupon code "${coupon.code}" expired on ${expiry.toLocaleDateString('en-IN')}.`
        };
      }
    }

    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return {
        isValid: false,
        discountAmount: 0,
        message: `Coupon code "${coupon.code}" has reached its maximum redemptions limit.`
      };
    }

    if (subtotal < coupon.minOrderValue) {
      const shortfall = coupon.minOrderValue - subtotal;
      return {
        isValid: false,
        discountAmount: 0,
        message: `Requires minimum bag value of ₹${coupon.minOrderValue.toLocaleString('en-IN')}. Add ₹${shortfall.toLocaleString('en-IN')} more to unlock this offer.`
      };
    }

    // Calculate discount amount
    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscountCap && discount > coupon.maxDiscountCap) {
        discount = coupon.maxDiscountCap;
      }
    } else {
      discount = Math.min(coupon.discountValue, subtotal);
    }

    return {
      isValid: true,
      coupon,
      discountAmount: discount,
      message: `Promo code "${coupon.code}" applied! You save ₹${discount.toLocaleString('en-IN')}.`
    };
  },

  recordCouponUsage(code: string): void {
    const cleanCode = code.trim().toUpperCase();
    const coupons = this.getCoupons();
    const updated = coupons.map((c) => {
      if (c.code.toUpperCase() === cleanCode) {
        return { ...c, usageCount: c.usageCount + 1 };
      }
      return c;
    });
    this.saveCoupons(updated);
  },

  addCoupon(newCoupon: Omit<Coupon, 'id' | 'usageCount'>): Coupon {
    const coupons = this.getCoupons();
    const created: Coupon = {
      ...newCoupon,
      id: `cpn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      code: newCoupon.code.trim().toUpperCase(),
      usageCount: 0
    };
    coupons.unshift(created);
    this.saveCoupons(coupons);
    return created;
  },

  updateCoupon(updatedCoupon: Coupon): void {
    const coupons = this.getCoupons();
    const updated = coupons.map((c) => (c.id === updatedCoupon.id ? updatedCoupon : c));
    this.saveCoupons(updated);
  },

  toggleCouponActive(id: string): boolean {
    const coupons = this.getCoupons();
    let newState = false;
    const updated = coupons.map((c) => {
      if (c.id === id) {
        newState = !c.isActive;
        return { ...c, isActive: newState };
      }
      return c;
    });
    this.saveCoupons(updated);
    return newState;
  },

  deleteCoupon(id: string): void {
    const coupons = this.getCoupons();
    const filtered = coupons.filter((c) => c.id !== id);
    this.saveCoupons(filtered);
  },

  resetToDefaults(): Coupon[] {
    this.saveCoupons(INITIAL_COUPONS);
    return INITIAL_COUPONS;
  },

  getAnalytics() {
    const coupons = this.getCoupons();
    const totalActive = coupons.filter((c) => c.isActive).length;
    const totalRedemptions = coupons.reduce((sum, c) => sum + c.usageCount, 0);
    return {
      totalCoupons: coupons.length,
      totalActive,
      totalRedemptions
    };
  }
};

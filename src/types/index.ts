export type TopCategory = 'Men' | 'Women' | 'Unisex';

export interface CategoryStructure {
  id: string;
  name: TopCategory;
  description: string;
  productTypes: string[];
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  name: string;
  category: TopCategory | string;
  productType: string;
  price: number;
  originalPrice?: number;
  description: string;
  shortDescription: string;
  images: string[];
  leatherType: string;
  hardware: string;
  dimensions: string;
  colors: ProductColor[];
  features: string[];
  monogramAvailable: boolean;
  inStock: boolean;
  badge?: string;
  isFeatured?: boolean;
  careInstructions?: string;
}

export interface CartItem {
  id: string;
  product: Product;
  selectedColor: string;
  monogramText?: string;
  quantity: number;
}

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
}

export type OrderStatus = 'Processing' | 'Atelier Crafting' | 'Dispatched' | 'Delivered';

export interface CustomerProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  memberSince: string;
  tier: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  paymentMethod: 'razorpay' | 'stripe' | 'cod' | 'mock';
  paymentStatus: 'paid' | 'pending';
  paymentId?: string;
  createdAt: string;
  status: OrderStatus;
  trackingNumber?: string;
  courierName?: string;
  estimatedDelivery?: string;
}

export interface PaymentGatewayConfig {
  activeGateway: 'razorpay' | 'stripe' | 'cod' | 'mock';
  razorpayKeyId: string;
  stripePublishableKey: string;
  testMode: boolean;
}

export type CorporatePackagingType = 'standard_dustbag' | 'rigid_executive_box' | 'bespoke_hamper';
export type DebossingFinish = 'blind_deboss' | 'gold_foil_22k' | 'silver_palladium';

export interface CorporateQuoteRequest {
  id: string;
  quoteNumber: string;
  companyName: string;
  gstin: string;
  contactPerson: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  pincode: string;
  productId: string;
  productName: string;
  productType: string;
  quantity: number;
  packaging: CorporatePackagingType;
  debossingFinish: DebossingFinish;
  customLogoCrestText: string;
  baseUnitPrice: number;
  discountPercentage: number;
  discountedUnitPrice: number;
  diePlateFee: number;
  packagingUnitFee: number;
  taxableSubtotal: number;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
  inputTaxCreditValue: number;
  createdAt: string;
  deliveryTimelineWeeks: string;
  notes?: string;
}

export interface WishlistItem {
  id: string;
  product: Product;
  selectedColor: string;
  monogramText?: string;
  addedAt: string;
  isClaimed?: boolean;
  claimedBy?: string;
}

export interface WishlistRegistry {
  id: string;
  patronName: string;
  occasion: string;
  personalNote: string;
  items: WishlistItem[];
  createdAt: string;
}

export interface PincodeLogisticsInfo {
  pincode: string;
  city: string;
  state: string;
  zone: 'Metro' | 'Tier-2' | 'Regional' | 'Remote / Special';
  courierPartner: 'Blue Dart Apex Air' | 'Delhivery Express Air' | 'Delhivery Surface' | 'India Post Speed Post';
  transitDays: number;
  dispatchTimeNotice: string;
  estimatedDeliveryDate: string;
  codAvailable: boolean;
  maxCodAmount: number;
  isServiceable: boolean;
  freeShippingEligible: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minOrderValue: number;
  maxDiscountCap?: number;
  validUntil?: string;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  badge?: string;
}

export interface PatronReview {
  id: string;
  productId?: string;
  productName?: string;
  authorName: string;
  location: string;
  rating: number; // 1 to 5
  title: string;
  story: string;
  monthsOfUse: number; // Months item has been in real-world use
  patinaGrade: 'Rich Cognac Glow' | 'Deep Amber Patina' | 'Warm Honey Saddle' | 'Dark Espresso Glaze' | 'Crisp Heirloom Grain';
  photoUrl?: string;
  verifiedBuyer: boolean;
  createdAt: string;
  helpfulCount: number;
}

// ==========================================
// ROLE-BASED ACCESS CONTROL (RBAC)
// ==========================================
export type UserRole = 'Owner' | 'Customer';

export interface AuthenticatedUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  isOwner: boolean;
  isCustomer: boolean;
  emailVerified?: boolean;
}

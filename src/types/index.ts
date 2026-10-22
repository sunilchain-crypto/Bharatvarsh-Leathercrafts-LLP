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

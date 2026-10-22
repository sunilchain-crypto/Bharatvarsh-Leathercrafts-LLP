import React, { useState } from 'react';
import { CartItem, CustomerDetails, Order } from '../types';
import { paymentService, PaymentResult } from '../services/paymentService';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Building2,
  Wallet,
  ArrowRight,
  Printer,
  Sparkles,
  Info,
  Package
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onOrderSuccess: (order: Order) => void;
  onOpenPaymentSettings: () => void;
  onOpenAccount?: () => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi NCR'
];

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
  onOpenPaymentSettings,
  onOpenAccount
}) => {
  if (!isOpen) return null;

  const config = paymentService.getConfig();

  // Form states
  const [customer, setCustomer] = useState<CustomerDetails>({
    name: 'Sunil Chainani',
    email: 'sunilchain@gmail.com',
    phone: '9820123456',
    address: '42, Heritage Enclave, MG Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    gstin: ''
  });

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'stripe' | 'cod'>('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Math calculations
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const shipping = subtotal >= 2999 ? 0 : 250;
  const taxableSubtotal = subtotal - discountAmount;
  const total = taxableSubtotal + shipping;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === 'HERITAGE10') {
      setDiscountPercent(10);
      setCouponMessage('10% Heritage inaugural discount applied!');
    } else if (couponCode.trim().toUpperCase() === 'BLCLLP') {
      setDiscountPercent(15);
      setCouponMessage('15% Artisan appreciation discount applied!');
    } else {
      setCouponMessage('Invalid coupon code. Try HERITAGE10');
    }
  };

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    setIsProcessing(true);

    const orderNumber = `BLC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord_${Date.now()}`,
      orderNumber,
      customer,
      items,
      subtotal,
      discount: discountAmount,
      shipping,
      tax: Math.round(taxableSubtotal * 0.18), // 18% GST component included in price
      total,
      paymentMethod,
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      status: 'Atelier Crafting'
    };

    try {
      const result: PaymentResult = await paymentService.processPayment(newOrder, paymentMethod);

      if (result.success) {
        newOrder.paymentStatus = 'paid';
        newOrder.paymentId = result.transactionId;
        setConfirmedOrder(newOrder);
        onOrderSuccess(newOrder);
      } else {
        setPaymentError(result.errorMessage || 'Payment transaction failed. Please try again.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment service error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden border border-[#24140D]/15 max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#24140D]/10 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <img
              src="/assets/aistudio/Circular_with_Stitch_and_ring_Bharatvarsh_2405b0e7.png"
              alt="BLC Logo"
              className="w-8 h-8 rounded-full object-contain"
            />
            <div>
              <h2 className="font-serif text-lg font-bold text-[#24140D] leading-tight">
                {confirmedOrder ? 'Order Confirmation' : 'Secure Checkout'}
              </h2>
              <span className="text-[11px] text-[#783A1D] uppercase tracking-wider font-semibold">
                Bharatvarsh Leathercrafts LLP
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close checkout"
            className="p-1.5 rounded-lg text-[#24140D]/60 hover:text-[#24140D] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {confirmedOrder ? (
            /* Order Receipt View */
            <div className="space-y-6 text-center max-w-xl mx-auto py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="font-serif text-3xl font-bold text-[#24140D]">
                  Thank You for Your Patronage
                </h3>
                <p className="text-xs text-[#24140D]/75">
                  Your order has been recorded at our workshop. Our leather master is preparing your items with complimentary monogramming.
                </p>
              </div>

              {/* Receipt Summary Card */}
              <div className="p-6 rounded-xl bg-white border border-[#24140D]/15 text-left space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-[#24140D]/10 pb-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#24140D]/60 block">Order Reference</span>
                    <span className="font-mono font-bold text-[#783A1D] text-base">{confirmedOrder.orderNumber}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-[#24140D]/60 block">Status</span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Payment Verified
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#24140D]/80">
                  <div className="flex justify-between">
                    <span>Transaction ID:</span>
                    <span className="font-mono text-[#24140D]">{confirmedOrder.paymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recipient:</span>
                    <span className="font-medium">{confirmedOrder.customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Address:</span>
                    <span className="text-right max-w-xs truncate">
                      {confirmedOrder.customer.address}, {confirmedOrder.customer.city} - {confirmedOrder.customer.pincode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Dispatch:</span>
                    <span className="font-medium text-[#783A1D]">Within 24–48 bench hours</span>
                  </div>
                </div>

                <div className="border-t border-[#24140D]/10 pt-3 space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#24140D]/60 block font-semibold">
                    Purchased Goods ({confirmedOrder.items.length})
                  </span>
                  {confirmedOrder.items.map((it) => (
                    <div key={it.id} className="flex justify-between text-xs">
                      <span>
                        {it.product.name} × {it.quantity} ({it.selectedColor}
                        {it.monogramText ? `, [${it.monogramText}]` : ''})
                      </span>
                      <span className="font-mono font-semibold tabular-nums">
                        ₹{(it.product.price * it.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-[#24140D]/10 pt-2 flex justify-between font-serif font-bold text-base text-[#24140D]">
                    <span>Total Paid:</span>
                    <span className="font-mono tabular-nums">₹{confirmedOrder.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-lg border border-[#24140D]/20 hover:bg-[#EFE9DF] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Receipt</span>
                </button>
                {onOpenAccount && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAccount();
                    }}
                    className="px-5 py-2.5 rounded-lg border border-[#783A1D] text-[#783A1D] hover:bg-[#EFE9DF] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    <span>Track in Order History</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-lg bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider cursor-pointer shadow-md transition-colors"
                >
                  Back to Store
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form with Customer Info & Payment Gateway Selection */
            <form onSubmit={handlePayNow} className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Left Column: Customer & Delivery Details */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#24140D] mb-1">
                    1. Shipping & Customer Details
                  </h3>
                  <p className="text-xs text-[#24140D]/60">
                    Insured nationwide courier delivery by BlueDart / DTDC Express.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[#24140D]/70 font-medium mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customer.name}
                      onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#24140D]/70 font-medium mb-1">Mobile (+91) *</label>
                    <input
                      type="tel"
                      required
                      value={customer.phone}
                      onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[#24140D]/70 font-medium mb-1">Email Address (for invoice) *</label>
                    <input
                      type="email"
                      required
                      value={customer.email}
                      onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[#24140D]/70 font-medium mb-1">Street Address / House No. *</label>
                    <input
                      type="text"
                      required
                      value={customer.address}
                      onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#24140D]/70 font-medium mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={customer.city}
                      onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#24140D]/70 font-medium mb-1">PIN Code *</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={customer.pincode}
                      onChange={(e) => setCustomer({ ...customer, pincode: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#24140D]/70 font-medium mb-1">State *</label>
                    <select
                      value={customer.state}
                      onChange={(e) => setCustomer({ ...customer, state: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#24140D]/70 font-medium mb-1">GSTIN (Optional for B2B Input)</label>
                    <input
                      type="text"
                      placeholder="e.g. 27AAAAA0000A1Z5"
                      value={customer.gstin}
                      onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-[#24140D]/20 rounded-lg uppercase focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>
                </div>

                {/* Gateway Integration Selector */}
                <div className="pt-4 border-t border-[#24140D]/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg font-bold text-[#24140D]">
                      2. Payment Gateway Integration
                    </h3>
                    <button
                      type="button"
                      onClick={onOpenPaymentSettings}
                      className="text-xs text-[#783A1D] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>Gateway API Config</span>
                    </button>
                  </div>

                  {/* Isolated Payment Options */}
                  <div className="space-y-2.5">
                    {/* Razorpay */}
                    <label
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        paymentMethod === 'razorpay'
                          ? 'border-[#783A1D] bg-[#EFE9DF]/80 shadow-xs'
                          : 'border-[#24140D]/15 bg-white hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'razorpay'}
                          onChange={() => setPaymentMethod('razorpay')}
                          className="accent-[#783A1D]"
                        />
                        <div>
                          <div className="font-semibold text-xs text-[#24140D] flex items-center gap-2">
                            <span>Razorpay Gateway</span>
                            <span className="text-[10px] bg-[#783A1D]/15 text-[#783A1D] font-medium px-2 py-0.5 rounded">
                              Recommended for India
                            </span>
                          </div>
                          <p className="text-[11px] text-[#24140D]/65">
                            UPI (Google Pay, PhonePe, Paytm), RuPay, Visa, Mastercard, NetBanking
                          </p>
                        </div>
                      </div>
                      <Wallet className="w-5 h-5 text-[#783A1D]" />
                    </label>

                    {/* Stripe */}
                    <label
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        paymentMethod === 'stripe'
                          ? 'border-[#783A1D] bg-[#EFE9DF]/80 shadow-xs'
                          : 'border-[#24140D]/15 bg-white hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'stripe'}
                          onChange={() => setPaymentMethod('stripe')}
                          className="accent-[#783A1D]"
                        />
                        <div>
                          <div className="font-semibold text-xs text-[#24140D]">
                            Stripe Global Gateway
                          </div>
                          <p className="text-[11px] text-[#24140D]/65">
                            International credit/debit cards, Apple Pay, multi-currency
                          </p>
                        </div>
                      </div>
                      <CreditCard className="w-5 h-5 text-[#24140D]/60" />
                    </label>

                    {/* COD / Bank Wire */}
                    <label
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        paymentMethod === 'cod'
                          ? 'border-[#783A1D] bg-[#EFE9DF]/80 shadow-xs'
                          : 'border-[#24140D]/15 bg-white hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="accent-[#783A1D]"
                        />
                        <div>
                          <div className="font-semibold text-xs text-[#24140D]">
                            Cash on Delivery / Direct Bank Wire (NEFT/RTGS)
                          </div>
                          <p className="text-[11px] text-[#24140D]/65">
                            Pay on delivery or direct settlement for verified business orders
                          </p>
                        </div>
                      </div>
                      <Building2 className="w-5 h-5 text-[#24140D]/60" />
                    </label>
                  </div>

                  {/* Mode notice */}
                  <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Isolated Sandbox Mode Active: </strong>
                      <span>
                        Transactions simulate end-to-end payment authorization instantly. To connect live credentials, configure <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">VITE_RAZORPAY_KEY_ID</code> in <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">.env</code>.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Order Summary & Action */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 rounded-2xl bg-white border border-[#24140D]/10 space-y-4 shadow-sm">
                  <h3 className="font-serif text-lg font-bold text-[#24140D] border-b border-[#24140D]/10 pb-3">
                    Order Summary ({items.reduce((a, b) => a + b.quantity, 0)} items)
                  </h3>

                  {/* Item List */}
                  <div className="max-h-56 overflow-y-auto space-y-3 pr-1 text-xs">
                    {items.map((it) => (
                      <div key={it.id} className="flex justify-between items-center gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-[#24140D] truncate">{it.product.name}</p>
                          <p className="text-[11px] text-[#24140D]/60">
                            Qty: {it.quantity} · {it.selectedColor}
                            {it.monogramText ? ` · [${it.monogramText}]` : ''}
                          </p>
                        </div>
                        <span className="font-mono font-semibold tabular-nums shrink-0">
                          ₹{(it.product.price * it.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Coupon Box */}
                  <div className="pt-3 border-t border-[#24140D]/10">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon: HERITAGE10"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-1 px-3 py-1.5 text-xs uppercase bg-[#FAF7F2] border border-[#24140D]/20 rounded-md focus:outline-none focus:border-[#783A1D]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        className="px-3 py-1.5 bg-[#24140D] text-[#FAF7F2] text-xs font-semibold rounded-md hover:bg-[#3D2013] transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>
                    {couponMessage && (
                      <p className={`text-[11px] mt-1.5 ${discountPercent > 0 ? 'text-emerald-700 font-semibold' : 'text-amber-700'}`}>
                        {couponMessage}
                      </p>
                    )}
                  </div>

                  {/* Calculation Details */}
                  <div className="pt-3 border-t border-[#24140D]/10 space-y-2 text-xs text-[#24140D]/80">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-mono tabular-nums">₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Discount ({discountPercent}%)</span>
                        <span className="font-mono tabular-nums">-₹{discountAmount.toLocaleString('en-IN')}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Insured Express Shipping</span>
                      <span className="font-mono tabular-nums">
                        {shipping === 0 ? <span className="text-emerald-700 font-medium">Free</span> : '₹250'}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-[#24140D]/60">
                      <span>Applicable GST (18% included)</span>
                      <span className="font-mono tabular-nums">₹{Math.round(taxableSubtotal * 0.18).toLocaleString('en-IN')}</span>
                    </div>

                    <div className="pt-3 border-t border-[#24140D]/15 flex justify-between font-serif text-xl font-bold text-[#24140D]">
                      <span>Grand Total</span>
                      <span className="font-mono tabular-nums">₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {paymentError && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs border border-red-200">
                      {paymentError}
                    </div>
                  )}

                  {/* Complete Order Button */}
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-bold tracking-widest uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-[#FAF7F2] border-t-transparent rounded-full animate-spin" />
                        <span>Authorizing with Gateway...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Order (₹{total.toLocaleString('en-IN')})</span>
                        <ArrowRight className="w-4 h-4 text-[#C29B38]" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-[#24140D]/60 pt-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#783A1D]" />
                    <span>256-Bit SSL Encrypted Payment Layer</span>
                  </div>
                </div>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};

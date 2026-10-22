import React, { useState } from 'react';
import { Order, OrderStatus, CustomerProfile, CartItem } from '../types';
import { orderService } from '../services/orderService';
import { ProductImage } from './ProductImage';
import {
  X,
  Package,
  User,
  Clock,
  CheckCircle2,
  Truck,
  RotateCw,
  Printer,
  ChevronRight,
  ShieldCheck,
  MapPin,
  Sparkles,
  ArrowRight,
  CreditCard,
  Building
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onOrdersChanged: () => void;
  onReorder: (items: CartItem[]) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  orders,
  onOrdersChanged,
  onReorder
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [profile, setProfile] = useState<CustomerProfile>(() => orderService.getProfile());
  const [profileSaved, setProfileSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    orderService.saveProfile(profile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const cycleStatus = (orderId: string, currentStatus: OrderStatus) => {
    const cycle: Record<OrderStatus, OrderStatus> = {
      'Processing': 'Atelier Crafting',
      'Atelier Crafting': 'Dispatched',
      'Dispatched': 'Delivered',
      'Delivered': 'Processing'
    };
    const nextStatus = cycle[currentStatus];
    orderService.updateOrderStatus(orderId, nextStatus);
    onOrdersChanged();
  };

  const getStatusStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'Processing': return 1;
      case 'Atelier Crafting': return 2;
      case 'Dispatched': return 3;
      case 'Delivered': return 4;
      default: return 1;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden border border-[#24140D]/15 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#24140D]/10 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#24140D] text-[#FAF7F2] flex items-center justify-center border border-[#C29B38]/30">
              <User className="w-4 h-4 text-[#C29B38]" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-[#24140D] leading-tight">
                Customer Account & Order History
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-[#783A1D] font-medium">
                <span>{profile.name}</span>
                <span aria-hidden="true" className="text-[#24140D]/30">·</span>
                <span className="text-[#24140D]/70">{profile.tier}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close account modal"
            className="p-1.5 rounded-lg text-[#24140D]/60 hover:text-[#24140D] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Strip */}
        <div className="px-6 bg-[#FAF7F2] border-b border-[#24140D]/10 flex gap-6 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'border-[#783A1D] text-[#783A1D]'
                : 'border-transparent text-[#24140D]/60 hover:text-[#24140D]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Order History ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 border-b-2 cursor-pointer transition-colors flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-[#783A1D] text-[#783A1D]'
                : 'border-transparent text-[#24140D]/60 hover:text-[#24140D]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Delivery Settings</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">

          {/* TAB 1: ORDER HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-[#24140D]/10 space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#783A1D]">
                    <Package className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-xl font-bold text-[#24140D]">No Orders Yet</h3>
                    <p className="text-xs text-[#24140D]/60 max-w-sm mx-auto">
                      Explore our handcrafted collections of full-grain leather belts, wallets, and bags.
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="px-5 py-2.5 bg-[#24140D] text-[#FAF7F2] text-xs font-semibold rounded-lg hover:bg-[#3D2013] transition-colors cursor-pointer"
                  >
                    Browse Collections
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => {
                    const stepIndex = getStatusStepIndex(order.status);

                    return (
                      <div
                        key={order.id}
                        className="p-5 sm:p-6 rounded-2xl bg-white border border-[#24140D]/10 hover:border-[#783A1D]/30 transition-all shadow-xs space-y-6"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#24140D]/10 pb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-base text-[#24140D]">
                                {order.orderNumber}
                              </span>
                              <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border ${
                                order.status === 'Delivered'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : order.status === 'Dispatched'
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                {order.status}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#24140D]/60 mt-0.5">
                              Ordered on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setSelectedOrderForInvoice(order)}
                              className="px-3 py-1.5 rounded-lg border border-[#24140D]/20 hover:bg-[#FAF7F2] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-[#24140D]"
                              title="View and print tax invoice"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Invoice Receipt</span>
                            </button>
                            <button
                              onClick={() => {
                                onReorder(order.items);
                                onClose();
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-semibold transition-colors cursor-pointer"
                              title="Add items to bag"
                            >
                              Order Again
                            </button>
                          </div>
                        </div>

                        {/* Interactive Status Timeline */}
                        <div className="space-y-3 p-4 rounded-xl bg-[#FAF7F2] border border-[#24140D]/10">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#24140D] flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-[#783A1D]" />
                              <span>Consignment Tracking: </span>
                              <code className="font-mono text-[#783A1D] bg-white px-1.5 py-0.5 rounded border border-[#24140D]/10">
                                {order.trackingNumber || 'BLC-EXP-940212'}
                              </code>
                            </span>
                            
                            {/* Dev/Demo Status Toggle */}
                            <button
                              onClick={() => cycleStatus(order.id, order.status)}
                              className="text-[11px] text-[#783A1D] hover:text-[#24140D] flex items-center gap-1 cursor-pointer font-medium underline"
                              title="Test order lifecycle: Advance status for demo"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span>Simulate Next Phase</span>
                            </button>
                          </div>

                          {/* 4-Step Tracker */}
                          <div className="grid grid-cols-4 gap-2 pt-2">
                            {/* Step 1 */}
                            <div className="text-center space-y-1">
                              <div className={`h-1.5 rounded-full ${stepIndex >= 1 ? 'bg-[#783A1D]' : 'bg-[#24140D]/10'}`} />
                              <span className="text-[10px] font-medium text-[#24140D] block">1. Confirmed</span>
                            </div>
                            {/* Step 2 */}
                            <div className="text-center space-y-1">
                              <div className={`h-1.5 rounded-full ${stepIndex >= 2 ? 'bg-[#783A1D]' : 'bg-[#24140D]/10'}`} />
                              <span className="text-[10px] font-medium text-[#24140D] block">2. Atelier Benchwork</span>
                            </div>
                            {/* Step 3 */}
                            <div className="text-center space-y-1">
                              <div className={`h-1.5 rounded-full ${stepIndex >= 3 ? 'bg-[#783A1D]' : 'bg-[#24140D]/10'}`} />
                              <span className="text-[10px] font-medium text-[#24140D] block">3. Dispatched</span>
                            </div>
                            {/* Step 4 */}
                            <div className="text-center space-y-1">
                              <div className={`h-1.5 rounded-full ${stepIndex >= 4 ? 'bg-emerald-600' : 'bg-[#24140D]/10'}`} />
                              <span className="text-[10px] font-medium text-[#24140D] block">4. Delivered</span>
                            </div>
                          </div>

                          <div className="text-[11px] text-[#24140D]/70 pt-1 flex items-center justify-between">
                            <span>Courier: <strong>{order.courierName || 'BlueDart Air Express'}</strong></span>
                            <span>{order.estimatedDelivery || 'In transit'}</span>
                          </div>
                        </div>

                        {/* Itemized Line Items */}
                        <div className="space-y-3">
                          <span className="text-[11px] uppercase tracking-wider text-[#24140D]/60 font-semibold block">
                            Handcrafted Items ({order.items.length})
                          </span>

                          <div className="divide-y divide-[#24140D]/5">
                            {order.items.map((it) => (
                              <div key={it.id} className="py-2.5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-[#24140D]/10 shrink-0 bg-[#EFE9DF]">
                                    <ProductImage
                                      src={it.product.images[0]}
                                      alt={it.product.name}
                                      aspectRatio="square"
                                    />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="font-serif font-bold text-sm text-[#24140D] truncate">
                                      {it.product.name}
                                    </h4>
                                    <div className="flex items-center gap-2 text-[11px] text-[#24140D]/70">
                                      <span>Shade: {it.selectedColor}</span>
                                      {it.monogramText && (
                                        <>
                                          <span aria-hidden="true">·</span>
                                          <span className="text-[#783A1D] font-mono font-bold tracking-widest">
                                            [{it.monogramText}]
                                          </span>
                                        </>
                                      )}
                                      <span aria-hidden="true">·</span>
                                      <span>Qty: {it.quantity}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className="font-mono font-bold text-xs text-[#24140D] tabular-nums">
                                    ₹{(it.product.price * it.quantity).toLocaleString('en-IN')}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Footer & Total */}
                        <div className="pt-3 border-t border-[#24140D]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="text-[11px] text-[#24140D]/70 space-y-0.5">
                            <div>
                              Payment: <strong className="uppercase">{order.paymentMethod}</strong> ({order.paymentId || 'Verified'})
                            </div>
                            <div>
                              Shipping to: {order.customer.address}, {order.customer.city} ({order.customer.pincode})
                            </div>
                          </div>

                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-[#24140D]/60">Total Paid (incl. GST):</span>
                            <span className="font-serif text-lg font-bold text-[#24140D] font-mono tabular-nums">
                              ₹{order.total.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE & DELIVERY SETTINGS */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <div className="space-y-1">
                <h3 className="font-serif text-xl font-bold text-[#24140D]">Patron Profile & Addresses</h3>
                <p className="text-xs text-[#24140D]/70">
                  Update your default shipping address and GSTIN for business tax invoices.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-white border border-[#24140D]/10 space-y-4 shadow-xs text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">Mobile (+91)</label>
                    <input
                      type="text"
                      required
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#24140D] mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#24140D] mb-1">Primary Shipping Address</label>
                    <input
                      type="text"
                      required
                      value={profile.address}
                      onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={profile.city}
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">PIN Code</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={profile.pincode}
                      onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">State</label>
                    <input
                      type="text"
                      required
                      value={profile.state}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">GSTIN (Optional B2B)</label>
                    <input
                      type="text"
                      value={profile.gstin || ''}
                      onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                      placeholder="27AAAAA0000A1Z5"
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg uppercase focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>
                </div>

                {profileSaved && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Profile & delivery preferences updated successfully!</span>
                  </div>
                )}

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* Printable Invoice Sub-Modal */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto space-y-6 text-xs text-[#24140D]">
            
            {/* Invoice Top */}
            <div className="flex items-start justify-between border-b border-[#24140D]/10 pb-6">
              <div className="flex items-center gap-3">
                <img
                  src="/assets/aistudio/Circular_with_Stitch_and_ring_Bharatvarsh_2405b0e7.png"
                  alt="BLC Logo"
                  className="w-12 h-12 rounded-full object-contain"
                />
                <div>
                  <h3 className="font-serif text-2xl font-bold leading-none">Bharatvarsh</h3>
                  <span className="text-[10px] uppercase tracking-widest text-[#783A1D] font-semibold">
                    Leathercrafts LLP
                  </span>
                  <div className="text-[10px] text-[#24140D]/60 mt-1">
                    LLPIN: AAY-8419 · GSTIN: 27AABCB8419L1Z8
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-serif text-xl font-bold text-[#783A1D]">TAX INVOICE</div>
                <div className="font-mono font-semibold">{selectedOrderForInvoice.orderNumber}</div>
                <div className="text-[10px] text-[#24140D]/60">
                  Date: {new Date(selectedOrderForInvoice.createdAt).toLocaleDateString('en-IN')}
                </div>
              </div>
            </div>

            {/* Bill to & Ship to */}
            <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-[#FAF7F2] border border-[#24140D]/10">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#783A1D] block">
                  Billed To & Recipient
                </span>
                <p className="font-bold">{selectedOrderForInvoice.customer.name}</p>
                <p>{selectedOrderForInvoice.customer.address}</p>
                <p>{selectedOrderForInvoice.customer.city}, {selectedOrderForInvoice.customer.state} - {selectedOrderForInvoice.customer.pincode}</p>
                <p>Phone: {selectedOrderForInvoice.customer.phone}</p>
                {selectedOrderForInvoice.customer.gstin && (
                  <p className="font-mono text-[10px] text-[#783A1D]">GSTIN: {selectedOrderForInvoice.customer.gstin}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#783A1D] block">
                  Payment Details
                </span>
                <p>Gateway: <strong className="uppercase">{selectedOrderForInvoice.paymentMethod}</strong></p>
                <p className="font-mono text-[10px]">TXN: {selectedOrderForInvoice.paymentId || 'Verified'}</p>
                <p>Status: <strong className="text-emerald-700">PAID & VERIFIED</strong></p>
                <p>HSN Code: 4202 (Handcrafted Leather Goods)</p>
              </div>
            </div>

            {/* Line items table */}
            <table className="w-full text-left">
              <thead className="border-b border-[#24140D]/10 text-[10px] uppercase tracking-wider text-[#24140D]/60">
                <tr>
                  <th className="py-2">Description</th>
                  <th className="py-2 text-center">Qty</th>
                  <th className="py-2 text-right">Rate</th>
                  <th className="py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#24140D]/5">
                {selectedOrderForInvoice.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-2">
                      <div className="font-semibold">{it.product.name}</div>
                      <div className="text-[10px] text-[#24140D]/60">
                        Shade: {it.selectedColor}{it.monogramText ? ` | Monogram: [${it.monogramText}]` : ''}
                      </div>
                    </td>
                    <td className="py-2 text-center font-mono">{it.quantity}</td>
                    <td className="py-2 text-right font-mono tabular-nums">₹{it.product.price.toLocaleString('en-IN')}</td>
                    <td className="py-2 text-right font-mono font-semibold tabular-nums">
                      ₹{(it.product.price * it.quantity).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals & Tax Calculation */}
            <div className="border-t border-[#24140D]/10 pt-3 space-y-1.5 text-right">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">₹{selectedOrderForInvoice.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {selectedOrderForInvoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span className="font-mono tabular-nums">-₹{selectedOrderForInvoice.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Integrated GST (18% Included)</span>
                <span className="font-mono tabular-nums">₹{selectedOrderForInvoice.tax.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between font-serif text-lg font-bold border-t border-[#24140D]/15 pt-2">
                <span>Grand Total (INR)</span>
                <span className="font-mono tabular-nums">₹{selectedOrderForInvoice.total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center border-t border-[#24140D]/10">
              <button
                onClick={() => setSelectedOrderForInvoice(null)}
                className="px-4 py-2 border border-[#24140D]/20 rounded-lg hover:bg-[#FAF7F2] text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-2 bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Tax Invoice</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

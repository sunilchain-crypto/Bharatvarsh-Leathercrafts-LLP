import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, CustomerProfile, CartItem } from '../types';
import { orderService } from '../services/orderService';
import { ProductImage } from './ProductImage';
import { useAuth } from '../context/AuthContext';
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
  Building,
  LogIn,
  LogOut,
  AlertCircle,
  KeyRound,
  Mail
} from 'lucide-react';

const GoogleIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

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

  const {
    user,
    role,
    isOwner,
    loading: authLoading,
    error: authError,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    logout,
    clearError
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [profile, setProfile] = useState<CustomerProfile>(() => orderService.getProfile());
  const [profileSaved, setProfileSaved] = useState(false);

  // Email/Password login state
  const [isEmailAuthMode, setIsEmailAuthMode] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [localAuthError, setLocalAuthError] = useState<string | null>(null);

  // Sync profile when Firebase user signs in
  useEffect(() => {
    if (user) {
      setProfile((prev) => ({
        ...prev,
        name: user.displayName || prev.name || user.email?.split('@')[0] || 'Patron',
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleGoogleSignIn = async () => {
    try {
      setLocalAuthError(null);
      clearError();
      await signInWithGoogle();
    } catch (err: any) {
      setLocalAuthError(err.message || 'Google sign in could not be completed.');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;
    try {
      setLocalAuthError(null);
      clearError();
      setAuthSubmitting(true);
      if (isRegistering) {
        await signUpWithEmail(authEmail, authPassword, authName);
      } else {
        await signInWithEmail(authEmail, authPassword);
      }
      setIsEmailAuthMode(false);
      setAuthPassword('');
    } catch (err: any) {
      setLocalAuthError(err.message || 'Authentication failed.');
    } finally {
      setAuthSubmitting(false);
    }
  };

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
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'Patron'}
                className="w-9 h-9 rounded-full object-cover border border-[#C29B38]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#24140D] text-[#FAF7F2] flex items-center justify-center border border-[#C29B38]/30 font-bold text-xs">
                {user ? (user.displayName || user.email || 'P')[0].toUpperCase() : <User className="w-4 h-4 text-[#C29B38]" />}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-[#24140D] leading-tight">
                  {user ? (user.displayName || 'Patron Account') : 'Patron Account & Order History'}
                </h2>
                {user && (
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    Firebase Verified
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-[#783A1D] font-medium">
                <span>{user ? user.email : profile.name}</span>
                <span aria-hidden="true" className="text-[#24140D]/30">·</span>
                <span className="text-[#24140D]/70">{profile.tier}</span>
                {user && (
                  <>
                    <span aria-hidden="true" className="text-[#24140D]/30">·</span>
                    <span className="text-emerald-700 font-mono text-[10px]">Cloud Synced</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {user && (
              <button
                type="button"
                onClick={() => logout()}
                className="px-3 py-1.5 rounded-lg border border-[#24140D]/20 text-[#24140D]/80 hover:text-[#991B1B] hover:border-[#991B1B]/40 hover:bg-neutral-50 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Sign out of Firebase"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close account modal"
              className="p-1.5 rounded-lg text-[#24140D]/60 hover:text-[#24140D] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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

          {/* Firebase Authentication Patron Card */}
          {user ? (
            <div className="mb-6 p-4 rounded-xl bg-white border border-[#24140D]/10 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#24140D] flex items-center justify-center border border-[#C29B38]/50 text-[#C29B38] shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-xs text-[#24140D]">
                      {user.displayName || user.email}
                    </span>
                    <span
                      className={`text-[9px] uppercase px-2 py-0.5 rounded font-bold tracking-wider ${
                        isOwner
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      Role: {role}
                    </span>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-medium">
                      Firebase Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-[#24140D]/70 mt-0.5">
                    {isOwner
                      ? 'Store Owner privileges active. Full access to Store Management, Product CMS, MySQL & settings.'
                      : 'Patron Customer access active. Orders, cart, wishlist, and bespoke monogramming enabled.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                <span className="text-[10px] font-mono text-[#24140D]/50 hidden md:inline">
                  UID: {user.uid.slice(0, 8)}...
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="px-3 py-1.5 rounded-lg border border-[#24140D]/20 hover:bg-[#FAF7F2] text-[#24140D] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#991B1B]" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-5 sm:p-6 rounded-2xl bg-linear-to-r from-[#24140D] to-[#3D2013] text-[#FAF7F2] border border-[#C29B38]/40 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#783A1D] flex items-center justify-center border border-[#C29B38]/60 text-[#C29B38] shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-serif text-base font-bold text-[#FAF7F2]">
                        Sign In to Your Patron Portal
                      </h3>
                      <span className="text-[9px] uppercase bg-[#C29B38]/30 text-[#FAF7F2] px-2 py-0.5 rounded border border-[#C29B38]/40 font-mono font-semibold">
                        Firebase Auth
                      </span>
                    </div>
                    <p className="text-xs text-[#EFE9DF]/80">
                      Sign in to sync your bespoke orders, gift registries, and download official tax invoices.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="px-4 py-2.5 bg-white hover:bg-neutral-50 text-[#24140D] text-xs font-bold rounded-xl flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-sm shrink-0 disabled:opacity-50"
                >
                  <GoogleIcon className="w-4 h-4" />
                  <span>{authLoading ? 'Connecting...' : 'Sign In with Google'}</span>
                </button>
              </div>

              {/* Error Alert */}
              {(localAuthError || authError) && (
                <div className="p-3 rounded-lg bg-red-950/80 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span className="flex-1">{localAuthError || authError}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalAuthError(null);
                      clearError();
                    }}
                    className="text-xs text-red-300 hover:text-white p-0.5"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Email / Password Expandable Option */}
              <div className="border-t border-white/10 pt-3">
                {!isEmailAuthMode ? (
                  <button
                    type="button"
                    onClick={() => setIsEmailAuthMode(true)}
                    className="text-xs text-[#D4B37A] hover:text-[#FAF7F2] flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Or sign in / register with Email & Password</span>
                  </button>
                ) : (
                  <form onSubmit={handleEmailAuth} className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#D4B37A]">
                        {isRegistering ? 'Create Patron Account' : 'Sign In with Email'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsRegistering(!isRegistering)}
                        className="text-[#FAF7F2]/80 hover:text-white underline cursor-pointer"
                      >
                        {isRegistering ? 'Already have an account? Sign In' : 'New patron? Register'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {isRegistering && (
                        <div className="sm:col-span-2">
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={authName}
                            onChange={(e) => setAuthName(e.target.value)}
                            className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#C29B38]"
                          />
                        </div>
                      )}
                      <div>
                        <input
                          type="email"
                          required
                          placeholder="Email Address"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#C29B38]"
                        />
                      </div>
                      <div>
                        <input
                          type="password"
                          required
                          placeholder="Password (min. 6 characters)"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-black/40 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-[#C29B38]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => setIsEmailAuthMode(false)}
                        className="text-xs text-white/60 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={authSubmitting}
                        className="px-4 py-2 bg-[#C29B38] hover:bg-[#A8822B] text-[#24140D] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {authSubmitting ? 'Authenticating...' : isRegistering ? 'Register Account' : 'Sign In'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}

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
                                      src={it.product.images?.[0] || ''}
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
                    LLPIN: ADD-6497 · GSTIN: 27AABCB8419L1Z8
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

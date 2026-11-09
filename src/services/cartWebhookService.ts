import { CartItem, CustomerDetails } from '../types';

interface AbandonedCartPayload {
  cartId?: string;
  customer: {
    name?: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  items: Array<{
    productId?: string | number;
    name?: string;
    selectedColor?: string;
    monogramText?: string;
    quantity: number;
    price: number;
  }>;
  cartTotal: number;
  checkoutStep: string;
  recoveryUrl?: string;
}

class CartWebhookService {
  private lastDispatchedHash: string = '';
  private lastDispatchedAt: number = 0;
  private readonly COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes cooldown between duplicate cart reports

  private computeCartHash(customer: any, items: CartItem[]): string {
    const email = (customer?.email || '').toLowerCase().trim();
    const phone = (customer?.phone || '').trim();
    const itemSignature = items
      .map((i) => `${i.product.id}:${i.quantity}:${i.selectedColor || ''}:${i.monogramText || ''}`)
      .sort()
      .join('|');
    return `${email}:${phone}:${itemSignature}`;
  }

  /**
   * Dispatches the abandoned cart webhook to the storefront backend,
   * which forwards the cryptographically signed HMAC payload to the CRM endpoint.
   */
  public async reportAbandonedCart(params: {
    items: CartItem[];
    customer?: Partial<CustomerDetails>;
    checkoutStep?: string;
    cartTotal?: number;
    force?: boolean;
  }): Promise<{ dispatched: boolean; reason?: string }> {
    const { items, customer, checkoutStep = 'checkout_modal_closed', cartTotal, force = false } = params;

    if (!items || items.length === 0) {
      return { dispatched: false, reason: 'Cart is empty' };
    }

    const email = (customer?.email || '').trim();
    const phone = (customer?.phone || '').trim();
    const name = (customer?.name || '').trim();

    // Must have at least one customer contact identifier to be actionable in CRM
    if (!email && !phone && !name) {
      return { dispatched: false, reason: 'No customer contact details available' };
    }

    const currentHash = this.computeCartHash(customer, items);
    const now = Date.now();

    // Prevent duplicate webhook floods for the same session/cart state
    if (!force && currentHash === this.lastDispatchedHash && (now - this.lastDispatchedAt < this.COOLDOWN_MS)) {
      return { dispatched: false, reason: 'Throttled (recently dispatched identical cart)' };
    }

    const computedTotal = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const total = typeof cartTotal === 'number' ? cartTotal : computedTotal;

    const payload: AbandonedCartPayload = {
      cartId: `cart_abn_${now}_${Math.random().toString(36).substring(2, 7)}`,
      customer: {
        name: name || 'Valued Patron',
        email: email || undefined,
        phone: phone || undefined,
        city: customer?.city || undefined,
        state: customer?.state || undefined,
        pincode: customer?.pincode || undefined
      },
      items: items.map((it) => ({
        productId: it.product.id,
        name: it.product.name,
        selectedColor: it.selectedColor,
        monogramText: it.monogramText,
        quantity: it.quantity,
        price: it.product.price
      })),
      cartTotal: total,
      checkoutStep,
      recoveryUrl: `${window.location.origin}/#cart`
    };

    try {
      this.lastDispatchedHash = currentHash;
      this.lastDispatchedAt = now;

      const payloadStr = JSON.stringify(payload);

      // Prefer navigator.sendBeacon if the page is unloading
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function' && document.visibilityState === 'hidden') {
        const blob = new Blob([payloadStr], { type: 'application/json' });
        navigator.sendBeacon('/api/cart/abandoned', blob);
        return { dispatched: true, reason: 'sendBeacon' };
      }

      const res = await fetch('/api/cart/abandoned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payloadStr,
        keepalive: true
      });

      const data = await res.json().catch(() => ({}));
      return { dispatched: res.ok, reason: data.eventId || 'Dispatched via fetch' };
    } catch (err: any) {
      console.warn('[CartWebhookService] Failed dispatching abandoned cart webhook:', err);
      return { dispatched: false, reason: err.message };
    }
  }
}

export const cartWebhookService = new CartWebhookService();

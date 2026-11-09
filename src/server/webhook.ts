import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface WebhookPayload<T = any> {
  id: string;
  event: string;
  timestamp: string;
  source: string;
  store: {
    brand: string;
    domain: string;
  };
  data: T;
}

export interface WebhookDispatchResult {
  success: boolean;
  eventId: string;
  event: string;
  targetUrl: string;
  statusCode?: number;
  statusText?: string;
  durationMs: number;
  timestamp: string;
  error?: string;
  responseSnippet?: string;
}

export interface WebhookLogEntry extends WebhookDispatchResult {
  requestPayloadPreview?: string;
}

const LOG_FILE = path.resolve(process.cwd(), 'data', 'webhook_delivery_log.json');
const MAX_LOG_ENTRIES = 50;

function readLogFile(): WebhookLogEntry[] {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const raw = fs.readFileSync(LOG_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[Webhook Log] Failed reading log file:', err);
  }
  return [];
}

function writeLogFile(entries: WebhookLogEntry[]): void {
  try {
    const dir = path.dirname(LOG_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOG_FILE, JSON.stringify(entries.slice(0, MAX_LOG_ENTRIES), null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Webhook Log] Failed writing log file:', err);
  }
}

class WebhookDispatcher {
  private log: WebhookLogEntry[] = [];

  constructor() {
    this.log = readLogFile();
  }

  public getWebhookUrl(): string {
    const url = process.env.CRM_WEBHOOK_URL || 'https://papayawhip-rail-174498.hostingersite.com/';
    return url.trim();
  }

  public getWebhookSecret(): string {
    const secret = process.env.CRM_WEBHOOK_SECRET || 'blc_whsec_LiveAuth2026!';
    return secret.trim();
  }

  public isConfigured(): boolean {
    return !!this.getWebhookUrl();
  }

  public getConfig() {
    const url = this.getWebhookUrl();
    const secret = this.getWebhookSecret();
    const maskedSecret = secret
      ? `${secret.slice(0, 6)}••••••••${secret.slice(-4)}`
      : 'Not configured';

    return {
      configured: this.isConfigured(),
      url,
      hasSecret: !!secret,
      maskedSecret,
      totalDispatched: this.log.length,
      lastDispatch: this.log[0] || null
    };
  }

  public getDeliveryLog(): WebhookLogEntry[] {
    return this.log;
  }

  public clearDeliveryLog(): void {
    this.log = [];
    writeLogFile([]);
  }

  /**
   * Generates HMAC-SHA256 signature for payload verification
   */
  public generateSignature(payloadString: string): string {
    const secret = this.getWebhookSecret();
    if (!secret) return '';
    return `sha256=${crypto.createHmac('sha256', secret).update(payloadString).digest('hex')}`;
  }

  /**
   * Dispatches a webhook payload to the configured CRM endpoint
   */
  public async dispatch<T = any>(event: string, data: T): Promise<WebhookDispatchResult> {
    const targetUrl = this.getWebhookUrl();
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    if (!targetUrl) {
      const skippedResult: WebhookDispatchResult = {
        success: false,
        eventId,
        event,
        targetUrl: 'None (CRM_WEBHOOK_URL unset)',
        durationMs: 0,
        timestamp,
        error: 'CRM_WEBHOOK_URL environment variable is not configured'
      };
      this.recordDelivery(skippedResult);
      return skippedResult;
    }

    const payload: WebhookPayload<T> = {
      id: eventId,
      event,
      timestamp,
      source: 'bharatvarsh-storefront',
      store: {
        brand: 'Bharatvarsh Leathercrafts LLP',
        domain: process.env.APP_URL || 'https://bharatvarshcrafts.com'
      },
      data
    };

    const payloadJson = JSON.stringify(payload);
    const signature = this.generateSignature(payloadJson);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'Bharatvarsh-Storefront-Webhook/1.0',
        'X-Webhook-Event': event,
        'X-Webhook-ID': eventId,
        'X-Webhook-Timestamp': timestamp
      };

      if (signature) {
        headers['X-Webhook-Signature'] = signature;
        headers['X-Hub-Signature-256'] = signature;
      }

      const secret = this.getWebhookSecret();
      if (secret) {
        headers['X-Webhook-Secret'] = secret;
      }

      console.log(`[Webhook Dispatcher] Sending "${event}" (${eventId}) to ${targetUrl}...`);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: payloadJson,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const durationMs = Date.now() - startTime;
      let responseSnippet = '';
      try {
        const text = await response.text();
        responseSnippet = text.slice(0, 300);
      } catch {
        responseSnippet = '';
      }

      const isSuccess = response.ok || response.status === 200 || response.status === 201 || response.status === 202;

      const result: WebhookDispatchResult = {
        success: isSuccess,
        eventId,
        event,
        targetUrl,
        statusCode: response.status,
        statusText: response.statusText,
        durationMs,
        timestamp,
        responseSnippet,
        error: isSuccess ? undefined : `HTTP ${response.status} ${response.statusText}`
      };

      this.recordDelivery({
        ...result,
        requestPayloadPreview: payloadJson.slice(0, 300)
      });

      console.log(`[Webhook Dispatcher] Event "${event}" finished in ${durationMs}ms with HTTP ${response.status} (Success: ${isSuccess})`);
      return result;
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err.name === 'AbortError' ? 'Request timed out after 10000ms' : (err.message || 'Unknown network error');

      const failedResult: WebhookDispatchResult = {
        success: false,
        eventId,
        event,
        targetUrl,
        durationMs,
        timestamp,
        error: errorMsg
      };

      this.recordDelivery({
        ...failedResult,
        requestPayloadPreview: payloadJson.slice(0, 300)
      });

      console.warn(`[Webhook Dispatcher] Failed dispatching "${event}": ${errorMsg}`);
      return failedResult;
    }
  }

  private recordDelivery(entry: WebhookLogEntry): void {
    this.log.unshift(entry);
    if (this.log.length > MAX_LOG_ENTRIES) {
      this.log = this.log.slice(0, MAX_LOG_ENTRIES);
    }
    writeLogFile(this.log);
  }

  // Event dispatchers
  public async dispatchOrderCreated(order: any): Promise<WebhookDispatchResult> {
    return this.dispatch('order.created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      currency: order.currency || 'INR',
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus || 'paid',
      customer: {
        name: order.customer?.name,
        email: order.customer?.email,
        phone: order.customer?.phone,
        city: order.customer?.city,
        state: order.customer?.state,
        pincode: order.customer?.pincode,
        gstin: order.customer?.gstin
      },
      items: (order.items || []).map((it: any) => ({
        productId: it.product?.id,
        name: it.product?.name,
        color: it.selectedColor,
        monogram: it.monogramText,
        quantity: it.quantity,
        price: it.product?.price
      })),
      createdAt: order.createdAt || new Date().toISOString()
    });
  }

  public async dispatchOrderUpdated(order: any): Promise<WebhookDispatchResult> {
    return this.dispatch('order.updated', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      trackingNumber: order.trackingNumber,
      courierName: order.courierName,
      customerEmail: order.customer?.email,
      updatedAt: new Date().toISOString()
    });
  }

  public async dispatchInquiryCreated(inquiry: any): Promise<WebhookDispatchResult> {
    return this.dispatch('inquiry.created', {
      inquiryId: inquiry.id || `inq_${Date.now()}`,
      clientName: inquiry.clientName || inquiry.name,
      company: inquiry.company,
      email: inquiry.email,
      phone: inquiry.phone,
      tier: inquiry.tier,
      quantity: inquiry.quantity,
      estimatedTotal: inquiry.estimatedTotal,
      monogramCrest: inquiry.monogramCrest,
      notes: inquiry.notes || inquiry.message,
      createdAt: inquiry.createdAt || new Date().toISOString()
    });
  }

  public async dispatchCustomerRegistered(customer: any): Promise<WebhookDispatchResult> {
    return this.dispatch('customer.registered', {
      uid: customer.uid,
      name: customer.displayName || customer.name,
      email: customer.email,
      role: customer.role || 'Customer',
      registeredAt: customer.createdAt || new Date().toISOString()
    });
  }

  public async dispatchCartAbandoned(cartData: any): Promise<WebhookDispatchResult> {
    const rawItems = cartData.items || [];
    const items = rawItems.map((it: any) => ({
      productId: it.product?.id || it.productId || it.id || 'blc_item',
      name: it.product?.name || it.name || 'Artisanal Leather Good',
      color: it.selectedColor || it.color || 'Bourbon Cognac',
      monogram: it.monogramText || it.monogram || '',
      quantity: Number(it.quantity) || 1,
      price: Number(it.product?.price || it.price) || 0
    }));

    const computedTotal = items.reduce((sum: number, it: any) => sum + (it.price * it.quantity), 0);
    const total = typeof cartData.cartTotal === 'number' ? cartData.cartTotal : computedTotal;

    return this.dispatch('cart.abandoned', {
      cartId: cartData.cartId || `cart_abn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      customer: {
        name: cartData.customer?.name || cartData.customerName || 'Valued Patron',
        email: cartData.customer?.email || cartData.customerEmail || '',
        phone: cartData.customer?.phone || cartData.customerPhone || '',
        city: cartData.customer?.city || '',
        state: cartData.customer?.state || '',
        pincode: cartData.customer?.pincode || ''
      },
      items,
      itemCount: items.reduce((acc: number, it: any) => acc + it.quantity, 0),
      cartTotal: total,
      currency: cartData.currency || 'INR',
      checkoutStep: cartData.checkoutStep || 'checkout_initiated',
      abandonedAt: cartData.abandonedAt || new Date().toISOString(),
      recoveryUrl: cartData.recoveryUrl || `${process.env.APP_URL || 'https://green-crane-286916.hostingersite.com'}/#cart`
    });
  }

  public async dispatchPing(): Promise<WebhookDispatchResult> {
    return this.dispatch('webhook.ping', {
      message: 'Test ping from Bharatvarsh Leathercrafts Storefront Webhook Dispatcher',
      timestamp: new Date().toISOString(),
      status: 'healthy',
      version: '1.0.0'
    });
  }
}

export const webhookDispatcher = new WebhookDispatcher();

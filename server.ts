import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { dbService, initDatabase } from './src/server/db';
import { upload, listLocalFiles, deleteLocalFile, ensureUploadDir, UPLOAD_DIR } from './src/server/storage';
import { mailerService } from './src/server/mailer';
import { imapService } from './src/server/imap';
import { webhookDispatcher } from './src/server/webhook';

// Preserve host environment PORT (e.g. Cloud Run sets PORT=8080, Hostinger sets custom PORT)
const systemPort = process.env.PORT;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const port: any = isProduction ? (systemPort || process.env.PORT || 8080) : 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure local disk storage folder exists and serve static uploads
ensureUploadDir();
app.use('/uploads', express.static(UPLOAD_DIR));

// Initialize GoogleGenAI SDK on server-side
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
    : null;

// ==========================================
// ROLE-BASED ACCESS CONTROL (RBAC) CONFIG & MIDDLEWARE
// ==========================================
export const STORE_OWNER_EMAILS = [
  'sunilchain@gmail.com',
  'support@bharatvarshcrafts.com',
  ...(process.env.STORE_OWNER_EMAIL ? process.env.STORE_OWNER_EMAIL.split(',') : [])
].map((e) => e.trim().toLowerCase());

function parseJwtPayload(token: string): { email?: string; email_verified?: boolean; sub?: string; exp?: number } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

export function getUserFromToken(req: Request): { email: string; uid?: string; role: 'Owner' | 'Customer'; isOwner: boolean } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const payload = parseJwtPayload(token);
  if (!payload || !payload.email) {
    return null;
  }

  if (payload.exp && payload.exp * 1000 < Date.now()) {
    return null;
  }

  const email = payload.email.toLowerCase();
  const isOwner = STORE_OWNER_EMAILS.includes(email);

  return {
    email,
    uid: payload.sub,
    role: isOwner ? 'Owner' : 'Customer',
    isOwner,
  };
}

export function requireOwner(req: Request, res: Response, next: NextFunction) {
  // Check for admin secret override if supplied
  const adminSecret = req.headers['x-admin-secret'];
  const expectedSecret = process.env.STORE_OWNER_SECRET || process.env.ADMIN_SECRET;
  if (expectedSecret && adminSecret === expectedSecret) {
    return next();
  }

  const userInfo = getUserFromToken(req);

  if (!userInfo) {
    return res.status(403).json({
      error: 'Forbidden: Store Management requires Owner authentication',
      code: 'AUTH_REQUIRED',
      requiredRole: 'Owner'
    });
  }

  if (!userInfo.isOwner) {
    return res.status(403).json({
      error: 'Forbidden: Access denied. Store Management is restricted to Store Owners only.',
      code: 'FORBIDDEN_OWNER_REQUIRED',
      userEmail: userInfo.email,
      userRole: 'Customer',
      requiredRole: 'Owner'
    });
  }

  (req as any).user = userInfo;
  next();
}

// Session role verification endpoint
app.get('/api/auth/me', (req: Request, res: Response) => {
  const userInfo = getUserFromToken(req);
  if (!userInfo) {
    return res.json({
      authenticated: false,
      role: 'Customer',
      isOwner: false,
      isCustomer: true
    });
  }
  return res.json({
    authenticated: true,
    email: userInfo.email,
    uid: userInfo.uid,
    role: userInfo.role,
    isOwner: userInfo.isOwner,
    isCustomer: !userInfo.isOwner
  });
});

// ==========================================
// 1. SYSTEM HEALTH & CONFIGURATION STATUS
// ==========================================
app.get('/api/health', async (_req: Request, res: Response) => {
  const dbStatus = await dbService.getStatus();
  const smtpStatus = mailerService.getStatus();
  const imapStatus = imapService.getStatus();
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    brand: 'Bharatvarsh Leathercrafts LLP',
    database: dbStatus,
    smtp: {
      configured: smtpStatus.configured,
      user: smtpStatus.user,
      host: smtpStatus.host,
      port: smtpStatus.port
    },
    imap: {
      configured: imapStatus.configured,
      user: imapStatus.user,
      host: imapStatus.host,
      port: imapStatus.port,
      secure: imapStatus.secure
    },
    storage: {
      engine: 'Host Local Disk',
      uploadPath: UPLOAD_DIR,
      fileCount: listLocalFiles().length
    },
    crmWebhook: webhookDispatcher.getConfig()
  });
});

app.get('/api/db/status', async (_req: Request, res: Response) => {
  const status = await dbService.getStatus();
  res.json(status);
});

app.all('/api/db/test', requireOwner, async (_req: Request, res: Response) => {
  try {
    const result = await dbService.testConnection();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({
      connected: false,
      engine: 'Local Disk Fallback',
      error: err.message || 'Database test failed'
    });
  }
});

app.get('/api/smtp/status', (_req: Request, res: Response) => {
  res.json(mailerService.getStatus());
});

app.get('/api/mail/status', (_req: Request, res: Response) => {
  res.json({
    smtp: mailerService.getStatus(),
    imap: imapService.getStatus()
  });
});

app.get('/api/mail/inbox', requireOwner, async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 15;
    const result = await imapService.fetchRecentMessages(limit);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch IMAP inbox' });
  }
});

app.post('/api/mail/test-imap', requireOwner, async (_req: Request, res: Response) => {
  try {
    const result = await imapService.testConnection();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'IMAP test error' });
  }
});

// ------------------------------------------
// 1.5 CRM WEBHOOK MANAGEMENT & TEST
// ------------------------------------------
app.get('/api/admin/webhook/status', requireOwner, async (_req: Request, res: Response) => {
  try {
    res.json({
      config: webhookDispatcher.getConfig(),
      deliveries: webhookDispatcher.getDeliveryLog()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch webhook status' });
  }
});

app.post('/api/admin/webhook/test', requireOwner, async (_req: Request, res: Response) => {
  try {
    const result = await webhookDispatcher.dispatchPing();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to trigger test webhook' });
  }
});

app.post('/api/admin/webhook/test-abandoned-cart', requireOwner, async (_req: Request, res: Response) => {
  try {
    const sampleAbandonedCart = {
      cartId: `test_cart_${Date.now()}`,
      customer: {
        name: 'Sunil Chainani (Owner Test)',
        email: 'sunilchain@gmail.com',
        phone: '+91 98200 12345',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '411057'
      },
      items: [
        {
          productId: 'prod-royal-oxford',
          name: 'The Royal Oxford Bridle Leather Briefcase',
          selectedColor: 'Conker Tan',
          monogramText: 'SC',
          quantity: 1,
          price: 48500
        },
        {
          productId: 'prod-artisan-belt',
          name: 'The Sovereign Sedgwick Bridle Belt',
          selectedColor: 'Bourbon Cognac',
          monogramText: '',
          quantity: 1,
          price: 9500
        }
      ],
      cartTotal: 58000,
      checkoutStep: 'payment_method_selected',
      abandonedAt: new Date().toISOString()
    };
    const result = await webhookDispatcher.dispatchCartAbandoned(sampleAbandonedCart);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to trigger test abandoned cart webhook' });
  }
});

app.delete('/api/admin/webhook/log', requireOwner, async (_req: Request, res: Response) => {
  try {
    webhookDispatcher.clearDeliveryLog();
    res.json({ success: true, message: 'Delivery log cleared' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to clear delivery log' });
  }
});

// Storefront Abandoned Cart Webhook Endpoint
const handleAbandonedCart = async (req: Request, res: Response) => {
  try {
    const { items, customer, cartTotal, checkoutStep, recoveryUrl, cartId } = req.body || {};
    
    // Require at least items array and some customer identifier
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart items are required for abandoned cart tracking' });
    }

    const hasContact = customer?.email || customer?.phone || customer?.name;
    if (!hasContact) {
      return res.status(400).json({ error: 'Customer contact information (email, phone, or name) is required' });
    }

    const result = await webhookDispatcher.dispatchCartAbandoned({
      cartId,
      customer,
      items,
      cartTotal,
      checkoutStep: checkoutStep || 'checkout_step_abandoned',
      recoveryUrl,
      abandonedAt: new Date().toISOString()
    });

    res.json({
      success: true,
      eventId: result.eventId,
      dispatched: result.success,
      durationMs: result.durationMs,
      statusCode: result.statusCode
    });
  } catch (err: any) {
    console.error('[Abandoned Cart Webhook Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to dispatch abandoned cart webhook' });
  }
};

app.post('/api/cart/abandoned', handleAbandonedCart);
app.post('/api/webhooks/abandoned-cart', handleAbandonedCart);

// ==========================================
// 2. PRODUCTS & CATALOG (MYSQL / DISK)
// ==========================================
app.get('/api/products', async (_req: Request, res: Response) => {
  try {
    const products = await dbService.getProducts();
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch products' });
  }
});

function sanitizeProduct(raw: any) {
  const p = { ...raw };
  if (!p.id) {
    p.id = `blc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  }
  if (!Array.isArray(p.images) || p.images.length === 0) {
    p.images = ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80'];
  }
  if (!Array.isArray(p.colors) || p.colors.length === 0) {
    p.colors = [{ name: 'Heritage Tan', hex: '#8D4925' }];
  }
  if (typeof p.price !== 'number') {
    p.price = Number(p.price) || 0;
  }
  if (!p.category) p.category = 'Men';
  if (!p.productType) p.productType = 'Leather Goods';
  return p;
}

app.post('/api/products', requireOwner, async (req: Request, res: Response) => {
  try {
    const product = sanitizeProduct(req.body);
    const saved = await dbService.saveProduct(product);
    res.json({ success: true, product: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save product' });
  }
});

app.put('/api/products/:id', requireOwner, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const product = sanitizeProduct({ ...req.body, id });
    const saved = await dbService.saveProduct(product);
    res.json({ success: true, product: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireOwner, async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    await dbService.deleteProduct(id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete product' });
  }
});

// ==========================================
// 3. CATEGORIES & ARCHITECTURE
// ==========================================
app.get('/api/categories', async (_req: Request, res: Response) => {
  try {
    const categories = await dbService.getCategories();
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch categories' });
  }
});

app.post('/api/categories', requireOwner, async (req: Request, res: Response) => {
  try {
    const { categories } = req.body;
    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'categories array expected' });
    }
    await dbService.saveCategories(categories);
    res.json({ success: true, categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save categories' });
  }
});

// ==========================================
// 4. ORDERS & GST INVOICING (MYSQL + EMAIL)
// ==========================================
app.get('/api/orders', async (req: Request, res: Response) => {
  try {
    const userInfo = getUserFromToken(req);
    const allOrders = await dbService.getOrders();

    // Owner can access all customer orders
    if (userInfo && userInfo.isOwner) {
      return res.json(allOrders);
    }

    // Customer can only view their own orders
    if (userInfo && userInfo.email) {
      const customerOrders = allOrders.filter(
        (o: any) => o.customer?.email?.toLowerCase() === userInfo.email.toLowerCase()
      );
      return res.json(customerOrders);
    }

    // Block unauthenticated access to global order records
    return res.status(403).json({
      error: 'Forbidden: Viewing global store orders requires Owner permissions',
      code: 'FORBIDDEN_OWNER_REQUIRED',
      requiredRole: 'Owner'
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch orders' });
  }
});

app.post('/api/orders', async (req: Request, res: Response) => {
  try {
    const orderData = req.body;
    if (!orderData.orderNumber) {
      orderData.orderNumber = `BLC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    }
    if (!orderData.id) {
      orderData.id = `ord-${Date.now().toString(36)}`;
    }
    if (!orderData.createdAt) {
      orderData.createdAt = new Date().toISOString();
    }
    const savedOrder = await dbService.saveOrder(orderData);

    // Trigger async SMTP email confirmation to customer & admin
    mailerService.sendOrderConfirmation(savedOrder).catch((e) => {
      console.warn('[Order Mailer] Non-blocking email error:', e.message);
    });

    // Trigger async CRM webhook dispatch to Hostinger CRM
    webhookDispatcher.dispatchOrderCreated(savedOrder).catch((e) => {
      console.warn('[Order Webhook] Non-blocking dispatch error:', e.message);
    });

    res.json({ success: true, order: savedOrder });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save order' });
  }
});

// ==========================================
// 5. INQUIRIES & CORPORATE B2B (MYSQL + EMAIL)
// ==========================================
app.post('/api/inquiries', async (req: Request, res: Response) => {
  try {
    const inquiry = req.body;
    const saved = await dbService.saveInquiry(inquiry);

    // Send email notification via SMTP
    mailerService.sendContactNotification(inquiry).catch((e) => {
      console.warn('[Inquiry Mailer] Non-blocking email error:', e.message);
    });

    // Trigger async CRM webhook dispatch to Hostinger CRM
    webhookDispatcher.dispatchInquiryCreated(saved).catch((e) => {
      console.warn('[Inquiry Webhook] Non-blocking dispatch error:', e.message);
    });

    res.json({ success: true, inquiry: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to process inquiry' });
  }
});

// ==========================================
// 6. FILE & MEDIA STORAGE (HOST LOCAL DISK)
// ==========================================
app.post('/api/upload', requireOwner, (req: Request, res: Response) => {
  upload.single('file')(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      url: publicUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      storage: 'Host Local Disk'
    });
  });
});

app.get('/api/uploads', requireOwner, (_req: Request, res: Response) => {
  const files = listLocalFiles();
  res.json({
    success: true,
    count: files.length,
    storagePath: UPLOAD_DIR,
    files
  });
});

app.delete('/api/uploads/:filename', requireOwner, (req: Request, res: Response) => {
  const filename = req.params.filename;
  const deleted = deleteLocalFile(filename);
  if (deleted) {
    res.json({ success: true, filename });
  } else {
    res.status(404).json({ success: false, error: 'File not found on local disk' });
  }
});

// ==========================================
// 7. GEMINI AI LUXURY SERVICES
// ==========================================
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// AI Description & Luxury Story Generator (Store Owner Catalog Tool)
app.post('/api/gemini/generate-story', requireOwner, async (req: Request, res: Response) => {
  const { name, category, productType, leatherType, hardware, dimensions, features, tone } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  const defaultStory = {
    shortDescription: `Handcrafted from prime ${leatherType || 'vegetable-tanned full-grain leather'}, embodying timeless Indian bespoke elegance.`,
    description: `Born of relentless artisanal devotion, the ${name} epitomizes Bharatvarsh Leathercrafts' reverence for time-honored Indian tanning traditions. Meticulously cut from prime ${leatherType || 'full-grain vegetable-tanned cowhide'} and finished with ${hardware || 'solid antique brass accents'}, every crease and bevel celebrates unhurried perfection. Designed to age gracefully, this heirloom develops a luminous, bespoke patina unique to your life's journey.\n\nFrom daily boardrooms to celebratory grand occasions, it offers uncompromising structural permanence, hand-burnished edge sealing with natural beeswax, and durable saddle-stitch integrity that outlives mass-manufactured accessories.`,
    features: [
      `Hand-beveled edges sealed with organic unrefined Indian beeswax`,
      `Pure ${hardware || 'solid cast antique brass'} hardware engineered for generational longevity`,
      `Generates an exquisite deep amber patina that deepens with honest wear`,
      `Custom bespoke hot-stamping & blind debossing available on demand`
    ],
    careInstructions: `Condition bi-annually using all-natural beeswax-based leather balm. Shield from torrential monsoon moisture; if wet, pat dry immediately with raw muslin and air-dry away from direct thermal heat.`,
    suggestedBadge: 'Artisan Masterpiece'
  };

  if (!ai) {
    return res.json(defaultStory);
  }

  try {
    const prompt = `You are the Master Leather Artisan and Creative Director for Bharatvarsh Leathercrafts LLP, a prestigious Indian luxury atelier creating world-class, bespoke vegetable-tanned full-grain leather goods.
Write an authentic, evocative luxury catalog narrative for our new product:
- Product Name: ${name}
- Category: ${category}
- Product Type: ${productType}
- Leather Type: ${leatherType || 'Vegetable-Tanned Full-Grain Cowhide'}
- Hardware: ${hardware || 'Solid Cast Brass'}
- Dimensions: ${dimensions || 'Standard artisanal proportions'}
- Key Features / Notes: ${features || 'Hand-stitched, edge-beveled, burnished with natural beeswax'}
- Tone: ${tone || 'Timeless, regal, artisanal, luxurious, honoring Indian craftsmanship and Kanpur/Dharavi heritage'}

Create:
1. shortDescription: A captivating 1-2 sentence hook (max 25 words).
2. description: A 2-3 paragraph rich, evocative luxury story detailing the provenance of the leather, the tactile hand-feel, patina journey, and enduring durability for the discerning Indian gentleman or gentlewoman.
3. features: An array of 4-5 refined bullet points highlighting craftsmanship details.
4. careInstructions: Practical, expert advice on caring for this specific leather piece in Indian climates.
5. suggestedBadge: A short 2-3 word luxury badge.`;

    const aiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortDescription: { type: Type.STRING },
            description: { type: Type.STRING },
            features: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            careInstructions: { type: Type.STRING },
            suggestedBadge: { type: Type.STRING }
          },
          required: ['shortDescription', 'description', 'features', 'careInstructions']
        }
      }
    }).then((response) => JSON.parse(response.text || '{}'));

    const result = await withTimeout(aiCall, 6000, defaultStory);
    return res.json(result);
  } catch (error: any) {
    console.error('Error generating AI story:', error);
    return res.json(defaultStory);
  }
});

// ==========================================
// 7. CONCIERGE KNOWLEDGE BASE & AI AGENT
// ==========================================
const CONCIERGE_KNOWLEDGE_FILE = path.join(__dirname, 'data', 'concierge_knowledge.txt');

function getConciergeKnowledge(): string {
  try {
    if (fs.existsSync(CONCIERGE_KNOWLEDGE_FILE)) {
      return fs.readFileSync(CONCIERGE_KNOWLEDGE_FILE, 'utf-8');
    }
  } catch (err) {
    console.error('[Concierge Knowledge] Failed reading knowledge file:', err);
  }
  return '';
}

function saveConciergeKnowledge(content: string): boolean {
  try {
    const dir = path.dirname(CONCIERGE_KNOWLEDGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONCIERGE_KNOWLEDGE_FILE, content, 'utf-8');
    return true;
  } catch (err) {
    console.error('[Concierge Knowledge] Failed saving knowledge file:', err);
    return false;
  }
}

// GET /api/concierge-knowledge: Read active AI training document
app.get('/api/concierge-knowledge', async (_req: Request, res: Response) => {
  try {
    const content = getConciergeKnowledge();
    const stats = fs.existsSync(CONCIERGE_KNOWLEDGE_FILE) ? fs.statSync(CONCIERGE_KNOWLEDGE_FILE) : null;
    res.json({
      content,
      lastModified: stats ? stats.mtime.toISOString() : new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to read concierge knowledge' });
  }
});

// PUT /api/admin/concierge-knowledge: Update active AI training document (Owner only)
app.put('/api/admin/concierge-knowledge', requireOwner, async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content string is required' });
    }
    const success = saveConciergeKnowledge(content);
    if (!success) {
      return res.status(500).json({ error: 'Failed to write knowledge document to disk' });
    }
    const stats = fs.statSync(CONCIERGE_KNOWLEDGE_FILE);
    res.json({
      success: true,
      message: 'Concierge AI knowledge base updated successfully',
      lastModified: stats.mtime.toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update concierge knowledge' });
  }
});

// Customer Leather Care & Sizing Concierge Chat
app.post('/api/gemini/concierge-chat', async (req: Request, res: Response) => {
  const { message, currentProduct } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const knowledgeDocument = getConciergeKnowledge();
  const lower = message.toLowerCase();

  // Rule-based fallback response engine strictly grounded in knowledge document
  let defaultReply = `Greetings from Bharatvarsh Leathercrafts Atelier. `;
  
  // Boundary check for completely unrelated topics
  const isOutOfScope =
    lower.includes('coding') || lower.includes('javascript') || lower.includes('python') ||
    lower.includes('react') || lower.includes('politics') || lower.includes('election') ||
    lower.includes('crypto') || lower.includes('bitcoin') || lower.includes('movie') ||
    lower.includes('gucci') || lower.includes('louis vuitton') || lower.includes('hermes');

  if (isOutOfScope) {
    defaultReply = `As the Bharatvarsh Atelier Concierge, my expertise is dedicated exclusively to our handcrafted leather collections, bespoke sizing, monsoon care protocols, and artisan leatherworking. How may I assist you with your Bharatvarsh pieces today?`;
  } else if (lower.includes('size') || lower.includes('belt') || lower.includes('waist') || lower.includes('fit') || lower.includes('length')) {
    defaultReply = `For our full-grain leather belts, we recommend the **Golden Rule of Leather Sizing**: Always order **2 inches larger** than your standard Indian trouser/jeans waist size.\n\n• For example, a 34" trouser waist takes our **36" belt (90 cm)**.\n• Why: This centers the solid cast brass buckle tongue precisely in the middle hole (hole 3 of 5, spaced 1 inch apart), giving you equal room for comfort.\n• Widths: Our 38mm belts (like The Viceroy) are crafted for denim & casual wear, while 32mm belts (The Sovereign) are slender and refined for formal suit slacks.`;
  } else if (lower.includes('monsoon') || lower.includes('rain') || lower.includes('humidity') || lower.includes('water') || lower.includes('mumbai') || lower.includes('pune') || lower.includes('fungus') || lower.includes('mildew')) {
    defaultReply = `Vegetable-tanned full-grain leather breathes and reacts organically to Indian weather:\n\n1. **Monsoons & Rain (Pune / Western Ghats / Mumbai):** If caught in rain, never expose to direct heat (hair dryers or radiators shrink collagen fibers and cause permanent cracks). Gently dab excess droplets with unbleached cotton muslin, stuff with plain craft paper to maintain its silhouette, and air-dry in a shaded, well-ventilated room.\n2. **Coastal Humidity & Saline Air:** Never seal in plastic polybags. Store in our breathable organic cotton dustbag. If chalky white bloom appears, wipe with a cloth slightly dampened in 1:10 diluted white vinegar and water, then nourish with pure beeswax balm.\n3. **Arid North Indian Climates (Delhi NCR / Rajasthan):** Low ambient moisture can dry out hides; nourish with beeswax balm every 2–3 months.`;
  } else if (lower.includes('patina') || lower.includes('age') || lower.includes('darken') || lower.includes('color')) {
    defaultReply = `Full-grain vegetable-tanned leather does not wear out—it wears *in*. Plant tannins in the hide react organically with ambient sunlight, natural oils from your palms, and daily journeys:\n\n• **Weeks 1–4:** The hide softens and conforms to your contours.\n• **Months 3–6:** Shades like Saddle Cognac and London Tan deepen into a lustrous golden-caramel amber.\n• **Year 1 & Beyond:** Develops a multidimensional heirloom gloss with darkened hand-burnished edges unique to your personal life story.`;
  } else if (lower.includes('stitch') || lower.includes('seam') || lower.includes('thread') || lower.includes('saddle')) {
    defaultReply = `We hand-stitch our structural stress points using the legendary **Two-Needle Hand Saddle Stitch**:\n\n• **The Technique:** Two blunt harness needles on a single length of hand-waxed Irish linen thread pass in opposite directions through each diamond-punched hole, knotting in the center.\n• **Functional Superiority vs Machine Lockstitch:** If a machine stitch breaks, the entire seam can unravel under tension. In our hand saddle stitch, each stitch is independent—even if one thread were severed decades later, the opposing thread remains locked by friction. The seam will never unravel.\n• **Applications:** Hand saddle stitch reinforces belt buckle keepers, briefcase handles, and wallet spines. Machine lockstitching is used only on flat interior linings.`;
  } else if (lower.includes('leather type') || lower.includes('tanning') || lower.includes('vegetable') || lower.includes('chrome') || lower.includes('bridle') || lower.includes('vachetta')) {
    defaultReply = `At Bharatvarsh, we use strictly 100% full-grain vegetable-tanned hides—never chrome-tanned leather or PU 'genuine leather':\n\n• **Full-Grain Veg-Tan:** Pit-tanned over 40–60 days in natural oak, chestnut, mimosa, and Indian babul bark liquors. Breathable, hypoallergenic, with zero toxic chromium salts.\n• **English Bridle Leather:** Curried with hot waxes and tallow for exceptional tensile stiffness, weather repellency, and zero stretch under load (used for Viceroy belts and bag handles).\n• **Tuscan Vachetta:** Renowned Italian vegetable-tanned leather that develops the most celebrated honey-bourbon patina.\n• **Pull-Up Leather:** Infused with oils that shift when bent, creating dynamic two-tone highlights.`;
  } else if (lower.includes('box') || lower.includes('packaging') || lower.includes('gift') || lower.includes('monogram') || lower.includes('deboss')) {
    defaultReply = `Every Bharatvarsh creation is housed for heirloom gifting:\n\n• **Archival Presentation Casket:** High-density rigid presentation casket, wrapped in an unbleached organic cotton dustbag and tied with ribbon, accompanied by a serial-numbered Certificate of Artisan Provenance.\n• **22K Gold Hot-Stamping:** Authentic 22-karat metallic gold leaf thermally fused into the grain (up to 3–4 Roman initials, e.g. "S.C.") for festive and milestone gifts.\n• **Blind Debossing:** Heat and high pressure stamped without foil for quiet, understated aristocratic luxury.`;
  } else if (currentProduct) {
    defaultReply = `You are inquiring about **${currentProduct.name}** (₹${currentProduct.price.toLocaleString('en-IN')}). Handcrafted from ${currentProduct.leatherType || 'full-grain vegetable-tanned leather'} with ${currentProduct.hardware || 'solid cast brass'} hardware. Edges are beveled and hand-burnished with organic beeswax. Would you like guidance on sizing, monsoon care protocols, or bespoke 22k gold monogramming?`;
  } else {
    defaultReply = `Greetings from Bharatvarsh Leathercrafts Atelier. As your Master Leather Artisan & Client Concierge, I can assist you with product specifications, belt sizing (ordering +2 inches over trouser waist), monsoon and humidity care across India, patina development, leather tanning processes, bespoke gift caskets, and our hand saddle-stitching craftsmanship. How may I serve you today?`;
  }

  if (!ai) {
    return res.json({ reply: defaultReply });
  }

  try {
    const productContext = currentProduct
      ? `The customer is currently examining: "${currentProduct.name}" (${currentProduct.category} - ${currentProduct.productType}). Price: ₹${currentProduct.price.toLocaleString('en-IN')}. Leather: ${currentProduct.leatherType || 'Full-grain veg-tan'}. Hardware: ${currentProduct.hardware || 'Solid brass'}. Dimensions: ${currentProduct.dimensions || 'N/A'}. Features: ${(currentProduct.features || []).join(', ')}.`
      : `The customer is browsing the Bharatvarsh Leathercrafts luxury catalog.`;

    const systemInstruction = `You are the distinguished Master Leather Artisan & Private Client Concierge at "Bharatvarsh Leathercrafts LLP" (headquartered at The Crown Greens, Hinjewadi Phase 2, Pune 411057; Contact: support@bharatvarshcrafts.com; Helpline: +91 (0) 20 2986 0221; LLPIN: ADD-6497).

STRICT SCOPE AND BOUNDARIES:
- You must ONLY answer questions based on the verified information provided in the ATELIER KNOWLEDGE BASE below and the Bharatvarsh storefront.
- Under NO circumstances should you answer unrelated questions outside leathercraft and Bharatvarsh (such as general programming, politics, pop culture, sports, medical or financial advice, or other brands like Gucci or Hermes).
- If the customer asks anything out of bounds or unrelated to Bharatvarsh leathercraft, you MUST politely decline and redirect with:
  "As the Bharatvarsh Atelier Concierge, my expertise is dedicated exclusively to our handcrafted leather collections, bespoke sizing, monsoon care protocols, and artisan leatherworking. How may I assist you with your Bharatvarsh pieces today?"
- Act as an authoritative AI agent providing expert guidance on:
  1. Products in the catalog (materials, dimensions, hardware, pricing in INR with 18% GST).
  2. Size and fit (the Golden Rule of ordering +2 inches over trouser/jeans waist size; belt widths 38mm vs 32mm; bag laptop fit).
  3. Raining, monsoon, and humidity care tailored to specific Indian locations (coastal humidity in Mumbai/Goa/Chennai vs monsoon in Pune/Western Ghats vs arid dry North India; never apply direct heat; muslin drying; beeswax conditioning).
  4. Patina development (biological maturation of veg-tan leather over 3–12 months with UV and body oils; color darkening).
  5. Different types of leather and their tanning processes (full-grain vegetable-tanned, English bridle leather, Tuscan vachetta, pull-up leather; 40-60 days organic pit tanning with tree barks; strict rejection of chrome tanning and PU "genuine leather").
  6. Bespoke gift packaging and monogramming (rigid presentation casket, unbleached cotton dustbag, certificate of provenance, blind debossing vs 22k gold foil hot-stamping up to 3-4 letters).
  7. Different stitch types on leather and their applications (two-needle hand saddle stitch with waxed linen thread where opposing threads lock and NEVER unravel vs machine lockstitch; hand-creased edge borders; hand-beveled beeswax burnished edges).

Tone: Courteous, refined, warm, and authoritative. Keep answers structured, elegant, and concise (under 160 words unless detailing a step-by-step care guide).

==================== ATELIER KNOWLEDGE BASE ====================
${knowledgeDocument}
================================================================`;

    const contextPrompt = `${productContext}\n\nCustomer Inquiry: "${message}"`;

    const aiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contextPrompt,
      config: {
        systemInstruction
      }
    }).then((res) => res.text || defaultReply);

    const reply = await withTimeout(aiCall, 6000, defaultReply);
    return res.json({ reply });
  } catch (error: any) {
    console.error('Error in concierge chat:', error);
    return res.json({ reply: defaultReply });
  }
});

// ==========================================
// 8. SERVER BOOTSTRAP (VITE DEV / PROD DIST)
// ==========================================
async function startServer() {
  // Initialize MySQL database (falls back cleanly if MySQL daemon isn't running)
  await initDatabase();

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        port: Number(port),
        host: '0.0.0.0',
        hmr: false,
        watch: null,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

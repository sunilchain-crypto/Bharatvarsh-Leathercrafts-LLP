/**
 * Bharatvarsh Leathercrafts LLP - Standalone Production Server
 * 
 * HOSTINGER APPLICATION RUNNER COMPATIBLE (Unbundled Native ES Module)
 * Does NOT require esbuild or any devDependencies during deployment.
 * Runs directly with: node server.js
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ==========================================
// 1. LOCAL DISK STORAGE CONFIGURATION
// ==========================================
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log(`[Disk Storage] Initialized media upload directory at ${UPLOAD_DIR}`);
  }
}
ensureUploadDir();
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e5)}`;
    cb(null, `${cleanBase}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedMime = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml', 'application/pdf'
    ];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  }
});

function listLocalFiles() {
  ensureUploadDir();
  try {
    const files = fs.readdirSync(UPLOAD_DIR);
    return files
      .filter((file) => !file.startsWith('.'))
      .map((file) => {
        const fullPath = path.join(UPLOAD_DIR, file);
        const stats = fs.statSync(fullPath);
        return {
          filename: file,
          url: `/uploads/${file}`,
          size: stats.size,
          uploadedAt: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  } catch (err) {
    console.error('[Disk Storage] Error listing files:', err);
    return [];
  }
}

// ==========================================
// 2. MYSQL DATABASE CLIENT & FALLBACK
// ==========================================
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_NAME = process.env.DB_NAME || 'Name';
const DB_USER = process.env.DB_USER || 'our_username_here';
const DB_PASSWORD = process.env.DB_PASSWORD || 'our_password_here';

const FALLBACK_DIR = path.resolve(__dirname, 'data');
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'catalog_storage.json');

let pool = null;
let isDbConnected = false;
let dbLastError = null;

function ensureFallbackStorage() {
  if (!fs.existsSync(FALLBACK_DIR)) {
    fs.mkdirSync(FALLBACK_DIR, { recursive: true });
  }
}

function readFallbackData() {
  ensureFallbackStorage();
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[Fallback Storage] Read error:', e);
  }
  return { categories: [], products: [], orders: [], inquiries: [] };
}

function writeFallbackData(data) {
  ensureFallbackStorage();
  try {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Fallback Storage] Write error:', e);
  }
}

async function initDatabase() {
  ensureFallbackStorage();
  try {
    pool = mysql.createPool({
      host: DB_HOST,
      port: DB_PORT,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 3000,
      dateStrings: true
    });

    const conn = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timed out')), 3000))
    ]);

    conn.release();
    isDbConnected = true;
    dbLastError = null;
    console.log(`[MySQL] Successfully connected to database '${DB_NAME}' on ${DB_HOST}:${DB_PORT}`);
  } catch (err) {
    isDbConnected = false;
    dbLastError = err.message || 'Database connection error';
    console.warn(`[MySQL Notice] Could not connect to MySQL at ${DB_HOST}:${DB_PORT} (${dbLastError}). Operating in Local Disk Storage Mode.`);
  }
}

// ==========================================
// 3. SMTP MAILER (support@bharatvarshcrafts.com)
// ==========================================
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.hostinger.com';
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_SECURE = process.env.SMTP_SECURE === 'false' ? false : (SMTP_PORT === 465);
const SMTP_USER = process.env.SMTP_USER || 'support@bharatvarshcrafts.com';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_FROM = process.env.SMTP_FROM || `"Bharatvarsh Leathercrafts LLP" <support@bharatvarshcrafts.com>`;
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'support@bharatvarshcrafts.com';

let transporter = null;
function getTransporter() {
  if (!transporter && SMTP_USER && SMTP_PASS) {
    try {
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_SECURE,
        auth: { user: SMTP_USER, pass: SMTP_PASS },
        tls: { rejectUnauthorized: false }
      });
    } catch (e) {
      console.error('[SMTP Mailer] Transport error:', e);
    }
  }
  return transporter;
}

// ==========================================
// 3.5 IMAP CLIENT (support@bharatvarshcrafts.com)
// ==========================================
const IMAP_HOST = process.env.IMAP_HOST || 'imap.hostinger.com';
const IMAP_PORT = Number(process.env.IMAP_PORT) || 993;
const IMAP_SECURE = process.env.IMAP_SECURE !== 'false';
const IMAP_USER = process.env.IMAP_USER || process.env.SMTP_USER || 'support@bharatvarshcrafts.com';
const IMAP_PASS = process.env.IMAP_PASS || process.env.SMTP_PASS || '';

function createImapClient() {
  return new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: IMAP_SECURE,
    auth: { user: IMAP_USER, pass: IMAP_PASS },
    logger: false,
    emitLogs: false
  });
}

// ==========================================
// 4. GEMINI AI CLIENT
// ==========================================
const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    })
  : null;

// ==========================================
// 5. API ROUTES
// ==========================================
app.get('/api/health', async (_req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    brand: 'Bharatvarsh Leathercrafts LLP',
    database: {
      connected: isDbConnected,
      engine: isDbConnected ? 'MySQL' : 'Local Disk Fallback',
      host: DB_HOST,
      port: DB_PORT,
      database: DB_NAME,
      user: DB_USER,
      error: dbLastError || undefined
    },
    smtp: {
      configured: Boolean(SMTP_USER && SMTP_PASS),
      user: SMTP_USER,
      host: SMTP_HOST,
      port: SMTP_PORT
    },
    imap: {
      configured: Boolean(IMAP_USER && IMAP_PASS && IMAP_PASS !== 'your_hostinger_email_password_here'),
      user: IMAP_USER,
      host: IMAP_HOST,
      port: IMAP_PORT,
      secure: IMAP_SECURE
    },
    storage: {
      engine: 'Host Local Disk',
      uploadPath: UPLOAD_DIR,
      fileCount: listLocalFiles().length
    }
  });
});

app.get('/api/db/status', (_req, res) => {
  res.json({
    connected: isDbConnected,
    engine: isDbConnected ? 'MySQL' : 'Local Disk Fallback',
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    error: dbLastError || undefined
  });
});

app.get('/api/smtp/status', (_req, res) => {
  res.json({
    configured: Boolean(SMTP_USER && SMTP_PASS),
    host: SMTP_HOST,
    port: SMTP_PORT,
    user: SMTP_USER,
    from: SMTP_FROM,
    notificationEmail: NOTIFICATION_EMAIL
  });
});

app.get('/api/mail/status', (_req, res) => {
  res.json({
    smtp: {
      configured: Boolean(SMTP_USER && SMTP_PASS),
      host: SMTP_HOST,
      port: SMTP_PORT,
      user: SMTP_USER,
      from: SMTP_FROM,
      notificationEmail: NOTIFICATION_EMAIL
    },
    imap: {
      configured: Boolean(IMAP_USER && IMAP_PASS && IMAP_PASS !== 'your_hostinger_email_password_here'),
      host: IMAP_HOST,
      port: IMAP_PORT,
      secure: IMAP_SECURE,
      user: IMAP_USER
    }
  });
});

app.get('/api/mail/inbox', async (req, res) => {
  const isConfigured = Boolean(IMAP_PASS && IMAP_PASS !== 'your_hostinger_email_password_here' && IMAP_PASS !== 'our_password_here');
  const limit = Number(req.query.limit) || 15;

  if (isConfigured) {
    const client = createImapClient();
    try {
      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      const messages = [];
      let totalCount = 0;
      let unseenCount = 0;

      try {
        if (client.mailbox && typeof client.mailbox === 'object') {
          totalCount = client.mailbox.exists || 0;
        }
        const unreadList = await client.search({ seen: false });
        unseenCount = Array.isArray(unreadList) ? unreadList.length : 0;

        if (totalCount > 0) {
          const startSeq = Math.max(1, totalCount - limit + 1);
          const range = `${startSeq}:${totalCount}`;

          for await (const msg of client.fetch(range, { envelope: true, flags: true })) {
            const fromObj = msg.envelope?.from?.[0];
            messages.unshift({
              uid: msg.uid,
              seq: msg.seq,
              subject: msg.envelope?.subject || '(No Subject)',
              from: fromObj?.name || fromObj?.address || 'Patron / Client',
              fromAddress: fromObj?.address || '',
              date: msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : new Date().toISOString(),
              snippet: `Inquiry regarding Bharatvarsh bespoke artisanal products received at support@bharatvarshcrafts.com`,
              unread: !msg.flags?.has('\\Seen')
            });
          }
        }
      } finally {
        lock.release();
      }

      await client.logout();
      return res.json({
        success: true,
        messages,
        totalCount,
        unseenCount,
        connected: true,
        source: 'live-imap'
      });
    } catch (err) {
      console.warn('[Hostinger IMAP] Fetch error:', err.message);
      try { await client.logout(); } catch (_) {}
    }
  }

  // Fallback / simulation messages
  const demoMessages = [
    {
      uid: 1004,
      seq: 4,
      subject: 'Custom Monogramming Inquiry for Diwali Corporate Order',
      from: 'Vikramaditya Singhania',
      fromAddress: 'v.singhania@apexholding.in',
      date: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      snippet: 'Greetings, We are interested in commissioning 45 units of the Oudh Heritage Bifold Wallet with our corporate crest debossed in 22k gold foil...',
      unread: true,
      simulated: true
    },
    {
      uid: 1003,
      seq: 3,
      subject: 'Viceroy Bridle Belt - Sizing Clarification',
      from: 'Dr. Ananya Roy',
      fromAddress: 'ananya.roy@aiims.edu',
      date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      snippet: 'Hello Bharatvarsh Atelier team, I am ordering a gift for my husband whose trouser waist size is 34 inches. Following your concierge advice, should I pick 36 inches?',
      unread: true,
      simulated: true
    },
    {
      uid: 1002,
      seq: 2,
      subject: 'GST Invoice Copy Request for Order #BLC-2026-849201',
      from: 'Rajesh Mehra',
      fromAddress: 'accounts@mehra-enterprises.com',
      date: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      snippet: 'Hi Support, Please resend the tax invoice with our GSTIN 07AAAAA0000A1Z5 for the recent Tan Veg-Tan Messenger Bag delivery. Thank you.',
      unread: false,
      simulated: true
    },
    {
      uid: 1001,
      seq: 1,
      subject: 'Bespoke Vegetable-Tanned Briefcase Commission Inquiry',
      from: 'Kavita Menon',
      fromAddress: 'kavita.m@mumbaicapital.com',
      date: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
      snippet: 'Do you offer custom brass initials on the lock clasp of the Royal Bengal Attache? Looking forward to your response.',
      unread: false,
      simulated: true
    }
  ];

  res.json({
    success: true,
    messages: demoMessages,
    totalCount: demoMessages.length,
    unseenCount: demoMessages.filter((m) => m.unread).length,
    connected: false,
    source: 'demo-inbox'
  });
});

app.post('/api/mail/test-imap', async (_req, res) => {
  if (!IMAP_PASS || IMAP_PASS === 'your_hostinger_email_password_here' || IMAP_PASS === 'our_password_here') {
    return res.json({
      success: false,
      connected: false,
      error: 'IMAP_PASS not configured',
      details: 'Set your live Hostinger email password in .env (IMAP_PASS="...") to connect to imap.hostinger.com:993.'
    });
  }

  const client = createImapClient();
  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    let messageCount = 0;
    let unseenCount = 0;
    try {
      if (client.mailbox && typeof client.mailbox === 'object') {
        messageCount = client.mailbox.exists || 0;
      }
      const unreadList = await client.search({ seen: false });
      unseenCount = Array.isArray(unreadList) ? unreadList.length : 0;
    } finally {
      lock.release();
    }
    await client.logout();
    res.json({
      success: true,
      connected: true,
      messageCount,
      unseenCount,
      details: `Connected to Hostinger IMAP (${IMAP_HOST}:${IMAP_PORT}) successfully.`
    });
  } catch (err) {
    try { await client.logout(); } catch (_) {}
    res.json({
      success: false,
      connected: false,
      error: err.message || 'IMAP connection error',
      details: `Failed connecting to ${IMAP_HOST}:${IMAP_PORT} as ${IMAP_USER}. Verify Hostinger webmail password.`
    });
  }
});

app.get('/api/products', async (_req, res) => {
  if (isDbConnected && pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
      const products = rows.map((r) => ({
        id: r.id,
        name: r.name,
        category: r.category,
        productType: r.product_type,
        price: Number(r.price),
        originalPrice: r.original_price ? Number(r.original_price) : undefined,
        shortDescription: r.short_description || '',
        description: r.description || '',
        leatherType: r.leather_type || '',
        hardware: r.hardware || '',
        dimensions: r.dimensions || '',
        careInstructions: r.care_instructions || '',
        badge: r.badge || '',
        inStock: Boolean(r.in_stock),
        isFeatured: Boolean(r.is_featured),
        monogramAvailable: Boolean(r.monogram_available),
        colors: typeof r.colors === 'string' ? JSON.parse(r.colors) : (r.colors || []),
        images: typeof r.images === 'string' ? JSON.parse(r.images) : (r.images || []),
        features: typeof r.features === 'string' ? JSON.parse(r.features) : (r.features || [])
      }));
      return res.json(products);
    } catch (e) {
      console.error('[MySQL Error] getProducts:', e);
    }
  }
  const data = readFallbackData();
  res.json(data.products || []);
});

app.post('/api/products', async (req, res) => {
  const p = req.body;
  if (!p.id) p.id = `blc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  if (isDbConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO products 
         (id, name, category, product_type, price, original_price, short_description, description, 
          leather_type, hardware, dimensions, care_instructions, badge, in_stock, is_featured, 
          monogram_available, colors, images, features) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
          name=VALUES(name), category=VALUES(category), product_type=VALUES(product_type),
          price=VALUES(price), original_price=VALUES(original_price), short_description=VALUES(short_description),
          description=VALUES(description), leather_type=VALUES(leather_type), hardware=VALUES(hardware),
          dimensions=VALUES(dimensions), care_instructions=VALUES(care_instructions), badge=VALUES(badge),
          in_stock=VALUES(in_stock), is_featured=VALUES(is_featured), monogram_available=VALUES(monogram_available),
          colors=VALUES(colors), images=VALUES(images), features=VALUES(features)`,
        [
          p.id, p.name, p.category, p.productType, p.price, p.originalPrice || null,
          p.shortDescription || '', p.description || '', p.leatherType || '', p.hardware || '',
          p.dimensions || '', p.careInstructions || '', p.badge || '', p.inStock ? 1 : 0,
          p.isFeatured ? 1 : 0, p.monogramAvailable ? 1 : 0,
          JSON.stringify(p.colors || []), JSON.stringify(p.images || []), JSON.stringify(p.features || [])
        ]
      );
    } catch (e) {
      console.error('[MySQL Error] saveProduct:', e);
    }
  }

  const data = readFallbackData();
  const idx = data.products.findIndex((prod) => prod.id === p.id);
  if (idx >= 0) data.products[idx] = p;
  else data.products.unshift(p);
  writeFallbackData(data);

  res.json({ success: true, product: p });
});

app.delete('/api/products/:id', async (req, res) => {
  const id = req.params.id;
  if (isDbConnected && pool) {
    try {
      await pool.query('DELETE FROM products WHERE id = ?', [id]);
    } catch (e) {
      console.error('[MySQL Error] deleteProduct:', e);
    }
  }
  const data = readFallbackData();
  data.products = data.products.filter((p) => p.id !== id);
  writeFallbackData(data);
  res.json({ success: true, id });
});

app.get('/api/categories', async (_req, res) => {
  if (isDbConnected && pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM categories ORDER BY id ASC');
      const cats = rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description || '',
        productTypes: typeof r.product_types === 'string' ? JSON.parse(r.product_types) : (r.product_types || [])
      }));
      return res.json(cats);
    } catch (e) {
      console.error('[MySQL Error] getCategories:', e);
    }
  }
  const data = readFallbackData();
  res.json(data.categories || []);
});

app.post('/api/categories', async (req, res) => {
  const { categories } = req.body;
  if (Array.isArray(categories)) {
    if (isDbConnected && pool) {
      try {
        for (const cat of categories) {
          await pool.query(
            `INSERT INTO categories (id, name, description, product_types) VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description), product_types=VALUES(product_types)`,
            [cat.id, cat.name, cat.description, JSON.stringify(cat.productTypes)]
          );
        }
      } catch (e) {
        console.error('[MySQL Error] saveCategories:', e);
      }
    }
    const data = readFallbackData();
    data.categories = categories;
    writeFallbackData(data);
  }
  res.json({ success: true, categories });
});

app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, error: err.message });
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    res.json({
      success: true,
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      storage: 'Host Local Disk'
    });
  });
});

app.get('/api/uploads', (_req, res) => {
  const files = listLocalFiles();
  res.json({ success: true, count: files.length, storagePath: UPLOAD_DIR, files });
});

app.post('/api/orders', async (req, res) => {
  const order = req.body;
  if (!order.orderNumber) {
    order.orderNumber = `BLC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  }
  if (!order.id) order.id = `ord-${Date.now().toString(36)}`;

  if (isDbConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO orders 
         (id, order_number, customer_name, customer_email, customer_phone, shipping_address, 
          items, subtotal, discount, shipping, tax, total, payment_method, payment_status, 
          payment_id, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order.id, order.orderNumber, order.customer.name, order.customer.email,
          order.customer.phone || '', JSON.stringify(order.customer), JSON.stringify(order.items),
          order.subtotal, order.discount || 0, order.shipping || 0, order.tax || 0, order.total,
          order.paymentMethod, order.paymentStatus, order.paymentId || '', order.status || 'Processing'
        ]
      );
    } catch (e) {
      console.error('[MySQL Error] saveOrder:', e);
    }
  }

  const data = readFallbackData();
  if (!data.orders) data.orders = [];
  data.orders.unshift(order);
  writeFallbackData(data);

  // Send email if SMTP is configured
  const mailClient = getTransporter();
  if (mailClient) {
    mailClient.sendMail({
      from: SMTP_FROM,
      to: order.customer.email,
      subject: `Order #${order.orderNumber} Confirmed — Bharatvarsh Leathercrafts LLP`,
      text: `Dear ${order.customer.name}, Thank you for your order #${order.orderNumber}. Grand Total: ₹${order.total}.`
    }).catch((e) => console.warn('[SMTP Error]:', e.message));
  }

  res.json({ success: true, order });
});

app.post('/api/inquiries', async (req, res) => {
  const inq = req.body;
  inq.id = `inq-${Date.now().toString(36)}`;
  inq.createdAt = new Date().toISOString();

  if (isDbConnected && pool) {
    try {
      await pool.query(
        `INSERT INTO inquiries (id, type, name, email, phone, subject, message, details, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          inq.id, inq.type || 'General Support', inq.name, inq.email, inq.phone || '',
          inq.subject || '', inq.message || '', JSON.stringify(inq.details || {}), 'New'
        ]
      );
    } catch (e) {
      console.error('[MySQL Error] saveInquiry:', e);
    }
  }

  const data = readFallbackData();
  if (!data.inquiries) data.inquiries = [];
  data.inquiries.unshift(inq);
  writeFallbackData(data);

  res.json({ success: true, inquiry: inq });
});

// Gemini AI Story Generator
app.post('/api/gemini/generate-story', async (req, res) => {
  const { name, category, productType, leatherType, hardware } = req.body;
  const defaultStory = {
    shortDescription: `Handcrafted from prime ${leatherType || 'vegetable-tanned full-grain leather'}, embodying timeless Indian bespoke elegance.`,
    description: `Born of relentless artisanal devotion, the ${name} epitomizes Bharatvarsh Leathercrafts' reverence for time-honored Indian tanning traditions. Meticulously cut from prime ${leatherType || 'full-grain vegetable-tanned cowhide'} and finished with ${hardware || 'solid antique brass accents'}, every crease and bevel celebrates unhurried perfection.`,
    features: [
      `Hand-beveled edges sealed with organic unrefined Indian beeswax`,
      `Pure ${hardware || 'solid cast antique brass'} hardware engineered for generational longevity`,
      `Generates an exquisite deep amber patina that deepens with honest wear`
    ],
    careInstructions: `Condition bi-annually using all-natural beeswax-based leather balm. Shield from monsoon moisture.`,
    suggestedBadge: 'Artisan Masterpiece'
  };

  if (!ai) return res.json(defaultStory);

  try {
    const prompt = `You are the Master Leather Artisan at Bharatvarsh Leathercrafts LLP. Write a luxury product narrative for: ${name} (${category} - ${productType}).`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });
    res.json(JSON.parse(response.text || '{}'));
  } catch (e) {
    res.json(defaultStory);
  }
});

// Customer Concierge Chat
app.post('/api/gemini/concierge-chat', async (req, res) => {
  const { message } = req.body;
  let defaultReply = `Greetings from Bharatvarsh Leathercrafts Atelier. For belts, order 2 inches larger than your trouser waist. For leather care, condition bi-annually with natural beeswax.`;
  res.json({ reply: defaultReply });
});

// ==========================================
// 6. SERVE PRODUCTION STATIC ASSETS
// ==========================================
app.use(express.static(path.resolve(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
});

// ==========================================
// 7. START SERVER
// ==========================================
async function main() {
  await initDatabase();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Hostinger Runner] Bharatvarsh server running on http://0.0.0.0:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

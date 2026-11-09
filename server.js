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
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { GoogleGenAI, Type } from '@google/genai';
import { execSync } from 'child_process';

// Preserve host-provided PORT (Cloud Run injects PORT=8080, Hostinger injects PORT)
const systemPort = process.env.PORT;
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = systemPort || process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// ==========================================
// STATIC ASSETS & ROOT ROUTE HANDLER
// ==========================================
export function getCandidateIndexPaths() {
  return [
    path.resolve(__dirname, 'dist', 'index.html'),
    path.resolve(process.cwd(), 'dist', 'index.html'),
    path.resolve(__dirname, 'client', 'dist', 'index.html'),
    path.resolve(process.cwd(), 'client', 'dist', 'index.html')
  ];
}

export function findIndexHtml() {
  for (const candidate of getCandidateIndexPaths()) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

// Automatically compile frontend build on startup if missing
function ensureProductionBuild() {
  const found = findIndexHtml();
  if (!found) {
    console.log('[Storefront Build] dist/index.html not found. Running vite build automatically...');
    try {
      execSync('npx vite build', { stdio: 'inherit', cwd: __dirname });
      console.log('[Storefront Build] Frontend compiled successfully to dist/!');
    } catch (err) {
      console.error('[Storefront Build] Automated vite build error:', err.message);
    }
  }
}
ensureProductionBuild();

// Mount static asset directories
const candidateStaticDirs = [
  path.resolve(__dirname, 'dist'),
  path.resolve(process.cwd(), 'dist'),
  path.resolve(__dirname, 'client', 'dist'),
  path.resolve(process.cwd(), 'client', 'dist'),
  path.resolve(__dirname, 'public')
];

for (const dir of candidateStaticDirs) {
  try {
    if (fs.existsSync(dir)) {
      app.use(express.static(dir));
    }
  } catch (err) {
    console.warn(`[Static] Could not mount ${dir}:`, err.message);
  }
}

// Serve uploaded media
const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
  app.use('/uploads', express.static(uploadDir));
} catch (err) {
  console.warn('[Uploads] Could not initialize upload dir:', err.message);
}

// Explicit Root Route GET / handler (Guarantees GET / NEVER returns 404)
app.get('/', (_req, res) => {
  const indexFile = findIndexHtml();
  if (indexFile) {
    return res.sendFile(indexFile);
  }

  // Diagnostic fallback page if dist/index.html was not included in Hostinger deployment ZIP
  return res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Bharatvarsh Leathercrafts LLP — Server Active</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0c0a09; color: #f5f5f4; margin: 0; padding: 40px 20px; display: flex; align-items: center; justify-content: center; min-height: 100vh; box-sizing: border-box; }
    .card { background: #1c1917; border: 1px solid #78350f; border-radius: 16px; padding: 36px; max-width: 660px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h1 { color: #f59e0b; margin-top: 0; font-size: 24px; font-family: Georgia, serif; }
    p { line-height: 1.6; color: #d6d3d1; font-size: 14px; }
    .badge { display: inline-block; padding: 4px 10px; background: #14532d; color: #86efac; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
    .info { background: #0c0a09; border: 1px solid #292524; border-radius: 8px; padding: 14px 18px; font-family: monospace; font-size: 12px; color: #fbbf24; margin: 20px 0; word-break: break-all; line-height: 1.6; }
    a { color: #f59e0b; text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; }
    .btn { display: inline-block; padding: 10px 18px; background: #d97706; color: #fff; border-radius: 8px; font-weight: 600; text-decoration: none; margin-top: 10px; }
    ol { color: #d6d3d1; line-height: 1.7; font-size: 13px; padding-left: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">Node.js Server Active (HTTP 200 OK)</span>
    <h1>Bharatvarsh Leathercrafts LLP</h1>
    <p>Your Node.js Express server is <strong>running successfully</strong> on port ${port}. However, the compiled frontend build file (<code>dist/index.html</code>) was not found in the deployment directory.</p>
    <div class="info">
      <strong>Working Directory:</strong> ${process.cwd()}<br/>
      <strong>Paths Checked:</strong><br/>
      ${getCandidateIndexPaths().map((p) => `• ${p}`).join('<br/>')}
    </div>
    <p><strong>To display the storefront frontend:</strong></p>
    <ol>
      <li>Ensure the <code>dist/</code> folder (generated by <code>npm run build</code>) is included in your Hostinger deployment ZIP.</li>
      <li>Or run <code>npm run build</code> in the Hostinger Node.js terminal or via SSH.</li>
    </ol>
    <div style="margin-top:24px; display:flex; gap:16px; align-items:center;">
      <a class="btn" href="/api/health">Verify /api/health Status &rarr;</a>
      <a href="/api/products">View /api/products API</a>
    </div>
  </div>
</body>
</html>`);
});


// ==========================================
// ROLE-BASED ACCESS CONTROL (RBAC) CONFIG & MIDDLEWARE
// ==========================================
export const STORE_OWNER_EMAILS = [
  'sunilchain@gmail.com',
  'support@bharatvarshcrafts.com',
  ...(process.env.STORE_OWNER_EMAIL ? process.env.STORE_OWNER_EMAIL.split(',') : [])
].map((e) => e.trim().toLowerCase());

function parseJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

export function getUserFromToken(req) {
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

export function requireOwner(req, res, next) {
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

  req.user = userInfo;
  next();
}

app.get('/api/auth/me', (req, res) => {
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
const DB_HOST = process.env.DB_HOST || '127.0.0.1';
const DB_PORT = Number(process.env.DB_PORT) || 3306;
const DB_NAME = process.env.DB_NAME || 'u687292208_BharatvarshDB';
const DB_USER = process.env.DB_USER || 'u687292208_admin';
const DB_PASSWORD = process.env.DB_PASSWORD || 'SDM@Pune1';

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
// 4.5 CRM WEBHOOK DISPATCHER
// ==========================================
const WEBHOOK_LOG_FILE = path.resolve(__dirname, 'data', 'webhook_delivery_log.json');
const MAX_WEBHOOK_LOGS = 50;

function readWebhookLog() {
  try {
    if (fs.existsSync(WEBHOOK_LOG_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(WEBHOOK_LOG_FILE, 'utf-8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[Webhook Log] Error reading log:', err.message);
  }
  return [];
}

let webhookDeliveryLog = readWebhookLog();

function saveWebhookLog() {
  try {
    const dir = path.dirname(WEBHOOK_LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(WEBHOOK_LOG_FILE, JSON.stringify(webhookDeliveryLog.slice(0, MAX_WEBHOOK_LOGS), null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Webhook Log] Error saving log:', err.message);
  }
}

function getCrmWebhookUrl() {
  const url = process.env.CRM_WEBHOOK_URL || 'https://papayawhip-rail-174498.hostingersite.com/';
  return url.trim();
}

function getCrmWebhookSecret() {
  const secret = process.env.CRM_WEBHOOK_SECRET || 'blc_whsec_LiveAuth2026!';
  return secret.trim();
}

function getWebhookConfig() {
  const url = getCrmWebhookUrl();
  const secret = getCrmWebhookSecret();
  return {
    configured: !!url,
    url,
    hasSecret: !!secret,
    maskedSecret: secret ? `${secret.slice(0, 6)}••••••••${secret.slice(-4)}` : 'Not configured',
    totalDispatched: webhookDeliveryLog.length,
    lastDispatch: webhookDeliveryLog[0] || null
  };
}

async function dispatchCrmWebhook(event, data) {
  const targetUrl = getCrmWebhookUrl();
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  if (!targetUrl) {
    const res = { success: false, eventId, event, targetUrl: 'None', durationMs: 0, timestamp, error: 'CRM_WEBHOOK_URL unset' };
    webhookDeliveryLog.unshift(res);
    saveWebhookLog();
    return res;
  }

  const payload = {
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
  const secret = getCrmWebhookSecret();
  const signature = secret
    ? `sha256=${crypto.createHmac('sha256', secret).update(payloadJson).digest('hex')}`
    : '';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const headers = {
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
    if (secret) {
      headers['X-Webhook-Secret'] = secret;
    }

    console.log(`[Webhook Dispatcher] Sending "${event}" (${eventId}) to ${targetUrl}...`);
    const resp = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: payloadJson,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    const durationMs = Date.now() - startTime;
    let responseSnippet = '';
    try {
      const text = await resp.text();
      responseSnippet = text.slice(0, 300);
    } catch {}

    const isSuccess = resp.ok || resp.status === 200 || resp.status === 201 || resp.status === 202;
    const result = {
      success: isSuccess,
      eventId,
      event,
      targetUrl,
      statusCode: resp.status,
      statusText: resp.statusText,
      durationMs,
      timestamp,
      responseSnippet,
      error: isSuccess ? undefined : `HTTP ${resp.status} ${resp.statusText}`,
      requestPayloadPreview: payloadJson.slice(0, 300)
    };

    webhookDeliveryLog.unshift(result);
    if (webhookDeliveryLog.length > MAX_WEBHOOK_LOGS) {
      webhookDeliveryLog = webhookDeliveryLog.slice(0, MAX_WEBHOOK_LOGS);
    }
    saveWebhookLog();

    console.log(`[Webhook Dispatcher] Event "${event}" finished in ${durationMs}ms (HTTP ${resp.status})`);
    return result;
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const errorMsg = err.name === 'AbortError' ? 'Request timed out after 10000ms' : (err.message || 'Unknown network error');
    const result = {
      success: false,
      eventId,
      event,
      targetUrl,
      durationMs,
      timestamp,
      error: errorMsg,
      requestPayloadPreview: payloadJson.slice(0, 300)
    };
    webhookDeliveryLog.unshift(result);
    if (webhookDeliveryLog.length > MAX_WEBHOOK_LOGS) {
      webhookDeliveryLog = webhookDeliveryLog.slice(0, MAX_WEBHOOK_LOGS);
    }
    saveWebhookLog();
    console.warn(`[Webhook Dispatcher] Failed dispatching "${event}": ${errorMsg}`);
    return result;
  }
}

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
    },
    crmWebhook: getWebhookConfig()
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

app.all('/api/db/test', async (_req, res) => {
  const success = await initDatabase();
  res.json({
    connected: success,
    engine: success ? 'MySQL 8.0+' : 'Local Disk Fallback',
    host: DB_HOST,
    port: DB_PORT,
    database: DB_NAME,
    user: DB_USER,
    error: dbLastError,
    message: success
      ? `Successfully connected to MySQL database '${DB_NAME}' on ${DB_HOST}:${DB_PORT}.`
      : `Could not connect to MySQL at ${DB_HOST}:${DB_PORT} (${dbLastError || 'Connection refused'}). This is normal in the cloud preview container. On Hostinger, enter your live database credentials in .env to connect to MySQL.`
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

// ------------------------------------------
// CRM WEBHOOK MANAGEMENT & TEST
// ------------------------------------------
app.get('/api/admin/webhook/status', requireOwner, async (_req, res) => {
  try {
    res.json({
      config: getWebhookConfig(),
      deliveries: webhookDeliveryLog
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch webhook status' });
  }
});

app.post('/api/admin/webhook/test', requireOwner, async (_req, res) => {
  try {
    const result = await dispatchCrmWebhook('webhook.ping', {
      message: 'Test ping from Bharatvarsh Leathercrafts Storefront Webhook Dispatcher',
      timestamp: new Date().toISOString(),
      status: 'healthy'
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to trigger test webhook' });
  }
});

app.post('/api/admin/webhook/test-abandoned-cart', requireOwner, async (_req, res) => {
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
    const result = await dispatchCrmWebhook('cart.abandoned', sampleAbandonedCart);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to trigger test abandoned cart webhook' });
  }
});

app.delete('/api/admin/webhook/log', requireOwner, async (_req, res) => {
  try {
    webhookDeliveryLog = [];
    saveWebhookLog();
    res.json({ success: true, message: 'Delivery log cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to clear delivery log' });
  }
});

// Abandoned Cart Webhook Handler
const handleAbandonedCartReq = async (req, res) => {
  try {
    const { items, customer, cartTotal, checkoutStep, recoveryUrl, cartId } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart items are required for abandoned cart tracking' });
    }

    const hasContact = customer?.email || customer?.phone || customer?.name;
    if (!hasContact) {
      return res.status(400).json({ error: 'Customer contact information is required' });
    }

    const sanitizedItems = items.map((it) => ({
      productId: it.product?.id || it.productId || it.id || 'blc_item',
      name: it.product?.name || it.name || 'Artisanal Leather Good',
      color: it.selectedColor || it.color || 'Bourbon Cognac',
      monogram: it.monogramText || it.monogram || '',
      quantity: Number(it.quantity) || 1,
      price: Number(it.product?.price || it.price) || 0
    }));

    const computedTotal = sanitizedItems.reduce((sum, it) => sum + (it.price * it.quantity), 0);
    const total = typeof cartTotal === 'number' ? cartTotal : computedTotal;

    const payload = {
      cartId: cartId || `cart_abn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      customer: {
        name: customer?.name || 'Valued Patron',
        email: customer?.email || '',
        phone: customer?.phone || '',
        city: customer?.city || '',
        state: customer?.state || '',
        pincode: customer?.pincode || ''
      },
      items: sanitizedItems,
      itemCount: sanitizedItems.reduce((acc, it) => acc + it.quantity, 0),
      cartTotal: total,
      currency: 'INR',
      checkoutStep: checkoutStep || 'checkout_step_abandoned',
      recoveryUrl: recoveryUrl || `${process.env.APP_URL || 'https://green-crane-286916.hostingersite.com'}/#cart`,
      abandonedAt: new Date().toISOString()
    };

    const result = await dispatchCrmWebhook('cart.abandoned', payload);
    return res.json({
      success: true,
      eventId: result.eventId,
      dispatched: result.success,
      durationMs: result.durationMs,
      statusCode: result.statusCode
    });
  } catch (err) {
    console.error('[Abandoned Cart Webhook Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to dispatch abandoned cart webhook' });
  }
};

app.post('/api/cart/abandoned', handleAbandonedCartReq);
app.post('/api/webhooks/abandoned-cart', handleAbandonedCartReq);

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

function sanitizeProduct(raw) {
  const p = { ...raw };
  if (!p.id) p.id = `blc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
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

app.post('/api/products', requireOwner, async (req, res) => {
  const p = sanitizeProduct(req.body);

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

app.delete('/api/products/:id', requireOwner, async (req, res) => {
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

app.post('/api/categories', requireOwner, async (req, res) => {
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

app.post('/api/upload', requireOwner, (req, res) => {
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

app.get('/api/uploads', requireOwner, (_req, res) => {
  const files = listLocalFiles();
  res.json({ success: true, count: files.length, storagePath: UPLOAD_DIR, files });
});

// GET /api/orders: Owner sees all orders; authenticated customer only sees their own
app.get('/api/orders', async (req, res) => {
  const userInfo = getUserFromToken(req);
  let allOrders = [];

  if (isDbConnected && pool) {
    try {
      const [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
      allOrders = rows.map((r) => ({
        id: r.id,
        orderNumber: r.order_number,
        customer: typeof r.shipping_address === 'string' ? JSON.parse(r.shipping_address) : r.shipping_address,
        items: typeof r.items === 'string' ? JSON.parse(r.items) : (r.items || []),
        subtotal: Number(r.subtotal),
        discount: Number(r.discount || 0),
        shipping: Number(r.shipping || 0),
        tax: Number(r.tax || 0),
        total: Number(r.total),
        paymentMethod: r.payment_method,
        paymentStatus: r.payment_status,
        paymentId: r.payment_id,
        status: r.status,
        createdAt: r.created_at
      }));
    } catch (e) {
      console.error('[MySQL Error] getOrders:', e);
    }
  }

  if (allOrders.length === 0) {
    const data = readFallbackData();
    allOrders = data.orders || [];
  }

  if (userInfo && userInfo.isOwner) {
    return res.json(allOrders);
  }

  if (userInfo && userInfo.email) {
    const customerOrders = allOrders.filter(
      (o) => o.customer?.email?.toLowerCase() === userInfo.email.toLowerCase()
    );
    return res.json(customerOrders);
  }

  return res.status(403).json({
    error: 'Forbidden: Viewing global store orders requires Owner permissions',
    code: 'FORBIDDEN_OWNER_REQUIRED',
    requiredRole: 'Owner'
  });
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

  // Dispatch real-time event to Hostinger CRM Webhook
  dispatchCrmWebhook('order.created', {
    orderId: order.id,
    orderNumber: order.orderNumber,
    total: order.total,
    customer: order.customer,
    items: order.items,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt || new Date().toISOString()
  }).catch((e) => console.warn('[Order Webhook Error]:', e.message));

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

  // Dispatch real-time event to Hostinger CRM Webhook
  dispatchCrmWebhook('inquiry.created', {
    inquiryId: inq.id,
    clientName: inq.name || inq.clientName,
    company: inq.company,
    email: inq.email,
    phone: inq.phone,
    tier: inq.tier,
    quantity: inq.quantity,
    notes: inq.message || inq.notes,
    createdAt: inq.createdAt
  }).catch((e) => console.warn('[Inquiry Webhook Error]:', e.message));

  res.json({ success: true, inquiry: inq });
});

// Gemini AI Story Generator (Owner catalog tool)
app.post('/api/gemini/generate-story', requireOwner, async (req, res) => {
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

// ==========================================
// 5.5 CONCIERGE KNOWLEDGE BASE & AI AGENT
// ==========================================
const CONCIERGE_KNOWLEDGE_FILE = path.join(__dirname, 'data', 'concierge_knowledge.txt');

function getConciergeKnowledge() {
  try {
    if (fs.existsSync(CONCIERGE_KNOWLEDGE_FILE)) {
      return fs.readFileSync(CONCIERGE_KNOWLEDGE_FILE, 'utf-8');
    }
  } catch (err) {
    console.error('[Concierge Knowledge] Failed reading knowledge file:', err);
  }
  return '';
}

function saveConciergeKnowledge(content) {
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
app.get('/api/concierge-knowledge', async (_req, res) => {
  try {
    const content = getConciergeKnowledge();
    const stats = fs.existsSync(CONCIERGE_KNOWLEDGE_FILE) ? fs.statSync(CONCIERGE_KNOWLEDGE_FILE) : null;
    res.json({
      content,
      lastModified: stats ? stats.mtime.toISOString() : new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to read concierge knowledge' });
  }
});

// PUT /api/admin/concierge-knowledge: Update active AI training document (Owner only)
app.put('/api/admin/concierge-knowledge', requireOwner, async (req, res) => {
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
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update concierge knowledge' });
  }
});

// Customer Concierge Chat
app.post('/api/gemini/concierge-chat', async (req, res) => {
  const { message, currentProduct } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const knowledgeDocument = getConciergeKnowledge();
  const lower = message.toLowerCase();

  let defaultReply = `Greetings from Bharatvarsh Leathercrafts Atelier. `;
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
    defaultReply = `You are inquiring about **${currentProduct.name}** (₹${Number(currentProduct.price).toLocaleString('en-IN')}). Handcrafted from ${currentProduct.leatherType || 'full-grain vegetable-tanned leather'} with ${currentProduct.hardware || 'solid cast brass'} hardware. Edges are beveled and hand-burnished with organic beeswax. Would you like guidance on sizing, monsoon care protocols, or bespoke 22k gold monogramming?`;
  } else {
    defaultReply = `Greetings from Bharatvarsh Leathercrafts Atelier. As your Master Leather Artisan & Client Concierge, I can assist you with product specifications, belt sizing (ordering +2 inches over trouser waist), monsoon and humidity care across India, patina development, leather tanning processes, bespoke gift caskets, and our hand saddle-stitching craftsmanship. How may I serve you today?`;
  }

  if (!ai) {
    return res.json({ reply: defaultReply });
  }

  try {
    const productContext = currentProduct
      ? `The customer is currently examining: "${currentProduct.name}" (${currentProduct.category} - ${currentProduct.productType}). Price: ₹${Number(currentProduct.price).toLocaleString('en-IN')}. Leather: ${currentProduct.leatherType || 'Full-grain veg-tan'}. Hardware: ${currentProduct.hardware || 'Solid brass'}. Dimensions: ${currentProduct.dimensions || 'N/A'}. Features: ${(currentProduct.features || []).join(', ')}.`
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
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contextPrompt,
      config: { systemInstruction }
    });
    return res.json({ reply: response.text || defaultReply });
  } catch (err) {
    console.error('Error in concierge chat (server.js):', err);
    return res.json({ reply: defaultReply });
  }
});

// ==========================================
// 6. SERVE PRODUCTION CLIENT-SIDE SPA ROUTES
// ==========================================
app.get('*', (req, res, next) => {
  // Reject API routes with JSON 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found', path: req.path });
  }

  // Reject missing static files, modules, or assets with standard 404
  if (
    req.path.startsWith('/uploads') ||
    req.path.startsWith('/assets') ||
    req.path.startsWith('/src') ||
    /\.(js|mjs|tsx|ts|jsx|css|json|png|jpg|jpeg|svg|webp|ico|map|woff|woff2|ttf)$/i.test(req.path)
  ) {
    return res.status(404).type('text/plain').send(`404 Not Found: ${req.path}`);
  }

  const indexFile = findIndexHtml();
  if (indexFile) {
    return res.sendFile(indexFile);
  }
  return res.redirect('/');
});

// ==========================================
// 7. START SERVER
// ==========================================
async function main() {
  await initDatabase();
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on port ${port}`);
  });
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { dbService, initDatabase } from './src/server/db';
import { upload, listLocalFiles, deleteLocalFile, ensureUploadDir, UPLOAD_DIR } from './src/server/storage';
import { mailerService } from './src/server/mailer';
import { imapService } from './src/server/imap';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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
    }
  });
});

app.get('/api/db/status', async (_req: Request, res: Response) => {
  const status = await dbService.getStatus();
  res.json(status);
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

app.get('/api/mail/inbox', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 15;
    const result = await imapService.fetchRecentMessages(limit);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch IMAP inbox' });
  }
});

app.post('/api/mail/test-imap', async (_req: Request, res: Response) => {
  try {
    const result = await imapService.testConnection();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'IMAP test error' });
  }
});

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

app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const product = req.body;
    if (!product.id) {
      product.id = `blc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    }
    const saved = await dbService.saveProduct(product);
    res.json({ success: true, product: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save product' });
  }
});

app.put('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const product = { ...req.body, id };
    const saved = await dbService.saveProduct(product);
    res.json({ success: true, product: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req: Request, res: Response) => {
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

app.post('/api/categories', async (req: Request, res: Response) => {
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
app.get('/api/orders', async (_req: Request, res: Response) => {
  try {
    const orders = await dbService.getOrders();
    res.json(orders);
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

    res.json({ success: true, inquiry: saved });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to process inquiry' });
  }
});

// ==========================================
// 6. FILE & MEDIA STORAGE (HOST LOCAL DISK)
// ==========================================
app.post('/api/upload', (req: Request, res: Response) => {
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

app.get('/api/uploads', (_req: Request, res: Response) => {
  const files = listLocalFiles();
  res.json({
    success: true,
    count: files.length,
    storagePath: UPLOAD_DIR,
    files
  });
});

app.delete('/api/uploads/:filename', (req: Request, res: Response) => {
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

// AI Description & Luxury Story Generator
app.post('/api/gemini/generate-story', async (req: Request, res: Response) => {
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

// Customer Leather Care & Sizing Concierge Chat
app.post('/api/gemini/concierge-chat', async (req: Request, res: Response) => {
  const { message, currentProduct } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const lower = message.toLowerCase();
  let defaultReply = `Greetings from Bharatvarsh Leathercrafts Atelier. `;
  if (lower.includes('size') || lower.includes('belt') || lower.includes('waist') || lower.includes('fit')) {
    defaultReply += `For our full-grain leather belts, we recommend the **Golden Rule of Leather Sizing**: Order **2 inches larger** than your standard Indian trouser/jeans waist size. For example, if you wear a 34" trouser, select our 36" belt (90 cm). This positions the buckle tongue precisely in the elegant middle hole (hole 3 of 5), leaving room for tailored comfort.`;
  } else if (lower.includes('care') || lower.includes('clean') || lower.includes('water') || lower.includes('rain') || lower.includes('monsoon')) {
    defaultReply += `Vegetable-tanned full-grain leather is a living material. During high Indian humidity or monsoon dampness:
1. **Never use artificial heaters or hair dryers.** Pat gently with a dry cotton muslin cloth and let it dry naturally in an airy room.
2. Apply pure natural beeswax leather conditioner once every 3–4 months to nourish the animal fibers.
3. Store in the breathable cotton dustbag provided in your Bharatvarsh wooden casket.`;
  } else if (lower.includes('patina') || lower.includes('age') || lower.includes('color')) {
    defaultReply += `Full-grain vegetable-tanned leather does not wear out—it wears *in*. As oils from your hands and sunlight interact with the open pores, shades like Cognac and Saddle Tan will gradually deepen into a lustrous caramel-amber glaze, unique to your personal journey.`;
  } else if (lower.includes('gift') || lower.includes('corporate') || lower.includes('wedding')) {
    defaultReply += `For memorable gifting, our Oudh Heritage Bifold Wallet and Viceroy Bridle Belt can be debossed in 22k gold leaf with the recipient's initials. Each piece arrives enclosed in an archival rigid presentation casket with a handwritten certificate of authenticity.`;
  } else {
    defaultReply += `Our master artisans handcraft every piece from premium Indian vegetable-tanned hides using hand-beveled edges and solid brass hardware. Whether you need belt sizing guidance, leather conditioning protocols, or custom 22k gold monogramming advice, I am at your service.`;
  }

  if (!ai) {
    return res.json({ reply: defaultReply });
  }

  try {
    const productContext = currentProduct
      ? `The customer is currently examining: "${currentProduct.name}" (${currentProduct.category} - ${currentProduct.productType}). Price: ₹${currentProduct.price.toLocaleString('en-IN')}. Leather: ${currentProduct.leatherType || 'Full-grain veg-tan'}. Hardware: ${currentProduct.hardware || 'Solid brass'}. Dimensions: ${currentProduct.dimensions || 'N/A'}.`
      : `The customer is browsing the Bharatvarsh Leathercrafts luxury catalog.`;

    const systemInstruction = `You are the distinguished Master Leather Artisan & Private Client Concierge at "Bharatvarsh Leathercrafts LLP", an Indian luxury leather house known for heirloom vegetable-tanned belts, wallets, briefcases, and bespoke leather goods.
Your tone is courteous, knowledgeable, refined, and deeply appreciative of traditional leathercraft, Kanpur vegetable-tanning heritage, solid brass metallurgy, and Indian sartorial elegance.

Key Domain Knowledge to weave in naturally:
1. Belt Sizing: In India, trouser size is vanity-sized. The correct belt size is always +2 inches over trouser waist (e.g., 32" waist trousers -> 34" belt). The buckle should fasten in the middle hole (hole 3 of 5).
2. Leather Care in India: Indian climates range from monsoon humidity to dry heat. Recommend natural beeswax/carnauba balms, keeping away from direct air conditioner blasts or damp cupboards, avoiding synthetic silicones, and air-drying naturally on muslin if caught in rain.
3. Vegetable-Tanned Patina: Explain how full-grain leather absorbs ambient oils, forming a rich, personal amber/cognac patina over 6-12 months of use.
4. Monogramming & Gifting: Blind deboss for quiet understated luxury; 22K gold foil debossing for festive celebrations (Diwali, weddings, corporate milestones).

Keep your answers structured, polite, elegant, and under 150 words unless detailing a specific sizing guide or care step.`;

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
        port: PORT,
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bharatvarsh Leathercrafts server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

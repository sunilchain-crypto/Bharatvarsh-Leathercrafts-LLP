import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

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

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    brand: 'Bharatvarsh Leathercrafts LLP'
  });
});

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// Endpoint 1: Store Manager AI Description & Luxury Story Generator
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

// Endpoint 2: Customer Leather Care & Sizing Concierge Chat
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

// Configure Vite integration
async function startServer() {
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

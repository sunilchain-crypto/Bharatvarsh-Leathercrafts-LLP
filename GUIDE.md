# Bharatvarsh Leathercrafts LLP — Storefront & Operations Guide

A luxury e-commerce storefront crafted for **Bharatvarsh Leathercrafts LLP**, featuring bespoke full-grain vegetable-tanned leather goods, solid brass hardware, and hand saddle-stitching aesthetics.

---

## 1. Project Architecture

```
├── .env.example                     # Payment credentials template (Razorpay & Stripe)
├── index.html                       # Fonts (Cormorant Garamond + Plus Jakarta Sans) & SEO meta
├── public/
│   └── assets/aistudio/             # Official circular stitched leather logo
├── src/
│   ├── components/
│   │   ├── Header.tsx               # Top Bar Contract (Wordmark, Nav links, Bag counter)
│   │   ├── Hero.tsx                 # Atelier campaign focal point & quick category jumps
│   │   ├── CatalogSection.tsx       # Filterable collection grid (unlimited items & types)
│   │   ├── ProductCard.tsx          # Card with image, price in ₹, swatches, quick add
│   │   ├── ProductImage.tsx         # Resilient Zero-Broken-Image fallback container
│   │   ├── ProductDetailModal.tsx   # Gallery, swatches, bespoke monogramming, specs
│   │   ├── CartDrawer.tsx           # Slide-over bag with free shipping threshold bar
│   │   ├── CheckoutModal.tsx        # Multi-step checkout, GST calculation & order receipt
│   │   ├── AdminPanelModal.tsx      # In-browser Store Manager & Catalog CMS
│   │   ├── PaymentSettingsModal.tsx # Razorpay / Stripe gateway configuration modal
│   │   ├── SetupGuideModal.tsx      # Built-in owner setup guide
│   │   ├── BrandStory.tsx           # Vegetable tanning & saddle stitching narrative
│   │   └── Footer.tsx               # Indian LLP legal notice & store operational links
│   ├── data/
│   │   ├── initialCatalog.ts        # Seed catalog with Men, Women & Unisex categories
│   │   └── products.json            # Portable structured JSON data source
│   ├── services/
│   │   ├── catalogService.ts        # Persistent CRUD & JSON import/export service
│   │   └── paymentService.ts        # Isolated payment gateway integration layer
│   ├── types/
│   │   └── index.ts                 # TypeScript data contracts
│   ├── App.tsx                      # Root storefront controller
│   └── index.css                    # Tailwind CSS + bespoke leathercraft utility styles
```

---

## 2. Category Architecture

The storefront is structured according to the brand's specifications:

- **Men**:
  - `Leather Belts` (e.g., The Viceroy Full-Grain Bridle Belt, The Grandmaster Dress Belt)
  - `Wallets` (e.g., The Oudh Heritage Bifold Wallet, The Chhatrapati Minimalist Card Wallet)
- **Women**:
  - `Belts` (e.g., The Rani Cinch Waist Belt, The Malabar Skinny Trouser Belt)
  - `Wallets` (e.g., The Nilgiri Continental Zip Wallet, The Avani Compact Flap Wallet)
  - `Purses` (e.g., The Chandragiri Saddle Crossbody Purse, The Ganga Artisanal Day Clutch)
- **Unisex**:
  - `Backpacks` (e.g., The Himalaya Heritage Rucksack, The Deccan Commuter Leather Backpack)
  - `Briefcases` (e.g., The Sovereign English Bridle Briefcase, The Viceroy Slim Attaché Case)

---

## 3. How to Add, Edit & Remove Categories & Products

### Option A: Using the Built-In Store Admin CMS (No Code Required)
1. Click **"Store Admin"** in the top navigation bar or the footer.
2. In the **"Products"** tab, click **"Add New Product"**.
3. Fill in:
   - **Top Category**: Men, Women, or Unisex.
   - **Product Type**: Select an existing type (e.g., `Leather Belts`, `Wallets`, `Purses`) or type a new one.
   - **Pricing**: Price in INR (₹) and optional original price.
   - **Image URL**: Enter any image URL (or leave blank to display the signature debossed leather fallback).
   - **Details & Specs**: Leather hide type, hardware, dimensions, color swatches, and features.
4. Click **"Create & Publish Product"**. The catalog updates immediately and persists in `localStorage`.

### Option B: Adding New Product Types & Categories
- Go to the **"Category Architecture"** tab in Store Admin.
- Enter a category and type name (e.g., `Men` -> `Cardholders`, `Unisex` -> `Duffel Bags`) and click **"Add Type"**.

### Option C: Directly via Structured JSON
- In the Admin Panel, navigate to **"JSON Source Code"**, copy the JSON, or edit `src/data/initialCatalog.ts` / `src/data/products.json` directly.

---

## 4. Enabling Live Payments (Razorpay & Stripe)

Payment logic is completely isolated inside `src/services/paymentService.ts`.

### Step 1: Copy `.env.example` to `.env`
```bash
cp .env.example .env
```

### Step 2: Configure Your API Keys
Open `.env` and add your public credentials:
```env
# For Indian Domestic Payments (UPI / RuPay / NetBanking / Cards):
VITE_RAZORPAY_KEY_ID="rzp_live_your_actual_key_here"

# For Global Cards & International Checkout:
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_your_actual_key_here"
```

### Test Mode vs Production
- When the keys are empty or set to test placeholders, the checkout automatically operates in **Sandbox Test Mode**, permitting full order simulation, address verification, and invoice printing without real charges.
- Once valid keys are added, live payment authorization modal (Razorpay Standard Checkout / Stripe Elements) activates automatically.

---

## 5. Indian LLP Compliance & Invoicing

- Invoices automatically calculate the **18% GST** (HSN Code 4202 for leather articles).
- B2B customers can optionally enter their **GSTIN** during checkout to receive tax input credit invoices.
- Registered LLP legal details are reflected in the footer and order receipts.

---

## 6. Corporate Gifting & Bulk Order B2B Suite

Accessed via the **"Corporate"** link in the main navigation or footer.

### Features
1. **Curated Ensembles**: Showcase sets for executive retreats, partner appreciation, and milestone celebrations.
2. **Volume Concession Tiers**:
   - `10–24 pcs`: 5% Volume Discount (reduced by 10% from 15%)
   - `25–49 pcs`: 10% Volume Discount (reduced by 10% from 20%)
   - `50–99 pcs`: 15% Volume Discount + Complimentary Custom CNC Brass Die Plate (reduced by 10% from 25%)
   - `100+ pcs`: 20% Volume Discount + Complimentary Custom CNC Brass Die Plate & Priority Logistics (reduced by 10% from 30%)
3. **Custom Crest Stamping**: Live simulator supporting *Deep Blind Deboss*, *22k Gold Foil Stamping*, and *Palladium Silver Foil*.
4. **Presentation Packaging**:
   - Standard Unbleached Cotton Dust Bag (Complimentary)
   - Executive Rigid Matte Espresso Gift Box with Wax Seal (+₹280/pc)
   - The Atelier Heritage Hamper with Conditioning Balm (+₹650/pc)
5. **Instant B2B Proforma GST Quotation**:
   - Computes Taxable Value, 18% Integrated GST (HSN 4202), and highlights the buyer's **Input Tax Credit (ITC)** eligible amount.
   - Includes full formal printable PDF proforma with LLP credentials, banking NEFT/RTGS wire settlement instructions, and authorized signatory blocks.


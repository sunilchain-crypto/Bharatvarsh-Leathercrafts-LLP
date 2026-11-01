import React, { useState, useMemo } from 'react';
import { Product, CorporateQuoteRequest, CorporatePackagingType, DebossingFinish } from '../types';
import { corporateService, PACKAGING_OPTIONS, DEBOSSING_FINISHES } from '../services/corporateService';
import { ProductImage } from './ProductImage';
import {
  Building2,
  Sparkles,
  ShieldCheck,
  Check,
  Printer,
  Download,
  ArrowRight,
  PackageCheck,
  Award,
  Layers,
  FileText,
  BadgePercent,
  CheckCircle2,
  Clock,
  PhoneCall,
  Info
} from 'lucide-react';

interface CorporateGiftingViewProps {
  products: Product[];
  onBackToStore: () => void;
  onOpenAccount: () => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi NCR'
];

export const CorporateGiftingView: React.FC<CorporateGiftingViewProps> = ({
  products,
  onBackToStore,
  onOpenAccount
}) => {
  // Select initial product (default: Viceroy Bridle Belt or Oudh Wallet)
  const defaultProduct = products.find((p) => p.id === 'blc-m-wallet-01') || products[0];
  const [selectedProductId, setSelectedProductId] = useState<string>(defaultProduct.id);
  const selectedProduct = products.find((p) => p.id === selectedProductId) || defaultProduct;

  const [quantity, setQuantity] = useState<number>(25);
  const [packaging, setPackaging] = useState<CorporatePackagingType>('rigid_executive_box');
  const [debossingFinish, setDebossingFinish] = useState<DebossingFinish>('gold_foil_22k');
  const [customLogoCrestText, setCustomLogoCrestText] = useState<string>('ACME CORP');

  // Company details
  const [companyName, setCompanyName] = useState('Acme Global Enterprises Pvt Ltd');
  const [gstin, setGstin] = useState('27AABCA1234F1Z9');
  const [contactPerson, setContactPerson] = useState('Sunil Chainani');
  const [email, setEmail] = useState('sunilchain@gmail.com');
  const [phone, setPhone] = useState('+91 98201 23456');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [pincode, setPincode] = useState('400001');
  const [notes, setNotes] = useState('Required for Annual Leadership Summit.');

  // Modal for viewing printable formal quote
  const [showProformaModal, setShowProformaModal] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<CorporateQuoteRequest | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Compute live quote
  const liveQuote: CorporateQuoteRequest = useMemo(() => {
    return corporateService.calculateQuote(
      selectedProduct,
      quantity,
      packaging,
      debossingFinish,
      {
        companyName: companyName || 'Client Organization',
        gstin: gstin || '27AABCA0000A1Z5',
        contactPerson: contactPerson || 'Corporate Officer',
        email: email || 'procurement@company.com',
        phone: phone || '+91 98201 23456',
        city: city || 'Mumbai',
        state: state || 'Maharashtra',
        pincode: pincode || '400001'
      },
      customLogoCrestText,
      notes
    );
  }, [
    selectedProduct,
    quantity,
    packaging,
    debossingFinish,
    companyName,
    gstin,
    contactPerson,
    email,
    phone,
    city,
    state,
    pincode,
    customLogoCrestText,
    notes
  ]);

  const handleSubmitQuoteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    corporateService.saveQuote(liveQuote);
    setSubmittedQuote(liveQuote);
    setSubmittedSuccess(true);

    // Save to MySQL inquiries and send notification via SMTP to support@bharatvarshcrafts.com
    fetch('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'Corporate B2B Quote',
        name: contactPerson,
        email,
        phone,
        subject: `Corporate Quote Request: ${companyName} (${quantity}x ${selectedProduct.name})`,
        message: `Quote #${liveQuote.quoteNumber} requested for ${quantity} units of ${selectedProduct.name} by ${contactPerson} (${companyName}, GSTIN: ${gstin}). Grand Total: ₹${liveQuote.grandTotal.toLocaleString('en-IN')}. Timeline: ${liveQuote.deliveryTimelineWeeks}.`,
        details: liveQuote
      })
    }).catch((err) => console.warn('[Corporate Inquiry Notice]:', err.message));
  };

  const currentTier = corporateService.getDiscountTier(quantity);

  return (
    <div className="bg-[#FAF7F2] min-h-screen text-[#24140D]">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#24140D] via-[#2F1910] to-[#24140D] text-[#FAF7F2] py-16 sm:py-24 border-b border-[#C29B38]/30">
        {/* Subtle saddle stitch pattern overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#D4B37A 1px, transparent 1px)`,
            backgroundSize: '16px 16px'
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#C29B38] font-semibold">
            <Building2 className="w-4 h-4" />
            <span>Corporate Gifting & Institutional Bespoke Services</span>
            <span aria-hidden="true" className="text-[#FAF7F2]/30">·</span>
            <span>Bharatvarsh Leathercrafts LLP</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-[#FAF7F2] max-w-4xl [text-wrap:balance]">
            Distinguished leather heirlooms for boardroom leaders & esteemed patrons.
          </h1>

          <p className="text-sm sm:text-base text-[#EFE9DF]/80 max-w-3xl leading-relaxed">
            Elevate executive milestones, partner appreciation, and annual summits with vegetable-tanned leather goods hand-embossed with your organization’s crest. Enjoy structured volume concessions, luxury wax-sealed presentation packaging, and instant GST invoice quotations for 100% input tax credit offset.
          </p>

          <div className="pt-4 flex flex-wrap gap-4 text-xs text-[#FAF7F2]/90">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-[#C29B38]/30">
              <BadgePercent className="w-4 h-4 text-[#C29B38]" />
              <span>Volume Concessions up to 20%</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-[#C29B38]/30">
              <Award className="w-4 h-4 text-[#C29B38]" />
              <span>Complimentary CNC Brass Die Plate on 50+ Units</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 border border-[#C29B38]/30">
              <FileText className="w-4 h-4 text-[#C29B38]" />
              <span>18% GST Compliant HSN 4202 Invoicing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Suite Configurator & Quotation Workspace */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Curated Suites Grid */}
        <div className="mb-16 space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs uppercase tracking-widest text-[#783A1D] font-semibold">
              Signature Ensembles
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#24140D]">
              Curated Executive Gifting Themes
            </h2>
            <p className="text-xs text-[#24140D]/70">
              Tailored for distinguished partner gifting, board offsites, and milestone celebrations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Suite 1 */}
            <div className="p-6 rounded-2xl bg-white border border-[#24140D]/10 hover:border-[#783A1D]/40 transition-all shadow-xs space-y-4">
              <div className="aspect-[16/10] rounded-xl overflow-hidden bg-[#EFE9DF] border border-[#24140D]/10">
                <ProductImage
                  src={products.find((p) => p.id === 'blc-m-wallet-01')?.images[0]}
                  alt="The Boardroom Heritage Suite"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#783A1D] font-semibold font-mono">
                  Suite 01 · Executive Essential
                </span>
                <h3 className="font-serif text-xl font-bold text-[#24140D]">
                  The Boardroom Heritage Suite
                </h3>
                <p className="text-xs text-[#24140D]/70 leading-relaxed">
                  The Oudh Bifold Wallet hand saddle-stitched in Tuscan vachetta, paired with custom gold-foil company crest and executive rigid box.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-[#24140D]/10 text-xs">
                <span className="text-[#24140D]/60">Starting from</span>
                <span className="font-serif text-base font-bold text-[#783A1D] font-mono tabular-nums">
                  ₹2,763 / unit <span className="text-[10px] font-sans font-normal text-[#24140D]/50">(on 50+ pcs)</span>
                </span>
              </div>
            </div>

            {/* Suite 2 */}
            <div className="p-6 rounded-2xl bg-white border border-[#24140D]/10 hover:border-[#783A1D]/40 transition-all shadow-xs space-y-4">
              <div className="aspect-[16/10] rounded-xl overflow-hidden bg-[#EFE9DF] border border-[#24140D]/10">
                <ProductImage
                  src={products.find((p) => p.id === 'blc-m-belt-01')?.images[0]}
                  alt="The Viceroy Leadership Ensemble"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#783A1D] font-semibold font-mono">
                  Suite 02 · Leadership Ensemble
                </span>
                <h3 className="font-serif text-xl font-bold text-[#24140D]">
                  The Viceroy Bridle Belt & Valet
                </h3>
                <p className="text-xs text-[#24140D]/70 leading-relaxed">
                  38mm English bridle cowhide belt with solid cast brass buckle, hand-burnished edges, and debossed inner monogram.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-[#24140D]/10 text-xs">
                <span className="text-[#24140D]/60">Starting from</span>
                <span className="font-serif text-base font-bold text-[#783A1D] font-mono tabular-nums">
                  ₹3,273 / unit <span className="text-[10px] font-sans font-normal text-[#24140D]/50">(on 50+ pcs)</span>
                </span>
              </div>
            </div>

            {/* Suite 3 */}
            <div className="p-6 rounded-2xl bg-white border border-[#24140D]/10 hover:border-[#783A1D]/40 transition-all shadow-xs space-y-4">
              <div className="aspect-[16/10] rounded-xl overflow-hidden bg-[#EFE9DF] border border-[#24140D]/10">
                <ProductImage
                  src={products.find((p) => p.id === 'blc-u-brief-01')?.images[0]}
                  alt="The Sovereign Chairman Hamper"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-[#783A1D] font-semibold font-mono">
                  Suite 03 · Founder Milestone
                </span>
                <h3 className="font-serif text-xl font-bold text-[#24140D]">
                  The Sovereign Attaché Hamper
                </h3>
                <p className="text-xs text-[#24140D]/70 leading-relaxed">
                  Heirloom English bridle legal briefcase with solid brass working key lock, housed in the collector wooden-frame gift hamper.
                </p>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-[#24140D]/10 text-xs">
                <span className="text-[#24140D]/60">Starting from</span>
                <span className="font-serif text-base font-bold text-[#783A1D] font-mono tabular-nums">
                  ₹20,250 / unit <span className="text-[10px] font-sans font-normal text-[#24140D]/50">(on 25+ pcs)</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Interactive Quotation Configurator */}
        <div className="space-y-8">
          <div className="border-b border-[#24140D]/10 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#783A1D] font-semibold">
                Bespoke B2B Calculator
              </span>
              <h2 className="font-serif text-3xl font-bold text-[#24140D]">
                Configure Order & Generate Instant GST Quotation
              </h2>
            </div>
            <div className="text-xs text-[#24140D]/60">
              Direct workshop fulfillment · All prices in INR (₹)
            </div>
          </div>

          <form onSubmit={handleSubmitQuoteRequest} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left 7 Columns: Product Selection, Quantity, Branding, Packaging & Company Info */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Step 1: Product & Quantity */}
              <div className="p-6 rounded-2xl bg-white border border-[#24140D]/10 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#24140D]/10 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#24140D] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#783A1D] text-[#FAF7F2] text-[11px] flex items-center justify-center">1</span>
                    <span>Select Product & Volume Tier</span>
                  </h3>
                  <span className="text-xs font-semibold text-[#783A1D] font-mono">
                    {currentTier.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#24140D] mb-1">
                      Choose Leathercraft Piece
                    </label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      aria-label="Select product for corporate gifting"
                      className="w-full px-3 py-2.5 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg text-xs font-medium focus:outline-none focus:border-[#783A1D] cursor-pointer"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category} · {p.productType}) — Standard Retail ₹{p.price.toLocaleString('en-IN')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">
                      Quantity (Minimum 10 units)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={1000}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(10, Number(e.target.value)))}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg text-xs font-bold font-mono focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  {/* Volume Tier Quick Buttons */}
                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">
                      Quick Tiers
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[15, 25, 50, 100].map((q) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setQuantity(q)}
                          className={`py-2 px-1 text-center rounded text-xs font-mono font-semibold cursor-pointer transition-colors ${
                            quantity === q
                              ? 'bg-[#24140D] text-[#FAF7F2]'
                              : 'bg-[#EFE9DF] text-[#24140D]/80 hover:bg-[#E5DDD0]'
                          }`}
                        >
                          {q} pcs
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Volume discount progression strip */}
                <div className="p-3 bg-[#FAF7F2] rounded-xl border border-[#24140D]/10 text-xs space-y-1.5">
                  <div className="flex justify-between font-medium text-[#24140D]">
                    <span>Volume Discount Structure:</span>
                    <span className="text-[#783A1D] font-bold">Current: {currentTier.percent}% Concession</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[10px] text-center">
                    <div className={`p-1.5 rounded ${quantity >= 10 && quantity < 25 ? 'bg-[#783A1D] text-white font-bold' : 'bg-white text-[#24140D]/70'}`}>
                      10–24 pcs: 5%
                    </div>
                    <div className={`p-1.5 rounded ${quantity >= 25 && quantity < 50 ? 'bg-[#783A1D] text-white font-bold' : 'bg-white text-[#24140D]/70'}`}>
                      25–49 pcs: 10%
                    </div>
                    <div className={`p-1.5 rounded ${quantity >= 50 && quantity < 100 ? 'bg-[#783A1D] text-white font-bold' : 'bg-white text-[#24140D]/70'}`}>
                      50–99 pcs: 15% + Free Die
                    </div>
                    <div className={`p-1.5 rounded ${quantity >= 100 ? 'bg-[#783A1D] text-white font-bold' : 'bg-white text-[#24140D]/70'}`}>
                      100+ pcs: 20% + Free Die
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Custom Debossing & Brand Stamping */}
              <div className="p-6 rounded-2xl bg-white border border-[#24140D]/10 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#24140D]/10 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#24140D] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#783A1D] text-[#FAF7F2] text-[11px] flex items-center justify-center">2</span>
                    <span>Custom Crest Debossing & Branding</span>
                  </h3>
                  <span className="text-xs text-[#783A1D] font-medium">
                    {currentTier.freeDiePlate ? 'Die Plate: ₹0 (Complimentary)' : 'Die Plate: ₹1,800'}
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">
                      Organization Crest / Monogram Wordmark
                    </label>
                    <input
                      type="text"
                      required
                      value={customLogoCrestText}
                      onChange={(e) => setCustomLogoCrestText(e.target.value)}
                      placeholder="e.g. ACME CORP, TATA MOTORS, OR INITIALS"
                      className="w-full px-3 py-2 bg-[#FAF7F2] uppercase font-mono tracking-widest border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                    <p className="text-[10px] text-[#24140D]/60 mt-1">
                      Vector artwork (.AI / .SVG / .PDF) can be submitted upon quotation approval for precise crest CNC milling.
                    </p>
                  </div>

                  {/* Debossing Finish Selector */}
                  <div className="space-y-2">
                    <label className="block font-semibold text-[#24140D]">
                      Stamping Finish
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {DEBOSSING_FINISHES.map((fin) => (
                        <label
                          key={fin.id}
                          className={`p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                            debossingFinish === fin.id
                              ? 'border-[#783A1D] bg-[#EFE9DF]/80 shadow-xs'
                              : 'border-[#24140D]/15 bg-white hover:bg-[#FAF7F2]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-bold text-xs text-[#24140D]">{fin.name}</span>
                            <input
                              type="radio"
                              name="debossingFinish"
                              checked={debossingFinish === fin.id}
                              onChange={() => setDebossingFinish(fin.id)}
                              className="accent-[#783A1D]"
                            />
                          </div>
                          <p className="text-[10px] text-[#24140D]/65 leading-tight">{fin.description}</p>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Visual Deboss Simulator Preview Card */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#3D2013] to-[#1E100A] text-[#FAF7F2] border border-[#C29B38]/30 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-widest text-[#C29B38] font-mono block">
                        Live Stamping Preview
                      </span>
                      <div className={`mt-1 font-serif text-lg font-bold tracking-widest uppercase ${
                        debossingFinish === 'gold_foil_22k'
                          ? 'text-[#E5C170] drop-shadow'
                          : debossingFinish === 'silver_palladium'
                          ? 'text-slate-200 drop-shadow'
                          : 'text-[#201109] drop-shadow-[0_1px_1px_rgba(255,255,255,0.2)]'
                      }`}>
                        {customLogoCrestText || 'YOUR CREST HERE'}
                      </div>
                      <span className="text-[9px] text-[#FAF7F2]/60 mt-0.5 block">
                        Hand-pressed into 100% full-grain hide
                      </span>
                    </div>

                    <div className="w-12 h-12 rounded-full border border-[#C29B38]/40 flex items-center justify-center p-1 bg-white/5">
                      <img
                        src="/assets/aistudio/Circular_with_Stitch_and_ring_Bharatvarsh_2405b0e7.png"
                        alt="Emblem"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Luxury Presentation Packaging */}
              <div className="p-6 rounded-2xl bg-white border border-[#24140D]/10 space-y-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-[#24140D]/10 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#24140D] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#783A1D] text-[#FAF7F2] text-[11px] flex items-center justify-center">3</span>
                    <span>Presentation Packaging Options</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {PACKAGING_OPTIONS.map((pkg) => (
                    <label
                      key={pkg.id}
                      className={`p-3.5 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                        packaging === pkg.id
                          ? 'border-[#783A1D] bg-[#EFE9DF]/80 shadow-xs'
                          : 'border-[#24140D]/15 bg-white hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="packaging"
                          checked={packaging === pkg.id}
                          onChange={() => setPackaging(pkg.id)}
                          className="accent-[#783A1D] mt-1"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#24140D]">{pkg.name}</span>
                            <span className="text-[10px] bg-[#783A1D]/15 text-[#783A1D] font-medium px-2 py-0.5 rounded">
                              {pkg.highlight}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#24140D]/70 mt-0.5">{pkg.description}</p>
                        </div>
                      </div>

                      <span className="font-mono font-bold text-xs text-[#24140D] shrink-0">
                        {pkg.costPerUnit === 0 ? 'Complimentary' : `+₹${pkg.costPerUnit}/pc`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 4: Company Credentials for B2B GST Invoicing */}
              <div className="p-6 rounded-2xl bg-white border border-[#24140D]/10 space-y-4 shadow-xs text-xs">
                <div className="border-b border-[#24140D]/10 pb-3">
                  <h3 className="font-serif text-lg font-bold text-[#24140D] flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#783A1D] text-[#FAF7F2] text-[11px] flex items-center justify-center">4</span>
                    <span>Institutional GSTIN & Dispatch Credentials</span>
                  </h3>
                  <p className="text-[11px] text-[#24140D]/60 mt-0.5">
                    Required to generate official GST Proforma Quotations with Input Tax Credit (ITC) compliance.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#24140D] mb-1">
                      Registered Legal Entity / Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Tata Consultancy Services Ltd"
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">
                      GSTIN (15-character Indian B2B Tax ID) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={15}
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value.toUpperCase())}
                      placeholder="27AABCA1234F1Z9"
                      className="w-full px-3 py-2 bg-[#FAF7F2] uppercase font-mono font-semibold border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">
                      Contact Person & Designation *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="Sunil Chainani, Managing Director"
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">
                      Official Email (for Formal PDF Quote) *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="procurement@company.com"
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">
                      Direct Mobile / Telephone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98201 23456"
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#24140D] mb-1">State *</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-semibold text-[#24140D] mb-1">
                      Event Date / Special Instructions
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Annual Summit on Dec 15th; individual employee names on cardholders."
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Right 5 Columns: Live GST Quotation Summary & Proforma Actions */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="p-6 rounded-2xl bg-white border border-[#24140D]/15 space-y-5 shadow-md text-xs">
                
                <div className="border-b border-[#24140D]/10 pb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-[#783A1D] font-mono font-semibold">
                      Live Proforma Calculation
                    </span>
                    <span className="font-mono text-[11px] text-[#24140D]/60">{liveQuote.quoteNumber}</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-[#24140D] mt-1">
                    GST Quotation Summary
                  </h3>
                  <p className="text-[11px] text-[#24140D]/70 mt-0.5">
                    Prepared for: <strong>{companyName || 'Valued Corporate Partner'}</strong>
                  </p>
                </div>

                {/* Selected Item Breakdown */}
                <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#24140D]/10 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-[#24140D]">
                        {selectedProduct.name}
                      </h4>
                      <p className="text-[11px] text-[#24140D]/60">
                        Qty: <strong className="font-mono">{quantity} units</strong> · {debossingFinish.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-[#24140D]/40 line-through font-mono block">
                        ₹{selectedProduct.price.toLocaleString('en-IN')}
                      </span>
                      <span className="font-mono font-bold text-xs text-[#783A1D]">
                        ₹{liveQuote.discountedUnitPrice.toLocaleString('en-IN')}/pc
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mathematical Line Items */}
                <div className="space-y-2 text-[#24140D]/80">
                  <div className="flex justify-between">
                    <span>Base Goods ({quantity} × ₹{liveQuote.discountedUnitPrice.toLocaleString('en-IN')})</span>
                    <span className="font-mono tabular-nums">
                      ₹{(quantity * liveQuote.discountedUnitPrice).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Volume Discount Savings ({liveQuote.discountPercentage}%)</span>
                    <span className="font-mono tabular-nums">
                      -₹{(quantity * (selectedProduct.price - liveQuote.discountedUnitPrice)).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Presentation Packaging ({PACKAGING_OPTIONS.find((p) => p.id === packaging)?.name})</span>
                    <span className="font-mono tabular-nums">
                      {liveQuote.packagingUnitFee === 0
                        ? <span className="text-emerald-700">Complimentary</span>
                        : `₹${(liveQuote.packagingUnitFee * quantity).toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>Custom CNC Brass Die Plate</span>
                    <span className="font-mono tabular-nums">
                      {liveQuote.diePlateFee === 0
                        ? <span className="text-emerald-700">Complimentary (50+ pcs)</span>
                        : `₹${liveQuote.diePlateFee.toLocaleString('en-IN')}`}
                    </span>
                  </div>

                  {/* Taxable Subtotal */}
                  <div className="pt-2 border-t border-[#24140D]/10 flex justify-between font-semibold text-[#24140D]">
                    <span>Taxable B2B Value</span>
                    <span className="font-mono tabular-nums">
                      ₹{liveQuote.taxableSubtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* 18% GST */}
                  <div className="flex justify-between text-xs text-[#783A1D]">
                    <span>Integrated GST @ 18% (HSN 4202)</span>
                    <span className="font-mono font-bold tabular-nums">
                      ₹{liveQuote.gstAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Grand Total */}
                  <div className="pt-3 border-t-2 border-[#24140D]/15 flex justify-between font-serif text-2xl font-bold text-[#24140D]">
                    <span>Total Payable</span>
                    <span className="font-mono tabular-nums">
                      ₹{liveQuote.grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Highlight GST Input Tax Credit Benefit */}
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>Eligible GST Input Tax Credit: ₹{liveQuote.inputTaxCreditValue.toLocaleString('en-IN')}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-snug">
                    Your company can fully offset this 18% GST amount against output tax liabilities on your monthly GSTR-3B filings.
                    <strong> Net Corporate Outlay: ₹{liveQuote.taxableSubtotal.toLocaleString('en-IN')}</strong>
                  </p>
                </div>

                {/* Timeline */}
                <div className="flex items-center gap-2 text-[11px] text-[#24140D]/70 pt-1">
                  <Clock className="w-4 h-4 text-[#783A1D] shrink-0" />
                  <span>Bench Crafting & Inspection: <strong>{liveQuote.deliveryTimelineWeeks}</strong></span>
                </div>

                {/* Actions */}
                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowProformaModal(true)}
                    className="w-full py-3 px-4 rounded-xl border border-[#24140D] bg-white hover:bg-[#FAF7F2] text-[#24140D] text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4 text-[#783A1D]" />
                    <span>View & Print Official Proforma PDF</span>
                  </button>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <span>Submit Formal Order Request</span>
                    <ArrowRight className="w-4 h-4 text-[#C29B38]" />
                  </button>
                </div>

                {submittedSuccess && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-700" />
                      Order Request Recorded!
                    </p>
                    <p className="text-[11px] text-emerald-800">
                      Our Head of Institutional Relations will reach out to <strong>{email}</strong> within 4 business hours with physical leather swatch samples.
                    </p>
                  </div>
                )}

                <div className="pt-2 border-t border-[#24140D]/10 text-center">
                  <button
                    type="button"
                    onClick={onBackToStore}
                    className="text-xs text-[#783A1D] hover:underline cursor-pointer"
                  >
                    ← Return to Retail Storefront
                  </button>
                </div>

              </div>
            </div>

          </form>
        </div>

      </section>

      {/* Official B2B Proforma Quotation Modal */}
      {showProformaModal && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#24140D]/15 max-h-[92vh] flex flex-col text-xs text-[#24140D]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#24140D]/10 flex items-center justify-between bg-[#FAF7F2]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#783A1D]" />
                <span className="font-serif text-base font-bold text-[#24140D]">
                  Official B2B Proforma Quotation — {liveQuote.quoteNumber}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-[#24140D] text-[#FAF7F2] rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-[#3D2013]"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C29B38]" />
                  <span>Print Proforma</span>
                </button>
                <button
                  onClick={() => setShowProformaModal(false)}
                  className="p-1.5 text-[#24140D]/60 hover:text-[#24140D] rounded-lg hover:bg-[#EFE9DF]"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Proforma Sheet */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-white">
              
              {/* Header Lockup */}
              <div className="flex items-start justify-between border-b-2 border-[#24140D] pb-6">
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/aistudio/Circular_with_Stitch_and_ring_Bharatvarsh_2405b0e7.png"
                    alt="BLC Logo"
                    className="w-14 h-14 rounded-full object-contain"
                  />
                  <div>
                    <h3 className="font-serif text-2xl font-bold tracking-tight">Bharatvarsh Leathercrafts LLP</h3>
                    <p className="text-[11px] text-[#783A1D] uppercase tracking-widest font-semibold">
                      Artisanal Leather Manufacturers & Institutional Ateliers
                    </p>
                    <p className="text-[10px] text-[#24140D]/60 mt-0.5">
                      LLPIN: AAY-8419 · GSTIN: 27AABCB8419L1Z8 · HSN Chapter 4202
                    </p>
                    <p className="text-[10px] text-[#24140D]/60">
                      Craft Quarter, Leather Complex, Maharashtra, India
                    </p>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="font-serif text-xl font-bold text-[#783A1D]">PROFORMA QUOTATION</div>
                  <div className="font-mono font-bold">{liveQuote.quoteNumber}</div>
                  <div className="text-[10px] text-[#24140D]/70">
                    Date: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="text-[10px] text-[#24140D]/70">
                    Valid for: 30 Calendar Days
                  </div>
                </div>
              </div>

              {/* Billed To / Shipped To Grid */}
              <div className="grid grid-cols-2 gap-6 p-4 rounded-xl bg-[#FAF7F2] border border-[#24140D]/10">
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#783A1D] block">
                    Institutional Client Details:
                  </span>
                  <p className="font-bold text-sm mt-0.5">{liveQuote.companyName}</p>
                  <p className="font-mono text-[11px] text-[#783A1D] font-bold">GSTIN: {liveQuote.gstin}</p>
                  <p className="mt-1">Attn: {liveQuote.contactPerson}</p>
                  <p>{liveQuote.email} · {liveQuote.phone}</p>
                  <p>{liveQuote.city}, {liveQuote.state} - {liveQuote.pincode}</p>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#783A1D] block">
                    Institutional Terms:
                  </span>
                  <p>Payment Terms: <strong>50% Advance with PO, 50% on Dispatch</strong></p>
                  <p>Lead Time: <strong>{liveQuote.deliveryTimelineWeeks}</strong></p>
                  <p>Transit: <strong>Insured BlueDart Priority Logistics (Included)</strong></p>
                  <p>Custom Branding: <strong>{liveQuote.debossingFinish.replace('_', ' ')} [{liveQuote.customLogoCrestText}]</strong></p>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left">
                <thead className="border-b-2 border-[#24140D]/20 text-[10px] uppercase tracking-wider text-[#24140D]/70 font-semibold">
                  <tr>
                    <th className="py-2.5">Item Description & Specifications</th>
                    <th className="py-2.5">HSN</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Standard Rate</th>
                    <th className="py-2.5 text-right">Concession Unit Rate</th>
                    <th className="py-2.5 text-right">Taxable Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#24140D]/10">
                  <tr>
                    <td className="py-3">
                      <div className="font-bold text-xs">{liveQuote.productName}</div>
                      <div className="text-[10px] text-[#24140D]/60">
                        Handcrafted full-grain vegetable-tanned leather · Custom crest debossing included
                      </div>
                    </td>
                    <td className="py-3 font-mono text-[11px]">4202</td>
                    <td className="py-3 text-center font-mono font-bold">{liveQuote.quantity}</td>
                    <td className="py-3 text-right font-mono tabular-nums text-[#24140D]/50 line-through">
                      ₹{liveQuote.baseUnitPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-right font-mono font-bold tabular-nums">
                      ₹{liveQuote.discountedUnitPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 text-right font-mono font-bold tabular-nums">
                      ₹{(liveQuote.quantity * liveQuote.discountedUnitPrice).toLocaleString('en-IN')}
                    </td>
                  </tr>

                  {liveQuote.packagingUnitFee > 0 && (
                    <tr>
                      <td className="py-3" colSpan={2}>
                        <div className="font-semibold text-xs">
                          {PACKAGING_OPTIONS.find((p) => p.id === liveQuote.packaging)?.name}
                        </div>
                        <div className="text-[10px] text-[#24140D]/60">
                          Rigid gift presentation packaging with wax seal
                        </div>
                      </td>
                      <td className="py-3 text-center font-mono font-bold">{liveQuote.quantity}</td>
                      <td className="py-3 text-right font-mono tabular-nums">—</td>
                      <td className="py-3 text-right font-mono font-bold tabular-nums">
                        ₹{liveQuote.packagingUnitFee.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 text-right font-mono font-bold tabular-nums">
                        ₹{(liveQuote.packagingUnitFee * liveQuote.quantity).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}

                  <tr>
                    <td className="py-3" colSpan={2}>
                      <div className="font-semibold text-xs">
                        Custom CNC Precision Brass Stamping Die Plate
                      </div>
                      <div className="text-[10px] text-[#24140D]/60">
                        Custom machined brass die plate for organization crest [{liveQuote.customLogoCrestText}]
                      </div>
                    </td>
                    <td className="py-3 text-center font-mono">1</td>
                    <td className="py-3 text-right font-mono tabular-nums">₹1,800</td>
                    <td className="py-3 text-right font-mono font-bold tabular-nums">
                      {liveQuote.diePlateFee === 0 ? 'Complimentary' : `₹${liveQuote.diePlateFee.toLocaleString('en-IN')}`}
                    </td>
                    <td className="py-3 text-right font-mono font-bold tabular-nums">
                      ₹{liveQuote.diePlateFee.toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Calculation Summary */}
              <div className="border-t-2 border-[#24140D]/20 pt-3 space-y-1.5 text-right">
                <div className="flex justify-between">
                  <span>Gross Taxable Amount</span>
                  <span className="font-mono font-semibold tabular-nums">
                    ₹{liveQuote.taxableSubtotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-[#783A1D] font-medium">
                  <span>Integrated GST (IGST) @ 18%</span>
                  <span className="font-mono tabular-nums">
                    ₹{liveQuote.gstAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between font-serif text-lg font-bold border-t border-[#24140D]/15 pt-2">
                  <span>Total Proforma Invoice Value (INR)</span>
                  <span className="font-mono tabular-nums">
                    ₹{liveQuote.grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-800 text-[11px] font-semibold pt-1">
                  <span>Input Tax Credit (ITC) Available to Buyer:</span>
                  <span className="font-mono tabular-nums">
                    ₹{liveQuote.inputTaxCreditValue.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Settlement Banking Details */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#24140D]/10 grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <span className="font-bold text-[#783A1D] block">NEFT / RTGS Wire Settlement:</span>
                  <p>Beneficiary: <strong>Bharatvarsh Leathercrafts LLP</strong></p>
                  <p>Bank: HDFC Bank Ltd, Mumbai Main Branch</p>
                  <p>Account No: <strong>50200084192418</strong> (Current A/C)</p>
                  <p>IFSC Code: <strong>HDFC0000060</strong></p>
                </div>
                <div className="text-right flex flex-col justify-end">
                  <div className="font-serif font-bold text-sm">For Bharatvarsh Leathercrafts LLP</div>
                  <div className="text-[10px] text-[#24140D]/60 mt-4">Authorized Atelier Signatory</div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

import { CorporateQuoteRequest, CorporatePackagingType, DebossingFinish, Product } from '../types';

const STORAGE_KEY_CORP_QUOTES = 'blc_corporate_quotes_v1';

export const PACKAGING_OPTIONS = [
  {
    id: 'standard_dustbag' as CorporatePackagingType,
    name: 'Artisan Cotton Dust Bag',
    costPerUnit: 0,
    description: 'Handcrafted unbleached organic cotton dust bag with genuine stitched leather tag and pull drawstrings.',
    highlight: 'Complimentary with all bulk orders'
  },
  {
    id: 'rigid_executive_box' as CorporatePackagingType,
    name: 'Executive Rigid Gift Box with Wax Seal',
    costPerUnit: 280,
    description: 'Heavyweight rigid presentation box in matte espresso, gold foil Bharatvarsh crest, custom red wax stamp, and satin pull ribbon.',
    highlight: 'Most popular for executive gifting'
  },
  {
    id: 'bespoke_hamper' as CorporatePackagingType,
    name: 'The Atelier Heritage Hamper',
    costPerUnit: 650,
    description: 'Collector wooden-frame leather gift crate containing the product, personalized hot-stamped company note card, and beeswax leather care balm.',
    highlight: 'Ultra-luxury VIP & Chairman gifting'
  }
];

export const DEBOSSING_FINISHES = [
  {
    id: 'blind_deboss' as DebossingFinish,
    name: 'Deep Blind Deboss',
    description: 'Heat-pressed at 160°C under 2-ton hydraulic pressure without foil, creating a subtle, tactile heirloom imprint into the grain.'
  },
  {
    id: 'gold_foil_22k' as DebossingFinish,
    name: '22k Gold Foil Stamping',
    description: 'Brilliant metallic warm gold foil fused permanently into the leather fiber, mirroring the brass hardware tone.'
  },
  {
    id: 'silver_palladium' as DebossingFinish,
    name: 'Palladium Silver Foil',
    description: 'Crisp, contemporary bright silver foil finish with high-contrast reflective presence.'
  }
];

export const corporateService = {
  getDiscountTier(quantity: number): { percent: number; label: string; freeDiePlate: boolean } {
    if (quantity >= 100) {
      return { percent: 20, label: 'Patron Tier (20% Volume Concession)', freeDiePlate: true };
    }
    if (quantity >= 50) {
      return { percent: 15, label: 'Executive Tier (15% Volume Concession)', freeDiePlate: true };
    }
    if (quantity >= 25) {
      return { percent: 10, label: 'Associates Tier (10% Volume Concession)', freeDiePlate: false };
    }
    if (quantity >= 10) {
      return { percent: 5, label: 'Corporate Tier (5% Volume Concession)', freeDiePlate: false };
    }
    return { percent: 0, label: 'Minimum 10 units for corporate pricing', freeDiePlate: false };
  },

  calculateQuote(
    product: Product,
    quantity: number,
    packaging: CorporatePackagingType,
    debossingFinish: DebossingFinish,
    companyDetails: {
      companyName: string;
      gstin: string;
      contactPerson: string;
      email: string;
      phone: string;
      city: string;
      state: string;
      pincode: string;
    },
    customLogoCrestText: string,
    notes?: string
  ): CorporateQuoteRequest {
    const qty = Math.max(10, quantity);
    const tier = this.getDiscountTier(qty);

    const baseUnitPrice = product.price;
    const discountedUnitPrice = Math.round(baseUnitPrice * (1 - tier.percent / 100));
    const productsSubtotal = discountedUnitPrice * qty;

    const selectedPkg = PACKAGING_OPTIONS.find((p) => p.id === packaging) || PACKAGING_OPTIONS[0];
    const packagingTotal = selectedPkg.costPerUnit * qty;

    // Brass die plate is ₹1,800 or FREE on 50+ units
    const diePlateFee = tier.freeDiePlate ? 0 : 1800;

    const taxableSubtotal = productsSubtotal + packagingTotal + diePlateFee;
    const gstRate = 0.18; // 18% HSN 4202
    const gstAmount = Math.round(taxableSubtotal * gstRate);
    const grandTotal = taxableSubtotal + gstAmount;

    // The Input Tax Credit is 100% of the GST paid
    const inputTaxCreditValue = gstAmount;

    const quoteNumber = `BLC-CORP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      id: `quote_${Date.now()}`,
      quoteNumber,
      companyName: companyDetails.companyName,
      gstin: companyDetails.gstin.trim().toUpperCase(),
      contactPerson: companyDetails.contactPerson,
      email: companyDetails.email,
      phone: companyDetails.phone,
      city: companyDetails.city,
      state: companyDetails.state,
      pincode: companyDetails.pincode,
      productId: product.id,
      productName: product.name,
      productType: product.productType,
      quantity: qty,
      packaging,
      debossingFinish,
      customLogoCrestText: customLogoCrestText || companyDetails.companyName,
      baseUnitPrice,
      discountPercentage: tier.percent,
      discountedUnitPrice,
      diePlateFee,
      packagingUnitFee: selectedPkg.costPerUnit,
      taxableSubtotal,
      gstRate: 18,
      gstAmount,
      grandTotal,
      inputTaxCreditValue,
      createdAt: new Date().toISOString(),
      deliveryTimelineWeeks: qty > 100 ? '3–4 weeks bench crafting' : '2–3 weeks bench crafting',
      notes
    };
  },

  getSavedQuotes(): CorporateQuoteRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_CORP_QUOTES);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Failed to read corporate quotes', e);
    }
    return [];
  },

  saveQuote(quote: CorporateQuoteRequest): void {
    try {
      const existing = this.getSavedQuotes();
      existing.unshift(quote);
      localStorage.setItem(STORAGE_KEY_CORP_QUOTES, JSON.stringify(existing));
    } catch (e) {
      console.error('Failed to save corporate quote', e);
    }
  }
};

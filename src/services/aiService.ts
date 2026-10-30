export interface GeneratedStoryResult {
  shortDescription: string;
  description: string;
  features: string[];
  careInstructions?: string;
  suggestedBadge?: string;
}

export interface GenerateStoryParams {
  name: string;
  category: string;
  productType: string;
  leatherType?: string;
  hardware?: string;
  dimensions?: string;
  features?: string;
  tone?: string;
}

export const aiService = {
  /**
   * Generates a luxury artisanal catalog story and metadata via server-side Gemini
   */
  async generateStory(params: GenerateStoryParams): Promise<GeneratedStoryResult> {
    try {
      const response = await fetch('/api/gemini/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        shortDescription: data.shortDescription || '',
        description: data.description || '',
        features: Array.isArray(data.features) ? data.features : [],
        careInstructions: data.careInstructions || '',
        suggestedBadge: data.suggestedBadge || ''
      };
    } catch (err: any) {
      console.warn('AI Story generator request failed, falling back to local artisan template:', err);
      // Resilient fallback so the user experience never blocks
      return {
        shortDescription: `Handcrafted from prime ${params.leatherType || 'vegetable-tanned full-grain leather'}, embodying timeless Indian bespoke elegance.`,
        description: `Born of unhurried artisan mastery, the ${params.name} represents Bharatvarsh Leathercrafts' dedication to Kanpur vegetable tanning traditions. Cut exclusively from premium ${params.leatherType || 'full-grain cowhide'} and outfitted with ${params.hardware || 'solid antique brass'}, each stitch preserves generations of Indian leatherworking heritage.\n\nOver years of faithful carry, the surface naturally absorbs ambient warmth and honest wear, blooming into a luminous amber-cognac patina unique to your journey.`,
        features: [
          'Hand-beveled edges burnished with organic Indian beeswax',
          `Generational ${params.hardware || 'solid cast antique brass'} hardware`,
          'Develops a deep, rich heirloom patina with daily use',
          'Accompanied by serial-numbered Bharatvarsh provenance certificate'
        ],
        careInstructions: 'Apply pure beeswax leather balm bi-annually. Air-dry away from direct heat if exposed to moisture.',
        suggestedBadge: 'Artisan Heritage'
      };
    }
  },

  /**
   * Sends an inquiry to the Master Leather Artisan & Private Client Concierge
   */
  async sendConciergeMessage(message: string, currentProduct?: any): Promise<string> {
    try {
      const response = await fetch('/api/gemini/concierge-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          currentProduct: currentProduct ? {
            name: currentProduct.name,
            category: currentProduct.category,
            productType: currentProduct.productType,
            price: currentProduct.price,
            leatherType: currentProduct.leatherType,
            hardware: currentProduct.hardware,
            dimensions: currentProduct.dimensions,
          } : undefined
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.reply || 'Our master artisans are at your service.';
    } catch (err: any) {
      console.warn('Concierge chat request failed, generating fallback response:', err);
      const lower = message.toLowerCase();
      if (lower.includes('size') || lower.includes('belt') || lower.includes('waist') || lower.includes('fit')) {
        return `For our full-grain leather belts, we recommend the **Golden Rule of Leather Sizing**: Order **2 inches larger** than your standard Indian trouser/jeans waist size. For example, a 34" trouser waist takes a 36" belt (90 cm) to center the buckle tongue in the middle hole (hole 3 of 5).`;
      }
      if (lower.includes('care') || lower.includes('clean') || lower.includes('rain') || lower.includes('monsoon')) {
        return `Full-grain vegetable-tanned leather requires simple, attentive care: during monsoons, wipe moisture away with a soft dry cotton muslin cloth and let it dry naturally in an airy room. Never place near heaters or hair dryers. Treat with natural beeswax balm once every 3 months.`;
      }
      if (lower.includes('patina') || lower.includes('age')) {
        return `Our vegetable-tanned leather will develop an exceptional personal patina over 6 to 12 months. Exposure to natural light and the natural oils of your hands will deepen tones like Cognac and Saddle Tan into a lustrous heirloom amber.`;
      }
      return `Welcome to the Bharatvarsh Leathercrafts Atelier. Our artisans handcraft every piece from premium Indian vegetable-tanned full-grain leather with hand-beveled edges and solid brass hardware. How may we assist your bespoke leather selection?`;
    }
  }
};

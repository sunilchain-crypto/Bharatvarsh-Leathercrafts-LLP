import { PatronReview } from '../types';

const REVIEWS_STORAGE_KEY = 'blc_patron_reviews_v1';

const INITIAL_REVIEWS: PatronReview[] = [
  {
    id: 'rev_1',
    productId: 'prod_briefcase_1',
    productName: 'Jaigarh 15" Vegetable-Tanned Executive Briefcase',
    authorName: 'Vikramaditya Singhania',
    location: 'Nariman Point, Mumbai',
    rating: 5,
    title: '18 Months of Daily Court Appearances: The Patina is Breathtaking',
    story: 'I have carried this briefcase to Bombay High Court every weekday for eighteen months. The initial cognac shade has deepened into an amber mahogany with lustrous highs along the flap creases. The 3.5mm thick harness leather has molded to my files, and the cast brass tuck-lock snaps with the same crisp authority as day one. This is not disposable luxury; it is heirloom gear.',
    monthsOfUse: 18,
    patinaGrade: 'Deep Amber Patina',
    photoUrl: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
    verifiedBuyer: true,
    createdAt: '2026-08-14',
    helpfulCount: 42
  },
  {
    id: 'rev_2',
    productId: 'prod_belt_1',
    productName: 'Royal Rajputana Solid Brass Buckle Leather Belt',
    authorName: 'Col. Rajeshwardeep Singh (Retd.)',
    location: 'Golf Links, New Delhi',
    rating: 5,
    title: '14 Months In: True English Bridle Temper',
    story: 'Most retail belts split at the hole after six months because they use pressed bonded scraps. Bharatvarsh uses a single contiguous strip of 10-12oz full-grain steer hide. Fourteen months of daily wear in Delhi heat and monsoon moisture, and the leather has simply molded comfortably around my waist with zero edge cracking. Clean beveled edges, solid brass that does not pit.',
    monthsOfUse: 14,
    patinaGrade: 'Rich Cognac Glow',
    photoUrl: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=800&q=80',
    verifiedBuyer: true,
    createdAt: '2026-09-02',
    helpfulCount: 29
  },
  {
    id: 'rev_3',
    productId: 'prod_wallet_1',
    productName: 'Nilgiri Hand-Stitched Vegetable-Tanned Bifold',
    authorName: 'Ananya Raghavan',
    location: 'Indiranagar, Bengaluru',
    rating: 5,
    title: '9 Months in Denim Pockets — Waxed Thread Has Zero Fraying',
    story: 'Gifted this to my partner with custom gold debossed initials "AR". After nine months of living in back jeans pockets, the vegetable-tanned leather has developed that unmistakable deep caramel sheen that only genuine plant tannins produce. The linen saddle-stitching is rock solid. Remarkable craftsmanship at a fair price.',
    monthsOfUse: 9,
    patinaGrade: 'Warm Honey Saddle',
    photoUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
    verifiedBuyer: true,
    createdAt: '2026-09-28',
    helpfulCount: 19
  },
  {
    id: 'rev_4',
    productId: 'prod_backpack_1',
    productName: 'Ranikhet Heritage Rucksack & Weekender',
    authorName: 'Devrat Sen',
    location: 'Salt Lake, Kolkata',
    rating: 5,
    title: '24 Months Across the Western Ghats and Ladakh',
    story: 'Two years of planes, dirt trails, and coffee shops. Rain, dust, and mountain sun have given this rucksack a rugged, weathered dark espresso character that looks twice as expensive as when it arrived fresh in its cotton dust bag. The solid copper rivets at the shoulder load-points will outlive me.',
    monthsOfUse: 24,
    patinaGrade: 'Dark Espresso Glaze',
    photoUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
    verifiedBuyer: true,
    createdAt: '2026-07-10',
    helpfulCount: 36
  },
  {
    id: 'rev_5',
    productId: 'prod_tote_1',
    productName: 'Udaivilas Full-Grain Artisan Leather Tote',
    authorName: 'Dr. Meenakshi Sundaram',
    location: 'Alwarpet, Chennai',
    rating: 5,
    title: '11 Months: Carries Heavy Laptops with Absolute Grace',
    story: 'The rolled leather handles are reinforced with hidden harness cord — no stretching or painful shoulder digging even when packed with a 16" laptop and medical files. The raw unlined suede interior smells heavenly. Everyone at the clinic asks where I acquired it.',
    monthsOfUse: 11,
    patinaGrade: 'Warm Honey Saddle',
    photoUrl: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=800&q=80',
    verifiedBuyer: true,
    createdAt: '2026-10-04',
    helpfulCount: 15
  }
];

export const reviewService = {
  getReviews(): PatronReview[] {
    try {
      const stored = localStorage.getItem(REVIEWS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load reviews from storage', e);
    }
    this.saveReviews(INITIAL_REVIEWS);
    return INITIAL_REVIEWS;
  },

  getReviewsForProduct(productId: string): PatronReview[] {
    const all = this.getReviews();
    return all.filter((r) => !r.productId || r.productId === productId || r.productId === 'all');
  },

  saveReviews(reviews: PatronReview[]): void {
    try {
      localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(reviews));
    } catch (e) {
      console.warn('Failed to save reviews to storage', e);
    }
  },

  addReview(newReview: Omit<PatronReview, 'id' | 'createdAt' | 'helpfulCount'>): PatronReview {
    const reviews = this.getReviews();
    const created: PatronReview = {
      ...newReview,
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
      helpfulCount: 0
    };
    reviews.unshift(created);
    this.saveReviews(reviews);
    return created;
  },

  voteHelpful(reviewId: string): number {
    const reviews = this.getReviews();
    let count = 0;
    const updated = reviews.map((r) => {
      if (r.id === reviewId) {
        count = r.helpfulCount + 1;
        return { ...r, helpfulCount: count };
      }
      return r;
    });
    this.saveReviews(updated);
    return count;
  },

  getReviewStats(productId?: string) {
    const list = productId ? this.getReviewsForProduct(productId) : this.getReviews();
    const count = list.length;
    if (count === 0) {
      return {
        averageRating: 5.0,
        totalReviews: 0,
        verifiedCount: 0,
        averageMonthsUsed: 12,
        withPhotosCount: 0
      };
    }

    const sum = list.reduce((acc, r) => acc + r.rating, 0);
    const avg = Number((sum / count).toFixed(1));
    const verified = list.filter((r) => r.verifiedBuyer).length;
    const withPhotos = list.filter((r) => Boolean(r.photoUrl)).length;
    const avgMonths = Math.round(list.reduce((acc, r) => acc + (r.monthsOfUse || 1), 0) / count);

    return {
      averageRating: avg,
      totalReviews: count,
      verifiedCount: verified,
      averageMonthsUsed: avgMonths,
      withPhotosCount: withPhotos
    };
  }
};

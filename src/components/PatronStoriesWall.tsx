import React, { useState } from 'react';
import { PatronReview, Product } from '../types';
import { reviewService } from '../services/reviewService';
import {
  Star,
  CheckCircle2,
  Camera,
  ThumbsUp,
  X,
  Upload,
  Calendar,
  Sparkles,
  Maximize2,
  ShieldCheck,
  Filter
} from 'lucide-react';

interface PatronStoriesWallProps {
  products: Product[];
  onSelectProduct?: (product: Product) => void;
  className?: string;
}

export const PatronStoriesWall: React.FC<PatronStoriesWallProps> = ({
  products,
  onSelectProduct,
  className = ''
}) => {
  const [reviews, setReviews] = useState<PatronReview[]>(() => reviewService.getReviews());
  const [activeFilter, setActiveFilter] = useState<'all' | 'photos' | 'aged' | '5stars'>('all');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string; author: string } | null>(null);

  // Form state
  const [authorName, setAuthorName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [rating, setRating] = useState(5);
  const [monthsOfUse, setMonthsOfUse] = useState(6);
  const [patinaGrade, setPatinaGrade] = useState<PatronReview['patinaGrade']>('Rich Cognac Glow');
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [formSuccessMessage, setFormSuccessMessage] = useState(false);

  const stats = reviewService.getReviewStats();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !story.trim() || !title.trim()) return;

    const prod = products.find((p) => p.id === selectedProductId);

    const newRev = reviewService.addReview({
      productId: selectedProductId,
      productName: prod ? prod.name : 'Bharatvarsh Heirloom Piece',
      authorName: authorName.trim(),
      location: location.trim() || 'India',
      rating,
      title: title.trim(),
      story: story.trim(),
      monthsOfUse: Number(monthsOfUse),
      patinaGrade,
      photoUrl: photoPreview || undefined,
      verifiedBuyer: true
    });

    setReviews(reviewService.getReviews());
    setFormSuccessMessage(true);

    setTimeout(() => {
      setFormSuccessMessage(false);
      setIsSubmitModalOpen(false);
      // Reset form
      setAuthorName('');
      setLocation('');
      setTitle('');
      setStory('');
      setPhotoPreview(null);
    }, 1800);
  };

  const handleHelpful = (id: string) => {
    reviewService.voteHelpful(id);
    setReviews(reviewService.getReviews());
  };

  // Filter list
  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === 'photos') return Boolean(r.photoUrl);
    if (activeFilter === 'aged') return (r.monthsOfUse || 0) >= 12;
    if (activeFilter === '5stars') return r.rating === 5;
    return true;
  });

  return (
    <section id="patron-stories" className={`py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto ${className}`}>
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#24140D]/10">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#783A1D] mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C29B38]" />
            <span>Real Wear & Patina Registry</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#24140D] tracking-tight">
            Patron Chronicles & Patina Wall
          </h2>
          <p className="mt-2 text-sm text-[#24140D]/75 max-w-2xl">
            True vegetable-tanned leather does not wear out; it wears in. Read authentic field notes from patrons who have carried our leather goods through monsoons, airports, and decades of daily life.
          </p>
        </div>

        <button
          onClick={() => setIsSubmitModalOpen(true)}
          className="self-start md:self-auto px-5 py-3 rounded-lg bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-semibold tracking-wider uppercase transition-colors flex items-center gap-2 cursor-pointer shadow-md shrink-0"
        >
          <Camera className="w-4 h-4 text-[#C29B38]" />
          <span>Share Your Patina Story</span>
        </button>
      </div>

      {/* Aggregate Metrics Bar */}
      <div className="my-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 shadow-2xs">
          <div className="flex items-center gap-1.5 text-[#C29B38] mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <div className="text-2xl font-serif font-bold text-[#24140D] font-mono tabular-nums">
            {stats.averageRating} / 5.0
          </div>
          <span className="text-[11px] text-[#24140D]/60 uppercase tracking-wider">
            Verified Patron Satisfaction ({stats.totalReviews} Chronicles)
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 shadow-2xs">
          <div className="text-xs font-semibold text-[#783A1D] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>Average Tested Carry</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#24140D] font-mono tabular-nums">
            {stats.averageMonthsUsed} Months
          </div>
          <span className="text-[11px] text-[#24140D]/60 uppercase tracking-wider">
            Real-World Daily Aging
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 shadow-2xs">
          <div className="text-xs font-semibold text-[#783A1D] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Verified Buyers</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#24140D] font-mono tabular-nums">
            100%
          </div>
          <span className="text-[11px] text-[#24140D]/60 uppercase tracking-wider">
            Authentic Grain & Hardware
          </span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-[#24140D]/10 shadow-2xs">
          <div className="text-xs font-semibold text-[#783A1D] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-[#C29B38]" />
            <span>Photo Proofs</span>
          </div>
          <div className="text-2xl font-serif font-bold text-[#24140D] font-mono tabular-nums">
            {stats.withPhotosCount} Hides
          </div>
          <span className="text-[11px] text-[#24140D]/60 uppercase tracking-wider">
            Documented Patina Shots
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 text-xs">
        <span className="text-[11px] uppercase font-semibold text-[#783A1D] tracking-wider flex items-center gap-1 mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter:</span>
        </span>
        {[
          { id: 'all', label: `All Chronicles (${reviews.length})` },
          { id: 'photos', label: `With Patina Photos (${reviews.filter((r) => r.photoUrl).length})` },
          { id: 'aged', label: `12+ Months Aged (${reviews.filter((r) => (r.monthsOfUse || 0) >= 12).length})` },
          { id: '5stars', label: `5-Star Reviews (${reviews.filter((r) => r.rating === 5).length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeFilter === tab.id
                ? 'border-[#783A1D] bg-[#24140D] text-[#FAF7F2]'
                : 'border-[#24140D]/15 bg-white text-[#24140D]/80 hover:border-[#24140D]/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredReviews.map((review) => {
          const associatedProduct = products.find((p) => p.id === review.productId);

          return (
            <div
              key={review.id}
              className="rounded-xl bg-white border border-[#24140D]/10 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                {/* Photo Header if available */}
                {review.photoUrl && (
                  <div className="relative h-48 bg-[#EFE9DF] overflow-hidden group">
                    <img
                      src={review.photoUrl}
                      alt={review.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Zoom / Lightbox Trigger */}
                    <button
                      onClick={() =>
                        setLightboxImage({
                          url: review.photoUrl!,
                          title: review.title,
                          author: review.authorName
                        })
                      }
                      aria-label="Inspect patina photograph"
                      className="absolute top-3 right-3 p-1.5 rounded-md bg-black/50 text-[#FAF7F2] hover:bg-black/80 transition-colors cursor-pointer backdrop-blur-xs"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Patina Grade Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-[11px]">
                      <span className="font-semibold bg-[#24140D]/80 backdrop-blur-xs px-2.5 py-0.5 rounded border border-[#C29B38]/30">
                        {review.patinaGrade}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#EFE9DF]">
                        {review.monthsOfUse} Months of Carry
                      </span>
                    </div>
                  </div>
                )}

                <div className="p-6 space-y-4">
                  {/* Author & Rating Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-sm text-[#24140D]">{review.authorName}</span>
                        {review.verifiedBuyer && (
                          <span
                            title="Verified Bharatvarsh Patron"
                            className="inline-flex items-center gap-0.5 text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200"
                          >
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>Verified</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#24140D]/60">{review.location}</span>
                    </div>

                    <div className="flex items-center gap-0.5 text-[#C29B38]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating ? 'fill-current text-[#C29B38]' : 'text-[#24140D]/20'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Badges for cards without photos */}
                  {!review.photoUrl && (
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-medium bg-[#EFE9DF] text-[#783A1D] px-2 py-0.5 rounded">
                        {review.patinaGrade}
                      </span>
                      <span className="font-mono text-xs font-semibold text-[#24140D]/70">
                        {review.monthsOfUse} Months Used
                      </span>
                    </div>
                  )}

                  {/* Review Content */}
                  <div>
                    <h4 className="font-serif text-base font-bold text-[#24140D] leading-snug">
                      "{review.title}"
                    </h4>
                    <p className="mt-2 text-xs text-[#24140D]/80 leading-relaxed italic">
                      {review.story}
                    </p>
                  </div>

                  {/* Associated Product Link */}
                  {review.productName && (
                    <div className="pt-2 border-t border-[#24140D]/5 text-[11px]">
                      <span className="text-[#24140D]/50">Gear: </span>
                      {associatedProduct && onSelectProduct ? (
                        <button
                          onClick={() => onSelectProduct(associatedProduct)}
                          className="font-semibold text-[#783A1D] hover:underline cursor-pointer"
                        >
                          {review.productName}
                        </button>
                      ) : (
                        <span className="font-semibold text-[#24140D]">{review.productName}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Date & Helpful Button */}
              <div className="px-6 py-3 bg-[#FAF7F2] border-t border-[#24140D]/10 flex items-center justify-between text-xs text-[#24140D]/60">
                <span className="text-[11px]">{review.createdAt}</span>
                <button
                  type="button"
                  onClick={() => handleHelpful(review.id)}
                  className="flex items-center gap-1.5 text-xs text-[#24140D]/70 hover:text-[#783A1D] transition-colors cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Helpful ({review.helpfulCount})</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit Story Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-xl bg-[#FAF7F2] rounded-2xl shadow-2xl overflow-hidden border border-[#24140D]/15 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#24140D]/10 flex items-center justify-between bg-white">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#783A1D]" />
                <h3 className="font-serif text-lg font-bold text-[#24140D]">
                  Document Your Leather Patina
                </h3>
              </div>
              <button
                onClick={() => setIsSubmitModalOpen(false)}
                className="p-1.5 rounded-lg text-[#24140D]/60 hover:text-[#24140D] hover:bg-[#EFE9DF] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmitReview} className="p-6 space-y-4 overflow-y-auto flex-1">
              {formSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Your Patina Story & photograph have been added to the Patron Wall!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#24140D] mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Aditya Verma"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#24140D] mb-1">
                    City / Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Bandra West, Mumbai"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24140D] mb-1">
                  Product Carried *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.productType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#24140D] mb-1">
                    Months in Daily Use
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={monthsOfUse}
                    onChange={(e) => setMonthsOfUse(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#24140D] mb-1">
                    Patina Tone Grade
                  </label>
                  <select
                    value={patinaGrade}
                    onChange={(e) => setPatinaGrade(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                  >
                    <option value="Rich Cognac Glow">Rich Cognac Glow</option>
                    <option value="Deep Amber Patina">Deep Amber Patina</option>
                    <option value="Warm Honey Saddle">Warm Honey Saddle</option>
                    <option value="Dark Espresso Glaze">Dark Espresso Glaze</option>
                    <option value="Crisp Heirloom Grain">Crisp Heirloom Grain</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#24140D] mb-1">
                    Rating
                  </label>
                  <div className="flex items-center gap-1 mt-1.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => setRating(s)}
                        className="cursor-pointer text-[#C29B38]"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            s <= rating ? 'fill-current text-[#C29B38]' : 'text-[#24140D]/20'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24140D] mb-1">
                  Story Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 1 Year in Mumbai Monsoons: Flawless aging"
                  className="w-full px-3 py-2 text-xs bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24140D] mb-1">
                  Your Aging Narrative & Observations *
                </label>
                <textarea
                  required
                  rows={4}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Describe how the hide has conditioned, molded to your carry habits, hardware patina, and any compliments received..."
                  className="w-full px-3 py-2 text-xs bg-white border border-[#24140D]/20 rounded-lg focus:outline-none focus:border-[#783A1D]"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-semibold text-[#24140D] mb-1">
                  Upload Photo of Your Aged Leather Piece
                </label>
                <div className="mt-1 flex items-center gap-4">
                  <label className="px-4 py-2.5 rounded-lg border border-dashed border-[#783A1D] hover:bg-[#EFE9DF] text-xs font-semibold text-[#783A1D] flex items-center gap-2 cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span>Choose Photo File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                  {photoPreview && (
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#24140D]/20">
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoPreview(null)}
                        className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-[#24140D]/60 mt-1">
                  Natural daylight photographs showcasing leather creases, edge burnish, or brass patina work best.
                </p>
              </div>

              <div className="pt-4 border-t border-[#24140D]/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg border border-[#24140D]/20 text-xs font-medium text-[#24140D] hover:bg-[#EFE9DF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#24140D] hover:bg-[#3D2013] text-[#FAF7F2] text-xs font-bold uppercase tracking-wider transition-colors shadow-md cursor-pointer"
                >
                  Publish to Patron Wall
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* High-Resolution Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#1A0E08] rounded-xl overflow-hidden border border-[#C29B38]/30 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="max-h-[75vh] overflow-hidden rounded-lg flex items-center justify-center bg-black">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
            <div className="p-4 text-[#FAF7F2] flex items-center justify-between">
              <div>
                <h4 className="font-serif text-lg font-bold text-[#EFE9DF]">
                  "{lightboxImage.title}"
                </h4>
                <p className="text-xs text-[#C29B38]">Patina Documented by {lightboxImage.author}</p>
              </div>
              <span className="text-xs text-white/60">Full-Grain Vegetable-Tanned Hide</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

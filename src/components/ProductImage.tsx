import React, { useState } from 'react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  category?: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  className = '',
  category = 'Leathercraft',
  aspectRatio = 'square'
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'portrait'
      ? 'aspect-[3/4]'
      : 'aspect-[16/9]';

  if (!src || hasError) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center p-6 overflow-hidden bg-gradient-to-br from-[#3D2013] via-[#2A160D] to-[#1A0E08] text-[#F3EADB] ${aspectClass} ${className}`}
      >
        {/* Subtle leather grain pattern */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(#D4B37A 1px, transparent 1px)`,
            backgroundSize: '12px 12px'
          }}
        />

        {/* Decorative saddle stitch border inside */}
        <div className="absolute inset-3 border border-[#C29B38]/30 border-dashed rounded pointer-events-none" />

        {/* Leather hide emblem SVG */}
        <div className="relative z-10 w-14 h-14 mb-3 text-[#C29B38] opacity-90 flex items-center justify-center">
          <svg viewBox="0 0 100 100" fill="currentColor" className="w-full h-full drop-shadow">
            <path d="M20,15 C20,25 15,35 10,40 C15,50 15,60 10,70 C20,75 25,85 20,95 C35,90 45,95 50,90 C55,95 65,90 80,95 C75,85 80,75 90,70 C85,60 85,50 90,40 C85,35 80,25 80,15 C65,20 55,15 50,20 C45,15 35,20 20,15 Z" />
          </svg>
          <span className="absolute text-[9px] font-bold tracking-widest text-[#2A160D] uppercase">BLC</span>
        </div>

        <p className="relative z-10 text-xs font-serif tracking-widest uppercase text-[#C29B38] text-center px-4">
          Bharatvarsh Handcrafted
        </p>
        <span className="relative z-10 text-[11px] text-[#D8C7B0] text-center max-w-[85%] truncate mt-1">
          {alt}
        </span>
        <span className="relative z-10 text-[9px] tracking-wider text-[#A89078] uppercase mt-2">
          {category}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-[#EFE9DF] ${aspectClass} ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#EFE9DF] via-[#E8E0D2] to-[#EFE9DF] animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover object-center transition-all duration-700 ease-out group-hover:scale-105 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

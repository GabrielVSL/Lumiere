import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../../types';
import MediaCard from './MediaCard';

interface MediaRowProps {
  title: string;
  items: MediaItem[];
  variant?: 'widescreen' | 'poster';
  viewAllLink?: string;
  badgeLabel?: string;
  icon?: React.ReactNode;
}

export default function MediaRow({
  title,
  items,
  variant = 'poster',
  viewAllLink,
  badgeLabel,
  icon,
}: MediaRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (!items || items.length === 0) return null;

  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const scrollAmount = rowRef.current.clientWidth * 0.75;
      rowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(checkScroll, 350);
    }
  };

  return (
    <section className="relative my-8 group select-none">
      {/* Row Header */}
      <div className="flex items-center justify-between mb-4 px-4 md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-6 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]" />
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            {icon}
            {title}
          </h2>
        </div>

        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="text-xs md:text-sm font-bold text-gray-400 hover:text-amber-400 transition-colors flex items-center gap-1 group/link"
          >
            Ver todos
            <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* Row Carousel Wrapper */}
      <div className="relative">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scroll('left')}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[#07080b]/80 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-xl hover:scale-110 opacity-0 group-hover:opacity-100"
            title="Rolar para esquerda"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scroll('right')}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-[#07080b]/80 hover:bg-amber-500 text-white hover:text-slate-950 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all duration-300 shadow-xl hover:scale-110 opacity-0 group-hover:opacity-100"
            title="Rolar para direita"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Horizontal Scroll Area */}
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto gap-4 md:gap-5 px-4 md:px-12 pb-4 hide-scrollbar snap-x snap-mandatory"
        >
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex-shrink-0 snap-start ${
                variant === 'widescreen'
                  ? 'w-[260px] sm:w-[300px] md:w-[340px]'
                  : 'w-[140px] sm:w-[170px] md:w-[200px]'
              }`}
            >
              <MediaCard item={item} variant={variant} badgeLabel={badgeLabel} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

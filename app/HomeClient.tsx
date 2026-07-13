"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Compass, 
  Search, 
  CheckCircle2, 
  Menu,
  X,
  TrendingUp
} from 'lucide-react';
import { Creator } from './types';

function TopicCard({ creator, priority = false }: { creator: Creator; priority?: boolean }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/creator/${encodeURIComponent(creator.name)}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative aspect-video cursor-pointer bg-stone-950 border border-stone-900 rounded-xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-lg hover:border-orange-500/30"
      style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
    >
      {/* Gradient fallback - always behind everything */}
      <div
        style={{ backgroundImage: creator.gradient }}
        className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-stone-300">
          <span className="font-extrabold text-xs font-mono">{creator.name.substring(0, 2).toUpperCase()}</span>
        </div>
      </div>

      {/* Thumbnail / image - z-10 sits above gradient */}
      {creator.thumbnailUrl && (
        <Image
          fill
          src={creator.thumbnailUrl}
          alt={creator.name || 'Topic thumbnail'}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="z-10 object-cover pointer-events-none"
          priority={priority}
        />
      )}

      {/* Title overlay - z-30, always visible at bottom */}
      <div className="absolute z-30 inset-x-0 bottom-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent pt-12 px-3 pb-3 pointer-events-none">
        <h4 className="text-white text-[15px] font-bold line-clamp-2 leading-snug drop-shadow-md">
          {creator.name || 'Untitled Topic'}
        </h4>
      </div>
    </div>
  );
}

export default function HomeClient({ initialCreators }: { initialCreators: Creator[] }) {
  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Modals visibility
  const [notification, setNotification] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Storage and configuration states loaded from Admin Panel
  const [bannerAd, setBannerAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>(null);
  const [popupAd, setPopupAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>(null);
  const [showPopupModal, setShowPopupModal] = useState(false);

  useEffect(() => {
    setIsClient(true);

    // Fetch ads from API globally
    const fetchAds = async () => {
      try {
        const res = await fetch('/api/ads');
        if (res.ok) {
          const data = await res.json();
          if (data.ads?.banner) setBannerAd(data.ads.banner);
          if (data.ads?.popup) {
            setPopupAd(data.ads.popup);
            if (data.ads.popup.enabled && data.ads.popup.imageUrl) {
              setTimeout(() => setShowPopupModal(true), 7000);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load ads globally');
      }
    };
    fetchAds();
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Search filter
  const filteredCreators = creators.filter((c) => {
    return c.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredCreators.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCreators = filteredCreators.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <>
      {/* Main Sticky Header */}
      <header className="sticky top-0 z-[1000] bg-[#090909]/92 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo with circular image */}
          <Link 
            href="/"
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-orange-500/60 bg-black flex-shrink-0 shadow-md shadow-orange-500/20">
              <img src="/logo.png" alt="Nude Trends" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-extrabold text-white text-lg sm:text-xl tracking-tighter group-hover:text-orange-500 transition-colors uppercase m-0 flex items-center">
              Nude
              <span className="bg-orange-500 text-black px-2 py-0.5 rounded-md font-black text-sm sm:text-base tracking-tight shadow-md shadow-orange-500/10 ml-2">
                TRENDS
              </span>
            </h1>
          </Link>

          {/* Core Central Search Wrap */}
          <div className="hidden md:flex flex-1 max-w-xl items-center">
            <div className="relative flex-1">
              <input 
                ref={searchInputRef}
                type="text"
                placeholder="Search topics or models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className="w-full bg-stone-900/60 border border-stone-800 rounded-l-full py-2 pl-5 pr-12 text-xs text-stone-200 focus:outline-none focus:border-orange-500 placeholder:text-stone-500 transition-colors"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-xs text-stone-500 hover:text-stone-300"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              onClick={() => searchInputRef.current?.focus()}
              className="bg-orange-500 hover:bg-orange-400 text-stone-950 px-5 py-2 rounded-r-full flex items-center justify-center border border-orange-500 transition-colors cursor-pointer"
              title="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-stone-400 hover:text-orange-500 bg-stone-900 border border-stone-850 rounded-lg transition"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Page Content Body */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Mobile Search input */}
        <div className="md:hidden w-full flex items-center gap-2">
          <div className="relative flex-1">
            <input 
              type="text"
              placeholder="Search topics or models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              className="w-full bg-stone-900 border border-stone-800 rounded-l-xl py-2.5 pl-4 pr-4 text-xs text-stone-200 focus:outline-none focus:border-orange-500 placeholder:text-stone-500"
            />
          </div>
        </div>

        {/* Dynamic Sponsor Banner Ad */}
        {bannerAd && bannerAd.enabled && bannerAd.imageUrl && (
          <div className="w-full bg-[#111111] border border-orange-500/25 p-1 rounded-xl flex items-center justify-center relative overflow-hidden group shadow-lg">
            <a href={bannerAd.linkUrl || "#"} target="_blank" rel="noopener noreferrer" className="w-full h-20 sm:h-24 relative block">
              <img src={bannerAd.imageUrl} alt="Sponsor Banner Ad" className="w-full h-full object-cover rounded-lg group-hover:scale-[1.005] transition-transform duration-300" />
              <span className="absolute bottom-2 right-2 bg-stone-950/85 backdrop-blur-sm text-[8px] font-mono font-black text-orange-400 px-2 py-0.5 rounded border border-orange-500/20 uppercase">
                SPONSOR AD
              </span>
            </a>
          </div>
        )}
        
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-stone-850 pb-3">
            <h3 className="text-sm font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-orange-500" />
              <span>
                Topics / Models ({filteredCreators.length})
              </span>
            </h3>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-xs text-orange-500 hover:underline"
              >
                Clear Search
              </button>
            )}
          </div>

          {paginatedCreators.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {paginatedCreators.map((creator, idx) => (
                  <TopicCard 
                    key={creator.name}
                    creator={creator}
                    priority={idx < 4}
                  />
                ))}
              </div>

              {/* SLEEK PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8 border-t border-stone-900 mt-8 animate-fadeIn">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage(prev => Math.max(prev - 1, 1));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-850 hover:border-stone-700 text-stone-400 hover:text-white text-xs font-bold font-mono transition disabled:opacity-30 disabled:hover:bg-stone-900 disabled:hover:text-stone-400 disabled:cursor-not-allowed"
                  >
                    &lt; Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition ${
                        currentPage === page
                          ? 'bg-orange-500 text-stone-950 shadow-lg shadow-orange-500/25'
                          : 'bg-stone-900 hover:bg-stone-850 border border-stone-850 hover:border-stone-700 text-stone-450 hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage(prev => Math.min(prev + 1, totalPages));
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-850 hover:border-stone-700 text-stone-400 hover:text-white text-xs font-bold font-mono transition disabled:opacity-30 disabled:hover:bg-stone-900 disabled:hover:text-stone-400 disabled:cursor-not-allowed"
                  >
                    Next &gt;
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-16 border border-stone-800 rounded-2xl bg-[#111111]/30 text-center space-y-4">
              <Compass className="w-12 h-12 text-stone-600 mx-auto" />
              <div>
                <h4 className="font-bold text-stone-200">No topics matched selection parameters</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">Try typing another query or clear filters to view original items.</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}

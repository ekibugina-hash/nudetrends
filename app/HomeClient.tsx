"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Menu,
  X,
  Play,
  Video as VideoIcon,
  Image as ImageIcon,
  Compass,
  Flame,
} from 'lucide-react';
import { Creator } from './types';

// ─── Fast Thumbnail Component (NO heavy video elements on home) ───────────────
function FastTopicThumb({
  thumbnailUrl,
  imageUrl,
  gradient,
  initials,
  isImage,
  duration,
  mediaCount,
}: {
  thumbnailUrl?: string;
  imageUrl?: string;
  gradient?: string;
  initials?: string;
  isImage?: boolean;
  duration?: string;
  mediaCount?: number;
}) {
  const [imgError, setImgError] = useState(false);
  const src = !imgError ? (thumbnailUrl || imageUrl) : null;

  return (
    <div className="w-32 xs:w-36 sm:w-44 md:w-52 h-28 xs:h-32 sm:h-36 md:h-40 rounded-2xl bg-black border border-stone-700 group-hover:border-orange-500/70 overflow-hidden flex-shrink-0 flex items-center justify-center relative shadow-lg shadow-black/80 transition-colors">
      {src ? (
        <img
          src={src}
          alt="Thumbnail"
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 brightness-[1.02]"
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
          style={{ backgroundImage: gradient }}
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/70 border border-white/20 flex items-center justify-center mb-1.5 shadow-sm">
            {isImage ? (
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
            ) : (
              <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
            )}
          </div>
          <span className="font-extrabold text-xs sm:text-sm font-mono text-white truncate max-w-full px-1">
            {initials || 'NT'}
          </span>
        </div>
      )}

      {/* Format / Duration badge */}
      <span
        className={`absolute bottom-2 right-2 text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-md font-black z-20 shadow-lg ${
          isImage
            ? 'bg-orange-500 text-stone-950 uppercase'
            : 'bg-stone-900/95 text-stone-100 border border-stone-700 backdrop-blur-md'
        }`}
      >
        {isImage ? 'PHOTO' : duration || 'VIDEO'}
      </span>

      {/* Media count badge */}
      {mediaCount && mediaCount > 1 ? (
        <span className="absolute top-2 left-2 bg-stone-900/95 border border-stone-700 text-[9px] sm:text-[10px] font-mono font-black px-2 py-0.5 rounded-md text-orange-400 z-20 shadow-lg backdrop-blur-md">
          {mediaCount} items
        </span>
      ) : null}

      {/* Play hover button */}
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-500 text-stone-950 flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
        </div>
      </div>
    </div>
  );
}

// ─── Topic / Trend Card (Thumbnail on left, info on right on BOTH mobile & desktop) ──
function TopicTrendCard({
  item,
  onClick,
  isRecent,
}: {
  item: Creator;
  onClick: () => void;
  isRecent?: boolean;
}) {
  const isImage = item.firstVideo?.type === 'image';
  const duration = item.firstVideo?.duration || (isImage ? 'PHOTO' : 'VIDEO');
  const interestingTitles = item.firstVideo?.interestingTitles || [];
  const initials = item.name.substring(0, 3).toUpperCase();

  return (
    <div
      onClick={onClick}
      className="bg-[#151515] hover:bg-[#1a1a1a] border border-stone-750 hover:border-orange-500/80 p-3.5 sm:p-4 md:p-5 rounded-2xl sm:rounded-3xl flex flex-row gap-3.5 sm:gap-4 md:gap-5 transition-all duration-200 shadow-xl shadow-black/70 hover:shadow-orange-500/10 ring-1 ring-white/10 hover:ring-orange-500/30 group cursor-pointer active:scale-[0.99]"
    >
      {/* Left Thumbnail */}
      <FastTopicThumb
        thumbnailUrl={item.thumbnailUrl}
        imageUrl={item.firstVideo?.imageUrl}
        gradient={item.gradient}
        initials={initials}
        isImage={isImage}
        duration={duration}
        mediaCount={item.videoCount}
      />

      {/* Right Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1 space-y-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {isRecent && (
              <span className="text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded bg-orange-500 text-stone-950 shadow-sm">
                Fresh
              </span>
            )}
            <h3
              className="font-extrabold text-white text-base sm:text-lg md:text-xl line-clamp-2 leading-snug group-hover:text-orange-400 transition-colors drop-shadow-sm"
              title={item.name}
            >
              {item.name}
            </h3>
          </div>

          <p className="text-xs text-stone-300 font-mono mt-1.5 truncate">
            Trend: <span className="text-white font-bold">{item.name}</span> {item.firstVideo?.views ? `• ${item.firstVideo.views}` : ''}
          </p>

          {(item.bio || item.firstVideo?.desc) && (
            <p className="text-xs sm:text-sm text-stone-300 line-clamp-2 mt-1.5 leading-relaxed hidden xs:block">
              {item.bio || item.firstVideo?.desc}
            </p>
          )}
        </div>

        {/* Bottom row: tags and action button */}
        <div className="pt-2.5 border-t border-stone-750 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 flex-1 overflow-hidden">
            {interestingTitles.length > 0 ? (
              interestingTitles.slice(0, 2).map((t, idx) => (
                <span
                  key={idx}
                  className="bg-stone-850 hover:bg-stone-800 border border-stone-700 px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs text-stone-200 font-medium truncate max-w-[120px] sm:max-w-[160px]"
                >
                  {t}
                </span>
              ))
            ) : (
              <span className="text-[10px] sm:text-xs text-stone-400 font-mono font-semibold">
                {item.videoCount && item.videoCount > 1 ? `${item.videoCount} Items` : 'Exclusive Drop'}
              </span>
            )}
          </div>

          <span className="text-xs sm:text-sm font-mono font-black text-orange-400 group-hover:text-orange-300 group-hover:translate-x-1.5 transition-all flex items-center gap-1 flex-shrink-0">
            View Trend →
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Hero Breaking Leak Slider Widget (Seamless Edge-to-Edge Slideshow) ───────
function HeroSliderWidget({
  featuredItems,
  onSelect,
}: {
  featuredItems: Creator[];
  onSelect: (name: string) => void;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    if (featuredItems.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % featuredItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [featuredItems.length, isPaused]);

  if (!featuredItems || featuredItems.length === 0) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      setCurrentIdx((prev) => (prev + 1) % featuredItems.length);
    } else if (diff < -50) {
      setCurrentIdx((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);
    }
    touchStartXRef.current = null;
    setIsPaused(false);
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-stone-950 border-b border-stone-850 shadow-2xl group select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sliding Track (Edge-to-Edge) */}
      <div className="relative w-full h-[300px] xs:h-[340px] sm:h-[420px] md:h-[500px] lg:h-[560px] overflow-hidden">
        <div
          className="flex h-full w-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIdx * 100}%)` }}
        >
          {featuredItems.map((item, idx) => {
            const bgImage = item.firstVideo?.imageUrl || item.firstVideo?.thumbnailUrl || item.thumbnailUrl;
            return (
              <div
                key={item.name || idx}
                className="relative w-full h-full flex-shrink-0 overflow-hidden"
              >
                {bgImage ? (
                  <img
                    src={bgImage}
                    alt={item.name}
                    className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
                  />
                ) : (
                  <div
                    className="w-full h-full"
                    style={{ backgroundImage: item.gradient }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/35 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-0 z-10 flex flex-col justify-end pb-6 sm:pb-10 px-4 sm:px-6 space-y-2.5 max-w-2xl sm:max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 bg-orange-500 text-stone-950 text-[10px] sm:text-xs font-mono font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xl shadow-orange-500/25">
                      <Flame className="w-3.5 h-3.5 fill-current" />
                      Breaking Leak
                    </span>
                    <span className="bg-stone-900/90 backdrop-blur-md border border-stone-700 text-stone-100 text-[10px] sm:text-xs font-mono font-bold px-3 py-1 rounded-md shadow-md">
                      {item.videoCount || 1} Media Files
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight line-clamp-2 drop-shadow-lg">
                    {item.name}
                  </h3>

                  {item.firstVideo?.title && item.firstVideo.title.toLowerCase() !== item.name.toLowerCase() && (
                    <p className="text-sm sm:text-base font-extrabold text-orange-400 line-clamp-1 drop-shadow-md">
                      {item.firstVideo.title}
                    </p>
                  )}

                  {(item.bio || item.firstVideo?.desc) && (
                    <p className="text-xs sm:text-sm text-stone-200 line-clamp-2 max-w-xl hidden xs:block drop-shadow">
                      {item.bio || item.firstVideo?.desc}
                    </p>
                  )}

                  <div className="pt-2 flex items-center gap-3.5">
                    <button
                      onClick={() => onSelect(item.name)}
                      className="px-6 py-2.5 bg-orange-500 hover:bg-orange-400 text-stone-950 text-xs sm:text-sm font-black rounded-xl flex items-center gap-2 transition shadow-xl shadow-orange-500/40 cursor-pointer active:scale-95 border border-orange-400"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>Watch Trend</span>
                    </button>
                    <span className="text-xs font-mono text-stone-300">
                      Trend: <strong className="text-white">{item.name}</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Home Client Main ─────────────────────────────────────────────────────────
export default function HomeClient({
  initialCreators = [],
}: {
  initialCreators?: Creator[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Creator[]>(initialCreators);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'latest' | 'videos' | 'photos'>('latest');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  // Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Ads: Banner reduced to half desktop size
  const [bannerAd, setBannerAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>({
    enabled: true,
    imageUrl: '/images/sponsor-banner.jpg',
    linkUrl: 'https://www.hexescortsug.com',
  });
  const [popupAd, setPopupAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>(null);
  const [showPopupModal, setShowPopupModal] = useState(false);

  // Keep trends arranged strictly by latest upload order (no shuffling)
  useEffect(() => {
    if (initialCreators && initialCreators.length > 0) {
      setItems(initialCreators);
    }
  }, [initialCreators]);

  // Apply deep-link filters once on mount (/?q=... and /?category=...).
  // The catalog itself is still server-rendered; this only narrows the view.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || params.get('search');
    const category = (params.get('category') || params.get('tab') || '').toLowerCase();

    if (query) setSearchQuery(query);
    if (category.includes('photo') || category.includes('nude')) setActiveTab('photos');
    else if (category.includes('video') || category.includes('trending')) setActiveTab('videos');
  }, []);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch('/api/ads');
        if (res.ok) {
          const data = await res.json();
          if (data.ads?.banner) setBannerAd(data.ads.banner);
          if (data.ads?.popup) setPopupAd(data.ads.popup);
        }
      } catch {}
    };
    fetchAds();
  }, []);

  // Delay the popup so it does not block the initial render, and clean the
  // timer up if the component unmounts first.
  useEffect(() => {
    if (!popupAd?.enabled || !popupAd.imageUrl) return;
    const timer = setTimeout(() => setShowPopupModal(true), 7000);
    return () => clearTimeout(timer);
  }, [popupAd]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  const handleOpenTopic = (topicName: string) => {
    router.push(`/creator/${encodeURIComponent(topicName)}`);
  };

  // Filter pipeline combining search and the bottom-nav tabs
  const filteredItems = items.filter((item) => {
    const needle = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(needle) ||
      (item.bio || '').toLowerCase().includes(needle) ||
      (item.firstVideo?.desc || '').toLowerCase().includes(needle) ||
      (item.firstVideo?.interestingTitles || []).some((t) => t.toLowerCase().includes(needle));

    const matchesTab =
      activeTab === 'latest'
        ? true
        : activeTab === 'videos'
        ? (item.hasVideos ?? (item.firstVideo?.type !== 'image'))
        : (item.hasImages ?? (item.firstVideo?.type === 'image'));

    return matchesSearch && matchesTab;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Top 4 items for the hero carousel
  const featuredHeroItems = items.slice(0, 4);

  return (
    <div className="min-h-screen bg-[#090909] text-stone-200">
      {/* Popup Ad */}
      {showPopupModal && popupAd?.enabled && popupAd?.imageUrl && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
          <div onClick={() => setShowPopupModal(false)} className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-1 shadow-2xl">
            <div className="relative overflow-hidden rounded-[22px] group">
              <button
                onClick={() => setShowPopupModal(false)}
                className="absolute top-3 right-3 z-20 bg-black/40 hover:bg-black/80 backdrop-blur-md text-white/70 hover:text-white p-1.5 rounded-full transition-all border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
              <a
                href={popupAd.linkUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowPopupModal(false)}
                className="block relative aspect-[4/5] w-full"
              >
                <img
                  src={popupAd.imageUrl}
                  alt="Sponsor ad"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-end p-5">
                  <span className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-widest mb-1">
                    Sponsored Content
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-extrabold text-lg leading-tight">Unlock Exclusive Access</span>
                    <span className="bg-orange-600 text-stone-950 font-black text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider">
                      Visit
                    </span>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[2000] md:hidden">
          <div onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="absolute inset-y-0 right-0 w-64 bg-[#0c0c0c] border-l border-stone-800 p-6 flex flex-col justify-between z-10 animate-slideFromRight">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-black border border-orange-500/60 flex-shrink-0">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-extrabold text-white text-base tracking-tighter uppercase">Nude</span>
                  <span className="bg-orange-500 text-black px-1.5 py-0.5 rounded font-black text-xs tracking-tight uppercase">
                    TRENDS
                  </span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 bg-white hover:bg-stone-200 border border-stone-300 rounded-full transition shadow-md flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4 text-black" />
                </button>
              </div>

              {/* Sidebar Channels */}
              <div className="space-y-2 pt-4">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">Channels</span>
                <a
                  href="https://t.me/+d5-D8vyHKuMzZDdk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19.9 3.01L2.24 9.81c-1.13.45-1.12 1.09-.2 1.37l4.53 1.41 10.5-6.62c.5-.3.95-.14.57.2L9.1 14.67v3.38c.33 0 .48-.15.66-.33l1.58-1.54 3.29 2.43c.6.33 1.04.16 1.19-.55l2.16-10.2c.22-.88-.34-1.28-.98-1z" />
                  </svg>
                  <span>Telegram Link</span>
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 bg-black hover:bg-stone-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition border border-stone-800"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>Twitter / X Feed</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-[1000] bg-[#0c0c0c]/95 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden border border-orange-500/60 bg-black flex-shrink-0 shadow-md shadow-orange-500/20">
              <img src="/logo.png" alt="Nude Trends" className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-base tracking-tighter uppercase">Nude</span>
              <span className="bg-orange-500 text-black px-2 py-0.5 rounded font-black text-xs uppercase tracking-wider">
                TRENDS
              </span>
            </div>
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-lg items-center mx-4">
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search trends, models, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg py-1.5 pl-3.5 pr-10 text-xs text-stone-200 focus:outline-none focus:border-orange-500 placeholder:text-stone-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-2.5 flex items-center text-[10px] text-stone-500 hover:text-stone-300"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              onClick={() => searchInputRef.current?.focus()}
              className="bg-stone-900 hover:bg-stone-850 text-stone-300 px-3 py-1.5 rounded-lg ml-1.5 border border-stone-800 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 text-amber-400 hover:text-amber-300 bg-stone-900 border border-amber-500/30 hover:border-amber-400/60 rounded-lg transition"
            title="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Mobile Search Bar (Directly below header) ────────────────────────── */}
      <div className="md:hidden px-4 pt-3 pb-1">
        <div className="w-full flex items-center gap-2">
          <div className="relative flex-1">
            <input
              ref={mobileSearchRef}
              type="text"
              placeholder="Search trends, models, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg py-2 pl-3 pr-3 text-xs text-stone-200 focus:outline-none focus:border-orange-500 placeholder:text-stone-500"
            />
          </div>
          <button
            onClick={() => {
              if (searchQuery) setSearchQuery('');
              else mobileSearchRef.current?.focus();
            }}
            aria-label={searchQuery ? 'Clear search' : 'Focus search'}
            className="bg-orange-500 text-stone-950 px-3 py-2 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
          >
            {searchQuery ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── WIDGET: Hero Breaking Leak Slider (Seamless Edge-to-Edge) ─────────── */}
      <HeroSliderWidget featuredItems={featuredHeroItems} onSelect={handleOpenTopic} />

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
        {/* Sponsor Banner Ad: Reduced to half desktop size (max-w-md / max-w-lg) */}
        {bannerAd?.enabled && bannerAd?.imageUrl && (
          <div className="w-full max-w-xs sm:max-w-sm mx-auto">
            <div className="relative bg-gradient-to-r from-pink-500/20 via-purple-500/10 to-pink-500/20 p-1 rounded-2xl border border-pink-500/40 shadow-xl overflow-hidden group hover:border-pink-400/70 transition-all duration-300">
              <a
                href={bannerAd.linkUrl || 'https://www.hexescortsug.com'}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block w-full aspect-[16/9] rounded-xl overflow-hidden bg-black"
              >
                <img
                  src={bannerAd.imageUrl}
                  alt="Hex Escorts UG - www.hexescortsug.com"
                  className="w-full h-full object-contain sm:object-cover rounded-xl group-hover:scale-[1.01] transition-transform duration-500"
                />

              </a>
            </div>
          </div>
        )}

        {/* ── Section Header: Trending Videos ──────────────────────────────────── */}
        <div className="space-y-6 animate-fadeIn">
          {/* Topics / Trends Grid (Mobile: thumbnail left, info right; Desktop: 2-column) */}
          {paginatedItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {paginatedItems.map((item, idx) => (
                <TopicTrendCard
                  key={item.name}
                  item={item}
                  isRecent={currentPage === 1 && idx < 4}
                  onClick={() => handleOpenTopic(item.name)}
                />
              ))}
            </div>
          ) : (
            <div className="p-16 border border-stone-850 rounded-2xl bg-white/[0.02] text-center space-y-3">
              <Compass className="w-10 h-10 text-stone-600 mx-auto" />
              <div>
                <h4 className="font-bold text-stone-200 text-sm">No trends found</h4>
                <p className="text-xs text-stone-500 mt-1">Try selecting another tab or clear your search.</p>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6 border-t border-stone-900 mt-6 animate-fadeIn">
              <button
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage((p) => Math.max(p - 1, 1));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-stone-950 text-xs font-black font-mono transition shadow-sm disabled:opacity-30 disabled:hover:bg-orange-500 disabled:cursor-not-allowed cursor-pointer"
              >
                &lt; Prev
              </button>

              <span className="text-stone-400 text-xs font-mono font-bold mx-2">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage((p) => Math.min(p + 1, totalPages));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-stone-950 text-xs font-black font-mono transition shadow-sm disabled:opacity-30 disabled:hover:bg-orange-500 disabled:cursor-not-allowed cursor-pointer"
              >
                Next &gt;
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0c0c0c] border-t border-stone-850 py-10 mt-16 text-center md:text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div
              onClick={() => {
                router.push('/');
              }}
              className="font-extrabold text-sm tracking-tight text-white cursor-pointer select-none uppercase"
            >
              Nude <span className="bg-orange-500 text-black px-1.5 py-0.5 rounded-sm tracking-normal ml-0.5">TRENDS</span>
            </div>
            <p className="text-[11px] text-stone-500">Premium adult content and exclusive leaks network.</p>
          </div>

          <p className="text-[11px] text-stone-600 font-mono">© 2026 Nude Trends Networks Inc. All rights reserved.</p>
        </div>
      </footer>

      {/* ── Fixed Bottom Navigation Bar (always visible while scrolling) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-[2000] bg-[#121212]/95 backdrop-blur-md border-t border-stone-750 shadow-2xl shadow-black/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-center gap-2 sm:gap-3">
          <button
            onClick={() => setActiveTab('latest')}
            className={`flex-1 max-w-[160px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-black transition cursor-pointer ${
              activeTab === 'latest'
                ? 'bg-orange-500 text-stone-950 shadow-xl shadow-orange-500/40 border border-orange-400'
                : 'bg-stone-850 text-stone-200 hover:text-white border border-stone-700 hover:border-orange-500/60 shadow-md'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Latest Drops</span>
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 max-w-[160px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-black transition cursor-pointer ${
              activeTab === 'videos'
                ? 'bg-orange-500 text-stone-950 shadow-xl shadow-orange-500/40 border border-orange-400'
                : 'bg-stone-850 text-stone-200 hover:text-white border border-stone-700 hover:border-orange-500/60 shadow-md'
            }`}
          >
            <VideoIcon className="w-4 h-4" />
            <span>Full Videos</span>
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 max-w-[160px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-mono font-black transition cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-orange-500 text-stone-950 shadow-xl shadow-orange-500/40 border border-orange-400'
                : 'bg-stone-850 text-stone-200 hover:text-white border border-stone-700 hover:border-orange-500/60 shadow-md'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Photo Leaks</span>
          </button>
        </div>
      </nav>

    </div>
  );
}

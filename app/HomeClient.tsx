"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  Menu,
  X,
  Play,
  Video as VideoIcon,
  Image as ImageIcon,
  Compass,
} from 'lucide-react';
import { Creator, Video } from './types';

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
  return (
    <div className="w-32 xs:w-36 sm:w-44 md:w-52 h-28 xs:h-32 sm:h-36 md:h-40 rounded-xl bg-stone-950 border border-stone-850 overflow-hidden flex-shrink-0 flex items-center justify-center relative shadow-inner">
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt="Thumbnail"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : imageUrl ? (
        <img
          src={imageUrl}
          alt="Thumbnail"
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center p-3 text-center"
          style={{ backgroundImage: gradient }}
        >
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 border border-white/10 flex items-center justify-center mb-1.5 shadow-sm">
            {isImage ? (
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
            ) : (
              <VideoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
            )}
          </div>
          <span className="font-extrabold text-xs sm:text-sm font-mono text-stone-200 truncate max-w-full px-1">
            {initials || 'NT'}
          </span>
        </div>
      )}

      {/* Format / Duration badge */}
      <span
        className={`absolute bottom-1.5 right-1.5 text-[8px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded font-bold z-20 shadow-md ${
          isImage
            ? 'bg-orange-500 text-stone-950 uppercase font-black'
            : 'bg-stone-950/90 text-stone-300 border border-white/10'
        }`}
      >
        {isImage ? 'PHOTO' : duration || 'VIDEO'}
      </span>

      {/* Media count badge */}
      {mediaCount && mediaCount > 1 ? (
        <span className="absolute top-1.5 left-1.5 bg-stone-950/90 border border-white/10 text-[8px] sm:text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-orange-400 z-20 shadow-md">
          {mediaCount} media
        </span>
      ) : null}

      {/* Play hover button */}
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-500 text-stone-950 flex items-center justify-center shadow-xl">
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
}: {
  item: Creator;
  onClick: () => void;
}) {
  const isImage = item.firstVideo?.type === 'image';
  const duration = item.firstVideo?.duration || (isImage ? 'PHOTO' : '03:45');
  const interestingTitles = item.firstVideo?.interestingTitles || [];
  const initials = item.name.substring(0, 3).toUpperCase();

  return (
    <div
      onClick={onClick}
      className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] p-3.5 sm:p-4 md:p-5 rounded-2xl flex flex-row gap-3 sm:gap-4 md:gap-5 hover:border-orange-500/40 hover:bg-white/[0.06] transition-all shadow-md group cursor-pointer"
    >
      {/* Left Thumbnail (clear photo/thumbnail, NO heavy video streams) */}
      <FastTopicThumb
        thumbnailUrl={item.thumbnailUrl}
        imageUrl={item.firstVideo?.imageUrl}
        gradient={item.gradient}
        initials={initials}
        isImage={isImage}
        duration={duration}
        mediaCount={item.videoCount}
      />

      {/* Right Details (Always to the right on both mobile and desktop) */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1 space-y-2">
        <div>
          <div className="flex justify-between items-start gap-1">
            <h3
              className="font-bold text-stone-100 text-sm sm:text-base md:text-lg line-clamp-2 leading-snug group-hover:text-orange-400 transition-colors"
              title={item.name}
            >
              {item.name}
            </h3>
          </div>

          <p className="text-[10px] sm:text-xs text-stone-400 font-mono mt-1 truncate">
            Trend: <span className="text-stone-300 font-semibold">{item.name}</span> {item.firstVideo?.views ? `• ${item.firstVideo.views}` : ''}
          </p>

          {(item.bio || item.firstVideo?.desc) && (
            <p className="text-xs sm:text-sm text-stone-400 line-clamp-2 mt-1.5 leading-relaxed hidden xs:block">
              {item.bio || item.firstVideo?.desc}
            </p>
          )}
        </div>

        {/* Bottom row: tags and action button */}
        <div className="pt-2 border-t border-stone-850 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5 flex-1 overflow-hidden">
            {interestingTitles.length > 0 ? (
              interestingTitles.slice(0, 2).map((t, idx) => (
                <span
                  key={idx}
                  className="bg-stone-900 border border-stone-800 px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] text-stone-300 truncate max-w-[120px] sm:max-w-[160px]"
                >
                  {t}
                </span>
              ))
            ) : (
              <span className="text-[9px] sm:text-[10px] text-stone-500 font-mono">
                {item.videoCount && item.videoCount > 1 ? `${item.videoCount} Items` : 'Fresh Drop'}
              </span>
            )}
          </div>

          <span className="text-xs sm:text-sm font-mono font-bold text-orange-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 flex-shrink-0">
            View Trend →
          </span>
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
  initialVideos?: Video[];
}) {
  const router = useRouter();
  const [items, setItems] = useState<Creator[]>(initialCreators);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Notification
  const [notification, setNotification] = useState<string | null>(null);

  // Ads: Banner reduced to half desktop size
  const [bannerAd, setBannerAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>({
    enabled: true,
    imageUrl: '/images/sponsor-banner.jpg',
    linkUrl: 'https://www.hexescortsug.com',
  });
  const [popupAd, setPopupAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>(null);
  const [showPopupModal, setShowPopupModal] = useState(false);

  // Randomly shuffle topics/trends on every refresh/mount
  useEffect(() => {
    if (initialCreators && initialCreators.length > 0) {
      const shuffled = [...initialCreators];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setItems(shuffled);
    }
  }, [initialCreators]);

  useEffect(() => {
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
      } catch {}
    };
    fetchAds();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const handleOpenTopic = (topicName: string) => {
    router.push(`/creator/${encodeURIComponent(topicName)}`);
  };

  // Filtered list
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.bio || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.firstVideo?.desc || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="min-h-screen bg-[#090909] text-stone-200">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[3000] bg-orange-600 border border-orange-500 text-stone-950 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-slideUp font-bold text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

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

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Mobile Search Input */}
        <div className="md:hidden w-full flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search trends, models, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 rounded-lg py-2 pl-3 pr-3 text-xs text-stone-200 focus:outline-none focus:border-orange-500 placeholder:text-stone-500"
            />
          </div>
          <button
            onClick={() => setSearchQuery('')}
            className="bg-orange-500 text-stone-950 px-3 py-2 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sponsor Banner Ad: Reduced to half desktop size (max-w-md / max-w-lg) */}
        {bannerAd?.enabled && bannerAd?.imageUrl && (
          <div className="w-full max-w-md sm:max-w-lg mx-auto">
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
                <span className="absolute bottom-2 right-2 bg-black/85 backdrop-blur-md text-[8px] font-mono font-black text-pink-400 px-1.5 py-0.5 rounded border border-pink-500/30 uppercase tracking-widest shadow-md">
                  SPONSOR AD
                </span>
              </a>
            </div>
          </div>
        )}

        {/* ── Section Header: Trending Videos (NO NUMBER) ──────────────────────── */}
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-stone-850 pb-3">
            <h2 className="text-xs font-extrabold text-orange-400 uppercase tracking-widest flex items-center gap-2">
              <VideoIcon className="w-3.5 h-3.5 text-orange-500" />
              <span>Trending Videos</span>
            </h2>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-orange-500 hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Topics / Trends Grid (Mobile: thumbnail left, info right; Desktop: 2-column) */}
          {paginatedItems.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
              {paginatedItems.map((item) => (
                <TopicTrendCard
                  key={item.name}
                  item={item}
                  onClick={() => handleOpenTopic(item.name)}
                />
              ))}
            </div>
          ) : (
            <div className="p-16 border border-stone-850 rounded-2xl bg-white/[0.02] text-center space-y-3">
              <Compass className="w-10 h-10 text-stone-600 mx-auto" />
              <div>
                <h4 className="font-bold text-stone-200 text-sm">No trends found</h4>
                <p className="text-xs text-stone-500 mt-1">Try another keyword or clear search filter.</p>
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

          <div className="flex items-center justify-center flex-wrap gap-4 text-xs text-stone-400">
            <span className="hover:text-orange-500 transition-colors">Premium Network</span>
            <span className="text-stone-700">•</span>
            <span className="hover:text-orange-500 transition-colors">Exclusive Creators</span>
            <span className="text-stone-700">•</span>
            <span className="hover:text-orange-500 transition-colors">Trends & Updates</span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-black hover:bg-stone-900 border border-stone-800 flex items-center justify-center text-white transition-all shadow-md"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://t.me/+d5-D8vyHKuMzZDdk"
              target="_blank"
              rel="noopener noreferrer"
              className="w-8 h-8 rounded-full bg-[#0088cc] hover:bg-[#0077b3] flex items-center justify-center text-white transition-all shadow-md"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19.9 3.01L2.24 9.81c-1.13.45-1.12 1.09-.2 1.37l4.53 1.41 10.5-6.62c.5-.3.95-.14.57.2L9.1 14.67v3.38c.33 0 .48-.15.66-.33l1.58-1.54 3.29 2.43c.6.33 1.04.16 1.19-.55l2.16-10.2c.22-.88-.34-1.28-.98-1z" />
              </svg>
            </a>
          </div>

          <p className="text-[11px] text-stone-600 font-mono">© 2026 Nude Trends Networks Inc. All rights reserved.</p>
        </div>
      </footer>

      {/* Secret admin trigger */}
      <div className="fixed bottom-3 left-3 z-[2500]">
        <Link
          href="/login"
          className="w-3.5 h-3.5 bg-stone-900/10 hover:bg-stone-900/40 border border-white/5 rounded flex items-center justify-center opacity-10 hover:opacity-100 transition-all duration-300 cursor-default select-none text-[8px] text-stone-700 hover:text-stone-400 font-mono"
          title="Access Portal"
        >
          .
        </Link>
      </div>
    </div>
  );
}

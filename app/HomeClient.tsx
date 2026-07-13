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
  TrendingUp,
  Play,
  Video as VideoIcon,
  Image as ImageIcon,
  Share2,
  ArrowLeft,
  VideoOff,
} from 'lucide-react';
import { Creator, Video } from './types';
import VideoPlayer from './components/VideoPlayer';
import CommentsSection from './components/CommentsSection';

// ─── Topic Card ───────────────────────────────────────────────────────────────
function TopicCard({
  creator,
  priority = false,
  onDirectPlay,
}: {
  creator: Creator;
  priority?: boolean;
  onDirectPlay: (video: Video) => void;
}) {
  const router = useRouter();

  const handleClick = () => {
    if (creator.hasTopicPage) {
      router.push(`/creator/${encodeURIComponent(creator.name)}`);
    } else if (creator.firstVideo) {
      onDirectPlay(creator.firstVideo);
    }
  };

  const showVideoThumb = !creator.thumbnailUrl && creator.videoUrl;

  return (
    <div
      onClick={handleClick}
      className="group relative aspect-video cursor-pointer bg-stone-950 border border-stone-900 rounded-xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-xl hover:border-orange-500/40 hover:scale-[1.01]"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Gradient fallback */}
      <div
        style={{ backgroundImage: creator.gradient }}
        className="absolute inset-0 w-full h-full"
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative z-10 w-12 h-12 rounded-full bg-black/60 border border-white/10 flex items-center justify-center">
            <span className="font-extrabold text-sm font-mono text-stone-300">
              {creator.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Static thumbnail image */}
      {creator.thumbnailUrl && (
        <Image
          fill
          src={creator.thumbnailUrl}
          alt={creator.name}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="z-10 object-cover pointer-events-none"
          priority={priority}
        />
      )}

      {/* Auto-generated video thumbnail */}
      {showVideoThumb && (
        <video
          src={`${creator.videoUrl}#t=20`}
          preload="metadata"
          muted
          playsInline
          className="absolute inset-0 z-10 w-full h-full object-cover pointer-events-none"
        />
      )}

      {/* Video count badge */}
      {creator.videoCount && creator.videoCount > 1 && (
        <div className="absolute z-30 top-2 left-2 bg-stone-950/80 border border-white/10 text-[10px] font-mono font-bold px-2 py-0.5 rounded text-orange-400 pointer-events-none">
          {creator.videoCount} videos
        </div>
      )}

      {/* Topic page indicator */}
      {creator.hasTopicPage && (
        <div className="absolute z-30 top-2 right-2 bg-orange-500/90 text-[9px] font-mono font-black px-1.5 py-0.5 rounded text-stone-950 pointer-events-none uppercase tracking-wide">
          Series
        </div>
      )}

      {/* Play button (single video topics) */}
      {!creator.hasTopicPage && (
        <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-black/60 border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
          <Play className="w-4 h-4 fill-white text-white ml-0.5" />
        </div>
      )}

      {/* Title overlay */}
      <div className="absolute z-30 inset-x-0 bottom-0 bg-gradient-to-t from-stone-950 via-stone-950/80 to-transparent pt-12 px-3 pb-3 pointer-events-none">
        <h4 className="text-white text-[14px] font-bold line-clamp-2 leading-snug drop-shadow-md">
          {creator.name}
        </h4>
      </div>
    </div>
  );
}

// ─── Home Client ──────────────────────────────────────────────────────────────
export default function HomeClient({ initialCreators }: { initialCreators: Creator[] }) {
  const [creators] = useState<Creator[]>(initialCreators);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Inline watch view (for single-video topics with no dedicated page)
  const [activeView, setActiveView] = useState<'grid' | 'watch'>('grid');
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  // Notification
  const [notification, setNotification] = useState<string | null>(null);

  // Ads
  const [bannerAd, setBannerAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>(null);
  const [popupAd, setPopupAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>(null);
  const [showPopupModal, setShowPopupModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
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

  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleShare = (video: Video) => {
    const shareUrl = `${window.location.origin}/?watch=${video.id}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => triggerNotification('Copied stream link!')).catch(() => triggerNotification('Could not copy link.'));
    } else {
      const el = document.createElement('input');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      triggerNotification('Copied stream link!');
    }
  };

  const handleDirectPlay = (video: Video) => {
    setActiveVideo(video);
    setActiveView('watch');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredCreators = creators.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCreators.length / ITEMS_PER_PAGE);
  const paginatedCreators = filteredCreators.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <>
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
              <button onClick={() => setShowPopupModal(false)} className="absolute top-3 right-3 z-20 bg-black/40 hover:bg-black/80 backdrop-blur-md text-white/70 hover:text-white p-1.5 rounded-full transition-all border border-white/10">
                <X className="w-4 h-4" />
              </button>
              <a href={popupAd.linkUrl || '#'} target="_blank" rel="noopener noreferrer" onClick={() => setShowPopupModal(false)} className="block relative aspect-[4/5] w-full">
                <img src={popupAd.imageUrl} alt="Sponsor ad" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-end p-5">
                  <span className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-widest mb-1">Sponsored Content</span>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-extrabold text-lg leading-tight">Unlock Exclusive Access</span>
                    <span className="bg-orange-600 text-stone-950 font-black text-[10px] px-3 py-1.5 rounded-lg uppercase tracking-wider">Visit</span>
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
              {/* Sidebar header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-black border border-orange-500/60 flex-shrink-0">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-extrabold text-white text-base tracking-tighter uppercase">Nude</span>
                  <span className="bg-orange-500 text-black px-1.5 py-0.5 rounded font-black text-xs tracking-tight uppercase">TRENDS</span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 bg-white hover:bg-stone-200 border border-stone-300 rounded-full transition shadow-md flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4 text-black" />
                </button>
              </div>

              {/* Sidebar links */}
              <div className="space-y-2.5 pt-4">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">Browse</span>
                <button
                  onClick={() => { setActiveView('grid'); setSearchQuery(''); setIsSidebarOpen(false); }}
                  className="w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-orange-600 text-stone-950"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>All Topics</span>
                </button>
              </div>
            </div>

            {/* Sidebar bottom: Social links */}
            <div className="space-y-2 pt-4 border-t border-stone-900">
              <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">Channels</span>
              <a href="https://t.me/+d5-D8vyHKuMzZDdk" target="_blank" rel="noopener noreferrer"
                className="w-full py-2 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.9 3.01L2.24 9.81c-1.13.45-1.12 1.09-.2 1.37l4.53 1.41 10.5-6.62c.5-.3.95-.14.57.2L9.1 14.67v3.38c.33 0 .48-.15.66-.33l1.58-1.54 3.29 2.43c.6.33 1.04.16 1.19-.55l2.16-10.2c.22-.88-.34-1.28-.98-1z" />
                </svg>
                <span>Telegram Link</span>
              </a>
              <a href="https://x.com" target="_blank" rel="noopener noreferrer"
                className="w-full py-2 bg-black hover:bg-stone-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition border border-stone-800">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Twitter / X Feed</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-[1000] bg-[#090909]/92 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          <Link href="/" className="flex items-center gap-2 cursor-pointer group" onClick={() => { setActiveView('grid'); setActiveVideo(null); }}>
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

          {/* Desktop search */}
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
                <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-3 flex items-center text-xs text-stone-500 hover:text-stone-300">Clear</button>
              )}
            </div>
            <button
              onClick={() => searchInputRef.current?.focus()}
              className="bg-orange-500 hover:bg-orange-400 text-stone-950 px-5 py-2 rounded-r-full flex items-center justify-center border border-orange-500 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Hamburger — orange/gold, mobile only */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 text-amber-400 hover:text-amber-300 bg-stone-900 border border-amber-500/30 hover:border-amber-400/60 rounded-lg transition shadow-sm shadow-amber-500/10"
            title="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* Mobile search */}
        {activeView === 'grid' && (
          <div className="md:hidden w-full flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search topics or models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-900 border border-stone-800 rounded-xl py-2.5 pl-4 pr-4 text-xs text-stone-200 focus:outline-none focus:border-orange-500 placeholder:text-stone-500"
              />
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="bg-orange-500 hover:bg-orange-400 text-stone-950 px-4 py-2.5 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Banner Ad */}
        {bannerAd?.enabled && bannerAd?.imageUrl && (
          <div className="w-full bg-[#111111] border border-orange-500/25 p-1 rounded-xl overflow-hidden group shadow-lg">
            <a href={bannerAd.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="w-full h-20 sm:h-24 relative block">
              <img src={bannerAd.imageUrl} alt="Sponsor" className="w-full h-full object-cover rounded-lg group-hover:scale-[1.005] transition-transform duration-300" />
              <span className="absolute bottom-2 right-2 bg-stone-950/85 backdrop-blur-sm text-[8px] font-mono font-black text-orange-400 px-2 py-0.5 rounded border border-orange-500/20 uppercase">SPONSOR AD</span>
            </a>
          </div>
        )}

        {/* ── GRID VIEW ───────────────────────────────────────────────────────── */}
        {activeView === 'grid' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-850 pb-3 gap-3">
              <div>
                <h3 className="text-base font-extrabold text-stone-200 tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500 animate-pulse" />
                  <span>🔥 TRENDING NOW — Exclusive Leaks & Uncensored Content</span>
                </h3>
                <p className="text-xs text-stone-500 mt-1">Fresh drops updated daily ({filteredCreators.length} available)</p>
              </div>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-orange-500 hover:underline">Clear Search</button>
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
                      onDirectPlay={handleDirectPlay}
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-8 border-t border-stone-900 mt-8 animate-fadeIn">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => { setCurrentPage(p => Math.max(p - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-850 hover:border-stone-700 text-stone-400 hover:text-white text-xs font-bold font-mono transition disabled:opacity-30 disabled:hover:bg-stone-900 disabled:hover:text-stone-400 disabled:cursor-not-allowed"
                    >
                      &lt; Prev
                    </button>

                    <span className="text-stone-400 text-xs font-mono font-bold mx-2">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => { setCurrentPage(p => Math.min(p + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-850 hover:border-stone-700 text-stone-400 hover:text-white text-xs font-bold font-mono transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >Next &gt;</button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-16 border border-stone-800 rounded-2xl bg-[#111111]/30 text-center space-y-4">
                <Compass className="w-12 h-12 text-stone-600 mx-auto" />
                <div>
                  <h4 className="font-bold text-stone-200">No topics matched your search</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">Try a different query or clear the search.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── INLINE WATCH VIEW (single-video topics) ───────────────────────── */}
        {activeView === 'watch' && activeVideo && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <button
              onClick={() => { setActiveView('grid'); setActiveVideo(null); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 text-xs font-mono font-bold text-stone-400 hover:text-white rounded-lg transition cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Topics</span>
            </button>

            <div className="space-y-4">
              {activeVideo.type === 'image' ? (
                <>
                  <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-stone-800 shadow-xl flex items-center justify-center select-none">
                    <img src={activeVideo.imageUrl || activeVideo.thumbnailUrl || '/images/v2.png'} alt={activeVideo.title} className="w-full h-full object-contain" />
                    <div className="absolute top-4 right-4 bg-stone-950/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/5 text-[9px] font-mono font-black text-orange-400 uppercase tracking-widest shadow">
                      Premium Nude Image
                    </div>
                  </div>
                  <CommentsSection videoId={activeVideo.id} />
                </>
              ) : (
                <VideoPlayer video={activeVideo} />
              )}

              {/* Action bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-stone-900">
                <h1 className="text-lg font-black text-white font-mono tracking-tight flex-1">{activeVideo.title || 'Untitled Media'}</h1>
                <button
                  onClick={() => handleShare(activeVideo)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition border border-stone-800 hover:border-stone-700 cursor-pointer flex-shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
              </div>

              {/* Metadata */}
              <div className="py-1.5 space-y-1">
                <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
                  <span className="font-bold text-stone-300">{activeVideo.creator}</span>
                  <span>•</span>
                  <span>{activeVideo.views}</span>
                  <span>•</span>
                  <span>{activeVideo.time}</span>
                </div>
                {activeVideo.desc && (
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed bg-stone-900/10 p-3 rounded-xl border border-stone-900/50">{activeVideo.desc}</p>
                )}
              </div>

              {/* Banner ad on watch page */}
              {bannerAd?.enabled && bannerAd?.imageUrl && (
                <div className="w-full bg-[#111111] border border-orange-500/20 p-1 rounded-xl overflow-hidden group shadow-lg mt-4">
                  <a href={bannerAd.linkUrl || '#'} target="_blank" rel="noopener noreferrer" className="w-full h-16 sm:h-20 relative block">
                    <img src={bannerAd.imageUrl} alt="Sponsor" className="w-full h-full object-cover rounded-lg group-hover:scale-[1.005] transition-transform duration-300" />
                    <span className="absolute bottom-2 right-2 bg-stone-950/80 backdrop-blur-sm text-[8px] font-mono font-black text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20 uppercase">SPONSOR</span>
                  </a>
                </div>
              )}

              {/* Related Videos: You May Also Like */}
              <div className="pt-8 border-t border-stone-850 mt-8">
                <h3 className="text-sm font-extrabold text-stone-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-orange-500" />
                  <span>You May Also Like</span>
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {creators
                    .filter(c => c.name !== activeVideo.creator) // don't show current topic
                    .sort(() => Math.random() - 0.5) // shuffle
                    .slice(0, 8) // get 8
                    .map(creator => (
                      <div key={creator.name} className="scale-95 origin-top-left hover:scale-100 transition-transform">
                        <TopicCard
                          creator={creator}
                          onDirectPlay={handleDirectPlay}
                        />
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-[#111111] border-t border-white/5 py-10 mt-16 text-center md:text-left">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div onClick={() => { setActiveView('grid'); setActiveVideo(null); }} className="font-extrabold text-sm tracking-tight text-white cursor-pointer select-none uppercase">
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
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-black hover:bg-stone-900 border border-stone-800 flex items-center justify-center text-white transition-all shadow-md">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </a>
            <a href="https://t.me/+d5-D8vyHKuMzZDdk" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#0088cc] hover:bg-[#0077b3] flex items-center justify-center text-white transition-all shadow-md">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M19.9 3.01L2.24 9.81c-1.13.45-1.12 1.09-.2 1.37l4.53 1.41 10.5-6.62c.5-.3.95-.14.57.2L9.1 14.67v3.38c.33 0 .48-.15.66-.33l1.58-1.54 3.29 2.43c.6.33 1.04.16 1.19-.55l2.16-10.2c.22-.88-.34-1.28-.98-1z" /></svg>
            </a>
          </div>

          <p className="text-[11px] text-stone-600 font-mono">© 2026 Nude Trends Networks Inc. All rights reserved.</p>
        </div>
      </footer>

      {/* Secret admin trigger */}
      <div className="fixed bottom-3 left-3 z-[2500]">
        <Link href="/login" className="w-3.5 h-3.5 bg-stone-900/10 hover:bg-stone-900/40 border border-white/5 rounded flex items-center justify-center opacity-10 hover:opacity-100 transition-all duration-300 cursor-default select-none text-[8px] text-stone-700 hover:text-stone-400 font-mono" title="Access Portal">.</Link>
      </div>
    </>
  );
}

"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Compass, 
  TrendingUp, 
  Search, 
  UploadCloud, 
  CheckCircle2, 
  MessageSquare, 
  ThumbsUp, 
  Share2, 
  VideoOff,
  Play,
  Download,
  ChevronDown,
  Menu,
  X,
  ArrowLeft,
  ImageIcon,
  Video as VideoIcon
} from 'lucide-react';
import { Video } from './types';
import VideoPlayer from './components/VideoPlayer';
import CommentsSection from './components/CommentsSection';

function VideoCard({ vid, onClick, priority = false }: { vid: Video; onClick: () => void; priority?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isMobilePeeking, setIsMobilePeeking] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const peekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isImage = vid.type === 'image';

  useEffect(() => {
    if (!containerRef.current || isImage) return;
    const isTouchDevice = window.matchMedia('(hover: none)').matches;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (isTouchDevice) {
          if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
          setIsMobilePeeking(true);
          peekTimerRef.current = setTimeout(() => setIsMobilePeeking(false), 3000);
        }
      } else {
        if (isTouchDevice) {
          setIsMobilePeeking(false);
          if (peekTimerRef.current) clearTimeout(peekTimerRef.current);
        }
      }
    }, { threshold: 0.4 });

    observer.observe(containerRef.current);
    return () => { observer.disconnect(); if (peekTimerRef.current) clearTimeout(peekTimerRef.current); };
  }, [isImage]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || isImage) return;
    const shouldPlay = isHovered || isMobilePeeking;
    if (shouldPlay) {
      el.play().catch(() => {});
    } else {
      el.pause();
      try { el.currentTime = 0; } catch (e) {}
    }
  }, [isHovered, isMobilePeeking, isImage]);

  return (
    <div
      ref={containerRef}
      onClick={onClick}
      onMouseEnter={() => !isImage && setIsHovered(true)}
      onMouseLeave={() => !isImage && setIsHovered(false)}
      className="group relative aspect-video cursor-pointer bg-stone-950 border border-stone-900 rounded-xl overflow-hidden transition-all duration-200 shadow-sm hover:shadow-lg hover:border-orange-500/30"
      style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
    >
      {/* Gradient fallback - always behind everything */}
      <div
        style={{ backgroundImage: vid.gradient }}
        className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 w-10 h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-stone-300">
          <span className="font-extrabold text-xs font-mono">{vid.initials || 'PL'}</span>
        </div>
      </div>

      {/* Thumbnail / image - z-10 sits above gradient */}
      {isImage ? (
        <Image
          fill
          src={vid.imageUrl || vid.thumbnailUrl || "/images/v2.png"}
          alt={vid.title || 'Content thumbnail'}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="z-10 object-cover pointer-events-none"
          priority={priority}
        />
      ) : vid.thumbnailUrl ? (
        <Image
          fill
          src={vid.thumbnailUrl}
          alt={vid.title || 'Video thumbnail'}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="z-10 object-cover pointer-events-none"
          priority={priority}
        />
      ) : vid.videoUrl && isInView ? (
        <video
          src={`${vid.videoUrl}#t=20`}
          preload="metadata"
          muted
          playsInline
          loop
          className="relative z-10 w-full h-full object-cover pointer-events-none"
        />
      ) : null}

      {/* Duration badge - top right */}
      {!isImage && (
        <span className="absolute z-30 top-2 right-2 bg-stone-950/80 border border-white/5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-stone-300 pointer-events-none select-none">
          {vid.duration}
        </span>
      )}

      {/* Play button - only when not playing */}
      {!isImage && !isHovered && !isMobilePeeking && (
        <div className="absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-black/70 border border-white/10 rounded-full flex items-center justify-center pointer-events-none">
          <Play className="w-4 h-4 fill-white text-white ml-0.5" />
        </div>
      )}

      {/* Title overlay - z-30, always visible at bottom */}
      <div className="absolute z-30 inset-x-0 bottom-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent pt-8 px-3 pb-2.5 pointer-events-none">
        <h4 className="text-white text-[13px] font-bold line-clamp-2 leading-snug">
          {vid.title || 'Untitled Media'}
        </h4>
      </div>
    </div>
  );
}

function LatestDropCard({ vid, onClick, priority = false }: { vid: Video; onClick: () => void; priority?: boolean }) {
  const isImage = vid.type === 'image';
  
  // Format date loosely based on the requested screenshot, or fallback
  const dateStr = vid.time || '04 Jun 2026';

  return (
    <div
      onClick={onClick}
      className="group relative w-full aspect-[16/9] md:aspect-[21/9] cursor-pointer bg-stone-950 rounded-2xl overflow-hidden transition-all duration-200 shadow-lg border border-stone-800"
      style={{ WebkitTapHighlightColor: 'transparent', outline: 'none' }}
    >
      {/* Background gradient fallback */}
      <div
        style={{ backgroundImage: vid.gradient }}
        className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {isImage ? (
        <Image
          fill
          src={vid.imageUrl || vid.thumbnailUrl || "/images/v2.png"}
          alt={vid.title || 'Content preview'}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="z-10 object-cover pointer-events-none"
          priority={priority}
        />
      ) : vid.thumbnailUrl ? (
        <Image
          fill
          src={vid.thumbnailUrl}
          alt={vid.title || 'Video thumbnail'}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="z-10 object-cover pointer-events-none"
          priority={priority}
        />
      ) : vid.videoUrl ? (
        <video
          src={`${vid.videoUrl}#t=20`}
          preload="metadata"
          muted
          playsInline
          className="absolute inset-0 z-10 w-full h-full object-cover pointer-events-none"
        />
      ) : (
        <Image
          fill
          src="/images/v2.png"
          alt={vid.title || 'Content preview'}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="z-10 object-cover pointer-events-none"
        />
      )}

      {/* Play button overlay on top right */}
      {!isImage && (
        <div className="absolute z-20 top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center pointer-events-none">
          <Play className="w-5 h-5 text-white ml-0.5 fill-transparent" />
        </div>
      )}

      {/* Text overlay */}
      <div className="absolute z-30 inset-x-0 bottom-0 bg-gradient-to-t from-stone-950 via-stone-950/70 to-transparent pt-20 px-5 pb-5 pointer-events-none flex flex-col items-start">
        <span className="bg-[#f03e16] text-white text-[12px] font-bold px-3 py-1 rounded-full lowercase tracking-wide mb-2">
          {isImage ? 'nudes' : 'video'}
        </span>
        <h4 className="text-white text-lg sm:text-xl md:text-2xl font-bold line-clamp-2 leading-tight drop-shadow-md">
          {vid.title || 'Untitled Media'}
        </h4>
        <p className="text-stone-300 text-xs sm:text-sm mt-2 font-bold drop-shadow-md">
          {dateStr}
        </p>
      </div>
    </div>
  );
}

export default function HomeClient({ initialVideos }: { initialVideos: Video[] }) {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [activeView, setActiveView] = useState<'landing' | 'watch'>('landing');
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('Trending Videos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Modals visibility
  const [notification, setNotification] = useState<string | null>(null);
  
  // Mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Storage and configuration states loaded from Admin Panel
  const [interestingTitlesMap, setInterestingTitlesMap] = useState<Record<string, string[]>>({});
  const [bannerAd, setBannerAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>(null);
  const [popupAd, setPopupAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>(null);
  const [showPopupModal, setShowPopupModal] = useState(false);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Auto-scroll Latest Drops carousel (5s slides)
  useEffect(() => {
    if (isCarouselPaused) return;

    const typeFilter = selectedCategory === 'Trending Videos' ? 'video' : 'image';
    const latestCount = videos.filter(v => v.type === typeFilter).slice(0, 5).length;
    if (latestCount <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % latestCount);
    }, 3500);

    return () => clearInterval(interval);
  }, [videos, selectedCategory, isCarouselPaused]);

  // Reset index when category changes
  useEffect(() => {
    setCurrentSlideIndex(0);
  }, [selectedCategory]);

  // On mount: mark client-rendered, build interestingTitles from SSR video data, load ads
  useEffect(() => {
    setIsClient(true);

    // Build interesting titles map from the initial server-side video data.
    // This avoids reading stale data from localStorage.
    const titleMap: Record<string, string[]> = {};
    initialVideos.forEach((v) => {
      if (v.interestingTitles && v.interestingTitles.length > 0) {
        titleMap[v.id] = v.interestingTitles;
      }
    });
    setInterestingTitlesMap(titleMap);

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
  }, [initialVideos]);

  // When a video is selected, scroll up
  // (Comments are handled exclusively by <CommentsSection> inside <VideoPlayer>)

  // Sync state back to window URL query parameters (only runs on the client)
  useEffect(() => {
    if (!isClient) return;
    const url = new URL(window.location.href);
    if (activeView === 'watch' && activeVideo) {
      url.searchParams.set('watch', activeVideo.id);
    } else {
      url.searchParams.delete('watch');
    }
    window.history.pushState({}, '', url.pathname + url.search);
  }, [activeView, activeVideo, isClient]);

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  // Categories
  const categories = [
    'Trending Videos',
    'Nudes'
  ];

  // Search and Category filters
  const filteredVideos = videos.filter((vid) => {
    // 1. Filter by Category & Type
    let matchesCategory = true;
    if (selectedCategory === 'Trending Videos') {
      matchesCategory = vid.type === 'video';
    } else if (selectedCategory === 'Nudes') {
      matchesCategory = vid.type === 'image';
    }

    // 2. Search query matches
    const matchesQuery = 
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.desc.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesQuery;
  });

  // Pagination calculation
  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVideos = filteredVideos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Load a video/image into watch view
  const handleSelectVideo = (video: Video) => {
    setActiveVideo(video);
    setActiveView('watch');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleShare = (video: Video) => {
    const shareUrl = `${window.location.origin}/?watch=${video.id}`;
    // Use clipboard API with a graceful fallback for non-HTTPS origins
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        triggerNotification('Copied stream link to clipboard!');
      }).catch(() => {
        triggerNotification('Could not copy link.');
      });
    } else {
      // Fallback: create a temporary input element
      const el = document.createElement('input');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      triggerNotification('Copied stream link to clipboard!');
    }
  };

  return (
    <>
      {/* Dynamic Popups */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[3000] bg-orange-600 border border-orange-500 text-stone-950 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-slideUp font-bold text-xs">
          <CheckCircle2 className="w-4 h-4 text-stone-950" />
          <span>{notification}</span>
        </div>
      )}

      {/* Pop-up Ad Modal Overlay */}
      {showPopupModal && popupAd && popupAd.enabled && popupAd.imageUrl && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-4">
          <div 
            onClick={() => setShowPopupModal(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
          />
          <div className="relative z-10 w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-1 shadow-2xl animate-scaleUp">
            <div className="relative overflow-hidden rounded-[22px] group">
              <button 
                onClick={() => setShowPopupModal(false)}
                className="absolute top-3 right-3 z-20 bg-black/40 hover:bg-black/80 backdrop-blur-md text-white/70 hover:text-white p-1.5 rounded-full transition-all border border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
              
              <a 
                href={popupAd.linkUrl || "#"} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={() => setShowPopupModal(false)}
                className="block relative aspect-[4/5] w-full"
              >
                <img src={popupAd.imageUrl} alt="Sponsor ad" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent flex flex-col justify-end p-5">
                  <span className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-widest mb-1 shadow-black drop-shadow-md">
                    Sponsored Content
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="text-white font-extrabold text-lg shadow-black drop-shadow-lg leading-tight">
                      Unlock Exclusive Access
                    </span>
                    <span className="bg-orange-600 text-stone-950 font-black text-[10px] px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-wider group-hover:bg-orange-500 transition-colors">
                      Visit
                    </span>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-[1000] bg-[#090909]/92 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo with circular image */}
          <div 
            onClick={() => { setActiveView('landing'); }}
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
          </div>

          {/* Core Central Search Wrap (hidden on mobile header) */}
          <div className="hidden md:flex flex-1 max-w-xl items-center">
            <div className="relative flex-1">
              <input 
                ref={searchInputRef}
                type="text"
                placeholder="Search videos, models, or categories..."
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

          {/* Header Navigation Actions (CRITICAL: Visible Admin Control link removed) */}
          <div className="flex items-center gap-2">
            {/* Mobile Sidebar Hamburger Button */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-stone-400 hover:text-orange-500 bg-stone-900 border border-stone-850 rounded-lg transition"
              title="Open Navigation"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Sliding Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[2000] md:hidden">
          {/* Animation defined in globals.css as .animate-slideFromRight */}

          {/* Sidebar Backdrop Overlay */}
          <div 
            onClick={() => setIsSidebarOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />
          
          {/* Sidebar drawer body (sliding from right) */}
          <div className="absolute inset-y-0 right-0 w-64 bg-[#0c0c0c] border-l border-stone-800 p-6 flex flex-col justify-between z-10 animate-slideFromRight">
            <div className="space-y-6">
              
              {/* Header and Close button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-black border border-orange-500/60 flex-shrink-0">
                    <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
                  </div>
                  <span className="font-extrabold text-white text-base tracking-tighter uppercase">
                    Nude
                  </span>
                  <span className="bg-orange-500 text-black px-1.5 py-0.5 rounded font-black text-xs tracking-tight uppercase">
                    TRENDS
                  </span>
                </div>
                
                {/* Black X Close Button with white circular background */}
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 bg-white hover:bg-stone-200 border border-stone-300 rounded-full transition shadow-md flex items-center justify-center cursor-pointer"
                  title="Close Navigation"
                >
                  <X className="w-4 h-4 text-black font-extrabold" />
                </button>
              </div>

              {/* Sidebar Menu options */}
              <div className="space-y-2.5 pt-4">
                <span className="text-[10px] font-mono text-stone-550 uppercase tracking-widest block">Categories</span>
                
                <button
                  onClick={() => {
                    setSelectedCategory('Trending Videos');
                    setActiveView('landing');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    selectedCategory === 'Trending Videos' && activeView === 'landing'
                      ? 'bg-orange-600 text-stone-950'
                      : 'bg-stone-900/50 hover:bg-stone-900 text-stone-400 hover:text-white'
                  }`}
                >
                  <VideoIcon className="w-3.5 h-3.5" />
                  <span>Trending Videos</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedCategory('Nudes');
                    setActiveView('landing');
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    selectedCategory === 'Nudes' && activeView === 'landing'
                      ? 'bg-orange-600 text-stone-950'
                      : 'bg-stone-900/50 hover:bg-stone-900 text-stone-400 hover:text-white'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Nudes</span>
                </button>
              </div>

            </div>

            {/* Sidebar bottom: Telegram and Twitter/X Buttons */}
            <div className="space-y-2 pt-4 border-t border-stone-900">
              <span className="text-[10px] font-mono text-stone-550 uppercase tracking-widest block">Channels</span>
              
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
                className="w-full py-2 bg-black hover:bg-stone-900 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition border border-stone-850"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>Twitter / X Feed</span>
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Grid Subnav categories (Only on desktop landing) */}
      {activeView === 'landing' && (
        <nav className="bg-[#111111] border-b border-white/5 py-3">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1 text-xs font-semibold rounded-full border transition whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-orange-500/10 border-orange-500 text-orange-400 font-extrabold'
                      : 'bg-transparent border-transparent text-stone-400 hover:text-stone-100 hover:bg-stone-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick stats panel */}
            <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-mono text-stone-500">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              STATUS: SECURE_NETWORK
            </span>
          </div>
        </nav>
      )}

      {/* Page Content Body */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-8">

        {/* Mobile Search input (displayed below header on small screens) */}
          {activeView === 'landing' && (
          <div className="md:hidden w-full flex items-center gap-2">
            <div className="relative flex-1">
              <input 
                type="text"
                placeholder="Search leaks, videos, photos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                className="w-full bg-stone-900 border border-stone-800 rounded-l-xl py-2.5 pl-4 pr-4 text-xs text-stone-200 focus:outline-none focus:border-orange-500 placeholder:text-stone-500"
              />
            </div>
            <button
              onClick={() => setSearchQuery('')}
              className="bg-orange-500 hover:bg-orange-400 text-stone-950 px-4 py-2.5 rounded-r-xl flex items-center justify-center transition-colors flex-shrink-0"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="text-stone-500 hover:text-stone-300 text-xs font-bold px-2"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Dynamic Sponsor Banner Ad (Landing page top) */}
        {activeView === 'landing' && bannerAd && bannerAd.enabled && bannerAd.imageUrl && (
          <div className="w-full bg-[#111111] border border-orange-500/25 p-1 rounded-xl flex items-center justify-center relative overflow-hidden group shadow-lg">
            <a href={bannerAd.linkUrl || "#"} target="_blank" rel="noopener noreferrer" className="w-full h-20 sm:h-24 relative block">
              <img src={bannerAd.imageUrl} alt="Sponsor Banner Ad" className="w-full h-full object-cover rounded-lg group-hover:scale-[1.005] transition-transform duration-300" />
              <span className="absolute bottom-2 right-2 bg-stone-950/85 backdrop-blur-sm text-[8px] font-mono font-black text-orange-400 px-2 py-0.5 rounded border border-orange-500/20 uppercase">
                SPONSOR AD
              </span>
            </a>
          </div>
        )}
        
        {/* LANDING PAGE GRID VIEW */}
        {activeView === 'landing' && (
          <div className="space-y-6">
            
            {/* New Nude Updates Carousel */}
            {videos.length > 0 && (() => {
              // Only show items matching the active tab type
              const typeFilter = selectedCategory === 'Trending Videos' ? 'video' : 'image';
              const typeFiltered = [...videos].filter(v => v.type === typeFilter);
              // Use admin-pinned items first; fall back to 5 latest if nothing is pinned
              const pinnedItems = typeFiltered.filter(v => v.isPinnedToCarousel);
              const latestItems = pinnedItems.length > 0
                ? pinnedItems
                : typeFiltered.sort((a, b) => (b.uploadedAt ?? 0) - (a.uploadedAt ?? 0)).slice(0, 5);
              if (latestItems.length === 0) return null;
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-500 animate-pulse" />
                      <span>Latest Drops</span>
                    </h3>
                    <div className="flex items-center gap-1">
                      {latestItems.map((_, idx) => (
                        <div 
                          key={idx} 
                          className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === currentSlideIndex ? 'bg-orange-500' : 'bg-stone-700'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  {/* Sliding container */}
                  <div 
                    className="relative overflow-hidden w-full rounded-2xl"
                    onMouseEnter={() => setIsCarouselPaused(true)}
                    onMouseLeave={() => setIsCarouselPaused(false)}
                    onTouchStart={() => setIsCarouselPaused(true)}
                    onTouchEnd={() => {
                      setTimeout(() => setIsCarouselPaused(false), 3000);
                    }}
                  >
                    <div 
                      className="flex transition-transform duration-1000 ease-in-out"
                      style={{ transform: `translateX(-${currentSlideIndex * 100}%)` }}
                    >
                      {latestItems.map((item, idx) => (
                        <div key={item.id} className="w-full flex-shrink-0">
                          <LatestDropCard
                            vid={item}
                            onClick={() => handleSelectVideo(item)}
                            priority={true}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()}


            {/* Video/Image Streams Header */}
            <div className="flex items-center justify-between border-b border-stone-850 pb-3">
              <h3 className="text-sm font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-orange-500" />
                <span>
                  Available {selectedCategory === 'Trending Videos' ? 'Videos' : 'Images'} ({filteredVideos.length})
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

            {/* Grid Container */}
            {loadingVideos ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="aspect-video bg-stone-900/40 border border-stone-850 rounded-xl animate-pulse flex items-center justify-center">
                    <span className="w-4 h-4 border border-orange-500/30 border-t-transparent rounded-full animate-spin" />
                  </div>
                ))}
              </div>
            ) : paginatedVideos.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                  {paginatedVideos.map((vid, idx) => (
                    <VideoCard 
                      key={vid.id}
                      vid={vid}
                      onClick={() => handleSelectVideo(vid)}
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
                <VideoOff className="w-12 h-12 text-stone-600 mx-auto" />
                <div>
                  <h4 className="font-bold text-stone-200">No stream media matched selection parameters</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">Try typing another query or clear filters to view original items.</p>
                </div>
                <button 
                  onClick={() => { setSelectedCategory('Trending Videos'); setSearchQuery(''); }}
                  className="px-4 py-1.5 bg-stone-950 hover:bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 text-xs rounded transition"
                >
                  Clear All Filters
                </button>
              </div>
            )}
            
          </div>
        )}

        {/* WATCH STREAM & DETAIL VIEW PAGE */}
        {activeView === 'watch' && activeVideo && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">

            {/* Back Button to get user back to home page */}
            <button 
              onClick={() => setActiveView('landing')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 text-xs font-mono font-bold text-stone-400 hover:text-white rounded-lg transition cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Home</span>
            </button>
            
            {/* Primary Stream Frame / Viewer */}
            <div className="space-y-4">
              
              {/* Conditional Rendering: Image Viewer vs Video Player */}
              {activeVideo.type === 'image' ? (
                <>
                  <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-stone-800 shadow-xl flex items-center justify-center group select-none">
                    <img 
                      src={activeVideo.imageUrl || activeVideo.thumbnailUrl || "/images/v2.png"} 
                      alt={activeVideo.title}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 right-4 bg-stone-950/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/5 text-[9px] font-mono font-black text-orange-400 uppercase tracking-widest shadow">
                      Premium Nude Image
                    </div>
                  </div>
                  {/* CommentsSection handles its own data fetching */}
                  <CommentsSection videoId={activeVideo.id} />
                </>
              ) : (
                // VideoPlayer includes CommentsSection internally
                <VideoPlayer video={activeVideo} />
              )}

              {/* Action Bar Directly Under Player */}
              <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-stone-900">
                <h1 className="text-lg font-black text-white font-mono tracking-tight flex-1">
                  {activeVideo.title || 'Untitled Media'}
                </h1>
                <button 
                  onClick={() => handleShare(activeVideo)}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition border border-stone-800 hover:border-stone-700 cursor-pointer flex-shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
              </div>

              {/* Trimmed Metadata */}
              <div className="py-1.5 space-y-1">
                <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
                  <span className="font-bold text-stone-300">{activeVideo.creator}</span>
                  <span>•</span>
                  <span>{activeVideo.views}</span>
                  <span>•</span>
                  <span>{activeVideo.time}</span>
                </div>
                {activeVideo.desc && (
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed bg-stone-900/10 p-3 rounded-xl border border-stone-900/50">
                    {activeVideo.desc}
                  </p>
                )}
              </div>

              {/* Dynamic Interesting Titles inserted by Admin */}
              {interestingTitlesMap[activeVideo.id] && interestingTitlesMap[activeVideo.id].length > 0 && (
                <div className="bg-orange-500/5 border border-orange-500/25 p-4 rounded-xl space-y-2 mt-2 shadow-inner">
                  <span className="text-[9px] font-mono font-extrabold text-orange-500 uppercase tracking-widest block">
                    🔥 POPULAR IN RELATION / UPDATE TOPICS
                  </span>
                  <div className="space-y-1.5">
                    {interestingTitlesMap[activeVideo.id].map((title, idx) => (
                      <p key={idx} className="text-xs font-black text-stone-200 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 flex-shrink-0 animate-ping" />
                        {title}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Sponsor Banner Ad (Watch Page display) */}
              {bannerAd && bannerAd.enabled && bannerAd.imageUrl && (
                <div className="w-full bg-[#111111] border border-orange-500/20 p-1 rounded-xl flex items-center justify-center relative overflow-hidden group shadow-lg mt-4">
                  <a href={bannerAd.linkUrl || "#"} target="_blank" rel="noopener noreferrer" className="w-full h-16 sm:h-20 relative block">
                    <img src={bannerAd.imageUrl} alt="Sponsor Banner" className="w-full h-full object-cover rounded-lg group-hover:scale-[1.005] transition-transform duration-300" />
                    <span className="absolute bottom-2 right-2 bg-stone-950/80 backdrop-blur-sm text-[8px] font-mono font-black text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20 uppercase">
                      SPONSOR
                    </span>
                  </a>
                </div>
              )}

              {/* Attached Content (from Admin) */}
              {activeVideo.attachments && activeVideo.attachments.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-stone-900">
                  <h3 className="text-sm font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span>Attached Content</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeVideo.attachments.map((att) => (
                      <div key={att.id} className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-stone-800 shadow-xl group">
                        {att.type === 'video' ? (
                          <video 
                            src={att.url} 
                            controls 
                            className="w-full h-full object-contain"
                            poster={att.thumbnailUrl}
                          />
                        ) : (
                          <img 
                            src={att.url} 
                            alt="Attachment"
                            className="w-full h-full object-contain cursor-pointer"
                            onClick={() => window.open(att.url, '_blank')}
                          />
                        )}
                        <div className="absolute top-2 right-2 bg-stone-950/80 backdrop-blur-sm px-2 py-0.5 rounded border border-white/5 text-[8px] font-mono font-bold text-blue-400 uppercase tracking-widest shadow">
                          Attached {att.type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Other Related items */}
              <div className="space-y-4 pt-8 border-t border-stone-900">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                    <span>Other Premium Leaks</span>
                  </h3>
                  <button 
                    onClick={() => { setActiveView('landing'); }}
                    className="text-stone-550 hover:text-orange-500 text-[10px] font-mono hover:underline"
                  >
                    Browse All
                  </button>
                </div>
                   <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {videos.filter((v) => v.id !== activeVideo.id).slice(0, 4).map((vid) => (
                    <VideoCard 
                      key={vid.id}
                      vid={vid}
                      onClick={() => handleSelectVideo(vid)}
                    />
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* SEO Content Section for Headings & Keywords */}
        {activeView === 'landing' && (
          <section className="mt-16 pb-8 border-t border-stone-850 pt-8">
            <h2 className="text-2xl font-black text-stone-200 mb-4">Welcome to NudeTrends - Premium Adult Entertainment</h2>
            <div className="text-sm text-stone-400 space-y-4 max-w-4xl">
              <p>
                NudeTrends is the ultimate destination for premium adult entertainment. We curate the hottest trending leaked videosnudes, and exclusive content featuring the most beautiful girls. Our securenetwork ensures high-quality streaming and safe access to all our premium videos and photo galleries.
              </p>
              
              <h3 className="text-lg font-bold text-stone-300 mt-6">Trending Status and Exclusive Leaks</h3>
              <p>
                Stay updated with the latest trends in the adult scene. Whether you are looking for amateur home videos, nude model showcases, or exclusive updates, we provide daily content drops. All media on this site is carefully selected to offer the best premium experience.
              </p>
              
              <h4 className="text-base font-semibold text-stone-400 mt-4">Why Choose Nude Trends?</h4>
              <p>
                As the leading adult status platform, we guarantee fresh, high-quality nude content that is constantly trending. Enjoy unparalleled access to exclusive clips and models today.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Modern responsive footer (CRITICAL: Visible Admin Control link removed) */}
      <footer className="bg-[#111111] border-t border-white/5 py-10 mt-16 text-center md:text-left">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div 
              onClick={() => { setActiveView('landing'); }}
              className="font-extrabold text-sm tracking-tight text-white cursor-pointer select-none"
            >
              NUDE <span className="bg-orange-500 text-black px-1.5 py-0.5 rounded-sm uppercase tracking-normal ml-0.5">TRENDS</span>
            </div>
            <p className="text-[11px] text-stone-500">Premium adult content and exclusive leaks network.</p>
          </div>

          <div className="flex items-center justify-center flex-wrap gap-4 text-xs text-stone-400">
            <span className="hover:text-orange-500 transition-colors pointer-default">Premium Network</span>
            <span className="text-stone-700">•</span>
            <span className="hover:text-orange-500 transition-colors pointer-default">Exclusive Creators</span>
            <span className="text-stone-700">•</span>
            <span className="hover:text-orange-500 transition-colors pointer-default">Trends & Updates</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-3">
            <a 
              href="https://x.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-8 h-8 rounded-full bg-black hover:bg-stone-900 border border-stone-880 flex items-center justify-center text-white transition-all shadow-md"
              title="X"
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
              title="Telegram"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19.9 3.01L2.24 9.81c-1.13.45-1.12 1.09-.2 1.37l4.53 1.41 10.5-6.62c.5-.3.95-.14.57.2L9.1 14.67v3.38c.33 0 .48-.15.66-.33l1.58-1.54 3.29 2.43c.6.33 1.04.16 1.19-.55l2.16-10.2c.22-.88-.34-1.28-.98-1z" />
              </svg>
            </a>
          </div>

          <p className="text-[11px] text-stone-600 font-mono">© 2026 Nude Trends Networks Inc. All rights reserved.</p>
        </div>
      </footer>

      {/* Secret Translucent Trigger Button (Only visible on Nudes Category, bottom-left corner of screen) */}
      {activeView === 'landing' && selectedCategory === 'Nudes' && (
        <div className="fixed bottom-3 left-3 z-[2500]">
          <Link 
            href="/login"
            className="w-3.5 h-3.5 bg-stone-900/10 hover:bg-stone-900/40 border border-white/5 rounded flex items-center justify-center opacity-10 hover:opacity-100 transition-all duration-300 cursor-default select-none text-[8px] text-stone-700 hover:text-stone-400 font-mono"
            title="Access Portal"
          >
            .
          </Link>
        </div>
      )}
    </>
  );
}

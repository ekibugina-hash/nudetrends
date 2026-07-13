"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Compass, 
  Search, 
  CheckCircle2, 
  Play,
  ArrowLeft,
  Share2,
  Menu,
  TrendingUp,
  VideoOff
} from 'lucide-react';
import { Video } from '../../types';
import VideoPlayer from '../../components/VideoPlayer';
import CommentsSection from '../../components/CommentsSection';

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

export default function CreatorClient({ videos, creatorName, bio }: { videos: Video[], creatorName: string, bio?: string }) {
  const router = useRouter();
  const [activeView, setActiveView] = useState<'landing' | 'watch'>('landing');
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const [notification, setNotification] = useState<string | null>(null);

  // Storage and configuration states loaded from Admin Panel
  const [interestingTitlesMap, setInterestingTitlesMap] = useState<Record<string, string[]>>({});
  const [bannerAd, setBannerAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>(null);

  useEffect(() => {
    setIsClient(true);
    
    // Build interesting titles map
    const titleMap: Record<string, string[]> = {};
    videos.forEach((v) => {
      if (v.interestingTitles && v.interestingTitles.length > 0) {
        titleMap[v.id] = v.interestingTitles;
      }
    });
    setInterestingTitlesMap(titleMap);

    const fetchAds = async () => {
      try {
        const res = await fetch('/api/ads');
        if (res.ok) {
          const data = await res.json();
          if (data.ads?.banner) setBannerAd(data.ads.banner);
        }
      } catch (e) {
        console.error('Failed to load ads globally');
      }
    };
    fetchAds();
  }, [videos]);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filteredVideos = videos.filter((vid) => {
    return vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           vid.desc.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.ceil(filteredVideos.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedVideos = filteredVideos.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
    const shareUrl = `${window.location.origin}/creator/${encodeURIComponent(creatorName)}?watch=${video.id}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        triggerNotification('Copied stream link to clipboard!');
      }).catch(() => {
        triggerNotification('Could not copy link.');
      });
    } else {
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
      {notification && (
        <div className="fixed bottom-6 right-6 z-[3000] bg-orange-600 border border-orange-500 text-stone-950 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-slideUp font-bold text-xs">
          <CheckCircle2 className="w-4 h-4 text-stone-950" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-[1000] bg-[#090909]/92 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
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

          <div className="hidden md:flex flex-1 max-w-xl items-center">
            <div className="relative flex-1">
              <input 
                ref={searchInputRef}
                type="text"
                placeholder={`Search ${creatorName}'s videos...`}
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
        </div>
      </header>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-6 space-y-8">
        
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

        {activeView === 'landing' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-stone-850 pb-3">
              <h3 className="text-sm font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-orange-500" />
                <span>
                  Videos for {creatorName} ({filteredVideos.length})
                </span>
              </h3>
              <div className="flex items-center gap-4">
                <Link 
                  href="/"
                  className="text-xs text-stone-400 hover:text-orange-500 flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Topics
                </Link>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-orange-500 hover:underline"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>

            {bio && (
              <div className="bg-stone-900/40 border border-stone-850 rounded-2xl p-6 shadow-inner animate-fadeIn">
                <h4 className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest mb-3">About this Series</h4>
                <p className="text-sm text-stone-300 leading-relaxed whitespace-pre-wrap">{bio}</p>
              </div>
            )}

            {paginatedVideos.length > 0 ? (
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
                  <h4 className="font-bold text-stone-200">No videos matched selection parameters</h4>
                </div>
              </div>
            )}
          </div>
        )}

        {/* WATCH STREAM & DETAIL VIEW PAGE */}
        {activeView === 'watch' && activeVideo && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <button 
              onClick={() => setActiveView('landing')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 text-xs font-mono font-bold text-stone-400 hover:text-white rounded-lg transition cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Videos</span>
            </button>
            
            <div className="space-y-4">
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
                  <CommentsSection videoId={activeVideo.id} />
                </>
              ) : (
                <VideoPlayer video={activeVideo} />
              )}

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

              {/* Related Videos: More from this Topic */}
              {videos.length > 1 && (
                <div className="pt-8 border-t border-stone-850 mt-8">
                  <h3 className="text-sm font-extrabold text-stone-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-orange-500" />
                    <span>More from {creatorName}</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {videos
                      .filter(v => v.id !== activeVideo.id)
                      .slice(0, 4) // show up to 4
                      .map(vid => (
                        <div key={vid.id} className="scale-95 origin-top-left hover:scale-100 transition-transform">
                          <VideoCard
                            vid={vid}
                            onClick={() => handleSelectVideo(vid)}
                          />
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}

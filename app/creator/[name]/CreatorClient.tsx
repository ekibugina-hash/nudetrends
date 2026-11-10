"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Compass, 
  Search, 
  CheckCircle2, 
  Play, 
  ArrowLeft, 
  Share2, 
  Menu, 
  X,
  Video as VideoIcon, 
  Image as ImageIcon,
  VideoOff
} from 'lucide-react';
import { Video } from '../../types';
import VideoPlayer from '../../components/VideoPlayer';
import CommentsSection from '../../components/CommentsSection';

// ─── Topic Media Card (Thumbnail left, info right on mobile & desktop) ────────
function TopicMediaItemCard({
  vid,
  onClick,
  isActive,
}: {
  vid: Video;
  onClick: () => void;
  isActive?: boolean;
}) {
  const isImage = vid.type === 'image';
  const duration = vid.duration || (isImage ? 'PHOTO' : '03:45');
  const initials = (vid.creator || 'NT').substring(0, 3).toUpperCase();

  return (
    <div
      onClick={onClick}
      className={`p-2.5 sm:p-3.5 rounded-xl flex flex-row gap-2.5 sm:gap-3.5 transition-all shadow-sm group cursor-pointer ${
        isActive
          ? 'bg-orange-500/15 border-2 border-orange-500'
          : 'bg-white/[0.03] backdrop-blur-sm border border-white/[0.07] hover:border-orange-500/30 hover:bg-white/[0.05]'
      }`}
    >
      {/* Left Thumbnail (clear photo/thumbnail, or gradient) */}
      <div className="w-28 sm:w-36 md:w-40 h-24 sm:h-24 md:h-28 rounded-lg bg-stone-950 border border-stone-900 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
        {vid.thumbnailUrl ? (
          <img
            src={vid.thumbnailUrl}
            alt={vid.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : isImage && vid.imageUrl ? (
          <img
            src={vid.imageUrl}
            alt={vid.title}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
            style={{ backgroundImage: vid.gradient }}
          >
            <div className="w-7 h-7 rounded-full bg-black/60 border border-white/10 flex items-center justify-center mb-1">
              {isImage ? (
                <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
              ) : (
                <VideoIcon className="w-3.5 h-3.5 text-orange-400" />
              )}
            </div>
            <span className="font-extrabold text-[10px] sm:text-xs font-mono text-stone-300 truncate max-w-full px-1">
              {initials}
            </span>
          </div>
        )}

        <span
          className={`absolute bottom-1 right-1 text-[7px] sm:text-[8px] font-mono px-1 sm:px-1.5 py-0.5 rounded font-bold z-20 ${
            isImage
              ? 'bg-orange-600 text-stone-950 uppercase'
              : 'bg-stone-950/85 text-stone-300 border border-white/5'
          }`}
        >
          {isImage ? 'PHOTO' : duration}
        </span>

        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-orange-500 text-stone-950 flex items-center justify-center shadow-lg">
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Right Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 space-y-1">
        <div>
          <div className="flex justify-between items-start gap-1">
            <h3
              className="font-bold text-stone-200 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-orange-400 transition-colors"
              title={vid.title}
            >
              {vid.title}
            </h3>
          </div>

          <p className="text-[9px] sm:text-[10px] text-stone-500 font-mono mt-0.5 truncate">
            {vid.creator} {vid.views ? `• ${vid.views}` : ''} {vid.time ? `• ${vid.time}` : ''}
          </p>

          {vid.desc && (
            <p className="text-[10px] sm:text-[11px] text-stone-400 line-clamp-2 mt-1 leading-relaxed hidden xs:block">
              {vid.desc}
            </p>
          )}
        </div>

        <div className="pt-1 border-t border-stone-900/60 flex items-center justify-between gap-1">
          <span className="text-[8px] sm:text-[9px] text-stone-600 font-mono">
            {isImage ? 'Photo Leak' : 'Full Video Stream'}
          </span>

          <span className="text-[9px] sm:text-[10px] font-mono font-bold text-orange-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 flex-shrink-0">
            {isActive ? 'Playing Now' : 'Watch / View →'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Topic Full Page Component ────────────────────────────────────────────────
export default function CreatorClient({
  videos = [],
  creatorName,
  bio,
}: {
  videos: Video[];
  creatorName: string;
  bio?: string;
}) {
  const router = useRouter();
  const [activeVideo, setActiveVideo] = useState<Video | null>(
    videos.length > 0 ? videos[0] : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);

  // Mobile sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Notification
  const [notification, setNotification] = useState<string | null>(null);

  // Banner Ad (half desktop size)
  const [bannerAd, setBannerAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>({
    enabled: true,
    imageUrl: '/images/sponsor-banner.jpg',
    linkUrl: 'https://www.hexescortsug.com',
  });

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch('/api/ads');
        if (res.ok) {
          const data = await res.json();
          if (data.ads?.banner) setBannerAd(data.ads.banner);
        }
      } catch (e) {}
    };
    fetchAds();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleShare = (video: Video) => {
    const shareUrl = window.location.href;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        triggerNotification('Copied topic link to clipboard!');
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
      triggerNotification('Copied topic link to clipboard!');
    }
  };

  const handleSelectMedia = (vid: Video) => {
    setActiveVideo(vid);
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Filtered media list
  const filteredVideos = videos.filter((vid) =>
    (vid.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (vid.desc || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / ITEMS_PER_PAGE));
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const videoItems = videos.filter((v) => v.type !== 'image');
  const imageItems = videos.filter((v) => v.type === 'image');

  return (
    <div className="min-h-screen bg-[#090909] text-stone-200">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[3000] bg-orange-600 border border-orange-500 text-stone-950 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-slideUp font-bold text-xs">
          <CheckCircle2 className="w-4 h-4 text-stone-950" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-[1000] bg-[#0c0c0c]/95 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 text-xs font-mono font-bold text-stone-300 hover:text-white rounded-lg transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>

            <Link href="/" className="flex items-center gap-2 cursor-pointer">
              <span className="font-extrabold text-white text-base tracking-tighter uppercase">Nude</span>
              <span className="bg-orange-500 text-black px-2 py-0.5 rounded font-black text-xs uppercase tracking-wider">
                TRENDS
              </span>
            </Link>
          </div>

          {/* Desktop Search within topic */}
          <div className="hidden md:flex flex-1 max-w-md items-center mx-4">
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder={`Search in ${creatorName}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Sponsor Banner Ad: Reduced to half desktop size */}
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

        {/* ── Topic Hero & Info Section ────────────────────────────────────────── */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 sm:p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono font-extrabold text-orange-500 uppercase tracking-widest">
                Topic &amp; Trend Details
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                {creatorName}
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-stone-900 border border-stone-800 text-stone-300 text-xs font-mono font-bold px-3 py-1.5 rounded-lg">
                {videoItems.length} Videos • {imageItems.length} Photos
              </span>
              <button
                onClick={() => activeVideo && handleShare(activeVideo)}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition border border-stone-800 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>
          </div>

          {bio && (
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed bg-stone-950/60 p-3.5 rounded-xl border border-stone-900 whitespace-pre-wrap">
              {bio}
            </p>
          )}
        </div>

        {/* ── Active Video / Photo Player (When media is selected or single) ───── */}
        {activeVideo && (
          <div ref={playerRef} className="space-y-4 max-w-4xl mx-auto animate-fadeIn">
            <div className="border border-stone-800/80 rounded-2xl overflow-hidden bg-black p-1 sm:p-2 shadow-2xl">
              {activeVideo.type === 'image' ? (
                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden flex items-center justify-center select-none">
                  <img
                    src={activeVideo.imageUrl || activeVideo.thumbnailUrl || '/images/v2.png'}
                    alt={activeVideo.title}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 right-4 bg-stone-950/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/5 text-[9px] font-mono font-black text-orange-400 uppercase tracking-widest shadow">
                    Photo View
                  </div>
                </div>
              ) : (
                <VideoPlayer video={activeVideo} />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-stone-900">
              <h2 className="text-base sm:text-lg font-black text-white font-mono tracking-tight flex-1">
                {activeVideo.title || creatorName}
              </h2>
            </div>

            {activeVideo.desc && activeVideo.desc !== bio && (
              <p className="text-xs text-stone-400 leading-relaxed bg-stone-900/20 p-3 rounded-xl border border-stone-900/60">
                {activeVideo.desc}
              </p>
            )}

            <CommentsSection videoId={activeVideo.id} />
          </div>
        )}

        {/* ── ALL MEDIA SECTION (Both Videos & Images in One Section) ──────────── */}
        <div className="space-y-4 pt-4 border-t border-stone-850">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-orange-400 uppercase tracking-widest flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-orange-500" />
              <span>All Media in this Topic ({filteredVideos.length})</span>
            </h3>

            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-orange-500 hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>

          {paginatedVideos.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {paginatedVideos.map((vid) => (
                <TopicMediaItemCard
                  key={vid.id}
                  vid={vid}
                  onClick={() => handleSelectMedia(vid)}
                  isActive={activeVideo?.id === vid.id}
                />
              ))}
            </div>
          ) : (
            <div className="p-16 border border-stone-850 rounded-2xl bg-white/[0.02] text-center space-y-3">
              <VideoOff className="w-10 h-10 text-stone-600 mx-auto" />
              <div>
                <h4 className="font-bold text-stone-200 text-sm">No media found</h4>
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
            <Link href="/" className="font-extrabold text-sm tracking-tight text-white select-none uppercase">
              Nude <span className="bg-orange-500 text-black px-1.5 py-0.5 rounded-sm tracking-normal ml-0.5">TRENDS</span>
            </Link>
            <p className="text-[11px] text-stone-500">Premium adult content and exclusive leaks network.</p>
          </div>

          <p className="text-[11px] text-stone-600 font-mono">© 2026 Nude Trends Networks Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

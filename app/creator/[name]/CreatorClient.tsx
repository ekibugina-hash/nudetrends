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
  VideoOff,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Flame,
  HelpCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Video, Creator } from '../../types';
import VideoPlayer from '../../components/VideoPlayer';
import CommentsSection from '../../components/CommentsSection';

// ─── Fast Thumbnail for Media List ───────────────────────────────────────────
function MediaThumb({
  thumbnailUrl,
  imageUrl,
  gradient,
  initials,
  isImage,
  duration,
}: {
  thumbnailUrl?: string;
  imageUrl?: string;
  gradient?: string;
  initials: string;
  isImage: boolean;
  duration: string;
}) {
  const [imgError, setImgError] = useState(false);
  const src = !imgError ? (thumbnailUrl || imageUrl) : null;

  return (
    <div className="w-32 xs:w-36 sm:w-44 md:w-52 h-28 xs:h-32 sm:h-36 md:h-40 rounded-xl bg-stone-950 border border-stone-850 overflow-hidden flex-shrink-0 flex items-center justify-center relative shadow-inner">
      {src ? (
        <img
          src={src}
          alt="Thumbnail"
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
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
            {initials}
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
        {isImage ? 'PHOTO' : duration}
      </span>

      {/* Play hover button */}
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-orange-500 text-stone-950 flex items-center justify-center shadow-xl">
          <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
        </div>
      </div>
    </div>
  );
}

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
      className={`p-3.5 sm:p-4 md:p-5 rounded-2xl flex flex-row gap-3 sm:gap-4 md:gap-5 transition-all shadow-md group cursor-pointer ${
        isActive
          ? 'bg-orange-500/15 border-2 border-orange-500 shadow-orange-500/10'
          : 'bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] hover:border-orange-500/40 hover:bg-white/[0.06]'
      }`}
    >
      {/* Left Thumbnail */}
      <MediaThumb
        thumbnailUrl={vid.thumbnailUrl}
        imageUrl={vid.imageUrl}
        gradient={vid.gradient}
        initials={initials}
        isImage={isImage}
        duration={duration}
      />

      {/* Right Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1 space-y-2">
        <div>
          <div className="flex justify-between items-start gap-1">
            <h3
              className="font-bold text-stone-100 text-sm sm:text-base md:text-lg line-clamp-2 leading-snug group-hover:text-orange-400 transition-colors"
              title={vid.title}
            >
              {vid.title}
            </h3>
          </div>

          <p className="text-[10px] sm:text-xs text-stone-400 font-mono mt-1 truncate">
            {vid.creator} {vid.views ? `• ${vid.views}` : ''} {vid.time ? `• ${vid.time}` : ''}
          </p>

          {vid.desc && (
            <p className="text-xs sm:text-sm text-stone-400 line-clamp-2 mt-1.5 leading-relaxed hidden xs:block">
              {vid.desc}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-stone-850 flex items-center justify-between gap-2">
          <span className="text-[9px] sm:text-[10px] text-stone-500 font-mono">
            {isImage ? 'Photo Leak' : 'Full Video Stream'}
          </span>

          <span className="text-xs sm:text-sm font-mono font-bold text-orange-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 flex-shrink-0">
            {isActive ? '● Viewing Now' : 'Watch / View →'}
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
  thumbnailUrl,
  relatedCreators = [],
}: {
  videos: Video[];
  creatorName: string;
  bio?: string;
  thumbnailUrl?: string;
  relatedCreators?: Creator[];
}) {
  const router = useRouter();
  const [activeVideo, setActiveVideo] = useState<Video | null>(
    videos.length > 0 ? videos[0] : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'image'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
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
  }, [searchQuery, filterType]);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleShare = (video: Video) => {
    const shareUrl = window.location.href;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        triggerNotification('Copied trend link to clipboard!');
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
      triggerNotification('Copied trend link to clipboard!');
    }
  };

  const handleSelectMedia = (vid: Video) => {
    setActiveVideo(vid);
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Navigation between media items
  const currentIndex = activeVideo ? videos.findIndex(v => v.id === activeVideo.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < videos.length - 1;

  const handlePrevMedia = () => {
    if (hasPrev) {
      setActiveVideo(videos[currentIndex - 1]);
      if (playerRef.current) {
        playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleNextMedia = () => {
    if (hasNext) {
      setActiveVideo(videos[currentIndex + 1]);
      if (playerRef.current) {
        playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Filtered media list
  const filteredVideos = videos.filter((vid) => {
    const matchesSearch =
      (vid.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vid.desc || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType =
      filterType === 'all'
        ? true
        : filterType === 'video'
        ? vid.type !== 'image'
        : vid.type === 'image';
    return matchesSearch && matchesType;
  });

  const totalPages = Math.max(1, Math.ceil(filteredVideos.length / ITEMS_PER_PAGE));
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const videoItems = videos.filter((v) => v.type !== 'image');
  const imageItems = videos.filter((v) => v.type === 'image');

  const faqs = [
    {
      q: `Where can I watch ${creatorName} leaked videos and photos?`,
      a: `You can stream all exclusive leaked videos and photo trends of ${creatorName} directly on NudeTrends Uganda with high speed streaming and no lag.`,
    },
    {
      q: `How many videos and photos are available for ${creatorName}?`,
      a: `There are currently ${videoItems.length} videos and ${imageItems.length} photos available for ${creatorName} on NudeTrends Uganda.`,
    },
    {
      q: `Is ${creatorName} content available on mobile devices?`,
      a: `Yes, all content for ${creatorName} is fully optimized for mobile devices with lightweight, responsive thumbnail previews and instant playback.`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#090909] text-stone-200 relative overflow-hidden">
      {/* Top Background Photo Cover (From top of the page down to ~380px, smooth fade into #090909) */}
      {thumbnailUrl && (
        <div className="absolute top-0 left-0 right-0 h-[360px] sm:h-[420px] pointer-events-none z-0 overflow-hidden select-none">
          <img
            src={thumbnailUrl}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover object-top opacity-35 sm:opacity-40 filter blur-[1px] scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#090909]/70 via-transparent to-[#090909]" />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#090909] via-[#090909]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090909]/80 via-transparent to-[#090909]/80" />
        </div>
      )}
      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[3000] bg-orange-600 border border-orange-500 text-stone-950 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-slideUp font-bold text-xs">
          <CheckCircle2 className="w-4 h-4 text-stone-950" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-[1000] bg-[#0c0c0c]/85 backdrop-blur-md border-b border-stone-800/80">
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
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pb-6 space-y-6">
        {/* Breadcrumbs + Hero overlap wrapper — pulls up into the background photo */}
        <div className="pt-[260px] sm:pt-[320px] -mt-[260px] sm:-mt-[320px] space-y-3">
          {/* Semantic Breadcrumbs for SEO & UX */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] font-mono text-stone-400 flex-wrap px-1">
            <Link href="/" className="hover:text-orange-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/#trending-videos" className="hover:text-orange-400 transition-colors">Trends</Link>
            <span>/</span>
            <span className="text-stone-200 font-bold">{creatorName}</span>
          </nav>

          {/* ── Topic Hero & Info Section (Frosted glass overlapping the background photo) ─────── */}
          <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-stone-950/80 backdrop-blur-md">

          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 p-5 sm:p-7 space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5 sm:gap-6 justify-between">
              {/* Left: Avatar/Cover + Details */}
              <div className="flex items-start sm:items-center gap-4 sm:gap-5 flex-1 min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-stone-900 border-2 border-orange-500/40 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-lg shadow-orange-500/10 backdrop-blur-sm">
                  {thumbnailUrl ? (
                    <img
                      src={thumbnailUrl}
                      alt={`${creatorName} trend cover`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-600 to-stone-900 flex items-center justify-center text-white font-black text-xl font-mono">
                      {creatorName.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Title & Badges */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-black text-orange-400 bg-orange-500/20 border border-orange-500/35 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                      <Flame className="w-3 h-3 text-orange-400" />
                      Verified Trend
                    </span>
                    <span className="text-[10px] font-mono text-stone-300 bg-black/60 px-2.5 py-0.5 rounded-md border border-white/10 backdrop-blur-sm">
                      {videos.length} media item{videos.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight truncate drop-shadow-md">
                    {creatorName}
                  </h1>

                  <div className="flex items-center gap-2 text-xs font-mono text-stone-300">
                    <span className="text-orange-400 font-bold">{videoItems.length} Videos</span>
                    <span>•</span>
                    <span className="text-orange-400 font-bold">{imageItems.length} Photos</span>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                <button
                  onClick={() => activeVideo && handleShare(activeVideo)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-stone-900/90 hover:bg-stone-850 text-stone-200 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition border border-stone-800 hover:border-stone-700 cursor-pointer shadow-md backdrop-blur-sm"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Trend</span>
                </button>
              </div>
            </div>

            {bio ? (
              <div className="pt-3 border-t border-stone-850/80">
                <p className="text-xs sm:text-sm text-stone-200 leading-relaxed bg-black/60 backdrop-blur-md p-4 rounded-xl border border-stone-850 whitespace-pre-wrap shadow-inner">
                  {bio}
                </p>
              </div>
            ) : (
              <div className="pt-3 border-t border-stone-850/80">
                <p className="text-xs text-stone-300 leading-relaxed bg-black/50 backdrop-blur-md p-3.5 rounded-xl border border-stone-850 shadow-inner">
                  Explore all verified leaks, viral videos, and exclusive photo content of <strong className="text-white">{creatorName}</strong> on NudeTrends Uganda. Stream high-definition media directly from your browser.
                </p>
              </div>
            )}
          </div>
        </div>
        </div>{/* end overlap wrapper */}

        {/* ── Active Video / Photo Player Section ─────────────────────────────── */}
        {activeVideo && (
          <div ref={playerRef} className="space-y-4 max-w-4xl mx-auto animate-fadeIn">
            {/* Player Container */}
            <div className="border border-stone-800 rounded-3xl overflow-hidden bg-black p-1 sm:p-2.5 shadow-2xl">
              {activeVideo.type === 'image' ? (
                <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center select-none">
                  <img
                    src={activeVideo.imageUrl || activeVideo.thumbnailUrl || '/images/v2.png'}
                    alt={activeVideo.title || `${creatorName} photo view`}
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-4 right-4 bg-stone-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-orange-500/30 text-[9px] font-mono font-black text-orange-400 uppercase tracking-widest shadow-xl">
                    Photo View
                  </div>
                </div>
              ) : (
                <VideoPlayer video={activeVideo} />
              )}
            </div>

            {/* Player Controls & Media Navigation Bar */}
            <div className="bg-stone-950 border border-stone-850 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-mono text-orange-400 uppercase tracking-wider block font-bold">
                    Now Viewing ({currentIndex + 1} of {videos.length})
                  </span>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug mt-0.5">
                    {activeVideo.title || creatorName}
                  </h2>
                </div>

                {/* Prev / Next Media Switcher */}
                {videos.length > 1 && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={handlePrevMedia}
                      disabled={!hasPrev}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-850 disabled:opacity-30 disabled:cursor-not-allowed border border-stone-800 text-stone-200 text-xs font-mono font-bold rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Prev</span>
                    </button>
                    <button
                      onClick={handleNextMedia}
                      disabled={!hasNext}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-30 disabled:cursor-not-allowed text-stone-950 text-xs font-mono font-bold rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {activeVideo.desc && activeVideo.desc !== bio && (
                <p className="text-xs text-stone-400 leading-relaxed bg-stone-900/40 p-3 rounded-xl border border-stone-850">
                  {activeVideo.desc}
                </p>
              )}
            </div>

            {/* Comments for the active media */}
            <CommentsSection videoId={activeVideo.id} />
          </div>
        )}

        {/* ── ALL MEDIA SECTION ───────────────────────────────────────────────── */}
        <div className="space-y-4 pt-6 border-t border-stone-850">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-xs font-extrabold text-orange-400 uppercase tracking-widest flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-orange-500" />
              <span>All Media in this Trend ({filteredVideos.length})</span>
            </h3>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-orange-500 text-stone-950'
                    : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                All ({videos.length})
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  filterType === 'video'
                    ? 'bg-orange-500 text-stone-950'
                    : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                Videos ({videoItems.length})
              </button>
              <button
                onClick={() => setFilterType('image')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  filterType === 'image'
                    ? 'bg-orange-500 text-stone-950'
                    : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                Photos ({imageItems.length})
              </button>

              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-orange-500 hover:underline cursor-pointer ml-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {paginatedVideos.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
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
                <p className="text-xs text-stone-500 mt-1">Try selecting another filter or clear your search.</p>
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

        {/* ── SEO FAQ Section (Google PAA Rich Snippets) ───────────────────────── */}
        <section className="bg-stone-950 border border-stone-850 rounded-3xl p-5 sm:p-7 space-y-4">
          <div className="flex items-center gap-2 text-xs font-extrabold text-orange-400 uppercase tracking-widest">
            <HelpCircle className="w-4 h-4 text-orange-500" />
            <span>Frequently Asked Questions about {creatorName}</span>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="border border-stone-850 rounded-2xl overflow-hidden bg-white/[0.01]"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 text-stone-200 hover:text-orange-400 transition cursor-pointer"
                  >
                    <span className="font-bold text-xs sm:text-sm">{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-stone-500 transition-transform ${
                        isOpen ? 'rotate-180 text-orange-400' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-stone-400 leading-relaxed border-t border-stone-850/60 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Internal Linking: Related Viral Trends ───────────────────────────── */}
        {relatedCreators.length > 0 && (
          <section className="space-y-4 pt-6 border-t border-stone-850">
            <div className="flex items-center gap-2 text-xs font-extrabold text-stone-300 uppercase tracking-widest">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <span>More Viral Trends in Uganda</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {relatedCreators.map((trend) => (
                <Link
                  key={trend.name}
                  href={`/creator/${encodeURIComponent(trend.name)}`}
                  className="bg-white/[0.02] hover:bg-white/[0.05] border border-stone-850 hover:border-orange-500/40 rounded-2xl p-3 flex flex-col items-center text-center gap-2.5 transition group"
                >
                  <div className="w-12 h-12 rounded-xl bg-stone-900 border border-orange-500/30 overflow-hidden flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    {trend.thumbnailUrl ? (
                      <img
                        src={trend.thumbnailUrl}
                        alt={trend.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="font-black font-mono text-xs text-orange-400">
                        {trend.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="font-bold text-xs text-stone-200 truncate group-hover:text-orange-400 transition-colors">
                      {trend.name}
                    </p>
                    <span className="text-[10px] font-mono text-stone-500">
                      {trend.videoCount || 1} Media Files
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        {/* Sponsor Banner Ad: Placed at bottom of trend page */}
        {bannerAd?.enabled && bannerAd?.imageUrl && (
          <div className="w-full max-w-md sm:max-w-lg mx-auto pt-4">
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

"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
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
  Layout,
  ExternalLink,
} from 'lucide-react';
import { Creator, Video } from './types';
import VideoPlayer from './components/VideoPlayer';
import CommentsSection from './components/CommentsSection';

// ─── Admin-style Video Thumbnail (with 20s seek) ──────────────────────────────
function AdminVideoThumb({ videoUrl, gradient }: { videoUrl: string; gradient?: string }) {
  return (
    <>
      <div className="absolute inset-0 w-full h-full" style={{ backgroundImage: gradient }} />
      <video
        src={`${videoUrl}#t=20`}
        className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none"
        preload="metadata"
        muted
        playsInline
      />
    </>
  );
}

// ─── Admin-style Topic Card ───────────────────────────────────────────────────
function TopicCard({
  creator,
  onDirectPlay,
}: {
  creator: Creator;
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
  const isImage = creator.firstVideo?.type === 'image';
  const duration = creator.firstVideo?.duration || (isImage ? 'IMAGE' : '03:45');
  const interestingTitles = creator.firstVideo?.interestingTitles || [];

  return (
    <div
      onClick={handleClick}
      className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.07] p-3.5 rounded-xl flex flex-col sm:flex-row gap-3 hover:border-orange-500/30 hover:bg-white/[0.05] transition-all shadow-sm group cursor-pointer"
    >
      {/* Responsive image wrapper */}
      <div className="w-full sm:w-36 md:w-40 h-44 sm:h-24 rounded-lg bg-stone-950 border border-stone-900 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
        {creator.thumbnailUrl ? (
          <img
            src={creator.thumbnailUrl}
            alt={creator.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : showVideoThumb ? (
          <div className="relative w-full h-full">
            <AdminVideoThumb videoUrl={creator.videoUrl!} gradient={creator.gradient} />
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center relative"
            style={{ backgroundImage: creator.gradient }}
          >
            <span className="font-extrabold text-sm font-mono text-stone-300">
              {creator.name.substring(0, 2).toUpperCase()}
            </span>
          </div>
        )}

        {/* Duration / Format badge */}
        <span
          className={`absolute bottom-1 right-1 text-[8px] font-mono px-1.5 py-0.5 rounded font-bold z-20 ${
            isImage
              ? 'bg-orange-600 text-stone-950 uppercase'
              : 'bg-stone-950/80 text-stone-300 border border-white/5'
          }`}
        >
          {isImage ? 'IMAGE' : duration}
        </span>

        {/* Video count badge */}
        {creator.videoCount && creator.videoCount > 1 ? (
          <span className="absolute top-1 left-1 bg-stone-950/85 border border-white/10 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-orange-400 z-20">
            {creator.videoCount} videos
          </span>
        ) : null}

        {/* Hover play icon */}
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-orange-500 text-stone-950 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info details wrapper */}
      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3
              className="font-bold text-stone-200 text-xs sm:text-sm truncate flex-1 group-hover:text-orange-400 transition-colors"
              title={creator.name}
            >
              {creator.name}
            </h3>
            {creator.hasTopicPage && (
              <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[8px] font-mono font-black px-1.5 py-0.5 rounded uppercase flex-shrink-0">
                Series
              </span>
            )}
          </div>

          <p className="text-[10px] text-stone-500 font-mono mt-1">
            Topic: {creator.name}
            {creator.videoCount ? ` | ${creator.videoCount} ${creator.videoCount === 1 ? 'video' : 'videos'}` : ''}
            {creator.firstVideo?.views ? ` | ${creator.firstVideo.views}` : ''}
          </p>

          {(creator.bio || creator.firstVideo?.desc) && (
            <p className="text-[11px] text-stone-400 line-clamp-2 mt-1 leading-relaxed">
              {creator.bio || creator.firstVideo?.desc}
            </p>
          )}
        </div>

        {/* Interesting Titles / Tag Pills */}
        <div className="pt-1.5 border-t border-stone-900/60 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
            {interestingTitles.length > 0 ? (
              interestingTitles.slice(0, 3).map((t, idx) => (
                <span
                  key={idx}
                  className="bg-stone-900 border border-stone-900/50 px-2 py-0.5 rounded-full text-[9px] text-stone-300 truncate max-w-[140px]"
                >
                  {t}
                </span>
              ))
            ) : (
              <span className="text-[9px] text-stone-600 font-mono">Exclusive Drop</span>
            )}
          </div>

          <span className="text-[10px] font-mono font-bold text-orange-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 flex-shrink-0">
            {creator.hasTopicPage ? 'View Series →' : 'Watch →'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Admin-style Media Card (for direct Video / Image items) ───────────────────
function MediaCard({
  media,
  onPlay,
}: {
  media: Video;
  onPlay: (video: Video) => void;
}) {
  const isImage = media.type === 'image';
  const duration = media.duration || (isImage ? 'IMAGE' : '03:45');
  const interestingTitles = media.interestingTitles || [];

  return (
    <div
      onClick={() => onPlay(media)}
      className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.07] p-3.5 rounded-xl flex flex-col sm:flex-row gap-3 hover:border-orange-500/30 hover:bg-white/[0.05] transition-all shadow-sm group cursor-pointer"
    >
      {/* Responsive image wrapper */}
      <div className="w-full sm:w-36 md:w-40 h-44 sm:h-24 rounded-lg bg-stone-950 border border-stone-900 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
        {media.thumbnailUrl ? (
          <img
            src={media.thumbnailUrl}
            alt={media.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : isImage && media.imageUrl ? (
          <img
            src={media.imageUrl}
            alt={media.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : media.videoUrl ? (
          <div className="relative w-full h-full">
            <AdminVideoThumb videoUrl={media.videoUrl} gradient={media.gradient} />
          </div>
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundImage: media.gradient }}
          >
            <span className="font-extrabold text-xs font-mono text-stone-300">
              {media.initials || 'PL'}
            </span>
          </div>
        )}

        <span
          className={`absolute bottom-1 right-1 text-[8px] font-mono px-1.5 py-0.5 rounded font-bold z-20 ${
            isImage
              ? 'bg-orange-600 text-stone-950 uppercase'
              : 'bg-stone-950/80 text-stone-300 border border-white/5'
          }`}
        >
          {isImage ? 'IMAGE' : duration}
        </span>

        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-orange-500 text-stone-950 flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Info details wrapper */}
      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3
              className="font-bold text-stone-200 text-xs sm:text-sm truncate flex-1 group-hover:text-orange-400 transition-colors"
              title={media.title}
            >
              {media.title}
            </h3>
            {media.category && (
              <span
                className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase flex-shrink-0 ${
                  isImage
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                }`}
              >
                {media.category === 'Trending Videos' ? 'Video' : 'Nude'}
              </span>
            )}
          </div>

          <p className="text-[10px] text-stone-500 font-mono mt-1">
            ID: {media.id} | Creator: {media.creator} | Views: {media.views}
          </p>

          {media.desc && (
            <p className="text-[11px] text-stone-400 line-clamp-2 mt-1 leading-relaxed">
              {media.desc}
            </p>
          )}
        </div>

        {/* Interesting Titles / Tag Pills */}
        <div className="pt-1.5 border-t border-stone-900/60 flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
            {interestingTitles.length > 0 ? (
              interestingTitles.slice(0, 3).map((t, idx) => (
                <span
                  key={idx}
                  className="bg-stone-900 border border-stone-900/50 px-2 py-0.5 rounded-full text-[9px] text-stone-300 truncate max-w-[140px]"
                >
                  {t}
                </span>
              ))
            ) : (
              <span className="text-[9px] text-stone-600 font-mono">Stream available</span>
            )}
          </div>

          <span className="text-[10px] font-mono font-bold text-orange-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 flex-shrink-0">
            Play →
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Home Client Main ─────────────────────────────────────────────────────────
export default function HomeClient({
  initialCreators = [],
  initialVideos = [],
}: {
  initialCreators: Creator[];
  initialVideos?: Video[];
}) {
  const [creators] = useState<Creator[]>(initialCreators);
  const [videos] = useState<Video[]>(initialVideos);
  const [activeTab, setActiveTab] = useState<'topics' | 'trending' | 'nudes'>('topics');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Inline watch view
  const [activeView, setActiveView] = useState<'grid' | 'watch'>('grid');
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  // Notification
  const [notification, setNotification] = useState<string | null>(null);

  // Ads
  const [bannerAd, setBannerAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>(null);
  const [popupAd, setPopupAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>(null);
  const [showPopupModal, setShowPopupModal] = useState(false);

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
  }, [searchQuery, activeTab]);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleShare = (video: Video) => {
    const shareUrl = `${window.location.origin}/?watch=${video.id}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard
        .writeText(shareUrl)
        .then(() => triggerNotification('Copied stream link!'))
        .catch(() => triggerNotification('Could not copy link.'));
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

  // Filtered lists
  const filteredCreators = creators.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const trendingVideos = videos.filter(
    (item) => item.category === 'Trending Videos' || item.type === 'video'
  );
  const filteredTrending = trendingVideos.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const nudesImages = videos.filter(
    (item) => item.category === 'Nudes' || item.type === 'image'
  );
  const filteredNudes = nudesImages.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.creator.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Active items based on current active tab
  let activeListLength = 0;
  if (activeTab === 'topics') activeListLength = filteredCreators.length;
  else if (activeTab === 'trending') activeListLength = filteredTrending.length;
  else if (activeTab === 'nudes') activeListLength = filteredNudes.length;

  const totalPages = Math.max(1, Math.ceil(activeListLength / ITEMS_PER_PAGE));

  const paginatedCreators = filteredCreators.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const paginatedTrending = filteredTrending.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const paginatedNudes = filteredNudes.slice(
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

              {/* Sidebar links */}
              <div className="space-y-2 pt-4">
                <span className="text-[10px] font-mono text-stone-500 uppercase tracking-widest block">Categories</span>
                <button
                  onClick={() => { setActiveTab('topics'); setActiveView('grid'); setIsSidebarOpen(false); }}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === 'topics' ? 'bg-orange-600 text-stone-950' : 'text-stone-400 hover:text-white hover:bg-stone-900'
                  }`}
                >
                  <Layout className="w-3.5 h-3.5" />
                  <span>Topics & Models</span>
                </button>
                <button
                  onClick={() => { setActiveTab('trending'); setActiveView('grid'); setIsSidebarOpen(false); }}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === 'trending' ? 'bg-orange-600 text-stone-950' : 'text-stone-400 hover:text-white hover:bg-stone-900'
                  }`}
                >
                  <VideoIcon className="w-3.5 h-3.5" />
                  <span>Trending Videos</span>
                </button>
                <button
                  onClick={() => { setActiveTab('nudes'); setActiveView('grid'); setIsSidebarOpen(false); }}
                  className={`w-full text-left py-2.5 px-3.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                    activeTab === 'nudes' ? 'bg-orange-600 text-stone-950' : 'text-stone-400 hover:text-white hover:bg-stone-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Nudes & Images</span>
                </button>
              </div>
            </div>

            {/* Sidebar bottom */}
            <div className="space-y-2 pt-4 border-t border-stone-900">
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
      )}

      {/* ── Sticky Top Header (Admin-styled) ─────────────────────────────────── */}
      <header className="sticky top-0 z-[1000] bg-[#0c0c0c]/95 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center justify-between gap-3 w-full md:w-auto">
            <Link
              href="/"
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => { setActiveView('grid'); setActiveVideo(null); }}
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

            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-amber-400 hover:text-amber-300 bg-stone-900 border border-amber-500/30 hover:border-amber-400/60 rounded-lg transition"
              title="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 max-w-md items-center mx-4">
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search topics, models, or tags..."
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
              className="bg-stone-900 hover:bg-stone-850 text-stone-300 px-3 py-1.5 rounded-lg ml-1.5 border border-stone-800 transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Navigation Tabs (Admin Style) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 w-full md:w-auto scrollbar-none">
            <button
              onClick={() => { setActiveTab('topics'); setActiveView('grid'); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'topics' && activeView === 'grid'
                  ? 'bg-orange-600 text-stone-950'
                  : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800/80'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>Topics ({creators.length})</span>
            </button>

            {trendingVideos.length > 0 && (
              <button
                onClick={() => { setActiveTab('trending'); setActiveView('grid'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'trending' && activeView === 'grid'
                    ? 'bg-orange-600 text-stone-950'
                    : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800/80'
                }`}
              >
                <VideoIcon className="w-3.5 h-3.5" />
                <span>Trending Videos ({trendingVideos.length})</span>
              </button>
            )}

            {nudesImages.length > 0 && (
              <button
                onClick={() => { setActiveTab('nudes'); setActiveView('grid'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  activeTab === 'nudes' && activeView === 'grid'
                    ? 'bg-orange-600 text-stone-950'
                    : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800/80'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Nudes ({nudesImages.length})</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Main Content Area ────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Mobile Search Input */}
        {activeView === 'grid' && (
          <div className="md:hidden w-full flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search topics, models, or tags..."
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
        )}

        {/* Sponsor Banner Ad */}
        {bannerAd?.enabled && bannerAd?.imageUrl && (
          <div className="w-full bg-[#111111] border border-orange-500/25 p-1 rounded-xl overflow-hidden group shadow-lg">
            <a
              href={bannerAd.linkUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-20 sm:h-24 relative block"
            >
              <img
                src={bannerAd.imageUrl}
                alt="Sponsor"
                className="w-full h-full object-cover rounded-lg group-hover:scale-[1.005] transition-transform duration-300"
              />
              <span className="absolute bottom-2 right-2 bg-stone-950/85 backdrop-blur-sm text-[8px] font-mono font-black text-orange-400 px-2 py-0.5 rounded border border-orange-500/20 uppercase">
                SPONSOR AD
              </span>
            </a>
          </div>
        )}

        {/* ── GRID VIEW (Admin Display Layout) ────────────────────────────────── */}
        {activeView === 'grid' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Section Header (Admin Style) */}
            <div className="flex items-center justify-between border-b border-stone-800/80 pb-3">
              <h2 className="text-xs font-extrabold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                {activeTab === 'topics' && <Layout className="w-3.5 h-3.5 text-orange-500" />}
                {activeTab === 'trending' && <VideoIcon className="w-3.5 h-3.5 text-orange-500" />}
                {activeTab === 'nudes' && <ImageIcon className="w-3.5 h-3.5 text-orange-500" />}
                <span>
                  {activeTab === 'topics' && `Trending Topics & Models (${filteredCreators.length})`}
                  {activeTab === 'trending' && `Trending Videos (${filteredTrending.length})`}
                  {activeTab === 'nudes' && `Nudes & Images (${filteredNudes.length})`}
                </span>
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

            {/* TAB 1: TOPICS GRID */}
            {activeTab === 'topics' && (
              <>
                {paginatedCreators.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {paginatedCreators.map((creator) => (
                      <TopicCard
                        key={creator.name}
                        creator={creator}
                        onDirectPlay={handleDirectPlay}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-16 border border-stone-850 rounded-2xl bg-white/[0.02] text-center space-y-3">
                    <Compass className="w-10 h-10 text-stone-600 mx-auto" />
                    <div>
                      <h4 className="font-bold text-stone-200 text-sm">No topics found</h4>
                      <p className="text-xs text-stone-500 mt-1">Try another keyword or clear search filter.</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: TRENDING VIDEOS GRID */}
            {activeTab === 'trending' && (
              <>
                {paginatedTrending.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {paginatedTrending.map((vid) => (
                      <MediaCard
                        key={vid.id}
                        media={vid}
                        onPlay={handleDirectPlay}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-16 border border-stone-850 rounded-2xl bg-white/[0.02] text-center space-y-3">
                    <VideoIcon className="w-10 h-10 text-stone-600 mx-auto" />
                    <div>
                      <h4 className="font-bold text-stone-200 text-sm">No videos found</h4>
                      <p className="text-xs text-stone-500 mt-1">Try another keyword or clear search filter.</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB 3: NUDES / IMAGES GRID */}
            {activeTab === 'nudes' && (
              <>
                {paginatedNudes.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {paginatedNudes.map((img) => (
                      <MediaCard
                        key={img.id}
                        media={img}
                        onPlay={handleDirectPlay}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="p-16 border border-stone-850 rounded-2xl bg-white/[0.02] text-center space-y-3">
                    <ImageIcon className="w-10 h-10 text-stone-600 mx-auto" />
                    <div>
                      <h4 className="font-bold text-stone-200 text-sm">No image leaks found</h4>
                      <p className="text-xs text-stone-500 mt-1">Try another keyword or clear search filter.</p>
                    </div>
                  </div>
                )}
              </>
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
        )}

        {/* ── INLINE WATCH VIEW ──────────────────────────────────────────────── */}
        {activeView === 'watch' && activeVideo && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
            <button
              onClick={() => {
                setActiveView('grid');
                setActiveVideo(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 text-xs font-mono font-bold text-stone-400 hover:text-white rounded-lg transition cursor-pointer group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Overview</span>
            </button>

            <div className="space-y-4">
              {activeVideo.type === 'image' ? (
                <>
                  <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-stone-800 shadow-xl flex items-center justify-center select-none">
                    <img
                      src={activeVideo.imageUrl || activeVideo.thumbnailUrl || '/images/v2.png'}
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

              {/* Action bar */}
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
                  <p className="text-xs text-stone-400 mt-2 leading-relaxed bg-stone-900/10 p-3 rounded-xl border border-stone-900/50">
                    {activeVideo.desc}
                  </p>
                )}
              </div>

              {/* Banner ad on watch page */}
              {bannerAd?.enabled && bannerAd?.imageUrl && (
                <div className="w-full bg-[#111111] border border-orange-500/20 p-1 rounded-xl overflow-hidden group shadow-lg mt-4">
                  <a
                    href={bannerAd.linkUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-16 sm:h-20 relative block"
                  >
                    <img
                      src={bannerAd.imageUrl}
                      alt="Sponsor"
                      className="w-full h-full object-cover rounded-lg group-hover:scale-[1.005] transition-transform duration-300"
                    />
                    <span className="absolute bottom-2 right-2 bg-stone-950/80 backdrop-blur-sm text-[8px] font-mono font-black text-orange-400 px-1.5 py-0.5 rounded border border-orange-500/20 uppercase">
                      SPONSOR
                    </span>
                  </a>
                </div>
              )}

              {/* Related Videos: You May Also Like */}
              <div className="pt-8 border-t border-stone-850 mt-8">
                <h3 className="text-xs font-extrabold text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-orange-500" />
                  <span>You May Also Like</span>
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {creators
                    .filter((c) => c.name !== activeVideo.creator)
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 6)
                    .map((creator) => (
                      <TopicCard
                        key={creator.name}
                        creator={creator}
                        onDirectPlay={handleDirectPlay}
                      />
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#0c0c0c] border-t border-stone-850 py-10 mt-16 text-center md:text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <div
              onClick={() => {
                setActiveView('grid');
                setActiveVideo(null);
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

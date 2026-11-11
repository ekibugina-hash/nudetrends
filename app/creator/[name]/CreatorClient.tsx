"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  CheckCircle2, 
  ArrowLeft, 
  Share2, 
  Menu, 
  X,
  ChevronDown,
  Flame,
  HelpCircle,
  TrendingUp
} from 'lucide-react';
import { Video, Creator } from '../../types';
import VideoPlayer from '../../components/VideoPlayer';
import CommentsSection from '../../components/CommentsSection';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleShare = () => {
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

  const displayedVideos = searchQuery
    ? videos.filter(
        (v) =>
          (v.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (v.desc || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : videos;

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
            className="w-full h-full object-cover object-top opacity-75 sm:opacity-80 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#090909]/30 via-transparent to-[#090909]" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#090909] via-[#090909]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#090909]/40 via-transparent to-[#090909]/40" />
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

      {/* Main Container — top padding pushes all content below the background photo */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-[360px] sm:pt-[420px] pb-6 space-y-6">
        {/* Semantic Breadcrumbs for SEO & UX */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] font-mono text-stone-400 flex-wrap">
          <Link href="/" className="hover:text-orange-400 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/#trending-videos" className="hover:text-orange-400 transition-colors">Trends</Link>
          <span>/</span>
          <span className="text-stone-200 font-bold">{creatorName}</span>
        </nav>

        {/* ── Topic Hero & Info Section ─────── */}
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
                  onClick={handleShare}
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

        {/* ── Trend Media Items Section (All media in this trend display & play below each other) ── */}
        <div className="space-y-8 max-w-4xl mx-auto animate-fadeIn">
          {displayedVideos.map((vid, index) => (
            <div key={vid.id || index} className="space-y-4">
              {/* Player / Photo View Container */}
              <div className="border border-stone-800 rounded-3xl overflow-hidden bg-black p-1 sm:p-2.5 shadow-2xl">
                {vid.type === 'image' ? (
                  <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center select-none">
                    <img
                      src={vid.imageUrl || vid.thumbnailUrl || '/images/v2.png'}
                      alt={vid.title || `${creatorName} photo view`}
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 right-4 bg-stone-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-orange-500/30 text-[9px] font-mono font-black text-orange-400 uppercase tracking-widest shadow-xl">
                      {videos.length > 1 ? `Photo #${index + 1}` : 'Photo View'}
                    </div>
                  </div>
                ) : (
                  <VideoPlayer video={vid} />
                )}
              </div>

              {/* Media Title & Details Bar */}
              <div className="bg-stone-950 border border-stone-850 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {videos.length > 1 && (
                      <span className="text-[10px] font-mono text-orange-400 uppercase tracking-wider block font-bold">
                        Media ${index + 1} of ${videos.length} {vid.type === 'image' ? '• Photo' : '• Video'}
                      </span>
                    )}
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-snug mt-0.5">
                      {vid.title || (videos.length > 1 ? `${creatorName} (Part ${index + 1})` : creatorName)}
                    </h2>
                  </div>
                </div>

                {vid.desc && vid.desc !== bio && (
                  <p className="text-xs text-stone-400 leading-relaxed bg-stone-900/40 p-3 rounded-xl border border-stone-850">
                    {vid.desc}
                  </p>
                )}
              </div>
            </div>
          ))}

          {displayedVideos.length === 0 && (
            <div className="p-16 border border-stone-850 rounded-2xl bg-white/[0.02] text-center space-y-3">
              <p className="font-bold text-stone-200 text-sm">No media found matching &quot;{searchQuery}&quot;</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-orange-500 hover:underline font-mono"
              >
                Clear search
              </button>
            </div>
          )}

          {/* Comments Section for the trend */}
          {videos.length > 0 && (
            <CommentsSection videoId={videos[0].id} />
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
          <div className="w-full max-w-xs sm:max-w-sm mx-auto pt-4">
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

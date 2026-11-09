'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Share2,
  TrendingUp,
  Play,
  Menu,
  X,
  VideoIcon,
  ImageIcon,
  CheckCircle2,
} from 'lucide-react';
import { Video } from '../../types';
import VideoPlayer from '../../components/VideoPlayer';
import CommentsSection from '../../components/CommentsSection';

interface WatchContentProps {
  video: Video;
  relatedVideos: Video[];
}

function RelatedCard({ vid }: { vid: Video }) {
  const isImage = vid.type === 'image';
  const thumb = vid.imageUrl || vid.thumbnailUrl;

  return (
    <Link
      href={`/watch/${vid.id}`}
      className="group flex gap-3 p-2 rounded-xl hover:bg-stone-900/60 border border-transparent hover:border-stone-800 transition-all duration-150 cursor-pointer"
      prefetch={false}
    >
      {/* Thumbnail */}
      <div className="relative flex-shrink-0 w-28 sm:w-32 aspect-video bg-stone-950 rounded-lg overflow-hidden border border-stone-900">
        {thumb ? (
          <Image
            fill
            src={thumb}
            alt={vid.title || 'Content thumbnail'}
            sizes="128px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ backgroundImage: vid.gradient }}
          >
            {!isImage && <Play className="w-5 h-5 text-white/60" />}
          </div>
        )}
        {!isImage && (
          <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-mono font-bold text-stone-300 px-1 py-0.5 rounded">
            {vid.duration}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0 space-y-1 py-0.5">
        <p className="text-xs font-bold text-stone-200 line-clamp-2 leading-snug group-hover:text-orange-400 transition-colors">
          {vid.title || 'Untitled Content'}
        </p>
        <p className="text-[10px] font-mono text-stone-600">{vid.creator}</p>
        <p className="text-[10px] font-mono text-stone-700">{vid.views} &bull; {vid.time}</p>
      </div>
    </Link>
  );
}

export default function WatchContent({ video, relatedVideos }: WatchContentProps) {
  const [notification, setNotification] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [bannerAd, setBannerAd] = useState<{ enabled: boolean; imageUrl: string; linkUrl: string } | null>({
    enabled: true,
    imageUrl: '/images/sponsor-banner.jpg',
    linkUrl: 'https://www.hexescortsug.com',
  });

  const isImage = video.type === 'image';

  // Load banner ad from localStorage
  useEffect(() => {
    const savedBanner = localStorage.getItem('nude_trends_banner_ads');
    if (savedBanner) {
      try {
        const parsed = JSON.parse(savedBanner);
        if (parsed.enabled && parsed.imageUrl) {
          setBannerAd(parsed);
        }
      } catch (e) {}
    }
  }, []);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/watch/${video.id}`;
    navigator.clipboard.writeText(url).then(() => {
      triggerNotification('Copied stream link to clipboard!');
    });
  };

  return (
    <>
      {/* Toast notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[3000] bg-orange-600 border border-orange-500 text-stone-950 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 font-bold text-xs">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-[1000] bg-[#090909]/92 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 cursor-pointer group flex-shrink-0">
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-orange-500/60 bg-black shadow-md shadow-orange-500/20">
              <img src="/logo.png" alt="Nude Trends" className="w-full h-full object-cover" />
            </div>
            <h1 className="font-extrabold text-white text-lg sm:text-xl tracking-tighter group-hover:text-orange-500 transition-colors uppercase flex items-center">
              Nude
              <span className="bg-orange-500 text-black px-2 py-0.5 rounded-md font-black text-sm sm:text-base tracking-tight shadow-md ml-2">
                TRENDS
              </span>
            </h1>
          </Link>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/?category=Trending%20Videos"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-400 hover:text-white bg-stone-900/50 hover:bg-stone-900 border border-stone-850 rounded-lg transition"
            >
              <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
              Trending
            </Link>
            <Link
              href="/?category=Nudes"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-400 hover:text-white bg-stone-900/50 hover:bg-stone-900 border border-stone-850 rounded-lg transition"
            >
              <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
              Nudes
            </Link>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="sm:hidden p-2 text-stone-400 hover:text-orange-500 bg-stone-900 border border-stone-850 rounded-lg transition"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[2000] sm:hidden">
          <div onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="absolute inset-y-0 right-0 w-64 bg-[#0c0c0c] border-l border-stone-850 p-6 flex flex-col gap-6 z-10">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-white text-base uppercase tracking-tighter">Menu</span>
              <button onClick={() => setIsSidebarOpen(false)} className="p-1.5 bg-white rounded-full">
                <X className="w-4 h-4 text-black" />
              </button>
            </div>
            <div className="space-y-2">
              <Link href="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-stone-900/50 text-stone-400">
                <VideoIcon className="w-3.5 h-3.5 text-orange-500" /> Home
              </Link>
              <Link href="/?category=Trending%20Videos" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-stone-900/50 text-stone-400">
                <TrendingUp className="w-3.5 h-3.5 text-orange-500" /> Trending Videos
              </Link>
              <Link href="/?category=Nudes" onClick={() => setIsSidebarOpen(false)} className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold bg-stone-900/50 text-stone-400">
                <ImageIcon className="w-3.5 h-3.5 text-orange-500" /> Nudes
              </Link>
            </div>
            <div className="mt-auto pt-4 border-t border-stone-900">
              <a href="https://t.me/+d5-D8vyHKuMzZDdk" target="_blank" rel="noopener noreferrer"
                className="w-full py-2 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19.9 3.01L2.24 9.81c-1.13.45-1.12 1.09-.2 1.37l4.53 1.41 10.5-6.62c.5-.3.95-.14.57.2L9.1 14.67v3.38c.33 0 .48-.15.66-.33l1.58-1.54 3.29 2.43c.6.33 1.04.16 1.19-.55l2.16-10.2c.22-.88-.34-1.28-.98-1z" />
                </svg>
                Telegram
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── PAGE BODY ─── */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── LEFT: Main content column ── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Back button */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-400 text-stone-950 text-xs font-black rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] group"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              Back to Home
            </Link>

            {/* Banner ad (top of watch page) */}
            {bannerAd && (
              <div className="w-full max-w-2xl mx-auto bg-gradient-to-r from-pink-500/20 via-purple-500/10 to-pink-500/20 p-1 rounded-2xl border border-pink-500/30 overflow-hidden group shadow-lg">
                <a href={bannerAd.linkUrl || 'https://www.hexescortsug.com'} target="_blank" rel="noopener noreferrer" className="w-full aspect-[16/9] relative block">
                  <Image fill src={bannerAd.imageUrl} alt="Sponsor Banner Ad" sizes="100vw" className="object-cover rounded-lg group-hover:scale-[1.005] transition-transform duration-300" />
                  <span className="absolute bottom-2 right-2 bg-stone-950/85 backdrop-blur-sm text-[8px] font-mono font-black text-orange-400 px-2 py-0.5 rounded border border-orange-500/20 uppercase">
                    SPONSOR AD
                  </span>
                </a>
              </div>
            )}

            {/* ── PLAYER / IMAGE VIEWER ── */}
            {isImage ? (
              <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-stone-800 shadow-xl flex items-center justify-center select-none">
                <Image
                  fill
                  src={video.imageUrl || video.thumbnailUrl || '/images/v2.png'}
                  alt={video.title || 'Premium Image'}
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-contain"
                  priority
                />
                <div className="absolute top-4 right-4 bg-stone-950/80 backdrop-blur-sm px-2.5 py-1 rounded-md border border-white/5 text-[9px] font-mono font-black text-orange-400 uppercase tracking-widest shadow">
                  Premium Nude Image
                </div>
              </div>
            ) : (
              <VideoPlayer video={video} />
            )}

            {/* ── ACTION BAR ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-stone-900">
              <h1 className="text-lg font-black text-white font-mono tracking-tight flex-1 leading-tight">
                {video.title || 'Untitled Content'}
              </h1>
              <button
                onClick={handleShare}
                id="watch-copy-link-btn"
                className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-stone-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition border border-stone-800 hover:border-stone-700 flex-shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                Copy Link
              </button>
            </div>

            {/* ── METADATA ── */}
            <div className="py-1 space-y-1">
              <div className="flex items-center gap-2 text-xs text-stone-400 font-mono flex-wrap">
                <span className="font-bold text-stone-300">{video.creator}</span>
                {video.views && <><span>•</span><span>{video.views}</span></>}
                {video.time && <><span>•</span><span>{video.time}</span></>}
                <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  {isImage ? 'Nude Image' : 'Video'}
                </span>
              </div>
              {video.desc && (
                <p className="text-xs text-stone-400 mt-2 leading-relaxed bg-stone-900/20 p-3 rounded-xl border border-stone-900/50">
                  {video.desc}
                </p>
              )}
            </div>

            {/* ── COMMENTS SECTION ── */}
            <div className="pt-4 border-t border-stone-900">
              <CommentsSection videoId={video.id} />
            </div>
          </div>

          {/* ── RIGHT: Related videos sidebar ── */}
          <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <div className="lg:sticky lg:top-24 space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <h2 className="text-xs font-extrabold text-stone-300 uppercase tracking-widest">
                  More Premium Leaks
                </h2>
              </div>
              <div className="space-y-1">
                {relatedVideos.map((vid) => (
                  <RelatedCard key={vid.id} vid={vid} />
                ))}
              </div>
              <Link
                href="/"
                className="block text-center text-[11px] font-bold text-stone-500 hover:text-orange-400 transition py-3 border-t border-stone-900"
              >
                Browse All Content →
              </Link>
            </div>
          </aside>

        </div>
      </main>
    </>
  );
}

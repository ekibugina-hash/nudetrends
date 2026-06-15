"use client";

import Link from 'next/link';
import { Home, TrendingUp, ImageIcon, Send } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div className="min-h-screen bg-[#090909] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      
      {/* Ambient background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-orange-500/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-900/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(rgba(255,80,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,80,0,0.03) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className={`relative z-10 text-center max-w-lg w-full transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-10 group">
          <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-orange-500/60 shadow-md shadow-orange-500/20">
            <img src="/logo.png" alt="Nude Trends" className="w-full h-full object-cover" />
          </div>
          <span className="font-extrabold text-white text-lg tracking-tighter group-hover:text-orange-400 transition-colors uppercase">
            Nude<span className="bg-orange-500 text-black px-2 py-0.5 rounded-md font-black text-sm ml-2">TRENDS</span>
          </span>
        </Link>

        {/* 404 Glitch Number */}
        <div className="relative mb-6 select-none">
          <p className="text-[120px] sm:text-[160px] font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-orange-400 via-orange-600 to-orange-900/30">
            404
          </p>
          {/* Glitch layers */}
          <p className="absolute inset-0 text-[120px] sm:text-[160px] font-black leading-none tracking-tighter text-orange-500/20 blur-sm pointer-events-none">
            404
          </p>
        </div>

        {/* Error message */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 px-4 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[11px] font-mono font-bold text-orange-400 uppercase tracking-widest">Page Not Found</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mb-3 leading-tight">
            This content<br />has been removed.
          </h1>
          <p className="text-stone-500 text-sm leading-relaxed max-w-sm mx-auto">
            The video or image you&apos;re looking for may have been deleted, moved, or the link is incorrect.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <Link
            href="/"
            id="not-found-home-btn"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-400 text-stone-950 font-black text-sm rounded-xl transition-all duration-200 shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 hover:scale-[1.02]"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/?category=Trending%20Videos"
            id="not-found-trending-btn"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-200 font-bold text-sm rounded-xl transition-all duration-200"
          >
            <TrendingUp className="w-4 h-4 text-orange-500" />
            Trending Videos
          </Link>
          <Link
            href="/?category=Nudes"
            id="not-found-nudes-btn"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-200 font-bold text-sm rounded-xl transition-all duration-200"
          >
            <ImageIcon className="w-4 h-4 text-orange-500" />
            Nudes
          </Link>
        </div>

        {/* Telegram CTA */}
        <div className="mt-10 pt-8 border-t border-stone-900">
          <p className="text-[11px] font-mono text-stone-600 uppercase tracking-widest mb-4">Get content first on our channel</p>
          <a
            href="https://t.me/+d5-D8vyHKuMzZDdk"
            target="_blank"
            rel="noopener noreferrer"
            id="not-found-telegram-btn"
            className="inline-flex items-center gap-2.5 px-6 py-3 bg-[#0088cc] hover:bg-[#0077b3] text-white font-bold text-sm rounded-xl transition-all shadow-lg hover:scale-[1.02]"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M19.9 3.01L2.24 9.81c-1.13.45-1.12 1.09-.2 1.37l4.53 1.41 10.5-6.62c.5-.3.95-.14.57.2L9.1 14.67v3.38c.33 0 .48-.15.66-.33l1.58-1.54 3.29 2.43c.6.33 1.04.16 1.19-.55l2.16-10.2c.22-.88-.34-1.28-.98-1z" />
            </svg>
            Join Telegram Channel
          </a>
        </div>

      </div>
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RefreshCw,
  AlertCircle,
  Download,
  Camera,
  Settings,
  Check,
} from 'lucide-react';
import { Video } from '../types';
import CommentsSection from './CommentsSection';

interface VideoPlayerProps {
  video: Video;
}

const QUALITY_OPTIONS = [
  { label: 'Original Quality (HD)', value: 1080 },
];

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isQualityOpen, setIsQualityOpen] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState(1080);
  const [screenshotFlash, setScreenshotFlash] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [buffered, setBuffered] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const seekbarRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset when video changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    setIsQualityOpen(false);
    setShowDownloadMenu(false);
    if (videoRef.current) videoRef.current.load();
  }, [video.id, video.videoUrl]);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.error('Video play failed:', e);
          setError('Failed to stream video. Check your R2 bucket CORS/access settings.');
        });
    }
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      // Update buffer progress
      const buf = videoRef.current.buffered;
      if (buf.length > 0 && videoRef.current.duration > 0) {
        setBuffered((buf.end(buf.length - 1) / videoRef.current.duration) * 100);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    videoRef.current.muted = next;
    videoRef.current.volume = next ? 0 : volume;
  };

  const seekTo = (percentage: number) => {
    if (!videoRef.current || duration === 0) return;
    const t = Math.max(0, Math.min(1, percentage)) * duration;
    videoRef.current.currentTime = t;
    setCurrentTime(t);
  };

  const getSeekPercentageFromEvent = (e: React.MouseEvent | MouseEvent): number => {
    if (!seekbarRef.current) return 0;
    const rect = seekbarRef.current.getBoundingClientRect();
    return (e.clientX - rect.left) / rect.width;
  };

  const handleSeekbarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    seekTo(getSeekPercentageFromEvent(e));
  };

  const handleSeekbarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    seekTo(getSeekPercentageFromEvent(e));
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => seekTo(getSeekPercentageFromEvent(e));
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, duration]);

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (el.requestFullscreen) {
      el.requestFullscreen();
    } else if ((el as any).webkitRequestFullscreen) {
      (el as any).webkitRequestFullscreen();
    }
  };

  const handleScreenshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const link = document.createElement('a');
      link.download = `${video.title || 'screenshot'}-${Math.floor(currentTime)}s.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
    setScreenshotFlash(true);
    setTimeout(() => setScreenshotFlash(false), 300);
  };

  const handleDownload = (quality: string) => {
    setShowDownloadMenu(false);
    if (video.videoUrl) {
      const link = document.createElement('a');
      link.href = video.videoUrl;
      link.download = `${video.title || 'video'}-${quality}.mp4`;
      link.click();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'm' || e.key === 'M') { e.preventDefault(); toggleMute(); }
      else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); toggleFullscreen(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); if (videoRef.current) { videoRef.current.currentTime = Math.min(duration, currentTime + 10); } }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); if (videoRef.current) { videoRef.current.currentTime = Math.max(0, currentTime - 10); } }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, isMuted, volume, duration, currentTime]);

  const formatTime = (t: number) => {
    if (isNaN(t) || t < 0) return '00:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const hasRealStream = !!video.videoUrl;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
    <div
      ref={containerRef}
      className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-stone-800 shadow-2xl group select-none"
      style={{ boxShadow: '0 0 40px rgba(0,0,0,0.8)' }}
    >
      {/* Screenshot flash overlay */}
      {screenshotFlash && (
        <div className="absolute inset-0 bg-white/30 z-50 pointer-events-none animate-ping" style={{ animationDuration: '0.2s', animationIterationCount: 1 }} />
      )}

      {/* Video or Backdrop */}
      {hasRealStream ? (
        <video
          ref={videoRef}
          src={`${video.videoUrl}#t=0.001`}
          poster={video.thumbnailUrl || undefined}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onError={() => setError('Error loading stream. Check your network or the R2 stream URL.')}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />
      ) : (
        <div
          className="w-full h-full relative bg-cover bg-center flex items-center justify-center cursor-pointer"
          style={{ background: video.gradient || 'linear-gradient(135deg, #1a0500, #000)' }}
          onClick={() => { setIsPlaying(p => !p); setDuration(355); }}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10 flex flex-col items-center gap-3 text-center">
            <div className={`w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-400 text-black flex items-center justify-center transition shadow-lg ${isPlaying ? 'opacity-40' : ''}`}>
              {isPlaying ? <Pause className="w-7 h-7 fill-black" /> : <Play className="w-7 h-7 fill-black ml-1" />}
            </div>
            {!isPlaying && (
              <p className="text-xs text-stone-300 max-w-xs">No stream URL linked. Add one via Admin &rarr; Upload.</p>
            )}
            {isPlaying && (
              <div className="flex gap-1 items-center h-6">
                {[2, 4, 3, 5, 2, 4, 3, 5, 2, 4].map((h, i) => (
                  <span key={i} className="w-0.5 bg-orange-500 rounded-full animate-pulse"
                    style={{ height: `${h * 3}px`, animationDelay: `${i * 0.1}s` }} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center text-center p-6 z-40">
          <AlertCircle className="w-12 h-12 text-orange-500 mb-3" />
          <p className="font-bold text-stone-100 text-sm mb-1">Stream Error</p>
          <p className="text-xs text-stone-400 max-w-sm mb-4">{error}</p>
          <button
            onClick={() => { setError(null); if (videoRef.current) videoRef.current.load(); }}
            className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-black font-bold text-xs rounded-lg flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      )}

      {/* ─── LIVE TIMESTAMP overlay top-left ─── */}
      <div className="absolute top-3 left-3 z-30 pointer-events-none">
        <div className="bg-black/70 backdrop-blur-sm border border-white/10 rounded px-2 py-0.5 font-mono font-black text-white text-sm tracking-widest shadow">
          {formatTime(hasRealStream ? currentTime : isPlaying ? 15 : 0)}
        </div>
      </div>

      {/* ─── HD BADGE top-right ─── */}
      {video.videoUrl && (
        <div className="absolute top-3 right-3 z-30 pointer-events-none">
          <span className="bg-orange-600/90 text-black text-[9px] font-black font-mono px-2 py-0.5 rounded uppercase tracking-wider shadow">
            HD
          </span>
        </div>
      )}

      {/* ─── BOTTOM CONTROLS BAR ─── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black via-black/80 to-transparent pt-10 pb-3 px-3">

        {/* ── SEEKBAR ── */}
        <div
          ref={seekbarRef}
          onMouseDown={handleSeekbarMouseDown}
          onClick={handleSeekbarClick}
          className="w-full h-2 group/seek cursor-pointer relative mb-3 rounded-full overflow-hidden bg-stone-700/60"
          style={{ touchAction: 'none' }}
        >
          {/* Buffered */}
          <div
            className="absolute top-0 left-0 h-full bg-stone-500/50 rounded-full"
            style={{ width: `${buffered}%` }}
          />
          {/* Played */}
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full"
            style={{ width: `${hasRealStream ? progress : (isPlaying ? 5 : 0)}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-orange-400 border-2 border-white rounded-full shadow-md shadow-orange-500/40 transition-opacity"
            style={{ left: `calc(${hasRealStream ? progress : (isPlaying ? 5 : 0)}% - 7px)` }}
          />
        </div>

        {/* ── CONTROLS ROW ── */}
        <div className="flex items-center justify-between gap-2">

          {/* LEFT: Play + Volume + Time */}
          <div className="flex items-center gap-3 min-w-0">

            {/* Play/Pause */}
            <button
              onClick={hasRealStream ? togglePlay : () => { setIsPlaying(p => !p); setDuration(355); }}
              className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 hover:bg-orange-500 border border-white/10 hover:border-orange-500 flex items-center justify-center transition group/play"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying
                ? <Pause className="w-3.5 h-3.5 fill-white text-white" />
                : <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
              }
            </button>

            {/* Volume group */}
            <div className="flex items-center gap-1.5 group/vol">
              <button
                onClick={toggleMute}
                className="p-1 text-stone-400 hover:text-white transition flex-shrink-0"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0
                  ? <VolumeX className="w-4 h-4 text-orange-500" />
                  : <Volume2 className="w-4 h-4" />
                }
              </button>
              {/* Volume slider — visible always, compact */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-14 h-1 bg-stone-700 rounded-full appearance-none accent-orange-500 cursor-pointer"
                style={{ accentColor: '#f97316' }}
              />
            </div>

            {/* Timestamp */}
            <div className="font-mono text-[11px] text-stone-300 whitespace-nowrap flex-shrink-0">
              <span className="text-white font-bold">{formatTime(hasRealStream ? currentTime : isPlaying ? 15 : 0)}</span>
              <span className="text-stone-600 mx-0.5">/</span>
              <span>{hasRealStream ? formatTime(duration) : video.duration}</span>
            </div>
          </div>

          {/* RIGHT: Screenshot + Download + Quality + Fullscreen */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

            {/* Screenshot */}
            <button
              onClick={handleScreenshot}
              disabled={!hasRealStream}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition disabled:opacity-30 disabled:cursor-not-allowed"
              title="Screenshot (saves PNG)"
            >
              <Camera className="w-3.5 h-3.5 text-stone-300" />
            </button>

            {/* Download */}
            <div className="relative">
              <button
                onClick={() => { setShowDownloadMenu(p => !p); setIsQualityOpen(false); }}
                className="w-7 h-7 rounded-lg bg-orange-600/80 hover:bg-orange-500 border border-orange-500 flex items-center justify-center transition"
                title="Download"
              >
                <Download className="w-3.5 h-3.5 text-white" />
              </button>
              {showDownloadMenu && (
                <div className="absolute bottom-9 right-0 w-36 bg-[#0e0e0e] border border-stone-800 rounded-xl shadow-2xl py-1 z-50 overflow-hidden">
                  <p className="text-[9px] font-mono font-bold text-stone-600 uppercase tracking-widest px-3 py-1.5">Download Quality</p>
                  {['1080p Full HD', '720p HD', '480p SD'].map((q) => (
                    <button
                      key={q}
                      onClick={() => handleDownload(q)}
                      className="w-full text-left px-3 py-2 text-[11px] text-stone-300 hover:bg-stone-800 hover:text-white transition-colors flex items-center gap-2"
                    >
                      <Download className="w-3 h-3 text-orange-500" />
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality selector */}
            <div className="relative">
              <button
                onClick={() => { setIsQualityOpen(p => !p); setShowDownloadMenu(false); }}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition"
                title="Playback Quality"
              >
                <Settings className="w-3.5 h-3.5 text-stone-300" />
              </button>
              {isQualityOpen && (
                <div className="absolute bottom-9 right-0 w-36 bg-[#0e0e0e] border border-stone-800 rounded-xl shadow-2xl py-1 z-50 overflow-hidden">
                  <p className="text-[9px] font-mono font-bold text-stone-600 uppercase tracking-widest px-3 py-1.5">Quality</p>
                  {QUALITY_OPTIONS.map((q) => (
                    <button
                      key={q.value}
                      onClick={() => { setSelectedQuality(q.value); setIsQualityOpen(false); }}
                      className="w-full text-left px-3 py-2 text-[11px] text-stone-300 hover:bg-stone-800 hover:text-white transition-colors flex items-center justify-between"
                    >
                      <span>{q.label}</span>
                      {selectedQuality === q.value && <Check className="w-3 h-3 text-orange-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center transition"
              title="Fullscreen (F)"
            >
              <Maximize2 className="w-3.5 h-3.5 text-stone-300" />
            </button>

          </div>
        </div>
      </div>

    </div>

    {/* ─── COMMENTS SECTION ─── */}
    <CommentsSection videoId={video.id} />
  </>
  );
}

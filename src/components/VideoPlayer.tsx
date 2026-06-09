import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { Video } from '../types';

interface VideoPlayerProps {
  video: Video;
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  // If source changes, reset player states and load the video
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [video.id, video.videoUrl]);

  // Handle play/pause toggling
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((e) => {
          console.error("Video play failed:", e);
          setError("Failed to stream video. Ensure your R2 bucket CORS files and public access domains are correctly set up.");
        });
    }
  };

  // Sync update current time in simulation or real video
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Set duration when metadata is fully loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  // Handle volume controls
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
    const nextMuteState = !isMuted;
    setIsMuted(nextMuteState);
    videoRef.current.muted = nextMuteState;
    if (nextMuteState) {
      videoRef.current.volume = 0;
    } else {
      videoRef.current.volume = volume;
    }
  };

  // Handle manual click seeking on the progress timeline
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current || duration === 0) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const targetSecond = percentage * duration;
    
    videoRef.current.currentTime = targetSecond;
    setCurrentTime(targetSecond);
  };

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if ((videoRef.current as any).webkitRequestFullscreen) {
        (videoRef.current as any).webkitRequestFullscreen();
      }
    }
  };

  // Helper formatting mm:ss
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "00:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const hasRealStream = !!video.videoUrl;
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-stone-800 shadow-xl group">
      
      {/* Real HTML5 Video element or custom mock interface */}
      {hasRealStream ? (
        <div className="w-full h-full relative flex items-center justify-center">
          <video
            ref={videoRef}
            src={video.videoUrl}
            poster={video.thumbnailUrl || (video.videoUrl ? `${video.videoUrl}#t=1` : undefined)}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onError={() => setError("Error loading media byte stream. Check your network or stream URL.")}
            className="w-full h-full object-contain"
            onClick={togglePlay}
          />

          {error && (
            <div className="absolute inset-0 bg-stone-950/90 flex flex-col items-center justify-center text-center p-6 z-10">
              <AlertCircle className="w-12 h-12 text-orange-500 mb-3" />
              <div className="font-bold text-stone-100 text-sm mb-1">Stream Buffering Error</div>
              <p className="text-xs text-stone-400 max-w-sm mb-4 leading-relaxed">
                {error}
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setError(null); if (videoRef.current) videoRef.current.load(); }}
                  className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-stone-950 font-bold text-xs rounded transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry Stream
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Dynamic aesthetic backdrop visualizer when no videoURL is configured */
        <div 
          className="w-full h-full relative bg-cover bg-center flex flex-col justify-between p-6 cursor-pointer select-none"
          style={{ backgroundImage: video.gradient }}
          onClick={() => {
            // Start a quick simulation timer for mocking
            setIsPlaying(prev => !prev);
            setDuration(355); // 05:55 converted to seconds
          }}
        >
          {/* Mock visual overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] group-hover:backdrop-blur-none transition-all duration-300" />

          {/* Dummy top parameters */}
          <div className="relative z-10 flex justify-between items-center w-full">
            <span className="text-[10px] font-mono uppercase tracking-widest bg-orange-600/20 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-full">
              Premium Vault Access
            </span>
            <span className="text-[10px] font-mono text-stone-400">
              HOST: EXCLUSIVE_SERVER
            </span>
          </div>

          {/* Central Play/Pause mock button */}
          <div className="relative z-10 self-center flex flex-col items-center gap-3">
            <div className={`w-16 h-16 rounded-full bg-orange-500 hover:bg-orange-400 text-stone-950 flex items-center justify-center transition shadow-lg shadow-orange-500/10 ${isPlaying ? 'scale-90 opacity-40' : 'scale-100 opacity-100'}`}>
              {isPlaying ? <Pause className="w-7 h-7 fill-stone-950" /> : <Play className="w-7 h-7 fill-stone-950 ml-1" />}
            </div>
            
            {!isPlaying && (
              <div className="text-center px-4">
                <div className="text-xs font-bold text-stone-100 tracking-wide uppercase">Click to view stream mockup</div>
                <p className="text-[10px] text-stone-400 mt-1 max-w-xs leading-normal">
                  No real video URL connected yet. Upload a stream URL using the <span className="text-orange-400 font-bold">Upload Stream</span> button.
                </p>
              </div>
            )}

            {isPlaying && (
              <div className="flex gap-1.5 items-center justify-center h-6">
                {[1, 2, 3, 4, 1, 3, 2, 4, 1, 3, 2, 1, 4, 2].map((h, i) => (
                  <span 
                    key={i} 
                    className="w-0.5 bg-orange-500 rounded-full animate-pulse"
                    style={{ 
                      height: `${h * 4}px`, 
                      animationDelay: `${i * 0.15}s`,
                      animationDuration: '0.8s'
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="relative z-10 w-full flex items-center gap-3 bg-stone-950/60 p-3 rounded-lg border border-stone-800/50 backdrop-blur-md">
            <Info className="w-4 h-4 text-orange-400 flex-shrink-0" />
            <p className="text-[11px] text-stone-300 leading-normal">
              <strong>Tip:</strong> Adding a valid video stream URL will render the actual media object.
            </p>
          </div>
        </div>
      )}

      {/* Control UI overlay which becomes visible on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/75 to-transparent z-20 transition-opacity duration-300 opacity-0 group-hover:opacity-100">
        
        {/* Progress bar timeline */}
        <div 
          ref={timelineRef}
          onClick={handleTimelineClick}
          className="w-full h-1.5 hover:h-2.5 bg-stone-800 rounded-full cursor-pointer overflow-hidden mb-3 transition-all relative"
        >
          <div 
            className="h-full bg-gradient-to-r from-orange-600 to-orange-400 transition-all rounded-full"
            style={{ width: `${hasRealStream ? progressPercentage : (isPlaying ? 15 : 0)}%` }}
          />
        </div>

        {/* Play control strip */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Play Button */}
            <button 
              onClick={hasRealStream ? togglePlay : () => setIsPlaying(prev => !prev)}
              className="p-1.5 text-stone-300 hover:text-orange-500 transition"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Time Indicators */}
            <div className="text-xs font-mono text-stone-400">
              {hasRealStream ? (
                <>
                  <span>{formatTime(currentTime)}</span>
                  <span className="mx-1 text-stone-600">/</span>
                  <span>{formatTime(duration)}</span>
                </>
              ) : (
                <span>00:15 / {video.duration}</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Volume */}
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleMute}
                className="p-1 text-stone-400 hover:text-stone-100 transition"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-orange-500" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-stone-800 rounded-md appearance-none accent-orange-500 cursor-pointer"
              />
            </div>

            {/* Fullscreen */}
            <button 
              onClick={toggleFullscreen}
              className="p-1 text-stone-400 hover:text-stone-100 transition"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

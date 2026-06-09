import React, { useState } from 'react';
import { 
  Compass, 
  TrendingUp, 
  Search, 
  UploadCloud, 
  Info, 
  CheckCircle2, 
  MessageSquare, 
  ChevronRight, 
  ThumbsUp, 
  User, 
  Share2, 
  CornerDownRight, 
  HelpCircle,
  VideoOff,
  Play
} from 'lucide-react';
import { Video, Comment } from './types';
import { initialVideos, initialComments } from './data';
import VideoPlayer from './components/VideoPlayer';

export default function App() {
  const [videos, setVideos] = useState<Video[]>(initialVideos);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [activeView, setActiveView] = useState<'landing' | 'watch'>('landing');
  const [activeVideo, setActiveVideo] = useState<Video>(initialVideos[0]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All Leaks');
  const [searchQuery, setSearchQuery] = useState('');
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState('My Nickname');
  
  // Modals visibility
  const [notification, setNotification] = useState<string | null>(null);

  // Filter categorization categories
  const categories = [
    'All Leaks',
    'Ebony',
    'BBW',
    'Milf',
    'Thick'
  ];

  // Search and Category filters
  const filteredVideos = videos.filter((vid) => {
    const matchesCategory = selectedCategory === 'All Leaks' || vid.category === selectedCategory;
    const matchesQuery = 
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.creator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  // Load a video into watch view
  const handleSelectVideo = (video: Video) => {
    setActiveVideo(video);
    setActiveView('watch');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit dynamic comment responses
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const newComment: Comment = {
      id: `c-user-${Date.now()}`,
      videoId: activeVideo.id,
      author: commentName.trim() || 'Anonymous Developer',
      time: 'Just now',
      text: commentText.trim(),
      avatarInitials: (commentName.trim() || 'AD').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    };

    setComments([newComment, ...comments]);
    setCommentText('');
    triggerNotification('Comment posted successfully!');
  };

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleShare = (video: Video) => {
    const fakeUrl = `${window.location.origin}/?watch=${video.id}`;
    navigator.clipboard.writeText(fakeUrl);
    triggerNotification("Copied stream link to clipboard!");
  };

  return (
    <div className="min-h-screen bg-[#090909] text-[#f0f0f0] font-sans antialiased flex flex-col selection:bg-orange-500 selection:text-stone-950">
      
      {/* Dynamic Popups */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-[3000] bg-orange-600 border border-orange-500 text-stone-950 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-slideUp font-bold text-xs">
          <CheckCircle2 className="w-4 h-4 text-stone-950" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Sticky Header */}
      <header className="sticky top-0 z-[1000] bg-[#090909]/92 backdrop-blur-md border-b border-white/5">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div 
            onClick={() => { setActiveView('landing'); }}
            className="flex items-center gap-1.5 cursor-pointer group"
          >
            <span className="font-extrabold text-white text-lg sm:text-xl tracking-tighter group-hover:text-orange-500 transition-colors uppercase">
              Nude
            </span>
            <span className="bg-orange-500 text-black px-2 py-0.5 rounded-md font-black text-sm sm:text-base tracking-tight shadow-md shadow-orange-500/10">
              TRENDS
            </span>
          </div>

          {/* Core Central Search Wrap */}
          <div className="flex-1 max-w-lg relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-stone-500">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text"
              placeholder="Search videos, models, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-900/60 border border-stone-800 rounded-full py-1.5 pl-9 pr-4 text-sm text-stone-200 focus:outline-none focus:border-orange-500 placeholder:text-stone-500 transition-colors"
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

          {/* Action strip */}
          <div className="flex items-center gap-2.5">
            {/* Admin posts only. */}
          </div>
        </div>
      </header>

      {/* Grid Subnav categories */}
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
        
        {/* LANDING PAGE GRID VIEW */}
        {activeView === 'landing' && (
          <div className="space-y-6">
            
            {/* Video Streams Header */}
            <div className="flex items-center justify-between border-b border-stone-850 pb-3">
              <h3 className="text-sm font-extrabold text-stone-300 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-orange-500" />
                <span>Available Videos ({filteredVideos.length})</span>
              </h3>
              {selectedCategory !== 'All Leaks' && (
                <button 
                  onClick={() => setSelectedCategory('All Leaks')}
                  className="text-xs text-orange-500 hover:underline"
                >
                  Reset Category
                </button>
              )}
            </div>

            {/* Grid Container */}
            {filteredVideos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-x-3 gap-y-5 sm:gap-x-5 sm:gap-y-7">
                {filteredVideos.map((vid) => {
                  return (
                    <div 
                      key={vid.id}
                      onClick={() => handleSelectVideo(vid)}
                      className="group flex flex-col cursor-pointer bg-[#111111]/40 border border-stone-900 rounded-xl overflow-hidden hover:border-stone-800 transition shadow-sm hover:shadow-xl hover:-translate-y-0.5"
                    >
                      {/* Image Thumbnail Frame or CSS Gradient Fallback */}
                      <div className="relative aspect-video bg-stone-950 rounded-t-xl overflow-hidden border-b border-stone-900">
                        {vid.thumbnailUrl ? (
                          <img 
                            src={vid.thumbnailUrl} 
                            alt={vid.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : vid.videoUrl ? (
                          /* Browser native poster generation if no thumb, append #t=1.5 trick */
                          <video 
                            src={`${vid.videoUrl}#t=1.5`}
                            preload="metadata"
                            muted
                            playsInline
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                          />
                        ) : (
                          <div 
                            style={{ backgroundImage: vid.gradient }}
                            className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                          />
                        )}

                        {/* Central Play button UI */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-black/70 group-hover:bg-orange-500 group-hover:scale-110 border border-white/10 group-hover:border-orange-500 rounded-full flex items-center justify-center transition-all">
                          <Play className="w-4 h-4 fill-white group-hover:fill-stone-950 text-white group-hover:text-stone-950 ml-0.5 transition-colors" />
                        </div>

                        {/* Duration badge */}
                        <span className="absolute bottom-2 right-2 bg-stone-950/80 backdrop-blur-sm border border-white/5 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded text-stone-300">
                          {vid.duration}
                        </span>

                        {vid.videoUrl && (
                          <span className="absolute top-2 left-2 bg-orange-600/90 text-stone-950 text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded uppercase">
                            HD Video
                          </span>
                        )}
                      </div>

                      {/* Video description metadata block */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-[11px] sm:text-sm text-stone-100 group-hover:text-orange-400 line-clamp-2 leading-tight transition-colors">
                            {vid.title}
                          </h4>
                          <p className="text-[10px] sm:text-xs text-stone-400 font-semibold">{vid.creator}</p>
                        </div>

                        <div className="pt-3 flex items-center justify-between text-[11px] text-stone-500 font-mono border-t border-stone-900 mt-2">
                          <span>{vid.views}</span>
                          <span>{vid.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-16 border border-stone-800 rounded-2xl bg-[#111111]/30 text-center space-y-4">
                <VideoOff className="w-12 h-12 text-stone-600 mx-auto" />
                <div>
                  <h4 className="font-bold text-stone-200">No stream videos matched selection parameters</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">Try typing another query or clear the filter tabs to view original items.</p>
                </div>
                <button 
                  onClick={() => { setSelectedCategory('All Leaks'); setSearchQuery(''); }}
                  className="px-4 py-1.5 bg-stone-950 hover:bg-stone-900 border border-stone-800 hover:border-stone-700 text-stone-300 text-xs rounded transition"
                >
                  Clear All Filters
                </button>
              </div>
            )}
            
          </div>
        )}

        {/* WATCH STREAM DETAIL PAGE */}
        {activeView === 'watch' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Primary Left hand side Stream Player Frame */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Custom Integrated Stream Player wrapper */}
              <VideoPlayer video={activeVideo} />

              {/* Title & Metadata Strip */}
              <div className="bg-[#111111]/40 border border-stone-900 rounded-xl p-5 sm:p-6 space-y-4 shadow-xl">
                <div>
                  {activeVideo.videoUrl ? (
                    <span className="inline-block px-2.5 py-0.5 bg-orange-500 text-black text-[10px] uppercase font-bold rounded mb-2">
                      Premium HD Video
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 bg-stone-800 text-stone-400 text-[10px] uppercase font-bold rounded mb-2">
                      Exclusive Video
                    </span>
                  )}
                  
                  <h1 className="text-lg sm:text-xl font-extrabold text-stone-500 leading-snug">
                    <span className="text-stone-100">{activeVideo.title}</span>
                  </h1>
                </div>

                {/* Sub title details strip */}
                <div className="flex flex-wrap items-center justify-between gap-4 py-3 border-y border-stone-850">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-600 to-orange-500 text-stone-950 font-extrabold text-xs flex items-center justify-center">
                      {activeVideo.initials}
                    </div>
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-stone-100">{activeVideo.creator}</div>
                      <div className="text-[11px] text-stone-500 font-mono">1.2M Subscriber Core</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => handleShare(activeVideo)}
                      className="px-4 py-2 hover:bg-stone-900 border border-stone-850 hover:border-stone-700 text-stone-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Get Link
                    </button>
                    
                    <button 
                      onClick={() => triggerNotification("Action registered under simulated active pool")}
                      className="px-4 py-2 bg-stone-950 border border-stone-850 hover:border-stone-700 text-stone-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Upvote
                    </button>
                  </div>
                </div>

                {/* Detailed Narrative Panel */}
                <div className="space-y-2">
                  <div className="text-xs font-mono text-stone-500 flex items-center gap-3">
                    <span>{activeVideo.views}</span>
                    <span>•</span>
                    <span>{activeVideo.time}</span>
                    <span>•</span>
                    <span className="text-orange-500">Category: {activeVideo.category}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                    {activeVideo.desc}
                  </p>
                </div>

              </div>

              {/* Interactive Comments threads */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-850 pb-2">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  <h3 className="text-xs font-extrabold text-stone-300 uppercase tracking-widest">
                    Comments ({comments.filter(c => c.videoId === activeVideo.id).length})
                  </h3>
                </div>

                {/* Comment Box Submission */}
                <form onSubmit={handleAddComment} className="bg-stone-950 border border-stone-850 rounded-xl p-4 space-y-3 shadow-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                        Your Nickname
                      </label>
                      <input 
                        type="text"
                        placeholder="e.g. SysOps Chief"
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        className="w-full bg-[#111111] border border-stone-850 hover:border-stone-700 focus:border-orange-500 rounded-lg py-1.5 px-3 text-xs text-stone-100 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Your Response
                    </label>
                    <textarea 
                      required
                      rows={2}
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="w-full bg-[#111111] border border-stone-850 hover:border-stone-700 focus:border-orange-500 rounded-lg py-1.5 px-3 text-xs text-stone-100 placeholder:text-stone-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] text-stone-500 font-mono italic">
                      Simulated local state pool. Updates on submit.
                    </span>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[#f0f0f0] hover:bg-orange-500 hover:text-stone-950 text-stone-950 font-extrabold text-xs rounded-lg transition"
                    >
                      Post Comment
                    </button>
                  </div>
                </form>

                {/* Render Commments */}
                <div className="space-y-3">
                  {comments.filter(c => c.videoId === activeVideo.id).map((comment) => (
                    <div 
                      key={comment.id}
                      className="p-4 bg-stone-900/40 border border-stone-900 rounded-xl flex gap-3 animate-fadeIn"
                    >
                      <div className="w-8 h-8 rounded-full bg-stone-800 text-stone-300 font-bold text-[11px] flex items-center justify-center flex-shrink-0">
                        {comment.avatarInitials}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-200">{comment.author}</span>
                          <span className="text-[10px] text-stone-500 font-mono">{comment.time}</span>
                        </div>
                        <p className="text-xs text-stone-300 leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  ))}

                  {comments.filter(c => c.videoId === activeVideo.id).length === 0 && (
                    <div className="p-6 text-center text-xs text-stone-500 italic">
                      No comments yet. Be the first to comment!
                    </div>
                  )}
                </div>

              </div>

            </div>

            {/* RIGHT SIDEBAR: Up next queues stream cards list */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-stone-850 pb-2">
                <span className="text-xs font-extrabold text-stone-400 uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                  Other Videos
                </span>
                <button 
                  onClick={() => { setActiveView('landing'); }}
                  className="text-stone-500 hover:text-orange-500 text-[10px] font-mono hover:underline"
                >
                  Browse All
                </button>
              </div>

              <div className="space-y-3">
                {videos.filter((v) => v.id !== activeVideo.id).slice(0, 5).map((vid) => (
                  <div 
                    key={vid.id}
                    onClick={() => handleSelectVideo(vid)}
                    className="flex gap-3 group cursor-pointer p-2 bg-[#111111]/40 hover:bg-stone-900/50 border border-stone-900 hover:border-stone-850 rounded-xl transition"
                  >
                    {/* Thumbnail block */}
                    <div className="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden flex-shrink-0 bg-stone-950 border border-stone-950">
                      {vid.thumbnailUrl ? (
                        <img 
                          src={vid.thumbnailUrl} 
                          alt={vid.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      ) : vid.videoUrl ? (
                        <video 
                          src={`${vid.videoUrl}#t=1.5`}
                          preload="metadata"
                          className="w-full h-full object-cover pointer-events-none"
                          muted
                        />
                      ) : (
                        <div 
                          style={{ backgroundImage: vid.gradient }}
                          className="w-full h-full"
                        />
                      )}
                      
                      <span className="absolute bottom-1 right-1 bg-stone-950 px-1 py-0.5 rounded text-[8px] font-mono text-stone-400">
                        {vid.duration}
                      </span>
                    </div>

                    {/* Metadata stack */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="space-y-1">
                        <h4 className="font-bold text-xs text-stone-200 group-hover:text-orange-400 leading-snug line-clamp-2 transition-colors">
                          {vid.title}
                        </h4>
                        <p className="text-[11px] text-stone-400">{vid.creator}</p>
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        {vid.views}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Modern responsive footer */}
      <footer className="bg-[#111111] border-t border-white/5 py-10 mt-16 text-center sm:text-left">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
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
            <span className="hover:text-orange-500 transition-colors pointer-default">Trends & Editorials</span>
          </div>

          <p className="text-[11px] text-stone-600 font-mono">© 2026 Nude Trends Networks Inc. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Trash2, 
  PlusCircle, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle,
  Eye, 
  Settings, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Layout, 
  ExternalLink,
  Plus,
  X,
  Lock
} from 'lucide-react';
import { Video } from '../types';

interface AdsConfig {
  enabled: boolean;
  imageUrl: string;
  linkUrl: string;
}

export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  const [videos, setVideos] = useState<Video[]>([]);
  const [r2Loading, setR2Loading] = useState(true);
  const [interestingTitlesMap, setInterestingTitlesMap] = useState<Record<string, string[]>>({});
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'manage' | 'upload' | 'ads'>('manage');
  
  // Notification State
  const [notification, setNotification] = useState<string | null>(null);
  const [notifType, setNotifType] = useState<'success' | 'error'>('success');

  // Ad states
  const [bannerAd, setBannerAd] = useState<AdsConfig>({ enabled: false, imageUrl: '', linkUrl: '' });
  const [popupAd, setPopupAd] = useState<AdsConfig>({ enabled: false, imageUrl: '', linkUrl: '' });

  // Upload state
  const [mediaType, setMediaType] = useState<'video' | 'image'>('video');
  const [uploadSource, setUploadSource] = useState<'file' | 'url'>('file');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaCategory, setMediaCategory] = useState('Trending Videos');
  const [mediaCreator, setMediaCreator] = useState('Admin Upload');
  const [mediaDesc, setMediaDesc] = useState('');

  // Ad banner / popup image upload states
  const [bannerUploading, setBannerUploading] = useState(false);
  const [popupUploading, setPopupUploading] = useState(false);

  // Edit Interesting Title state
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [newInterestingTitle, setNewInterestingTitle] = useState('');

  // Auth gate check & data loader on mount
  useEffect(() => {
    // 1. Gating verification
    const isAuth = sessionStorage.getItem('nude_trends_admin_authenticated') === 'true';
    if (!isAuth) {
      setAuthorized(false);
      router.push('/login');
      return;
    }
    setAuthorized(true);

    // 2. Fetch videos from server dynamic list
    const fetchVideos = async () => {
      setR2Loading(true);
      try {
        const res = await fetch('/api/videos');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.media) {
            setVideos(data.media);
            const titleMap: Record<string, string[]> = {};
            data.media.forEach((v: Video) => {
              titleMap[v.id] = v.interestingTitles || [];
            });
            setInterestingTitlesMap(titleMap);
          }
        }
      } catch (e) {
        console.error('Admin: Failed to load videos:', e);
      } finally {
        setR2Loading(false);
      }
    };
    fetchVideos();

    // 3. Load ads configs
    const savedBanner = localStorage.getItem('nude_trends_banner_ads');
    if (savedBanner) {
      try { setBannerAd(JSON.parse(savedBanner)); } catch (e) {}
    }
    const savedPopup = localStorage.getItem('nude_trends_popup_ads');
    if (savedPopup) {
      try { setPopupAd(JSON.parse(savedPopup)); } catch (e) {}
    }
  }, [router]);

  const triggerNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setNotification(msg);
    setNotifType(type);
    setTimeout(() => setNotification(null), 4000);
  };

  // Save Ads to LocalStorage
  const handleSaveAds = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('nude_trends_banner_ads', JSON.stringify(bannerAd));
    localStorage.setItem('nude_trends_popup_ads', JSON.stringify(popupAd));
    triggerNotification('Ads configuration saved successfully!');
  };

  // Handle R2 Image Upload for Ads
  const handleAdImageUpload = async (file: File, target: 'banner' | 'popup') => {
    const isBanner = target === 'banner';
    if (isBanner) setBannerUploading(true);
    else setPopupUploading(true);

    try {
      // 1. Get presigned upload URL
      const res = await fetch('/api/get-presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
      });

      if (!res.ok) throw new Error('Failed to request upload signature.');
      const { uploadUrl, publicUrl } = await res.json();

      // 2. Upload directly to R2
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadRes.ok) throw new Error('Direct binary upload to R2 failed.');

      if (isBanner) {
        setBannerAd(prev => ({ ...prev, imageUrl: publicUrl }));
      } else {
        setPopupAd(prev => ({ ...prev, imageUrl: publicUrl }));
      }

      triggerNotification(`${target.charAt(0).toUpperCase() + target.slice(1)} ad image uploaded to R2!`);
    } catch (err: any) {
      console.error(err);
      triggerNotification(`Upload failed: ${err.message}`, 'error');
    } finally {
      if (isBanner) setBannerUploading(false);
      else setPopupUploading(false);
    }
  };

  // Delete Media
  const handleDeleteMedia = async (id: string, fileUrl?: string) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this media item? This cannot be undone.");
    if (!isConfirmed) return;

    try {
      const res = await fetch('/api/videos/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, fileUrl }),
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        setVideos(prev => prev.filter(v => v.id !== id));
        triggerNotification("Deleted and removed from site successfully!");
      } else {
        throw new Error(data.error || "Failed deletion");
      }
    } catch (err: any) {
      console.error("Delete Error:", err);
      triggerNotification(`Deletion failed: ${err.message}`, 'error');
    }
  };

  // Add Interesting Title
  const handleSaveInterestingTitle = async (id: string) => {
    if (!newInterestingTitle.trim()) return;

    const targetVideo = videos.find(v => v.id === id);
    if (!targetVideo) return;

    const currentTitles = targetVideo.interestingTitles || [];
    const updatedTitles = [...currentTitles, newInterestingTitle.trim()];

    try {
      const res = await fetch('/api/videos/edit-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, interestingTitles: updatedTitles }),
      });
      
      if (res.ok) {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, interestingTitles: updatedTitles } : v));
        setInterestingTitlesMap(prev => ({ ...prev, [id]: updatedTitles }));
        setNewInterestingTitle('');
        setEditingVideoId(null);
        triggerNotification('Interesting title added successfully!');
      } else {
        throw new Error('Failed to save title');
      }
    } catch (e: any) {
      console.error(e);
      triggerNotification(`Failed to save: ${e.message}`, 'error');
    }
  };

  // Delete Interesting Title
  const handleDeleteInterestingTitle = async (id: string, index: number) => {
    const targetVideo = videos.find(v => v.id === id);
    if (!targetVideo) return;

    const currentTitles = targetVideo.interestingTitles || [];
    const updatedTitles = currentTitles.filter((_, i) => i !== index);

    try {
      const res = await fetch('/api/videos/edit-title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, interestingTitles: updatedTitles }),
      });
      
      if (res.ok) {
        setVideos(prev => prev.map(v => v.id === id ? { ...v, interestingTitles: updatedTitles } : v));
        setInterestingTitlesMap(prev => ({ ...prev, [id]: updatedTitles }));
        triggerNotification('Interesting title removed.');
      } else {
        throw new Error('Failed to delete title');
      }
    } catch (e: any) {
      console.error(e);
      triggerNotification(`Failed to delete: ${e.message}`, 'error');
    }
  };

  // Upload Custom Media (Video/Image)
  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim()) {
      triggerNotification('Please enter a title.', 'error');
      return;
    }

    let finalMediaUrl = mediaUrl.trim();

    if (uploadSource === 'file') {
      if (!uploadFile) {
        triggerNotification('Please select a file to upload.', 'error');
        return;
      }

      setUploading(true);
      triggerNotification('Uploading media file to Cloudflare R2...');

      try {
        // 1. Get presigned upload URL
        const res = await fetch('/api/get-presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: uploadFile.name, fileType: uploadFile.type }),
        });

        if (!res.ok) throw new Error('Failed to request upload signature.');
        const { uploadUrl, publicUrl } = await res.json();

        // 2. Upload file directly to R2
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': uploadFile.type },
          body: uploadFile,
        });

        if (!uploadRes.ok) throw new Error('Direct R2 binary stream upload failed.');

        finalMediaUrl = publicUrl;
      } catch (err: any) {
        console.error(err);
        triggerNotification(`R2 upload failed: ${err.message}`, 'error');
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    } else {
      if (!finalMediaUrl) {
        triggerNotification('Please enter a direct stream/image URL.', 'error');
        return;
      }
    }

    // Create the media item object
    const newMediaItem: Video = {
      id: `custom-${Date.now()}`,
      title: mediaTitle.trim(),
      creator: mediaCreator.trim() || 'Admin Upload',
      views: '0 views',
      time: 'Just now',
      duration: mediaType === 'video' ? '05:00' : 'IMAGE',
      desc: mediaDesc.trim() || 'No description provided.',
      initials: (mediaCreator.trim() || 'AU').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      gradient: `linear-gradient(135deg, ${['#2b1201', '#1c0a00', '#140700', '#2d0f00', '#2c0e00', '#1d0701'][Math.floor(Math.random() * 6)]}, #000000)`,
      category: mediaCategory,
      type: mediaType,
      videoUrl: mediaType === 'video' ? finalMediaUrl : undefined,
      imageUrl: mediaType === 'image' ? finalMediaUrl : undefined,
      thumbnailUrl: '',
      interestingTitles: []
    };

    // Save to server dynamic list
    try {
      const res = await fetch('/api/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMediaItem),
      });
      
      if (res.ok) {
        setVideos(prev => [...prev, newMediaItem]);
        // Update local map as well
        setInterestingTitlesMap(prev => ({ ...prev, [newMediaItem.id]: [] }));
        
        // Clear form
        setMediaTitle('');
        setMediaUrl('');
        setUploadFile(null);
        setMediaDesc('');
        setMediaCreator('Admin Upload');
        
        triggerNotification('New media created and published successfully!');
        setActiveTab('manage');
      } else {
        throw new Error('Save failed');
      }
    } catch (e: any) {
      console.error(e);
      triggerNotification(`Save failed: ${e.message}`, 'error');
    }
  };

  const trendingVideos = videos.filter(item => item.category === 'Trending Videos');
  const nudesImages = videos.filter(item => item.category === 'Nudes');

  // Loading authorization gate state
  if (authorized === null) {
    return (
      <div className="min-h-screen bg-[#090909] text-stone-300 flex flex-col items-center justify-center gap-3">
        <span className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-widest text-stone-550 uppercase">Securing Endpoint...</span>
      </div>
    );
  }

  // Redirect block
  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#090909] text-red-500 flex flex-col items-center justify-center gap-2">
        <Lock className="w-8 h-8 animate-bounce" />
        <span className="text-xs font-mono font-bold tracking-widest uppercase">Unauthorized Access Blocked. Redirecting...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090909] text-stone-200">
      
      {/* Sticky Top Admin Header - Responsive stacking */}
      <header className="sticky top-0 z-[1000] bg-[#0c0c0c]/95 backdrop-blur-md border-b border-stone-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Header Left: Logo, Back Button, Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-start gap-3 w-full md:w-auto">
            <Link 
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-stone-700 text-xs font-mono font-bold rounded-lg transition w-fit"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Site</span>
            </Link>
            <div className="hidden sm:block h-6 w-px bg-stone-800" />
            <div className="flex items-center gap-2">
              <span className="bg-orange-500 text-black px-2 py-0.5 rounded font-black text-xs uppercase tracking-wider">ADMIN</span>
              <h1 className="font-extrabold text-white text-sm tracking-tight uppercase">Control Center</h1>
            </div>
          </div>

          {/* Header Right: Navigation tabs grid for mobile, flex for desktop */}
          <div className="grid grid-cols-3 gap-1.5 w-full md:flex md:w-auto md:gap-1.5">
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-2 px-3 rounded-lg text-[10px] sm:text-xs font-bold transition text-center ${
                activeTab === 'manage' ? 'bg-orange-600 text-stone-950' : 'bg-stone-900 text-stone-400 hover:text-white'
              }`}
            >
              Manage
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-3 rounded-lg text-[10px] sm:text-xs font-bold transition text-center ${
                activeTab === 'upload' ? 'bg-orange-600 text-stone-950' : 'bg-stone-900 text-stone-400 hover:text-white'
              }`}
            >
              Add Item
            </button>
            <button
              onClick={() => setActiveTab('ads')}
              className={`py-2 px-3 rounded-lg text-[10px] sm:text-xs font-bold transition text-center ${
                activeTab === 'ads' ? 'bg-orange-600 text-stone-950' : 'bg-stone-900 text-stone-400 hover:text-white'
              }`}
            >
              Ads Control
            </button>
          </div>
        </div>
      </header>

      {/* Floating Notification Popup */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-[3000] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 animate-slideUp font-bold text-xs ${
          notifType === 'success' ? 'bg-orange-600 border border-orange-500 text-stone-950' : 'bg-red-600 border border-red-500 text-white'
        }`}>
          {notifType === 'success' ? <CheckCircle2 className="w-4 h-4 text-stone-950" /> : <AlertCircle className="w-4 h-4 text-white" />}
          <span>{notification}</span>
        </div>
      )}

      {/* Admin Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* TAB 1: MANAGE MEDIA ITEMS */}
        {activeTab === 'manage' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Trending Videos Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                  <VideoIcon className="w-3.5 h-3.5 text-orange-500" />
                  <span>Trending Videos ({trendingVideos.length})</span>
                </h2>
                {r2Loading && (
                  <span className="flex items-center gap-1.5 text-[9px] font-mono text-orange-400 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                    Syncing R2 bucket...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {trendingVideos.map(vid => (
                  <div key={vid.id} className="bg-[#111111] border border-stone-850 p-4 rounded-xl flex flex-col sm:flex-row gap-4 hover:border-stone-800 transition">
                    
                    {/* Responsive image wrapper */}
                    <div className="w-full sm:w-32 h-44 sm:h-20 rounded-lg bg-stone-950 border border-stone-900 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                      {vid.thumbnailUrl ? (
                        <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover" />
                      ) : vid.videoUrl ? (
                        <video src={vid.videoUrl} className="w-full h-full object-cover" preload="metadata" muted />
                      ) : (
                        <div className="w-full h-full" style={{ backgroundImage: vid.gradient }} />
                      )}
                      <span className="absolute bottom-1 right-1 bg-stone-950/80 text-[8px] font-mono px-1.5 py-0.5 rounded font-bold">
                        {vid.duration}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3 sm:space-y-0">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-stone-200 text-xs sm:text-sm truncate flex-1" title={vid.title}>
                            {vid.title}
                          </h3>
                          <button 
                            onClick={() => handleDeleteMedia(vid.id, vid.videoUrl)}
                            className="p-1 hover:text-red-500 text-stone-500 transition cursor-pointer flex-shrink-0"
                            title="Delete Media"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-500 font-mono mt-1">
                          ID: {vid.id} | Creator: {vid.creator} | Views: {vid.views}
                        </p>
                      </div>

                      {/* Interesting Titles Controls */}
                      <div className="pt-2.5 border-t border-stone-900">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">
                            Interesting Titles:
                          </span>
                          {editingVideoId !== vid.id ? (
                            <button
                              onClick={() => { setEditingVideoId(vid.id); setNewInterestingTitle(''); }}
                              className="text-[9px] text-orange-500 hover:underline flex items-center gap-0.5"
                            >
                              <Plus className="w-2.5 h-2.5" /> Add Title
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingVideoId(null)}
                              className="text-[9px] text-stone-500 hover:underline"
                            >
                              Cancel
                            </button>
                          )}
                        </div>

                        {/* List of Titles */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(interestingTitlesMap[vid.id] || []).map((t, idx) => (
                            <span 
                              key={idx}
                              className="bg-stone-900 border border-stone-850 px-2 py-0.5 rounded-full text-[9px] text-stone-300 flex items-center gap-1.5 group"
                            >
                              <span>{t}</span>
                              <button 
                                onClick={() => handleDeleteInterestingTitle(vid.id, idx)}
                                className="text-stone-600 hover:text-red-500 transition-colors"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                          {(!interestingTitlesMap[vid.id] || interestingTitlesMap[vid.id].length === 0) && (
                            <span className="text-[9px] text-stone-600 italic">No custom titles added yet.</span>
                          )}
                        </div>

                        {editingVideoId === vid.id && (
                          <div className="flex gap-1.5 mt-2">
                            <input 
                              type="text"
                              value={newInterestingTitle}
                              onChange={(e) => setNewInterestingTitle(e.target.value)}
                              placeholder="e.g. Hot new clip released!"
                              className="flex-1 bg-stone-950 border border-stone-850 rounded-lg px-2.5 py-1 text-[10px] focus:outline-none focus:border-orange-500 text-stone-200"
                            />
                            <button
                              onClick={() => handleSaveInterestingTitle(vid.id)}
                              className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-stone-950 text-[10px] font-bold rounded-lg"
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {trendingVideos.length === 0 && (
                  <p className="text-xs text-stone-500 italic">No trending videos uploaded yet.</p>
                )}
              </div>
            </div>

            {/* Nudes/Images Section */}
            <div className="space-y-4 pt-4 border-t border-stone-900">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-orange-500" />
                  <span>Nudes & Images ({nudesImages.length})</span>
                </h2>
                {r2Loading && (
                  <span className="flex items-center gap-1.5 text-[9px] font-mono text-orange-400 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                    Syncing R2 bucket...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {nudesImages.map(img => (
                  <div key={img.id} className="bg-[#111111] border border-stone-850 p-4 rounded-xl flex flex-col sm:flex-row gap-4 hover:border-stone-800 transition">
                    
                    {/* Responsive image wrapper */}
                    <div className="w-full sm:w-32 h-44 sm:h-20 rounded-lg bg-stone-950 border border-stone-900 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                      {img.imageUrl ? (
                        <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover" />
                      ) : img.thumbnailUrl ? (
                        <img src={img.thumbnailUrl} alt={img.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full" style={{ backgroundImage: img.gradient }} />
                      )}
                      <span className="absolute bottom-1 right-1 bg-orange-600 text-stone-950 text-[7px] font-mono px-1 rounded font-extrabold uppercase">
                        IMAGE
                      </span>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col justify-between space-y-3 sm:space-y-0">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="font-bold text-stone-200 text-xs sm:text-sm truncate flex-1" title={img.title}>
                            {img.title}
                          </h3>
                          <button 
                            onClick={() => handleDeleteMedia(img.id, img.imageUrl || img.thumbnailUrl)}
                            className="p-1 hover:text-red-500 text-stone-500 transition cursor-pointer flex-shrink-0"
                            title="Delete Media"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-[10px] text-stone-500 font-mono mt-1">
                          ID: {img.id} | Creator: {img.creator} | Views: {img.views}
                        </p>
                      </div>

                      {/* Interesting Titles Controls */}
                      <div className="pt-2.5 border-t border-stone-900">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wide">
                            Interesting Titles:
                          </span>
                          {editingVideoId !== img.id ? (
                            <button
                              onClick={() => { setEditingVideoId(img.id); setNewInterestingTitle(''); }}
                              className="text-[9px] text-orange-500 hover:underline flex items-center gap-0.5"
                            >
                              <Plus className="w-2.5 h-2.5" /> Add Title
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditingVideoId(null)}
                              className="text-[9px] text-stone-500 hover:underline"
                            >
                              Cancel
                            </button>
                          )}
                        </div>

                        {/* List of Titles */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(interestingTitlesMap[img.id] || []).map((t, idx) => (
                            <span 
                              key={idx}
                              className="bg-stone-900 border border-stone-850 px-2 py-0.5 rounded-full text-[9px] text-stone-300 flex items-center gap-1.5 group"
                            >
                              <span>{t}</span>
                              <button 
                                onClick={() => handleDeleteInterestingTitle(img.id, idx)}
                                className="text-stone-600 hover:text-red-500 transition-colors"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                          {(!interestingTitlesMap[img.id] || interestingTitlesMap[img.id].length === 0) && (
                            <span className="text-[9px] text-stone-600 italic">No custom titles added yet.</span>
                          )}
                        </div>

                        {editingVideoId === img.id && (
                          <div className="flex gap-1.5 mt-2">
                            <input 
                              type="text"
                              value={newInterestingTitle}
                              onChange={(e) => setNewInterestingTitle(e.target.value)}
                              placeholder="e.g. Check this out!"
                              className="flex-1 bg-stone-950 border border-stone-850 rounded-lg px-2.5 py-1 text-[10px] focus:outline-none focus:border-orange-500 text-stone-200"
                            />
                            <button
                              onClick={() => handleSaveInterestingTitle(img.id)}
                              className="px-3 py-1 bg-orange-600 hover:bg-orange-500 text-stone-950 text-[10px] font-bold rounded-lg"
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {nudesImages.length === 0 && (
                  <p className="text-xs text-stone-500 italic">No nudes or images uploaded yet.</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: UPLOAD & CREATE MEDIA */}
        {activeTab === 'upload' && (
          <div className="max-w-2xl mx-auto bg-[#111111] border border-stone-850 p-5 sm:p-8 rounded-2xl shadow-xl space-y-6 animate-fadeIn">
            <div className="border-b border-stone-850 pb-4">
              <h2 className="text-sm font-extrabold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-orange-500" />
                <span>Upload Media Item</span>
              </h2>
              <p className="text-[11px] text-stone-550 mt-1">
                Directly host files in your R2 bucket. Uploaded media is persisted immediately.
              </p>
            </div>

            <form onSubmit={handleCreateMedia} className="space-y-4">
              {/* Media Type selection */}
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Media Type
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaType('video');
                      setMediaCategory('Trending Videos');
                    }}
                    className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition ${
                      mediaType === 'video' 
                        ? 'bg-orange-600/10 border-orange-500 text-orange-400 font-extrabold'
                        : 'bg-stone-900/50 border-stone-850 text-stone-400 hover:text-stone-100 hover:bg-stone-900'
                    }`}
                  >
                    <VideoIcon className="w-4 h-4" />
                    <span>Video Post</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaType('image');
                      setMediaCategory('Nudes');
                    }}
                    className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition ${
                      mediaType === 'image' 
                        ? 'bg-orange-600/10 border-orange-500 text-orange-400 font-extrabold'
                        : 'bg-stone-900/50 border-stone-850 text-stone-400 hover:text-stone-100 hover:bg-stone-900'
                    }`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Image Post</span>
                  </button>
                </div>
              </div>

              {/* Source Mode Toggle */}
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Source Mode
                </label>
                <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-850">
                  <button
                    type="button"
                    onClick={() => setUploadSource('file')}
                    className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition ${
                      uploadSource === 'file' ? 'bg-orange-600 text-stone-950' : 'text-stone-400 hover:text-stone-100'
                    }`}
                  >
                    File Upload to R2
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadSource('url')}
                    className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition ${
                      uploadSource === 'url' ? 'bg-orange-600 text-stone-950' : 'text-stone-400 hover:text-stone-100'
                    }`}
                  >
                    Direct External Link
                  </button>
                </div>
              </div>

              {/* Title & Creator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={mediaType === 'video' ? 'e.g. Secret Bedroom Tape' : 'e.g. Curvy Model Portrait'}
                    value={mediaTitle}
                    onChange={(e) => setMediaTitle(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-850 hover:border-stone-700 focus:border-orange-500 rounded-xl py-2 px-3 text-xs sm:text-sm text-stone-100 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    Uploader / Creator
                  </label>
                  <input
                    type="text"
                    value={mediaCreator}
                    onChange={(e) => setMediaCreator(e.target.value)}
                    placeholder="Admin Upload"
                    className="w-full bg-stone-900 border border-stone-850 hover:border-stone-700 focus:border-orange-500 rounded-xl py-2 px-3 text-xs sm:text-sm text-stone-100 focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Category selector */}
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Publish Category
                </label>
                <select
                  value={mediaCategory}
                  onChange={(e) => setMediaCategory(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-850 hover:border-stone-700 focus:border-orange-500 rounded-xl py-2.5 px-3 text-xs sm:text-sm text-stone-100 focus:outline-none transition-colors"
                >
                  <option value="Trending Videos">Trending Videos</option>
                  <option value="Nudes">Nudes</option>
                </select>
              </div>

              {/* File input vs URL input */}
              {uploadSource === 'file' ? (
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    Select File *
                  </label>
                  <input
                    type="file"
                    required
                    accept={mediaType === 'video' ? 'video/*' : 'image/*'}
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full bg-stone-900 border border-stone-850 hover:border-stone-700 focus:border-orange-500 rounded-xl py-2 px-3 text-xs sm:text-sm text-stone-100 focus:outline-none transition-colors"
                  />
                  {uploadFile && (
                    <p className="text-[10px] text-stone-400 mt-1.5">
                      Selected: <span className="text-orange-400 font-bold">{uploadFile.name}</span> ({(uploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                    Stream / Media Destination URL *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder={mediaType === 'video' ? 'https://example.com/stream.mp4' : 'https://example.com/photo.jpg'}
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    className="w-full bg-stone-900 border border-stone-850 hover:border-stone-700 focus:border-orange-500 rounded-xl py-2 px-3 text-xs sm:text-sm text-stone-100 focus:outline-none transition-colors"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide explicit context, model details, tags..."
                  value={mediaDesc}
                  onChange={(e) => setMediaDesc(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-850 hover:border-stone-700 focus:border-orange-500 rounded-xl py-2 px-3 text-xs text-stone-100 focus:outline-none transition-colors"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-stone-850">
                <button
                  type="button"
                  onClick={() => {
                    setMediaTitle('');
                    setMediaUrl('');
                    setUploadFile(null);
                    setMediaDesc('');
                    setActiveTab('manage');
                  }}
                  className="px-4 py-2 hover:bg-stone-900 text-stone-400 font-bold text-xs sm:text-sm rounded-xl transition border border-transparent hover:border-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-stone-950 font-extrabold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-orange-500/10 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <span className="w-3 h-3 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                      Uploading to R2...
                    </>
                  ) : (
                    'Publish & Save'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: ADS MANAGER */}
        {activeTab === 'ads' && (
          <div className="max-w-2xl mx-auto bg-[#111111] border border-stone-850 p-5 sm:p-8 rounded-2xl shadow-xl space-y-6 animate-fadeIn">
            <div className="border-b border-stone-850 pb-4">
              <h2 className="text-sm font-extrabold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" />
                <span>Ads Management</span>
              </h2>
              <p className="text-[11px] text-stone-550 mt-1">
                Configure banner displays and click-through popup models. Upload files directly to Cloudflare R2 for assets.
              </p>
            </div>

            <form onSubmit={handleSaveAds} className="space-y-6">
              
              {/* SECTION A: BANNER ADS */}
              <div className="space-y-4 p-4 bg-stone-950 rounded-xl border border-stone-850 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layout className="w-4 h-4 text-orange-500" />
                    <span>Banner Ad Settings</span>
                  </h3>
                  
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={bannerAd.enabled}
                      onChange={(e) => setBannerAd(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-400 after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 peer-checked:after:bg-stone-950 peer-checked:after:border-stone-950"></div>
                    <span className="ml-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      {bannerAd.enabled ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Banner Image File (Upload to R2)
                    </label>
                    <input 
                      type="file"
                      accept="image/*"
                      disabled={bannerUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAdImageUpload(file, 'banner');
                      }}
                      className="w-full bg-stone-900 border border-stone-850 hover:border-stone-700 rounded-lg py-1.5 px-3 text-xs text-stone-300 disabled:opacity-50"
                    />
                    {bannerUploading && (
                      <p className="text-[9px] text-orange-400 mt-1 animate-pulse">Uploading banner image...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Or Paste Banner Image URL
                    </label>
                    <input 
                      type="url"
                      placeholder="https://example.com/banner.gif"
                      value={bannerAd.imageUrl}
                      onChange={(e) => setBannerAd(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full bg-stone-900 border border-stone-850 hover:border-stone-700 rounded-lg py-1.5 px-3 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Click-through Destination URL
                    </label>
                    <input 
                      type="url"
                      placeholder="https://sponsor.com/referral-link"
                      value={bannerAd.linkUrl}
                      onChange={(e) => setBannerAd(prev => ({ ...prev, linkUrl: e.target.value }))}
                      className="w-full bg-stone-900 border border-stone-850 hover:border-stone-700 rounded-lg py-1.5 px-3 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {bannerAd.imageUrl && (
                    <div className="mt-2 p-2 bg-stone-900 rounded-lg border border-stone-850">
                      <p className="text-[8px] font-mono text-stone-500 uppercase tracking-widest mb-1.5">Live Preview:</p>
                      <a href={bannerAd.linkUrl || "#"} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded border border-orange-500/20">
                        <img src={bannerAd.imageUrl} alt="Banner Ad" className="w-full h-16 object-cover" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: POP-UP ADS */}
              <div className="space-y-4 p-4 bg-stone-950 rounded-xl border border-stone-850 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-orange-500" />
                    <span>Pop-up Ad Settings</span>
                  </h3>
                  
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input 
                      type="checkbox" 
                      checked={popupAd.enabled}
                      onChange={(e) => setPopupAd(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-stone-400 after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 peer-checked:after:bg-stone-950 peer-checked:after:border-stone-950"></div>
                    <span className="ml-2 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      {popupAd.enabled ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </label>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Pop-up Image File (Upload to R2)
                    </label>
                    <input 
                      type="file"
                      accept="image/*"
                      disabled={popupUploading}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAdImageUpload(file, 'popup');
                      }}
                      className="w-full bg-stone-900 border border-stone-850 hover:border-stone-700 rounded-lg py-1.5 px-3 text-xs text-stone-300 disabled:opacity-50"
                    />
                    {popupUploading && (
                      <p className="text-[9px] text-orange-400 mt-1 animate-pulse">Uploading popup image...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Or Paste Pop-up Image URL
                    </label>
                    <input 
                      type="url"
                      placeholder="https://example.com/popup.jpg"
                      value={popupAd.imageUrl}
                      onChange={(e) => setPopupAd(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full bg-stone-900 border border-stone-850 hover:border-stone-700 rounded-lg py-1.5 px-3 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      Click-through Destination URL
                    </label>
                    <input 
                      type="url"
                      placeholder="https://sponsor.com/pop-destination"
                      value={popupAd.linkUrl}
                      onChange={(e) => setPopupAd(prev => ({ ...prev, linkUrl: e.target.value }))}
                      className="w-full bg-stone-900 border border-stone-850 hover:border-stone-700 rounded-lg py-1.5 px-3 text-xs text-stone-100 focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  {popupAd.imageUrl && (
                    <div className="mt-2 p-2 bg-stone-900 rounded-lg border border-stone-850 flex justify-center">
                      <div className="w-full max-w-[200px]">
                        <p className="text-[8px] font-mono text-stone-500 uppercase tracking-widest mb-1.5">Live Preview:</p>
                        <a href={popupAd.linkUrl || "#"} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded border border-orange-500/20 aspect-square">
                          <img src={popupAd.imageUrl} alt="Popup Ad" className="w-full h-full object-cover" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-stone-850">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-stone-950 font-extrabold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-orange-500/10 cursor-pointer"
                >
                  Save Ads Settings
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

    </div>
  );
}

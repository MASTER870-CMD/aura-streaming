"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp, Share2, BookmarkPlus, CheckCircle2, 
  Sparkles, Check, AlertTriangle, ArrowLeft, 
  Home, Film, Bookmark, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings,
  RotateCcw, RotateCw
} from "lucide-react";
import { 
  doc, getDoc, updateDoc, increment, collection, getDocs, 
  query, orderBy, limit, where, addDoc, serverTimestamp, arrayUnion, arrayRemove, onSnapshot 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/navbar/Navbar";
import Hls from "hls.js";

// --- HELPER: FORMAT TIME TO HH:MM:SS ---
const formatTime = (timeInSeconds: number) => {
  if (isNaN(timeInSeconds)) return "0:00";
  const h = Math.floor(timeInSeconds / 3600);
  const m = Math.floor((timeInSeconds % 3600) / 60);
  const s = Math.floor(timeInSeconds % 60);
  const pad = (num: number) => num.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

// --- PREMIUM SCIFI VIDEO PLAYER COMPONENT ---
const AuraVideoPlayer = ({ videoSrc, audioSrc, posterSrc, title }: { videoSrc: string, audioSrc?: string, posterSrc?: string, title: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [buffered, setBuffered] = useState(0); 
  const [currentTime, setCurrentTime] = useState("0:00");
  const [durationStr, setDurationStr] = useState("0:00");
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeQuality, setActiveQuality] = useState("Auto");
  
  const [skipIndicator, setSkipIndicator] = useState<{ type: 'forward' | 'rewind' | null, id: number }>({ type: null, id: 0 });
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const skipTimeoutRef = useRef<NodeJS.Timeout | null>(null); // NEW: Ref for clearing the skip icon

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;

    setIsPlaying(false);
    setIsBuffering(false);
    setProgress(0);
    setBuffered(0);
    setCurrentTime("0:00");

    let hlsCleanup: Hls | null = null;
    let blobUrlCleanup: string | null = null;

    if (videoSrc.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({ 
        debug: false,
        enableWorker: true, 
        lowLatencyMode: true, 
        maxBufferLength: 10, 
        maxMaxBufferLength: 30, 
        maxAudioFramesDrift: 1, 
        stretchShortVideoTrack: true, 
      });
      
      hlsCleanup = hls;

      if (audioSrc && audioSrc.includes('.m3u8')) {
        const fakeMasterManifest = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",LANGUAGE="en",NAME="Main Audio",DEFAULT=YES,AUTOSELECT=YES,URI="${audioSrc}"
#EXT-X-STREAM-INF:BANDWIDTH=5000000,CODECS="avc1.4d401f,mp4a.40.2",AUDIO="audio"
${videoSrc}`;

        const blob = new Blob([fakeMasterManifest], { type: 'application/vnd.apple.mpegurl' });
        blobUrlCleanup = URL.createObjectURL(blob);
        hls.loadSource(blobUrlCleanup);
      } else {
        hls.loadSource(videoSrc);
      }

      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (hls.audioTracks && hls.audioTracks.length > 0) hls.audioTrack = 0; 
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl') || !videoSrc.includes('.m3u8')) {
      video.src = videoSrc;
      video.load();
    }

    return () => {
      if (hlsCleanup) hlsCleanup.destroy();
      if (blobUrlCleanup) URL.revokeObjectURL(blobUrlCleanup);
      if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
    };
  }, [videoSrc, audioSrc]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying && !isBuffering) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSettings(false);
      }, 3000);
    }
  };

  useEffect(() => {
    if (!isPlaying || isBuffering) setShowControls(true);
  }, [isPlaying, isBuffering]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      }
    }
  };

  // --- FIXED: ADDED TIMEOUT TO HIDE SKIP ICON ---
  const handleSkip = (amount: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += amount;
      
      // Trigger the icon
      setSkipIndicator({ type: amount > 0 ? 'forward' : 'rewind', id: Date.now() });
      
      // Clear previous timeout if user taps multiple times fast
      if (skipTimeoutRef.current) clearTimeout(skipTimeoutRef.current);
      
      // Hide the icon after 800ms
      skipTimeoutRef.current = setTimeout(() => {
        setSkipIndicator({ type: null, id: 0 });
      }, 800);
    }
  };

  const handleVideoAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.detail === 2) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 2) handleSkip(-10);
      else handleSkip(10);
    } else if (e.detail === 1) {
      togglePlay();
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / (total || 1)) * 100);
      setCurrentTime(formatTime(current));
    }
  };

  const handleProgressBuffer = () => {
    if (videoRef.current && videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      const total = videoRef.current.duration;
      setBuffered((bufferedEnd / (total || 1)) * 100);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDurationStr(formatTime(videoRef.current.duration));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = parseFloat(e.target.value);
    if (videoRef.current && !isNaN(videoRef.current.duration)) {
      videoRef.current.currentTime = (videoRef.current.duration / 100) * seekTo;
      setProgress(seekTo);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && !isBuffering && setShowControls(false)}
      className="relative w-full aspect-video md:rounded-2xl bg-[#030303] overflow-hidden group shadow-[0_0_80px_rgba(34,211,238,0.06)] border-y md:border border-white/5 flex items-center justify-center select-none"
    >
      <style dangerouslySetInnerHTML={{__html: `
        .youtube-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          margin-top: -5px;
          box-shadow: 0 0 10px rgba(34,211,238,0.6);
          transition: transform 0.1s ease;
        }
        .youtube-slider::-webkit-slider-thumb:hover {
          transform: scale(1.3);
        }
        .youtube-slider::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: transparent;
          border-radius: 2px;
        }
      `}} />

      <video
        ref={videoRef}
        poster={posterSrc}
        onTimeUpdate={handleTimeUpdate}
        onProgress={handleProgressBuffer}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
        onCanPlay={() => setIsBuffering(false)}
        className="w-full h-full object-contain relative z-0"
        playsInline
      />

      <div 
        className="absolute inset-0 z-10 cursor-pointer"
        onClick={handleVideoAreaClick}
      />

      <AnimatePresence>
        {skipIndicator.type === 'rewind' && (
          <motion.div key={`rewind-${skipIndicator.id}`} initial={{ opacity: 0, scale: 0.8, x: -20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 1.2 }} className="absolute left-[15%] top-1/2 -translate-y-1/2 z-20 flex flex-col items-center bg-black/40 p-4 rounded-full backdrop-blur-md pointer-events-none text-cyan-400">
            <RotateCcw size={32} />
            <span className="text-xs font-bold mt-1 tracking-widest">-10s</span>
          </motion.div>
        )}
        {skipIndicator.type === 'forward' && (
          <motion.div key={`forward-${skipIndicator.id}`} initial={{ opacity: 0, scale: 0.8, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 1.2 }} className="absolute right-[15%] top-1/2 -translate-y-1/2 z-20 flex flex-col items-center bg-black/40 p-4 rounded-full backdrop-blur-md pointer-events-none text-cyan-400">
            <RotateCw size={32} />
            <span className="text-xs font-bold mt-1 tracking-widest">+10s</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isPlaying && progress === 0 && (
          <motion.div exit={{ opacity: 0 }} className="absolute inset-0 z-0 pointer-events-none bg-black">
            {posterSrc && <img src={posterSrc} alt={title} className="w-full h-full object-cover opacity-60 filter blur-[2px]" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/50" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 left-4 z-20 pointer-events-none opacity-40">
         <span className="text-white text-[10px] font-black tracking-widest">AURA SYSTEM PRO</span>
      </div>

      <AnimatePresence>
        {isBuffering && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/60 backdrop-blur-md">
            <div className="relative flex items-center justify-center w-20 h-20">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} className="absolute inset-0 rounded-full border-t-2 border-r-2 border-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
              <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute inset-2 rounded-full border-b-2 border-l-2 border-white/40" />
              <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent pt-16 pb-4 px-4 md:px-6 transition-opacity duration-300 z-30 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        
        <div className="flex items-center gap-3 mb-4 z-40 relative group/progress">
          <input 
            type="range" min="0" max="100" step="0.1" 
            value={progress || 0} onChange={handleSeek}
            className="youtube-slider w-full appearance-none cursor-pointer outline-none transition-all"
            style={{ 
              background: `linear-gradient(to right, #22d3ee ${progress}%, #52525b80 ${progress}%, #52525b80 ${buffered}%, #27272a ${buffered}%)` 
            }}
          />
        </div>

        <div className="flex items-center justify-between text-white relative z-40">
          <div className="flex items-center gap-5">
            <button onClick={togglePlay} className="hover:text-cyan-400 transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5" fill="currentColor" />}
            </button>
            
            <div className="flex items-center gap-2 group/vol">
              <button onClick={toggleMute} className="hover:text-cyan-400 transition-colors">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input 
                type="range" min="0" max="1" step="0.05"
                value={isMuted ? 0 : volume} onChange={handleVolumeChange}
                className="w-0 opacity-0 group-hover/vol:w-16 group-hover/vol:opacity-100 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer transition-all duration-300 origin-left hidden md:block"
                style={{ background: `linear-gradient(to right, #fff ${volume * 100}%, #3f3f46 ${volume * 100}%)` }}
              />
            </div>

            <span className="text-[10px] md:text-xs font-mono text-zinc-400 tracking-wider">
              <span className="text-white">{currentTime}</span> <span className="text-zinc-700">/</span> {durationStr}
            </span>
          </div>

          <div className="flex items-center gap-5">
            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)} className={`hover:text-cyan-400 transition-colors ${showSettings ? 'text-cyan-400' : ''}`}>
                <Settings className="w-4 h-4 md:w-5 h-5" />
              </button>
              <AnimatePresence>
                {showSettings && (
                  <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 5 }} className="absolute bottom-8 right-0 w-28 bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col z-50">
                    {["1080p", "720p", "Auto"].map((q) => (
                      <button key={q} onClick={() => { setActiveQuality(q); setShowSettings(false); }} className="px-3 py-2 text-left text-xs font-bold hover:bg-zinc-900 transition-colors flex items-center justify-between">
                        <span className={activeQuality === q ? "text-cyan-400" : "text-zinc-400"}>{q}</span>
                        {activeQuality === q && <Check className="w-3 h-3 text-cyan-400" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={toggleFullscreen} className="hover:text-cyan-400 transition-colors">
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- CORE APPLICATION LOGIC SECTION ---
export default function WatchPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const routeId = params.id as string;

  const [realDocId, setRealDocId] = useState<string | null>(null);
  const [movie, setMovie] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [autoPlay, setAutoPlay] = useState(true);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!routeId) { setHasError(true); setIsFetching(false); return; }
    const locateMovieRecord = async () => {
      try {
        const directRef = doc(db, "movies", routeId);
        const directSnap = await getDoc(directRef);
        if (directSnap.exists()) {
          setRealDocId(routeId);
          return;
        }
        
        const slugQuery = query(collection(db, "movies"), where("slug", "==", routeId));
        const slugSnapshot = await getDocs(slugQuery);
        if (!slugSnapshot.empty) {
          setRealDocId(slugSnapshot.docs[0].id);
        } else {
          setHasError(true);
          setIsFetching(false);
        }
      } catch (err) {
        setHasError(true);
        setIsFetching(false);
      }
    };
    locateMovieRecord();
  }, [routeId]);

  useEffect(() => {
    if (loading || !user || !realDocId || hasError) return;
    const recordMetrics = async () => {
      const targetRef = doc(db, "movies", realDocId);
      try {
        const snap = await getDoc(targetRef);
        if (snap.exists() && !snap.data().viewedBy?.includes(user.uid)) {
          await updateDoc(targetRef, { viewedBy: arrayUnion(user.uid), views: increment(1) });
        }
      } catch (err) {}
    };
    recordMetrics();
  }, [user, realDocId, loading, hasError]);

  useEffect(() => {
    if (typeof window === "undefined" || !realDocId || hasError) return;

    const unbindMovieListener = onSnapshot(doc(db, "movies", realDocId), async (snapshot) => {
        if (!snapshot.exists()) { setHasError(true); setIsFetching(false); return; }
        const data: any = { id: snapshot.id, ...snapshot.data() };
        setMovie(data);
        setIsFetching(false);

        try {
          let recsQuery = query(collection(db, "movies"), where("category", "==", data.category), limit(10));
          let recsSnap = await getDocs(recsQuery);
          let filteredRecs = recsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.id !== realDocId);

          if (filteredRecs.length === 0) {
            const globalQuery = query(collection(db, "movies"), limit(10));
            const globalSnap = await getDocs(globalQuery);
            filteredRecs = globalSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.id !== realDocId);
          }
          
          setRecommendations(filteredRecs.slice(0, 6));
        } catch (e) {}
      }
    );

    const commentsQuery = query(collection(db, `movies/${realDocId}/comments`), orderBy("createdAt", "desc"));
    const unbindCommentsListener = onSnapshot(commentsQuery, (snapshot) => {
        setComments(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unbindMovieListener();
      unbindCommentsListener();
    };
  }, [realDocId, hasError]);

  useEffect(() => {
    if (!user || !realDocId || hasError) return;
    const evaluateWatchlistState = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().myList) setIsSaved(userDoc.data().myList.some((m: any) => m.id === realDocId));
      } catch (err) {}
    };
    evaluateWatchlistState();
  }, [user, realDocId, hasError]);

  const handleCommentSubmit = async () => {
    if (!user || !newComment.trim() || !realDocId) return;
    try {
      await addDoc(collection(db, `movies/${realDocId}/comments`), {
        text: newComment, userId: user.uid, userName: user.displayName || "Aura Member",
        userAvatar: user.photoURL || "", likes: 0, createdAt: serverTimestamp()
      });
      setNewComment("");
    } catch (error) {}
  };

  const handleLikeMovie = async () => {
    if (!user || !movie || !realDocId) return;
    const movieRef = doc(db, "movies", realDocId);
    try {
      if (movie.likedBy?.includes(user.uid)) await updateDoc(movieRef, { likedBy: arrayRemove(user.uid), likes: increment(-1) });
      else await updateDoc(movieRef, { likedBy: arrayUnion(user.uid), likes: increment(1) });
    } catch (error) {}
  };

  const toggleSaveMovie = async () => {
    if (!user || !movie || !realDocId) return;
    const userRef = doc(db, "users", user.uid);
    try {
      if (isSaved) { await updateDoc(userRef, { myList: arrayRemove(movie) }); setIsSaved(false); } 
      else { await updateDoc(userRef, { myList: arrayUnion(movie) }); setIsSaved(true); }
    } catch (error) {}
  };

  if (hasError) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-white px-6 text-center relative overflow-hidden">
        <Navbar />
        <div className="absolute inset-0 bg-cyan-900/10 blur-[120px] pointer-events-none" />
        <AlertTriangle className="w-14 h-14 text-cyan-600 mb-5" />
        <h1 className="text-2xl md:text-4xl font-black tracking-tight mb-3">Master File Missing</h1>
        <p className="text-xs md:text-sm text-zinc-500 mb-8 max-w-sm">This file link is currently unverified or offline.</p>
        <button onClick={() => router.push('/movies')} className="px-6 py-3 rounded-full bg-white text-black text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95">
          <ArrowLeft size={16} /> Return to Library
        </button>
      </div>
    );
  }

  if (loading || isFetching || !movie) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-white">
        <Navbar />
        <div className="relative flex items-center justify-center w-16 h-16 mb-4">
           <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} className="absolute inset-0 rounded-full border-t-2 border-r-2 border-cyan-400" />
           <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }} className="absolute inset-2 rounded-full border-b-2 border-l-2 border-white/60" />
        </div>
        <p className="font-bold tracking-widest text-[10px] uppercase text-zinc-500 animate-pulse">Establishing Pipeline...</p>
      </div>
    );
  }

  const hasUserLiked = movie.likedBy?.includes(user?.uid);
  const directStreamSource = movie.driveId ? `/api/stream/${movie.driveId}` : movie.videoUrl;

  return (
    <div className="min-h-screen w-full bg-[#050505] text-zinc-100 font-sans pb-24 md:pb-12 overflow-x-hidden selection:bg-cyan-950 selection:text-white">
      <Navbar />

      <main className="max-w-[1780px] mx-auto w-full pt-20 md:pt-24 flex flex-col xl:flex-row gap-6 lg:gap-8 px-0 md:px-6 lg:px-8">
        <div className="flex-1 w-full min-w-0 flex flex-col">
          
          <AuraVideoPlayer 
            videoSrc={directStreamSource} 
            audioSrc={movie.audioUrl}
            posterSrc={movie.banner || movie.poster} 
            title={movie.title} 
          />

          <div className="px-4 md:px-0 mt-6 space-y-6">
            <div className="flex flex-col gap-3">
              <h1 className="text-xl md:text-3xl font-black tracking-tight text-white">{movie.title}</h1>
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-5">
                 <div className="flex items-center gap-3 bg-[#0a0a0a] p-1.5 pr-4 rounded-full border border-white/5 w-fit">
                   <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center font-black text-xs text-white shadow-md">A</div>
                   <div className="flex flex-col">
                     <h3 className="font-bold text-zinc-200 flex items-center gap-1 text-xs">
                       Aura Production <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                     </h3>
                     <p className="text-[9px] text-zinc-600 font-medium leading-none mt-0.5">Verified Stream</p>
                   </div>
                   <button className="ml-3 px-4 py-1 bg-white text-black text-xs font-bold rounded-full hover:bg-zinc-200 transition-transform active:scale-95">Follow</button>
                 </div>

                 <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none w-full lg:w-auto">
                   <button onClick={handleLikeMovie} className={`inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900/60 hover:bg-zinc-900 rounded-full border border-white/5 text-xs font-bold transition-colors ${hasUserLiked ? 'text-cyan-500 border-cyan-500/20' : 'text-zinc-400'}`}>
                     <ThumbsUp className={`w-3.5 h-3.5 ${hasUserLiked ? 'fill-cyan-500' : ''}`} /> <span>{movie.likes || 0}</span>
                   </button>
                   <button onClick={toggleSaveMovie} className={`inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-900/60 hover:bg-zinc-900 rounded-full border border-white/5 text-xs font-bold transition-colors ${isSaved ? 'text-cyan-400 border-cyan-500/20' : 'text-zinc-400'}`}>
                     {isSaved ? <Check className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />} <span>{isSaved ? "Saved" : "Save"}</span>
                   </button>
                 </div>
              </div>
            </div>

            <div onClick={() => setDescriptionExpanded(!descriptionExpanded)} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 md:p-5 cursor-pointer hover:bg-zinc-900/30 transition-colors">
              <div className="flex items-center gap-2.5 text-[11px] font-bold text-zinc-400 mb-2">
                <span>{movie.views || 0} views</span><span className="text-zinc-800">•</span>
                <span>{movie.releaseYear || new Date().getFullYear()}</span><span className="text-zinc-800">•</span>
                <span className="text-cyan-400 tracking-wider text-[10px] uppercase">#{movie.category}</span>
              </div>
              <p className={`text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap ${descriptionExpanded ? '' : 'line-clamp-2'}`}>{movie.fullDescription || movie.shortDescription}</p>
            </div>

            <div className="pt-4">
              <h3 className="mb-5 text-sm font-black tracking-wider text-zinc-300 uppercase">{comments.length} Discussion Logs</h3>
              <div className="flex gap-3 mb-8">
                <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 overflow-hidden">
                   {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <span className="text-xs">{user?.displayName?.charAt(0) || "U"}</span>}
                </div>
                <div className="flex-1 border-b border-zinc-800 pb-1.5 flex justify-between items-end focus-within:border-cyan-500 transition-colors">
                  <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add to the conversation logs..." className="w-full bg-transparent outline-none text-xs text-white placeholder:text-zinc-600 mb-0.5" />
                  <button onClick={handleCommentSubmit} disabled={!newComment.trim()} className="px-4 py-1 rounded-full bg-white disabled:bg-zinc-900 disabled:text-zinc-700 text-black text-xs font-bold transition-colors">Submit</button>
                </div>
              </div>

              <div className="space-y-6">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-900 shrink-0 overflow-hidden">
                       {comment.userAvatar ? <img src={comment.userAvatar} className="w-full h-full object-cover" /> : <span className="w-full h-full flex items-center justify-center text-xs">{comment.userName?.charAt(0) || "U"}</span>}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-zinc-300">{comment.userName}</span>
                        <span className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Log Terminal</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[380px] shrink-0 px-4 md:px-0">
          <div className="flex items-center justify-between bg-[#0a0a0a] p-3.5 rounded-xl border border-white/5 mb-5">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Queue Autoplay</span>
            <div onClick={() => setAutoPlay(!autoPlay)} className={`w-8 h-4 rounded-full cursor-pointer relative transition-colors ${autoPlay ? 'bg-cyan-500' : 'bg-zinc-800'}`}>
              <motion.div animate={{ x: autoPlay ? 16 : 2 }} className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-md" />
            </div>
          </div>

          <div className="flex xl:flex-col gap-4 overflow-x-auto xl:overflow-visible pb-4 xl:pb-0 scrollbar-none">
            {recommendations.map((rec) => (
              <div key={rec.id} onClick={() => router.push(`/watch/${rec.slug || rec.id}`)} className="flex flex-col sm:flex-row gap-3 cursor-pointer group w-[160px] sm:w-[260px] xl:w-full shrink-0">
                <div className="relative w-full sm:w-32 xl:w-36 aspect-video rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/5">
                  <img src={rec.banner || rec.poster} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                </div>
                <div className="flex flex-col justify-center overflow-hidden">
                  <h4 className="text-xs font-bold text-zinc-300 line-clamp-2 group-hover:text-white transition-colors leading-snug">{rec.title}</h4>
                  <div className="text-[9px] font-bold uppercase text-cyan-500 mt-1">{rec.category}</div>
                  <div className="text-[9px] text-zinc-600 mt-0.5">{rec.views || 0} views</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-2xl border-t border-white/5 z-50 px-6 py-2 flex justify-between items-center pb-[env(safe-area-inset-bottom,12px)]">
        <button onClick={() => router.push('/')} className="flex flex-col items-center text-zinc-600 hover:text-white transition-colors"><Home size={18} /><span className="text-[9px] mt-0.5">Home</span></button>
        <button onClick={() => router.push('/movies')} className="flex flex-col items-center text-cyan-500"><Film size={18} /><span className="text-[9px] mt-0.5">Movies</span></button>
        <button onClick={() => router.push('/watchlist')} className="flex flex-col items-center text-zinc-600 hover:text-white transition-colors"><Bookmark size={18} /><span className="text-[9px] mt-0.5">List</span></button>
      </div>
    </div>
  );
}
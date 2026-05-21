"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp, Share2, BookmarkPlus, Download, CheckCircle2, 
  Smile, Loader2, Sparkles, Check, AlertTriangle, ArrowLeft, 
  Home, Film, Compass, Bookmark, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings
} from "lucide-react";
import { 
  doc, getDoc, updateDoc, increment, collection, getDocs, 
  query, orderBy, limit, where, addDoc, serverTimestamp, arrayUnion, arrayRemove, onSnapshot 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/navbar/Navbar";

// --- CUSTOM PREMIUM VIDEO PLAYER COMPONENT ---
const AuraVideoPlayer = ({ videoSrc, posterSrc, title }: { videoSrc: string, posterSrc?: string, title: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [durationStr, setDurationStr] = useState("0h 0m");
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const [showSettings, setShowSettings] = useState(false);
  const [activeQuality, setActiveQuality] = useState("Auto");
  
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video && videoSrc) {
      setIsPlaying(false);
      setIsBuffering(false);
      setProgress(0);
      setCurrentTime("0:00");
      video.load(); 
    }
  }, [videoSrc]);

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
        setIsBuffering(true);
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.warn("Playback interrupted:", error);
            setIsPlaying(false);
            setIsBuffering(false);
          });
        }
      }
    }
  };

  const formatCurrentTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const h = Math.floor(timeInSeconds / 3600);
    const m = Math.floor((timeInSeconds % 3600) / 60);
    const s = Math.floor(timeInSeconds % 60);
    if (h > 0) return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const formatTotalDuration = (totalSeconds: number) => {
    if (isNaN(totalSeconds) || totalSeconds === 0) return "0h 0m";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
      setCurrentTime(formatCurrentTime(current));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDurationStr(formatTotalDuration(videoRef.current.duration));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = (videoRef.current.duration / 100) * seekTo;
      setProgress(seekTo);
      setIsBuffering(true);
    }
  };

  const handleQualityChange = (quality: string) => {
    setActiveQuality(quality);
    setShowSettings(false);
    setIsBuffering(true);
    setTimeout(() => {
      if (videoRef.current && isPlaying) {
        videoRef.current.play().catch(()=>{});
      }
      setIsBuffering(false);
    }, 800); 
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
      containerRef.current.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && !isBuffering && setShowControls(false)}
      className="relative w-full aspect-video md:rounded-2xl bg-[#030303] overflow-hidden group shadow-[0_0_80px_rgba(220,38,38,0.08)] border-y md:border border-white/5 flex items-center justify-center font-sans"
    >
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc} // Native fallback
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
        onCanPlay={() => setIsBuffering(false)}
        className="w-full h-full cursor-pointer object-contain relative z-0"
        playsInline
      />

      {/* --- CUSTOM NETFLIX-STYLE ARTWORK POSTER OVERLAY --- */}
      <AnimatePresence>
        {!isPlaying && progress === 0 && (
          <motion.div 
            exit={{ opacity: 0 }} 
            transition={{ duration: 0.8 }}
            className="absolute inset-0 z-0 pointer-events-none bg-black"
          >
            {posterSrc && <img src={posterSrc} alt={title} className="w-full h-full object-cover opacity-80" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/40" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 left-4 z-20 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-70">
         <span className="text-white text-xs font-black tracking-widest">AURA<span className="text-red-600">.</span></span>
      </div>

      {/* --- HIGH-TECH SCI-FI BUFFERING MAGIC --- */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/50 backdrop-blur-sm"
          >
            <div className="relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute inset-0 rounded-full border-t-2 border-r-2 border-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
              <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }} className="absolute inset-2 md:inset-3 rounded-full border-b-2 border-l-2 border-white/80" />
              <div className="absolute inset-4 rounded-full bg-cyan-500/20 blur-md animate-pulse" />
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-cyan-300 animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,1)]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isPlaying && !isBuffering && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/20 backdrop-blur-[2px]"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-600/90 backdrop-blur flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.5)] border border-white/10">
              <Play className="w-8 h-8 md:w-10 md:h-10 ml-1 md:ml-2" fill="currentColor" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-20 pb-4 px-4 md:px-6 transition-opacity duration-300 z-30 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Dynamic Finished Timeline Fill */}
        <div className="flex items-center gap-3 mb-3 group/slider pointer-events-auto relative">
          <input 
            type="range" 
            min="0" max="100" step="0.1" 
            value={progress || 0} onChange={handleSeek}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer outline-none transition-all hover:h-2"
            style={{ 
              background: `linear-gradient(to right, #dc2626 ${progress}%, #27272a ${progress}%)`,
              WebkitAppearance: "none"
            }}
          />
        </div>

        <div className="flex items-center justify-between text-white pointer-events-auto">
          <div className="flex items-center gap-4 md:gap-6">
            <button onClick={togglePlay} className="hover:text-cyan-400 transition-colors focus:outline-none">
              {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" /> : <Play className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />}
            </button>
            
            <div className="flex items-center gap-2 group/vol relative">
              <button onClick={toggleMute} className="hover:text-cyan-400 transition-colors focus:outline-none hidden sm:block">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input 
                type="range" min="0" max="1" step="0.05"
                value={isMuted ? 0 : volume} onChange={handleVolumeChange}
                className="w-0 opacity-0 group-hover/vol:w-20 group-hover/vol:opacity-100 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer outline-none transition-all duration-300 origin-left hidden sm:block"
                style={{ background: `linear-gradient(to right, #fff ${volume * 100}%, #3f3f46 ${volume * 100}%)` }}
              />
            </div>

            <span className="text-xs md:text-sm font-medium text-zinc-300 font-mono tracking-wider drop-shadow-md">
              {currentTime} <span className="text-zinc-600 mx-1">/</span> {durationStr}
            </span>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            
            <div className="relative">
              <button 
                onClick={() => setShowSettings(!showSettings)} 
                className={`hover:text-cyan-400 transition-colors focus:outline-none ${showSettings ? 'text-cyan-400 animate-spin-slow' : 'text-white'}`}
              >
                <Settings className="w-4 h-4 md:w-5 md:h-5" />
              </button>
              
              <AnimatePresence>
                {showSettings && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-10 right-0 md:-right-4 w-32 bg-[#0A0A0A]/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 flex flex-col"
                  >
                    <div className="px-3 py-2 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">Video Quality</div>
                    {["1080p", "720p", "480p", "Auto"].map((quality) => (
                      <button 
                        key={quality}
                        onClick={() => handleQualityChange(quality)}
                        className="px-4 py-2.5 text-xs font-medium text-left hover:bg-zinc-800/80 transition-colors flex items-center justify-between"
                      >
                        <span className={activeQuality === quality ? "text-cyan-400 font-bold" : "text-zinc-300"}>{quality}</span>
                        {activeQuality === quality && <Check className="w-3 h-3 text-cyan-400" />}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={toggleFullscreen} className="hover:text-cyan-400 transition-colors focus:outline-none">
              {isFullscreen ? <Minimize className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---
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
    const resolveMovieRecord = async () => {
      try {
        const directDocRef = doc(db, "movies", routeId);
        const directDocSnap = await getDoc(directDocRef);
        if (directDocSnap.exists()) { setRealDocId(routeId); return; }
        const slugQuery = query(collection(db, "movies"), where("slug", "==", routeId));
        const slugSnapshot = await getDocs(slugQuery);
        if (!slugSnapshot.empty) { setRealDocId(slugSnapshot.docs[0].id); } 
        else { setHasError(true); setIsFetching(false); }
      } catch (err) { setHasError(true); setIsFetching(false); }
    };
    resolveMovieRecord();
  }, [routeId]);

  useEffect(() => {
    const trackUniqueView = async () => {
      if (!user || !realDocId) return;
      const movieRef = doc(db, "movies", realDocId);
      const snap = await getDoc(movieRef);
      if (snap.exists() && !snap.data().viewedBy?.includes(user.uid)) {
        await updateDoc(movieRef, { viewedBy: arrayUnion(user.uid), views: increment(1) });
      }
    };
    if (!loading && user && realDocId && !hasError) trackUniqueView();
  }, [user, realDocId, loading, hasError]);

  useEffect(() => {
    if (!realDocId || hasError) return;
    const unsubscribeMovie = onSnapshot(doc(db, "movies", realDocId), async (docSnap: any) => {
      if (!docSnap.exists()) { setHasError(true); setIsFetching(false); return; }
      const movieData: any = { id: docSnap.id, ...docSnap.data() };
      setMovie(movieData);
      setIsFetching(false);
      try {
        const recQuery = query(collection(db, "movies"), where("category", "==", movieData.category), limit(8));
        const recSnap = await getDocs(recQuery);
        setRecommendations(recSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })).filter((m: any) => m.id !== realDocId));
      } catch (e) {}
    });
    const commentsQuery = query(collection(db, `movies/${realDocId}/comments`), orderBy("createdAt", "desc"));
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot: any) => {
      setComments(snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubscribeMovie(); unsubscribeComments(); };
  }, [realDocId, hasError]);

  useEffect(() => {
    async function checkSaved() {
      if (user && realDocId && !hasError) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().myList) {
          setIsSaved(userDoc.data().myList.some((m: any) => m.id === realDocId));
        }
      }
    }
    checkSaved();
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
        <div className="absolute inset-0 bg-red-900/10 blur-[120px] pointer-events-none" />
        <AlertTriangle className="w-16 h-16 md:w-20 md:h-20 text-red-600 mb-6" />
        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Signal Lost.</h1>
        <p className="text-sm md:text-lg text-zinc-400 mb-10 max-w-md">Content removed or unavailable.</p>
        <button onClick={() => router.push('/movies')} className="px-8 py-4 rounded-full bg-white text-black font-bold flex items-center justify-center gap-3">
          <ArrowLeft size={20} /> Return to Library
        </button>
      </div>
    );
  }

  if (loading || isFetching || !movie) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-white">
        <Navbar />
        <div className="relative flex items-center justify-center w-20 h-20 mb-6">
           <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }} className="absolute inset-0 rounded-full border-t-2 border-r-2 border-cyan-400" />
           <motion.div animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }} className="absolute inset-3 rounded-full border-b-2 border-l-2 border-white/80" />
        </div>
        <p className="font-bold tracking-widest text-xs uppercase animate-pulse text-cyan-400">Initializing Core...</p>
      </div>
    );
  }

  const hasUserLiked = movie.likedBy?.includes(user?.uid);
  const driveDirectStreamUrl = movie.driveId ? `/api/stream/${movie.driveId}` : movie.videoUrl;

  return (
    <div className="min-h-screen w-full bg-[#050505] text-zinc-50 font-sans selection:bg-cyan-900 selection:text-white pb-24 md:pb-12 overflow-x-hidden">
      <Navbar />

      <main className="max-w-[1800px] mx-auto w-full pt-[88px] md:pt-[100px] flex flex-col xl:flex-row gap-6 lg:gap-10 px-0 md:px-6 lg:px-8">
        
        {/* LEFT COLUMN: Player & Info */}
        <div className="flex-1 w-full min-w-0 flex flex-col">
          
          <AuraVideoPlayer 
            videoSrc={driveDirectStreamUrl} 
            posterSrc={movie.banner || movie.poster} // Prioritize 16:9 banner for video background
            title={movie.title} 
          />

          <div className="px-4 md:px-0 mt-5 md:mt-8 space-y-6 md:space-y-8">
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white leading-snug">
                {movie.title}
              </h1>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 border-b border-white/5 pb-6">
                 
                 <div className="flex items-center gap-4 bg-[#0A0A0A] p-2 pr-4 md:pr-6 rounded-2xl md:rounded-full border border-white/5 w-fit">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl md:rounded-full bg-red-600 flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(220,38,38,0.3)] shrink-0">A</div>
                     <div className="flex flex-col justify-center">
                       <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-xs md:text-sm">
                         Aura Studios <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                       </h3>
                       <p className="text-[10px] text-zinc-500 font-medium leading-none mt-1">Official Release</p>
                     </div>
                   </div>
                   <button className="ml-2 md:ml-4 px-4 py-1.5 md:px-5 md:py-2 bg-white text-black text-xs md:text-sm font-bold rounded-xl md:rounded-full hover:bg-zinc-200 transition-transform active:scale-95">Subscribe</button>
                 </div>

                 <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden w-full lg:w-auto">
                   <button onClick={handleLikeMovie} className={`inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/60 hover:bg-zinc-800 rounded-full border border-white/5 text-xs md:text-sm font-bold shrink-0 transition-colors ${hasUserLiked ? 'text-red-500' : 'text-zinc-300'}`}>
                     <ThumbsUp className={`w-4 h-4 md:w-[18px] md:h-[18px] ${hasUserLiked ? 'fill-red-500' : ''}`} /> <span>{movie.likes || 0}</span>
                   </button>
                   <button onClick={toggleSaveMovie} className={`inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/60 hover:bg-zinc-800 rounded-full border border-white/5 text-xs md:text-sm font-bold shrink-0 transition-colors ${isSaved ? 'text-cyan-400' : 'text-zinc-300'}`}>
                     {isSaved ? <Check className="w-4 h-4 md:w-[18px] md:h-[18px]" /> : <BookmarkPlus className="w-4 h-4 md:w-[18px] md:h-[18px]" />} <span>{isSaved ? "Saved" : "Save"}</span>
                   </button>
                   <button className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/60 hover:bg-zinc-800 rounded-full border border-white/5 text-zinc-300 text-xs md:text-sm font-bold shrink-0 transition-colors">
                     <Share2 className="w-4 h-4 md:w-[18px] md:h-[18px]" /> <span>Share</span>
                   </button>
                 </div>
              </div>
            </div>

            <div onClick={() => setDescriptionExpanded(!descriptionExpanded)} className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-4 md:p-6 cursor-pointer hover:bg-zinc-900/40 transition-colors">
              <div className="flex items-center gap-3 text-xs font-bold text-zinc-300 mb-3">
                <span>{movie.views || 0} views</span><span className="text-zinc-700">•</span>
                <span>{movie.releaseYear || new Date().getFullYear()}</span><span className="text-zinc-700">•</span>
                <span className="text-cyan-400 uppercase tracking-widest text-[10px]">#{movie.category}</span>
              </div>
              <p className={`text-xs md:text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap ${descriptionExpanded ? '' : 'line-clamp-3'}`}>{movie.fullDescription || movie.shortDescription}</p>
            </div>

            {/* INTERACTIVE COMMENTS */}
            <div className="pt-4 md:pt-6">
              <h3 className="mb-6 text-lg md:text-xl font-black">{comments.length} Comments</h3>
              
              <div className="flex gap-3 md:gap-4 mb-10">
                <div 
                  onClick={() => router.push(`/profile/${user?.uid}`)}
                  className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden border border-zinc-700 cursor-pointer hover:border-cyan-400 transition-colors"
                >
                   {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : user?.displayName?.charAt(0) || "U"}
                </div>
                <div className="flex-1 border-b border-zinc-700 pb-2 flex justify-between items-end focus-within:border-cyan-400 transition-colors">
                  <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a cinematic comment..." className="w-full bg-transparent outline-none text-xs md:text-sm text-white placeholder:text-zinc-600 mb-1" />
                  <button onClick={handleCommentSubmit} disabled={!newComment.trim()} className="px-5 py-1.5 rounded-full bg-white disabled:bg-zinc-800 disabled:text-zinc-600 text-black text-xs font-bold ml-2 transition-colors active:scale-95">Post</button>
                </div>
              </div>

              <div className="space-y-8">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3 md:gap-4 group">
                    <div 
                      onClick={() => router.push(`/profile/${comment.userId}`)}
                      className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden border border-transparent cursor-pointer hover:border-cyan-400 transition-colors"
                    >
                       {comment.userAvatar ? <img src={comment.userAvatar} className="w-full h-full object-cover" /> : comment.userName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span 
                          onClick={() => router.push(`/profile/${comment.userId}`)}
                          className="text-xs md:text-sm font-bold text-zinc-200 cursor-pointer hover:text-cyan-400 transition-colors"
                        >
                          {comment.userName}
                        </span>
                        <span className="text-[10px] text-zinc-600">Premium Member</span>
                      </div>
                      <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Recommendations */}
        <div className="w-full xl:w-[400px] shrink-0 px-4 md:px-0">
          <div className="flex items-center justify-between bg-[#0A0A0A] p-4 rounded-xl border border-white/5 mb-6">
            <span className="text-xs md:text-sm font-bold text-zinc-300">Autoplay next</span>
            <div onClick={() => setAutoPlay(!autoPlay)} className={`w-10 h-5 rounded-full cursor-pointer relative transition-colors ${autoPlay ? 'bg-cyan-500' : 'bg-zinc-800'}`}>
              <motion.div animate={{ x: autoPlay ? 20 : 2 }} className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md" />
            </div>
          </div>

          <div className="flex xl:flex-col gap-4 overflow-x-auto xl:overflow-visible pb-4 xl:pb-0 [&::-webkit-scrollbar]:hidden">
            {recommendations.map((rec) => (
              <div key={rec.id} onClick={() => router.push(`/watch/${rec.slug || rec.id}`)} className="flex flex-col xl:flex-row gap-3 cursor-pointer group w-[150px] md:w-[200px] xl:w-full shrink-0">
                <div className="relative w-full xl:w-40 aspect-[16/9] xl:aspect-video rounded-lg overflow-hidden shrink-0 bg-zinc-900 border border-white/5">
                  <img src={rec.banner || rec.poster} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                </div>
                <div className="flex flex-col justify-center overflow-hidden">
                  <h4 className="text-xs md:text-sm font-bold text-zinc-200 line-clamp-2 group-hover:text-white transition-colors">{rec.title}</h4>
                  <div className="text-[9px] md:text-[10px] font-black uppercase text-cyan-500 mt-1.5">{rec.category}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{rec.views || "1.2k"} views</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      {/* MOBILE NAV */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-2xl border-t border-white/10 z-50 px-6 py-2 flex justify-between items-center pb-[env(safe-area-inset-bottom,12px)]">
        <button onClick={() => router.push('/')} className="flex flex-col items-center text-zinc-500"><Home size={20} /><span className="text-[10px]">Home</span></button>
        <button onClick={() => router.push('/movies')} className="flex flex-col items-center text-zinc-500"><Film size={20} /><span className="text-[10px]">Movies</span></button>
        <button onClick={() => router.push('/originals')} className="flex flex-col items-center text-zinc-500"><Compass size={20} /><span className="text-[10px]">Originals</span></button>
        <button onClick={() => router.push('/watchlist')} className="flex flex-col items-center text-zinc-500"><Bookmark size={20} /><span className="text-[10px]">My List</span></button>
      </div>
    </div>
  );
}
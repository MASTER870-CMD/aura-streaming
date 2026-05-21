"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp, Share2, BookmarkPlus, Download, CheckCircle2, 
  Smile, Loader2, Sparkles, Check, AlertTriangle, ArrowLeft, 
  Home, Film, Compass, Bookmark, Play, Pause, Volume2, VolumeX, Maximize, Minimize
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
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState("0:00");
  const [duration, setDuration] = useState("0:00");
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // CRITICAL FIX: The "Netflix" Initialization Strategy
  // We safely load the source and display the poster, but we DO NOT force autoplay.
  // This completely eliminates the AbortError crashes.
  useEffect(() => {
    const video = videoRef.current;
    if (video && videoSrc) {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime("0:00");
      video.load(); // Fetches metadata and displays the poster gracefully
    }
  }, [videoSrc]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 2500);
    }
  };

  useEffect(() => {
    if (!isPlaying) setShowControls(true);
  }, [isPlaying]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        // Safe promise handling for play()
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch((error) => {
              console.warn("Playback interrupted or blocked:", error);
              setIsPlaying(false);
            });
        }
      }
    }
  };

  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
      setCurrentTime(formatTime(current));
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(formatTime(videoRef.current.duration));
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTo = parseFloat(e.target.value);
    if (videoRef.current) {
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
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video md:rounded-2xl bg-black overflow-hidden group shadow-[0_0_80px_rgba(220,38,38,0.08)] border-y md:border border-white/5 flex items-center justify-center"
    >
      <video
        ref={videoRef}
        src={videoSrc}
        poster={posterSrc}
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="w-full h-full cursor-pointer object-cover md:object-contain"
        playsInline
      />

      <div className="absolute top-4 left-4 z-20 pointer-events-none drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] opacity-70">
         <span className="text-white text-xs font-black tracking-widest">AURA<span className="text-red-600">.</span></span>
      </div>

      <AnimatePresence>
        {!isPlaying && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 1.2 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-black/40 backdrop-blur-[2px]"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-600/90 backdrop-blur flex items-center justify-center text-white shadow-[0_0_30px_rgba(220,38,38,0.5)]">
              <Play className="w-8 h-8 md:w-10 md:h-10 ml-1 md:ml-2" fill="currentColor" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-12 pb-4 px-4 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-3 mb-2 group/slider">
          <input 
            type="range" 
            min="0" max="100" step="0.1" 
            value={progress || 0} onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-red-600 hover:h-2 transition-all outline-none"
          />
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button onClick={togglePlay} className="hover:text-red-500 transition-colors focus:outline-none">
              {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" /> : <Play className="w-5 h-5 md:w-6 md:h-6" fill="currentColor" />}
            </button>
            
            <div className="flex items-center gap-2 group/vol relative">
              <button onClick={toggleMute} className="hover:text-red-500 transition-colors focus:outline-none hidden sm:block">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input 
                type="range" min="0" max="1" step="0.05"
                value={isMuted ? 0 : volume} onChange={handleVolumeChange}
                className="w-0 opacity-0 group-hover/vol:w-20 group-hover/vol:opacity-100 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-white transition-all duration-300 origin-left hidden sm:block"
              />
            </div>

            <span className="text-xs md:text-sm font-medium text-zinc-300 font-mono tracking-wider">
              {currentTime} <span className="text-zinc-600">/</span> {duration}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleFullscreen} className="hover:text-red-500 transition-colors focus:outline-none">
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
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
        <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
        <p className="font-bold tracking-widest text-xs uppercase animate-pulse text-zinc-500">Connecting...</p>
      </div>
    );
  }

  const hasUserLiked = movie.likedBy?.includes(user?.uid);
  
  // Securely routes the video through our Next.js backend proxy
  const driveDirectStreamUrl = movie.driveId 
    ? `/api/stream/${movie.driveId}`
    : movie.videoUrl;

  return (
    <div className="min-h-screen w-full bg-[#050505] text-zinc-50 font-sans selection:bg-red-900 pb-24 md:pb-12 overflow-x-hidden">
      <Navbar />

      <main className="max-w-[1800px] mx-auto w-full pt-[88px] md:pt-[100px] flex flex-col xl:flex-row gap-6 lg:gap-8 px-0 md:px-6 lg:px-8">
        
        {/* LEFT COLUMN */}
        <div className="flex-1 w-full min-w-0 flex flex-col">
          
          <AuraVideoPlayer 
            videoSrc={driveDirectStreamUrl} 
            posterSrc={movie.poster || movie.banner} 
            title={movie.title} 
          />

          <div className="px-4 md:px-0 mt-5 md:mt-6 space-y-6 md:space-y-8">
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white leading-snug">
                {movie.title}
              </h1>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                 <div className="flex items-center gap-4 bg-zinc-900/40 p-2 pr-4 md:pr-6 rounded-2xl md:rounded-full border border-white/5 backdrop-blur-sm w-fit">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl md:rounded-full bg-red-600 flex items-center justify-center font-black text-white shadow-lg shrink-0">A</div>
                     <div className="flex flex-col justify-center">
                       <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-xs md:text-sm">
                         Aura Studios <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                       </h3>
                       <p className="text-[10px] text-zinc-500 font-medium leading-none mt-1">Official Release</p>
                     </div>
                   </div>
                   <button className="ml-2 md:ml-4 px-4 py-1.5 md:px-5 md:py-2 bg-white text-black text-xs md:text-sm font-bold rounded-xl md:rounded-full hover:bg-zinc-200">Subscribe</button>
                 </div>

                 <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden w-full lg:w-auto">
                   <button onClick={handleLikeMovie} className={`inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/60 rounded-full border border-white/5 text-xs md:text-sm font-bold shrink-0 ${hasUserLiked ? 'text-red-500' : 'text-zinc-300'}`}>
                     <ThumbsUp className={`w-4 h-4 md:w-[18px] md:h-[18px] ${hasUserLiked ? 'fill-red-500' : ''}`} /> <span>{movie.likes || 0}</span>
                   </button>
                   <button onClick={toggleSaveMovie} className={`inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/60 rounded-full border border-white/5 text-xs md:text-sm font-bold shrink-0 ${isSaved ? 'text-red-500' : 'text-zinc-300'}`}>
                     {isSaved ? <Check className="w-4 h-4 md:w-[18px] md:h-[18px]" /> : <BookmarkPlus className="w-4 h-4 md:w-[18px] md:h-[18px]" />} <span>{isSaved ? "Saved" : "Save"}</span>
                   </button>
                   <button className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/60 rounded-full border border-white/5 text-zinc-300 text-xs md:text-sm font-bold shrink-0">
                     <Share2 className="w-4 h-4 md:w-[18px] md:h-[18px]" /> <span>Share</span>
                   </button>
                 </div>
              </div>
            </div>

            <div onClick={() => setDescriptionExpanded(!descriptionExpanded)} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 md:p-5 cursor-pointer hover:bg-zinc-900/60 transition-colors backdrop-blur-sm">
              <div className="flex items-center gap-3 text-xs font-bold text-zinc-300 mb-3">
                <span>{movie.views || 0} views</span><span className="text-zinc-600">•</span>
                <span>{movie.releaseYear || new Date().getFullYear()}</span><span className="text-zinc-600">•</span>
                <span className="text-red-400 uppercase tracking-widest text-[10px]">#{movie.category}</span>
              </div>
              <p className={`text-xs md:text-sm text-zinc-400 whitespace-pre-wrap ${descriptionExpanded ? '' : 'line-clamp-3'}`}>{movie.fullDescription || movie.shortDescription}</p>
            </div>

            <div className="pt-4 md:pt-6">
              <h3 className="mb-6 text-lg md:text-xl font-black">{comments.length} Comments</h3>
              <div className="flex gap-3 md:gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden border border-zinc-700">
                   {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : user?.displayName?.charAt(0) || "U"}
                </div>
                <div className="flex-1 border-b border-zinc-700 pb-2 flex justify-between items-center">
                  <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a cinematic comment..." className="w-full bg-transparent outline-none text-xs md:text-sm text-white" />
                  <button onClick={handleCommentSubmit} className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold ml-2">Post</button>
                </div>
              </div>
              <div className="space-y-6">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3 md:gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                       {comment.userAvatar ? <img src={comment.userAvatar} className="w-full h-full object-cover" /> : comment.userName?.charAt(0) || "U"}
                    </div>
                    <div>
                      <span className="text-xs md:text-sm font-bold text-zinc-200 block mb-1">{comment.userName}</span>
                      <p className="text-xs md:text-sm text-zinc-400">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full xl:w-[400px] shrink-0 px-4 md:px-0">
          <div className="flex items-center justify-between bg-zinc-900/30 p-3 rounded-xl border border-white/5 mb-4">
            <span className="text-xs md:text-sm font-bold text-zinc-300">Autoplay next</span>
            <div onClick={() => setAutoPlay(!autoPlay)} className={`w-10 h-5 rounded-full cursor-pointer relative transition-colors ${autoPlay ? 'bg-red-600' : 'bg-zinc-700'}`}>
              <motion.div animate={{ x: autoPlay ? 20 : 2 }} className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
          <div className="flex xl:flex-col gap-3 md:gap-4 overflow-x-auto xl:overflow-visible pb-4 xl:pb-0 [&::-webkit-scrollbar]:hidden">
            {recommendations.map((rec) => (
              <div key={rec.id} onClick={() => router.push(`/watch/${rec.slug || rec.id}`)} className="flex flex-col xl:flex-row gap-2 xl:gap-3 cursor-pointer group w-[140px] md:w-[180px] xl:w-full shrink-0">
                <div className="relative w-full xl:w-32 aspect-[2/3] rounded-lg overflow-hidden shrink-0 bg-zinc-900">
                  <img src={rec.poster || rec.banner} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="flex flex-col pt-1 overflow-hidden">
                  <h4 className="text-xs md:text-sm font-bold text-zinc-200 line-clamp-2">{rec.title}</h4>
                  <div className="text-[9px] md:text-[10px] font-black uppercase text-red-500 mt-1">{rec.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-2xl border-t border-white/10 z-50 px-6 py-2 flex justify-between items-center pb-[env(safe-area-inset-bottom,12px)]">
        <button onClick={() => router.push('/')} className="flex flex-col items-center text-zinc-500"><Home size={20} /><span className="text-[10px]">Home</span></button>
        <button onClick={() => router.push('/movies')} className="flex flex-col items-center text-zinc-500"><Film size={20} /><span className="text-[10px]">Movies</span></button>
        <button onClick={() => router.push('/originals')} className="flex flex-col items-center text-zinc-500"><Compass size={20} /><span className="text-[10px]">Originals</span></button>
        <button onClick={() => router.push('/watchlist')} className="flex flex-col items-center text-zinc-500"><Bookmark size={20} /><span className="text-[10px]">My List</span></button>
      </div>
    </div>
  );
}
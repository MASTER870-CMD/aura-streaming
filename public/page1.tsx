"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ThumbsUp, Share2, BookmarkPlus, Download, MoreVertical, 
  CheckCircle2, Menu, Smile, Loader2, Sparkles, Check,
  AlertTriangle, ArrowLeft, Home, Film, Compass, Bookmark
} from "lucide-react";
import { 
  doc, getDoc, updateDoc, increment, collection, getDocs, 
  query, orderBy, limit, where, addDoc, serverTimestamp, arrayUnion, arrayRemove, onSnapshot 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/navbar/Navbar";

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

  // 1. Resolve URL slug to real Firestore ID
  useEffect(() => {
    if (!routeId) {
      setHasError(true);
      setIsFetching(false);
      return;
    }

    const resolveMovieRecord = async () => {
      try {
        const directDocRef = doc(db, "movies", routeId);
        const directDocSnap = await getDoc(directDocRef);

        if (directDocSnap.exists()) {
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
        console.error("Error resolving movie source:", err);
        setHasError(true);
        setIsFetching(false);
      }
    };

    resolveMovieRecord();
  }, [routeId]);

  // 2. Handle unique views tracking
  useEffect(() => {
    const trackUniqueView = async () => {
      if (!user || !realDocId) return;
      const movieRef = doc(db, "movies", realDocId);
      const snap = await getDoc(movieRef);
      
      if (snap.exists()) {
        const data = snap.data();
        const viewedBy = data.viewedBy || [];
        
        if (!viewedBy.includes(user.uid)) {
          await updateDoc(movieRef, {
            viewedBy: arrayUnion(user.uid),
            views: increment(1)
          });
        }
      }
    };
    
    if (!loading && user && realDocId && !hasError) trackUniqueView();
  }, [user, realDocId, loading, hasError]);

  // 3. Live Sync Data (Movie info, Recommendations, Comments)
  useEffect(() => {
    if (!realDocId || hasError) return;

    const unsubscribeMovie = onSnapshot(doc(db, "movies", realDocId), async (docSnap: any) => {
      if (!docSnap.exists()) {
        setHasError(true);
        setIsFetching(false);
        return;
      }
      const movieData: any = { id: docSnap.id, ...docSnap.data() };
      setMovie(movieData);
      setIsFetching(false);

      try {
        const recQuery = query(collection(db, "movies"), where("category", "==", movieData.category), limit(8));
        const recSnap = await getDocs(recQuery);
        const recs: any[] = recSnap.docs
          .map((d: any) => ({ id: d.id, ...d.data() }))
          .filter((m: any) => m.id !== realDocId);
        setRecommendations(recs);
      } catch (e) { console.error(e); }
    });

    const commentsQuery = query(collection(db, `movies/${realDocId}/comments`), orderBy("createdAt", "desc"));
    const unsubscribeComments = onSnapshot(commentsQuery, (snapshot: any) => {
      const fetchedComments: any[] = snapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
      setComments(fetchedComments);
    });

    return () => {
      unsubscribeMovie();
      unsubscribeComments();
    };
  }, [realDocId, hasError]);

  // 4. Check if saved to My List
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

  // --- ACTIONS ---
  const handleCommentSubmit = async () => {
    if (!user || !newComment.trim() || !realDocId) return;
    try {
      await addDoc(collection(db, `movies/${realDocId}/comments`), {
        text: newComment,
        userId: user.uid,
        userName: user.displayName || "Aura Member",
        userAvatar: user.photoURL || "",
        likes: 0,
        createdAt: serverTimestamp()
      });
      setNewComment("");
    } catch (error) { console.error("Error posting comment:", error); }
  };

  const handleLikeMovie = async () => {
    if (!user || !movie || !realDocId) return;
    const movieRef = doc(db, "movies", realDocId);
    const hasLiked = movie.likedBy?.includes(user.uid);

    try {
      if (hasLiked) {
        await updateDoc(movieRef, { likedBy: arrayRemove(user.uid), likes: increment(-1) });
      } else {
        await updateDoc(movieRef, { likedBy: arrayUnion(user.uid), likes: increment(1) });
      }
    } catch (error) { console.error("Error liking movie:", error); }
  };

  const toggleSaveMovie = async () => {
    if (!user || !movie || !realDocId) return;
    const userRef = doc(db, "users", user.uid);
    try {
      if (isSaved) {
        await updateDoc(userRef, { myList: arrayRemove(movie) });
        setIsSaved(false);
      } else {
        await updateDoc(userRef, { myList: arrayUnion(movie) });
        setIsSaved(true);
      }
    } catch (error) { console.error("Error saving movie:", error); }
  };

  // --- ERROR STATE UI ---
  if (hasError) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-white px-6 text-center relative overflow-hidden">
        <Navbar />
        <div className="absolute inset-0 bg-red-900/10 blur-[120px] pointer-events-none" />
        <AlertTriangle className="w-16 h-16 md:w-20 md:h-20 text-red-600 mb-6 drop-shadow-[0_0_20px_rgba(220,38,38,0.5)]" />
        <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Signal Lost.</h1>
        <p className="text-sm md:text-lg text-zinc-400 mb-10 max-w-md">
          The cinematic content you are looking for has been removed, relocated, or never existed in the Aura database.
        </p>
        <button onClick={() => router.push('/movies')} className="px-8 py-4 rounded-full bg-white text-black font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 transition-transform active:scale-95">
          <ArrowLeft size={20} /> Return to Library
        </button>
      </div>
    );
  }

  // --- LOADING STATE UI ---
  if (loading || isFetching || !movie) {
    return (
      <div className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center text-white">
        <Navbar />
        <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
        <p className="font-bold tracking-widest text-xs uppercase animate-pulse text-zinc-500">Connecting to Stream...</p>
      </div>
    );
  }

  const hasUserLiked = movie.likedBy?.includes(user?.uid);

  return (
    <div className="min-h-screen w-full bg-[#050505] text-zinc-50 font-sans selection:bg-red-900 selection:text-white pb-24 md:pb-12 overflow-x-hidden">
      <Navbar />

      {/* Main Container - Pushed to pt-[88px] so it absolutely never slips behind the fixed navigation bar on small devices */}
      <main className="max-w-[1800px] mx-auto w-full pt-[88px] md:pt-[100px] flex flex-col xl:flex-row gap-6 lg:gap-8 px-0 md:px-6 lg:px-8">
        
        {/* LEFT COLUMN: Player & Metadata */}
        <div className="flex-1 w-full min-w-0 flex flex-col">
          
          {/* --- ULTRA-CLEAN ENHANCED RESPONSIVE SECURE PLAYER --- */}
          <div 
            className="relative w-full aspect-video md:rounded-2xl overflow-hidden bg-black border-y md:border border-white/5 md:shadow-[0_0_80px_rgba(220,38,38,0.08)] flex items-center justify-center group z-20"
            onContextMenu={(e) => e.preventDefault()} 
          >
            {movie.driveId && movie.driveId !== "uploaded_id" ? (
              <div className="absolute inset-0 w-full h-full overflow-hidden z-10">
                {/* The top-[-46px] and h-[calc(100%+46px)] shifts the Google Drive UI container upwards,
                  pushing the native title text and the pop-out button out of the visible screen area completely.
                */}
                <iframe 
                  src={`https://drive.google.com/file/d/${movie.driveId}/preview`}
                  className="absolute left-0 top-[-46px] w-full h-[calc(100%+46px)] border-none"
                  allow="autoplay; fullscreen"
                />
                {/* Absolute clear glass blocking layout to capture rogue interaction points */}
                <div className="absolute top-0 right-0 w-24 h-14 bg-transparent z-20 pointer-events-auto"></div>
              </div>
            ) : (
              <div className="text-zinc-500 font-bold uppercase tracking-widest text-sm flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-red-600" /> Processing Master File...
              </div>
            )}
            
            {/* Minimal Brand Identifier over player element */}
            <div className="absolute top-3 left-3 md:top-4 md:left-4 z-20 pointer-events-none opacity-40 md:group-hover:opacity-100 transition-opacity">
               <span className="text-white text-[10px] md:text-xs font-black tracking-widest drop-shadow-md">AURA<span className="text-red-600">.</span></span>
            </div>
          </div>

          {/* Metadata Container */}
          <div className="px-4 md:px-0 mt-5 md:mt-6 space-y-6 md:space-y-8">
            
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white leading-snug">
                {movie.title}
              </h1>
              
              {/* Controls & Studio Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                 
                 {/* Studio Header */}
                 <div className="flex items-center gap-4 bg-zinc-900/40 p-2 pr-4 md:pr-6 rounded-2xl md:rounded-full border border-white/5 backdrop-blur-sm w-fit">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl md:rounded-full bg-red-600 flex items-center justify-center font-black text-white border border-white/10 shadow-lg shrink-0">A</div>
                     <div className="flex flex-col justify-center">
                       <h3 className="font-bold text-zinc-100 flex items-center gap-1.5 text-xs md:text-sm">
                         Aura Studios <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-zinc-900 shrink-0" />
                       </h3>
                       <p className="text-[10px] text-zinc-500 font-medium leading-none mt-1">Official Release</p>
                     </div>
                   </div>
                   <button className="ml-2 md:ml-4 px-4 py-1.5 md:px-5 md:py-2 bg-white text-black text-xs md:text-sm font-bold rounded-xl md:rounded-full hover:bg-zinc-200 transition-colors active:scale-95 shrink-0">
                     Subscribe
                   </button>
                 </div>

                 {/* Perfectly Aligned Action Buttons */}
                 <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full lg:w-auto">
                   
                   <button 
                     onClick={handleLikeMovie} 
                     className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900/60 hover:bg-zinc-800 active:bg-zinc-800 transition-colors rounded-full border border-white/5 backdrop-blur-md text-xs md:text-sm font-bold shrink-0 ${hasUserLiked ? 'text-red-500' : 'text-zinc-300'}`}
                   >
                     <ThumbsUp className={`w-4 h-4 md:w-[18px] md:h-[18px] ${hasUserLiked ? 'fill-red-500' : ''}`} /> 
                     <span>{movie.likes || 0}</span>
                   </button>
                   
                   <button 
                     onClick={toggleSaveMovie} 
                     className={`inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900/60 hover:bg-zinc-800 active:bg-zinc-800 transition-colors rounded-full border border-white/5 backdrop-blur-md text-xs md:text-sm font-bold shrink-0 ${isSaved ? 'text-red-500' : 'text-zinc-300'}`}
                   >
                     {isSaved ? <Check className="w-4 h-4 md:w-[18px] md:h-[18px]" /> : <BookmarkPlus className="w-4 h-4 md:w-[18px] md:h-[18px]" />} 
                     <span>{isSaved ? "Saved" : "Save"}</span>
                   </button>

                   <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900/60 hover:bg-zinc-800 active:bg-zinc-800 transition-colors rounded-full border border-white/5 backdrop-blur-md text-zinc-300 text-xs md:text-sm font-bold shrink-0">
                     <Share2 className="w-4 h-4 md:w-[18px] md:h-[18px]" /> 
                     <span>Share</span>
                   </button>
                   
                   <button className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-900/60 hover:bg-zinc-800 active:bg-zinc-800 transition-colors rounded-full border border-white/5 backdrop-blur-md text-zinc-300 text-xs md:text-sm font-bold shrink-0">
                     <Download className="w-4 h-4 md:w-[18px] md:h-[18px]" /> 
                     <span>Download</span>
                   </button>

                 </div>
              </div>
            </div>

            {/* Description Box */}
            <div onClick={() => setDescriptionExpanded(!descriptionExpanded)} className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 md:p-5 cursor-pointer hover:bg-zinc-900/60 transition-colors backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-zinc-300 mb-3">
                <span>{movie.views || 0} views</span>
                <span className="text-zinc-600">•</span>
                <span>{movie.releaseYear || new Date().getFullYear()}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-red-400 uppercase tracking-widest text-[10px]">#{movie.category}</span>
              </div>
              <p className={`text-xs md:text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap ${descriptionExpanded ? '' : 'line-clamp-3 md:line-clamp-2'}`}>
                {movie.fullDescription || movie.shortDescription || "No description provided."}
              </p>
              {!descriptionExpanded && <p className="text-[10px] md:text-xs text-zinc-500 font-bold mt-2">Tap to read more...</p>}
            </div>

            {/* Comments Section */}
            <div className="pt-4 md:pt-6">
              <div className="flex items-center gap-4 mb-6 text-lg md:text-xl font-black">
                <h3>{comments.length} Comments</h3>
                <span className="text-[10px] text-zinc-800 bg-zinc-300 px-2 py-0.5 rounded uppercase tracking-widest">Live Sync</span>
              </div>

              <div className="flex gap-3 md:gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden border border-zinc-700">
                   {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : user?.displayName?.charAt(0) || "U"}
                </div>
                <div className="flex-1 border-b border-zinc-700 focus-within:border-white transition-colors pb-2">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a cinematic comment..." 
                    className="w-full bg-transparent outline-none text-xs md:text-sm placeholder:text-zinc-500 text-white" 
                  />
                  <div className="flex justify-between items-center mt-3 opacity-0 focus-within:opacity-100 transition-opacity">
                    <Smile className="w-4 h-4 text-zinc-500" />
                    <button onClick={handleCommentSubmit} className="px-4 py-1.5 rounded-full bg-red-600 active:bg-red-700 text-white text-xs font-bold transition-colors">Post</button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {comments.map((comment: any) => (
                  <div key={comment.id} className="flex gap-3 md:gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
                       {comment.userAvatar ? <img src={comment.userAvatar} className="w-full h-full object-cover" /> : comment.userName?.charAt(0) || "U"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs md:text-sm font-bold text-zinc-200">{comment.userName}</span>
                      </div>
                      <p className="text-xs md:text-sm text-zinc-400 leading-relaxed">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: Up Next --- */}
        <div className="w-full xl:w-[400px] shrink-0 px-4 md:px-0">
          <div className="flex items-center justify-between bg-zinc-900/30 p-3 rounded-xl border border-white/5 mb-4">
            <span className="text-xs md:text-sm font-bold text-zinc-300">Autoplay next</span>
            <div onClick={() => setAutoPlay(!autoPlay)} className={`w-10 h-5 rounded-full cursor-pointer relative transition-colors duration-300 ${autoPlay ? 'bg-red-600' : 'bg-zinc-700'}`}>
              <motion.div animate={{ x: autoPlay ? 20 : 2 }} className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow" />
            </div>
          </div>

          {/* Intelligent Responsive List */}
          <div className="flex xl:flex-col gap-3 md:gap-4 overflow-x-auto xl:overflow-visible pb-4 xl:pb-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {recommendations.length > 0 ? recommendations.map((rec) => (
              <div 
                key={rec.id} 
                onClick={() => router.push(`/watch/${rec.slug || rec.id}`)} 
                className="flex flex-col xl:flex-row gap-2 xl:gap-3 cursor-pointer group w-[140px] md:w-[180px] xl:w-full shrink-0"
              >
                {/* Unified 2:3 Poster format */}
                <div className="relative w-full xl:w-32 aspect-[2/3] rounded-lg overflow-hidden shrink-0 border border-white/5 bg-zinc-900 shadow-md">
                  <img src={rec.poster || rec.banner || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80"} alt={rec.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-90 group-hover:opacity-100" />
                  <div className="absolute top-1.5 left-1.5 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 px-1.5 py-0.5 rounded flex items-center gap-1 text-[9px] font-bold text-amber-400">
                    <Sparkles className="w-2.5 h-2.5" /> Match
                  </div>
                </div>
                
                {/* Info Text */}
                <div className="flex flex-col pt-1 overflow-hidden">
                  <h4 className="text-xs md:text-sm font-bold text-zinc-200 leading-tight line-clamp-2 group-hover:text-white transition-colors">{rec.title}</h4>
                  <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-red-500 mt-1 xl:mt-1.5">{rec.category}</div>
                  <div className="text-[10px] md:text-xs text-zinc-500 mt-0.5 xl:mt-1 font-medium">{rec.releaseYear || "2026"} • {rec.duration || "HD"}</div>
                </div>
              </div>
            )) : (
              <p className="text-xs text-zinc-500 px-1">No related content available right now.</p>
            )}
          </div>
        </div>

      </main>

      {/* --- MOBILE BOTTOM APP-BAR (Native Navigation) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-2xl border-t border-white/10 z-50 px-6 py-2 flex justify-between items-center pb-[env(safe-area-inset-bottom,12px)] shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
        <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white transition-colors group">
          <div className="p-1.5"><Home size={20} /></div>
          <span className="text-[10px] font-bold">Home</span>
        </button>
        <button onClick={() => router.push('/movies')} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white transition-colors">
          <div className="p-1.5"><Film size={20} /></div>
          <span className="text-[10px] font-bold">Movies</span>
        </button>
        <button onClick={() => router.push('/originals')} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white transition-colors">
          <div className="p-1.5"><Compass size={20} /></div>
          <span className="text-[10px] font-bold">Originals</span>
        </button>
        <button onClick={() => router.push('/watchlist')} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-white transition-colors">
          <div className="p-1.5"><Bookmark size={20} /></div>
          <span className="text-[10px] font-bold">My List</span>
        </button>
      </div>

    </div>
  );
}
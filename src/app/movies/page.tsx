"use client";

import React, { useState, useEffect, Suspense } from "react";
import { motion } from "framer-motion";
import { Play, Plus, Check, Loader2, Search, Filter, MonitorPlay } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, getDocs, query, where, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar/Navbar";

const CATEGORIES = ["All Content", "Action", "Sci-Fi", "Drama", "Documentary", "Thriller", "Horror", "Comedy", "Originals"];

function MoviesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const searchParam = searchParams.get("search");
  
  const { user } = useAuth();
  const [movies, setMovies] = useState<any[]>([]);
  const [myList, setMyList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(categoryParam || "All Content");

  useEffect(() => {
    const fetchMovies = async () => {
      setLoading(true);
      try {
        let q = query(collection(db, "movies"), where("status", "==", "Published"));
        
        if (activeCategory !== "All Content") {
          q = query(collection(db, "movies"), where("category", "==", activeCategory), where("status", "==", "Published"));
        }
        
        const querySnapshot = await getDocs(q);
        let fetchedMovies = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        if (searchParam) {
          const s = searchParam.toLowerCase();
          fetchedMovies = fetchedMovies.filter((m: any) => 
            m.title?.toLowerCase().includes(s) ||
            m.shortDescription?.toLowerCase().includes(s) ||
            m.seoKeywords?.toLowerCase().includes(s) ||
            m.cast?.toLowerCase().includes(s)
          );
        }
        setMovies(fetchedMovies);
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [activeCategory, searchParam]);

  useEffect(() => {
    const fetchWatchlist = async () => {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().myList) {
          setMyList(userDoc.data().myList);
        }
      } catch (error) {
        console.error("Error fetching watchlist:", error);
      }
    };
    fetchWatchlist();
  }, [user]);

  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    router.push(`/movies${cat !== "All Content" ? `?category=${cat}` : ""}`);
  };

  const handleToggleWatchlist = async (movie: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { router.push("/auth"); return; }
    
    const userRef = doc(db, "users", user.uid);
    const isSaved = myList.some((m: any) => m.id === movie.id);

    try {
      if (isSaved) {
        await updateDoc(userRef, { myList: arrayRemove(movie) });
        setMyList(myList.filter((m: any) => m.id !== movie.id)); 
      } else {
        await updateDoc(userRef, { myList: arrayUnion(movie) });
        setMyList([...myList, movie]); 
      }
    } catch (error) {
      console.error("Error updating watchlist:", error);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-red-900 selection:text-white pb-32">
      <Navbar />

      <main className="pt-24 sm:pt-32 px-4 sm:px-8 lg:px-16 w-full max-w-[1920px] mx-auto relative z-10">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight mb-3 sm:mb-4">
            {searchParam ? `Results for "${searchParam}"` : "Explore Content"}
          </h1>
          {!searchParam && (
            <p className="text-sm sm:text-lg text-zinc-400 mb-6 sm:mb-8 font-medium">Discover your next cinematic experience across our premium library.</p>
          )}

          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-4 snap-x custom-scrollbar w-full">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#141414] rounded-full border border-white/5 shrink-0 snap-start">
               <Filter className="w-4 h-4 text-zinc-400" />
            </div>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`whitespace-nowrap px-5 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 shrink-0 snap-start ${
                  activeCategory === cat 
                    ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                    : "bg-[#0A0A0A] text-zinc-300 hover:bg-zinc-800 hover:text-white border border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-32">
            <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
            <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase animate-pulse">Syncing Library...</p>
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 sm:py-32 border border-white/5 rounded-3xl bg-[#0A0A0A] shadow-inner">
            <Search className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-black text-zinc-400 mb-2">No master files found.</h2>
            <p className="text-sm text-zinc-500 font-medium">Try adjusting your category or search term.</p>
          </div>
        ) : (
          /* RESPONSIVE 2:3 POSTER GRID: Perfectly scales from mobile phones to 4K monitors */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-6 w-full">
            {movies.map((movie) => {
              const isSaved = myList.some((m: any) => m.id === movie.id);
              
              return (
                <div 
                  key={movie.id} 
                  onClick={() => router.push(`/watch/${movie.slug || movie.id}`)} 
                  className="relative w-full aspect-[2/3] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group border border-white/5 bg-zinc-900 shadow-lg transition-all duration-500 md:hover:-translate-y-3 hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)] hover:border-white/20"
                >
                  <img src={movie.poster || movie.banner || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80"} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                  
                  {movie.isTrending && (
                    <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-red-600/90 backdrop-blur-md border border-red-500/50 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg z-20">
                      Trending
                    </div>
                  )}

                  {/* Desktop Hover State */}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 gap-4 backdrop-blur-sm z-10 hidden md:flex">
                    <button className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:bg-red-600 hover:text-white text-black transition-colors shadow-2xl scale-75 group-hover:scale-100 duration-300 delay-100">
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </button>
                    <p className="text-white font-bold text-center text-sm px-2 line-clamp-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">{movie.title}</p>
                    <div className="flex gap-2 mt-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-150">
                        <button onClick={(e) => handleToggleWatchlist(movie, e)} className="w-10 h-10 rounded-full bg-zinc-900/80 border border-white/20 text-white flex items-center justify-center hover:border-white transition-colors">
                          {isSaved ? <Check className="w-5 h-5 text-red-500" /> : <Plus className="w-5 h-5" />}
                        </button>
                    </div>
                  </div>

                  {/* Mobile Fallback Label (Always visible on mobile bottom so users know what they are clicking) */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent md:hidden pointer-events-none z-10">
                    <p className="text-[11px] font-bold text-white text-center truncate drop-shadow-lg">{movie.title}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function MoviesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin" />
      </div>
    }>
      <MoviesContent />
    </Suspense>
  );
}
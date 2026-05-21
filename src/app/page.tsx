"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play, Info, Sparkles, BarChart3, Clapperboard, Film, 
  Plus, Check, Loader2, Shield, Zap, Globe, Headphones, 
  Award, Home, Compass, Bookmark, ChevronRight, MonitorPlay, Star
} from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar/Navbar";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [featuredMovie, setFeaturedMovie] = useState<any>(null);
  const [neuralPicks, setNeuralPicks] = useState<any[]>([]);
  const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
  const [myList, setMyList] = useState<any[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    async function loadRealData() {
      try {
        // 1. FETCH PUBLIC DATA (Visible to everyone, even if not logged in)
        const moviesRef = collection(db, "movies");
        const moviesSnap = await getDocs(moviesRef);
        const allMovies: any[] = moviesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sortedByViews: any[] = [...allMovies].sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
        
        if (sortedByViews.length > 0) {
          setFeaturedMovie(sortedByViews[0]);
          setNeuralPicks(sortedByViews.slice(1, 4)); 
          setTrendingMovies(sortedByViews.slice(0, 10));
        }

        const catSnap = await getDocs(collection(db, "categories"));
        const cats: any[] = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        const categoriesWithImages = cats.map((c: any) => {
          const topMovieForCat: any = sortedByViews.find((m: any) => m.category === c.name);
          return { 
            ...c, 
            img: topMovieForCat?.poster || topMovieForCat?.banner || topMovieForCat?.thumbnail || "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80" 
          };
        });
        setDynamicCategories(categoriesWithImages);

        // 2. FETCH PRIVATE DATA (Only if the user is actually signed in)
        if (user) {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().myList) {
            setMyList(userDoc.data().myList);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsFetching(false);
      }
    }

    if (!loading) {
      loadRealData();
    }
  }, [user, loading]);

  const toggleMyList = async (movie: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { router.push("/auth"); return; }
    const isSaved = myList.some((m: any) => m.id === movie.id);
    const userRef = doc(db, "users", user.uid);
    try {
      if (isSaved) {
        await updateDoc(userRef, { myList: arrayRemove(movie) });
        setMyList(myList.filter((m: any) => m.id !== movie.id));
      } else {
        await updateDoc(userRef, { myList: arrayUnion(movie) });
        setMyList([...myList, movie]);
      }
    } catch (error) { console.error(error); }
  };

  if (loading || isFetching) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
        <p className="text-[10px] font-bold tracking-widest uppercase text-zinc-500 animate-pulse">Initializing Engine...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-[#050505] text-zinc-50 font-sans selection:bg-red-900 selection:text-white overflow-x-hidden pb-20 md:pb-0">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative h-[85vh] md:h-screen w-full flex items-center justify-center overflow-hidden px-4">
        <div className="absolute inset-0 z-0 bg-black">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-black/50 to-[#050505]/80 z-10" />
          <motion.img 
            initial={{ scale: 1 }}
            animate={{ scale: 1.1 }}
            transition={{ duration: 25, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
            src={featuredMovie?.banner || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80"} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-40 blur-[2px]" 
          />
        </div>
        
        <div className="relative z-40 text-center w-full max-w-5xl mt-0 md:mt-12 pointer-events-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: "easeOut" }}>
            <span className="inline-block py-1 px-3 rounded-full bg-red-600/10 border border-red-600/20 text-red-500 uppercase tracking-[0.3em] text-[9px] md:text-xs font-black mb-4 md:mb-6 shadow-[0_0_20px_rgba(220,38,38,0.2)]">
              Welcome {user ? `Back, ${user.displayName?.split(' ')[0] || "Aura Member"}` : "to AURA"}
            </span>
            <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-[7rem] font-black tracking-tighter mb-4 md:mb-6 leading-[1.05] text-white drop-shadow-2xl">
              Limitless Stories.<br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-300 to-zinc-600">Curated by AI.</span>
            </h1>
            <p className="text-sm md:text-xl lg:text-2xl text-zinc-400 mb-8 md:mb-12 max-w-3xl mx-auto px-4 font-medium leading-relaxed drop-shadow-md">
              Experience cinema in a billion-dollar ecosystem. Watch stunning originals in true 8K, powered by an engine that knows exactly what you want to see.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 px-6 w-full sm:w-auto relative z-50">
              <button 
                onClick={() => router.push(`/movies`)} 
                className="w-full sm:w-auto px-10 py-4 md:py-5 rounded-full bg-red-600 text-white text-sm md:text-lg font-bold flex items-center justify-center gap-3 hover:bg-red-500 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-[0_0_40px_rgba(220,38,38,0.4)] hover:shadow-[0_0_60px_rgba(220,38,38,0.6)]"
              >
                <Play className="w-5 h-5 md:w-6 md:h-6 fill-white" /> Start Watching
              </button>
              <button 
                onClick={() => router.push('/originals')} 
                className="w-full sm:w-auto px-10 py-4 md:py-5 rounded-full bg-black/50 backdrop-blur-xl border border-white/20 text-white text-sm md:text-lg font-bold flex items-center justify-center gap-3 hover:bg-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Info className="w-5 h-5 md:w-6 md:h-6" /> Explore Originals
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FIREBASE TRENDING SECTION */}
      {trendingMovies.length > 0 && (
        <section className="w-full py-12 md:py-20 px-4 sm:px-8 lg:px-16 max-w-[1920px] mx-auto relative z-10 -mt-8 md:-mt-16 pointer-events-auto">
          <div className="mb-6 md:mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                Trending on <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-800">AURA</span>
              </h2>
              <p className="text-zinc-400 mt-1 md:mt-2 text-xs md:text-sm font-medium">The most watched cinema this week.</p>
            </div>
          </div>

          <div className="flex gap-4 md:gap-6 overflow-x-auto pb-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full px-1">
            {trendingMovies.map((movie) => (
              <div 
                key={movie.id} 
                onClick={() => router.push(`/watch/${movie.slug || movie.id}`)}
                className="group relative flex-none w-[240px] sm:w-[280px] md:w-[320px] aspect-[16/10] rounded-2xl overflow-hidden snap-start cursor-pointer border border-white/5 bg-zinc-900 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(220,38,38,0.2)] hover:border-red-500/30"
              >
                <img 
                  src={movie.banner || movie.poster || "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80"} 
                  alt={movie.title} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-500" />

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-[2px]">
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-red-600/90 backdrop-blur-md flex items-center justify-center scale-75 group-hover:scale-100 transition-all duration-300 shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                    <Play className="w-5 h-5 md:w-6 md:h-6 text-white fill-white ml-1" />
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <h3 className="text-lg md:text-xl font-bold text-white mb-1.5 truncate">{movie.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] md:text-xs font-semibold text-zinc-300">
                    <span className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3 md:w-3.5 md:h-3.5 fill-amber-500" /> {movie.rating || "9.5"}
                    </span>
                    <span className="px-2 py-0.5 rounded-sm bg-white/10 backdrop-blur-md">{movie.quality || "4K HDR"}</span>
                    <span className="px-2 py-0.5 rounded-sm bg-red-500/20 text-red-400 border border-red-500/30">#{trendingMovies.indexOf(movie) + 1} Trending</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED PREMIERE SECTION */}
      {featuredMovie && (
        <section className="py-12 md:py-24 px-4 sm:px-8 lg:px-16 w-full max-w-[1920px] mx-auto relative z-30 pointer-events-auto">
          <div className="mb-6 md:mb-10 flex items-end justify-between">
            <div>
              <h2 className="text-2xl md:text-5xl font-black tracking-tight mb-1 md:mb-2 text-white">Aura Premiere</h2>
              <p className="text-xs md:text-base text-red-500 font-bold uppercase tracking-widest">Exclusive Blockbuster Event</p>
            </div>
          </div>

          <div className="relative group w-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-amber-600 rounded-[2rem] md:rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-20 transition duration-1000 hidden md:block" />
            
            <div className="relative rounded-2xl md:rounded-[2.5rem] overflow-hidden aspect-[4/5] sm:aspect-video md:aspect-[21/9] border border-white/10 shadow-2xl w-full bg-zinc-900">
              <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-[#050505] via-[#050505]/80 md:via-[#050505]/50 to-transparent z-10 transition-opacity duration-500" />
              
              <img src={featuredMovie.banner || featuredMovie.poster || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80"} alt={featuredMovie.title} className="w-full h-full object-cover object-top md:object-center transition-transform duration-[1.5s] group-hover:scale-[1.02]" />
              
              <div className="absolute bottom-0 left-0 p-6 sm:p-12 md:p-20 z-20 w-full md:max-w-4xl flex flex-col justify-end h-full">
                <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                  <h3 className="text-4xl sm:text-6xl md:text-7xl font-black mb-3 md:mb-6 leading-none text-white drop-shadow-2xl">{featuredMovie.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-[10px] md:text-sm font-bold text-zinc-300 mb-4 md:mb-6">
                     <span className="text-green-500 border border-green-500/30 bg-green-500/10 px-2 py-1 rounded">{featuredMovie.quality || "4K UHD"}</span>
                     <span className="px-2 py-1 bg-white/10 rounded backdrop-blur-sm">{featuredMovie.releaseYear || "2024"}</span>
                     <span className="px-2 py-1 bg-white/10 rounded backdrop-blur-sm">{featuredMovie.duration || "2h 15m"}</span>
                  </div>
                  <p className="text-sm md:text-xl text-zinc-300 mb-6 md:mb-10 line-clamp-3 md:line-clamp-2 drop-shadow-lg leading-relaxed max-w-2xl font-medium">
                    {featuredMovie.fullDescription || featuredMovie.shortDescription || "Stream this exclusive masterpiece today. Only on Aura."}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 md:gap-5 w-full sm:w-auto">
                    <button onClick={() => router.push(`/watch/${featuredMovie.slug || featuredMovie.id}`)} className="w-full sm:w-auto px-6 py-4 md:px-10 md:py-5 rounded-xl bg-white text-black text-sm md:text-lg font-bold flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all hover:scale-105 shadow-xl">
                      <Play className="w-5 h-5 md:w-6 md:h-6 fill-black" /> Play Now
                    </button>
                    <button onClick={(e) => toggleMyList(featuredMovie, e)} className="w-full sm:w-auto px-6 py-4 md:px-10 md:py-5 rounded-xl bg-zinc-900/60 backdrop-blur-md border border-white/20 text-white text-sm md:text-lg font-bold flex items-center justify-center gap-3 hover:bg-white/10 hover:border-white/40 transition-all hover:scale-105">
                      {myList.some(m => m.id === featuredMovie.id) ? <><Check className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" /> Saved</> : <><Plus className="w-5 h-5 md:w-6 md:h-6" /> My List</>}
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CATEGORIES SECTION */}
      <section className="py-8 md:py-16 px-4 sm:px-8 lg:px-16 w-full max-w-[1920px] mx-auto">
        <div className="flex items-end justify-between mb-6 md:mb-10">
          <h2 className="text-xl md:text-4xl font-black tracking-tight text-white">Trending Categories</h2>
          <span className="text-zinc-500 hover:text-white text-xs md:text-sm font-bold flex items-center gap-1 cursor-pointer transition-colors">View All <ChevronRight size={16}/></span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
          {dynamicCategories.map((cat, i) => (
            <motion.div key={cat.id || i} onClick={() => router.push(`/movies?category=${cat.name}`)} className="relative aspect-[2/3] rounded-xl md:rounded-2xl overflow-hidden group cursor-pointer border border-white/5 bg-zinc-900 shadow-lg transition-all duration-500 hover:-translate-y-2 md:hover:-translate-y-4 hover:shadow-[0_20px_40px_-15px_rgba(220,38,38,0.3)] hover:border-red-500/50 w-full">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent z-10 transition-opacity duration-500 group-hover:opacity-90" />
              <img src={cat.img} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
              <div className="absolute bottom-4 left-4 right-4 z-20 transition-transform duration-500 group-hover:translate-y-[-8px]">
                 <h3 className="text-sm md:text-xl font-black text-white">{cat.name}</h3>
                 <div className="w-8 h-1 bg-red-600 mt-2 rounded-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 hidden md:block"/>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* MY LIST SECTION (Only shown if user is logged in and has items) */}
      {myList.length > 0 && (
        <section className="py-8 md:py-16 px-4 sm:px-8 lg:px-16 w-full max-w-[1920px] mx-auto border-t border-white/5 mt-4 md:mt-10">
          <h2 className="text-xl md:text-4xl font-black tracking-tight mb-6 md:mb-10 text-white">My List</h2>
          <div className="flex gap-3 md:gap-6 overflow-x-auto pb-8 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full px-1">
            {myList.map((movie: any) => (
              <div key={movie.id} onClick={() => router.push(`/watch/${movie.slug || movie.id}`)} className="relative w-32 md:w-56 lg:w-64 shrink-0 aspect-[2/3] rounded-xl md:rounded-2xl overflow-hidden cursor-pointer group snap-start border border-white/5 bg-zinc-900 shadow-lg transition-all duration-500 hover:-translate-y-3 hover:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)] hover:border-white/20">
                <img src={movie.poster || movie.banner || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80"} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 gap-4 backdrop-blur-sm">
                  <button className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white flex items-center justify-center hover:bg-red-600 hover:text-white text-black transition-colors shadow-2xl scale-75 group-hover:scale-100 duration-300 delay-100">
                    <Play className="w-5 h-5 md:w-7 md:h-7 fill-current ml-1" />
                  </button>
                  <p className="text-white font-bold text-center text-xs md:text-sm px-2 line-clamp-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">{movie.title}</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent md:hidden pointer-events-none">
                  <p className="text-[11px] font-bold text-white text-center truncate">{movie.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DISCOVERY SECTION */}
      <section className="py-16 md:py-32 px-4 sm:px-8 lg:px-16 w-full relative overflow-hidden mt-8">
        <div className="absolute inset-0 bg-[#0A0A0A] border-y border-white/5" />
        <div className="max-w-[1920px] mx-auto w-full relative z-10 grid lg:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="w-full order-2 lg:order-1">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-6 md:mb-8 border border-white/10 shadow-2xl">
              <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-amber-500" />
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 text-white leading-tight">Smart Content<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">Discovery.</span></h2>
            <p className="text-sm md:text-xl text-zinc-400 mb-8 md:mb-10 leading-relaxed font-medium max-w-xl">
              Stop endlessly scrolling. Our proprietary neural engine analyzes your cinematic preferences down to the pacing, color palette, and score to deliver the perfect watch, every single time.
            </p>
            <div className="space-y-4 md:space-y-6">
              <div className="flex items-center gap-4 text-sm md:text-lg font-bold text-zinc-300 bg-black/40 p-4 rounded-xl border border-white/5"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" /> Frame-by-frame analysis</div>
              <div className="flex items-center gap-4 text-sm md:text-lg font-bold text-zinc-300 bg-black/40 p-4 rounded-xl border border-white/5"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" /> Mood-based matchmaking</div>
              <div className="flex items-center gap-4 text-sm md:text-lg font-bold text-zinc-300 bg-black/40 p-4 rounded-xl border border-white/5"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" /> 99.8% prediction accuracy</div>
            </div>
          </div>
          
          <div className="relative w-full order-1 lg:order-2">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] md:w-[140%] h-[120%] md:h-[140%] bg-amber-900/10 blur-[100px] md:blur-[150px] z-0 rounded-full pointer-events-none" />
            <div className="bg-[#0D0D0D] border border-white/10 rounded-3xl p-5 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative z-20 backdrop-blur-2xl w-full">
              <div className="flex justify-between items-center mb-6 md:mb-8 border-b border-white/10 pb-4 md:pb-6">
                <h4 className="font-black text-lg md:text-2xl text-white flex items-center gap-3"><MonitorPlay className="text-amber-500"/> Neural Picks</h4>
                <span className="text-[10px] md:text-xs text-black bg-amber-500 px-3 py-1.5 rounded-full font-black uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"/> Live Sync
                </span>
              </div>
              <div className="space-y-4 md:space-y-6">
                {neuralPicks.length > 0 ? neuralPicks.map((item, idx) => (
                  <div key={item.id} onClick={() => router.push(`/watch/${item.slug || item.id}`)} className="flex gap-4 md:gap-6 items-center p-3 md:p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/10 group w-full">
                    <div className="w-16 md:w-24 aspect-[2/3] bg-zinc-800 rounded-lg object-cover overflow-hidden shrink-0 shadow-lg border border-white/5">
                       <img src={item.poster || item.banner || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80"} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <h5 className="font-black text-base md:text-xl text-white truncate mb-1 md:mb-2 group-hover:text-amber-500 transition-colors">{item.title}</h5>
                      <div className="flex items-center gap-3">
                         <span className="text-[10px] md:text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">Match {(99 - idx)}%</span>
                         <span className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest">{item.category}</span>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-10 text-center text-zinc-500 font-medium">Upload movies to generate intelligent neural picks.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <section className="py-16 md:py-32 px-4 sm:px-8 lg:px-16 w-full max-w-[1920px] mx-auto">
        <div className="text-center max-w-4xl mx-auto mb-12 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-black mb-4 md:mb-6 text-white tracking-tight">Empowering Independent Studios</h2>
          <p className="text-sm md:text-xl text-zinc-400 font-medium">Distribute your film directly to millions. Keep 90% of the revenue. Access enterprise-grade real-time cinematic analytics.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full">
          <div className="bg-[#0A0A0A] border border-white/5 p-8 md:p-10 rounded-3xl hover:bg-zinc-900 hover:border-white/10 transition-all duration-300 hover:-translate-y-2 shadow-xl group">
            <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:bg-red-600/20 group-hover:border-red-600/30 transition-colors">
               <Clapperboard className="w-7 h-7 text-white group-hover:text-red-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-3 md:mb-4 text-white">Pristine 8K Uploads</h3>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed font-medium">Upload massive ProRes files. Our cloud infrastructure transcodes instantly without quality loss.</p>
          </div>
          <div className="bg-[#0A0A0A] border border-white/5 p-8 md:p-10 rounded-3xl hover:bg-zinc-900 hover:border-white/10 transition-all duration-300 hover:-translate-y-2 shadow-xl group">
            <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:bg-red-600/20 group-hover:border-red-600/30 transition-colors">
               <BarChart3 className="w-7 h-7 text-white group-hover:text-red-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-3 md:mb-4 text-white">Granular Analytics</h3>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed font-medium">See exactly where viewers pause, rewind, or drop off. Data that helps you direct better.</p>
          </div>
          <div className="bg-[#0A0A0A] border border-white/5 p-8 md:p-10 rounded-3xl hover:bg-zinc-900 hover:border-white/10 transition-all duration-300 hover:-translate-y-2 shadow-xl group sm:col-span-2 lg:col-span-1 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 md:p-8"><div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(239,68,68,1)]" /></div>
            <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-white/5 group-hover:bg-red-600/20 group-hover:border-red-600/30 transition-colors">
               <Film className="w-7 h-7 text-white group-hover:text-red-500" />
            </div>
            <h3 className="text-xl md:text-2xl font-black mb-3 md:mb-4 text-white">Global Premiere</h3>
            <p className="text-sm md:text-base text-zinc-400 leading-relaxed font-medium">Schedule a live premiere event. Chat with your audience in real-time as the credits roll.</p>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#050505] pt-16 md:pt-24 pb-8 md:pb-12 px-4 md:px-12 w-full">
        <div className="max-w-[1920px] mx-auto w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 md:gap-12 mb-16 md:mb-24 pb-16 border-b border-white/5">
            <div className="col-span-2 md:col-span-4 lg:col-span-2 mb-4 lg:mb-0">
              <div className="flex items-center gap-2 mb-6 md:mb-8">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                  <Play className="w-5 h-5 text-white fill-white ml-1" />
                </div>
                <span className="text-3xl font-black tracking-tight text-white italic">AURA<span className="text-red-600">.</span></span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mb-8 font-medium">
                The world's most advanced cinematic streaming network. Built for true cinephiles who demand zero-buffering, high-fidelity audio, and pure 8K visual excellence.
              </p>
              <div className="flex items-center gap-5 text-zinc-500">
                <Globe className="w-6 h-6 hover:text-white cursor-pointer transition-colors" />
                <Headphones className="w-6 h-6 hover:text-white cursor-pointer transition-colors" />
                <Shield className="w-6 h-6 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>
            
            <div>
              <h4 className="font-black text-white mb-6 uppercase tracking-widest text-xs">The Network</h4>
              <ul className="space-y-4 text-sm text-zinc-500 font-bold">
                <li><a href="#" className="hover:text-white transition-colors">Aura Originals</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Live Premieres</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Neural Search AI</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Aura Interactive</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Supported Devices</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black text-white mb-6 uppercase tracking-widest text-xs">Membership</h4>
              <ul className="space-y-4 text-sm text-zinc-500 font-bold">
                <li><a href="#" className="hover:text-white transition-colors">Plans & Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gift Cards</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Student Discounts</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Billing Help</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Account Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-white mb-6 uppercase tracking-widest text-xs">Aura Studio</h4>
              <ul className="space-y-4 text-sm text-zinc-500 font-bold">
                <li><a href="#" className="hover:text-white transition-colors">Creator Portal</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Upload Guidelines</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Revenue Sharing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analytics API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Studio Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-black text-white mb-6 uppercase tracking-widest text-xs">Corporate</h4>
              <ul className="space-y-4 text-sm text-zinc-500 font-bold">
                <li><a href="#" className="hover:text-white transition-colors">About Aura Inc.</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Investor Relations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Legal & Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 text-zinc-600 text-xs font-bold w-full">
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 md:gap-10">
              <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-500" /> Powered by Aura Engine</span>
              <span className="flex items-center gap-2"><Award className="w-4 h-4 text-emerald-500" /> 99.99% Uptime SLA</span>
              <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500" /> AES-256 Encrypted</span>
            </div>
            <p className="text-center lg:text-right">
              © {new Date().getFullYear()} Aura Streaming Network. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-2xl border-t border-white/10 z-[100] px-6 py-3 flex justify-between items-center pb-safe shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
        <button onClick={() => router.push('/')} className="flex flex-col items-center gap-1.5 text-white transition-colors group">
          <div className="p-1.5 bg-red-600/20 rounded-full"><Home size={20} className="text-red-500" /></div>
          <span className="text-[10px] font-black text-red-500">Home</span>
        </button>
        <button onClick={() => router.push('/movies')} className="flex flex-col items-center gap-1.5 text-zinc-500 hover:text-white transition-colors">
          <div className="p-1.5"><Film size={20} /></div>
          <span className="text-[10px] font-bold">Movies</span>
        </button>
        <button onClick={() => router.push('/originals')} className="flex flex-col items-center gap-1.5 text-zinc-500 hover:text-white transition-colors">
          <div className="p-1.5"><Compass size={20} /></div>
          <span className="text-[10px] font-bold">Originals</span>
        </button>
        <button onClick={() => router.push('/watchlist')} className="flex flex-col items-center gap-1.5 text-zinc-500 hover:text-white transition-colors">
          <div className="p-1.5"><Bookmark size={20} /></div>
          <span className="text-[10px] font-bold">My List</span>
        </button>
      </div>

    </div>
  );
}
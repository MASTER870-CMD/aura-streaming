"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play, Info, MonitorPlay, Smartphone, Tv, Sparkles, 
  BarChart3, Clapperboard, Film, Plus, Check, Loader2,
  Shield, Zap, Globe, Clock, Headphones, Award
} from "lucide-react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar/Navbar";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove, getDoc, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [featuredMovie, setFeaturedMovie] = useState<any>(null);
  const [neuralPicks, setNeuralPicks] = useState<any[]>([]);
  const [myList, setMyList] = useState<any[]>([]);
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    async function loadRealData() {
      if (!user) { setIsFetching(false); return; }
      try {
        // Only fetch "Published" master files from the ingestion engine
        const moviesRef = collection(db, "movies");
        const q = query(moviesRef, where("status", "==", "Published"));
        const moviesSnap = await getDocs(q);
        
        const allMovies: any[] = moviesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const sortedByViews: any[] = [...allMovies].sort((a: any, b: any) => (b.views || 0) - (a.views || 0));
        
        // Grab the top movie for the Featured section (or a specific 'isFeatured' flag if preferred)
        const topFeatured = sortedByViews.find(m => m.isFeatured) || sortedByViews[0];
        if (topFeatured) {
          setFeaturedMovie(topFeatured);
          setNeuralPicks(sortedByViews.filter(m => m.id !== topFeatured.id).slice(0, 4)); 
        }

        // Fetch User's Watchlist
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().myList) {
          setMyList(userDoc.data().myList);
        }

        // Map Categories to visually rich thumbnails using the Poster data
        const catSnap = await getDocs(collection(db, "categories"));
        const cats: any[] = catSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const categoriesWithImages = cats.map((c: any) => {
          const topMovieForCat: any = sortedByViews.find((m: any) => m.category === c.name);
          return { 
            ...c, 
            img: topMovieForCat?.poster || topMovieForCat?.banner || "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80" 
          };
        });
        setDynamicCategories(categoriesWithImages);

      } catch (error) {
        console.error("Error synchronizing master library:", error);
      } finally {
        setIsFetching(false);
      }
    }
    
    if (!loading) loadRealData();
  }, [user, loading]);

  const toggleMyList = async (movie: any) => {
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
    } catch (error) { 
      console.error(error); 
    }
  };

  if (loading || isFetching) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-red-600 animate-spin mb-4" />
        <p className="text-[10px] sm:text-xs font-bold tracking-widest text-zinc-500 uppercase animate-pulse">Initializing Platform...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-50 font-sans selection:bg-red-900 selection:text-white overflow-x-hidden">
      <Navbar />

      {/* --- RESPONSIVE HERO SECTION --- */}
      <section className="relative h-[85vh] sm:h-screen flex items-center justify-center overflow-hidden px-4">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent z-10" />
          {/* Dynamic background if featured movie exists, else fallback */}
          <img 
            src={featuredMovie?.banner || "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80"} 
            alt="Cinematic Background" 
            className="w-full h-full object-cover opacity-30 scale-105 blur-[4px]" 
          />
        </div>
        <div className="relative z-20 text-center w-full max-w-4xl mt-16 sm:mt-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <span className="text-amber-500 uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[10px] sm:text-xs font-bold mb-3 sm:mb-4 block shadow-black drop-shadow-md">
              Welcome Back, {user?.displayName || "Aura Member"}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter mb-4 sm:mb-6 leading-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
              Limitless Stories.<br /> Curated by Intelligence.
            </h1>
            <p className="text-xs sm:text-base md:text-xl text-zinc-400 mb-8 sm:mb-10 max-w-2xl mx-auto px-4 font-light drop-shadow-md">
              Experience cinema in a billion-dollar ecosystem. Watch stunning originals in 8K, powered by an AI engine that knows exactly what you want to see.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-6 sm:px-4">
              <button onClick={() => router.push(`/movies`)} className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-white text-black text-sm sm:text-base font-semibold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black" /> Start Watching
              </button>
              <button onClick={() => router.push('/movies?category=Originals')} className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-full bg-zinc-900/50 backdrop-blur-md border border-white/10 text-white text-sm sm:text-base font-semibold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95">
                <Info className="w-4 h-4 sm:w-5 sm:h-5" /> Explore Originals
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- RESPONSIVE FEATURED SECTION --- */}
      {featuredMovie && (
        <section className="py-12 sm:py-24 px-4 sm:px-8 max-w-[1800px] mx-auto relative z-20 -mt-12 sm:-mt-20">
          <div className="mb-6 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2">Aura Premiere</h2>
            <p className="text-[11px] sm:text-sm text-zinc-400">Exclusive blockbusters, streaming now.</p>
          </div>

          <motion.div whileHover={{ scale: 0.99 }} className="relative rounded-xl sm:rounded-2xl overflow-hidden aspect-[4/5] sm:aspect-video md:aspect-[21/9] group border border-white/5 shadow-2xl bg-zinc-950">
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/95 via-black/60 to-transparent z-10" />
            
            {/* Using Master Banner if available, falling back to Poster */}
            <img 
              src={featuredMovie.banner || featuredMovie.poster} 
              alt={featuredMovie.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            
            <div className="absolute bottom-0 left-0 p-5 sm:p-10 z-20 w-full md:max-w-2xl flex flex-col justify-end h-full">
              <div className="flex items-center gap-2 mb-2">
                {featuredMovie.quality && <span className="text-[10px] font-black text-emerald-500 uppercase">{featuredMovie.quality}</span>}
                <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold text-white uppercase">{featuredMovie.category}</span>
              </div>
              <h3 className="text-2xl sm:text-4xl font-bold mb-2 sm:mb-4 font-serif italic drop-shadow-lg leading-tight">{featuredMovie.title}</h3>
              
              {/* Uses Short Description from the Admin Ingestion Form */}
              <p className="text-[11px] sm:text-base text-zinc-300 mb-4 sm:mb-6 line-clamp-3 sm:line-clamp-2 drop-shadow-md leading-relaxed">
                {featuredMovie.shortDescription || featuredMovie.fullDescription || "No description provided."}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4">
                <button onClick={() => router.push(`/watch/${featuredMovie.slug || featuredMovie.id}`)} className="w-full sm:w-auto px-6 py-3 rounded-lg bg-red-600 text-white text-xs sm:text-base font-bold uppercase tracking-wide flex items-center justify-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
                  <Play className="w-4 h-4 fill-white" /> Play Master
                </button>
                <button onClick={() => toggleMyList(featuredMovie)} className="w-full sm:w-auto px-6 py-3 rounded-lg bg-zinc-900/80 border border-white/10 text-white text-xs sm:text-base font-medium flex items-center justify-center gap-2 hover:bg-white hover:text-black transition-all">
                  {myList.some(m => m.id === featuredMovie.id) ? <><Check className="w-4 h-4 text-emerald-500" /> Saved to List</> : <><Plus className="w-4 h-4" /> Add to List</>}
                </button>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* --- RESPONSIVE CATEGORIES GRID --- */}
      <section className="py-8 sm:py-12 px-4 sm:px-8 max-w-[1800px] mx-auto">
        <h2 className="text-lg sm:text-2xl font-bold tracking-tight mb-6 sm:mb-8">Trending Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6">
          {dynamicCategories.map((cat, i) => (
            <motion.div key={cat.id || i} onClick={() => router.push(`/movies?category=${cat.name}`)} whileHover={{ y: -5 }} className="relative aspect-[3/4] rounded-lg sm:rounded-xl overflow-hidden group cursor-pointer border border-white/5 shadow-lg bg-zinc-900">
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 transition-opacity group-hover:opacity-80" />
              <img src={cat.img} alt={cat.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <h3 className="absolute bottom-3 sm:bottom-6 left-3 sm:left-6 z-20 text-xs sm:text-lg font-bold text-white uppercase tracking-wider">{cat.name}</h3>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- COMPACT MY LIST SCROLL ROW --- */}
      {myList.length > 0 && (
        <section className="py-8 sm:py-12 px-4 sm:px-8 max-w-[1800px] mx-auto border-t border-white/5 mt-4 sm:mt-8">
          <h2 className="text-lg sm:text-2xl font-bold tracking-tight mb-4 sm:mb-8 flex items-center gap-2">
            <Check className="text-red-500" size={24} /> My Saved Content
          </h2>
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
            {myList.map((movie: any) => (
              <motion.div key={movie.id} whileHover={{ scale: 1.05 }} className="relative w-40 sm:w-64 shrink-0 aspect-video rounded-lg sm:rounded-xl overflow-hidden cursor-pointer group snap-start border border-white/5 shadow-md bg-zinc-900">
                {/* Prefers 16:9 Banner for this row */}
                <img src={movie.banner || movie.poster} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center sm:justify-start sm:items-end p-2 sm:p-4 gap-2">
                  <button onClick={(e) => { e.stopPropagation(); router.push(`/watch/${movie.slug || movie.id}`); }} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center hover:bg-red-600 hover:text-white text-black transition-colors shadow-lg"><Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5 sm:ml-1" /></button>
                  <button onClick={(e) => { e.stopPropagation(); toggleMyList(movie); }} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-900/80 border border-white/20 text-white flex items-center justify-center hover:border-white transition-colors shadow-lg"><Check className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" /></button>
                </div>
                <div className="absolute bottom-2 left-2 right-2 sm:hidden group-hover:hidden pointer-events-none">
                  <p className="text-[10px] font-bold text-white truncate drop-shadow-md">{movie.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* --- AI RECOMMENDATION SECTION --- */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900/20" />
        <div className="max-w-[1800px] mx-auto relative z-10 grid lg:grid-cols-2 gap-10 sm:gap-16 items-center">
          <div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4 sm:mb-6 border border-zinc-700">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">Smart Content Discovery.</h2>
            <p className="text-sm sm:text-lg text-zinc-400 mb-6 sm:mb-8">
              Stop endlessly scrolling. Our proprietary neural engine analyzes your cinematic preferences down to the pacing, color palette, and score to deliver the perfect watch, every single time.
            </p>
            <ul className="space-y-3 sm:space-y-4 mb-8">
              <li className="flex items-center gap-3 text-xs sm:text-base text-zinc-300"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> Frame-by-frame analysis</li>
              <li className="flex items-center gap-3 text-xs sm:text-base text-zinc-300"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> Mood-based matchmaking</li>
              <li className="flex items-center gap-3 text-xs sm:text-base text-zinc-300"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> 99.8% prediction accuracy</li>
            </ul>
          </div>
          <div className="relative">
            <div className="bg-zinc-900/90 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl relative z-20 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-4 sm:mb-6 border-b border-white/5 pb-3 sm:pb-4">
                <h4 className="font-bold text-sm sm:text-base text-white">Your Neural Picks</h4>
                <span className="text-[10px] sm:text-xs font-black uppercase text-amber-500 bg-amber-500/10 px-2 py-1 rounded tracking-widest flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Live Sync
                </span>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {neuralPicks.length > 0 ? neuralPicks.map((item, idx) => (
                  <div key={item.id} onClick={() => router.push(`/watch/${item.slug || item.id}`)} className="flex gap-3 sm:gap-4 items-center p-2 sm:p-3 rounded-xl hover:bg-zinc-800/80 transition-colors cursor-pointer border border-transparent hover:border-white/10 group">
                    <div className="w-20 h-14 sm:w-28 sm:h-16 bg-black rounded sm:rounded-lg overflow-hidden shrink-0 shadow-inner">
                       {/* Neural Picks prefers the Banner file */}
                       <img src={item.banner || item.poster} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="overflow-hidden flex-1">
                      <h5 className="font-bold text-xs sm:text-sm text-white truncate">{item.title}</h5>
                      <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1 truncate">
                        <span className="text-emerald-500 font-bold mr-2">Match {(99 - idx)}%</span>
                        {item.category} • {item.releaseYear || new Date().getFullYear()}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 pr-2 transition-opacity">
                      <Play className="w-4 h-4 text-zinc-400 fill-zinc-400" />
                    </div>
                  </div>
                )) : (
                  <p className="text-zinc-500 text-xs sm:text-sm italic">Engine requires more viewing data to generate picks.</p>
                )}
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-amber-900/10 blur-[100px] z-0 rounded-full pointer-events-none" />
          </div>
        </div>
      </section>

      {/* --- CREATOR PLATFORM --- */}
      <section className="py-16 sm:py-24 px-4 sm:px-8 max-w-[1800px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Empowering Independent Studios</h2>
          <p className="text-xs sm:text-base text-zinc-400">Distribute your film directly to millions. Keep 90% of the revenue. Get real-time cinematic analytics.</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
          <div className="bg-zinc-900/50 border border-white/5 p-5 sm:p-8 rounded-xl sm:rounded-2xl hover:bg-zinc-900 hover:border-white/10 transition-all shadow-lg group">
            <Clapperboard className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-500 group-hover:text-white transition-colors mb-4 sm:mb-6" />
            <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3">Pristine Master Uploads</h3>
            <p className="text-[11px] sm:text-sm text-zinc-400">Upload massive ProRes files. Our cloud infrastructure transcodes instantly without quality loss.</p>
          </div>
          <div className="bg-zinc-900/50 border border-white/5 p-5 sm:p-8 rounded-xl sm:rounded-2xl hover:bg-zinc-900 hover:border-white/10 transition-all shadow-lg group">
            <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-500 group-hover:text-white transition-colors mb-4 sm:mb-6" />
            <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3">Granular Analytics</h3>
            <p className="text-[11px] sm:text-sm text-zinc-400">See exactly where viewers pause, rewind, or drop off. Data that helps you direct better.</p>
          </div>
          <div className="bg-zinc-900/50 border border-white/5 p-5 sm:p-8 rounded-xl sm:rounded-2xl hover:bg-zinc-900 hover:border-white/10 transition-all relative overflow-hidden shadow-lg sm:col-span-2 md:col-span-1 group">
             <div className="absolute top-0 right-0 p-3 sm:p-4"><div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" /></div>
            <Film className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-500 group-hover:text-white transition-colors mb-4 sm:mb-6" />
            <h3 className="text-base sm:text-xl font-bold mb-2 sm:mb-3">Global Premiere</h3>
            <p className="text-[11px] sm:text-sm text-zinc-400">Schedule a live premiere event. Chat with your audience in real-time as the credits roll.</p>
          </div>
        </div>
      </section>

      {/* --- A TO Z FOOTER --- */}
      <footer className="border-t border-white/5 bg-zinc-950 pt-16 md:pt-24 pb-12 px-4 md:px-12">
        <div className="max-w-[1800px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16 md:mb-24 pb-16 border-b border-white/5">
            <div className="col-span-2 md:col-span-4 lg:col-span-2 mb-4 lg:mb-0">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/20">
                  <Film className="w-5 h-5 text-white" />
                </div>
                <span className="text-2xl font-black italic tracking-tight text-white">AURA<span className="text-red-600">.</span></span>
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-sm mb-6">
                The world's most advanced cinematic streaming network. Built for true cinephiles who demand zero-buffering, high-fidelity audio, and pure 4K visual excellence.
              </p>
              <div className="flex items-center gap-4 text-zinc-500">
                <Globe className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                <Headphones className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
                <Shield className="w-5 h-5 hover:text-white cursor-pointer transition-colors" />
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-5 uppercase tracking-wider text-[11px] sm:text-xs">The Network</h4>
              <ul className="space-y-3 text-[11px] sm:text-sm text-zinc-500 font-medium">
                <li><a href="#" className="hover:text-white transition-colors">Aura Originals</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Live Premieres</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Neural Search AI</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Aura Interactive</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Supported Devices</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-5 uppercase tracking-wider text-[11px] sm:text-xs">Membership</h4>
              <ul className="space-y-3 text-[11px] sm:text-sm text-zinc-500 font-medium">
                <li><a href="#" className="hover:text-white transition-colors">Plans & Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Gift Cards</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Student Discounts</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Billing Help</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Account Security</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-5 uppercase tracking-wider text-[11px] sm:text-xs">Aura Studio</h4>
              <ul className="space-y-3 text-[11px] sm:text-sm text-zinc-500 font-medium">
                <li><a href="#" className="hover:text-white transition-colors">Creator Portal</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Upload Guidelines</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Revenue Sharing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analytics API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Studio Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-5 uppercase tracking-wider text-[11px] sm:text-xs">Corporate</h4>
              <ul className="space-y-3 text-[11px] sm:text-sm text-zinc-500 font-medium">
                <li><a href="#" className="hover:text-white transition-colors">About Aura Inc.</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Investor Relations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Legal & Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-zinc-600 text-[10px] md:text-xs font-bold">
            <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-8">
              <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-red-500" /> Powered by Aura Engine</span>
              <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-emerald-500" /> 99.99% Uptime SLA</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-blue-500" /> AES-256 Encrypted</span>
            </div>
            <p className="text-center md:text-right">
              © {new Date().getFullYear()} Aura Streaming Network. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
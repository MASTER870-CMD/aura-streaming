"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, Play, Flame } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProfileDropdown from "../dropdowns/ProfileDropdown";

export default function Navbar() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const notifications = [
    { id: 1, title: "New Upload", desc: "Jarvis AI Part 6 is now available!", time: "2m ago", unread: true },
    { id: 2, title: "Recommendation", desc: "You might like 'The Silent Void'", time: "1h ago", unread: true },
  ];

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    async function fetchUserStreak() {
      if (!user) {
        setStreak(0);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setStreak(userSnap.data().watchStreak || 0);
        } else {
          setStreak(0);
        }
      } catch (error) {
        console.error("Failed to fetch watch streak:", error);
        setStreak(0);
      }
    }

    fetchUserStreak();
  }, [user]);

  const toggleSearch = () => {
    if (isSearchOpen && searchQuery.trim() !== "") {
      router.push(`/movies?search=${encodeURIComponent(searchQuery)}`);
    } else {
      setIsSearchOpen(!isSearchOpen);
      if (!isSearchOpen) setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/movies?search=${encodeURIComponent(searchQuery)}`);
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-zinc-950/90 backdrop-blur-xl border-b border-white/5 py-3 md:py-4" : "bg-gradient-to-b from-black/80 to-transparent py-4 md:py-6"}`}>
      <div className="max-w-[1800px] mx-auto px-4 md:px-12 flex items-center justify-between">
        
        {/* Left: Logo & Desktop Links */}
        <div className="flex items-center gap-6 md:gap-10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 md:w-8 md:h-8 rounded bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              <Play className="w-3 h-3 md:w-4 md:h-4 text-white fill-white ml-0.5" />
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight text-white drop-shadow-md">AURA<span className="text-red-600">.</span></span>
          </Link>
          
          <div className="hidden md:flex gap-6 lg:gap-8 text-sm font-medium">
            <Link href="/" className={`transition-colors ${isActive('/') ? 'text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}>Home</Link>
            <Link href="/movies" className={`transition-colors ${isActive('/movies') ? 'text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}>Movies</Link>
            <Link href="/originals" className={`transition-colors ${isActive('/originals') ? 'text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}>Originals</Link>
            <Link href="/watchlist" className={`transition-colors ${isActive('/watchlist') ? 'text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'}`}>My List</Link>
          </div>
        </div>

        {/* Right: Icons & Auth */}
        <div className="flex items-center gap-3 md:gap-6">
          
          {/* Animated Search Bar (FIXED FOR MOBILE) */}
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <motion.div 
              initial={false}
              animate={{ width: isSearchOpen ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 160 : 250) : 36 }}
              className={`flex items-center overflow-hidden rounded-full transition-colors duration-300 ${isSearchOpen ? 'bg-zinc-900 border border-white/20 px-2 py-1.5' : 'bg-transparent border border-transparent'}`}
            >
              <Search onClick={toggleSearch} className="w-5 h-5 text-zinc-300 hover:text-white cursor-pointer shrink-0 transition-colors" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => { if (!searchQuery) setIsSearchOpen(false); }}
                className={`bg-transparent border-none outline-none text-sm text-white ml-2 w-full placeholder:text-zinc-500 ${isSearchOpen ? 'block' : 'hidden'}`}
              />
            </motion.div>
          </form>

          {/* Notifications */}
          <div className="relative">
            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="relative hover:text-white text-zinc-300 transition-colors mt-1">
              <Bell className="w-5 h-5 md:w-6 md:h-6" />
              {notifications.some(n => n.unread) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-zinc-950"></span>
              )}
            </button>
            
            <AnimatePresence>
              {isNotifOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-[-40px] md:right-0 top-full mt-4 w-[280px] md:w-[320px] bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="p-3 md:p-4 border-b border-white/5 bg-black/40"><h3 className="font-bold text-white text-sm md:text-base">Notifications</h3></div>
                  <div className="max-h-[250px] md:max-h-[300px] overflow-y-auto">
                    {notifications.map(notif => (
                      <div key={notif.id} className="p-3 md:p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer flex gap-3">
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-red-600 shrink-0" />
                        <div>
                          <p className="text-xs md:text-sm font-bold text-white">{notif.title}</p>
                          <p className="text-[10px] md:text-xs text-zinc-400 mt-1">{notif.desc}</p>
                          <p className="text-[9px] md:text-[10px] text-zinc-500 mt-1 md:mt-2 font-medium">{notif.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {loading ? (
            <div className="w-8 h-8 rounded-lg bg-zinc-800 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3 md:gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/10 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.15)] cursor-default hover:border-amber-500/50 transition-colors">
                <Flame className={`w-4 h-4 ${streak > 0 ? "text-amber-500 fill-amber-500" : "text-zinc-600"}`} />
                <span className="text-xs font-black text-white">{streak}</span>
              </div>
              <ProfileDropdown />
            </div>
          ) : (
            <Link href="/auth" className="flex items-center gap-2 text-xs md:text-sm font-semibold text-white bg-red-700 hover:bg-red-600 px-3 py-1.5 md:px-4 md:py-2 rounded-lg transition-all">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

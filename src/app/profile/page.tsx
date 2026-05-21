"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Camera, Loader2, Save, Sparkles, Clock, Flame, BrainCircuit, 
  Settings2, Play, MonitorPlay, History
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar/Navbar";
import { updateUserProfile, uploadAvatar } from "@/services/user.service";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ProfilePage() {
  const { user, userProfile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [watchHistory, setWatchHistory] = useState<any[]>([]);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    favoriteGenre: "",
    preferredLanguage: "",
    autoplayEnabled: true,
    streaming4k: true,
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
      return;
    }

    if (userProfile) {
      setFormData({
        name: userProfile.name || "",
        username: userProfile.username || "",
        bio: userProfile.bio || "",
        favoriteGenre: userProfile.favoriteGenre || "Sci-Fi",
        preferredLanguage: userProfile.preferredLanguage || "English",
        autoplayEnabled: userProfile.autoplayEnabled ?? true,
        streaming4k: userProfile.streaming4k ?? true,
      });
    }

    async function fetchRealHistory() {
      if (!user) return;
      try {
        const q = query(
          collection(db, "movies"), 
          where("viewedBy", "array-contains", user.uid),
          limit(10)
        );
        const snap = await getDocs(q);
        const historyData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWatchHistory(historyData);
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setFetchingHistory(false);
      }
    }

    if (user) fetchRealHistory();
  }, [user, loading, userProfile, router]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, formData);
      await refreshProfile();
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    setIsUploading(true);
    try {
      await uploadAvatar(user.uid, file);
      await refreshProfile();
    } catch (error) {
      console.error("Avatar upload failed", error);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading || !userProfile) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin mb-4" />
      </div>
    );
  }

  const avatarDisplay = userProfile.avatar || user?.photoURL;
  const initial = userProfile.name?.charAt(0).toUpperCase() || "A";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-red-900 selection:text-white pb-12 sm:pb-20 overflow-x-hidden">
      <Navbar />

      <div className="relative h-[140px] sm:h-[350px] w-full overflow-hidden shrink-0 mt-14 sm:mt-0">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent z-10" />
        <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2070" className="w-full h-full object-cover opacity-30 grayscale blur-[2px]" alt="Banner" />
        
        <div className="absolute bottom-0 left-0 w-full z-20 px-4 sm:px-8 md:px-12 max-w-[1800px] mx-auto pb-3 sm:pb-8 flex items-end gap-3 sm:gap-6">
          
          <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden" />
            <div className="w-16 h-16 sm:w-32 sm:h-32 rounded-lg sm:rounded-2xl border-2 sm:border-4 border-zinc-950 bg-zinc-800 overflow-hidden relative shadow-2xl flex items-center justify-center">
              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20"><Loader2 className="w-5 h-5 sm:w-8 sm:h-8 animate-spin text-red-600" /></div>
              ) : avatarDisplay ? (
                <img src={avatarDisplay} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="text-xl sm:text-4xl font-bold text-zinc-500">{initial}</div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10">
                <Camera className="w-4 h-4 sm:w-6 sm:h-6 text-white mb-0.5 sm:mb-1" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-gradient-to-br from-amber-400 to-amber-600 border border-zinc-950 rounded-full p-1 sm:p-1.5 shadow-xl z-30">
              <Sparkles className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-zinc-950" />
            </div>
          </div>

          <div className="flex-1 pb-0.5 sm:pb-2 overflow-hidden">
            <div className="flex items-center gap-2 mb-0.5 sm:mb-2">
              <span className="px-1.5 py-0.5 rounded-full bg-red-600/20 text-red-500 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest border border-red-500/20 whitespace-nowrap">{userProfile.subscriptionPlan}</span>
              <span className="text-[9px] sm:text-xs text-zinc-500 truncate">Member since {userProfile.membershipDate}</span>
            </div>
            <h1 className="text-lg sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-none sm:leading-tight truncate">{userProfile.name}</h1>
            <p className="text-[10px] sm:text-base text-zinc-400 font-medium truncate">@{userProfile.username}</p>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-8 md:px-12 py-4 sm:py-12 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-12">
        
        <div className="lg:col-span-1 space-y-4 sm:space-y-8">
          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
            <h2 className="text-base sm:text-xl font-bold text-white mb-4 sm:mb-6 flex items-center gap-2"><Settings2 className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" /> Identity</h2>
            
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="text-[9px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Display Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white focus:border-red-500 outline-none transition-all" />
              </div>
              <div>
                <label className="text-[9px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Username</label>
                <input type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white focus:border-red-500 outline-none transition-all" />
              </div>
              <div>
                <label className="text-[9px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Cinematic Bio</label>
                <textarea rows={2} value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white focus:border-red-500 outline-none transition-all resize-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-[9px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Genre</label>
                  <select value={formData.favoriteGenre} onChange={e => setFormData({...formData, favoriteGenre: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg sm:rounded-xl px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white focus:border-red-500 outline-none appearance-none">
                    <option>Sci-Fi</option><option>Thriller</option><option>Action</option><option>Drama</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1 block">Language</label>
                  <select value={formData.preferredLanguage} onChange={e => setFormData({...formData, preferredLanguage: e.target.value})} className="w-full bg-black/50 border border-white/10 rounded-lg sm:rounded-xl px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white focus:border-red-500 outline-none appearance-none">
                    <option>English</option><option>Spanish</option><option>Japanese</option>
                  </select>
                </div>
              </div>

              <button onClick={handleSave} disabled={isSaving} className="w-full mt-2 sm:mt-6 bg-red-700 hover:bg-red-600 text-white font-bold py-2.5 sm:py-3.5 rounded-lg sm:rounded-xl transition-all shadow-[0_0_15px_rgba(220,38,38,0.2)] disabled:opacity-50 flex justify-center items-center gap-2 text-xs sm:text-base">
                {isSaving ? <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-3 h-3 sm:w-4 h-4" />} {isSaving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 sm:space-y-8">
          
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <StatCard icon={<Clock className="text-blue-400 w-4 h-4 sm:w-6 sm:h-6" />} label="Hours" value={userProfile.watchHours || 0} />
            <StatCard icon={<Flame className="text-orange-500 w-4 h-4 sm:w-6 sm:h-6" />} label="Streak" value={`${userProfile.watchStreak || 0}d`} />
            <StatCard icon={<BrainCircuit className="text-amber-500 w-4 h-4 sm:w-6 sm:h-6" />} label="Match" value={`${userProfile.aiAccuracy || 99.8}%`} />
          </div>

          <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
            <h2 className="text-base sm:text-xl font-bold text-white mb-3 sm:mb-6">Playback Settings</h2>
            <div className="space-y-1 sm:space-y-4">
              <ToggleRow icon={<MonitorPlay className="w-4 h-4 sm:w-5 sm:h-5"/>} label="Stream in 4K HDR" desc="Requires capable display." checked={formData.streaming4k} onChange={() => setFormData({...formData, streaming4k: !formData.streaming4k})} />
              <div className="h-px bg-white/5 w-full my-1.5 sm:my-2" />
              <ToggleRow icon={<Play className="w-4 h-4 sm:w-5 sm:h-5"/>} label="Autoplay Next" desc="Seamless binge sessions." checked={formData.autoplayEnabled} onChange={() => setFormData({...formData, autoplayEnabled: !formData.autoplayEnabled})} />
            </div>
          </div>

          {/* ULTRA COMPACT REAL WATCH HISTORY */}
          <div className="pt-1 sm:pt-4">
            <h2 className="text-sm sm:text-xl font-bold text-white mb-2 sm:mb-4 flex items-center gap-2">
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" /> Recently Watched
            </h2>
            
            {fetchingHistory ? (
               <div className="flex justify-center py-6 sm:py-10"><Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 animate-spin" /></div>
            ) : watchHistory.length === 0 ? (
               <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-4 sm:p-6 text-center">
                 <p className="text-zinc-500 text-[10px] sm:text-sm">You haven't watched any movies yet.</p>
               </div>
            ) : (
              <div className="flex overflow-x-auto gap-2 sm:gap-4 pb-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {watchHistory.map((movie) => (
                  <div 
                    key={movie.id}
                    onClick={() => router.push(`/watch/${movie.id}`)}
                    // FIXED SIZING: Extremely compact on mobile (w-28), standard on desktop (sm:w-64)
                    className="relative w-28 sm:w-64 shrink-0 aspect-video rounded-md sm:rounded-xl overflow-hidden cursor-pointer group snap-start border border-white/5 bg-zinc-900 shadow-sm"
                  >
                    <img src={movie.thumbnail} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100" />
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-6 h-6 sm:w-10 sm:h-10 rounded-full bg-white flex items-center justify-center hover:scale-110 transition-transform">
                        <Play className="w-3 h-3 sm:w-5 sm:h-5 text-black fill-black ml-0.5 sm:ml-1" />
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-zinc-800">
                      <div className="h-full bg-red-600" style={{ width: `${Math.floor(Math.random() * 60) + 20}%` }} />
                    </div>
                    
                    <div className="absolute top-1 sm:top-2 left-1.5 sm:left-2 right-1.5 sm:right-2 drop-shadow-md pointer-events-none">
                      <p className="text-[8px] sm:text-xs font-bold text-white truncate">{movie.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, className = "" }: any) {
  return (
    <div className={`bg-zinc-900/40 border border-white/5 rounded-xl p-3 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-4 hover:bg-zinc-900/60 transition-colors text-center sm:text-left ${className}`}>
      <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg bg-black/50 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">{icon}</div>
      <div className="overflow-hidden w-full">
        <p className="text-[8px] sm:text-xs text-zinc-500 font-bold uppercase tracking-wider truncate">{label}</p>
        <p className="text-sm sm:text-2xl font-black text-white truncate">{value}</p>
      </div>
    </div>
  );
}

function ToggleRow({ icon, label, desc, checked, onChange }: any) {
  return (
    <div className="flex items-center justify-between py-1.5 sm:py-2">
      <div className="flex items-center gap-2 sm:gap-4 pr-2">
        <div className="text-zinc-400 shrink-0">{icon}</div>
        <div>
          <p className="font-semibold text-white text-[11px] sm:text-sm">{label}</p>
          <p className="text-[9px] sm:text-xs text-zinc-500 truncate max-w-[120px] sm:max-w-full">{desc}</p>
        </div>
      </div>
      <button onClick={onChange} className={`w-9 h-5 sm:w-12 sm:h-6 rounded-full transition-colors relative shrink-0 ${checked ? 'bg-red-600' : 'bg-zinc-800'}`}>
        <motion.div animate={{ x: checked ? (typeof window !== 'undefined' && window.innerWidth < 640 ? 18 : 24) : 2 }} className="absolute top-0.5 sm:top-1 w-4 h-4 sm:w-4 sm:h-4 rounded-full bg-white shadow" />
      </button>
    </div>
  );
}
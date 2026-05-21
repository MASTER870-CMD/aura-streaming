"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, LogOut, PlaySquare, Bookmark, ChevronDown, Edit3, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ProfileDropdown() {
  const { user, userProfile, logout } = useAuth();
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!user) return null;

  const displayName = userProfile?.name || user.displayName || "Aura User";
  const avatarUrl = userProfile?.avatar || user.photoURL;
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 focus:outline-none group">
        <div className="relative">
          <div className={`w-9 h-9 rounded-lg overflow-hidden border transition-all duration-300 ${isOpen ? "border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.4)]" : "border-white/10 group-hover:border-white/30"}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-white">{firstLetter}</div>
            )}
          </div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 border-2 border-black rounded-full" />
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 hidden sm:block transition-transform ${isOpen ? "rotate-180 text-white" : "group-hover:text-white"}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-3 w-[260px] bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right"
          >
            <div className="p-4 border-b border-white/5 bg-black/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-zinc-800 flex items-center justify-center">
                  {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" /> : <span className="font-bold text-white">{firstLetter}</span>}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-white text-sm truncate">{displayName}</h3>
                  <p className="text-[10px] text-zinc-400 truncate">{userProfile?.subscriptionPlan || "Aura Premium"}</p>
                </div>
              </div>
              <button 
                onClick={() => { setIsOpen(false); router.push("/profile"); }}
                className="w-full mt-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2"
              >
                <Edit3 className="w-3.5 h-3.5" /> View Profile
              </button>
            </div>

            <div className="p-2 border-b border-white/5">
              <MenuItem icon={<PlaySquare className="w-4 h-4" />} label="Continue Watching" onClick={() => { setIsOpen(false); router.push("/watch"); }} />
              <MenuItem icon={<Bookmark className="w-4 h-4" />} label="Watchlist" onClick={() => { setIsOpen(false); router.push("/watchlist"); }} badge="New" />
              <MenuItem icon={<Settings className="w-4 h-4" />} label="Settings" onClick={() => { setIsOpen(false); router.push("/settings"); }} />
            </div>

            <div className="p-2">
              <button onClick={() => { setIsOpen(false); logout(); router.push("/"); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon, label, onClick, badge }: any) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
      <div className="flex items-center gap-3"><span className="text-zinc-500">{icon}</span>{label}</div>
      {badge && <span className="bg-red-600/20 text-red-500 border border-red-500/20 text-[10px] font-bold px-1.5 py-0.5 rounded">{badge}</span>}
    </button>
  );
}
"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Play,
  Info,
  MonitorPlay,
  Smartphone,
  Tv,
  Sparkles,
  BarChart3,
  Clapperboard,
  Film
} from "lucide-react";

// Import your new smart Navbar
import Navbar from "@/components/navbar/Navbar";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-red-900 selection:text-white">
      
      {/* --- INJECT NEW NAV --- */}
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Cinematic Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-zinc-950/0 to-zinc-950 z-10" />
          <img
            src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop"
            alt="Cinematic Background"
            className="w-full h-full object-cover opacity-40 scale-105 blur-[2px]"
          />
        </div>

        <div className="relative z-20 text-center max-w-4xl px-4 mt-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="text-amber-500 uppercase tracking-[0.3em] text-xs font-bold mb-4 block">
              The Future of Streaming
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-500">
              Limitless Stories.<br /> Curated by Intelligence.
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 mb-10 max-w-2xl mx-auto font-light">
              Experience cinema in a billion-dollar ecosystem. Watch stunning originals in 8K, powered by an AI engine that knows exactly what you want to see.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="px-8 py-4 rounded-full bg-white text-black font-semibold flex items-center gap-2 hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95">
                <Play className="w-5 h-5 fill-black" />
                Start Watching
              </button>
              <button className="px-8 py-4 rounded-full bg-zinc-900/50 backdrop-blur-md border border-white/10 text-white font-semibold flex items-center gap-2 hover:bg-zinc-800 transition-all hover:scale-105 active:scale-95">
                <Info className="w-5 h-5" />
                Explore Content
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURED SECTION --- */}
      <section className="py-24 px-8 max-w-7xl mx-auto relative z-20">
        <div className="mb-12 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Aura Premiere</h2>
            <p className="text-zinc-400">Exclusive blockbusters, streaming now.</p>
          </div>
        </div>

        <motion.div 
          whileHover={{ scale: 0.99 }}
          className="relative rounded-2xl overflow-hidden aspect-[21/9] group cursor-pointer border border-white/5 shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
          <img
            src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop"
            alt="Featured Movie"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute bottom-0 left-0 p-10 z-20 max-w-xl">
            <h3 className="text-4xl font-bold mb-4 font-serif italic">The Silent Void</h3>
            <p className="text-zinc-300 mb-6 line-clamp-2">
              In the deep reaches of sector 4, a lone surveyor discovers an anomaly that defies the laws of physics. The most anticipated sci-fi thriller of the decade.
            </p>
            <div className="flex gap-4">
              <button className="px-6 py-3 rounded-lg bg-red-700 text-white font-medium flex items-center gap-2 hover:bg-red-600 transition-colors">
                <Play className="w-4 h-4 fill-white" />
                Play Trailer
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* --- TRENDING CATEGORIES --- */}
      <section className="py-12 px-8 max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold tracking-tight mb-8">Trending Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { title: "Sci-Fi", img: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" },
            { title: "Cinematic Drama", img: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop" },
            { title: "Documentary", img: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2070&auto=format&fit=crop" },
            { title: "Action", img: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?q=80&w=1964&auto=format&fit=crop" },
          ].map((cat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="relative aspect-[3/4] rounded-xl overflow-hidden group cursor-pointer border border-white/5"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 transition-opacity group-hover:opacity-80" />
              <img src={cat.img} alt={cat.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <h3 className="absolute bottom-6 left-6 z-20 text-lg font-semibold">{cat.title}</h3>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- AI RECOMMENDATION SECTION --- */}
      <section className="py-24 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900/20" />
        <div className="max-w-7xl mx-auto relative z-10 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-6 border border-zinc-700">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-4xl font-bold mb-4">Smart Content Discovery.</h2>
            <p className="text-zinc-400 text-lg mb-8">
              Stop endlessly scrolling. Our proprietary neural engine analyzes your cinematic preferences down to the pacing, color palette, and score to deliver the perfect watch, every single time.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3 text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Frame-by-frame analysis
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Mood-based matchmaking
              </li>
              <li className="flex items-center gap-3 text-zinc-300">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 99.8% prediction accuracy
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative z-20 backdrop-blur-xl">
              <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
                <h4 className="font-medium text-zinc-200">Your Neural Picks</h4>
                <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-1 rounded">Live Sync</span>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex gap-4 items-center p-3 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                    <div className="w-24 h-16 bg-zinc-800 rounded object-cover overflow-hidden">
                       <img src={`https://images.unsplash.com/photo-15${item}36440136628-849c177e76a1?q=80&w=200&auto=format&fit=crop`} alt="thumb" className="w-full h-full object-cover opacity-60" />
                    </div>
                    <div>
                      <h5 className="font-medium text-sm text-zinc-200">Match {(99 - item)}%</h5>
                      <p className="text-xs text-zinc-500">Based on your love for Sci-Fi</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-amber-900/10 blur-[100px] z-0 rounded-full" />
          </div>
        </div>
      </section>

      {/* --- CREATOR PLATFORM --- */}
      <section className="py-24 px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">Empowering Independent Studios</h2>
          <p className="text-zinc-400">Distribute your film directly to millions. Keep 90% of the revenue. Get real-time cinematic analytics.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-2xl hover:bg-zinc-900 transition-colors">
            <Clapperboard className="w-8 h-8 text-white mb-6" />
            <h3 className="text-xl font-semibold mb-3">Pristine 8K Uploads</h3>
            <p className="text-zinc-400 text-sm">Upload massive ProRes files. Our cloud infrastructure transcodes instantly without quality loss.</p>
          </div>
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-2xl hover:bg-zinc-900 transition-colors">
            <BarChart3 className="w-8 h-8 text-white mb-6" />
            <h3 className="text-xl font-semibold mb-3">Granular Analytics</h3>
            <p className="text-zinc-400 text-sm">See exactly where viewers pause, rewind, or drop off. Data that helps you direct better.</p>
          </div>
          <div className="bg-zinc-900/50 border border-white/5 p-8 rounded-2xl hover:bg-zinc-900 transition-colors relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
             </div>
            <Film className="w-8 h-8 text-white mb-6" />
            <h3 className="text-xl font-semibold mb-3">Global Premiere</h3>
            <p className="text-zinc-400 text-sm">Schedule a live premiere event. Chat with your audience in real-time as the credits roll.</p>
          </div>
        </div>
      </section>

      {/* --- DEVICE COMPATIBILITY --- */}
      <section className="py-24 px-8 bg-zinc-950 border-t border-white/5">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Available on every screen.</h2>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 items-center opacity-70">
            <div className="flex flex-col items-center gap-4">
              <Tv className="w-16 h-16 text-zinc-400" />
              <span className="font-medium">Smart TV</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <MonitorPlay className="w-16 h-16 text-zinc-400" />
              <span className="font-medium">Desktop</span>
            </div>
            <div className="flex flex-col items-center gap-4">
              <Smartphone className="w-16 h-16 text-zinc-400" />
              <span className="font-medium">Mobile & Tablet</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/10 bg-black py-16 px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-6 cursor-pointer">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center">
                <Play className="w-3 h-3 text-white fill-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                AURA.
              </span>
            </div>
            <p className="text-zinc-500 text-sm">Cinematic excellence, redefining the modern streaming era.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-zinc-200">Platform</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><a href="#" className="hover:text-white transition-colors">Browse Content</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Aura Originals</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing & Plans</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-zinc-200">Creators</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><a href="#" className="hover:text-white transition-colors">Aura Studio</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Revenue Share</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-zinc-200">Legal</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Settings</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-zinc-600 text-sm">© 2026 Aura Streaming Inc. All rights reserved.</p>
          <div className="flex gap-4 text-zinc-600">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors cursor-pointer">X</div>
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-zinc-800 transition-colors cursor-pointer">In</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type AuthMode = "login" | "register";

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, googleLogin } = useAuth(); // Added googleLogin here
  const [mode, setMode] = useState<AuthMode>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        await register(email, password, name);
      }
      onClose();
    } catch (err: any) {
      let msg = err.message;
      if (err.code === "auth/invalid-credential") msg = "Invalid email or password.";
      if (err.code === "auth/email-already-in-use") msg = "Email already registered.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await googleLogin();
      onClose();
    } catch (err: any) {
      setError("Google Sign-In failed. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[400px] bg-zinc-950/90 border border-white/10 rounded-3xl p-8 shadow-[0_0_50px_rgba(220,38,38,0.15)] overflow-hidden"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-600/20 blur-[100px] rounded-full pointer-events-none" />

          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)] mb-4">
              <Play className="w-5 h-5 text-white fill-white ml-1" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Aura Network</h2>
            <p className="text-sm text-zinc-400 mt-1">
              {mode === "login" ? "Enter your credentials." : "Create your cinematic profile."}
            </p>
          </div>

          <div className="flex p-1 bg-white/5 border border-white/10 rounded-xl mb-6 relative">
            {["login", "register"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setMode(tab as AuthMode); setError(null); }}
                className={`relative w-1/2 py-2 text-sm font-semibold rounded-lg transition-colors z-10 capitalize ${mode === tab ? "text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                {mode === tab && <motion.div layoutId="modal-tab" className="absolute inset-0 bg-white/10 rounded-lg shadow-sm border border-white/5" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />}
                <span className="relative z-20">{tab}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 text-xs text-red-400 bg-red-900/20 border border-red-500/20 p-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {mode === "register" && (
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                <input required type="text" placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" />
              </div>
            )}
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
              <input required type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
              <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all" />
            </div>

            <button disabled={isLoading} type="submit" className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(220,38,38,0.2)] disabled:opacity-50 flex justify-center items-center">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === "login" ? "Authenticate" : "Create Profile"}
            </button>
          </form>

          {/* Social Logins - Added Google Button Here */}
          <div className="mt-6 relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Or bypass with</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            
            <button 
              onClick={handleGoogleSignIn} 
              disabled={isLoading} 
              type="button" 
              className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl py-3 transition-colors text-sm font-semibold text-zinc-300 hover:text-white group disabled:opacity-50"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
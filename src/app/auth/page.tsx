"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Play, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type AuthTab = "Login" | "Register";
type ToastType = { message: string; type: "success" | "error" } | null;

export default function FuturisticAuth() {
  const router = useRouter();
  const { login, register, googleLogin } = useAuth();
  
  const [activeTab, setActiveTab] = useState<AuthTab>("Login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState<ToastType>(null);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    if (type === "error") {
      setTimeout(() => setToast(null), 5000); // Auto-hide errors after 5s
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);
    setIsLoading(true);

    try {
      if (activeTab === "Login") {
        await login(email, password);
      } else {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (!username.trim()) throw new Error("Username is required.");
        await register(email, password, username);
      }
      
      // Show Green Success Toast
      showToast("Authentication successful! Redirecting...", "success");
      
      // Wait 1.5 seconds so user sees the success message, then redirect to Main Page
      setTimeout(() => {
        router.push("/"); 
      }, 1500);

    } catch (err: any) {
      let errorMessage = err.message;
      if (err.code === "auth/invalid-credential") errorMessage = "Invalid email or password.";
      if (err.code === "auth/email-already-in-use") errorMessage = "This email is already registered.";
      
      // Show Red Error Toast
      showToast(errorMessage, "error");
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setToast(null);
    setIsLoading(true);
    try {
      await googleLogin();
      showToast("Google login successful! Redirecting...", "success");
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      showToast("Google Sign-In failed. Please try again.", "error");
      setIsLoading(false);
    }
  };

  const handleTabSwitch = (tab: AuthTab) => {
    setActiveTab(tab);
    setToast(null);
    setEmail("");
    setPassword("");
    setUsername("");
  };

  return (
    <div className="flex h-[100dvh] w-full bg-black overflow-hidden font-sans text-zinc-50 selection:bg-red-900 selection:text-white relative">
      
      {/* ================= TASTY TOAST NOTIFICATION ================= */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }} 
            animate={{ opacity: 1, y: 20, scale: 1 }} 
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed top-0 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full flex items-center gap-3 shadow-2xl backdrop-blur-xl border ${
              toast.type === "success" 
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" 
                : "bg-red-500/20 border-red-500/50 text-red-400"
            }`}
          >
            {toast.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-semibold tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= LEFT PANE: CINEMATIC VISUALS ================= */}
      <div className="relative hidden lg:flex flex-col justify-between w-1/2 h-full p-12 bg-zinc-950 overflow-hidden border-r border-white/5">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-900/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-amber-900/10 blur-[150px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 z-0 mix-blend-overlay opacity-20">
          <img src="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2070&auto=format&fit=crop" alt="Space Texture" className="w-full h-full object-cover grayscale" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.3)]">
            <Play className="w-4 h-4 text-white fill-white ml-0.5" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white drop-shadow-lg">
            AURA<span className="text-amber-500">.</span>
          </span>
        </div>

        <div className="relative z-10 flex-1 flex items-center justify-center perspective-[1000px]">
          <motion.div animate={{ y: [-10, 10, -10] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} className="relative w-64 aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 origin-bottom-right -rotate-6 translate-x-12">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent z-10" />
            <img src="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover" alt="Poster 1" />
            <div className="absolute bottom-6 left-6 z-20">
              <span className="px-2 py-1 text-[10px] font-bold bg-amber-500/20 text-amber-500 rounded backdrop-blur-md mb-2 inline-block uppercase tracking-wider">Aura Original</span>
              <h3 className="font-bold text-lg leading-tight">Dark Matter</h3>
            </div>
          </motion.div>

          <motion.div animate={{ y: [10, -10, 10] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="absolute w-56 aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/50 origin-bottom-left rotate-6 -translate-x-16 translate-y-12 backdrop-blur-sm bg-black/40">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent z-10" />
            <img src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=800&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" alt="Poster 2" />
          </motion.div>
        </div>

        <div className="relative z-10">
          <p className="text-sm font-medium text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> The future of cinema
          </p>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter text-white leading-[1.1]">
            Intelligence meets <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-400 to-zinc-600">imagination.</span>
          </h1>
        </div>
      </div>

      {/* ================= RIGHT PANE: COMPACT AUTH PANEL ================= */}
      {/* Mobile fix: Reduced padding from p-6 to p-4, ensures it fits the viewport */}
      <div className="flex w-full lg:w-1/2 h-full items-center justify-center p-4 sm:p-6 relative bg-zinc-950/50 backdrop-blur-3xl">
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/10 via-zinc-950/0 to-transparent lg:hidden pointer-events-none" />

        {/* Mobile fix: Max height removed, let it compress naturally */}
        <div className="w-full max-w-[380px] relative z-10 flex flex-col justify-center">
          
          {/* Mobile Logo Header - Reduced margin */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-6 sm:mb-8 mt-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-900 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              <Play className="w-3 h-3 text-white fill-white ml-0.5" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white drop-shadow-md">
              AURA<span className="text-amber-500">.</span>
            </span>
          </div>

          <div className="mb-5 sm:mb-6 text-center lg:text-left">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Welcome to the network.</h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">Enter your credentials to access the terminal.</p>
          </div>

          <div className="flex p-1 bg-zinc-900/80 border border-white/5 rounded-xl mb-5 sm:mb-6 relative backdrop-blur-xl">
            {["Login", "Register"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleTabSwitch(tab as AuthTab)}
                className={`relative w-1/2 py-2 text-sm font-semibold rounded-lg transition-colors z-10 ${
                  activeTab === tab ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {activeTab === tab && (
                  <motion.div layoutId="auth-tab-indicator" className="absolute inset-0 bg-zinc-800 rounded-lg shadow-sm border border-white/5" transition={{ type: "spring", bounce: 0.2, duration: 0.5 }} />
                )}
                <span className="relative z-20">{tab}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <AnimatePresence mode="wait">
              {activeTab === "Login" ? (
                <motion.form key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <AuthInput icon={<Mail />} type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  <div className="space-y-2">
                    <div className="relative">
                      <AuthInput icon={<Lock />} type={showPassword ? "text" : "password"} placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <button type="button" className="text-xs font-medium text-zinc-500 hover:text-zinc-300 transition-colors">Recover password</button>
                    </div>
                  </div>
                  <SubmitButton isLoading={isLoading} text="Authenticate" />
                </motion.form>
              ) : (
                <motion.form key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <AuthInput icon={<User />} type="text" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)} />
                  <AuthInput icon={<Mail />} type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  <div className="relative">
                    <AuthInput icon={<Lock />} type={showPassword ? "text" : "password"} placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <SubmitButton isLoading={isLoading} text="Initialize Account" />
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-5 sm:mt-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-5">
              <div className="flex-1 h-px bg-white/5" />
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Or bypass with</span>
              <div className="flex-1 h-px bg-white/5" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleGoogleLogin} disabled={isLoading} type="button" className="flex items-center justify-center gap-2 bg-zinc-900 border border-white/5 hover:bg-zinc-800 rounded-xl py-2.5 transition-colors text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white group disabled:opacity-50">
                <svg className="w-4 h-4 group-hover:scale-110 transition-transform shrink-0" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>
              <button disabled type="button" className="flex items-center justify-center gap-2 bg-zinc-900/50 border border-white/5 rounded-xl py-2.5 transition-colors text-xs sm:text-sm font-semibold text-zinc-600 cursor-not-allowed group whitespace-nowrap px-1">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.15 2.95.97 3.63 2.38-3.02 1.83-2.52 6.04.58 7.32-.71 1.48-1.57 2.76-2.86 3.31zm-3.32-15.68c-.1-1.63 1.29-3.28 3.12-3.6 0 1.7-.85 3.34-3.12 3.6z"/>
                </svg>
                Apple (Soon)
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

// ==========================================
// REUSABLE UI COMPONENTS
// ==========================================

function AuthInput({ icon, type, placeholder, required, value, onChange }: { 
  icon: React.ReactNode, type: string, placeholder: string, required?: boolean, value?: string, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void 
}) {
  return (
    <div className="relative group">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors [&>svg]:w-4 [&>svg]:h-4">
        {icon}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-2.5 sm:py-3 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 focus:bg-black/50 transition-all font-medium"
      />
    </div>
  );
}

function SubmitButton({ isLoading, text }: { isLoading: boolean, text: string }) {
  return (
    <button
      type="submit"
      disabled={isLoading}
      className="relative w-full bg-red-700 text-white font-bold rounded-xl py-2.5 sm:py-3 mt-2 sm:mt-4 transition-all hover:bg-red-600 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden border border-red-500/50"
    >
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      
      <div className="flex items-center justify-center gap-2 relative z-10">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span className="text-sm">Processing...</span>
          </div>
        ) : (
          <>
            <span className="text-sm tracking-wide">{text}</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </div>
    </button>
  );
}
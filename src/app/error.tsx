"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route Error Boundary:", error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-6 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_80%_90%,rgba(245,158,11,0.12),transparent_35%)]" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-black/55 p-8 text-center shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10">
          <AlertTriangle className="h-7 w-7 text-amber-400" />
        </div>

        <h1 className="text-2xl font-black tracking-tight text-white">Playback Interrupted</h1>
        <p className="mt-3 text-sm font-medium text-zinc-300">
          A temporary runtime issue occurred. Your session is safe.
        </p>

        <button
          onClick={reset}
          className="mt-8 inline-flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-cyan-400/20"
        >
          <RotateCcw className="h-4 w-4 text-cyan-300" />
          Retry Connection
        </button>
      </motion.div>
    </div>
  );
}


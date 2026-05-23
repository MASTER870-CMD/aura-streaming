"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertOctagon, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Boundary:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="m-0 bg-[#050505] text-white antialiased">
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(239,68,68,0.14),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(34,211,238,0.14),transparent_35%)]" />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 w-full max-w-xl rounded-3xl border border-white/10 bg-black/60 p-8 text-center shadow-[0_30px_100px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
          >
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10">
              <AlertOctagon className="h-8 w-8 text-red-400" />
            </div>

            <h1 className="text-2xl font-black tracking-tight">AURA Core Recovered</h1>
            <p className="mt-3 text-sm font-medium text-zinc-300">
              A critical UI module failed to render. Restart the view to reinitialize the cinematic interface.
            </p>

            <button
              onClick={reset}
              className="mt-8 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition-all hover:bg-white/15"
            >
              <RotateCcw className="h-4 w-4 text-cyan-300" />
              Retry Connection
            </button>
          </motion.div>
        </div>
      </body>
    </html>
  );
}


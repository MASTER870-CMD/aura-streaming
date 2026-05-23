"use client";

import { motion } from "framer-motion";

function SkeletonCard({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-2xl border border-white/10 bg-zinc-950/60 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl"
    >
      <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-zinc-800/70" />
      <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-zinc-700/70" />
      <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded bg-zinc-800/70" />
    </motion.div>
  );
}

export default function Loading() {
  return (
    <div className="min-h-screen w-full overflow-hidden bg-[#050505] px-4 pb-10 pt-24 text-white sm:px-8 lg:px-16">
      <div className="mx-auto w-full max-w-[1920px]">
        <div className="mb-8">
          <div className="h-8 w-56 animate-pulse rounded bg-zinc-800/70" />
          <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded bg-zinc-900/70" />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, idx) => (
            <SkeletonCard key={idx} delay={idx * 0.02} />
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-cyan-400/15 bg-black/45 p-4 backdrop-blur-2xl">
          <div className="h-4 w-40 animate-pulse rounded bg-cyan-500/25" />
          <div className="mt-3 h-3 w-full animate-pulse rounded bg-zinc-800/70" />
          <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-zinc-900/70" />
        </div>
      </div>
    </div>
  );
}


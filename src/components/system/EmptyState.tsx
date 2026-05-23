"use client";

import { Film, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  message: string;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  message,
  title = "Nothing To Show Yet",
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="w-full rounded-3xl border border-white/10 bg-black/45 p-8 text-center text-white shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-400/25 bg-amber-500/10">
        <Film className="h-7 w-7 text-amber-400" />
      </div>
      <h3 className="text-xl font-black tracking-tight">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-zinc-300">{message}</p>

      {actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="mt-6 inline-flex items-center gap-2 rounded-xl border border-cyan-400/35 bg-cyan-400/10 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-cyan-400/20"
        >
          <RefreshCw className="h-4 w-4 text-cyan-300" />
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}


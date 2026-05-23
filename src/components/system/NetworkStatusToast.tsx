"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, WifiOff } from "lucide-react";
import { useNetwork } from "@/hooks/useNetwork";

export default function NetworkStatusToast() {
  const { isOnline, wasOffline } = useNetwork();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[9999] flex justify-center px-4">
      <AnimatePresence mode="wait">
        {!isOnline ? (
          <motion.div
            key="offline"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-red-500/30 bg-black/70 px-4 py-3 text-sm text-white shadow-[0_0_30px_rgba(239,68,68,0.2)] backdrop-blur-xl"
          >
            <WifiOff className="h-4 w-4 text-red-400" />
            <span className="font-semibold tracking-wide">You are offline. Reconnecting to AURA network...</span>
          </motion.div>
        ) : wasOffline ? (
          <motion.div
            key="online"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-cyan-400/30 bg-black/70 px-4 py-3 text-sm text-white shadow-[0_0_30px_rgba(34,211,238,0.2)] backdrop-blur-xl"
          >
            <CheckCircle2 className="h-4 w-4 text-cyan-300" />
            <span className="font-semibold tracking-wide">Connection restored. Streaming is stable.</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}


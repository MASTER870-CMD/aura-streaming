"use client";

import React, { useState, useEffect } from "react";
import { Play, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Navbar from "@/components/navbar/Navbar";

export default function OriginalsPage() {
  const router = useRouter();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOriginals() {
      try {
        const q = query(collection(db, "movies"), where("category", "==", "Original"));
        const snap = await getDocs(q);
        setMovies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchOriginals();
  }, []);

  if (loading) return <div className="h-screen bg-zinc-950 flex justify-center items-center"><Loader2 className="w-10 h-10 text-red-600 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-x-hidden">
      <Navbar />
      <main className="pt-24 sm:pt-32 px-4 md:px-12 max-w-[1800px] mx-auto pb-20">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-2 text-red-600">Aura Originals</h1>
        <p className="text-sm sm:text-base text-zinc-400 mb-8">Exclusive masterpieces created by our internal studios.</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {movies.map((movie) => (
            <div key={movie.id} onClick={() => router.push(`/watch/${movie.id}`)} className="relative w-full aspect-[3/4] rounded-lg overflow-hidden cursor-pointer group border border-white/5">
              <img src={movie.thumbnail} alt={movie.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Play className="w-12 h-12 fill-white text-white drop-shadow-xl" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
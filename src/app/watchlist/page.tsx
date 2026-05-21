"use client";

import React, { useState, useEffect } from "react";
import { Play, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/navbar/Navbar";

export default function WatchlistPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [myList, setMyList] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) { router.push("/auth"); return; }
    
    async function fetchList() {
      if (!user) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().myList) {
          setMyList(userDoc.data().myList);
        }
      } catch (error) {
        console.error("Error fetching list", error);
      } finally {
        setIsFetching(false);
      }
    }
    if (user) fetchList();
  }, [user, loading, router]);

  const removeFromList = async (movie: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    try {
      setMyList(myList.filter((m: any) => m.id !== movie.id)); // Instant UI update
      await updateDoc(doc(db, "users", user.uid), { myList: arrayRemove(movie) });
    } catch (error) { console.error(error); }
  };

  if (loading || isFetching) return <div className="h-screen bg-zinc-950 flex justify-center items-center"><Loader2 className="w-10 h-10 text-red-600 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans overflow-x-hidden">
      <Navbar />
      <main className="pt-24 sm:pt-32 px-4 md:px-12 max-w-[1800px] mx-auto pb-20">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-8">My List</h1>
        
        {myList.length === 0 ? (
          <div className="text-center py-20 border border-white/5 rounded-xl bg-zinc-900/30">
            <h2 className="text-xl font-bold text-zinc-400 mb-2">Your list is empty.</h2>
            <button onClick={() => router.push("/movies")} className="mt-4 bg-white text-black px-6 py-2 rounded-md font-bold hover:bg-zinc-200">Explore</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {myList.map((movie) => (
              <div key={movie.id} onClick={() => router.push(`/watch/${movie.id}`)} className="relative w-full aspect-video rounded-lg overflow-hidden bg-zinc-900 cursor-pointer group border border-white/5">
                <img src={movie.thumbnail} alt={movie.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:scale-110"><Play className="w-4 h-4 fill-black text-black ml-0.5" /></div>
                  <div onClick={(e) => removeFromList(movie, e)} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center hover:bg-red-500/20"><Check className="w-4 h-4 text-white" /></div>
                </div>
                <div className="absolute bottom-2 left-2 right-2"><p className="text-[10px] sm:text-xs font-bold truncate drop-shadow-md">{movie.title}</p></div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
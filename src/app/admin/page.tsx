"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";
import {
  LayoutDashboard, Film, UploadCloud, Tags, Users, Menu,
  Trash2, Eye, Clock, Image as ImageIcon, Loader2, AlertCircle, 
  Video, Plus, X, Type, Clapperboard, MonitorPlay, Search, Star, Zap, Edit,
  Link as LinkIcon, Info, Code
} from "lucide-react";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [movies, setMovies] = useState<any[]>([]);
  const [platformUsers, setPlatformUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isFetching, setIsFetching] = useState(true);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const mSnap = await getDocs(query(collection(db, "movies"), orderBy("createdAt", "desc")));
      setMovies(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const uSnap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
      setPlatformUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const cSnap = await getDocs(collection(db, "categories"));
      setCategories(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error(e); } finally { setIsFetching(false); }
  };

  useEffect(() => {
    if (!loading && !user) router.push("/");
    else if (user) fetchData();
  }, [user, loading, router]);

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-red-600 w-8 h-8" /></div>;

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-100 font-sans overflow-hidden">
      <aside className={`fixed lg:relative z-50 w-72 h-full bg-zinc-950 border-r border-white/5 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center"><Film className="w-6 h-6 text-white" /></div>
            <span className="text-2xl font-black italic text-white">AURA<span className="text-red-600">.</span></span>
          </div>
          <button className="lg:hidden p-2 text-white bg-zinc-900 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          <NavBtn icon={<LayoutDashboard/>} label="Dashboard" active={activeTab === "dashboard"} onClick={() => {setActiveTab("dashboard"); setIsMobileMenuOpen(false)}} />
          <NavBtn icon={<Film/>} label="Movies" active={activeTab === "movies"} onClick={() => {setActiveTab("movies"); setIsMobileMenuOpen(false)}} />
          <NavBtn icon={<UploadCloud/>} label="Upload Content" active={activeTab === "upload"} onClick={() => {setActiveTab("upload"); setIsMobileMenuOpen(false)}} />
          <NavBtn icon={<Tags/>} label="Categories" active={activeTab === "categories"} onClick={() => {setActiveTab("categories"); setIsMobileMenuOpen(false)}} />
          <NavBtn icon={<Users/>} label="Users" active={activeTab === "users"} onClick={() => {setActiveTab("users"); setIsMobileMenuOpen(false)}} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-16 md:h-20 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-4 md:px-6 lg:px-12 z-10">
          <button className="lg:hidden p-2 bg-zinc-900 rounded-lg text-white" onClick={() => setIsMobileMenuOpen(true)}><Menu /></button>
          <div className="flex items-center gap-4 ml-auto">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{user?.displayName || "Super Admin"}</p>
                <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Root Access</p>
             </div>
             <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white uppercase">
                {user?.displayName ? user.displayName.charAt(0) : "S"}
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === "dashboard" && <Stats movies={movies} users={platformUsers} />}
              {activeTab === "upload" && <UploadForm categories={categories} isUploading={isUploading} setIsUploading={setIsUploading} progress={uploadProgress} setProgress={setUploadProgress} error={error} setError={setError} onSuccess={() => {fetchData(); setActiveTab("movies")}} />}
              {activeTab === "movies" && <MoviesTable movies={movies} categories={categories} refresh={fetchData} isFetching={isFetching} />}
              {activeTab === "users" && <UsersTable users={platformUsers} refresh={fetchData} />}
              {activeTab === "categories" && <CategoryManager categories={categories} refresh={fetchData} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function Stats({ movies, users }: any) {
  const totalViews = movies.reduce((acc: number, curr: any) => acc + (Number(curr.views) || 0), 0);
  const totalWatchHours = users.reduce((acc: number, curr: any) => acc + (Number(curr.watchHours) || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <StatCard label="Live Movies" value={movies.length} icon={<Film/>} />
      <StatCard label="Registered Users" value={users.length} icon={<Users/>} />
      <StatCard label="Platform Views" value={totalViews} icon={<Eye/>} />
      <StatCard label="Watch Hours" value={totalWatchHours} icon={<Clock/>} />
    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-zinc-950 border border-white/5 p-6 md:p-8 rounded-2xl md:rounded-3xl relative overflow-hidden group hover:border-white/10 transition-colors">
      <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-red-600/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110" />
      <div className="flex justify-between items-center mb-4 relative z-10">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
        <div className="text-red-600">{icon}</div>
      </div>
      <p className="text-3xl md:text-4xl font-black text-white relative z-10">{value}</p>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-3 md:py-4 rounded-xl transition-all ${active ? "bg-red-600 text-white font-bold" : "text-zinc-500 hover:bg-zinc-900 hover:text-white"}`}>
      {icon} <span className="text-sm">{label}</span>
    </button>
  );
}

function MoviesTable({ movies, refresh, categories }: any) {
  const [search, setSearch] = useState("");
  const [editingMovie, setEditingMovie] = useState<any>(null);

  const filteredMovies = movies.filter((m: any) => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditChange = (e: any) => {
    setEditingMovie({ ...editingMovie, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    try {
      await updateDoc(doc(db, "movies", editingMovie.id), { ...editingMovie });
      setEditingMovie(null);
      refresh();
    } catch (e) {
      alert("Failed to update movie details.");
    }
  };

  const del = async (m: any) => {
    if(confirm(`WARNING: This will permanently delete '${m.title}' from your Database AND Google Drive (if applicable). This cannot be undone. Continue?`)) {
      try {
        if (m.driveId && m.driveId !== "uploaded_id") {
          await fetch(`/api/upload?driveId=${m.driveId}`, { method: 'DELETE' });
        }
        await deleteDoc(doc(db, "movies", m.id));
        refresh();
      } catch (err) {
        alert("Failed to delete movie fully.");
      }
    }
  };
  
  return (
    <div className="bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
      <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <h2 className="text-xl md:text-2xl font-black text-white">Content Library</h2>
        
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search movies..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-red-500 outline-none"
          />
        </div>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 p-4 md:p-0">
        <div className="md:hidden flex flex-col gap-4">
          {filteredMovies.map((m: any) => (
            <div key={m.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex flex-col gap-4">
              <div className="flex gap-4">
                <img src={m.poster || m.banner} className="w-16 h-24 rounded-lg object-cover bg-black" alt="poster" />
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-white text-sm truncate">{m.title}</h3>
                  <p className="text-xs text-zinc-400 mt-1">{m.releaseYear} • {m.duration || "N/A"}</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-black/50 rounded-md text-[10px] uppercase text-zinc-300 font-bold border border-white/5">{m.category}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingMovie(m)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"><Edit size={14}/> Edit</button>
                <button onClick={() => del(m)} className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"><Trash2 size={14}/> Delete</button>
              </div>
            </div>
          ))}
        </div>

        <table className="w-full text-left hidden md:table">
          <thead className="text-[10px] uppercase font-black text-zinc-600 bg-black/20 sticky top-0 z-10 backdrop-blur-md">
            <tr><th className="p-6">Movie</th><th className="p-6">Category</th><th className="p-6">Visibility</th><th className="p-6 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredMovies.map((m: any) => (
              <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-6 flex items-center gap-4">
                  <img src={m.poster || m.banner} className="w-12 h-16 rounded-md object-cover border border-white/10 bg-black" alt="poster" />
                  <div>
                    <p className="font-bold text-white">{m.title}</p>
                    <p className="text-xs text-zinc-500 mt-1">{m.releaseYear} • {m.duration || "N/A"}</p>
                    {m.streamType === "embed" && <span className="text-[9px] text-purple-400 font-bold mt-1 block uppercase">AnonMP4 Embed</span>}
                    {m.streamType === "link" && <span className="text-[9px] text-blue-400 font-bold mt-1 block uppercase">Direct External Link</span>}
                    {(m.streamType === "drive" || !m.streamType) && <span className="text-[9px] text-red-400 font-bold mt-1 block uppercase">Google Drive</span>}
                  </div>
                </td>
                <td className="p-6"><span className="px-3 py-1 bg-zinc-900 border border-white/5 rounded-full text-xs text-zinc-300">{m.category}</span></td>
                <td className="p-6">
                  <div className="flex gap-2">
                    {m.isFeatured && <span className="text-[10px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded uppercase border border-yellow-500/20">Featured</span>}
                    {m.isTrending && <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded uppercase border border-red-500/20">Trending</span>}
                  </div>
                </td>
                <td className="p-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditingMovie(m)} className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><Edit size={18}/></button>
                    <button onClick={() => del(m)} className="p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={18}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredMovies.length === 0 && (
           <div className="p-10 text-center text-zinc-500">No movies found matching your search.</div>
        )}
      </div>

      <AnimatePresence>
        {editingMovie && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2"><Edit className="text-red-500" size={20}/> Edit Metadata</h3>
                <button onClick={() => setEditingMovie(null)} className="text-zinc-500 hover:text-white"><X size={20}/></button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Title</label>
                  <input name="title" value={editingMovie.title} onChange={handleEditChange} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-sm text-white outline-none focus:border-red-500" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                  <select name="category" value={editingMovie.category} onChange={handleEditChange} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-sm text-white outline-none focus:border-red-500">
                    {categories.map((c:any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Stream Source Type</label>
                  <select name="streamType" value={editingMovie.streamType || "drive"} onChange={handleEditChange} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-sm text-white outline-none focus:border-red-500">
                    <option value="drive">Google Drive API</option>
                    <option value="link">Direct External URL (.m3u8 / .mp4)</option>
                    <option value="embed">AnonMP4 Iframe Embed</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    {editingMovie.streamType === "embed" ? "AnonMP4 Embed URL" : "Video URL / Drive Fallback"}
                  </label>
                  <input name="videoUrl" value={editingMovie.videoUrl || ""} onChange={handleEditChange} placeholder="Enter URL here..." className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-sm text-white outline-none focus:border-blue-500" />
                </div>

                {editingMovie.streamType === "link" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Direct Audio Stream URL (Optional)</label>
                    <input name="audioUrl" value={editingMovie.audioUrl || ""} onChange={handleEditChange} placeholder="e.g. https://s01.../a/0/0.m3u8" className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-sm text-white outline-none focus:border-blue-500" />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Short Description</label>
                  <textarea name="shortDescription" rows={3} value={editingMovie.shortDescription} onChange={handleEditChange} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-sm text-white outline-none focus:border-red-500" />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input type="checkbox" checked={editingMovie.isFeatured} onChange={(e) => setEditingMovie({...editingMovie, isFeatured: e.target.checked})} className="accent-red-600 w-4 h-4" /> Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm text-white cursor-pointer">
                    <input type="checkbox" checked={editingMovie.isTrending} onChange={(e) => setEditingMovie({...editingMovie, isTrending: e.target.checked})} className="accent-red-600 w-4 h-4" /> Trending
                  </label>
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <button onClick={() => setEditingMovie(null)} className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-sm transition-colors">Cancel</button>
                <button onClick={saveEdit} className="flex-1 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors">Save Changes</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UsersTable({ users, refresh }: any) {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const filteredUsers = users.filter((u: any) => 
    (u.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (u.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const deleteUser = async (id: string) => {
    if(confirm("Permanently delete user profile from Database?")) {
      await deleteDoc(doc(db, "users", id));
      setSelectedUser(null);
      refresh();
    }
  };

  return (
    <div className="bg-zinc-950 border border-white/5 rounded-3xl overflow-hidden flex flex-col max-h-[85vh]">
      <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <h2 className="text-xl md:text-2xl font-black text-white">Registered Users</h2>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-red-500 outline-none"
          />
        </div>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 p-4 md:p-0">
        <div className="md:hidden flex flex-col gap-4">
           {filteredUsers.map((u: any) => (
              <div key={u.id} className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 flex items-center justify-between gap-4">
                 <div className="flex items-center gap-3 overflow-hidden">
                    {u.avatar ? <img src={u.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" /> : <div className="w-10 h-10 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center text-xs font-bold shrink-0">AU</div>}
                    <div className="overflow-hidden">
                       <h3 className="font-bold text-white text-sm truncate">{u.name || "Unknown"}</h3>
                       <p className="text-xs text-zinc-400 truncate">{u.email}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedUser(u)} className="p-2 bg-white/5 rounded-lg text-zinc-300 hover:text-white shrink-0"><Eye size={16}/></button>
              </div>
           ))}
        </div>

        <table className="w-full text-left hidden md:table">
          <thead className="text-[10px] uppercase font-black text-zinc-600 bg-black/20 sticky top-0">
            <tr><th className="p-6">User</th><th className="p-6">Email</th><th className="p-6 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredUsers.map((u: any) => (
              <tr key={u.id} className="hover:bg-zinc-900 cursor-pointer transition-colors" onClick={() => setSelectedUser(u)}>
                <td className="p-6 flex items-center gap-4">
                  {u.avatar ? <img src={u.avatar} className="w-10 h-10 rounded-full object-cover border border-white/10" /> : <div className="w-10 h-10 rounded-full bg-red-600/20 flex flex-col items-center justify-center text-[8px] font-bold text-red-500 uppercase text-center leading-tight">Aura</div>}
                  <p className="font-bold text-white">{u.name || "Unknown"}</p>
                </td>
                <td className="p-6 text-sm text-zinc-400">{u.email}</td>
                <td className="p-6 text-right"><span className="text-xs text-red-500 hover:text-white border border-red-500/20 bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors">View Profile</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="max-w-xl w-full bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 overflow-y-auto max-h-[90vh] custom-scrollbar" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4 md:gap-6">
                  {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-red-600" /> : <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-zinc-900 border-2 border-zinc-800 flex items-center justify-center text-zinc-500 font-bold">User</div>}
                  <div>
                    <h2 className="text-xl md:text-2xl font-black text-white">{selectedUser.name || "No Name Provided"}</h2>
                    <p className="text-zinc-500 text-sm">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600 transition-colors"><X size={18}/></button>
              </div>

              <div className="space-y-4 mb-8">
                <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest border-b border-white/10 pb-2">Database Record</h3>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {Object.entries(selectedUser).map(([key, value]) => {
                    if (key === 'avatar' || typeof value === 'object') return null;
                    return (
                      <div key={key} className="bg-black/50 p-3 rounded-xl border border-white/5">
                        <p className="text-[9px] text-zinc-500 font-bold uppercase mb-1 truncate">{key}</p>
                        <p className="text-xs text-white font-medium break-words line-clamp-2">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button onClick={() => deleteUser(selectedUser.id)} className="w-full py-3 md:py-4 bg-red-600/10 text-red-500 border border-red-500/20 font-bold rounded-xl hover:bg-red-600 hover:text-white transition-colors flex justify-center items-center gap-2"><Trash2 size={18}/> Permanently Delete User</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UploadForm({ categories, isUploading, setIsUploading, progress, setProgress, error, setError, onSuccess }: any) {
  // CRITICAL FEATURE: TRI-MODE UPLOAD (Drive, Link, Embed)
  const [uploadMode, setUploadMode] = useState<"drive" | "link" | "embed">("drive");
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [poster, setPoster] = useState<string>("");
  const [banner, setBanner] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "", slug: "", category: "", language: "", releaseYear: "",
    duration: "", quality: "1080p", shortDescription: "", fullDescription: "",
    seoTitle: "", seoDescription: "", seoKeywords: "", cast: "", director: "",
    trailerUrl: "", videoUrl: "", audioUrl: "", isFeatured: false, isTrending: false
  });

  useEffect(() => {
    if (formData.title && !formData.slug) {
      setFormData(prev => ({ ...prev, slug: formData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') }));
    }
  }, [formData.title]);

  useEffect(() => {
    if (categories && categories.length > 0 && formData.category === "") {
      setFormData(prev => ({ ...prev, category: categories[0].name }));
    }
  }, [categories, formData.category]);

  const handleChange = (e: any) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleToggle = (name: string) => setFormData(prev => ({ ...prev, [name]: !(prev as any)[name] }));
  const handleVideoFile = (e: any) => { if (e.target.files?.[0]) setVideoFile(e.target.files[0]); setError(null); };

  const handleImage = async (e: any, type: "poster" | "banner") => {
    const f = e.target.files?.[0];
    if (!f) return;
    const comp = await imageCompression(f, { maxSizeMB: 0.8, maxWidthOrHeight: type === "banner" ? 1920 : 1080 });
    const reader = new FileReader();
    reader.readAsDataURL(comp);
    reader.onload = () => type === "poster" ? setPoster(reader.result as string) : setBanner(reader.result as string);
  };

  const upload = async () => {
    if (uploadMode === "drive" && !videoFile) return setError("Please select a video file for Drive upload.");
    if (uploadMode === "link" && !formData.videoUrl) return setError("Please provide a direct external video URL.");
    if (uploadMode === "embed" && !formData.videoUrl) return setError("Please provide an AnonMP4 embed URL.");
    if (!formData.title || !poster || !formData.category) return setError("Missing required fields (Title, Category, Poster).");

    setIsUploading(true); setProgress(0); setError(null);

    try {
      let finalDriveId = null;

      if (uploadMode === "drive") {
        const initRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formData.title, description: formData.shortDescription || "Aura Admin",
            mimeType: videoFile!.type || "video/mp4", size: videoFile!.size
          })
        });

        if (!initRes.ok) throw new Error("Failed to initialize Google Drive session.");
        const { uploadUrl } = await initRes.json();
        if (!uploadUrl) throw new Error("No secure upload URL returned.");

        const CHUNK_SIZE = 10 * 1024 * 1024; 
        let start = 0;
        let driveResponseData = null;

        while (start < videoFile!.size) {
          const end = Math.min(start + CHUNK_SIZE, videoFile!.size);
          const chunk = videoFile!.slice(start, end);
          const chunkStartOffset = start;

          const uploadChunkWithRetry = () => new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open("PUT", uploadUrl, true);
              xhr.setRequestHeader("Content-Range", `bytes ${chunkStartOffset}-${end - 1}/${videoFile!.size}`);
              xhr.setRequestHeader("Content-Type", videoFile!.type || "video/mp4");
              xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.min(Math.round(((chunkStartOffset + e.loaded) / videoFile!.size) * 100), 99)); };
              xhr.onload = () => (xhr.status === 308 || xhr.status === 200 || xhr.status === 201) ? resolve(xhr.responseText) : reject(new Error(`Server error: ${xhr.status}`));
              xhr.onerror = () => reject(new Error("Stream connection reset midway."));
              xhr.send(chunk);
            });

          const responseText = await uploadChunkWithRetry() as string;
          if (end === videoFile!.size && responseText) { try { driveResponseData = JSON.parse(responseText); } catch (_) {} }
          start = end;
        }
        finalDriveId = driveResponseData?.id || "uploaded_id";
      }

      // Save to Firestore, appending streamType so the frontend knows how to render it
      await addDoc(collection(db, "movies"), { 
        ...formData, 
        driveId: finalDriveId, 
        videoUrl: (uploadMode === "link" || uploadMode === "embed") ? formData.videoUrl : null,
        audioUrl: uploadMode === "link" ? formData.audioUrl : null,
        streamType: uploadMode, // Critical: 'drive', 'link', or 'embed'
        poster, 
        banner: banner || poster, 
        status: "Published", 
        views: 0, 
        createdAt: serverTimestamp() 
      });

      setProgress(100); setIsUploading(false); onSuccess();

    } catch (err: any) { setError(`Process Failed: ${err.message}`); setIsUploading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto pb-24">
      <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">Content Ingestion</h1>
          <p className="text-xs md:text-sm text-zinc-500 mt-1 md:mt-2">Upload master files or bind external URLs.</p>
        </div>
        <button onClick={upload} disabled={isUploading} className="w-full md:w-auto px-6 py-3 md:px-8 md:py-4 bg-red-600 text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
          {isUploading ? <><Loader2 className="animate-spin" size={18}/> {progress}%</> : <><UploadCloud size={18}/> Publish Movie</>}
        </button>
      </div>

      <AnimatePresence>
        {error && <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}} className="mb-6 p-4 bg-red-600/10 border border-red-600/40 text-red-500 rounded-xl flex items-start gap-3 text-xs md:text-sm font-bold"><AlertCircle size={18} className="shrink-0 mt-0.5"/><p>{error}</p></motion.div>}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-8 space-y-6 md:space-y-8">
          
          {/* TRI-MODE TOGGLE */}
          <div className="flex bg-zinc-900 border border-white/5 rounded-xl p-1 w-full shadow-inner flex-col md:flex-row">
            <button onClick={() => setUploadMode("drive")} className={`flex-1 py-3 text-[10px] md:text-xs font-black rounded-lg transition-all uppercase tracking-widest ${uploadMode === "drive" ? "bg-red-600 text-white shadow-lg" : "text-zinc-500 hover:text-white"}`}>Drive Upload</button>
            <button onClick={() => setUploadMode("link")} className={`flex-1 py-3 text-[10px] md:text-xs font-black rounded-lg transition-all uppercase tracking-widest ${uploadMode === "link" ? "bg-blue-600 text-white shadow-lg" : "text-zinc-500 hover:text-white"}`}>Direct Link</button>
            <button onClick={() => setUploadMode("embed")} className={`flex-1 py-3 text-[10px] md:text-xs font-black rounded-lg transition-all uppercase tracking-widest ${uploadMode === "embed" ? "bg-purple-600 text-white shadow-lg" : "text-zinc-500 hover:text-white"}`}>AnonMP4 Embed</button>
          </div>

          <SectionBlock title={uploadMode === "drive" ? "Master File (Google Drive)" : uploadMode === "embed" ? "AnonMP4 Iframe Embed" : "Direct External Stream"} icon={uploadMode === "drive" ? <Video/> : uploadMode === "embed" ? <Code/> : <LinkIcon/>}>
            {uploadMode === "drive" ? (
              <div className={`p-8 md:p-12 border-2 border-dashed rounded-2xl md:rounded-[30px] flex flex-col items-center justify-center transition-all ${isUploading ? 'border-red-600 bg-red-600/5' : 'border-white/10 bg-black/40 hover:border-red-600/50'}`}>
                {isUploading ? (
                  <div className="text-center space-y-4 w-full max-w-md">
                    <p className="text-4xl md:text-6xl font-black text-white">{progress}%</p>
                    <div className="w-full h-2 md:h-3 bg-zinc-900 rounded-full overflow-hidden"><motion.div className="h-full bg-red-600" initial={{width: 0}} animate={{width: `${progress}%`}} /></div>
                    <p className="font-bold text-red-500 uppercase tracking-widest text-[8px] md:text-[10px]">Processing...</p>
                  </div>
                ) : (
                  <label className="cursor-pointer text-center group w-full">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-600 transition-colors"><UploadCloud className="w-8 h-8 md:w-10 md:h-10 text-zinc-500 group-hover:text-white transition-colors" /></div>
                    <p className="text-lg md:text-xl font-black text-white">{videoFile ? videoFile.name : "Select Video"}</p>
                    <p className="text-[10px] md:text-xs text-zinc-500 mt-2">{videoFile ? `${(videoFile.size/(1024*1024)).toFixed(2)} MB` : "MP4 Highly Recommended"}</p>
                    <input type="file" className="hidden" onChange={handleVideoFile} accept="video/mp4,video/*" disabled={isUploading} />
                  </label>
                )}
              </div>
            ) : uploadMode === "link" ? (
              <div className="space-y-6">
                 <InputField label="Direct Video Stream URL (.m3u8, .mp4) *" name="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="e.g. https://s01.nm-cdn30.top/files/movie/1080p.m3u8" />
                 
                 <div className="space-y-1 md:space-y-2 w-full">
                   <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Direct Audio Stream URL (.m3u8) (Optional)</label>
                   <input className="w-full bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl outline-none focus:border-blue-600 text-sm md:text-base text-white transition-colors" name="audioUrl" value={formData.audioUrl} onChange={handleChange} placeholder="e.g. https://s01.nm-cdn30.top/files/movie/a/0/0.m3u8" />
                 </div>

                 <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-4">
                   <Info className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
                   <p className="text-xs md:text-sm text-blue-200 font-medium leading-relaxed">
                     If the CDN separates video and audio, provide BOTH links above. The player will automatically bind them together using a generated Master Playlist.
                   </p>
                 </div>
              </div>
            ) : (
              <div className="space-y-6">
                 <InputField label="AnonMP4 Embed URL *" name="videoUrl" value={formData.videoUrl} onChange={handleChange} placeholder="e.g. https://anonmp4.com/e/XXXXXX" />
                 
                 <div className="p-5 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-start gap-4">
                   <Code className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
                   <p className="text-xs md:text-sm text-purple-200 font-medium leading-relaxed">
                     By selecting this option, the frontend will automatically swap your custom video player for an <b>iframe</b> embed. This bypasses all bandwidth and auth issues.
                   </p>
                 </div>
              </div>
            )}
          </SectionBlock>

          <SectionBlock title="Core Details" icon={<Type/>}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              <InputField label="Movie Title *" name="title" value={formData.title} onChange={handleChange} />
              <InputField label="Slug URL *" name="slug" value={formData.slug} onChange={handleChange} />
              <div className="space-y-2"><label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Category *</label><select name="category" value={formData.category} onChange={handleChange} className="w-full bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl outline-none focus:border-red-600 text-sm md:text-base text-white">{categories.length === 0 ? <option>Loading...</option> : categories.map((c:any) => <option key={c.id} value={c.name}>{c.name}</option>)}</select></div>
              <div className="space-y-2"><label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Quality</label><select name="quality" value={formData.quality} onChange={handleChange} className="w-full bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl outline-none focus:border-red-600 text-sm md:text-base text-white"><option>4K UHD</option><option>1080p FHD</option><option>720p HD</option></select></div>
              <InputField label="Language" name="language" value={formData.language} onChange={handleChange} placeholder="e.g. English" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Release Year" name="releaseYear" type="number" value={formData.releaseYear} onChange={handleChange} />
                <InputField label="Duration" name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 2h 15m" />
              </div>
            </div>
            <div className="mt-4 md:mt-6 space-y-4 md:space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Short Synopsis</label>
                <textarea rows={2} name="shortDescription" value={formData.shortDescription} onChange={handleChange} className="w-full bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl outline-none focus:border-red-600 text-sm md:text-base text-white resize-none" placeholder="Brief summary..." />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Full Description</label>
                <textarea rows={4} name="fullDescription" value={formData.fullDescription} onChange={handleChange} className="w-full bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl outline-none focus:border-red-600 text-sm md:text-base text-white resize-none" placeholder="Complete movie plot..." />
              </div>
            </div>
          </SectionBlock>

          <SectionBlock title="Cast & Crew" icon={<Clapperboard/>}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <InputField label="Director" name="director" value={formData.director} onChange={handleChange} placeholder="e.g. Christopher Nolan" />
              <InputField label="Trailer URL" name="trailerUrl" value={formData.trailerUrl} onChange={handleChange} placeholder="YouTube embed URL" />
              <div className="md:col-span-2">
                <InputField label="Cast (Comma Separated)" name="cast" value={formData.cast} onChange={handleChange} placeholder="Leonardo DiCaprio, Tom Hardy..." />
              </div>
            </div>
          </SectionBlock>

          <SectionBlock title="SEO Engine" icon={<Search/>}>
            <div className="grid grid-cols-1 gap-4 md:gap-6">
              <InputField label="SEO Title" name="seoTitle" value={formData.seoTitle} onChange={handleChange} placeholder="Title for Search Engines" />
              <InputField label="SEO Keywords" name="seoKeywords" value={formData.seoKeywords} onChange={handleChange} placeholder="action, thriller, heist, movies" />
              <div className="space-y-1 md:space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">SEO Meta Description</label>
                <textarea rows={2} name="seoDescription" value={formData.seoDescription} onChange={handleChange} placeholder="Meta description for crawlers..." className="w-full bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl outline-none focus:border-red-600 text-sm md:text-base text-white resize-none" />
              </div>
            </div>
          </SectionBlock>

        </div>

        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          <SectionBlock title="Artwork" icon={<ImageIcon/>}>
            <div className="space-y-4 md:space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Poster Art (2:3) *</label>
                <label className="block aspect-[2/3] bg-black/40 border border-white/5 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer relative group">
                  {poster ? <img src={poster} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 group-hover:text-red-500"><Plus size={24}/></div>}
                  <input type="file" className="hidden" onChange={(e) => handleImage(e, 'poster')} accept="image/*" />
                </label>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Banner (16:9)</label>
                <label className="block aspect-[16/9] bg-black/40 border border-white/5 rounded-xl md:rounded-2xl overflow-hidden cursor-pointer relative group">
                  {banner ? <img src={banner} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700 group-hover:text-red-500"><MonitorPlay size={24}/></div>}
                  <input type="file" className="hidden" onChange={(e) => handleImage(e, 'banner')} accept="image/*" />
                </label>
              </div>
            </div>
          </SectionBlock>

          <SectionBlock title="Visibility" icon={<Eye/>}>
            <div className="space-y-3 md:space-y-4">
              <ToggleSwitch label="Featured Movie" description="Top hero slider" checked={formData.isFeatured} onChange={() => handleToggle('isFeatured')} icon={<Star size={14}/>} />
              <ToggleSwitch label="Trending Now" description="Trending section" checked={formData.isTrending} onChange={() => handleToggle('isTrending')} icon={<Zap size={14}/>} />
            </div>
          </SectionBlock>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ title, icon, children }: any) {
  return (
    <div className="bg-zinc-950 border border-white/5 rounded-2xl md:rounded-[30px] p-5 md:p-8">
      <div className="flex items-center gap-3 mb-4 md:mb-6 border-b border-white/5 pb-3 md:pb-4">
        <div className="text-red-600">{icon}</div><h2 className="text-base md:text-lg font-black text-white">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InputField({ label, ...props }: any) {
  return (
    <div className="space-y-1 md:space-y-2 w-full">
      <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</label>
      <input className="w-full bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl outline-none focus:border-red-600 text-sm md:text-base text-white transition-colors" {...props} />
    </div>
  );
}

function ToggleSwitch({ label, description, checked, onChange, icon }: any) {
  return (
    <div className="flex items-center justify-between p-3 md:p-4 bg-black/40 border border-white/5 rounded-xl cursor-pointer hover:border-white/10" onClick={onChange}>
      <div className="flex items-center gap-2 md:gap-3">
        <div className={`p-1.5 md:p-2 rounded-lg ${checked ? 'bg-red-600/20 text-red-500' : 'bg-zinc-900 text-zinc-500'}`}>{icon}</div>
        <div><p className="text-xs md:text-sm font-bold text-white">{label}</p><p className="text-[8px] md:text-[10px] text-zinc-500">{description}</p></div>
      </div>
      <div className={`w-10 h-5 md:w-12 md:h-6 rounded-full p-1 transition-colors duration-300 ${checked ? 'bg-red-600' : 'bg-zinc-800'}`}>
        <motion.div layout className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-full" animate={{ x: checked ? (window.innerWidth < 768 ? 20 : 24) : 0 }} />
      </div>
    </div>
  );
}

function CategoryManager({ categories, refresh }: any) {
  const [n, setN] = useState("");
  const add = async () => { if(!n) return; await addDoc(collection(db,"categories"), {name:n}); setN(""); refresh(); };
  return (
    <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">
      <div className="p-6 md:p-8 bg-zinc-950 border border-white/5 rounded-2xl md:rounded-[30px]">
        <h2 className="text-xl md:text-2xl font-black text-white mb-4 md:mb-6">Create Category</h2>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
          <input value={n} onChange={e=>setN(e.target.value)} placeholder="e.g. Sci-Fi" className="flex-1 bg-black/40 border border-white/5 p-3 md:p-4 rounded-xl text-white outline-none focus:border-red-600 text-sm md:text-base" />
          <button onClick={add} className="px-6 py-3 md:px-8 md:py-4 bg-red-600 text-white rounded-xl font-bold flex justify-center items-center gap-2"><Plus size={18}/> Add</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {categories.map((c:any)=>(
          <div key={c.id} className="p-4 md:p-6 bg-zinc-950 border border-white/5 rounded-xl md:rounded-2xl flex justify-between items-center group">
            <span className="text-white font-bold text-sm md:text-base">{c.name}</span>
            <button onClick={async()=>{if(confirm("Delete Category?")) { await deleteDoc(doc(db,"categories",c.id)); refresh();}}} className="text-zinc-600 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
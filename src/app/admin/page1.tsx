"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import imageCompression from "browser-image-compression";
import {
  LayoutDashboard, Film, UploadCloud, Tags, Users, Menu,
  CheckCircle2, Trash2, Eye, Clock, Image as ImageIcon, 
  Loader2, AlertCircle, Video, HardDrive, Plus, X, Search
} from "lucide-react";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from "firebase/firestore";
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

  // Upload States
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

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-red-600" /></div>;

  return (
    <div className="flex h-screen bg-[#050505] text-zinc-100 font-sans overflow-hidden">
      
      {/* MOBILE RESPONSIVE SIDEBAR WITH FIXED CLOSE BUTTON */}
      <aside className={`fixed lg:relative z-50 w-72 h-full bg-zinc-950 border-r border-white/5 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center"><Film className="w-6 h-6 text-white" /></div>
            <span className="text-2xl font-black italic text-white">AURA<span className="text-red-600">.</span></span>
          </div>
          {/* FIXED CLOSE BUTTON HERE */}
          <button className="lg:hidden p-2 text-white bg-zinc-900 rounded-lg" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
          <NavBtn icon={<LayoutDashboard/>} label="Dashboard" active={activeTab === "dashboard"} onClick={() => {setActiveTab("dashboard"); setIsMobileMenuOpen(false)}} />
          <NavBtn icon={<Film/>} label="Movies" active={activeTab === "movies"} onClick={() => {setActiveTab("movies"); setIsMobileMenuOpen(false)}} />
          <NavBtn icon={<UploadCloud/>} label="Upload Content" active={activeTab === "upload"} onClick={() => {setActiveTab("upload"); setIsMobileMenuOpen(false)}} />
          <NavBtn icon={<Tags/>} label="Categories" active={activeTab === "categories"} onClick={() => {setActiveTab("categories"); setIsMobileMenuOpen(false)}} />
          <NavBtn icon={<Users/>} label="Users" active={activeTab === "users"} onClick={() => {setActiveTab("users"); setIsMobileMenuOpen(false)}} />
        </nav>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 lg:px-12">
          <button className="lg:hidden p-2 bg-zinc-900 rounded-lg text-white" onClick={() => setIsMobileMenuOpen(true)}><Menu /></button>
          <div className="flex items-center gap-4 ml-auto">
             <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white">{user?.displayName || "Super Admin"}</p>
                <p className="text-[10px] text-red-500 font-black uppercase">Root Access</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white">S</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {activeTab === "dashboard" && <Stats movies={movies} users={platformUsers} />}
              {activeTab === "upload" && (
                <UploadForm categories={categories} isUploading={isUploading} setIsUploading={setIsUploading} progress={uploadProgress} setProgress={setUploadProgress} error={error} setError={setError} onSuccess={() => {fetchData(); setActiveTab("movies")}} />
              )}
              {activeTab === "movies" && <MoviesTable movies={movies} refresh={fetchData} isFetching={isFetching} />}
              {activeTab === "users" && <UsersTable users={platformUsers} refresh={fetchData} />}
              {activeTab === "categories" && <CategoryManager categories={categories} refresh={fetchData} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ----------------------------------------------------------------------
// 100% REAL DATA STATS (NO FAKE NUMBERS)
// ----------------------------------------------------------------------
function Stats({ movies, users }: any) {
  // Calculate real total views across all movies
  const totalViews = movies.reduce((acc: number, curr: any) => acc + (Number(curr.views) || 0), 0);
  // Calculate real total watch hours across all users
  const totalWatchHours = users.reduce((acc: number, curr: any) => acc + (Number(curr.watchHours) || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard label="Live Movies" value={movies.length} icon={<Film/>} />
      <StatCard label="Registered Users" value={users.length} icon={<Users/>} />
      <StatCard label="Total Platform Views" value={totalViews} icon={<Eye/>} />
      <StatCard label="Total Watch Hours" value={totalWatchHours} icon={<Clock/>} />
    </div>
  );
}

function StatCard({ label, value, icon }: any) {
  return (
    <div className="bg-zinc-950 border border-white/5 p-8 rounded-3xl">
      <div className="flex justify-between items-center mb-4">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
        <div className="text-red-600">{icon}</div>
      </div>
      <p className="text-4xl font-black text-white">{value}</p>
    </div>
  );
}

function NavBtn({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${active ? "bg-red-600 text-white font-bold" : "text-zinc-500 hover:bg-zinc-900 hover:text-white"}`}>
      {icon} <span className="text-sm">{label}</span>
    </button>
  );
}

// ----------------------------------------------------------------------
// UPLOAD FORM WITH NEW DESCRIPTION FIELD
// ----------------------------------------------------------------------
function UploadForm({ categories, isUploading, setIsUploading, progress, setProgress, error, setError, onSuccess }: any) {
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // NEW FIELD
  const [cat, setCat] = useState(categories[0]?.name || "");

  const handleThumb = async (e: any) => {
    const f = e.target.files[0];
    if (!f) return;
    const comp = await imageCompression(f, { maxSizeMB: 0.4, maxWidthOrHeight: 1280 });
    const reader = new FileReader();
    reader.readAsDataURL(comp);
    reader.onload = () => setThumb(reader.result as string);
  };

  const upload = async () => {
    if (!file || !title || !thumb || !description) return setError("Please fill all cinematic metadata (including Description).");
    setIsUploading(true); setProgress(0); setError(null);

    const fd = new FormData();
    fd.append("video", file);
    fd.append("title", title);
    fd.append("description", description); // SENDING DESCRIPTION

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload", true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = async () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        await addDoc(collection(db, "movies"), {
          title, description, category: cat, driveId: res.fileId, thumbnail: thumb,
          status: "Published", views: 0, createdAt: serverTimestamp()
        });
        setIsUploading(false); onSuccess();
      } else {
        setError(`Upload Failed: ${JSON.parse(xhr.responseText).error || xhr.statusText}`);
        setIsUploading(false);
      }
    };
    xhr.onerror = () => { setError("Network Disconnect."); setIsUploading(false); };
    xhr.send(fd);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <h1 className="text-4xl font-black text-white">Real-Time Ingestion</h1>
      {error && <div className="p-5 bg-red-600/10 border border-red-600/40 text-red-500 rounded-2xl flex items-center gap-3 text-sm"><AlertCircle size={18}/> {error}</div>}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-16 border-2 border-dashed rounded-[40px] flex flex-col items-center justify-center transition-all ${isUploading ? 'border-red-600 bg-red-600/5' : 'border-white/10 bg-zinc-950 hover:border-red-600'}`}>
            {isUploading ? (
              <div className="text-center space-y-4">
                <p className="text-5xl font-black text-white">{progress}%</p>
                <p className="font-bold text-red-600 uppercase tracking-widest text-xs">Uploading to Google Drive Master...</p>
              </div>
            ) : (
              <label className="cursor-pointer text-center">
                <Video className="w-20 h-20 mx-auto mb-4 text-zinc-800 hover:text-red-600 transition-colors" />
                <p className="text-xl font-black text-white">{file ? file.name : "Select Master File"}</p>
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files![0])} accept="video/*" />
              </label>
            )}
          </div>
          
          <input type="text" placeholder="Cinematic Title" value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-zinc-950 border border-white/5 p-6 rounded-2xl outline-none focus:border-red-600 text-white" />
          <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full bg-zinc-950 border border-white/5 p-6 rounded-2xl outline-none text-zinc-400">
             {categories.map((c:any) => <option key={c.id}>{c.name}</option>)}
          </select>
          {/* NEW DESCRIPTION FIELD */}
          <textarea rows={4} placeholder="Movie Description / Synopsis..." value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-zinc-950 border border-white/5 p-6 rounded-2xl outline-none focus:border-red-600 text-white resize-none" />
        </div>

        <div className="space-y-6">
          <label className="block aspect-[16/9] bg-zinc-950 border border-white/5 rounded-[30px] overflow-hidden cursor-pointer hover:border-red-600 transition-all">
             {thumb ? <img src={thumb} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800"><ImageIcon size={48}/><span className="text-xs mt-2 font-bold uppercase">Poster Art</span></div>}
             <input type="file" className="hidden" onChange={handleThumb} accept="image/*" />
          </label>
          <button onClick={upload} disabled={isUploading} className="w-full py-6 bg-red-600 text-white rounded-[30px] font-black uppercase hover:bg-red-700 disabled:opacity-20 transition-all">
            {isUploading ? "Uploading..." : "Publish to Aura"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 100% REAL USER PROFILE TABLE & MODAL
// ----------------------------------------------------------------------
function UsersTable({ users, refresh }: any) {
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const deleteUser = async (id: string) => {
    if(confirm("Permanently delete user profile from Database?")) {
      await deleteDoc(doc(db, "users", id));
      setSelectedUser(null);
      refresh();
    }
  };

  return (
    <div className="bg-zinc-950 border border-white/5 rounded-[40px] overflow-hidden">
      <div className="p-8 border-b border-white/5"><h2 className="text-2xl font-black text-white">Registered Users</h2></div>
      <table className="w-full text-left">
        <thead className="text-[10px] uppercase font-black text-zinc-600 bg-black/20">
          <tr><th className="p-6">User</th><th className="p-6">Email</th><th className="p-6 text-right">Action</th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users.map((u: any) => (
            <tr key={u.id} className="hover:bg-zinc-900 cursor-pointer" onClick={() => setSelectedUser(u)}>
              <td className="p-6 flex items-center gap-4">
                {/* Fallback Image Logic */}
                {u.avatar ? (
                  <img src={u.avatar} className="w-10 h-10 rounded-full object-cover border border-red-600" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-red-600/20 flex flex-col items-center justify-center text-[8px] font-bold text-red-500 uppercase text-center leading-tight">Aura<br/>User</div>
                )}
                <p className="font-bold text-white">{u.name || "Unknown"}</p>
              </td>
              <td className="p-6 text-sm text-zinc-400">{u.email}</td>
              <td className="p-6 text-right"><span className="text-xs text-red-500 hover:text-white underline">View Profile</span></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* FULL REAL PROFILE MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setSelectedUser(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="max-w-2xl w-full bg-zinc-950 border border-white/10 rounded-[40px] p-10 overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-6">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} className="w-24 h-24 rounded-full object-cover border-4 border-red-600" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-zinc-900 border-4 border-zinc-800 flex flex-col items-center justify-center text-zinc-500 font-bold uppercase tracking-widest text-center leading-tight">Aura<br/>User</div>
                  )}
                  <div>
                    <h2 className="text-3xl font-black text-white">{selectedUser.name || "No Name Provided"}</h2>
                    <p className="text-zinc-500">{selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedUser(null)} className="p-2 bg-zinc-900 rounded-full text-white hover:bg-red-600"><X size={20}/></button>
              </div>

              {/* DYNAMIC REAL DATA MAP: Shows literally everything stored in the DB for this user */}
              <div className="space-y-4 mb-8">
                <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest border-b border-white/10 pb-2">Full Database Record</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(selectedUser).map(([key, value]) => {
                    // Filter out massive objects or avatars for clean display
                    if (key === 'avatar' || typeof value === 'object') return null;
                    return (
                      <div key={key} className="bg-black/50 p-4 rounded-xl border border-white/5">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">{key}</p>
                        <p className="text-sm text-white font-medium break-words">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => deleteUser(selectedUser.id)} className="w-full py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors flex justify-center items-center gap-2"><Trash2 size={18}/> Delete User Record</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MoviesTable({ movies, refresh }: any) {
  const del = async (id: string) => { if(confirm("Delete?")) { await deleteDoc(doc(db, "movies", id)); refresh(); } };
  return (
    <div className="bg-zinc-950 border border-white/5 rounded-[40px] overflow-hidden">
      <div className="p-8 border-b border-white/5"><h2 className="text-2xl font-black text-white">Content Library</h2></div>
      <table className="w-full text-left">
        <thead className="text-[10px] uppercase font-black text-zinc-600 bg-black/20">
          <tr><th className="p-6">Movie</th><th className="p-6">Description</th><th className="p-6 text-right">Delete</th></tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {movies.map((m: any) => (
            <tr key={m.id} className="hover:bg-white/[0.02]">
              <td className="p-6 flex items-center gap-4"><img src={m.thumbnail} className="w-20 rounded-md object-cover" /><p className="font-bold">{m.title}</p></td>
              <td className="p-6 text-sm text-zinc-400 max-w-xs truncate">{m.description || "No description"}</td>
              <td className="p-6 text-right"><button onClick={()=>del(m.id)} className="text-red-500"><Trash2 size={18}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryManager({ categories, refresh }: any) {
  const [n, setN] = useState("");
  const add = async () => { if(!n) return; await addDoc(collection(db,"categories"), {name:n}); setN(""); refresh(); };
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex gap-4">
        <input value={n} onChange={e=>setN(e.target.value)} placeholder="New Genre..." className="flex-1 bg-zinc-950 border border-white/5 p-6 rounded-2xl outline-none text-white" />
        <button onClick={add} className="px-8 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700"><Plus/></button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {categories.map((c:any)=>(
          <div key={c.id} className="p-6 bg-zinc-950 border border-white/5 rounded-2xl flex justify-between items-center text-white font-bold">
            {c.name}
            <button onClick={async()=>{await deleteDoc(doc(db,"categories",c.id)); refresh();}} className="text-red-600"><Trash2 size={16}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}
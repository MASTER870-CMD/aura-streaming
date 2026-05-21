"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  User as FirebaseUser
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { getUserProfile, createUserProfile, UserProfile } from "@/services/user.service";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (e: string, p: string) => Promise<void>;
  register: (e: string, p: string, n: string) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: () => Promise<void>; // Added back!
  refreshProfile: () => Promise<void>;
}

// FIX: Added 'export' so your useAuth.ts hook can read it properly
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const profile = await getUserProfile(uid);
      setUserProfile(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await fetchProfile(currentUser.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const register = async (email: string, pass: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await createUserProfile(cred.user.uid, {
      name,
      username: name.toLowerCase().replace(/\s+/g, ""),
      email,
      bio: "Cinephile exploring the Aura network.",
      avatar: "",
      favoriteGenre: "Sci-Fi",
      preferredLanguage: "English",
    });
    await fetchProfile(cred.user.uid);
  };

  // FIX: Added Google Login logic back and connected it to Firestore user profiles
  const googleLogin = async () => {
    const cred = await signInWithPopup(auth, googleProvider);
    
    // Check if they already have an Aura profile, if not, create one automatically
    const existingProfile = await getUserProfile(cred.user.uid);
    if (!existingProfile) {
      await createUserProfile(cred.user.uid, {
        name: cred.user.displayName || "Aura User",
        username: (cred.user.displayName || "user").toLowerCase().replace(/\s+/g, "") + Math.floor(Math.random() * 1000),
        email: cred.user.email || "",
        bio: "Cinephile exploring the Aura network.",
        avatar: cred.user.photoURL || "",
        favoriteGenre: "Sci-Fi",
        preferredLanguage: "English",
      });
    }
    await fetchProfile(cred.user.uid);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, login, register, logout, googleLogin, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
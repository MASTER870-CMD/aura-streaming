import { doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  name: string;
  username: string;
  email: string;
  bio: string;
  avatar: string;
  favoriteGenre: string;
  preferredLanguage: string;
  membershipDate: string;
  subscriptionPlan: string;
  watchHours: number;
  watchStreak: number;
  aiAccuracy: number;
  notificationsEnabled: boolean;
  autoplayEnabled: boolean;
  smartRecommendations: boolean;
  streaming4k: boolean;
  watchlist?: string[]; // Added Watchlist Array
  createdAt: any;
  updatedAt: any;
}

// Config for Cloudinary (if you are still using it for avatars)
const CLOUDINARY_CLOUD_NAME = "your_cloud_name"; 
const CLOUDINARY_UPLOAD_PRESET = "aura_uploads";

export const uploadAvatar = async (uid: string, file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) throw new Error("Image upload failed");

  const data = await response.json();
  const imageUrl = data.secure_url;

  await updateUserProfile(uid, { avatar: imageUrl });
  return imageUrl;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) return docSnap.data() as UserProfile;
  return null;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const createUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  const docRef = doc(db, "users", uid);
  await setDoc(docRef, {
    ...data,
    uid,
    membershipDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    subscriptionPlan: "Aura Premium",
    watchHours: 0,
    watchStreak: 0,
    aiAccuracy: 99.8,
    notificationsEnabled: true,
    autoplayEnabled: true,
    smartRecommendations: true,
    streaming4k: true,
    watchlist: [], // Initialize empty watchlist
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

// NEW: Toggle Watchlist Logic
export const toggleWatchlist = async (uid: string, movieId: string, isAdding: boolean): Promise<void> => {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    watchlist: isAdding ? arrayUnion(movieId) : arrayRemove(movieId),
    updatedAt: serverTimestamp(),
  });
};
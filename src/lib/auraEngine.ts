import { collection, query, orderBy, limit, getDocs, where, doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

// ==========================================
// 1. GLOBAL TRENDING ALGORITHM
// ==========================================
// Pulls the top 10 movies across the entire platform based strictly on real view counts.
export async function getTrendingMovies() {
  try {
    const moviesRef = collection(db, "movies");
    // Sort by views (highest to lowest), limit to top 10
    const q = query(moviesRef, orderBy("views", "desc"), limit(10));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Aura Engine - Trending Error:", error);
    return [];
  }
}

// ==========================================
// 2. PERSONALIZED RECOMMENDATION ALGORITHM
// ==========================================
// Feeds movies to the user based on their specific genre preferences.
export async function getRecommendedForUser(favoriteGenre: string) {
  if (!favoriteGenre) return []; // Fallback if user hasn't set a preference
  
  try {
    const moviesRef = collection(db, "movies");
    // Only pull movies that match the user's exact favorite genre
    const q = query(moviesRef, where("category", "==", favoriteGenre), limit(15));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Aura Engine - Recommendation Error:", error);
    return [];
  }
}

// ==========================================
// 3. RECENTLY ADDED (FRESH CONTENT)
// ==========================================
// Keeps the homepage looking fresh by pulling the latest uploads.
export async function getRecentlyAdded() {
  try {
    const moviesRef = collection(db, "movies");
    const q = query(moviesRef, orderBy("createdAt", "desc"), limit(10));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Aura Engine - Recent Error:", error);
    return [];
  }
}

// ==========================================
// 4. THE VIEW TRACKER (Trigger this on the Watch Page)
// ==========================================
// This fires every time a user hits the /watch page, feeding the Trending Algorithm.
export async function recordMovieView(movieId: string) {
  try {
    const movieRef = doc(db, "movies", movieId);
    // Securely increment the view count by 1 in the database
    await updateDoc(movieRef, {
      views: increment(1)
    });
    return true;
  } catch (error) {
    console.error("Aura Engine - View Tracking Error:", error);
    return false;
  }
}
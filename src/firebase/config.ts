import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your exact Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCO21xftqkrLO7XJiEOVo8SqFnMZx4U_Mg",
  authDomain: "movie-project-586f9.firebaseapp.com",
  projectId: "movie-project-586f9",
  storageBucket: "movie-project-586f9.firebasestorage.app",
  messagingSenderId: "653133069250",
  appId: "1:653133069250:web:f4d985fb86237464fbb45b"
};

// Initialize Firebase only if it hasn't been initialized already (important for Next.js)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "the-thinking-cabinet.firebaseapp.com",
  projectId: "the-thinking-cabinet",
  storageBucket: "the-thinking-cabinet.firebasestorage.app",
  messagingSenderId: "785656598174",
  appId: "1:785656598174:web:3fd94dc045023f3054b58f",
  measurementId: "G-H2NYV5S0W4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
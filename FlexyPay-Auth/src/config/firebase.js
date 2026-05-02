// Firebase Configuration Instructions:
// 1. Go to Firebase Console (console.firebase.google.com)
// 2. Create a new project and add a Web App
// 3. Enable Authentication:
//    - Google Sign-In provider
//    - Phone Number provider
// 4. Enable Firestore Database
// 5. Copy the config values into a .env file at the root of this project:
/*
  VITE_FIREBASE_API_KEY=your_api_key
  VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
  VITE_FIREBASE_PROJECT_ID=your_project_id
  VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
  VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
  VITE_FIREBASE_APP_ID=your_app_id
*/

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo_key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo_domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo_project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo_bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "demo_sender",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo_app",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Use device language for OTP SMS
auth.useDeviceLanguage();

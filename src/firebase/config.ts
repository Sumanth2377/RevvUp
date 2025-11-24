'use client';

// This configuration object is constructed from environment variables.
// It's crucial that NEXT_PUBLIC_FIREBASE_* variables are set in your environment
// (e.g., in a .env.local file or in your hosting provider's settings).
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

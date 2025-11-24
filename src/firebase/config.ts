'use client';
import getConfig from 'next/config';

const { publicRuntimeConfig } = getConfig();

// This configuration object is constructed from environment variables.
// It's crucial that NEXT_PUBLIC_FIREBASE_* variables are set in your environment
// (e.g., in a .env.local file or in your hosting provider's settings).
export const firebaseConfig = {
  apiKey: publicRuntimeConfig.firebaseApiKey,
  authDomain: publicRuntimeConfig.firebaseAuthDomain,
  projectId: publicRuntimeConfig.firebaseProjectId,
  appId: publicRuntimeConfig.firebaseAppId,
};

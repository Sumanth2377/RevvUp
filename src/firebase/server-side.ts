import { initializeApp, getApp, getApps, FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// This file is intended for server-side use ONLY.

// This is the one place where we use the service account credentials.
// We are using require here because this file is not part of the Next.js bundle.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : undefined;

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // Add the service account credentials for admin operations
  serviceAccountId: serviceAccount?.client_email,
};

function getAdminApp() {
  if (getApps().find(app => app.name === 'admin')) {
    return getApp('admin');
  }
  return initializeApp(firebaseConfig, 'admin');
}

export function getSdks() {
    const app = getAdminApp();
    return {
        firebaseApp: app,
        auth: getAuth(app),
        firestore: getFirestore(app)
    };
}

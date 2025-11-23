import * as admin from 'firebase-admin';

// This file is intended for server-side use ONLY.

// Function to initialize the Firebase Admin SDK.
// It ensures that initialization only happens once.
function initializeAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // The service account key is expected to be in the FIREBASE_SERVICE_ACCOUNT
  // environment variable, which is automatically populated by Firebase App Hosting.
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : undefined;

  if (!serviceAccount) {
    // This will not run in the Studio environment because the variable is always set.
    // However, it's good practice for local development outside of Studio.
    throw new Error('Firebase service account credentials not found in environment variables.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Function to get the initialized Firebase Admin services.
export function getSdks() {
    const app = initializeAdminApp();
    return {
        firebaseApp: app,
        auth: admin.auth(app),
        firestore: admin.firestore(app)
    };
}

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
    throw new Error('Firebase service account credentials not found in environment variables.');
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Function to get the initialized Firebase services.
export function getSdks() {
    const app = initializeAdminApp();
    return {
        firebaseApp: app,
        auth: admin.auth(app),
        firestore: admin.firestore(app)
    };
}

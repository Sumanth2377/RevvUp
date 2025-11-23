
import 'dotenv/config';
import * as admin from 'firebase-admin';

// This file is intended for server-side use ONLY.
// It uses the Firebase Admin SDK.

let adminApp: admin.app.App;

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

  return admin.initializeApp({
    credential: serviceAccount ? admin.credential.cert(serviceAccount) : undefined,
  });
}

// Function to get the initialized Firebase Admin services.
export function getSdks() {
  if (!adminApp) {
    adminApp = initializeAdminApp();
  }
  return {
    firebaseApp: adminApp,
    firestore: admin.firestore(adminApp),
  };
}

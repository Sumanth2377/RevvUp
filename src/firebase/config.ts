// This is the only place where Firebase config is defined.
// It is explicitly NOT read from environment variables to ensure it's always available
// on the client side, even during build time.
//
// IMPORTANT: Replace the placeholder values with your actual Firebase project credentials.
// You can get these from the Firebase console:
// Project Settings > General > Your apps > Web app > Firebase SDK snippet > Config

export const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  appId: "your-app-id",
};

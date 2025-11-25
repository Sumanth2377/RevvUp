'use client';

import React, { useMemo, type ReactNode, useState, useEffect } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // This effect runs only on the client-side, after the component has mounted.
    // This is the crucial change: we ensure Firebase is only initialized in the browser.
    const services = initializeFirebase();
    setFirebaseServices(services);
  }, []); // Empty dependency array ensures this runs only once on mount

  if (!firebaseServices) {
    // While Firebase is initializing, we can show a loader or nothing.
    // Returning the children directly might cause issues if they depend on Firebase.
    // For now, returning null or a loading indicator is safest until Firebase is ready.
    return null; // Or a global loading component
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}

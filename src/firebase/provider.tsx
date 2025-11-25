'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useMemo,
  DependencyList,
} from 'react';
import { FirebaseApp, initializeApp, getApps } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, getAuth } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

// --- Configuration ---
// This is the standard way to use environment variables in Next.js.
// Vercel will automatically substitute these process.env variables
// with the values you set in your project's Environment Variables settings.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// --- Context & Provider State ---
interface FirebaseProviderProps {
  children: ReactNode;
}

interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
}

// --- Hook Return Types ---
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
}

// --- React Context ---
export const FirebaseContext = createContext<FirebaseContextState | undefined>(
  undefined
);

// --- Provider Component ---
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
}) => {
  const [firebaseState, setFirebaseState] = useState<FirebaseContextState>({
    areServicesAvailable: false,
    firebaseApp: null,
    firestore: null,
    auth: null,
    user: null,
    isUserLoading: true,
  });

  useEffect(() => {
    // This check is crucial. It ensures Firebase only initializes on the client-side.
    if (typeof window !== 'undefined') {
      // Validate that the keys are present before initializing
      if (!firebaseConfig.apiKey) {
        console.error("Firebase API Key is missing. Check your Vercel environment variables.");
        setFirebaseState(s => ({...s, isUserLoading: false}));
        return;
      }
      
      const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
      const auth = getAuth(app);
      const firestore = getFirestore(app);

      const unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          setFirebaseState({
            areServicesAvailable: true,
            firebaseApp: app,
            auth: auth,
            firestore: firestore,
            user: user,
            isUserLoading: false,
          });
        },
        (error) => {
          console.error('Firebase Auth State Error:', error);
          setFirebaseState({
            areServicesAvailable: true,
            firebaseApp: app,
            auth: auth,
            firestore: firestore,
            user: null,
            isUserLoading: false,
          });
        }
      );

      return () => unsubscribe();
    }
  }, []);

  return (
    <FirebaseContext.Provider value={firebaseState}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

// --- Hooks ---
export const useFirebase = (): Omit<FirebaseContextState, 'user' | 'isUserLoading'> => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  return {
    areServicesAvailable: context.areServicesAvailable,
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
  };
};

export const useAuth = (): Auth | null => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore | null => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return { user: context.user, isUserLoading: context.isUserLoading };
};

type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(
  factory: () => T,
  deps: DependencyList
): T | MemoFirebase<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoized = useMemo(factory, deps);

  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;

  return memoized;
}

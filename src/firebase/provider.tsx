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

// This is the public Firebase configuration for your project.
// It is populated by environment variables and is safe to be included in client-side code.
const firebaseConfig = {
  projectId: "studio-1738767715-e5992",
  appId: "1:316165834156:web:ab90b30251a8979d9c6609",
  apiKey: "AIzaSyBIzzN61gPmjfGoTnxvahTz0Ha_Sn9tJaI",
  authDomain: "studio-1738767715-e5992.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "316165834156"
};


// --- Context & Provider State ---
interface FirebaseProviderProps {
  children: ReactNode;
}

interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  areServicesAvailable: boolean;
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
    firebaseApp: null,
    firestore: null,
    auth: null,
    user: null,
    isUserLoading: true,
    areServicesAvailable: false,
  });

  useEffect(() => {
    // This check ensures that the environment variables are loaded before initializing.
    if (
      !firebaseConfig.apiKey ||
      firebaseConfig.apiKey.includes('your-api-key')
    ) {
      console.error(
        'Firebase API Key is missing or is a placeholder in the configuration. Please update it with your actual Firebase project credentials.'
      );
      setFirebaseState(s => ({...s, isUserLoading: false, areServicesAvailable: false}));
      return;
    }
    
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const firestore = getFirestore(app);

    setFirebaseState(prevState => ({
        ...prevState,
        firebaseApp: app,
        auth,
        firestore,
        areServicesAvailable: true,
    }));

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setFirebaseState(s => ({ ...s, user: user, isUserLoading: false }));
      },
      (error) => {
        console.error('Firebase Auth State Error:', error);
        setFirebaseState(s => ({ ...s, user: null, isUserLoading: false }));
      }
    );

    return () => unsubscribe();
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
  
  if (!context.areServicesAvailable) {
    return {
      areServicesAvailable: false,
      firebaseApp: null,
      firestore: null,
      auth: null,
    }
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

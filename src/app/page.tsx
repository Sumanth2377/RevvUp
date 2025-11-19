'use client';
import DashboardClient from '@/components/dashboard-client';
import { useVehicles } from '@/lib/data';
import { useUser, useAuth } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from './loading';
import { onAuthStateChanged } from 'firebase/auth';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const { vehicles, isLoading: isVehiclesLoading } = useVehicles(user?.uid);
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user state is determined

    if (!user) {
      router.push('/login');
      return;
    }

    if (!user.emailVerified) {
      router.push('/verify-email');
      return;
    }

    // This handles the case where the user verifies their email in another tab
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser && !currentUser.emailVerified) {
            router.push('/verify-email');
        } else if (currentUser && currentUser.emailVerified) {
            // Optional: force a reload or state update if needed, but Next.js router should handle it
        }
    });

    return () => unsubscribe();
  }, [user, isUserLoading, router, auth]);

  if (isUserLoading || isVehiclesLoading || !user?.emailVerified) {
    return <Loading />;
  }

  return <DashboardClient vehicles={vehicles || []} />;
}

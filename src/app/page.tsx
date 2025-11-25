'use client';
import DashboardClient from '@/components/dashboard-client';
import { useVehicles } from '@/lib/data';
import { useUser, useFirebase } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from './loading';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const { areServicesAvailable } = useFirebase();
  const { vehicles, isLoading: isVehiclesLoading } = useVehicles(user?.uid);
  const router = useRouter();

  const isLoading = isUserLoading || !areServicesAvailable || isVehiclesLoading;

  useEffect(() => {
    // Don't do anything until Firebase services are available and user status is known
    if (isUserLoading || !areServicesAvailable) return; 

    if (!user) {
      router.push('/login');
    }
  }, [user, isUserLoading, areServicesAvailable, router]);

  // Show a loading screen while initializing services or fetching data
  if (isLoading) {
    return <Loading />;
  }

  // If we have a user but are still waiting for vehicles, we can show the loading screen as well,
  // or a skeleton dashboard. Loading is simpler and sufficient here.
  if (!vehicles) {
    return <Loading />;
  }

  return <DashboardClient vehicles={vehicles} />;
}

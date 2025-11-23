'use client';
import DashboardClient from '@/components/dashboard-client';
import { useVehicles } from '@/lib/data';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from './loading';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const { vehicles, isLoading: isVehiclesLoading } = useVehicles(user?.uid);
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user state is determined

    if (!user) {
      router.push('/login');
      return;
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isVehiclesLoading || !user) {
    return <Loading />;
  }

  return <DashboardClient vehicles={vehicles || []} />;
}

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
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isVehiclesLoading) {
    return <Loading />;
  }

  if (!user) {
    return null;
  }

  return <DashboardClient vehicles={vehicles || []} />;
}

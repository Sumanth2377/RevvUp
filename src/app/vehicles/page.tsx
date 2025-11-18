'use client';

import { useUser } from '@/firebase';
import { useVehicles } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { VehicleCard } from '@/components/vehicle-card';
import { PlusCircle } from 'lucide-react';
import Loading from '../loading';
import { useRouter, redirect } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function MyVehiclesPage() {
  const { user, isUserLoading } = useUser();
  const { vehicles, isLoading: isVehiclesLoading } = useVehicles(user?.uid);
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      redirect('/login');
    }
  }, [user, isUserLoading]);

  if (isUserLoading || isVehiclesLoading) {
    return <Loading />;
  }
  
  return (
    <>
      <PageHeader
        title="My Vehicles"
        description="Manage your vehicles and their maintenance schedules."
      >
        <Button asChild>
          <Link href="/vehicles/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Vehicle
          </Link>
        </Button>
      </PageHeader>
      {vehicles && vehicles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {vehicles.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm mt-4">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              You have no vehicles
            </h3>
            <p className="text-sm text-muted-foreground">
              Get started by adding your first vehicle.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/vehicles/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Vehicle
              </Link>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

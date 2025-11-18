'use client';

import type { Vehicle } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/page-header';
import { VehicleCard } from '@/components/vehicle-card';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function DashboardClient({ vehicles }: { vehicles: Vehicle[] }) {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="An overview of your vehicles and their maintenance status."
      >
        <Button asChild>
          <Link href="/vehicles/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Vehicle
          </Link>
        </Button>
      </PageHeader>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {vehicles.map(vehicle => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </>
  );
}

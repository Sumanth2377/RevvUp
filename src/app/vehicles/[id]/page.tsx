'use client';

import { notFound, useRouter, useParams } from 'next/navigation';
import { useVehicleById } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Download } from 'lucide-react';
import { MaintenanceList } from '@/components/maintenance-list';
import { ServiceHistoryTable } from '@/components/service-history-table';
import { VehicleAiScheduler } from '@/components/vehicle-ai-scheduler';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/firebase';
import Loading from '@/app/loading';
import { useEffect, useState } from 'react';
import { AddServiceDialog } from '@/components/add-service-dialog';

export default function VehicleDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, isUserLoading } = useUser();
  const { vehicle, isLoading: isVehicleLoading } = useVehicleById(user?.uid, id);
  const router = useRouter();
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isVehicleLoading || isUserLoading) {
    return <Loading />;
  }

  if (!vehicle) {
    return notFound();
  }

  return (
    <>
      <PageHeader
        title={`${vehicle.make} ${vehicle.model}`}
        description={`${
          vehicle.year
        } · ${vehicle.mileage.toLocaleString()} miles · ${
          vehicle.licensePlate
        }`}
      >
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button onClick={() => setIsAddServiceOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </PageHeader>
      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Maintenance Schedule</TabsTrigger>
          <TabsTrigger value="history">Service History</TabsTrigger>
          <TabsTrigger value="ai">AI Suggestions</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Maintenance</CardTitle>
              <CardDescription>
                Key maintenance tasks and their current status for your vehicle.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MaintenanceList tasks={vehicle.maintenanceTasks || []} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Service History</CardTitle>
              <CardDescription>
                A complete log of all maintenance performed on your vehicle.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceHistoryTable history={vehicle.serviceHistory || []} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ai">
          <VehicleAiScheduler vehicle={vehicle} />
        </TabsContent>
      </Tabs>
      <AddServiceDialog 
        isOpen={isAddServiceOpen}
        onOpenChange={setIsAddServiceOpen}
        vehicle={vehicle}
        userId={user.uid}
      />
    </>
  );
}

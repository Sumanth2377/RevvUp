'use client';

import { notFound, useRouter, useParams } from 'next/navigation';
import { useVehicleById, useVehicleDetails } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Wrench } from 'lucide-react';
import { MaintenanceList } from '@/components/maintenance-list';
import { ServiceHistoryTable } from '@/components/service-history-table';
import { VehicleAiScheduler } from '@/components/vehicle-ai-scheduler';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/firebase';
import Loading from '@/app/loading';
import { useEffect, useState } from 'react';
import { AddServiceDialog } from '@/components/add-service-dialog';
import { AddTaskDialog } from '@/components/add-task-dialog';


export default function VehicleDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // Step 1: Get the base vehicle data
  const { vehicle: baseVehicle, isLoading: isVehicleLoading, error: vehicleError } = useVehicleById(user?.uid, id);

  // Step 2: Get the detailed data (tasks, history) based on the base vehicle
  const { vehicle: detailedVehicle, isLoading: isDetailsLoading, isHistoryLoading } = useVehicleDetails(user?.uid, baseVehicle);

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const isLoading = isUserLoading || isVehicleLoading || isDetailsLoading;

  if (isLoading) {
    return <Loading />;
  }

  // If loading is finished and we still have no vehicle, then it's a 404
  if (!detailedVehicle) {
     return notFound();
  }
  
  return (
    <>
      <PageHeader
        title={`${detailedVehicle.make} ${detailedVehicle.model}`}
        description={`${
          detailedVehicle.year
        } · ${detailedVehicle.mileage.toLocaleString()} miles · ${
          detailedVehicle.licensePlate || ''
        }`}
      >
        <Button variant="outline" onClick={() => setIsAddTaskOpen(true)}>
            <Wrench className="mr-2 h-4 w-4" />
            Add Custom Task
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
              <MaintenanceList tasks={detailedVehicle.maintenanceTasks || []} />
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
              {isHistoryLoading ? <Loading /> : <ServiceHistoryTable history={detailedVehicle.serviceHistory || []} />}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="ai">
          <VehicleAiScheduler vehicle={detailedVehicle} />
        </TabsContent>
      </Tabs>
      {user && (
        <>
          <AddServiceDialog 
            isOpen={isAddServiceOpen}
            onOpenChange={setIsAddServiceOpen}
            vehicle={detailedVehicle}
            userId={user.uid}
          />
          <AddTaskDialog
            isOpen={isAddTaskOpen}
            onOpenChange={setIsAddTaskOpen}
            vehicleId={detailedVehicle.id}
            userId={user.uid}
          />
        </>
      )}
    </>
  );
}

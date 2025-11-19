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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, Wrench, Trash2 } from 'lucide-react';
import { MaintenanceList } from '@/components/maintenance-list';
import { ServiceHistoryTable } from '@/components/service-history-table';
import { VehicleAiScheduler } from '@/components/vehicle-ai-scheduler';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, deleteDocumentNonBlocking } from '@/firebase';
import Loading from '@/app/loading';
import { useEffect, useState } from 'react';
import { AddServiceDialog } from '@/components/add-service-dialog';
import { AddTaskDialog } from '@/components/add-task-dialog';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';


export default function VehicleDetailsPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const { vehicle: baseVehicle, isLoading: isVehicleLoading, error: vehicleError } = useVehicleById(user?.uid, id);
  const { vehicle: detailedVehicle, isLoading: isDetailsLoading, isHistoryLoading } = useVehicleDetails(user?.uid, baseVehicle);

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const handleDeleteVehicle = () => {
    if (!user || !firestore || !id) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not delete vehicle. Please try again.",
        });
        return;
    }
    const vehicleRef = doc(firestore, 'users', user.uid, 'vehicles', id);
    deleteDocumentNonBlocking(vehicleRef);

    toast({
        title: "Vehicle Deleted",
        description: `${detailedVehicle?.make} ${detailedVehicle?.model} has been removed.`,
    });

    router.push('/vehicles');
  }

  const isLoading = isUserLoading || isVehicleLoading || isDetailsLoading;

  if (isLoading) {
    return <Loading />;
  }

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
        <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Vehicle
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
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              vehicle and all of its associated data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteVehicle}
              className="bg-destructive hover:bg-destructive/90"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

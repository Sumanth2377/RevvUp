
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useUser,
  useFirestore,
  setDocumentNonBlocking,
  useMemoFirebase,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import type { MaintenanceTask } from '@/lib/types';
import { useState } from 'react';
import Image from 'next/image';

const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce
    .number()
    .min(1900, 'Invalid year')
    .max(new Date().getFullYear() + 1, 'Invalid year'),
  licensePlate: z.string().min(1, 'License plate is required'),
  mileage: z.coerce.number().min(0, 'Mileage must be a positive number'),
  imageUrl: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

const defaultTasks: Omit<MaintenanceTask, 'id' | 'vehicleId' | 'createdAt' | 'updatedAt' >[] = [
    { name: 'Oil Change', description: 'Standard engine oil and filter change.', intervalType: 'Distance', intervalValue: 5000, lastPerformedDate: null, lastPerformedMileage: null, nextDueDate: null, nextDueMileage: null, status: 'ok' },
    { name: 'Tire Rotation', description: 'Rotating tires to ensure even wear.', intervalType: 'Distance', intervalValue: 7500, lastPerformedDate: null, lastPerformedMileage: null, nextDueDate: null, nextDueMileage: null, status: 'ok' },
    { name: 'Brake Inspection', description: 'Checking brake pads, rotors, and fluid.', intervalType: 'Time', intervalValue: 12, lastPerformedDate: null, lastPerformedMileage: null, nextDueDate: null, nextDueMileage: null, status: 'ok' },
    { name: 'Preventive Maintenance', description: 'Scheduled services to prevent future issues.', intervalType: 'Time', intervalValue: 6, lastPerformedDate: null, lastPerformedMileage: null, nextDueDate: null, nextDueMileage: null, status: 'ok' },
    { name: 'Repairs & Replacements', description: 'Fixing or replacing broken parts.', intervalType: 'Time', intervalValue: 12, lastPerformedDate: null, lastPerformedMileage: null, nextDueDate: null, nextDueMileage: null, status: 'ok' },
    { name: 'Safety Checks', description: 'Inspections of safety-critical systems.', intervalType: 'Time', intervalValue: 12, lastPerformedDate: null, lastPerformedMileage: null, nextDueDate: null, nextDueMileage: null, status: 'ok' },
    { name: 'System Updates', description: 'Software or firmware updates.', intervalType: 'Time', intervalValue: 24, lastPerformedDate: null, lastPerformedMileage: null, nextDueDate: null, nextDueMileage: null, status: 'ok' },
    { name: 'Documentation', description: 'Logging important vehicle events or paperwork.', intervalType: 'Time', intervalValue: 0, lastPerformedDate: null, lastPerformedMileage: null, nextDueDate: null, nextDueMileage: null, status: 'ok' },
    { name: 'Emergency Tasks', description: 'Unforeseen urgent repairs.', intervalType: 'Time', intervalValue: 0, lastPerformedDate: null, lastPerformedMileage: null, nextDueDate: null, nextDueMileage: null, status: 'ok' },
];

export default function AddVehiclePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: '',
      model: '',
      year: undefined,
      licensePlate: '',
      mileage: 0,
      imageUrl: '',
    },
  });

  const vehiclesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'vehicles');
  }, [firestore, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        form.setValue('imageUrl', result);
        setImagePreview(result);
      };
      reader.readAsDataURL(file);
    }
  };


  async function onSubmit(data: VehicleFormValues) {
    if (!vehiclesCollectionRef || !user || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to add a vehicle.',
        });
        return;
    }

    const imageUrl = data.imageUrl || `https://picsum.photos/seed/${data.make}${data.model}/600/400`;
    const imageHint = `${data.make} ${data.model}`.toLowerCase();
    
    const vehicleId = uuidv4();

    const newVehicle = {
      id: vehicleId,
      userId: user.uid,
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.licensePlate,
      mileage: data.mileage,
      imageUrl: imageUrl,
      imageHint: imageHint,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const vehicleRef = doc(vehiclesCollectionRef, vehicleId);
      setDocumentNonBlocking(vehicleRef, newVehicle, { merge: false });

      // Add default maintenance tasks
      const tasksCollectionRef = collection(firestore, 'users', user.uid, 'vehicles', vehicleId, 'maintenanceTasks');
      
      for (const task of defaultTasks) {
        const taskId = uuidv4();
        const newTask: MaintenanceTask = {
          ...task,
          id: taskId,
          vehicleId: vehicleId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const taskRef = doc(tasksCollectionRef, taskId);
        setDocumentNonBlocking(taskRef, newTask, { merge: false });
      }

      toast({
        title: 'Vehicle Added',
        description: `${data.make} ${data.model} has been added with default maintenance tasks.`,
      });
      router.push('/vehicles');
    } catch (error) {
      console.error('Error adding vehicle: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add vehicle. Please try again.',
      });
    }
  }

  return (
    <>
      <PageHeader
        title="Add New Vehicle"
        description="Enter the details for your new vehicle."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
              <CardDescription>
                Fill out the form below to add a new vehicle to your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Toyota" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Camry" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 2023" {...field} onChange={e => field.onChange(e.target.valueAsNumber || '')} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="licensePlate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Plate</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ABC-1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mileage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Odometer Distance (in miles)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 25000" {...field} onChange={e => field.onChange(e.target.valueAsNumber || '')} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vehicle Image</FormLabel>
                      <FormControl>
                        <Input type="file" accept="image/*" onChange={handleImageChange} className="pt-2" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {imagePreview && (
                    <div className="md:col-span-2">
                        <Label>Image Preview</Label>
                        <div className="mt-2 relative w-full h-48 rounded-lg overflow-hidden border">
                            <Image src={imagePreview} alt="Vehicle preview" fill objectFit="cover" />
                        </div>
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
          <Button type="submit">Add Vehicle</Button>
        </form>
      </Form>
    </>
  );
}

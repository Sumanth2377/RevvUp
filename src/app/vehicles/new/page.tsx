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
import { PageHeader } from '@/components/page-header';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, formatISO } from 'date-fns';

const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce
    .number()
    .min(1900, 'Invalid year')
    .max(new Date().getFullYear() + 1, 'Invalid year'),
  licensePlate: z.string().min(1, 'License plate is required'),
  mileage: z.coerce.number().min(0, 'Mileage must be a positive number'),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

// Default maintenance tasks to be added for a new vehicle
const defaultTasks = [
    {
        name: 'Oil Change',
        description: 'Standard engine oil and filter change.',
        intervalType: 'Time',
        intervalValue: 6, // months
        nextDueMileageInterval: 5000, // miles
    },
    {
        name: 'Tire Rotation',
        description: 'Rotate tires to ensure even wear.',
        intervalType: 'Time',
        intervalValue: 6, // months
        nextDueMileageInterval: 7500, // miles
    },
    {
        name: 'Brake Inspection',
        description: 'Inspect brake pads, rotors, and fluid.',
        intervalType: 'Time',
        intervalValue: 12, // months
        nextDueMileageInterval: 12000, // miles
    },
    {
        name: 'Routine Inspection',
        description: 'Check fluid levels, belts, hoses, and lights.',
        intervalType: 'Time',
        intervalValue: 3, // months
        nextDueMileageInterval: 3000, // miles
    },
    {
        name: 'Preventive Maintenance',
        description: 'Scheduled services to prevent future issues.',
        intervalType: 'Time',
        intervalValue: 12, // months
        nextDueMileageInterval: 15000, // miles
    },
    {
        name: 'Repairs & Replacements',
        description: 'Address any necessary repairs or part replacements.',
        intervalType: 'Time',
        intervalValue: 12, // months
        nextDueMileageInterval: 0, // Ad-hoc
    },
    {
        name: 'Safety Checks',
        description: 'Inspect airbags, seatbelts, and other safety systems.',
        intervalType: 'Time',
        intervalValue: 24, // months
        nextDueMileageInterval: 24000, // miles
    },
    {
        name: 'System Updates',
        description: 'Check for software or firmware updates for the vehicle systems.',
        intervalType: 'Time',
        intervalValue: 12, // months
        nextDueMileageInterval: 0, // Not mileage dependent
    },
    {
        name: 'Documentation',
        description: 'Update service records, registration, or insurance.',
        intervalType: 'Time',
        intervalValue: 12,
        nextDueMileageInterval: 0,
    },
    {
        name: 'Emergency Tasks',
        description: 'Tasks related to unforeseen events like flat tires or battery issues.',
        intervalType: 'Time',
        intervalValue: 12,
        nextDueMileageInterval: 0,
    },
];

export default function AddVehiclePage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: '',
      model: '',
      year: undefined,
      licensePlate: '',
      mileage: 0,
    },
  });

  const vehiclesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'vehicles');
  }, [firestore, user]);

  async function onSubmit(data: VehicleFormValues) {
    if (!vehiclesCollectionRef || !user || !firestore) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to add a vehicle.',
        });
        return;
    }

    const imageUrl = `https://picsum.photos/seed/${data.make}${data.model}/600/400`;
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
      defaultTasks.forEach(taskInfo => {
          const taskId = uuidv4();
          const taskRef = doc(firestore, `users/${user.uid}/vehicles/${vehicleId}/maintenanceTasks`, taskId);
          const nextDueDate = addMonths(new Date(), taskInfo.intervalValue);

          const newTask = {
              id: taskId,
              vehicleId: vehicleId,
              name: taskInfo.name,
              description: taskInfo.description,
              intervalType: taskInfo.intervalType,
              intervalValue: taskInfo.intervalValue,
              lastPerformedDate: null,
              lastPerformedMileage: null,
              nextDueDate: formatISO(nextDueDate),
              nextDueMileage: taskInfo.nextDueMileageInterval > 0 ? data.mileage + taskInfo.nextDueMileageInterval : null,
              status: 'due',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
          };
          setDocumentNonBlocking(taskRef, newTask, { merge: false });
      });


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
              </div>
            </CardContent>
          </Card>
          <Button type="submit">Add Vehicle</Button>
        </form>
      </Form>
    </>
  );
}

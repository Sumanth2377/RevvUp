'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useUser,
  useFirestore,
  addDocumentNonBlocking,
  useMemoFirebase,
} from '@/firebase';
import { collection } from 'firebase/firestore';
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


const vehicleSchema = z.object({
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.coerce
    .number()
    .min(1900, 'Invalid year')
    .max(new Date().getFullYear() + 1, 'Invalid year'),
  licensePlate: z.string().min(1, 'License plate is required'),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;

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
    },
  });

  const vehiclesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'vehicles');
  }, [firestore, user]);

  async function onSubmit(data: VehicleFormValues) {
    if (!vehiclesCollectionRef || !user) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to add a vehicle.',
        });
        return;
    }

    const imageUrl = `https://picsum.photos/seed/${data.make}${data.model}/600/400`;
    const imageHint = `${data.make} ${data.model}`.toLowerCase();
    
    // Create a deterministic ID or use Firestore's auto-ID. 
    // Using a UUID here to ensure we can create the full object before sending.
    const vehicleId = uuidv4();

    const newVehicle = {
      id: vehicleId,
      userId: user.uid,
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.licensePlate,
      mileage: 0,
      imageUrl: imageUrl,
      imageHint: imageHint,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      // We pass the full vehicle object to be added.
      addDocumentNonBlocking(vehiclesCollectionRef, newVehicle);
      toast({
        title: 'Vehicle Added',
        description: `${data.make} ${data.model} has been added to your garage.`,
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
              </div>
            </CardContent>
          </Card>
          <Button type="submit">Add Vehicle</Button>
        </form>
      </Form>
    </>
  );
}

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/page-header';
import { useToast } from '@/hooks/use-toast';
import { PlaceHolderImages } from '@/lib/placeholder-images';

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
      year: '' as any,
      licensePlate: '',
      mileage: '' as any,
    },
  });

  const vehiclesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'vehicles');
  }, [firestore, user]);

  async function onSubmit(data: VehicleFormValues) {
    if (!vehiclesCollectionRef || !user) return;

    const randomImage =
      PlaceHolderImages[Math.floor(Math.random() * PlaceHolderImages.length)];

    const newVehicle = {
      ...data,
      userId: user.uid,
      imageUrl: randomImage.imageUrl,
      imageHint: randomImage.imageHint,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
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
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Information</CardTitle>
          <CardDescription>
            Fill out the form below to add a new vehicle to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                        <Input type="number" placeholder="e.g., 2023" {...field} />
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
                      <FormLabel>Current Mileage</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 15000" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the current mileage on the odometer.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit">Add Vehicle</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}

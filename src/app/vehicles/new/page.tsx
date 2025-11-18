'use client';

import { useForm, useWatch } from 'react-hook-form';
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
import { generateVehicleImageAction } from '@/lib/actions';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { WandSparkles, Car } from 'lucide-react';

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
  
  const [imageState, setImageState] = useState<{imageUrl?: string, imageHint?: string, error?: string, loading: boolean}>({ loading: false });

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      make: '',
      model: '',
      year: undefined,
      licensePlate: '',
      mileage: undefined,
    },
  });

  const { make, model, year } = useWatch({ control: form.control });

  const handleGenerateImage = async () => {
    const makeValue = form.getValues('make');
    const modelValue = form.getValues('model');
    const yearValue = form.getValues('year');

    if (!makeValue || !modelValue || !yearValue) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please provide the Make, Model, and Year to generate an image.',
        });
        return;
    }
    
    setImageState({ loading: true });

    const formData = new FormData();
    formData.append('make', makeValue);
    formData.append('model', modelValue);
    formData.append('year', String(yearValue));
    
    const result = await generateVehicleImageAction({} , formData);
    setImageState({ ...result, loading: false });
  };


  const vehiclesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'vehicles');
  }, [firestore, user]);

  async function onSubmit(data: VehicleFormValues) {
    if (!vehiclesCollectionRef || !user) return;
    if (!imageState.imageUrl) {
        toast({
            variant: 'destructive',
            title: 'Image Required',
            description: 'Please generate an image for the vehicle before saving.',
        });
        return;
    }

    const newVehicle = {
      ...data,
      userId: user.uid,
      imageUrl: imageState.imageUrl,
      imageHint: imageState.imageHint,
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
        description="Enter the details and generate an image for your new vehicle."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="lg:col-span-2 h-fit">
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
                              <Input type="number" placeholder="e.g., 2023" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} value={field.value ?? ''} />
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
                          <FormItem className="md:col-span-2">
                            <FormLabel>Current Mileage</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="e.g., 15000" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} value={field.value ?? ''} />
                            </FormControl>
                            <FormDescription>
                              Enter the current mileage on the odometer.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Vehicle Image</CardTitle>
                        <CardDescription>Generate an image of your vehicle using AI.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="aspect-video rounded-lg bg-muted flex items-center justify-center relative overflow-hidden">
                            {imageState.loading && <Skeleton className="w-full h-full" />}
                            {!imageState.loading && imageState.imageUrl && (
                                <Image src={imageState.imageUrl} alt="AI generated vehicle image" layout="fill" objectFit="cover" />
                            )}
                             {!imageState.loading && !imageState.imageUrl && (
                                <div className="text-center text-muted-foreground">
                                    <Car className="mx-auto h-12 w-12" />
                                    <p>Click below to generate an image.</p>
                                </div>
                             )}
                        </div>
                    </CardContent>
                    <CardFooter>
                         <Button type="button" onClick={handleGenerateImage} disabled={imageState.loading} className="w-full">
                            <WandSparkles className="mr-2"/>
                            {imageState.loading ? 'Generating...' : 'Generate Image'}
                         </Button>
                    </CardFooter>
                 </Card>
              </div>
            </div>

            <Button type="submit">Add Vehicle</Button>
        </form>
      </Form>
    </>
  );
}

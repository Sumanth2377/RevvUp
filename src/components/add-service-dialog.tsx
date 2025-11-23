'use client';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  addDocumentNonBlocking,
  useFirestore,
  updateDocumentNonBlocking
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import type { Vehicle } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { updateMaintenanceTaskAction } from '@/lib/actions';
import { Loader2 } from 'lucide-react';

const serviceSchema = z.object({
  maintenanceTaskId: z.string().min(1, 'Please select a maintenance task.'),
  serviceDate: z.string().min(1, 'Service date is required.'),
  mileage: z.coerce.number().min(0, 'Mileage must be a positive number.'),
  notes: z.string().optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface AddServiceDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  vehicle: Vehicle;
  userId: string;
}

export function AddServiceDialog({
  isOpen,
  onOpenChange,
  vehicle,
  userId,
}: AddServiceDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      maintenanceTaskId: '',
      serviceDate: new Date().toISOString().split('T')[0],
      mileage: vehicle.mileage,
      notes: '',
    },
  });

  const onSubmit = (data: ServiceFormValues) => {
    const selectedTask = vehicle.maintenanceTasks.find(
      (task) => task.id === data.maintenanceTaskId
    );
    if (!selectedTask || !firestore) return;

    // 1. Add the service record to the history
    const serviceHistoryRef = collection(
      firestore,
      `users/${userId}/vehicles/${vehicle.id}/maintenanceTasks/${selectedTask.id}/serviceHistory`
    );
    
    const newServiceRecord = {
      id: uuidv4(),
      maintenanceTaskId: selectedTask.id,
      serviceDate: data.serviceDate,
      mileage: data.mileage,
      notes: data.notes || '',
      taskName: selectedTask.name, // Denormalize for easier display
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    addDocumentNonBlocking(serviceHistoryRef, newServiceRecord);
    
    // 2. Update the maintenance task status via a server action
    startTransition(async () => {
        const formData = new FormData();
        formData.append('userId', userId);
        formData.append('vehicleId', vehicle.id);
        formData.append('taskId', selectedTask.id);
        formData.append('serviceDate', data.serviceDate);
        formData.append('mileage', String(data.mileage));
        
        const result = await updateMaintenanceTaskAction(formData);

        if (result?.success) {
             toast({
                title: 'Service Added & Schedule Updated',
                description: 'The service record has been saved and the maintenance schedule is updated.',
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Error updating schedule',
                description: result?.error || 'Could not update the maintenance schedule.',
            });
        }
        onOpenChange(false);
        form.reset();
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Service Record</DialogTitle>
          <DialogDescription>
            Log a new maintenance service for your {vehicle.make} {vehicle.model}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="maintenanceTaskId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maintenance Task</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a task" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(vehicle.maintenanceTasks || []).map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="serviceDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
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
                  <FormLabel>Mileage at Service</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Used synthetic oil..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Service
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

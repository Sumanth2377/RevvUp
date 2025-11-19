'use client';
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
import {
  addDocumentNonBlocking,
  useFirestore,
  setDocumentNonBlocking,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';

const taskSchema = z.object({
  taskName: z.string().min(1, 'Task name is required.'),
  nextDueDate: z.string().min(1, 'Due date is required.'),
  intervalValue: z.coerce.number().min(0, 'Interval must be a positive number.'),
  intervalType: z.enum(['Time', 'Distance']),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface AddTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  vehicleId: string;
  userId: string;
}

export function AddTaskDialog({
  isOpen,
  onOpenChange,
  vehicleId,
  userId,
}: AddTaskDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      taskName: '',
      nextDueDate: '',
      intervalValue: 0,
      intervalType: 'Time',
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    if (!firestore) return;

    const taskId = uuidv4();
    const taskRef = doc(firestore, `users/${userId}/vehicles/${vehicleId}/maintenanceTasks`, taskId);
    const notificationId = uuidv4();
    const notificationRef = doc(firestore, `users/${userId}/notifications`, notificationId);

    const newTask = {
      id: taskId,
      vehicleId: vehicleId,
      name: data.taskName,
      description: 'User-defined task',
      intervalType: data.intervalType,
      intervalValue: data.intervalValue,
      lastPerformedDate: null,
      lastPerformedMileage: null,
      nextDueDate: data.nextDueDate,
      nextDueMileage: null, // Custom tasks are time-based for now
      status: 'due', // Assume it's due
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newNotification = {
        id: notificationId,
        userId: userId,
        maintenanceTaskId: taskId,
        message: `Reminder: '${data.taskName}' is due for your vehicle.`,
        isRead: false,
        createdAt: new Date().toISOString(),
    };

    setDocumentNonBlocking(taskRef, newTask, { merge: true });
    setDocumentNonBlocking(notificationRef, newNotification, { merge: true });

    toast({
      title: 'Custom Task Added',
      description: `The task '${data.taskName}' has been added with a reminder.`,
    });
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Custom Maintenance Task</DialogTitle>
          <DialogDescription>
            Set a future reminder for a specific maintenance task.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="taskName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Check tire pressure" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nextDueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Save Task</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

'use server';

import {
  suggestMaintenanceSchedule,
  type SuggestMaintenanceScheduleInput,
} from '@/ai/flows/intelligent-maintenance-schedule';
import { z } from 'zod';
import { getSdks } from '@/firebase/server-side';
import type { MaintenanceTask, Vehicle } from './types';
import { add, formatISO } from 'date-fns';

const maintenanceSchema = z.object({
  vehicleMake: z.string(),
  vehicleModel: z.string(),
  vehicleYear: z.coerce.number(),
  currentMileage: z.coerce.number(),
  drivingStyle: z.string().min(3, 'Driving style is required.'),
  lastServiceDate: z.string().min(1, 'Last service date is required.'),
  maintenanceHistory: z.string().optional(),
});

type MaintenanceFormState = {
  suggestedMaintenanceSchedule: string;
  error: string;
};

export async function suggestMaintenanceScheduleAction(
  prevState: MaintenanceFormState,
  formData: FormData
): Promise<MaintenanceFormState> {
  const parsed = maintenanceSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return {
      suggestedMaintenanceSchedule: '',
      error: parsed.error.errors.map(e => e.message).join(', '),
    };
  }

  const input: SuggestMaintenanceScheduleInput = parsed.data;

  try {
    const result = await suggestMaintenanceSchedule(input);
    return {
      suggestedMaintenanceSchedule: result.suggestedMaintenanceSchedule,
      error: '',
    };
  } catch (e: any) {
    return {
      suggestedMaintenanceSchedule: '',
      error: e.message || 'An unknown error occurred.',
    };
  }
}

const updateTaskSchema = z.object({
  userId: z.string(),
  vehicleId: z.string(),
  taskId: z.string(),
  serviceDate: z.string(),
  mileage: z.coerce.number(),
});

export async function updateMaintenanceTaskAction(formData: FormData) {
    const parsed = updateTaskSchema.safeParse(Object.fromEntries(formData.entries()));
    if (!parsed.success) {
        throw new Error('Invalid data for updating maintenance task.');
    }

    const { userId, vehicleId, taskId, serviceDate, mileage } = parsed.data;
    const { firestore } = getSdks();
    
    const taskRef = firestore.doc(`users/${userId}/vehicles/${vehicleId}/maintenanceTasks/${taskId}`);
    const vehicleRef = firestore.doc(`users/${userId}/vehicles/${vehicleId}`);
    
    try {
        const [taskSnap, vehicleSnap] = await Promise.all([taskRef.get(), vehicleRef.get()]);
        
        if (!taskSnap.exists) {
            throw new Error("Maintenance task not found.");
        }
        if (!vehicleSnap.exists) {
            throw new Error("Vehicle not found.");
        }

        const task = taskSnap.data() as MaintenanceTask;
        const vehicle = vehicleSnap.data() as Vehicle;

        let nextDueDate: string | null = null;
        let nextDueMileage: number | null = null;
        const newStatus: 'ok' | 'due' | 'overdue' = 'ok';

        if (task.intervalType === 'Time' && task.intervalValue) {
            const lastDate = new Date(serviceDate);
            nextDueDate = formatISO(add(lastDate, { months: task.intervalValue }));
        }

        if (task.intervalType === 'Distance' && task.intervalValue) {
            nextDueMileage = mileage + task.intervalValue;
        }

        // Update vehicle's main mileage if this one is higher
        if (mileage > vehicle.mileage) {
            await vehicleRef.update({
                 mileage: mileage,
                 updatedAt: new Date().toISOString() 
            });
        }
        
        await taskRef.update({
            lastPerformedDate: serviceDate,
            lastPerformedMileage: mileage,
            nextDueDate,
            nextDueMileage,
            status: newStatus,
            updatedAt: new Date().toISOString(),
        });

        return { success: true, message: 'Task updated successfully.' };

    } catch (error: any) {
        console.error("Error updating maintenance task:", error);
        return { success: false, error: error.message };
    }
}

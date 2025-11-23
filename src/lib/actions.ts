'use server';
import {
  suggestMaintenanceSchedule,
  type SuggestMaintenanceScheduleInput,
} from '@/ai/flows/intelligent-maintenance-schedule';
import { z } from 'zod';

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

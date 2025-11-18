'use server';

import {
  suggestMaintenanceSchedule,
  type SuggestMaintenanceScheduleInput,
} from '@/ai/flows/intelligent-maintenance-schedule';
import { z } from 'zod';

const formSchema = z.object({
  vehicleMake: z.string(),
  vehicleModel: z.string(),
  vehicleYear: z.coerce.number(),
  currentMileage: z.coerce.number(),
  drivingStyle: z.string().min(3, 'Driving style is required.'),
  lastServiceDate: z.string().min(1, 'Last service date is required.'),
  maintenanceHistory: z.string().optional(),
});

type FormState = {
  suggestedMaintenanceSchedule: string;
  error: string;
};

export async function suggestMaintenanceScheduleAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const parsed = formSchema.safeParse(Object.fromEntries(formData.entries()));

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

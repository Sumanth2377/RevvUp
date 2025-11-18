'use server';

/**
 * @fileOverview A Genkit flow that suggests optimal maintenance schedules using generative AI.
 *
 * - suggestMaintenanceSchedule - A function that suggests a maintenance schedule for a vehicle.
 * - SuggestMaintenanceScheduleInput - The input type for the suggestMaintenanceSchedule function.
 * - SuggestMaintenanceScheduleOutput - The return type for the suggestMaintenanceSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMaintenanceScheduleInputSchema = z.object({
  vehicleMake: z.string().describe('The make of the vehicle.'),
  vehicleModel: z.string().describe('The model of the vehicle.'),
  vehicleYear: z.number().describe('The year of the vehicle.'),
  currentMileage: z.number().describe('The current mileage of the vehicle.'),
  drivingStyle: z
    .string()
    .describe(
      'A description of the users driving style (e.g., mostly city driving, mostly highway driving, aggressive driving, etc.).'
    ),
  lastServiceDate: z
    .string()
    .describe('The date of the last maintenance service performed on the vehicle, in YYYY-MM-DD format.'),
  maintenanceHistory: z
    .string()
    .optional()
    .describe('A summary of the vehicles maintenance history.'),
});

export type SuggestMaintenanceScheduleInput = z.infer<
  typeof SuggestMaintenanceScheduleInputSchema
>;

const SuggestMaintenanceScheduleOutputSchema = z.object({
  suggestedMaintenanceSchedule: z
    .string()
    .describe(
      'A detailed maintenance schedule, including specific tasks and intervals, tailored to the vehicle and driving conditions.'
    ),
});

export type SuggestMaintenanceScheduleOutput = z.infer<
  typeof SuggestMaintenanceScheduleOutputSchema
>;

export async function suggestMaintenanceSchedule(
  input: SuggestMaintenanceScheduleInput
): Promise<SuggestMaintenanceScheduleOutput> {
  return suggestMaintenanceScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMaintenanceSchedulePrompt',
  input: {schema: SuggestMaintenanceScheduleInputSchema},
  output: {schema: SuggestMaintenanceScheduleOutputSchema},
  prompt: `You are an expert automotive technician. You are providing a maintenance schedule based on the following information.

Vehicle Make: {{{vehicleMake}}}
Vehicle Model: {{{vehicleModel}}}
Vehicle Year: {{{vehicleYear}}}
Current Mileage: {{{currentMileage}}}
Driving Style: {{{drivingStyle}}}
Last Service Date: {{{lastServiceDate}}}
Maintenance History: {{{maintenanceHistory}}}

Based on this information, suggest an optimal maintenance schedule that considers both the vehicles usage patterns and manufacturer recommendations. Provide specific tasks and intervals.
`,
});

const suggestMaintenanceScheduleFlow = ai.defineFlow(
  {
    name: 'suggestMaintenanceScheduleFlow',
    inputSchema: SuggestMaintenanceScheduleInputSchema,
    outputSchema: SuggestMaintenanceScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

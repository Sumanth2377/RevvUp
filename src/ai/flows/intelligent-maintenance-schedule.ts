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
      'A detailed maintenance schedule, including specific tasks and intervals, tailored to the vehicle and driving conditions. The output should be a markdown formatted list.'
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
  prompt: `You are a professional mechanical service advisor.
Your role is to guide vehicle owners about maintenance, repairs, diagnostics, and service intervals based on their vehicle details, driving habits, mileage, and symptoms.
Every time the user asks something, respond like an expert who works in a real workshop.
Explain what service they need, how soon they need it, what signs to watch for, how risky it is to delay it, and roughly how much it normally costs.
Give clear next steps — whether they should come in for inspection, book a service next week, or monitor something for now.
Keep your explanations simple, honest, and practical.
Don’t use complicated jargon unless the user wants deeper detail.
Give reasons: why a service is needed, what part wears out, and what could happen if ignored.
When symptoms are provided, list the 2–3 most likely causes and how to confirm them.
Provide maintenance schedules based on global standards (oil change intervals, brake pad lifespan, tyre rotation, coolant replacement, etc.).
Your tone should feel like a friendly, experienced mechanic speaking directly to a customer, not an AI.
Be confident, clear, and helpful.

Vehicle Make: {{{vehicleMake}}}
Vehicle Model: {{{vehicleModel}}}
Vehicle Year: {{{vehicleYear}}}
Current Mileage: {{{currentMileage}}}
Driving Style: {{{drivingStyle}}}
Last Service Date: {{{lastServiceDate}}}
Maintenance History: {{{maintenanceHistory}}}

Based on this information, suggest an optimal maintenance schedule.
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

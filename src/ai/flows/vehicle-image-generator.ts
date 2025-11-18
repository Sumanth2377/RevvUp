'use server';
/**
 * @fileOverview A Genkit flow that generates an image for a vehicle.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateVehicleImageInputSchema = z.object({
    make: z.string().describe('The make of the vehicle.'),
    model: z.string().describe('The model of the vehicle.'),
    year: z.number().describe('The year of the vehicle.'),
});

export type GenerateVehicleImageInput = z.infer<typeof GenerateVehicleImageInputSchema>;

const GenerateVehicleImageOutputSchema = z.object({
    imageUrl: z.string().describe('The URL of the generated image.'),
    imageHint: z.string().describe('A hint for AI systems about the image content.'),
});

export type GenerateVehicleImageOutput = z.infer<typeof GenerateVehicleImageOutputSchema>;

export async function generateVehicleImage(
    input: GenerateVehicleImageInput
): Promise<GenerateVehicleImageOutput> {
    return generateVehicleImageFlow(input);
}

const prompt = ai.definePrompt({
    name: 'generateVehicleImagePrompt',
    input: { schema: GenerateVehicleImageInputSchema },
    output: { schema: z.object({
        prompt: z.string().describe('A descriptive prompt for an image generation model.'),
        keywords: z.string().describe('Two keywords separated by a space for the data-ai-hint attribute.')
    })},
    prompt: `Based on the following vehicle information, create a short, descriptive prompt for an image generation model to create a photorealistic image of the car. The prompt should include the make, model, year, and a realistic color. Also suggest two keywords for a data-ai-hint.

Vehicle: {{{year}}} {{{make}}} {{{model}}}

Example output:
{
    "prompt": "A photorealistic image of a silver 2023 Toyota Camry parked on a city street.",
    "keywords": "silver sedan"
}
`,
});

const generateVehicleImageFlow = ai.defineFlow(
    {
        name: 'generateVehicleImageFlow',
        inputSchema: GenerateVehicleImageInputSchema,
        outputSchema: GenerateVehicleImageOutputSchema,
    },
    async (input) => {
        const { output: promptOutput } = await prompt(input);
        if (!promptOutput) {
            throw new Error('Failed to generate image prompt.');
        }

        // Using a placeholder service for now
        const imageUrl = `https://picsum.photos/seed/${input.make}${input.model}/600/400`;
        
        return {
            imageUrl: imageUrl,
            imageHint: promptOutput.keywords,
        };
    }
);

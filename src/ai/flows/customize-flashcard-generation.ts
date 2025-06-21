// src/ai/flows/customize-flashcard-generation.ts
'use server';
/**
 * @fileOverview Flow to generate customized flashcards from text.
 *
 * - customizeFlashcardGeneration - A function that handles the flashcard generation process with customizable options.
 * - CustomizeFlashcardGenerationInput - The input type for the customizeFlashcardGeneration function.
 * - CustomizeFlashcardGenerationOutput - The return type for the customizeFlashcardGeneration function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CustomizeFlashcardGenerationInputSchema = z.object({
  text: z.string().describe('The text to generate flashcards from.'),
  numFlashcards: z
    .number()
    .min(1)
    .max(20)
    .default(5)
    .describe('The number of flashcards to generate.'),
  detailLevel: z
    .enum(['basic', 'intermediate', 'detailed'])
    .default('intermediate')
    .describe('The level of detail to include in each flashcard.'),
});

export type CustomizeFlashcardGenerationInput = z.infer<
  typeof CustomizeFlashcardGenerationInputSchema
>;

const FlashcardSchema = z.object({
  question: z.string().describe('The question for the flashcard.'),
  answer: z.string().describe('The answer to the question.'),
});

const CustomizeFlashcardGenerationOutputSchema = z.array(FlashcardSchema);

export type CustomizeFlashcardGenerationOutput = z.infer<
  typeof CustomizeFlashcardGenerationOutputSchema
>;

export async function customizeFlashcardGeneration(
  input: CustomizeFlashcardGenerationInput
): Promise<CustomizeFlashcardGenerationOutput> {
  return customizeFlashcardGenerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'customizeFlashcardGenerationPrompt',
  input: {schema: CustomizeFlashcardGenerationInputSchema},
  output: {schema: CustomizeFlashcardGenerationOutputSchema},
  prompt: `You are a flashcard generator. Generate {{numFlashcards}} flashcards from the following text. The detail level should be {{detailLevel}}.\n\nText: {{{text}}}`,
});

const customizeFlashcardGenerationFlow = ai.defineFlow(
  {
    name: 'customizeFlashcardGenerationFlow',
    inputSchema: CustomizeFlashcardGenerationInputSchema,
    outputSchema: CustomizeFlashcardGenerationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

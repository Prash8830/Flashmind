'use server';

/**
 * @fileOverview Flow to generate flashcards from a given text summary.
 *
 * - generateFlashcards - A function that handles the flashcard generation process.
 * - GenerateFlashcardsInput - The input type for the generateFlashcards function.
 * - GenerateFlashcardsOutput - The return type for the generateFlashcards function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFlashcardsInputSchema = z.object({
  text: z.string().describe('The text content extracted from the PDF.'),
  language: z
    .string()
    .optional()
    .default('English')
    .describe('The language to translate the flashcards into.'),
});
export type GenerateFlashcardsInput = z.infer<
  typeof GenerateFlashcardsInputSchema
>;

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z
    .array(
      z.object({
        question: z.string().describe('The flashcard question.'),
        answer: z.string().describe('The flashcard answer.'),
        emoji: z.string().optional().describe('A single emoji relevant to the question.'),
      })
    )
    .describe('An array of flashcards in JSON format.'),
  progress: z.string().describe('Progress message for flashcard generation'),
});
export type GenerateFlashcardsOutput = z.infer<
  typeof GenerateFlashcardsOutputSchema
>;

export async function generateFlashcards(
  input: GenerateFlashcardsInput
): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const flashcardPrompt = ai.definePrompt({
  name: 'flashcardPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  system: `You are an expert educator and API that returns valid JSON.
  - Create flashcards covering the core concepts from the provided text.
  - Each flashcard must have a 'question', an 'answer', and a single relevant 'emoji'.
  - The flashcards must be in the requested language. Translate the 'question' and 'answer' to this language. The 'emoji' does not need translation.
  - Provide a short, one-sentence summary of the generation process in the 'progress' field.
  - Your entire output must be a single, valid JSON object that strictly adheres to the output schema. Do not add any text or markdown formatting before or after the JSON.`,
  prompt: `Please generate flashcards in {{language}} from the following text:
  
  {{{text}}}
  `,
});

const generateFlashcardsFlow = ai.defineFlow(
  {
    name: 'generateFlashcardsFlow',
    inputSchema: GenerateFlashcardsInputSchema,
    outputSchema: GenerateFlashcardsOutputSchema,
  },
  async input => {
    const {output} = await flashcardPrompt(input);
    if (!output) {
        throw new Error('The AI failed to generate a valid response that matches the expected format.');
    }
    return output;
  }
);

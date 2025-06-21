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
  prompt: `You are an expert educator skilled at creating flashcards from text.

  Given the following text, generate a set of flashcards that cover the core concepts. Each flashcard should have a question and an answer.

  The user has requested the flashcards to be in {{language}}. You MUST translate both the question and answer for each flashcard to {{language}}.

  Text: {{{text}}}

  Your output MUST be a JSON object with two keys:
  1. "flashcards": An array of flashcard objects, where each object has a "question" and an "answer" field.
  2. "progress": A short, one-sentence summary of what you have generated.
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
    return output!;
  }
);

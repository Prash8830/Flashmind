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
});
export type GenerateFlashcardsInput = z.infer<typeof GenerateFlashcardsInputSchema>;

const GenerateFlashcardsOutputSchema = z.object({
  flashcards: z.array(
    z.object({
      question: z.string().describe('The flashcard question.'),
      answer: z.string().describe('The flashcard answer.'),
    })
  ).describe('The generated flashcards in JSON format.'),
  progress: z.string().describe('Progress message for flashcard generation')
});
export type GenerateFlashcardsOutput = z.infer<typeof GenerateFlashcardsOutputSchema>;

export async function generateFlashcards(input: GenerateFlashcardsInput): Promise<GenerateFlashcardsOutput> {
  return generateFlashcardsFlow(input);
}

const flashcardPrompt = ai.definePrompt({
  name: 'flashcardPrompt',
  input: {schema: GenerateFlashcardsInputSchema},
  output: {schema: GenerateFlashcardsOutputSchema},
  prompt: `You are an expert educator skilled at creating flashcards from text.

  Given the following text, generate a set of flashcards that cover the core concepts. Each flashcard should have a question and an answer.

  Text: {{{text}}}

  Format the output as a JSON array of flashcards, where each flashcard has a "question" and an "answer" field.
  Include a short, one-sentence summary of what you have generated to the 'progress' field in the output.
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

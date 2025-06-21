'use server';
/**
 * @fileOverview Flow to explain the answer to a quiz question.
 *
 * - explainQuestion - A function that provides a one-sentence explanation for a question.
 * - ExplainQuestionInput - The input type for the explainQuestion function.
 * - ExplainQuestionOutput - The return type for the explainQuestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplainQuestionInputSchema = z.object({
  question: z.string().describe('The quiz question to explain.'),
});
export type ExplainQuestionInput = z.infer<typeof ExplainQuestionInputSchema>;

const ExplainQuestionOutputSchema = z.object({
  explanation: z
    .string()
    .describe('A one-sentence explanation of the answer to the question.'),
});
export type ExplainQuestionOutput = z.infer<typeof ExplainQuestionOutputSchema>;

export async function explainQuestion(
  input: ExplainQuestionInput
): Promise<ExplainQuestionOutput> {
  return explainQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainQuestionPrompt',
  input: {schema: ExplainQuestionInputSchema},
  output: {schema: ExplainQuestionOutputSchema},
  prompt: `You are an expert educator. Provide a concise, one-sentence explanation for the answer to the following question.

Question: {{{question}}}`,
});

const explainQuestionFlow = ai.defineFlow(
  {
    name: 'explainQuestionFlow',
    inputSchema: ExplainQuestionInputSchema,
    outputSchema: ExplainQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

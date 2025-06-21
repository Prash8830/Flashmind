'use server';
/**
 * @fileOverview Flow to evaluate a user's answer in a quiz.
 *
 * - evaluateAnswer - A function that compares a user's answer to the correct answer.
 * - EvaluateAnswerInput - The input type for the evaluateAnswer function.
 * - EvaluateAnswerOutput - The return type for the evaluateAnswer function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EvaluateAnswerInputSchema = z.object({
  question: z.string().describe('The quiz question that was asked.'),
  correctAnswer: z
    .string()
    .describe('The correct answer to the question.'),
  userAnswer: z.string().describe("The user's provided answer."),
});
export type EvaluateAnswerInput = z.infer<typeof EvaluateAnswerInputSchema>;

const EvaluateAnswerOutputSchema = z.object({
  isCorrect: z
    .boolean()
    .describe('Whether the user answer is semantically correct.'),
  feedback: z
    .string()
    .describe(
      'A brief, one-sentence feedback for the user on their answer.'
    ),
});
export type EvaluateAnswerOutput = z.infer<typeof EvaluateAnswerOutputSchema>;

export async function evaluateAnswer(
  input: EvaluateAnswerInput
): Promise<EvaluateAnswerOutput> {
  return evaluateAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'evaluateAnswerPrompt',
  input: {schema: EvaluateAnswerInputSchema},
  output: {schema: EvaluateAnswerOutputSchema},
  prompt: `You are a quiz evaluator. A user was asked a question and provided an answer. Compare their answer to the correct answer. The user's answer does not need to be a perfect match, but it should be semantically correct.

Respond with whether the answer is correct (isCorrect) and provide brief, one-sentence feedback (feedback).

Question: {{{question}}}
Correct Answer: {{{correctAnswer}}}
User's Answer: {{{userAnswer}}}`,
});

const evaluateAnswerFlow = ai.defineFlow(
  {
    name: 'evaluateAnswerFlow',
    inputSchema: EvaluateAnswerInputSchema,
    outputSchema: EvaluateAnswerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

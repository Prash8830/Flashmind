import { config } from 'dotenv';
config();

import '@/ai/flows/generate-flashcards.ts';
import '@/ai/flows/customize-flashcard-generation.ts';
import '@/ai/flows/evaluate-answer.ts';
import '@/ai/flows/explain-question.ts';

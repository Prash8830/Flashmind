"use client";

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface FlashcardProps {
  question: string;
  answer: string;
  index: number;
}

export function Flashcard({ question, answer, index }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const animationDelay = `${index * 100}ms`;

  return (
    <div
      className="group [perspective:1000px] animate-in fade-in-0 zoom-in-95"
      style={{ animationDelay, animationFillMode: 'backwards' }}
      onClick={() => setIsFlipped(!isFlipped)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsFlipped(!isFlipped)}
      role="button"
      tabIndex={0}
      aria-label={`Flashcard ${index + 1}. Question: ${question}. Click or press enter to see the answer.`}
    >
      <Card
        className={cn(
          'relative h-64 w-full rounded-lg shadow-md transform-style-3d transition-transform duration-700 cursor-pointer',
          { '[transform:rotateY(180deg)]': isFlipped }
        )}
      >
        <div className="absolute backface-hidden w-full h-full p-6 flex flex-col justify-center items-center text-center">
          <p className="text-sm text-muted-foreground font-headline">Question</p>
          <p className="mt-2 text-lg font-body">{question}</p>
        </div>
        <div className="absolute backface-hidden w-full h-full p-6 flex flex-col justify-center items-center text-center [transform:rotateY(180deg)] bg-card-foreground/[.05] rounded-lg">
          <p className="text-sm text-muted-foreground font-headline">Answer</p>
          <p className="mt-2 text-lg font-body">{answer}</p>
        </div>
      </Card>
    </div>
  );
}

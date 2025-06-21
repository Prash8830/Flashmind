'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, Send, XCircle, HelpCircle } from 'lucide-react';
import { type GenerateFlashcardsOutput } from '@/ai/flows/generate-flashcards';
import { evaluateAnswer } from '@/ai/flows/evaluate-answer';
import { explainQuestion } from '@/ai/flows/explain-question';
import { QuizResults } from './quiz-results';

type FlashcardType = GenerateFlashcardsOutput['flashcards'][0];

interface QuizModeProps {
  flashcards: FlashcardType[];
  onExitQuiz: () => void;
}

export function QuizMode({ flashcards, onExitQuiz }: QuizModeProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isChecking, startChecking] = useTransition();
  const [isExplaining, startExplaining] = useTransition();
  const [lastResult, setLastResult] = useState<{ isCorrect: boolean; feedback: string } | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const { toast } = useToast();

  const currentQuestion = flashcards[currentQuestionIndex];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) {
      toast({ title: 'No Answer', description: 'Please provide an answer.', variant: 'destructive' });
      return;
    }

    setLastResult(null);
    startChecking(async () => {
      try {
        const result = await evaluateAnswer({
          question: currentQuestion.question,
          correctAnswer: currentQuestion.answer,
          userAnswer: userAnswer,
        });

        if (result.isCorrect) {
          setScore(prev => prev + 1);
        }
        setLastResult(result);
      } catch (error) {
        console.error('Error evaluating answer:', error);
        toast({ title: 'Evaluation Failed', description: 'Could not check your answer. Please try again.', variant: 'destructive' });
      }
    });
  };

  const handleExplainQuestion = () => {
    if (!currentQuestion) return;
    setExplanation(null);
    startExplaining(async () => {
      try {
        const result = await explainQuestion({
          question: currentQuestion.question,
        });
        if (result && result.explanation) {
          setExplanation(result.explanation);
        } else {
          throw new Error('Invalid explanation response from AI.');
        }
      } catch (error) {
        console.error('Error getting explanation:', error);
        toast({
          title: 'Explanation Failed',
          description: 'Could not get an explanation for this question.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleNextQuestion = () => {
    setLastResult(null);
    setUserAnswer('');
    setExplanation(null);
    if (currentQuestionIndex < flashcards.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };
  
  const handleRestart = () => {
      setCurrentQuestionIndex(0);
      setScore(0);
      setUserAnswer('');
      setQuizFinished(false);
      setLastResult(null);
      setExplanation(null);
  }

  if (quizFinished) {
    return <QuizResults score={score} totalQuestions={flashcards.length} onRestart={handleRestart} onExit={onExitQuiz} />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto mt-12">
      <Card className="shadow-2xl shadow-primary/30 animate-in fade-in-0 zoom-in-95">
        <CardHeader className="p-6">
          <CardTitle className="font-headline text-xl md:text-2xl text-center">
            Question {currentQuestionIndex + 1} / {flashcards.length}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 px-6 pb-6">
          <div className="text-center p-8 bg-card rounded-lg border border-primary/20 min-h-[120px] flex items-center justify-center">
            <p className="text-xl font-body">{currentQuestion.question}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              placeholder="Type your answer..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="text-center text-lg h-12"
              disabled={isChecking || !!lastResult}
            />
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground glow-accent" size="lg" disabled={isChecking || !!lastResult}>
              {isChecking ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
              Submit Answer
            </Button>
          </form>

          {isChecking && (
            <div className="flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin text-accent text-glow-accent" />Evaluating...</div>
          )}

          {lastResult && (
            <div className="text-center p-4 rounded-lg animate-in fade-in-0 space-y-4" style={{ backgroundColor: lastResult.isCorrect ? 'hsla(var(--primary)/0.1)' : 'hsla(var(--destructive)/0.1)' }}>
              <div className="flex items-center justify-center gap-2">
                {lastResult.isCorrect ? <CheckCircle className="h-6 w-6 text-primary" /> : <XCircle className="h-6 w-6 text-destructive" />}
                <p className="text-lg font-bold" style={{ color: lastResult.isCorrect ? 'hsl(var(--primary))' : 'hsl(var(--destructive))' }}>
                  {lastResult.isCorrect ? 'Correct!' : 'Incorrect'}
                </p>
              </div>
              <p className="text-muted-foreground">{lastResult.feedback}</p>
              <p className="text-sm">
                <span className="font-bold">Correct Answer: </span>
                <span className="text-muted-foreground">{currentQuestion.answer}</span>
              </p>

              {!explanation && !isExplaining && (
                <Button onClick={handleExplainQuestion} variant="ghost" size="sm" disabled={isExplaining}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Why?
                </Button>
              )}
              {isExplaining && (
                 <div className="flex items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Getting explanation...</div>
              )}
              {explanation && (
                <div className="p-3 bg-card rounded-md border border-input text-left animate-in fade-in-0">
                  <p className="font-bold text-sm text-primary">Explanation</p>
                  <p className="text-muted-foreground mt-1">{explanation}</p>
                </div>
              )}

              <Button onClick={handleNextQuestion} className="w-full glow-on-hover" variant="outline" size="lg">
                {currentQuestionIndex < flashcards.length - 1 ? 'Next Question' : 'Finish Quiz'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="text-center mt-4 font-headline text-lg">Score: <span className="text-primary text-glow-accent">{score}</span></div>
    </div>
  );
}

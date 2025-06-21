
'use client';

import { useState, useTransition } from 'react';
import { Award, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addScoreToLeaderboard } from '@/services/firestore';

interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  onRestart: () => void;
  onExit: () => void;
}

export function QuizResults({ score, totalQuestions, onRestart, onExit }: QuizResultsProps) {
  const [name, setName] = useState('');
  const [isSubmitting, startSubmitting] = useTransition();
  const [isScoreSubmitted, setIsScoreSubmitted] = useState(false);
  const { toast } = useToast();
  const percentage = Math.round((score / totalQuestions) * 100);

  const handleSubmitScore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Name Required', description: 'Please enter your name.', variant: 'destructive' });
      return;
    }

    startSubmitting(async () => {
      try {
        await addScoreToLeaderboard(name, score, totalQuestions);
        toast({ title: 'Score Submitted!', description: 'Your score has been added to the leaderboard.' });
        setIsScoreSubmitted(true);
      } catch (error) {
        console.error('Error submitting score:', error);
        toast({ title: 'Submission Failed', description: 'Could not save your score.', variant: 'destructive' });
      }
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 animate-in fade-in-0 zoom-in-95">
      <Card className="shadow-2xl shadow-accent/30">
        <CardHeader className="text-center p-8">
          <div className="mx-auto bg-accent/20 text-accent rounded-full p-3 w-fit mb-4">
            <Award className="h-8 w-8" />
          </div>
          <CardTitle className="font-headline text-3xl md:text-4xl tracking-widest uppercase">Quiz Complete!</CardTitle>
          <CardDescription className="font-body text-base mt-2">
            You've completed the knowledge assessment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8 text-center">
          <div className="space-y-2">
            <p className="font-body text-lg text-muted-foreground">Your Score</p>
            <p className="font-headline text-6xl text-glow-accent">{score} / {totalQuestions}</p>
            <p className="font-body text-2xl text-primary">{percentage}%</p>
          </div>

          {isScoreSubmitted ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 border-t border-border">
              <Button onClick={onRestart} className="w-full sm:w-auto glow-on-hover" variant="outline" size="lg">
                Try Again
              </Button>
              <Button onClick={onExit} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground glow-accent" size="lg">
                Finish
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmitScore} className="space-y-4 pt-4 border-t border-border">
              <p className="font-body text-lg">Enter your name for the leaderboard!</p>
               <Input
                  type="text"
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-center h-12 text-lg"
                  disabled={isSubmitting}
                />
                <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground glow-accent" disabled={isSubmitting} size="lg">
                  {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                  {isSubmitting ? 'Submitting...' : 'Save Score'}
                </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

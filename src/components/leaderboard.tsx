'use client';

import { useEffect, useState } from 'react';
import { Trophy, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export interface LeaderboardEntry {
  name: string;
  score: number;
  createdAt: string;
}

export function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      const data = localStorage.getItem('quizResults');
      if (data) {
        const parsedData = JSON.parse(data) as LeaderboardEntry[];
        setLeaderboard(parsedData.reverse());
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard from localStorage", error);
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8 shadow-2xl shadow-primary/20 animate-in fade-in-0 zoom-in-95">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/20 text-primary rounded-full p-3 w-fit mb-4">
          <Trophy className="h-8 w-8" />
        </div>
        <CardTitle className="font-headline text-3xl tracking-widest uppercase">Leaderboard</CardTitle>
        <CardDescription className="font-body text-base mt-2">
          Last 5 Scores
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary"/>
          </div>
        ) : leaderboard.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-headline">Name</TableHead>
                <TableHead className="text-right font-headline">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((entry) => (
                <TableRow key={entry.createdAt}>
                  <TableCell>{entry.name}</TableCell>
                  <TableCell className="text-right font-bold text-lg text-primary">{entry.score}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">No scores yet. Be the first!</p>
        )}
      </CardContent>
    </Card>
  );
}

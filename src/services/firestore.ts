
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

export interface LeaderboardEntry {
  id?: string;
  name: string;
  score: number;
  createdAt: any;
}

export async function addScoreToLeaderboard(name: string, score: number): Promise<void> {
  try {
    await addDoc(collection(db, 'quizResults'), {
      name,
      score,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error adding document: ", error);
    throw new Error('Could not save score to leaderboard.');
  }
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const q = query(collection(db, "quizResults"), orderBy("score", "desc"), limit(5));
    const querySnapshot = await getDocs(q);
    const leaderboard: LeaderboardEntry[] = [];
    querySnapshot.forEach((doc) => {
      leaderboard.push({ id: doc.id, ...doc.data() } as LeaderboardEntry);
    });
    return leaderboard;
  } catch (error) {
    console.error("Error fetching leaderboard: ", error);
    return [];
  }
}

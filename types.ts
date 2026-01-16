
export interface Team {
  id: string;
  name: string;
  colors: string;
  secondary: string;
  logoText: string;
  logo: string;
}

export interface Player {
  id: number;
  name: string;
  teamId: string;
  wins: number;
  losses: number;
  avatar: string;
  isQualified?: boolean;
  group?: string; // Persistent group identifier (A, B, C, etc.)
  alignment?: { x: number; y: number };
}

export interface Match {
  id: string;
  player1Id: number;
  player2Id: number;
  score1: number;
  score2: number;
  timestamp: number;
}

export interface Fixture {
  id: string;
  p1Id: number;
  p2Id: number;
  score1?: number;
  score2?: number;
  status: 'scheduled' | 'finished';
  timestamp: number;
}

export enum ViewMode {
  ROSTER = 'ROSTER',
  LEADERBOARD = 'LEADERBOARD',
  STATS = 'STATS',
  GROUPS = 'GROUPS',
  FIXTURES = 'FIXTURES'
}

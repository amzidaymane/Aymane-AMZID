
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
  isForfeited?: boolean;
  group?: string;
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
  score1?: number | null;
  score2?: number | null;
  status: 'scheduled' | 'finished';
  timestamp: number;
  dayLabel: string;      // Mandatory for strict schedule
  matchNumber: number;   // Mandatory for strict schedule
  category?: 'group' | 'playoff' | 'knockout'; // Game category for Arena display
}

export type KnockoutRound = 'THIRD_PLAYOFF' | 'R16' | 'QF' | 'SF' | 'F';
export type KnockoutMatch = {
  id: string;
  round: KnockoutRound;
  order: number; // display order inside round
  p1Id: number | null; // null means empty slot
  p2Id: number | null; // null means empty slot
  score1?: number | null;
  score2?: number | null;
  winnerId?: number | null;
  status: 'scheduled' | 'finished';
};

export interface PlayoffFixture {
  id: string;
  playoffGroup: 1 | 2;
  p1Id: number;
  p2Id: number;
  score1?: number | null;
  score2?: number | null;
  status: 'scheduled' | 'finished';
}

export enum ViewMode {
  ROSTER = 'ROSTER',
  LEADERBOARD = 'LEADERBOARD',
  STATS = 'STATS',
  GROUPS = 'GROUPS',
  FIXTURES = 'FIXTURES',
  KNOCKOUT = 'KNOCKOUT',
  PLAYOFF = 'PLAYOFF',
}


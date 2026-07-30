import { FabHero } from './fab-hero';

export type FabGameMode = 'two-on-two' | 'brawl' | 'tournament';

export interface FabPlayer {
  id: string;
  name: string;
  hero: FabHero;
}

export interface FabTeam {
  id: string;
  name: string;
  players: FabPlayer[];
  isStartingTeam: boolean;
}

export interface FabTournamentMatch {
  id: string;
  roundIndex: number;
  matchIndex: number;
  player1: FabPlayer | null;
  player2: FabPlayer | null;
  winner: FabPlayer | null;
  loser: FabPlayer | null;
  isBye: boolean;
  nextWinnerMatchId: string | null;
  nextWinnerSlot: 'player1' | 'player2' | null;
  nextLoserMatchId: string | null;
  nextLoserSlot: 'player1' | 'player2' | null;
}

export interface FabTournamentRound {
  id: string;
  name: string;
  isConsolation: boolean;
  matches: FabTournamentMatch[];
}

export interface FabTournamentState {
  rounds: FabTournamentRound[];
  champion: FabPlayer | null;
}

/** Data returned from the create-fab-match dialog. */
export interface FabMatchConfig {
  gameMode: FabGameMode;
  playerNames: string[];
  enabledHeroes: FabHero[];
}

/** Fully-built match passed to the fab-match route. */
export interface FabMatch {
  id: string;
  gameMode: FabGameMode;
  players: FabPlayer[];
  teams?: FabTeam[];
  tournament?: FabTournamentState;
}

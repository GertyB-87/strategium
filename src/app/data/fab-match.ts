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

export function isFabMatchConfig(value: unknown): value is FabMatchConfig {
  if (!value || typeof value !== 'object') return false;
  const config = value as Partial<FabMatchConfig>;
  if (!Array.isArray(config.playerNames) || !Array.isArray(config.enabledHeroes)) return false;
  const count = config.playerNames.length;
  const validCount = config.gameMode === 'two-on-two' ? count === 4
    : config.gameMode === 'brawl' ? count >= 2 && count <= 10
    : config.gameMode === 'tournament' && [2, 4, 8, 16].includes(count);
  return validCount && config.playerNames.every(name => typeof name === 'string' && !!name.trim())
    && config.enabledHeroes.every(isFabHero)
    && new Set(config.enabledHeroes.map(hero => hero.id)).size >= count;
}

export function isFabMatch(value: unknown): value is FabMatch {
  if (!value || typeof value !== 'object') return false;
  const match = value as Partial<FabMatch>;
  if (typeof match.id !== 'string' || !Array.isArray(match.players)
    || !match.players.every(isFabPlayer)
    || new Set(match.players.map(player => player.id)).size !== match.players.length) return false;
  const count = match.players.length;
  if (match.gameMode === 'brawl') return count >= 2 && count <= 10;
  if (match.gameMode === 'two-on-two') {
    return count === 4 && Array.isArray(match.teams) && match.teams.length === 2
      && match.teams.every(team => team && typeof team.id === 'string'
        && typeof team.name === 'string' && typeof team.isStartingTeam === 'boolean'
        && Array.isArray(team.players) && team.players.length === 2 && team.players.every(isFabPlayer));
  }
  return match.gameMode === 'tournament' && [2, 4, 8, 16].includes(count)
    && !!match.tournament && Array.isArray(match.tournament.rounds)
    && match.tournament.rounds.length > 0
    && match.tournament.rounds.every(round => round && typeof round.id === 'string'
      && typeof round.name === 'string' && typeof round.isConsolation === 'boolean'
      && Array.isArray(round.matches) && round.matches.every(isTournamentMatch))
    && (match.tournament.champion === null || isFabPlayer(match.tournament.champion));
}

function isFabHero(value: unknown): value is FabHero {
  if (!value || typeof value !== 'object') return false;
  const hero = value as Partial<FabHero>;
  return typeof hero.id === 'string' && typeof hero.name === 'string'
    && typeof hero.class === 'string' && typeof hero.description === 'string';
}

function isFabPlayer(value: unknown): value is FabPlayer {
  if (!value || typeof value !== 'object') return false;
  const player = value as Partial<FabPlayer>;
  return typeof player.id === 'string' && typeof player.name === 'string' && isFabHero(player.hero);
}

function isTournamentMatch(value: unknown): value is FabTournamentMatch {
  if (!value || typeof value !== 'object') return false;
  const match = value as Partial<FabTournamentMatch>;
  return typeof match.id === 'string' && Number.isInteger(match.roundIndex)
    && Number.isInteger(match.matchIndex) && typeof match.isBye === 'boolean'
    && [match.player1, match.player2, match.winner, match.loser]
      .every(player => player === null || isFabPlayer(player))
    && [match.nextWinnerMatchId, match.nextLoserMatchId]
      .every(id => id === null || typeof id === 'string')
    && [match.nextWinnerSlot, match.nextLoserSlot]
      .every(slot => slot === null || slot === 'player1' || slot === 'player2');
}

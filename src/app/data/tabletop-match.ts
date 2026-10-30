import { TableTopPlayer } from "./tabletop-player";

export interface TableTopMatch {
  id: string;
  name: string;
  oprDoctrines: boolean;
  round: number;
  players: TableTopPlayer[];
  status: 'pending' | 'ongoing' | 'completed';
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function isTableTopMatch(value: unknown): value is TableTopMatch {
  if (!value || typeof value !== 'object') return false;
  const match = value as Partial<TableTopMatch>;
  return typeof match.id === 'string'
    && typeof match.name === 'string'
    && typeof match.oprDoctrines === 'boolean'
    && typeof match.round === 'number' && Number.isInteger(match.round) && match.round >= 0 && match.round <= 5
    && ['pending', 'ongoing', 'completed'].includes(match.status ?? '')
    && !!match.createdAt && Number.isFinite(new Date(match.createdAt).getTime())
    && !!match.updatedAt && Number.isFinite(new Date(match.updatedAt).getTime())
    && Array.isArray(match.players) && match.players.length >= 2
    && match.players.every(player => player && typeof player.id === 'string'
      && typeof player.name === 'string' && typeof player.faction === 'string'
      && [player.currentCommandPoints, player.initialCommandPoints,
        player.currentVictoryPoints, player.initialVictoryPoints]
        .every(points => typeof points === 'number' && Number.isFinite(points) && points >= 0));
}

export function restoreTableTopMatch(value: unknown): TableTopMatch | null {
  if (!value || typeof value !== 'object') return null;
  const saved = value as Record<string, unknown>;
  if (!Array.isArray(saved['players'])) return null;
  const normalized = {
    ...saved,
    players: saved['players'].map((value: unknown) => {
      if (!value || typeof value !== 'object') return value;
      const player = value as Record<string, unknown>;
      return {
        ...player,
        initialCommandPoints: restorePoints(player['initialCommandPoints']),
        currentCommandPoints: restorePoints(player['currentCommandPoints']),
        initialVictoryPoints: restorePoints(player['initialVictoryPoints']),
        currentVictoryPoints: restorePoints(player['currentVictoryPoints']),
      };
    }),
  };
  return isTableTopMatch(normalized) ? normalized : null;
}

function restorePoints(value: unknown): unknown {
  return typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;
}
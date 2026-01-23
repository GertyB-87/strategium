import { TableTopPlayer } from "./tabletop-player";

export interface TableTopMatch {
  id: string;
  name: string;
  oprDoctrines: boolean;
  round: number;
  players: TableTopPlayer[];
  status: 'pending' | 'ongoing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
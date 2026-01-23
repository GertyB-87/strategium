import { Doctrine } from "./doctrines";

export interface TableTopPlayer {
    id: string;
    name: string;
    initialVictoryPoints: number;
    currentVictoryPoints: number;
    isActive: boolean;
    initialCommandPoints: number;
    currentCommandPoints: number;
    faction: string;
    createdAt: Date;
    updatedAt: Date;
    notes?: string;
    currentDoctrine?: Doctrine;
}
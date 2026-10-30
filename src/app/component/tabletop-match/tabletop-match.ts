import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { interval, map } from 'rxjs';
import { LocalStorageService } from '../../local-storage-service';
import { restoreTableTopMatch, TableTopMatch } from '../../data/tabletop-match';
import { Doctrine } from '../../data/doctrines';
import doctrinesJson from '../../data/doctrines.json';

@Component({
  selector: 'tabletop-match',
  imports: [DatePipe, MatIconModule, MatSelectModule],
  templateUrl: './tabletop-match.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./tabletop-match.scss'],
})
export class TabletopMatchComponent {
  private readonly storage = inject(LocalStorageService);
  private readonly router = inject(Router);
  private readonly now = toSignal(interval(15000).pipe(map(() => Date.now())), {
    initialValue: Date.now(),
  });

  readonly match = signal<TableTopMatch | null>(null);
  readonly doctrinesList: Doctrine[] = doctrinesJson.doctrines;
  readonly duration = computed(() => {
    const now = new Date(this.now());
    const createdAt = this.match()?.createdAt;
    const started = createdAt ? new Date(createdAt).getTime() : this.now();
    const minutes = Math.max(0, Math.floor((this.now() - started) / 60000));
    return `${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} | ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  });

  constructor() {
    const navigationMatch = restoreTableTopMatch(this.router.currentNavigation()?.extras.state?.['match']);
    const saved = restoreTableTopMatch(this.storage.getItem<unknown>('match'));
    const stored = navigationMatch && (!saved || saved.id !== navigationMatch.id)
      ? navigationMatch
      : saved;
    if (!stored) {
      void this.router.navigate(['/']);
      return;
    }
    const match: TableTopMatch = {
      ...stored,
      status: stored.status === 'pending' ? 'ongoing' : stored.status,
    };
    this.match.set(match);
    this.storage.setItem('match', match);
  }

  changePlayerValue(key: 'commandPoints' | 'victoryPoints', playerIndex: number, delta: number): void {
    if (!this.match()?.players[playerIndex] || !Number.isFinite(delta)) return;
    const field = key === 'commandPoints' ? 'currentCommandPoints' : 'currentVictoryPoints';
    this.updateMatch(match => ({
      ...match,
      players: match.players.map((player, index) => index === playerIndex
        ? { ...player, [field]: Math.max(0, player[field] + delta), updatedAt: new Date() }
        : player),
    }));
  }

  changeRound(): void {
    this.updateMatch(match => ({ ...match, round: (match.round + 1) % 6 }));
  }

  resetMatch(): void {
    this.updateMatch(match => ({
      ...match,
      round: 0,
      players: match.players.map(player => ({
        ...player,
        currentCommandPoints: player.initialCommandPoints,
        currentVictoryPoints: player.initialVictoryPoints,
        updatedAt: new Date(),
      })),
    }));
  }

  changePlayerDoctrine(playerIndex: number, doctrine: Doctrine): void {
    if (!this.match()?.players[playerIndex] || !this.doctrinesList.includes(doctrine)) return;
    this.updateMatch(match => ({
      ...match,
      players: match.players.map((player, index) => index === playerIndex
        ? { ...player, currentDoctrine: doctrine, updatedAt: new Date() }
        : player),
    }));
  }

  compareDoctrines(first: Doctrine | null, second: Doctrine | null): boolean {
    return first?.doctrine === second?.doctrine;
  }

  private updateMatch(transform: (match: TableTopMatch) => TableTopMatch): void {
    const current = this.match();
    if (!current) return;
    const updated = { ...transform(current), updatedAt: new Date() };
    this.match.set(updated);
    this.storage.setItem('match', updated);
  }
}

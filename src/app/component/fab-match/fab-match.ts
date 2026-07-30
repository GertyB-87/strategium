import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FabRankingsDialogComponent, RankingEntry } from './fab-rankings-dialog';

import {
  FabMatch,
  FabMatchConfig,
  FabPlayer,
  FabTeam,
  FabTournamentMatch,
  FabTournamentRound,
  FabTournamentState,
} from '../../data/fab-match';
import { FAB_TEAM_NAMES } from '../../data/fab_team_names';
import { LocalStorageService } from '../../local-storage-service';

const STORAGE_KEY = 'fabMatch';

@Component({
  selector: 'app-fab-match',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, MatDialogModule, NgTemplateOutlet, UpperCasePipe],
  templateUrl: './fab-match.html',
  styleUrl: './fab-match.scss',
})
export class FabMatchComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly storage = inject(LocalStorageService);
  private readonly responsive = inject(BreakpointObserver);
  private readonly dialog = inject(MatDialog);

  // Must be captured here (during construction) — getCurrentNavigation() returns
  // null by the time ngOnInit runs because the navigation is already complete.
  private readonly navConfig = inject(Router).getCurrentNavigation()?.extras.state?.[
    'fabMatchConfig'
  ] as FabMatchConfig | undefined;

  isPhone = signal(false);
  isTablet = signal(false);

  match = signal<FabMatch | null>(null);

  // ── Tournament selectors ───────────────────────────────────────────────────

  /** All rounds marked as winners-bracket only. */
  private winnerRounds = computed(() =>
    this.match()?.tournament?.rounds.filter((r) => !r.isConsolation) ?? [],
  );

  /** The Final round (last winner round). */
  finalRound = computed(() => {
    const wr = this.winnerRounds();
    return wr.length > 0 ? wr[wr.length - 1] : null;
  });

  finalMatchId = computed(() => this.finalRound()?.matches[0]?.id ?? null);

  champion = computed(() => this.match()?.tournament?.champion ?? null);

  /**
   * Left-side winner rounds (all rounds minus the final),
   * with only the first half of each round's matches.
   */
  leftBracketRounds = computed(() => {
    const wr = this.winnerRounds();
    if (wr.length < 2) return [];
    return wr.slice(0, -1).map((r) => ({
      ...r,
      matches: r.matches.slice(0, Math.ceil(r.matches.length / 2)),
    }));
  });

  /**
   * Right-side winner rounds (reversed for outside-in display order),
   * with only the second half of each round's matches.
   */
  rightBracketRounds = computed(() => {
    const wr = this.winnerRounds();
    if (wr.length < 2) return [];
    return wr
      .slice(0, -1)
      .map((r) => ({
        ...r,
        matches: r.matches.slice(Math.floor(r.matches.length / 2)),
      }))
      .reverse();
  });

  consolationRounds = computed(
    () => this.match()?.tournament?.rounds.filter((r) => r.isConsolation) ?? [],
  );

  /** True when every match that has both players seated also has a winner. */
  allMatchesComplete = computed(() => {
    const t = this.match()?.tournament;
    if (!t?.champion) return false;
    return t.rounds
      .filter((r) => r.isConsolation)
      .flatMap((r) => r.matches)
      .filter((m) => !!m.player1 && !!m.player2)
      .every((m) => !!m.winner);
  });

  /** Ordered placements, only populated when allMatchesComplete(). */
  rankings = computed((): RankingEntry[] => {
    const t = this.match()?.tournament;
    if (!t || !this.allMatchesComplete()) return [];

    const result: RankingEntry[] = [];
    const push = (place: number, player: FabPlayer | null | undefined) => {
      if (player) result.push({ place, player });
    };

    // 1st & 2nd: final
    const finalM = t.rounds.filter((r) => !r.isConsolation).at(-1)?.matches[0];
    push(1, finalM?.winner);
    push(2, finalM?.loser);

    // 3rd & 4th
    const m3 = t.rounds.find((r) => r.id === 'cr-3rd')?.matches[0];
    push(3, m3?.winner);
    push(4, m3?.loser);

    // 5th-8th
    const r5 = t.rounds.find((r) => r.id === 'cr-5th-7th');
    if (r5) {
      push(5, r5.matches[0]?.winner);
      push(6, r5.matches[0]?.loser);
      push(7, r5.matches[1]?.winner);
      push(8, r5.matches[1]?.loser);
    }

    return result;
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.responsive.observe(Breakpoints.Handset).subscribe((r) => this.isPhone.set(r.matches));
    this.responsive.observe(Breakpoints.Tablet).subscribe((r) => this.isTablet.set(r.matches));

    if (this.navConfig) {
      const built = this.buildMatch(this.navConfig);
      this.match.set(built);
      this.storage.setItem(STORAGE_KEY, built);
      return;
    }

    const stored = this.storage.getItem<FabMatch>(STORAGE_KEY);
    if (stored) {
      this.match.set(stored);
      return;
    }

    this.router.navigate(['/']);
  }

  // ── Match builder ──────────────────────────────────────────────────────────

  private buildMatch(config: FabMatchConfig): FabMatch {
    const heroes = shuffle([...config.enabledHeroes]);
    const usedHeroIds = new Set<string>();

    const players: FabPlayer[] = config.playerNames.map((name) => {
      const hero =
        heroes.find((h) => !usedHeroIds.has(h.id)) ?? heroes[heroes.length - 1];
      usedHeroIds.add(hero.id);
      return { id: uuid(), name, hero };
    });

    const match: FabMatch = { id: uuid(), gameMode: config.gameMode, players };

    if (config.gameMode === 'two-on-two') {
      match.teams = this.buildTeams(players);
    } else if (config.gameMode === 'tournament') {
      match.tournament = this.buildTournament(players);
    }

    return match;
  }

  private buildTeams(players: FabPlayer[]): FabTeam[] {
    const shuffledPlayers = shuffle([...players]);
    const [n1, n2] = shuffle([...FAB_TEAM_NAMES]).slice(0, 2);
    const startingIdx = Math.random() < 0.5 ? 0 : 1;
    return [
      {
        id: uuid(),
        name: n1,
        players: shuffledPlayers.slice(0, 2),
        isStartingTeam: startingIdx === 0,
      },
      {
        id: uuid(),
        name: n2,
        players: shuffledPlayers.slice(2, 4),
        isStartingTeam: startingIdx === 1,
      },
    ];
  }

  private buildTournament(players: FabPlayer[]): FabTournamentState {
    const n = players.length;
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(n, 2))));
    const totalRounds = Math.log2(bracketSize);

    // Shuffle and pad with nulls
    const seeded: (FabPlayer | null)[] = shuffle([...players]);
    while (seeded.length < bracketSize) seeded.push(null);

    // Pre-generate all winner match IDs
    const winnerIds: string[][] = [];
    for (let r = 0; r < totalRounds; r++) {
      const count = bracketSize / Math.pow(2, r + 1);
      winnerIds.push(Array.from({ length: count }, (_, i) => `wm-r${r}-${i}`));
    }

    // Consolation match IDs
    const has3rd = totalRounds >= 2;
    const has5th = totalRounds >= 3;

    // Build winner rounds
    const winnerRounds: FabTournamentRound[] = [];

    for (let r = 0; r < totalRounds; r++) {
      const matchCount = winnerIds[r].length;
      const isLastRound = r === totalRounds - 1;

      const matches: FabTournamentMatch[] = Array.from({ length: matchCount }, (_, m) => {
        const p1 = r === 0 ? seeded[m * 2] : null;
        const p2 = r === 0 ? seeded[m * 2 + 1] : null;
        const isBye = r === 0 && (p1 === null || p2 === null);
        const autoWinner = isBye ? (p1 ?? p2) : null;

        const nextWinId = !isLastRound ? winnerIds[r + 1][Math.floor(m / 2)] : null;
        const nextWinSlot: 'player1' | 'player2' | null = nextWinId
          ? m % 2 === 0
            ? 'player1'
            : 'player2'
          : null;

        // Losers routing
        let nextLoserId: string | null = null;
        let nextLoserSlot: 'player1' | 'player2' | null = null;

        if (!isBye && has3rd && r === totalRounds - 2) {
          // Semi-final losers → 3rd place
          nextLoserId = 'cm-3rd';
          nextLoserSlot = m % 2 === 0 ? 'player1' : 'player2';
        } else if (!isBye && has5th && r === totalRounds - 3) {
          // QF losers → 5th place semis
          nextLoserId = m < matchCount / 2 ? 'cm-5sf1' : 'cm-5sf2';
          nextLoserSlot = m % 2 === 0 ? 'player1' : 'player2';
        }

        return {
          id: winnerIds[r][m],
          roundIndex: r,
          matchIndex: m,
          player1: p1,
          player2: p2,
          winner: autoWinner,
          loser: null,
          isBye,
          nextWinnerMatchId: nextWinId,
          nextWinnerSlot: nextWinSlot,
          nextLoserMatchId: nextLoserId,
          nextLoserSlot,
        };
      });

      const name = this.roundName(r, totalRounds);
      winnerRounds.push({ id: `wr-${r}`, name, isConsolation: false, matches });
    }

    // Propagate byes through winner rounds
    this.propagateByes(winnerRounds);

    // Build consolation rounds
    const consolationRounds: FabTournamentRound[] = [];

    if (has3rd) {
      consolationRounds.push({
        id: 'cr-3rd',
        name: '3rd Place',
        isConsolation: true,
        matches: [
          this.emptyConsolMatch('cm-3rd', 0, 0, null, null, null, null),
        ],
      });
    }

    if (has5th) {
      consolationRounds.push({
        id: 'cr-5th-sf',
        name: '5th Place – Semis',
        isConsolation: true,
        matches: [
          this.emptyConsolMatch('cm-5sf1', 0, 0, 'cm-5th', 'player1', 'cm-7th', 'player1'),
          this.emptyConsolMatch('cm-5sf2', 0, 1, 'cm-5th', 'player2', 'cm-7th', 'player2'),
        ],
      });
      consolationRounds.push({
        id: 'cr-5th-7th',
        name: '5th & 7th Place',
        isConsolation: true,
        matches: [
          this.emptyConsolMatch('cm-5th', 0, 0, null, null, null, null),
          this.emptyConsolMatch('cm-7th', 0, 1, null, null, null, null),
        ],
      });
    }

    return {
      rounds: [...winnerRounds, ...consolationRounds],
      champion: null,
    };
  }

  // ── Tournament interaction ─────────────────────────────────────────────────

  /**
   * Reads the live state of a match directly from the `match()` signal.
   * Used in the template via `@let` so every render cycle gets fresh data.
   */
  liveMatch(matchId: string): FabTournamentMatch | null {
    const rounds = this.match()?.tournament?.rounds;
    if (!rounds) return null;
    return this.findMatch(rounds, matchId);
  }

  pickWinner(matchId: string, slot: 'player1' | 'player2'): void {
    this.match.update((m) => {
      if (!m?.tournament) return m;

      const tournament: FabTournamentState = structuredClone(m.tournament);
      const match = this.findMatch(tournament.rounds, matchId);
      if (!match || match.winner) return m;

      const winner = match[slot];
      if (!winner) return m;
      const loser = slot === 'player1' ? match.player2 : match.player1;
      match.winner = winner;
      match.loser = loser ?? null;

      // Advance winner
      if (match.nextWinnerMatchId && match.nextWinnerSlot) {
        const next = this.findMatch(tournament.rounds, match.nextWinnerMatchId);
        if (next) {
          next[match.nextWinnerSlot] = winner;
          this.checkAndAutoResolveBye(next, tournament.rounds);
        }
      }

      // Send loser to consolation
      if (loser && match.nextLoserMatchId && match.nextLoserSlot) {
        const loserMatch = this.findMatch(tournament.rounds, match.nextLoserMatchId);
        if (loserMatch) {
          loserMatch[match.nextLoserSlot] = loser;
          this.checkAndAutoResolveBye(loserMatch, tournament.rounds);
        }
      }

      // Check for champion
      const lastWinnerRound = tournament.rounds
        .filter((r) => !r.isConsolation)
        .at(-1);
      if (lastWinnerRound?.matches[0]?.winner) {
        tournament.champion = lastWinnerRound.matches[0].winner;
      }

      const updated: FabMatch = { ...m, tournament };
      this.storage.setItem(STORAGE_KEY, updated);
      return updated;
    });
  }

  isMatchReady(match: FabTournamentMatch): boolean {
    return !!(match.player1 && match.player2 && !match.winner && !match.isBye);
  }

  revokeWinner(matchId: string): void {
    this.match.update((m) => {
      if (!m?.tournament) return m;

      const tournament: FabTournamentState = structuredClone(m.tournament);
      this.doRevokeWinner(tournament.rounds, matchId);

      // Re-sync champion in case the final was revoked
      const lastWinnerRound = tournament.rounds.filter((r) => !r.isConsolation).at(-1);
      tournament.champion = lastWinnerRound?.matches[0]?.winner ?? null;

      const updated: FabMatch = { ...m, tournament };
      this.storage.setItem(STORAGE_KEY, updated);
      return updated;
    });
  }

  // ── Navigation & dialogs ───────────────────────────────────────────────────

  goHome(): void {
    this.router.navigate(['/']);
  }

  openRankings(): void {
    this.dialog.open(FabRankingsDialogComponent, {
      data: { rankings: this.rankings() },
      panelClass: 'fab-rankings-dialog-panel',
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Recursively clears the winner of a match and all downstream results
   * that depend on it (next winner slot, consolation slot).
   */
  private doRevokeWinner(rounds: FabTournamentRound[], matchId: string): void {
    const match = this.findMatch(rounds, matchId);
    if (!match || !match.winner) return;

    const prevLoser = match.loser;

    // 1. Cascade revoke through the winner's downstream match
    if (match.nextWinnerMatchId && match.nextWinnerSlot) {
      const nextWin = this.findMatch(rounds, match.nextWinnerMatchId);
      if (nextWin) {
        if (nextWin.winner) this.doRevokeWinner(rounds, nextWin.id);
        nextWin[match.nextWinnerSlot] = null;
        nextWin.isBye = false;
      }
    }

    // 2. Cascade revoke through the loser's consolation match
    if (prevLoser && match.nextLoserMatchId && match.nextLoserSlot) {
      const consolMatch = this.findMatch(rounds, match.nextLoserMatchId);
      if (consolMatch) {
        if (consolMatch.winner) this.doRevokeWinner(rounds, consolMatch.id);
        consolMatch[match.nextLoserSlot] = null;
        consolMatch.isBye = false;
      }
    }

    // 3. Clear this match's result
    match.winner = null;
    match.loser = null;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private propagateByes(rounds: FabTournamentRound[]): void {
    const propagated = new Set<string>();
    let changed = true;
    while (changed) {
      changed = false;
      for (const round of rounds) {
        for (const match of round.matches) {
          if (match.winner && match.nextWinnerMatchId && !propagated.has(match.id)) {
            const next = this.findMatch(rounds, match.nextWinnerMatchId);
            if (next && match.nextWinnerSlot) {
              next[match.nextWinnerSlot] = match.winner;
              propagated.add(match.id);
              if (next.player1 && !next.player2 || !next.player1 && next.player2) {
                next.isBye = true;
                next.winner = next.player1 ?? next.player2 ?? null;
                changed = true;
              }
            }
          }
        }
      }
    }
  }

  private checkAndAutoResolveBye(match: FabTournamentMatch, allRounds: FabTournamentRound[]): void {
    if (
      (match.player1 && !match.player2) ||
      (!match.player1 && match.player2)
    ) {
      match.isBye = true;
      match.winner = match.player1 ?? match.player2 ?? null;
      // propagate this auto-win
      if (match.winner && match.nextWinnerMatchId && match.nextWinnerSlot) {
        const next = this.findMatch(allRounds, match.nextWinnerMatchId);
        if (next) {
          next[match.nextWinnerSlot] = match.winner;
          this.checkAndAutoResolveBye(next, allRounds);
        }
      }
    }
  }

  private findMatch(rounds: FabTournamentRound[], id: string): FabTournamentMatch | null {
    for (const r of rounds) {
      const m = r.matches.find((x) => x.id === id);
      if (m) return m;
    }
    return null;
  }

  private roundName(r: number, total: number): string {
    const fromEnd = total - 1 - r;
    if (fromEnd === 0) return 'Final';
    if (fromEnd === 1) return 'Semifinals';
    if (fromEnd === 2) return 'Quarterfinals';
    return `Round ${r + 1}`;
  }

  private emptyConsolMatch(
    id: string,
    roundIndex: number,
    matchIndex: number,
    nextWinnerMatchId: string | null,
    nextWinnerSlot: 'player1' | 'player2' | null,
    nextLoserMatchId: string | null,
    nextLoserSlot: 'player1' | 'player2' | null,
  ): FabTournamentMatch {
    return {
      id,
      roundIndex,
      matchIndex,
      player1: null,
      player2: null,
      winner: null,
      loser: null,
      isBye: false,
      nextWinnerMatchId,
      nextWinnerSlot,
      nextLoserMatchId,
      nextLoserSlot,
    };
  }
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function uuid(): string {
  return (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2));
}

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FabHero } from '../../../../data/fab-hero';
import { FabGameMode, FabMatchConfig } from '../../../../data/fab-match';
import { FUNNY_NAMES } from '../../../../data/funny-names';
import * as HeroesJson from '../../../../data/fab_heroes.json';

@Component({
  selector: 'app-create-fab-match',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
  ],
  templateUrl: './create-fab-match.html',
  styleUrl: './create-fab-match.scss',
})
export class CreateFabMatchComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateFabMatchComponent>);

  readonly GAME_MODE_LABELS = ['Two-On-Two', 'Brawl', 'Tournament'] as const;
  readonly MAX_PLAYERS = 10;
  readonly TOURNAMENT_SIZES = [2, 4, 8, 16] as const;

  readonly allHeroes: FabHero[] = (HeroesJson as { heroes: FabHero[] }).heroes;

  heroEnabled = signal<Record<string, boolean>>(
    Object.fromEntries(this.allHeroes.map((h) => [h.id, true])),
  );

  gameModeIndex = signal<0 | 1 | 2>(0);

  gameModeLabel = computed(() => this.GAME_MODE_LABELS[this.gameModeIndex()]);

  gameMode = computed((): FabGameMode => {
    const modes: FabGameMode[] = ['two-on-two', 'brawl', 'tournament'];
    return modes[this.gameModeIndex()];
  });

  enabledHeroCount = computed(
    () => Object.values(this.heroEnabled()).filter(Boolean).length,
  );

  brawlPlayerCount = signal(2);
  tournamentPlayerCount = signal(2);

  currentPlayerCount = computed(() => {
    switch (this.gameMode()) {
      case 'two-on-two':
        return 4;
      case 'brawl':
        return this.brawlPlayerCount();
      case 'tournament':
        return this.tournamentPlayerCount();
    }
  });

  canSubmit = computed(
    () => this.enabledHeroCount() >= this.currentPlayerCount(),
  );

  tooFewHeroesMsg = computed(() =>
    this.canSubmit()
      ? null
      : `Need ${this.currentPlayerCount()} heroes enabled, only ${this.enabledHeroCount()} selected.`,
  );

  // ── Forms ──────────────────────────────────────────────────────────────────

  twoOnTwoForm = this.fb.group({
    team1p1: [this.randomName()],
    team1p2: [this.randomName()],
    team2p1: [this.randomName()],
    team2p2: [this.randomName()],
  });

  brawlForm = this.fb.group({
    players: this.fb.array<FormControl<string>>([
      this.fb.control(this.randomName()),
      this.fb.control(this.randomName()),
    ]),
  });

  tournamentForm = this.fb.group({
    players: this.fb.array<FormControl<string>>([
      this.fb.control(this.randomName()),
      this.fb.control(this.randomName()),
    ]),
  });

  get brawlPlayers(): FormArray<FormControl<string>> {
    return this.brawlForm.get('players') as FormArray<FormControl<string>>;
  }

  get tournamentPlayers(): FormArray<FormControl<string>> {
    return this.tournamentForm.get('players') as FormArray<FormControl<string>>;
  }

  ngOnInit(): void {
    // nothing extra needed – random names are set during field init
  }

  // ── Hero pool ──────────────────────────────────────────────────────────────

  toggleHero(heroId: string): void {
    this.heroEnabled.update((prev) => ({ ...prev, [heroId]: !prev[heroId] }));
  }

  toggleAllHeroes(enabled: boolean): void {
    this.heroEnabled.update(() =>
      Object.fromEntries(this.allHeroes.map((h) => [h.id, enabled])),
    );
  }

  // ── Game mode ──────────────────────────────────────────────────────────────

  setGameMode(event: Event): void {
    const val = +(event.target as HTMLInputElement).value as 0 | 1 | 2;
    this.gameModeIndex.set(val);
  }

  // ── Brawl players ──────────────────────────────────────────────────────────

  addBrawlPlayer(): void {
    if (this.brawlPlayers.length < this.MAX_PLAYERS) {
      this.brawlPlayers.push(this.fb.control(this.randomName()));
      this.brawlPlayerCount.update((n) => n + 1);
    }
  }

  removeBrawlPlayer(index: number): void {
    if (this.brawlPlayers.length > 2) {
      this.brawlPlayers.removeAt(index);
      this.brawlPlayerCount.update((n) => n - 1);
    }
  }

  // ── Tournament players ─────────────────────────────────────────────────────

  /** Sets the tournament player list to exactly n players, adding or removing from the end. */
  setTournamentPlayerCount(n: number): void {
    const current = this.tournamentPlayers.length;
    if (n === current) return;
    if (n > current) {
      for (let i = 0; i < n - current; i++) {
        this.tournamentPlayers.push(this.fb.control(this.randomName()));
      }
    } else {
      while (this.tournamentPlayers.length > n) {
        this.tournamentPlayers.removeAt(this.tournamentPlayers.length - 1);
      }
    }
    this.tournamentPlayerCount.set(n);
  }

  // ── Submission ─────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (!this.canSubmit()) return;

    const mode = this.gameMode();
    const enabledHeroes = this.allHeroes.filter((h) => this.heroEnabled()[h.id]);

    let playerNames: string[] = [];
    if (mode === 'two-on-two') {
      const v = this.twoOnTwoForm.value;
      playerNames = [v.team1p1!, v.team1p2!, v.team2p1!, v.team2p2!];
    } else if (mode === 'brawl') {
      playerNames = this.brawlPlayers.value;
    } else {
      playerNames = this.tournamentPlayers.value;
    }

    const result: FabMatchConfig = { gameMode: mode, playerNames, enabledHeroes };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private randomName(): string {
    return FUNNY_NAMES[Math.floor(Math.random() * FUNNY_NAMES.length)];
  }
}

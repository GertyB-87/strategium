import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormArray, FormControl, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { merge } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FabHero } from '../../../../data/fab-hero';
import { FabGameMode, FabMatchConfig } from '../../../../data/fab-match';
import { FUNNY_NAMES } from '../../../../data/funny-names';
import heroesJson from '../../../../data/fab_heroes.json';

@Component({
  selector: 'app-create-fab-match',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatButtonToggleModule,
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
export class CreateFabMatchComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly dialogRef = inject(MatDialogRef<CreateFabMatchComponent, FabMatchConfig>);
  private readonly generatedNames = new Set<string>();

  readonly GAME_MODE_LABELS = ['Two-On-Two', 'Brawl', 'Tournament'] as const;
  readonly MAX_PLAYERS = 10;
  readonly TOURNAMENT_SIZES = [2, 4, 8, 16] as const;

  readonly allHeroes: FabHero[] = heroesJson.heroes;

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

  canSubmit = computed(() => {
    this.formValues();
    const form = this.gameMode() === 'two-on-two' ? this.twoOnTwoForm
      : this.gameMode() === 'brawl' ? this.brawlForm : this.tournamentForm;
    return form.valid && this.enabledHeroCount() >= this.currentPlayerCount();
  });

  tooFewHeroesMsg = computed(() =>
    this.enabledHeroCount() >= this.currentPlayerCount()
      ? null
      : `Need ${this.currentPlayerCount()} heroes enabled, only ${this.enabledHeroCount()} selected.`,
  );

  // ── Forms ──────────────────────────────────────────────────────────────────

  twoOnTwoForm = this.fb.group({
    team1p1: this.createNameControl(),
    team1p2: this.createNameControl(),
    team2p1: this.createNameControl(),
    team2p2: this.createNameControl(),
  });

  brawlForm = this.fb.group({
    players: this.fb.array<FormControl<string>>([
      this.createNameControl(),
      this.createNameControl(),
    ]),
  });

  tournamentForm = this.fb.group({
    players: this.fb.array<FormControl<string>>([
      this.createNameControl(),
      this.createNameControl(),
    ]),
  });

  get brawlPlayers(): FormArray<FormControl<string>> {
    return this.brawlForm.get('players') as FormArray<FormControl<string>>;
  }

  get tournamentPlayers(): FormArray<FormControl<string>> {
    return this.tournamentForm.get('players') as FormArray<FormControl<string>>;
  }

  private readonly formValues = toSignal(merge(
    this.twoOnTwoForm.valueChanges,
    this.brawlForm.valueChanges,
    this.tournamentForm.valueChanges,
  ));

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

  setGameMode(index: number): void {
    if (index === 0 || index === 1 || index === 2) this.gameModeIndex.set(index);
  }

  // ── Brawl players ──────────────────────────────────────────────────────────

  addBrawlPlayer(): void {
    if (this.brawlPlayers.length < this.MAX_PLAYERS) {
      this.brawlPlayers.push(this.createNameControl());
      this.brawlPlayerCount.update((n) => n + 1);
    }
  }

  removeBrawlPlayer(index: number): void {
    if (this.brawlPlayers.length > 2 && index >= 0 && index < this.brawlPlayers.length) {
      this.brawlPlayers.removeAt(index);
      this.brawlPlayerCount.update((n) => n - 1);
    }
  }

  // ── Tournament players ─────────────────────────────────────────────────────

  /** Sets the tournament player list to exactly n players, adding or removing from the end. */
  setTournamentPlayerCount(n: number): void {
    if (!this.TOURNAMENT_SIZES.some(size => size === n)) return;
    const current = this.tournamentPlayers.length;
    if (n === current) return;
    if (n > current) {
      for (let i = 0; i < n - current; i++) {
        this.tournamentPlayers.push(this.createNameControl());
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
      const value = this.twoOnTwoForm.getRawValue();
      playerNames = [value.team1p1, value.team1p2, value.team2p1, value.team2p2];
    } else if (mode === 'brawl') {
      playerNames = this.brawlPlayers.getRawValue();
    } else {
      playerNames = this.tournamentPlayers.getRawValue();
    }

    const result: FabMatchConfig = { gameMode: mode, playerNames: playerNames.map(name => name.trim()), enabledHeroes };
    this.dialogRef.close(result);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private randomName(): string {
    const available = FUNNY_NAMES.filter(name => !this.generatedNames.has(name));
    const pool = available.length ? available : FUNNY_NAMES;
    const name = pool[Math.floor(Math.random() * pool.length)];
    this.generatedNames.add(name);
    return name;
  }

  private createNameControl(): FormControl<string> {
    return this.fb.control(this.randomName(), [
      Validators.required, Validators.pattern(/\S/), Validators.maxLength(80),
    ]);
  }
}

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  ReactiveFormsModule,
  FormArray,
  NonNullableFormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from "@angular/forms";
import { TableTopMatch } from '../../../../data/tabletop-match';
import { FUNNY_FACTIONS, FUNNY_MATCH_NAMES, FUNNY_NAMES } from '../../../../data/funny-names';
import { MatIcon } from '@angular/material/icon';
import { MatAutocompleteTrigger, MatAutocomplete } from "@angular/material/autocomplete";
import { MatOption } from "@angular/material/core";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

type FormPlayer = FormGroup<{
  name: FormControl<string>;
  faction: FormControl<string>;
  initialCommandPoints: FormControl<number>;
}>;

type MatchForm = FormGroup<{
  name: FormControl<string>;
  oprDoctrines: FormControl<boolean>;
  players: FormArray<FormPlayer>;
}>;

@Component({
  selector: 'app-create-tabletop-match',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatOption,
    MatIcon,
    MatCheckboxModule,
    MatTooltipModule,
],
  templateUrl: './create-tabletop-match.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './create-tabletop-match.scss',
})
export class CreateTabletopMatch {
  private readonly fb = inject(NonNullableFormBuilder);
  readonly dialogRef = inject(MatDialogRef<CreateTabletopMatch, TableTopMatch>);
  readonly FUNNY_FACTIONS = FUNNY_FACTIONS;

  readonly matchForm: MatchForm = this.fb.group({
    name: [this.chooseRandomMatchName(), [Validators.required, Validators.pattern(/\S/), Validators.maxLength(120)]],
    oprDoctrines: [false],
    players: this.fb.array<FormPlayer>([], [Validators.required, Validators.minLength(2)]),
  });

  constructor() {
    this.addPlayer();
    this.addPlayer();
  }

  generatePlayer(): FormPlayer {
    const playerForm = this.fb.group({
      name: [this.chooseRandomName(), [Validators.required, Validators.pattern(/\S/), Validators.maxLength(80)]],
      faction: [this.chooseRandomFaction(), [Validators.required, Validators.pattern(/\S/), Validators.maxLength(80)]],
      initialCommandPoints: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    });
    return playerForm;
  }

  addPlayer(): void {
    this.matchForm.controls.players.push(this.generatePlayer());
  }

  removePlayer(index: number): void {
    if (this.matchForm.controls.players.length > 2 && index >= 0) {
      this.matchForm.controls.players.removeAt(index);
    }
  }

  onSubmit(): void {
    if (this.matchForm.invalid) {
      this.matchForm.markAllAsTouched();
      return;
    }
    const value = this.matchForm.getRawValue();
    const now = new Date();
    const match: TableTopMatch = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      name: value.name.trim(),
      oprDoctrines: value.oprDoctrines,
      players: value.players.map(player => {
          return {
            id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
            name: player.name.trim(),
            faction: player.faction.trim(),
            initialCommandPoints: player.initialCommandPoints,
            initialVictoryPoints: 0,
            currentVictoryPoints: 0,
            currentCommandPoints: player.initialCommandPoints,
            isActive: false,
            notes: '',
            createdAt: now,
            updatedAt: now
          };
        }),
      status: 'pending',
      round: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.dialogRef.close(match);
  }

  public onNoClick(): void {
    this.dialogRef.close();
  }

  chooseRandomName() {
    const playersArray = this.matchForm?.controls?.players?.controls;
    const usedNames = Array.isArray(playersArray)
      ? playersArray.map(player => player.controls.name.value)
      : [];
    const availableNames = FUNNY_NAMES.filter(name => !usedNames.includes(name));
    const namesPool = availableNames.length > 0 ? availableNames : FUNNY_NAMES;
    const randomIndex = Math.floor(Math.random() * namesPool.length);
    return namesPool[randomIndex];
  }
  chooseRandomFaction() {
    const randomIndex = Math.floor(Math.random() * FUNNY_FACTIONS.length);
    const randomFaction = FUNNY_FACTIONS[randomIndex];
    return randomFaction;
  }
  chooseRandomMatchName() {
    const randomIndex = Math.floor(Math.random() * FUNNY_MATCH_NAMES.length);
    const randomMatchName = FUNNY_MATCH_NAMES[randomIndex];
    return randomMatchName;
  }
}

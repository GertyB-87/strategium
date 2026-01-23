import { Component, OnInit } from '@angular/core';
import { MatFormFieldModule, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import {
  ReactiveFormsModule,
  FormArray,
  NonNullableFormBuilder,
  FormGroup,
  FormControl
} from "@angular/forms";
import { inject } from '@angular/core';
import { TableTopMatch } from '../../../../data/tabletop-match';
import { JsonPipe, NgClass } from '@angular/common';
import { FUNNY_FACTIONS, FUNNY_MATCH_NAMES, FUNNY_NAMES } from '../../../../data/funny-names';
import { MatIcon } from '@angular/material/icon';
import { CdkAriaLive } from "../../../../../../node_modules/@angular/cdk/types/_a11y-module-chunk";
import { MatAutocompleteTrigger, MatAutocomplete } from "@angular/material/autocomplete";
import { MatOption } from "@angular/material/core";
import { Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

type MatchStatus = TableTopMatch['status'];
const MATCH_STATUSES: MatchStatus[] = ['pending', 'ongoing', 'completed'];

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
    MatFormField,
    MatDialogTitle,
    MatAutocompleteTrigger,
    MatAutocomplete,
    MatOption,
    MatLabel,
    NgClass,
],
  templateUrl: './create-tabletop-match.html',
  styleUrl: './create-tabletop-match.scss',
})
export class CreateTabletopMatch implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  readonly dialogRef = inject(MatDialogRef<CreateTabletopMatch>);
  private router = inject(Router);
  FUNNY_FACTIONS = FUNNY_FACTIONS;
  isPhone: boolean = false;

  constructor(private responsive: BreakpointObserver) {
  }

  ngOnInit(): void {
    this.responsive.observe(Breakpoints.Handset)
      .subscribe(result => {
        this.isPhone = result.matches;
        console.log('isPhone (inside):', this.isPhone);

      });
  }

  matchForm: MatchForm = this.fb.group({
    name: [this.chooseRandomMatchName()],
    oprDoctrines: [false],
    players: this.fb.array<FormPlayer>([this.generatePlayer(), this.generatePlayer()]),
  });

  generatePlayer(): FormPlayer {
    const playerForm = this.fb.group({
      name: [this.chooseRandomName()],
      faction: [this.chooseRandomFaction()],
      initialCommandPoints: [0],
    });
    return playerForm;
  }

  updateCommandPoints(index: number, points: number): void {
    const playerControl = this.matchForm.controls.players.at(index);
    playerControl.controls.initialCommandPoints.setValue(points);
  }

  addPlayer(): void {
    this.matchForm.controls.players.push(this.generatePlayer());
  }

  removePlayer(index: number): void {
    this.matchForm.controls.players.removeAt(index);
  }

  onSubmit() {
    console.log('Match Form Submitted:', this.matchForm.value);
    // this.dialogRef.close(this.matchForm.value);
    // Optionally, you can use Angular router to navigate if needed:
    const match: TableTopMatch = {
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      name: this.matchForm?.value.name ? this.matchForm.value.name : '',
      oprDoctrines: this.matchForm?.value.oprDoctrines ? this.matchForm.value.oprDoctrines : false,
      players: Array.isArray(this.matchForm.value.players)
        ? this.matchForm.value.players.map(player => {
          const now = new Date();
          return {
            id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
            name: player.name ?? '',
            faction: player.faction ?? '',
            initialCommandPoints: player.initialCommandPoints ?? 0,
            initialVictoryPoints: 0,
            currentVictoryPoints: 0,
            currentCommandPoints: player.initialCommandPoints ?? 0,
            isActive: false,
            isEliminated: false,
            notes: '',
            createdAt: now,
            updatedAt: now
          };
        })
        : [],
      status: 'pending',
      round: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.dialogRef.close(match);
  }

  public onNoClick(): void {
    // this.resetForm();
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

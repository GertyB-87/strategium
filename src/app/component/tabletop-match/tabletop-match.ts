import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../local-storage-service';
import { TableTopPlayer } from '../../data/tabletop-player';

type FormPlayer = FormGroup<{
  name: FormControl<string>;
  faction: FormControl<string>;
  initialCommandPoints: FormControl<number>;
}>;

type MatchForm = FormGroup<{
  name: FormControl<string>;
  players: FormArray<FormPlayer>;
}>;

@Component({
  selector: 'tabletop-match',
  imports: [DatePipe],
  templateUrl: './tabletop-match.html',
  styleUrl: './tabletop-match.scss',
})
export class TabletopMatchComponent {

  private localStorageService = inject(LocalStorageService);
  match = inject(Router).getCurrentNavigation()?.extras.state?.['match'];
  numberOfPlayers = 2;

  constructor() {
    console.log('TabletopMatchComponent initialized with match:', this.match);
    console.log('Current Navigation Extras State:', inject(Router).getCurrentNavigation()?.extras.state);
    if (!this.match) {
      const storedMatch = this.localStorageService.getItem('match');
      console.log('Retrieved match from localStorage:', storedMatch);
      if (storedMatch) {
        this.match = storedMatch;
      }
    }
    if (this.match) {
      this.match.status = 'ongoing';
      this.numberOfPlayers = this.match.players.length;
    } 
    this.localStorageService.setItem('match', this.match);
    console.log('Stored match in localStorage:', this.match);

  } 

  changePlayerValue(key: string, playerIndex: number, delta: number) {
    console.log(`Changing value for player ${playerIndex}, key: ${key}, delta: ${delta}`);
    if (this.match && this.match.players && this.match.players[playerIndex]) {
      const player: TableTopPlayer = this.match.players[playerIndex];
      if (key === 'commandPoints') {
        console.log(`Current commandPoints: ${player.currentCommandPoints}`);
        console.log(`Delta: ${delta}`);
        player.currentCommandPoints = (Number(player.currentCommandPoints) || 0) + delta;
        if (player.currentCommandPoints < 0) {
          player.currentCommandPoints = 0;
        }
        this.localStorageService.setItem('match', this.match);
        console.log(`Updated player ${playerIndex} ${key} to ${player.currentCommandPoints}`);
      }
      if (key === 'victoryPoints') {
        player.currentVictoryPoints = (Number(player.currentVictoryPoints) || 0) + delta;
        if (player.currentVictoryPoints < 0) {
          player.currentVictoryPoints = 0;
        }
        this.localStorageService.setItem('match', this.match);
        console.log(`Updated player ${playerIndex} ${key} to ${player.currentVictoryPoints}`);
      } 
    }
  }

  changeRound() {
    console.log(`Changing round by delta: ${1}`); 
    if (this.match) {
      this.match.round = (typeof this.match.round === 'number' ? this.match.round : 1) + 1;
      if (this.match.round > 5) {
        this.match.round = 0;
      }
      this.localStorageService.setItem('match', this.match);
      console.log(`Updated match round to ${this.match.round}`);
    } 
  }

  resetMatch() {
    console.log('Resetting match');
    if (this.match && this.match.players) {
      this.match.players.forEach((player: any, index: number) => {
        player.currentCommandPoints = player.initialCommandPoints || 0;
        player.currentVictoryPoints = 0;
        console.log(`Reset player ${index} commandPoints to ${player.currentCommandPoints} and victoryPoints to ${player.victoryPoints}`);
      });
      this.match.round = 1;
      this.localStorageService.setItem('match', this.match);
      console.log(`Reset match round to ${this.match.round}`);
    }
  }
  currentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

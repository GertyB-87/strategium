import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../local-storage-service';
import { TableTopPlayer } from '../../data/tabletop-player';
import { interval, Subscription } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatIcon, MatIconModule } from "@angular/material/icon";

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
  imports: [DatePipe, NgClass],
  templateUrl: './tabletop-match.html',
  styleUrl: './tabletop-match.scss',
})
export class TabletopMatchComponent implements OnDestroy, OnInit {

  private localStorageService = inject(LocalStorageService);
  private cd = inject(ChangeDetectorRef);
  match = inject(Router).getCurrentNavigation()?.extras.state?.['match'];
  numberOfPlayers = 2;
  duration = '?';
  private timerSub!: Subscription;

  isPhonePortrait = false;
  isPhoneLandscape = false;
  isSmallScreen = false;
  isPhone: boolean = false;
  isTablet: boolean = false;
  isLarge: boolean = false;
  isExraLarge: boolean = false;


  constructor(private responsive: BreakpointObserver) {

    console.log('TabletopMatchComponent initialized with match:', this.match);
    //console.log('Current Navigation Extras State:', inject(Router).getCurrentNavigation()?.extras.state);
    if (!this.match) {
      const storedMatch = this.localStorageService.getItem('match');
      //console.log('Retrieved match from localStorage:', storedMatch);
      if (storedMatch) {
        this.match = storedMatch;
      }
    }
    if (this.match) {
      this.match.status = 'ongoing';
      this.numberOfPlayers = this.match.players.length;
    }
    this.localStorageService.setItem('match', this.match);
    //console.log('Stored match in localStorage:', this.match);

  }

  ngOnInit(): void {
    this.calculateDuration();
    this.timerSub = interval(15000).subscribe(() => {
      this.calculateDuration();
    });
    this.responsive.observe(Breakpoints.HandsetLandscape)
      .subscribe(result => {
        this.isPhoneLandscape = result.matches;
        console.log('isPhoneLandscape (inside):', this.isPhoneLandscape);

      });
    this.responsive.observe(Breakpoints.HandsetPortrait)
      .subscribe(result => {
        this.isPhonePortrait = result.matches;
        console.log('isPhonePortrait (inside):', this.isPhonePortrait);

      });
    this.responsive.observe(Breakpoints.Handset)
      .subscribe(result => {
        this.isPhone = result.matches;
        console.log('isPhone (inside):', this.isPhone);

      });
    this.responsive.observe(Breakpoints.Tablet)
      .subscribe(result => {
        this.isTablet = result.matches;
        console.log('isTablet (inside):', this.isTablet);

      });
      this.responsive.observe(Breakpoints.Large)
      .subscribe(result => {
        this.isLarge = result.matches;
        console.log('Large (inside):', result.matches);

      });
      this.responsive.observe(Breakpoints.XLarge)
      .subscribe(result => {
        this.isExraLarge = result.matches;
        console.log('XLarge (inside):', result.matches);

      });
  }
  ngOnDestroy(): void {
    this.timerSub.unsubscribe();
  }

  changePlayerValue(key: string, playerIndex: number, delta: number) {
    //console.log(`Changing value for player ${playerIndex}, key: ${key}, delta: ${delta}`);
    if (this.match && this.match.players && this.match.players[playerIndex]) {
      const player: TableTopPlayer = this.match.players[playerIndex];
      if (key === 'commandPoints') {
        //console.log(`Current commandPoints: ${player.currentCommandPoints}`);
        //console.log(`Delta: ${delta}`);
        player.currentCommandPoints = (Number(player.currentCommandPoints) || 0) + delta;
        if (player.currentCommandPoints < 0) {
          player.currentCommandPoints = 0;
        }
        this.localStorageService.setItem('match', this.match);
        //console.log(`Updated player ${playerIndex} ${key} to ${player.currentCommandPoints}`);
      }
      if (key === 'victoryPoints') {
        player.currentVictoryPoints = (Number(player.currentVictoryPoints) || 0) + delta;
        if (player.currentVictoryPoints < 0) {
          player.currentVictoryPoints = 0;
        }
        this.localStorageService.setItem('match', this.match);
        //console.log(`Updated player ${playerIndex} ${key} to ${player.currentVictoryPoints}`);
      }
    }
  }

  changeRound() {
    //console.log(`Changing round by delta: ${1}`); 
    if (this.match) {
      this.match.round = (typeof this.match.round === 'number' ? this.match.round : 1) + 1;
      if (this.match.round > 5) {
        this.match.round = 0;
      }
      this.localStorageService.setItem('match', this.match);
      //console.log(`Updated match round to ${this.match.round}`);
    }
  }

  resetMatch() {
    //console.log('Resetting match');
    if (this.match && this.match.players) {
      this.match.players.forEach((player: any, index: number) => {
        player.currentCommandPoints = player.initialCommandPoints || 0;
        player.currentVictoryPoints = 0;
        //console.log(`Reset player ${index} commandPoints to ${player.currentCommandPoints} and victoryPoints to ${player.victoryPoints}`);
      });
      this.match.round = 0;
      this.localStorageService.setItem('match', this.match);
      //console.log(`Reset match round to ${this.match.round}`);
    }
  }
  calculateDuration() {
    const now = new Date();
    let duration = "0m";
    if (this.match?.createdAt) {
      const createdAt = new Date(this.match.createdAt);
      const diffMs = now.getTime() - createdAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(diffMins / 60);
      const minutes = diffMins % 60;
      (now as any).duration = `${hours}h ${minutes}m`;
      duration = `${hours}h ${minutes}m`;
    }
    this.duration = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " | " + duration + "";
    //console.log(`Calculated duration: ${this.duration}`);
    // Manually trigger change detection (app appears to run without zone.js)
    try {
      this.cd.detectChanges();
    } catch (e) {
      // ignore if detectChanges is not available for some reason
      console.warn('Could not call detectChanges():', e);
    }
  }
}

import { DatePipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../local-storage-service';
import { TableTopPlayer } from '../../data/tabletop-player';
import { interval, Subscription } from 'rxjs';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatIconModule, MatIconRegistry } from "@angular/material/icon";
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import * as DoctrinesJson from '../../data/doctrines.json';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { Doctrine, Doctrines } from '../../data/doctrines';
import { DoctrineInfoDialog } from './doctrine-info-dialog';
import { MatButtonModule } from '@angular/material/button';

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
  imports: [DatePipe, NgClass, MatIconModule, MatSelectModule, MatButtonModule, MatDialogModule],
  templateUrl: './tabletop-match.html',
  styleUrls: ['./tabletop-match.scss'],
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
  doctrines: Doctrines = DoctrinesJson as Doctrines;
  doctrinesList = this.doctrines.doctrines.map(d => d);

  readonly router = inject(Router);
  private dialog = inject(MatDialog);

  constructor(private responsive: BreakpointObserver) {
    console.log('TabletopMatchComponent initialized with match:', this.match);
    //console.log('Current Navigation Extras State:', inject(Router).getCurrentNavigation()?.extras.state);
    if (!this.match) {
      const storedMatch = this.localStorageService.getItem('match');
      //console.log('Retrieved match from localStorage:', storedMatch);
      if (storedMatch) {
        this.match = storedMatch;
        console.log('Using match from localStorage:', this.match);
      }
      else {
        console.warn('No match found in navigation state or localStorage. Redirecting to home.');
        this.router.navigate(['/']);
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

  changePlayerDoctrine(playerIndex: number, event: MatSelectChange | null | undefined) {
    const doctrine = (event as any)?.value;
    const player = this.match?.players?.[playerIndex];
    console.log('Selected doctrine:', doctrine, 'for player:', player);
    player.currentDoctrine = doctrine ?? null;
    this.localStorageService.setItem('match', this.match);
  }

  compareDoctrines(d1: Doctrine, d2: Doctrine): boolean {
    return d1 && d2 ? d1.doctrine === d2.doctrine : d1 === d2;
  }

  openDoctrineInfo(doctrine: Doctrine) {
    try {
      this.dialog.open(DoctrineInfoDialog, {
        data: doctrine,
        panelClass: 'doctrine-info-dialog-panel',
      });
    } catch (e) {
      console.warn('Could not open doctrine dialog, falling back to alert', e);
      alert(`Doctrine: ${doctrine.doctrine}\n\nDescription: ${doctrine.stratagems.join('\n')}`);
    }
  }
}

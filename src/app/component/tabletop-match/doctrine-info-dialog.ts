import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Doctrine, Doctrines } from '../../data/doctrines';
import { MatCard, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import * as DoctrinesJson from '../../data/doctrines.json';

@Component({
    selector: 'doctrine-info-dialog',
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatCard, MatCardHeader, MatCardTitle, MatCard,  MatCardContent],
    templateUrl: './doctrine-info-dialog.html',
    styleUrls: ['./doctrine-info-dialog.scss'],
})
export class DoctrineInfoDialog {
    readonly dialogRef = inject<MatDialogRef<DoctrineInfoDialog>>(MatDialogRef);
    readonly data = inject(MAT_DIALOG_DATA) as Doctrine;
    isPhonePortrait = false;
    isPhoneLandscape = false;
    isSmallScreen = false;
    isPhone: boolean = false;
    isTablet: boolean = false;
    isLarge: boolean = false;
    isExraLarge: boolean = false;

  alldoctrines: Doctrines = DoctrinesJson as Doctrines;
    universalDoctrine: Doctrine = this.alldoctrines.doctrines[0];

    constructor(private responsive: BreakpointObserver) {
    }

    ngOnInit(): void {
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

    close(): void {
        this.dialogRef.close();
    }
}

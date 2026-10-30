import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Doctrine } from '../../data/doctrines';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';

@Component({
    selector: 'doctrine-info-dialog',
    imports: [MatDialogModule, MatButtonModule, MatCard, MatCardHeader, MatCardTitle, MatCardContent],
    templateUrl: './doctrine-info-dialog.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styleUrls: ['./doctrine-info-dialog.scss'],
})
export class DoctrineInfoDialog {
    readonly dialogRef = inject<MatDialogRef<DoctrineInfoDialog>>(MatDialogRef);
    readonly data = inject<Doctrine>(MAT_DIALOG_DATA);

    close(): void {
        this.dialogRef.close();
    }
}

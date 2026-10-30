import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CreateTabletopMatch } from './template/create-tabletop-match/create-tabletop-match';
import { CreateFabMatchComponent } from './template/create-fab-match/create-fab-match';
import type { TableTopMatch } from '../../data/tabletop-match';
import type { FabMatchConfig } from '../../data/fab-match';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',

  imports: [MatButtonModule, MatDialogModule, MatIconModule],

  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './home.scss',
})
export class HomeComponent {
  readonly dialog = inject(MatDialog);
  readonly router = inject(Router);

  openCreateTableTopMatchDialog(): void {
    const dialogRef = this.dialog.open<CreateTabletopMatch, undefined, TableTopMatch>(CreateTabletopMatch, {
      panelClass: 'create-tabletop-match-dialog-panel',
      maxWidth: 'calc(100vw - 1rem)',
      maxHeight: 'calc(100dvh - 1rem)',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        void this.router.navigate(['tabletop-match'], { state: { match: result } });
      }
    });
  }

  openCreateFabMatchDialog(): void {
    const dialogRef = this.dialog.open<CreateFabMatchComponent, undefined, FabMatchConfig>(CreateFabMatchComponent, {
      panelClass: 'create-fab-match-dialog-panel',
      maxWidth: 'calc(100vw - 1rem)',
      maxHeight: 'calc(100dvh - 1rem)',
    });

    dialogRef.afterClosed().subscribe((result: FabMatchConfig | undefined) => {
      if (result) {
        void this.router.navigate(['fab-match'], {
          state: {
            fabMatchConfig: result,
            fabMatchId: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
            createNewFabMatch: true,
          },
        });
      }
    });
  }
}

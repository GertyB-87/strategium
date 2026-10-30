import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FabPlayer } from '../../data/fab-match';

export interface RankingEntry {
  place: number;
  player: FabPlayer;
  tied?: boolean;
}

@Component({
  selector: 'app-fab-rankings-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title class="rt">🏅 Tournament Rankings</h2>
    <mat-dialog-content class="rc" tabindex="0" role="region" aria-label="Tournament rankings">
      <ol class="rl">
        @for (entry of data.rankings; track entry.player.id) {
          <li class="ri" [class]="'p' + entry.place">
            <span class="pm">{{ medal(entry.place) }}{{ entry.tied ? ' (tied)' : '' }}</span>
            <span class="rn">{{ entry.player.name }}</span>
            <span class="rh">{{ entry.player.hero.name }}</span>
            <span class="rhc">{{ entry.player.hero.class }}</span>
          </li>
        }
      </ol>
    </mat-dialog-content>
    <mat-dialog-actions align="end" class="ra">
      <button mat-button mat-dialog-close type="button">Close</button>
    </mat-dialog-actions>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; max-height: calc(100dvh - 1rem); }
    .rt { background:#49454e; font-size:1.4rem; margin:0; padding:1rem 1.5rem; }
    .rc { background:#252427; padding:1rem !important; }
    .rl { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:.5rem; }
    .ri {
      display:grid; grid-template-columns:4rem minmax(0, 1fr) minmax(0, 1fr);
      align-items:center; gap:.75rem;
      padding:.7rem 1rem; border-radius:8px;
      background:#1c1b1f; border-left:3px solid #555;
    }
    .ri.p1 { border-left-color:gold; }
    .ri.p2 { border-left-color:silver; }
    .ri.p3 { border-left-color:#cd7f32; }
    .pm { font-size:1rem; grid-row: span 2; }
    .rn { font-weight:600; font-size:.95rem; overflow-wrap:anywhere; }
    .rh { font-size:.8rem; color:#a4ff70; overflow-wrap:anywhere; }
    .rhc { font-size:.75rem; color:#b0b0b0; grid-column:2 / -1; overflow-wrap:anywhere; }
    .ra { background:#49454e; }
    @media (max-width:40rem) {
      .ri { grid-template-columns:3rem minmax(0,1fr); padding:.75rem; gap:.5rem; }
      .rh, .rhc { grid-column:2; }
      .rt { font-size:1.1rem; }
    }
  `],
})
export class FabRankingsDialogComponent {
  readonly data = inject<{ rankings: RankingEntry[] }>(MAT_DIALOG_DATA);

  medal(place: number): string {
    const medals: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
    return medals[place] ?? `${place}.`;
  }
}

import { TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { CreateFabMatchComponent } from './create-fab-match';

describe('CreateFabMatchComponent', () => {
  let component: CreateFabMatchComponent;
  const close = vi.fn();

  beforeEach(() => {
    close.mockClear();
    TestBed.configureTestingModule({
      imports: [CreateFabMatchComponent],
      providers: [{ provide: MatDialogRef, useValue: { close } }],
    });
    component = TestBed.createComponent(CreateFabMatchComponent).componentInstance;
  });

  it('creates valid four-player teams with distinct generated names', () => {
    expect(component.currentPlayerCount()).toBe(4);
    component.onSubmit();
    const result = close.mock.calls[0][0];
    expect(result.gameMode).toBe('two-on-two');
    expect(new Set(result.playerNames).size).toBe(4);
  });

  it('rejects whitespace names and insufficient heroes', () => {
    component.twoOnTwoForm.controls.team1p1.setValue(' ');
    expect(component.canSubmit()).toBe(false);
    component.onSubmit();
    expect(close).not.toHaveBeenCalled();
    component.twoOnTwoForm.controls.team1p1.setValue('Player');
    component.toggleAllHeroes(false);
    expect(component.canSubmit()).toBe(false);
  });

  it('supports all tournament sizes and rejects unsupported counts', () => {
    component.setGameMode(2);
    for (const count of component.TOURNAMENT_SIZES) {
      component.setTournamentPlayerCount(count);
      expect(component.currentPlayerCount()).toBe(count);
      expect(component.tournamentPlayers.length).toBe(count);
    }
    component.setTournamentPlayerCount(0);
    expect(component.tournamentPlayers.length).toBe(16);
  });

  it('keeps brawls within the two-to-ten player range', () => {
    component.setGameMode(1);
    component.removeBrawlPlayer(0);
    expect(component.brawlPlayers.length).toBe(2);
    for (let count = 0; count < 12; count++) component.addBrawlPlayer();
    expect(component.currentPlayerCount()).toBe(10);
    component.removeBrawlPlayer(-1);
    expect(component.currentPlayerCount()).toBe(10);
  });
});
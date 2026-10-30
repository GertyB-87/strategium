import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FabMatchComponent } from './fab-match';
import { FabMatch, FabMatchConfig } from '../../data/fab-match';
import heroesJson from '../../data/fab_heroes.json';

describe('FabMatchComponent', () => {
  let state: Record<string, unknown> | undefined;
  const navigate = vi.fn().mockResolvedValue(true);

  beforeEach(() => {
    state = undefined;
    localStorage.clear();
    navigate.mockClear();
    TestBed.configureTestingModule({
      imports: [FabMatchComponent],
      providers: [{ provide: Router, useValue: {
        currentNavigation: () => state ? { extras: { state } } : null,
        navigate,
      } }],
    });
  });

  afterEach(() => localStorage.clear());

  function createTournament(count: number): FabMatchComponent {
    const config: FabMatchConfig = {
      gameMode: 'tournament', playerNames: Array.from({ length: count }, (_, index) => `Player ${index + 1}`),
      enabledHeroes: heroesJson.heroes,
    };
    state = { fabMatchConfig: config, createNewFabMatch: true, fabMatchId: crypto.randomUUID() };
    const fixture = TestBed.createComponent(FabMatchComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  function finishTournament(component: FabMatchComponent): void {
    for (let step = 0; step < 50; step++) {
      const ready = component.match()?.tournament?.rounds.flatMap(round => round.matches)
        .find(match => component.isMatchReady(match));
      if (!ready) return;
      component.pickWinner(ready.id, 'player1');
    }
    throw new Error('Tournament failed to complete within 50 matches');
  }

  it.each([2, 4, 8, 16])('completes a %i-player bracket with every player ranked once', count => {
    const component = createTournament(count);
    expect(new Set(component.match()?.players.map(player => player.hero.id)).size).toBe(count);
    finishTournament(component);
    expect(component.champion()).toBeTruthy();
    expect(component.allMatchesComplete()).toBe(true);
    expect(component.rankings()).toHaveLength(count);
    expect(new Set(component.rankings().map(entry => entry.player.id)).size).toBe(count);
    if (count === 16) {
      expect(component.rankings().filter(entry => entry.place === 9 && entry.tied)).toHaveLength(8);
    }
  });

  it('does not accept results for an unready final', () => {
    const component = createTournament(4);
    const semifinal = component.match()!.tournament!.rounds[0].matches[0];
    component.pickWinner(semifinal.id, 'player1');
    const before = component.match();
    component.pickWinner(component.finalMatchId()!, 'player1');
    expect(component.match()).toBe(before);
    expect(component.champion()).toBeNull();
    expect(component.liveMatch(component.finalMatchId()!)?.isBye).toBe(false);
  });

  it('revokes dependent winners and the champion, then allows replay', () => {
    const component = createTournament(8);
    finishTournament(component);
    const first = component.match()!.tournament!.rounds[0].matches[0];
    component.revokeWinner(first.id);
    expect(component.champion()).toBeNull();
    expect(component.allMatchesComplete()).toBe(false);
    expect(component.rankings()).toEqual([]);
    finishTournament(component);
    expect(component.allMatchesComplete()).toBe(true);
    expect(component.rankings()).toHaveLength(8);
  });

  it('restores a saved match without reshuffling the roster', () => {
    const original = createTournament(4).match()!;
    const restored = TestBed.createComponent(FabMatchComponent);
    restored.detectChanges();
    expect(restored.componentInstance.match()?.players).toEqual(original.players);
    expect((JSON.parse(localStorage.getItem('fabMatch')!) as FabMatch).id).toBe(original.id);
  });

  it('creates a new match only when a new creation identifier is provided', () => {
    const previous = createTournament(4).match()!;
    const next = createTournament(4).match()!;
    expect(next.id).not.toBe(previous.id);
  });

  it('rejects malformed saved matches and invalid hero pools', () => {
    localStorage.setItem('fabMatch', JSON.stringify({ players: null }));
    const invalid = TestBed.createComponent(FabMatchComponent);
    invalid.detectChanges();
    expect(invalid.componentInstance.match()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/']);
    state = { createNewFabMatch: true, fabMatchConfig: {
      gameMode: 'tournament', playerNames: ['One', 'Two'], enabledHeroes: [],
    } };
    const noHeroes = TestBed.createComponent(FabMatchComponent);
    noHeroes.detectChanges();
    expect(noHeroes.componentInstance.match()).toBeNull();
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { TableTopMatch } from '../../data/tabletop-match';

import { TabletopMatchComponent } from './tabletop-match';

describe('TabletopMatch', () => {
  let component: TabletopMatchComponent;
  let fixture: ComponentFixture<TabletopMatchComponent>;
  const savedMatch: TableTopMatch = {
    id: 'match-1', name: 'Test match', oprDoctrines: true, round: 0, status: 'pending',
    createdAt: '2026-10-30T10:00:00Z', updatedAt: '2026-10-30T10:00:00Z',
    players: [0, 1].map(index => ({
      id: `player-${index}`, name: `Player ${index}`, faction: 'Test faction',
      initialCommandPoints: 2, currentCommandPoints: 2,
      initialVictoryPoints: 0, currentVictoryPoints: 0, isActive: false,
      createdAt: '2026-10-30T10:00:00Z', updatedAt: '2026-10-30T10:00:00Z',
    })),
  };

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('match', JSON.stringify(savedMatch));
    await TestBed.configureTestingModule({
      imports: [TabletopMatchComponent],
      providers: [provideRouter([])],
    })
    .compileComponents();

    fixture = TestBed.createComponent(TabletopMatchComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.match()?.status).toBe('ongoing');
  });

  afterEach(() => localStorage.clear());

  it('updates scores immutably, persists them, and refreshes timestamps', () => {
    const previous = component.match();
    component.changePlayerValue('commandPoints', 0, 1);
    expect(component.match()?.players[0].currentCommandPoints).toBe(3);
    expect(previous?.players[0].currentCommandPoints).toBe(2);
    expect(component.match()?.updatedAt).not.toEqual(savedMatch.updatedAt);
    expect(JSON.parse(localStorage.getItem('match')!).players[0].currentCommandPoints).toBe(3);
  });

  it('does not allow negative scores or invalid players', () => {
    component.changePlayerValue('victoryPoints', 0, -1);
    expect(component.match()?.players[0].currentVictoryPoints).toBe(0);
    const previous = component.match();
    component.changePlayerValue('commandPoints', 100, 1);
    component.changePlayerValue('commandPoints', 0, NaN);
    expect(component.match()).toBe(previous);
  });

  it('cycles rounds from zero through five', () => {
    for (let round = 1; round <= 5; round++) {
      component.changeRound();
      expect(component.match()?.round).toBe(round);
    }
    component.changeRound();
    expect(component.match()?.round).toBe(0);
  });

  it('resets scores and round to their initial values', () => {
    component.changePlayerValue('victoryPoints', 0, 10);
    component.changePlayerValue('commandPoints', 0, 3);
    component.changeRound();
    component.resetMatch();
    expect(component.match()?.round).toBe(0);
    expect(component.match()?.players[0].currentCommandPoints).toBe(2);
    expect(component.match()?.players[0].currentVictoryPoints).toBe(0);
  });

  it('updates doctrines without mutating the previous player', () => {
    const previous = component.match();
    component.changePlayerDoctrine(0, component.doctrinesList[0]);
    expect(previous?.players[0].currentDoctrine).toBeUndefined();
    expect(component.match()?.players[0].currentDoctrine).toBe(component.doctrinesList[0]);
  });

  it('redirects safely when the stored match has an invalid shape', () => {
    localStorage.setItem('match', JSON.stringify({ players: null }));
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const invalid = TestBed.createComponent(TabletopMatchComponent);
    expect(invalid.componentInstance.match()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/']);
    invalid.destroy();
  });

  it('prefers newer saved scores over stale route state for the same match', () => {
    const router = TestBed.inject(Router);
    const url = router.parseUrl('/tabletop-match');
    vi.spyOn(router, 'currentNavigation').mockReturnValue({
      id: 1, initialUrl: url, extractedUrl: url, trigger: 'imperative',
      extras: { state: { match: savedMatch } }, previousNavigation: null, abort: () => undefined,
    });
    component.changePlayerValue('commandPoints', 0, 3);
    component.changeRound();
    const restored = TestBed.createComponent(TabletopMatchComponent);
    expect(restored.componentInstance.match()?.players[0].currentCommandPoints).toBe(5);
    expect(restored.componentInstance.match()?.round).toBe(1);
    restored.destroy();
  });

  it('restores legacy numeric-string CP values as numbers', () => {
    localStorage.setItem('match', JSON.stringify({
      ...savedMatch,
      players: savedMatch.players.map(player => ({
        ...player, initialCommandPoints: '3', currentCommandPoints: '4',
      })),
    }));
    const restored = TestBed.createComponent(TabletopMatchComponent);
    expect(restored.componentInstance.match()?.players[0].initialCommandPoints).toBe(3);
    restored.componentInstance.changePlayerValue('commandPoints', 0, 1);
    expect(restored.componentInstance.match()?.players[0].currentCommandPoints).toBe(5);
    restored.destroy();
  });
});

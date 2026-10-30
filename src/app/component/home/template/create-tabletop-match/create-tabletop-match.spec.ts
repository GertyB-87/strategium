import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { CreateTabletopMatch } from './create-tabletop-match';

describe('CreateTabletopMatch', () => {
  let component: CreateTabletopMatch;
  let fixture: ComponentFixture<CreateTabletopMatch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateTabletopMatch],
      providers: [{ provide: MatDialogRef, useValue: { close: vi.fn() } }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateTabletopMatch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
    expect(component.matchForm.controls.players.length).toBe(2);
  });

  it('keeps at least two players', () => {
    component.removePlayer(0);
    expect(component.matchForm.controls.players.length).toBe(2);
    component.addPlayer();
    component.removePlayer(2);
    expect(component.matchForm.controls.players.length).toBe(2);
  });

  it('rejects whitespace names and negative or fractional command points', () => {
    const close = TestBed.inject(MatDialogRef).close;
    component.matchForm.controls.name.setValue('   ');
    component.onSubmit();
    expect(close).not.toHaveBeenCalled();
    component.matchForm.controls.name.setValue('Match');
    const points = component.matchForm.controls.players.at(0).controls.initialCommandPoints;
    points.setValue(-1);
    expect(component.matchForm.invalid).toBe(true);
    points.setValue(1.5);
    expect(component.matchForm.invalid).toBe(true);
  });

  it('submits trimmed names and numeric starting points', () => {
    component.matchForm.controls.name.setValue(' Match ');
    const player = component.matchForm.controls.players.at(0);
    player.controls.name.setValue(' Player ');
    player.controls.initialCommandPoints.setValue(3);
    component.onSubmit();
    expect(TestBed.inject(MatDialogRef).close).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Match', players: expect.arrayContaining([expect.objectContaining({
        name: 'Player', initialCommandPoints: 3, currentCommandPoints: 3,
      })]),
    }));
  });
});

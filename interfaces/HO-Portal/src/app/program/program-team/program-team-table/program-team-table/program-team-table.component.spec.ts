import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramTeamTableComponent } from './program-team-table.component';

describe('ProgramTeamTableComponent', () => {
  let component: ProgramTeamTableComponent;
  let fixture: ComponentFixture<ProgramTeamTableComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProgramTeamTableComponent]
    });
    fixture = TestBed.createComponent(ProgramTeamTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

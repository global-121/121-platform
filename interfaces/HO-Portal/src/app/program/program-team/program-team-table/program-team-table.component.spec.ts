import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramTeamTable } from './program-team-table.component';

describe('ProgramTeamTableComponent', () => {
  let component: ProgramTeamTable;
  let fixture: ComponentFixture<ProgramTeamTable>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProgramTeamTable],
    });
    fixture = TestBed.createComponent(ProgramTeamTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

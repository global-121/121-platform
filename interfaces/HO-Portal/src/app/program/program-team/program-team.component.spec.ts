import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramTeamPage } from './program-team.component';

describe('ProgramTeamComponent', () => {
  let component: ProgramTeamPage;
  let fixture: ComponentFixture<ProgramTeamPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramTeamPage],
    });
    fixture = TestBed.createComponent(ProgramTeamPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

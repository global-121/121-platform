import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramTeamPopupComponent } from './program-team-popup.component';

describe('ProgramTeamPopupComponent', () => {
  let component: ProgramTeamPopupComponent;
  let fixture: ComponentFixture<ProgramTeamPopupComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProgramTeamPopupComponent],
    });
    fixture = TestBed.createComponent(ProgramTeamPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

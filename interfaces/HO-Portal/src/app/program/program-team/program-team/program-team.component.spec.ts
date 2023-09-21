import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramTeamComponent } from './program-team.component';

describe('ProgramTeamComponent', () => {
  let component: ProgramTeamComponent;
  let fixture: ComponentFixture<ProgramTeamComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ProgramTeamComponent]
    });
    fixture = TestBed.createComponent(ProgramTeamComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

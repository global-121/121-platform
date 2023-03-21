import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationActivityOverviewComponent } from './registration-activity-overview.component';

describe('RegistrationActivityOverviewComponent', () => {
  let component: RegistrationActivityOverviewComponent;
  let fixture: ComponentFixture<RegistrationActivityOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegistrationActivityOverviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrationActivityOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationActivityDetailComponent } from './registration-activity-detail.component';

describe('RegistrationActivityDetailComponent', () => {
  let component: RegistrationActivityDetailComponent;
  let fixture: ComponentFixture<RegistrationActivityDetailComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RegistrationActivityDetailComponent],
    });
    fixture = TestBed.createComponent(RegistrationActivityDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

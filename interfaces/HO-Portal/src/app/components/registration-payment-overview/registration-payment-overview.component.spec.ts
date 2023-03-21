import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationPaymentOverviewComponent } from './registration-payment-overview.component';

describe('RegistrationPaymentOverviewComponent', () => {
  let component: RegistrationPaymentOverviewComponent;
  let fixture: ComponentFixture<RegistrationPaymentOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegistrationPaymentOverviewComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegistrationPaymentOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

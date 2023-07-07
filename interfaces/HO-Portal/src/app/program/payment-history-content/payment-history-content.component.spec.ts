import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentHistoryContentComponent } from './payment-history-content.component';

describe('PaymentHistoryContentComponent', () => {
  let component: PaymentHistoryContentComponent;
  let fixture: ComponentFixture<PaymentHistoryContentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentHistoryContentComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentHistoryContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

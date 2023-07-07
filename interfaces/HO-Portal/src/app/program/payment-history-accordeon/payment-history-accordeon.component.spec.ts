import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentHistoryAccordeonComponent } from './payment-history-accordeon.component';

describe('PaymentHistoryaccordeonComponent', () => {
  let component: PaymentHistoryAccordeonComponent;
  let fixture: ComponentFixture<PaymentHistoryAccordeonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentHistoryAccordeonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentHistoryAccordeonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

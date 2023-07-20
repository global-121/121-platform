import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentHistoryAccordionComponent } from './payment-history-accordion.component';

describe('PaymentHistoryaccordionComponent', () => {
  let component: PaymentHistoryAccordionComponent;
  let fixture: ComponentFixture<PaymentHistoryAccordionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PaymentHistoryAccordionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentHistoryAccordionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

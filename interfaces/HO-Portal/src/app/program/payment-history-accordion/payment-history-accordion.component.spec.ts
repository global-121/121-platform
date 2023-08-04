import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { PaymentHistoryAccordionComponent } from './payment-history-accordion.component';

describe('PaymentHistoryAccordionComponent', () => {
  let component: PaymentHistoryAccordionComponent;
  let fixture: ComponentFixture<PaymentHistoryAccordionComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        PaymentHistoryAccordionComponent,
        HttpClientTestingModule,
      ],
    });

    fixture = TestBed.createComponent(PaymentHistoryAccordionComponent);
    component = fixture.componentInstance;
    component.paymentRow = {
      amount: 22,
      customData: {},
      errorMessage: null,
      fsp: 'Intersolve-jumbo-physical',
      fspName: 'Jumbo card',
      payment: 1,
      paymentDate: '2023-08-04T08:51:53.726Z',
      referenceId: '12312sfdasf',
      status: 'success',
    };
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});

import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { PaymentHistoryAccordionComponent } from '../payment-history-accordion/payment-history-accordion.component';
import { PaymentHistoryPopupComponent } from './payment-history-popup.component';

describe('PaymentHistoryPopupComponent', () => {
  let component: PaymentHistoryPopupComponent;
  let fixture: ComponentFixture<PaymentHistoryPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        IonicModule,
        CommonModule,
        TranslateModule,
        PaymentHistoryAccordionComponent,
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentHistoryPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

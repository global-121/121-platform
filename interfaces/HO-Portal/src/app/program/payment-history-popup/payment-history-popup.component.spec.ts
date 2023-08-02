import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import {
  TranslateModule,
  TranslateService,
  TranslateStore,
} from '@ngx-translate/core';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ErrorHandlerService } from 'src/app/services/error-handler.service';
import { PastPaymentsService } from 'src/app/services/past-payments.service';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PaymentHistoryAccordionComponent } from '../payment-history-accordion/payment-history-accordion.component';
import { PaymentHistoryPopupComponent } from './payment-history-popup.component';

describe('PaymentHistoryPopupComponent', () => {
  let component: PaymentHistoryPopupComponent;
  let fixture: ComponentFixture<PaymentHistoryPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PaymentHistoryPopupComponent,
        IonicModule,
        CommonModule,
        TranslateModule.forRoot(),
        PaymentHistoryAccordionComponent,
        HttpClientTestingModule,
      ],
      // schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        ModalController,
        ProgramsServiceApiService,
        TranslateService,
        PastPaymentsService,
        TranslateStore,
        provideMagicalMock(ErrorHandlerService),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentHistoryPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

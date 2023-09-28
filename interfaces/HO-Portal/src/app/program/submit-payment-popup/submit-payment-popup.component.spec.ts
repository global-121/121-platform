import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { MakePaymentComponent } from 'src/app/program/make-payment/make-payment.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { SubmitPaymentPopupComponent } from './submit-payment-popup.component';

describe('SubmitPaymentPopupComponent', () => {
  let component: SubmitPaymentPopupComponent;
  let fixture: ComponentFixture<SubmitPaymentPopupComponent>;

  beforeEach(waitForAsync(() => {
    const modalSpy = jasmine.createSpyObj('Modal', ['present']);
    const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
    modalCtrlSpy.create.and.callFake(() => modalSpy);

    TestBed.configureTestingModule({
      declarations: [SubmitPaymentPopupComponent, MakePaymentComponent],
      imports: [
        IonicModule,
        TranslateModule.forRoot(),
        SharedModule,
        HttpClientTestingModule,
      ],
      providers: [
        {
          provide: ModalController,
          useValue: modalCtrlSpy,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubmitPaymentPopupComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

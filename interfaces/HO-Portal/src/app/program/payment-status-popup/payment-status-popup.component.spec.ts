import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PaymentStatusPopupComponent } from './payment-status-popup.component';

const modalSpy = jasmine.createSpyObj('Modal', ['present']);
const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
modalCtrlSpy.create.and.callFake(() => {
  return modalSpy;
});

describe('PaymentStatusPopupComponent', () => {
  let component: PaymentStatusPopupComponent;
  let fixture: ComponentFixture<PaymentStatusPopupComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [PaymentStatusPopupComponent],
        imports: [TranslateModule.forRoot(), HttpClientTestingModule],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
        providers: [
          {
            provide: ModalController,
            useValue: modalCtrlSpy,
          },
          provideMagicalMock(ProgramsServiceApiService),
          {
            provide: ModalController,
            useValue: modalCtrlSpy,
          },
        ],
      }).compileComponents();
    }),
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentStatusPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

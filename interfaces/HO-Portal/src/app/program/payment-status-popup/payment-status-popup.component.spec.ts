import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { provideMagicalMock } from 'src/app/mocks/helpers';
import { ProgramsServiceApiService } from 'src/app/services/programs-service-api.service';
import { PaymentStatusPopupComponent } from './payment-status-popup.component';

describe('PaymentStatusPopupComponent', () => {
  let component: PaymentStatusPopupComponent;
  let fixture: ComponentFixture<PaymentStatusPopupComponent>;

  beforeEach(waitForAsync(() => {
    const modalSpy = jasmine.createSpyObj('Modal', ['present']);
    const modalCtrlSpy = jasmine.createSpyObj('ModalController', ['create']);
    modalCtrlSpy.create.and.callFake(() => modalSpy);

    TestBed.configureTestingModule({
      declarations: [PaymentStatusPopupComponent],
      imports: [
        IonicModule,
        TranslateModule.forRoot(),
        HttpClientTestingModule,
      ],
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
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentStatusPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

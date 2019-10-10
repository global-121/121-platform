import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { Storage } from '@ionic/storage';
import { MockIonicStorage } from 'src/app/mocks/ionic.storage.mock';
import { StorageService } from 'src/app/services/storage.service';

import { SelectAppointmentComponent } from './select-appointment.component';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeModule } from 'angularx-qrcode';

describe('SelectAppointmentComponent', () => {
  let component: SelectAppointmentComponent;
  let fixture: ComponentFixture<SelectAppointmentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SelectAppointmentComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        QRCodeModule
      ],
      providers: [
        {
          provide: Storage,
          useValue: MockIonicStorage,
        },
        StorageService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectAppointmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

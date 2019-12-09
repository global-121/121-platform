import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { QRScanner } from '@ionic-native/qr-scanner/ngx';
import { Storage } from '@ionic/storage';

import { ScanQrPage } from './scan-qr.page';

describe('ScanQrPage', () => {
  let component: ScanQrPage;
  let fixture: ComponentFixture<ScanQrPage>;

  const storageIonicMock: any = {
    get: () => new Promise<any>((resolve) => resolve('1')),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ScanQrPage],
      imports: [
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([]),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: QRScanner,
          useValue: jasmine.createSpy(),
        },
        {
          provide: Storage,
          useValue: storageIonicMock,
        },
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ScanQrPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

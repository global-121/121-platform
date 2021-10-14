import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularDelegate, ModalController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { QrScannerComponent } from './qr-scanner.component';

describe('QrScannerComponent', () => {
  let component: QrScannerComponent;
  let fixture: ComponentFixture<QrScannerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [QrScannerComponent],
      imports: [TranslateModule.forRoot()],
      providers: [
        {
          provide: ModalController,
        },
        {
          provide: AngularDelegate,
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QrScannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

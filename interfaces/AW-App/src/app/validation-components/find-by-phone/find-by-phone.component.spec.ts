import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { AngularDelegate, ModalController } from '@ionic/angular';
import { Storage } from '@ionic/storage';
import { TranslateModule } from '@ngx-translate/core';
import { FindByPhoneComponent } from './find-by-phone.component';

const storageIonicMock: any = {
  get: () => new Promise<any>((resolve) => resolve('1')),
};

const modalControllerMock = {
  create: () => new Promise<any>((resolve) => resolve(modalControllerMock)),
  present: () => new Promise<any>((resolve) => resolve(modalControllerMock)),
  onWillDismiss: () =>
    new Promise<any>((resolve) => resolve(modalControllerMock)),
};

describe('FindByPhoneComponent', () => {
  let component: FindByPhoneComponent;
  let fixture: ComponentFixture<FindByPhoneComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FindByPhoneComponent],
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        {
          provide: Storage,
          useValue: storageIonicMock,
        },
        {
          provide: ModalController,
          useValue: modalControllerMock,
        },
        {
          provide: AngularDelegate,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FindByPhoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

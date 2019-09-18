import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { Storage } from '@ionic/storage';

import { StoreCredentialComponent } from './store-credential.component';

describe('StoreCredentialComponent', () => {
  let component: StoreCredentialComponent;
  let fixture: ComponentFixture<StoreCredentialComponent>;

  const storageIonicMock: any = {
    get: () => new Promise<any>((resolve, reject) => resolve('1')),
  };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [StoreCredentialComponent],
      imports: [
        TranslateModule.forRoot(),
        RouterModule.forRoot([]),
        HttpClientModule,
      ],
      providers: [
        {
          provide: Storage,
          useValue: storageIonicMock
        }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StoreCredentialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslateModule } from '@ngx-translate/core';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { Storage } from '@ionic/storage';
import { MockIonicStorage } from 'src/app/mocks/ionic.storage.mock';

import { StoreCredentialComponent } from './store-credential.component';

describe('StoreCredentialComponent', () => {
  let component: StoreCredentialComponent;
  let fixture: ComponentFixture<StoreCredentialComponent>;

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
          useValue: MockIonicStorage,
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
